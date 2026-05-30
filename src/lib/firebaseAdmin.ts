process.env.GRPC_DNS_RESOLVER = 'native';
process.env.GRPC_ENABLE_FORK_SUPPORT = '0';

import admin from 'firebase-admin';

function getServiceAccount(key: string): any {
  let trimmed = key.trim();
  
  // Strip outer single/double quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.substring(1, trimmed.length - 1).trim();
  }
  
  // Helper to locate the JSON substring between first '{' and last '}' and parse it
  const parseJsonGracefully = (str: string): any => {
    let clean = str.trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.substring(1, clean.length - 1).trim();
    }
    
    // First try standard parse
    try {
      return JSON.parse(clean);
    } catch (directError) {
      // Find the first and last curly braces in case of extra leading/trailing characters
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const extracted = clean.substring(firstBrace, lastBrace + 1);
          return JSON.parse(extracted);
        } catch (_) {
          throw directError; // Re-throw the original JSON parsing error if fallback fails
        }
      }
      throw directError;
    }
  };

  // Try direct parsing as JSON (in case it is raw JSON)
  try {
    return parseJsonGracefully(trimmed);
  } catch (jsonError) {
    // If that fails, assume it is Base64 encoded
    try {
      // Check if it's potentially base64 (no spaces, alphanumeric + / + = + +)
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(trimmed.replace(/[\n\r\s]/g, ''));
      if (isBase64 || trimmed.length > 100) {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
        return parseJsonGracefully(decoded);
      }
      return null;
    } catch (base64Error) {
      console.error('Failed to parse FIREBASE_ADMIN_KEY as Base64');
      return null;
    }
  }
}

if (!admin.apps.length) {
  
  const adminKey = process.env.FIREBASE_ADMIN_KEY;
  const isPlaceholder = !adminKey || adminKey === 'your_base64_firebase_admin_key' || adminKey.startsWith('your_');
  
  if (adminKey && !isPlaceholder) {
    try {
      const serviceAccount = getServiceAccount(adminKey);
      if (serviceAccount && serviceAccount.project_id) {
        console.log('Firebase Admin: Found service account for project:', serviceAccount.project_id);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        const firestore = admin.firestore();
        firestore.settings({ 
          ignoreUndefinedProperties: true
        });

        console.log('Firebase Admin initialized successfully');
      } else {
        const foundKeys = serviceAccount ? Object.keys(serviceAccount) : [];
        console.warn('Firebase Admin skipped: No valid Service Account found. (Length: ' + (adminKey?.length || 0) + ', Keys found: ' + foundKeys.join(', ') + ')');
      }
    } catch (e: any) {
      console.error('Failed to initialize Firebase Admin:', e.message);
    }
  } else {
    console.warn('FIREBASE_ADMIN_KEY is placeholder or not found, admin operations will fail');
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
