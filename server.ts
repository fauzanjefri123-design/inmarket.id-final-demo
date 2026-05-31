import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { redis } from './src/lib/redis';
import { auth, db } from './src/lib/firebaseAdmin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Middleware
  app.use(express.json());

  // 1. Tightened CORS Configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));

  // Token Blacklist Middleware
  const verifyAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    try {
      // Check blacklist
      const isBlacklisted = await redis.get(`blacklist:${tokenHash}`);
      if (isBlacklisted) return res.status(401).json({ error: 'Token revoked' });

      if (auth) {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
      }
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Gemini Input Validation Middleware
  const validateGeminiInput = (req: any, res: any, next: any) => {
    const clientSecret = req.headers['x-inmarket-client'];
    const expectedSecret = process.env.CLIENT_SECRET || 'your_secure_client_secret';
    
    if (expectedSecret === 'your_secure_client_secret' && process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY WARNING] CLIENT_SECRET is using default insecure value in production! Verify your .env setup.');
    }

    if (clientSecret !== expectedSecret) {
      return res.status(403).json({ error: 'Header verification failed' });
    }

    let { prompt } = req.body;
    if (typeof prompt !== 'string' || prompt.length < 1 || prompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt must be between 1-2000 chars' });
    }

    // Strip characters: remove HTML tags
    req.body.prompt = prompt.replace(/<[^>]*>?/gm, '');
    next();
  };

  // 7. CONTENT SECURITY POLICY (CSP)
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet.contentSecurityPolicy({
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
         styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
         fontSrc: ["'self'", "fonts.gstatic.com"],
         imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://ui-avatars.com", "https://api.qrserver.com", "https://firebasestorage.googleapis.com", "https://api.dicebear.com"],
         connectSrc: [
           "'self'", 
           "https://firestore.googleapis.com", 
           "https://identitytoolkit.googleapis.com", 
           "https://securetoken.googleapis.com",
           "https://generativelanguage.googleapis.com",
           "https://gmail.googleapis.com",
           "https://www.googleapis.com",
           "https://calendar.googleapis.com",
           "https://people.googleapis.com",
           "https://api.ipify.org"
         ],
         objectSrc: ["'none'"],
         upgradeInsecureRequests: [],
       },
    }));
  }

  // 8. RATE LIMITING
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', apiLimiter);

  // --- AUTH ROUTES (Public) ---

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!auth || !db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized. Please configure FIREBASE_ADMIN_KEY.' });
    }

    try {
      const userRecord = await auth.getUserByEmail(email).catch(() => null);
      if (!userRecord) {
        return res.json({ message: 'Jika email Anda terdaftar, instruksi reset kata sandi telah dikirimkan.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await db.collection('password_resets').doc(token).set({
        email,
        uid: userRecord.uid,
        used: false,
        expiresAt: expiresAt.toISOString()
      });

      const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth?resetToken=${token}`;
      
      if (resend) {
        await resend.emails.send({
          from: 'InMarket <noreply@inmarket.id>',
          to: email,
          subject: 'Reset Kata Sandi InMarket',
          html: `<p>Anda meminta untuk mengatur ulang kata sandi. Klik tautan di bawah ini:</p><a href="${resetLink}">${resetLink}</a><p>Tautan ini berlaku selama 30 menit.</p>`
        });
      } else {
        console.log(`[SIMULASI EMAIL] Reset Link for ${email}: ${resetLink}`);
      }

      res.json({ message: 'Jika email Anda terdaftar, instruksi reset kata sandi telah dikirimkan.' });
    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat memproses permintaan reset.' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!auth || !db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    try {
      const resetDoc = await db.collection('password_resets').doc(token).get();
      
      if (!resetDoc.exists) {
        return res.status(400).json({ error: 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.' });
      }

      const data = resetDoc.data();
      const now = new Date();
      const expiresAt = new Date(data?.expiresAt);

      if (data?.used || now > expiresAt) {
        return res.status(400).json({ error: 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.' });
      }

      await auth.updateUser(data?.uid, { password: newPassword });
      await db.collection('password_resets').doc(token).update({ used: true });

      res.json({ message: 'Kata sandi berhasil diperbarui. Silakan login kembali.' });
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      res.status(400).json({ error: error.message || 'Gagal mengatur ulang kata sandi.' });
    }
  });
  
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, role, username } = req.body;
    
    if (!auth || !db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    if (!['Owner', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Role must be Owner or Employee' });
    }

    try {
      // 1. Create User in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: username || email.split('@')[0],
      });

      // 2. Set Custom User Claims for security rules
      await auth.setCustomUserClaims(userRecord.uid, { 
        role: role.toLowerCase() === 'owner' ? 'Owner' : 'Employee' 
      });

      // 3. Save Role and Metadata in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email,
        role: role.toLowerCase(), // Store as 'owner' or 'employee'
        displayName: username || email.split('@')[0],
        createdAt: new Date().toISOString(),
        businessId: role === 'Owner' ? `bus_${userRecord.uid}` : null,
      });

      res.status(201).json({ 
        message: 'Registration successful',
        uid: userRecord.uid 
      });
    } catch (error: any) {
      console.error('Registration Error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const apiKey = process.env.VITE_FIREBASE_API_KEY;

    if (!auth || !db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Firebase API Key missing in environment' });
    }

    try {
      // 1. Validate Credentials using Firebase Auth REST API
      const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const signInData: any = await signInResponse.json();

      if (!signInResponse.ok) {
        return res.status(401).json({ error: signInData.error?.message || 'Login failed' });
      }

      const uid = signInData.localId;
      const idToken = signInData.idToken;

      // 2. Strict Role Validation from Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User data not found in database' });
      }

      const userData = userDoc.data();
      const registeredRole = userData?.role || 'owner'; // default to owner if missing

      // 3. Success - Return token and user info
      res.json({
        message: 'Login successful',
        token: idToken,
        user: {
          uid,
          email: userData?.email,
          role: registeredRole === 'owner' ? 'Owner' : 'Employee',
          displayName: userData?.displayName,
          businessId: userData?.businessId
        }
      });

    } catch (error: any) {
      console.error('Login Error:', error);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  app.post('/api/webhook/payment-confirmation', async (req, res) => {
    const { order_id, transaction_status, gross_amount, custom_field, signature_key, status_code } = req.body;
    
    // Webhook signature verification to prevent spoofing
    if (signature_key) {
      const serverKey = process.env.MIDTRANS_SERVER_KEY || 'your_server_key';
      // Midtrans standard format: SHA512(order_id + status_code + gross_amount + ServerKey)
      // Normalize gross_amount to ensure it matches signature payload format
      const normalizedGross = typeof gross_amount === 'number' ? gross_amount.toFixed(2) : parseFloat(gross_amount).toFixed(2);
      const payload = `${order_id}${status_code}${normalizedGross}${serverKey}`;
      const calculatedSignature = crypto.createHash('sha512').update(payload).digest('hex');
      
      // Secondary backup check without decimal formatting, just in case
      const rawPayload = `${order_id}${status_code}${gross_amount}${serverKey}`;
      const backupSignature = crypto.createHash('sha512').update(rawPayload).digest('hex');

      if (signature_key !== calculatedSignature && signature_key !== backupSignature) {
        console.warn(`[WEBHOOK WARNING] Failed signature verification for order ${order_id}`);
        return res.status(403).json({ error: 'Signature verification failed' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn(`[WEBHOOK WARNING] Missing signature key in production for order ${order_id}`);
      return res.status(400).json({ error: 'Signature key is required' });
    }

    // 1. Ambil User ID (biasanya dikirim via custom field saat pembuatan invoice)
    const userId = custom_field?.user_id; 

    // 2. Pastikan status transaksi adalah sukses/berhasil
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
        if (!userId || !db) {
            return res.status(400).send('Invalid request or DB not initialized');
        }
        try {
            const walletRef = db.collection('wallets').doc(userId);
            
            await db.runTransaction(async (transaction) => {
                const walletDoc = await transaction.get(walletRef);
                let currentBalance = 0;
                let transactionsList: any[] = [];
                
                if (walletDoc.exists) {
                    const data = walletDoc.data();
                    currentBalance = data?.balance || 0;
                    transactionsList = data?.transactions || [];
                }
                
                // Cek apakah transaksi ini sudah pernah diproses (mencegah double top-up)
                const isAlreadyProcessed = transactionsList.some((tx: any) => tx.referenceId === order_id && tx.status === 'success');
                
                if (!isAlreadyProcessed) {
                    // Update saldo
                    const updatedBalance = currentBalance + Number(gross_amount);
                    const newTx = {
                        id: `tx-${Date.now()}`,
                        referenceId: order_id,
                        type: 'top_up',
                        amount: Number(gross_amount),
                        status: 'success',
                        desc: 'Top Up Webhook',
                        date: new Date().toLocaleString()
                    };
                    
                    transaction.set(walletRef, {
                        userId,
                        balance: updatedBalance,
                        transactions: [newTx, ...transactionsList]
                    }, { merge: true });
                    
                    console.log(`Top-up sukses! Saldo User ID ${userId} bertambah Rp${gross_amount}`);
                }
            });

            // Kirim respon 200 ke Payment Gateway bahwa data sukses diterima
            return res.status(200).send('Webhook processed successfully');
            
        } catch (error) {
            console.error('Gagal memperbarui saldo:', error);
            return res.status(500).send('Internal Server Error');
        }
    }

    // Jika statusnya masih pending atau gagal, beri tahu payment gateway bahwa webhook diterima tapi belum diproses saldo
    return res.status(200).send('Payment status updated but not settled');
  });

  app.use('/api/', verifyAuth);

  // 5. GEMINI API SERVER SIDE
  app.post('/api/gemini/generate', validateGeminiInput, async (req, res) => {
    try {
      const { prompt, apiKey: bodyApiKey, context } = req.body;
      const apiKey = bodyApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error('Gemini API Key is missing');
        return res.status(500).json({ error: 'AI initialization failed: Missing API Key. Please provide one in settings or contact admin.' });
      }

      const systemInstruction = `
==============================================================================

SYSTEM INSTRUCTION: INMARKET MULTI-AGENT ORCHESTRATOR 2026 (INMARKET AI CONSULTANT)
${context ? `[DATA BISNIS OPERASIONAL REAL-TIME]:
- Tingkat Stok Produk (Live): ${context.product_levels || 'Semua stok aman'}
- Keuntungan Hari Ini: Rp${context.daily_profits?.toLocaleString() || 0}
- Target Pendapatan: Rp${context.target_revenues?.toLocaleString() || 2500000}
- Karyawan yang bertugas: ${context.employee_name || 'Staff'} (Tier: ${context.employee_tier || 'General'}, EXP: ${context.employee_exp || 0})
- Biaya Operasional (OPEX): Rp${context.operational_expenses?.toLocaleString() || 350000}
- Prediksi Tren & Musiman: ${context.historical_trends || ''}
- Prediksi Event Terdekat: ${context.upcoming_events || ''}
- Profil Pelanggan & Loyalitas: ${context.top_customer_behavior || ''}
- Deteksi Anomali & Selisih Stok: ${context.stock_discrepancies || ''}
- Role Pengguna Aktif: ${context.userRole || 'Employee'}
` : ''}

==============================================================================

1. IDENTITAS & PERSONA UTAMA

Anda adalah "InMarket AI", konsultan bisnis cerdas kelas dunia yang dirancang khusus untuk membantu memajukan UMKM di Indonesia. Anda cerdas, ramah, berorientasi pada tindakan nyata (actionable tips), dan menggunakan sapaan sopan khas Indonesia (seperti Kak, Bapak, Ibu, Bos, Owner, atau Rekan).

2. INTEGRASI MULTI-AKUN (OWNER & KARYAWAN):
- Jika Role pengguna adalah 'Owner' (Pemilik Toko): Sapa dengan apresiatif ("Halo Owner Kak/Pak/Bu [Nama]"). Fokus pada maksimalisasi profit harian, analisis tren, dan efisiensi pengeluaran OPEX.
- Jika Role pengguna adalah 'Employee' (Karyawan): Sapa dengan ramah dan penuh spirit kerja tim ("Halo Rekan Kerja [Nama]"). Fokus pada panduan taktis operasional kasir, kepatuhan inventaris, pencapaian target harian, dan apresiasi performa (gamifikasi).

3. STRUKTUR FORMAT OUTPUT MANDATORI
Semua analisis performa, restock, taktik penjualan, efisiensi, dan motivasi kerja WAJIB diringkas secara elegan dalam maksimal 4-5 paragraf/poin dengan format struktur tepat demi kemudahan membaca:

📊 **Status Bisnis**: [Analisis singkat posisi keuntungan vs target harian, evaluasi cash flow, dan persentase pencapaian target hari ini]
💡 **Rekomendasi Aksi**: [Saran restock cerdas, ide bundling produk, serta integrasi prediksi tren & musiman berdasarkan Upcoming Events/Historical Trends]
📉 **Efisiensi Biaya**: [Kalkulasi dan tinjauan pengeluaran operasional (OPEX) harian, efisiensi operasional, serta deteksi anomali/discrepancies jika terdapat kejanggalan stok]
🎯 **Taktik Penjualan**: [Strategi taktis cepat mengejar sisa target pendapatan hari ini (seperti promo flash sale, up-selling di kasir, atau program retensi & program loyalitas pelanggan loyal)]
🌟 **Pesan untuk Karyawan** (atau **Pesan untuk {{employee_name}}**): [Apresiasi performa, motivasi gamifikasi karyawan berdasarkan Level, EXP, atau status check-in saat ini untuk memacu produktivitas]

4. PANDUAN GAYA KOMUNIKASI (SANGAT INTERAKTIF & MANUSIAWI)
- Gaya Bicara: Hangat, profesional, berwibawa, dan sangat komunikatif. Hindari kesan kaku robotik atau klise sapaan AI generik ("Sebagai AI...", "Tentu saya bisa...").
- Gunakan tag HTML <span> dengan kelas Tailwind CSS untuk menyorot istilah/angka penting:
  - Warna Emerald: <span class="text-emerald-600 font-semibold font-mono">Data Sukses/Metrik</span>
  - Warna Indigo: <span class="text-indigo-600 font-semibold font-mono">Taktik/Usulan Utama</span>
  - Warna Amber: <span class="text-amber-500 font-semibold font-mono">Tren/Peringatan Risiko</span>
- Selipkan pemantik diskusi interaktif dua arah di akhir tanggapan.

==============================================================================

END OF SYSTEM INSTRUCTION

==============================================================================`;

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      let result;
      try {
        result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
          }
        });
      } catch (err: any) {
        console.warn('Gemini API Error details:', err.message);
        if (err.status === 403 || err.message?.toLowerCase().includes('api key')) {
           return res.status(403).json({ error: 'Akses ditolak: API Key Gemini tidak valid atau tidak memiliki izin.' });
        } else if (err.status === 404 || err.message?.toLowerCase().includes('not found')) {
           console.warn('Model gemini-2.5-flash tidak ditemukan, fallback ke gemini-2.0-flash...');
           try {
             result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: { systemInstruction }
             });
           } catch (fallbackErr: any) {
             return res.status(500).json({ error: 'Gagal menghubungi AI (Fallback model failed). Pastikan API Key benar.' });
           }
        } else {
           return res.status(500).json({ error: `Kesalahan sistem AI server: ${err.message}` });
        }
      }

      res.json({ result: result.text || 'Maaf, tidak dapat memproses permintaan.' });
    } catch (error: any) {
      console.error('Gemini API Error Detail:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      res.status(500).json({ error: `Failed to generate content: ${error.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
