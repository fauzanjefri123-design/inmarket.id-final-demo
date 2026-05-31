import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Package, Plus, Trash2, Edit2, Search, Filter, AlertCircle, ShoppingCart, 
  History, Upload, X, Sparkles, Maximize2, Scan, Tag, ChevronLeft, 
  ChevronRight, Image as ImageIcon, Video, Loader2, Check, Info, Printer, 
  Sliders, Flame, Barcode, Warehouse, Palette, FileText, Zap, RefreshCw, Download,
  BarChart3, ChevronDown, ChevronUp, PieChart as LucidePieChart
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend as RechartsLegend 
} from 'recharts';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../lib/translations';
import { getPartitionedKey, safeJsonParse } from '../lib/utils';
import SalesHistory from './SalesHistory';
import Papa from 'papaparse';
import QRCode from 'qrcode'; // Add this
import { motion, AnimatePresence } from 'motion/react';
import { playScanSound, playSuccessSound, playClickSound } from '../lib/sounds';
import { z } from 'zod';
import DOMPurify from 'dompurify';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  capitalPrice: z.number().min(0, 'Capital price must be greater than or equal to 0').optional().default(0),
  stock: z.number().min(0, 'Stock must be greater than or equal to 0'),
  category: z.string(),
  discount: z.number().min(0).max(100),
  description: z.string().optional(),
  barcode: z.string().optional(),
  supplier: z.string().optional()
});

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [view, setView] = useState<'inventory' | 'sales'>('inventory');
  
  // Custom states for rich input fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [capitalPrice, setCapitalPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [discount, setDiscount] = useState('0');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [variantsText, setVariantsText] = useState('');
  
  // Multi image uploads & media states
  const [photoFront, setPhotoFront] = useState<string>('');
  const [photoSide, setPhotoSide] = useState<string>('');
  const [photoDetail, setPhotoDetail] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // AI enhancement states
  const [isEnhancing, setIsEnhancing] = useState<Record<string, boolean>>({});
  const [enhancedMetrics, setEnhancedMetrics] = useState<Record<string, boolean>>({});
  const [enhancementLog, setEnhancementLog] = useState<string>('');
  
  // Modals & UI Controls 
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'media' | 'extra'>('basic');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'buy' | 'sell' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  
  // Stock audit logs modal states
  const [selectedProductForLog, setSelectedProductForLog] = useState<any | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Print Multiple Labels state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printQuantity, setPrintQuantity] = useState('5');
  const [selectedProductForPrint, setSelectedProductForPrint] = useState<any | null>(null);
  
  // Image Viewer Modal Carousel
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerZoomed, setIsViewerZoomed] = useState(false);
  
  // General alerts/errors states
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Analytics charts UI states
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [activeChartMetric, setActiveChartMetric] = useState<'count' | 'stock' | 'value'>('count');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { language, theme } = useThemeLanguage();
  const t = (key: keyof typeof translations.id) => translations[language]?.[key] || key;

  // Categories list 
  const categories = ["Makanan", "Minuman", "Pakaian", "Elektronik", "Alat Tulis", "Aksesoris", "Lainnya"];

  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [firebaseUser]);

  useEffect(() => {
    const handleVoiceAdd = (e: any) => {
      setView('inventory');
      setName(e.detail.name || '');
      if (e.detail.price) setPrice(e.detail.price.toString());
      if (e.detail.stock) setStock(e.detail.stock.toString());
      if (e.detail.category) setCategory(e.detail.category);
      setEditingProduct(null);
      setIsAddingProduct(true);
      setActiveFormTab('basic');
    };
    
    const handleVoiceSearchTx = (e: any) => {
      setView('sales');
      // The search value itself will be passed to SalesHistory component which does its own listening,
      // but we need to switch view to 'sales' first here.
    };

    window.addEventListener('voice-add-product', handleVoiceAdd);
    window.addEventListener('voice-search-transaction', handleVoiceSearchTx);
    return () => {
      window.removeEventListener('voice-add-product', handleVoiceAdd);
      window.removeEventListener('voice-search-transaction', handleVoiceSearchTx);
    };
  }, []);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let fetched: any[] = [];
      if (auth.currentUser) {
        const q = query(collection(db, 'products'), where('ownerId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // Load and merge local storage products for robust sandbox resilience
      const productsKey = getPartitionedKey('inmarket_products', true);
      const localProductsStr = localStorage.getItem(productsKey);
      const localProducts = safeJsonParse(localProductsStr, []);

      // Merge and ensure no duplicates
      let merged = [...fetched];
      localProducts.forEach((lp: any) => {
        if (!merged.some(p => p.id === lp.id || p.name.toLowerCase() === lp.name.toLowerCase())) {
          merged.push(lp);
        }
      });

      setProducts(merged);
    } catch (firebaseErr) {
      console.warn("Firebase fetching failed, fallback to local storage products:", firebaseErr);
      const productsKey = getPartitionedKey('inmarket_products', true);
      const localProductsStr = localStorage.getItem(productsKey) || '[]';
      const merged = safeJsonParse(localProductsStr, []);
      setProducts(merged);
    } finally {
      setIsLoading(false);
    }
  };

  // Holographic automatic laser barcode generator
  const generateLaserBarcode = () => {
    playScanSound();
    const rand = "899" + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(rand);
    showNotification('success', t('barcodeGenerated'));
  };

  const downloadQRCode = async (barcode: string, productName: string) => {
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, barcode || '000000', { width: 400 });
      const pngUrl = canvas.toDataURL('image/png');
      
      // Trigger download
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `QR_${productName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      playSuccessSound();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal membuat QR Code.');
    }
  };

  const printThermalLabel = async (p: any) => {
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, p.barcode || p.id || '000000', { 
        width: 150, 
        margin: 1 
      });
      const qrDataUrl = canvas.toDataURL('image/png');

      const printIframe = document.createElement('iframe');
      printIframe.id = 'thermal-label-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const printDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (printDoc) {
        const hasDiscount = (Number(p.discount) || 0) > 0;
        const finalPrice = hasDiscount 
          ? p.price - (p.price * (Number(p.discount) || 0) / 100) 
          : p.price;

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Label - ${p.name}</title>
            <style>
              @page {
                size: 40mm 25mm;
                margin: 0;
              }
              * {
                box-sizing: border-box;
              }
              body {
                width: 40mm;
                height: 25mm;
                margin: 0;
                padding: 1.5mm 2mm;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #000;
                background-color: #fff;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .title {
                font-size: 8px;
                font-weight: bold;
                text-align: center;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 0.5mm;
              }
              .content-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex: 1;
                min-height: 0;
              }
              .qr-box {
                width: 14mm;
                height: 14mm;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-box img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
              }
              .details {
                flex: 1;
                padding-left: 1.5mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
              }
              .price {
                font-size: 9px;
                font-weight: 800;
                color: #000;
                margin-bottom: 0.3mm;
              }
              .original-price {
                font-size: 7px;
                text-decoration: line-through;
                color: #666;
                margin-bottom: 0.3mm;
              }
              .barcode-text {
                font-family: 'Courier New', Courier, monospace;
                font-size: 6px;
                font-weight: bold;
                letter-spacing: 0.3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #444;
              }
              .sku {
                font-size: 5px;
                color: #777;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            </style>
          </head>
          <body>
            <div class="title">${p.name.toUpperCase()}</div>
            
            <div class="content-row">
              <div class="qr-box">
                <img src="${qrDataUrl}" alt="QR" />
              </div>
              <div class="details">
                ${hasDiscount ? `<div class="original-price">Rp ${p.price.toLocaleString()}</div>` : ''}
                <div class="price">Rp ${finalPrice.toLocaleString()}</div>
                <div class="barcode-text">Code: ${p.barcode || 'N/A'}</div>
                <div class="sku">InMarket POS 2026</div>
              </div>
            </div>
          </body>
          </html>
        `;
        printDoc.write(htmlContent);
        printDoc.close();

        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(printIframe);
          }, 1500);
        }, 500);
      }
      playSuccessSound();
      showNotification('success', language === 'id' ? 'Dialog cetak label dibuka.' : 'Print label dialog opened.');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal memproses cetak label.');
    }
  };

  const printMultipleThermalLabels = async (p: any, qty: number) => {
    try {
      if (qty <= 0) return;
      
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, p.barcode || p.id || '000000', { 
        width: 150, 
        margin: 1 
      });
      const qrDataUrl = canvas.toDataURL('image/png');

      const printIframe = document.createElement('iframe');
      printIframe.id = 'thermal-label-iframe-multi';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const printDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (printDoc) {
        const hasDiscount = (Number(p.discount) || 0) > 0;
        const finalPrice = hasDiscount 
          ? p.price - (p.price * (Number(p.discount) || 0) / 100) 
          : p.price;

        let pagesHtml = '';
        for (let i = 0; i < qty; i++) {
          pagesHtml += `
            <div class="label-page">
              <div class="title">${p.name.toUpperCase()}</div>
              
              <div class="content-row">
                <div class="qr-box">
                  <img src="${qrDataUrl}" alt="QR" />
                </div>
                <div class="details">
                  ${hasDiscount ? `<div class="original-price">Rp ${p.price.toLocaleString()}</div>` : ''}
                  <div class="price">Rp ${finalPrice.toLocaleString()}</div>
                  <div class="barcode-text">Code: ${p.barcode || 'N/A'}</div>
                  <div class="sku">InMarket POS 2026</div>
                </div>
              </div>
            </div>
          `;
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Label Multi - ${p.name}</title>
            <style>
              @page {
                size: 40mm 25mm;
                margin: 0;
              }
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                background-color: #fff;
              }
              .label-page {
                width: 40mm;
                height: 25mm;
                margin: 0;
                padding: 1.5mm 2mm;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #000;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                page-break-after: always;
                box-sizing: border-box;
              }
              .label-page:last-child {
                page-break-after: avoid;
              }
              .title {
                font-size: 8px;
                font-weight: bold;
                text-align: center;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 0.5mm;
              }
              .content-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex: 1;
                min-height: 0;
              }
              .qr-box {
                width: 14mm;
                height: 14mm;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-box img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
              }
              .details {
                flex: 1;
                padding-left: 1.5mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
              }
              .price {
                font-size: 9px;
                font-weight: 800;
                color: #000;
                margin-bottom: 0.3mm;
              }
              .original-price {
                font-size: 7px;
                text-decoration: line-through;
                color: #666;
                margin-bottom: 0.3mm;
              }
              .barcode-text {
                font-family: 'Courier New', Courier, monospace;
                font-size: 6px;
                font-weight: bold;
                letter-spacing: 0.3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #444;
              }
              .sku {
                font-size: 5px;
                color: #777;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
          </body>
          </html>
        `;
        printDoc.write(htmlContent);
        printDoc.close();

        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(printIframe);
          }, 1500);
        }, 500);
      }
      playSuccessSound();
      showNotification('success', language === 'id' ? `Dialog cetak ${qty} label dibuka.` : `Print ${qty} labels dialog opened.`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal memproses cetak label.');
    }
  };

  const handleBulkExportCSV = () => {
    try {
      playSuccessSound();
      
      if (!products || products.length === 0) {
        showNotification('info', language === 'id' ? 'Tidak ada produk untuk diekspor.' : 'No products to export.');
        return;
      }

      // Map the products to clean, structured data including names, prices, and stock counts
      const exportData = products.map(p => ({
        'Product Name': p.name || '',
        'Price': p.price || 0,
        'Stock Count': p.stock || 0,
        'Category': p.category || '',
        'Barcode': p.barcode || ''
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inmarket_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('success', language === 'id' ? 'Berhasil mengekspor data produk ke CSV.' : 'Successfully exported product data to CSV.');
    } catch (err) {
      console.error(err);
      showNotification('error', language === 'id' ? 'Gagal mengekspor data ke CSV.' : 'Failed to export data to CSV.');
    }
  };

  // Image upload handler supporting automatic base64 reader
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, slot: 'front' | 'side' | 'detail') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      playClickSound();
      setUploadError(language === 'id' ? 'Format tidak didukung. Harap pilih JPG, PNG, atau WEBP.' : 'Unsupported format. Choose JPG, PNG, or WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (slot === 'front') setPhotoFront(base64String);
      if (slot === 'side') setPhotoSide(base64String);
      if (slot === 'detail') setPhotoDetail(base64String);
      setUploadError(null);
      playSuccessSound();
      showNotification('success', `${slot.toUpperCase()} - Image imported successfully!`);
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop mechanics
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, slot: 'front' | 'side' | 'detail') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError(language === 'id' ? 'Format tidak didukung. Harap pilih JPG, PNG, atau WEBP.' : 'Unsupported format. Choose JPG, PNG, or WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (slot === 'front') setPhotoFront(base64String);
      if (slot === 'side') setPhotoSide(base64String);
      if (slot === 'detail') setPhotoDetail(base64String);
      setUploadError(null);
      playSuccessSound();
    };
    reader.readAsDataURL(file);
  };

  // Clear specific uploaded image
  const removeUpload = (slot: 'front' | 'side' | 'detail') => {
    if (slot === 'front') setPhotoFront('');
    if (slot === 'side') setPhotoSide('');
    if (slot === 'detail') setPhotoDetail('');
    playClickSound();
  };

  // Simulated AI Image Enhancement mechanics with futuristic logs & delays
  const enhanceImageAI = (slot: 'front' | 'side' | 'detail') => {
    const urlToCheck = slot === 'front' ? photoFront : slot === 'side' ? photoSide : photoDetail;
    if (!urlToCheck) {
      setUploadError(language === 'id' ? 'Silakan upload foto terlebih dahulu sebelum melakukan optimasi AI!' : 'Please upload photo before initiating AI Optimization!');
      return;
    }

    playScanSound();
    setIsEnhancing(prev => ({ ...prev, [slot]: true }));
    setEnhancementLog(language === 'id' ? '[AI ENGINE] Membaca data piksel darmacode...' : '[AI ENGINE] Syncing smart pixel layout...');

    const steps = [
      language === 'id' ? '[AI ENGINE] Menghapus noise latar belakang...' : '[AI ENGINE] Cleaning background noise...',
      language === 'id' ? '[AI ENGINE] Memotong otomatis rasio aspek 1:1...' : '[AI ENGINE] Auto cropping to professional 1:1 ratio...',
      language === 'id' ? '[AI ENGINE] Menajamkan tingkat kontras ke resolusi Ultra HD...' : '[AI ENGINE] Upscaling lighting contrast to stunning HD Ultra...',
      language === 'id' ? '[AI ENGINE] Selesai! Foto di-optimasi!' : '[AI ENGINE] Enhancement completed!'
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setEnhancementLog(step);
        if (i === steps.length - 1) {
          setIsEnhancing(prev => ({ ...prev, [slot]: false }));
          setEnhancedMetrics(prev => ({ ...prev, [slot]: true }));
          playSuccessSound();
          showNotification('success', 'AI enhancement complete!');
        }
      }, (i + 1) * 700);
    });
  };

  // Add or Edit save implementation with full LocalStorage + Cloud synchronization
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedDesc = DOMPurify.sanitize(description);
      const sanitizedSupplier = DOMPurify.sanitize(supplier);
      const sanitizedBarcode = DOMPurify.sanitize(barcode);
      
      productSchema.parse({
        name: sanitizedName,
        price: Number(price),
        capitalPrice: Number(capitalPrice) || 0,
        stock: Number(stock),
        category: category || 'Makanan',
        discount: Number(discount) || 0,
        description: sanitizedDesc,
        barcode: sanitizedBarcode,
        supplier: sanitizedSupplier
      });
      
      const compiledImages: string[] = [];
      if (photoFront) compiledImages.push(photoFront);
      if (photoSide) compiledImages.push(photoSide);
      if (photoDetail) compiledImages.push(photoDetail);

      // Fallback to random stock illustration if no image is available
      if (compiledImages.length === 0) {
        compiledImages.push("https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80");
      }

      const payload = {
        name: sanitizedName,
        price: Number(price),
        capitalPrice: Number(capitalPrice) || 0,
        stock: Number(stock),
        category: category || 'Makanan',
        discount: Number(discount) || 0,
        description: sanitizedDesc,
        desc: sanitizedDesc,
        barcode: sanitizedBarcode,
        supplier: sanitizedSupplier,
        variants: variantsText ? variantsText.split(',').map(v => DOMPurify.sanitize(v.trim())).filter(Boolean) : [],
        images: compiledImages,
        photoUrl: compiledImages[0] || '',
        video: videoUrl || '',
        salesCount: editingProduct ? (editingProduct.salesCount || 0) : 0,
        createdAt: editingProduct ? (editingProduct.createdAt || new Date().toISOString()) : new Date().toISOString()
      };

      // Strip out base64 images for Firestore to avoid WebChannel buffer errors
      const cloudPayload = { ...payload };
      cloudPayload.images = cloudPayload.images.map(img => img.length > 50000 ? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80" : img);
      cloudPayload.photoUrl = cloudPayload.photoUrl.length > 50000 ? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80" : cloudPayload.photoUrl;

      try {
        if (auth.currentUser) {
          if (editingProduct && !editingProduct.id.startsWith('preset_') && !editingProduct.id.startsWith('local_')) {
            // Edit cloud product
            await updateDoc(doc(db, 'products', editingProduct.id), cloudPayload);
          } else if (!editingProduct) {
            // Insert cloud product
            await addDoc(collection(db, 'products'), {
              ownerId: auth.currentUser.uid,
              ...cloudPayload
            });
          }
        }
      } catch (e) {
        console.warn("Unable to write product directly to database. Saving data to Local Vault instead.", e);
      }

      // Save locally 
      const productsKey = getPartitionedKey('inmarket_products', true);
      const currentLocalsStr = localStorage.getItem(productsKey) || '[]';
      let currentLocals = safeJsonParse(currentLocalsStr, []);

      if (editingProduct) {
        // Look and update in local array
        currentLocals = currentLocals.map((lp: any) => lp.id === editingProduct.id ? { ...lp, ...payload } : lp);
        // If it had a cloud ID, keep local placeholder
        if (!currentLocals.some((lp: any) => lp.id === editingProduct.id)) {
          currentLocals.push({ id: editingProduct.id, ownerId: auth.currentUser?.uid || 'guest', ...payload });
        }
      } else {
        // Add new product
        currentLocals.unshift({
          id: 'local_' + Date.now(),
          ownerId: auth.currentUser?.uid || 'guest',
          ...payload
        });
      }
      localStorage.setItem(productsKey, JSON.stringify(currentLocals));

      // Reset forms
      setName(''); setPrice(''); setCapitalPrice(''); setStock(''); setCategory('Makanan'); setDiscount('0');
      setDescription(''); setBarcode(''); setSupplier(''); setVariantsText('');
      setPhotoFront(''); setPhotoSide(''); setPhotoDetail(''); setVideoUrl('');
      setEditingProduct(null);
      setIsAddingProduct(false);
      fetchProducts();
      playSuccessSound();
      
      showNotification('success', editingProduct 
        ? (language === 'id' ? 'Produk berhasil diperbarui!' : 'Product updated successfully!') 
        : (language === 'id' ? 'Produk baru ditambahkan!' : 'New product successfully added!')
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        showNotification('error', error.issues[0].message);
      } else {
        showNotification('error', 'An error occurred during submission.');
      }
    }
  };

  // Trigger edit setup
  const fillEditProduct = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setCapitalPrice(p.capitalPrice ? p.capitalPrice.toString() : '');
    setStock(p.stock.toString());
    setCategory(p.category || 'Makanan');
    setDiscount((p.discount || 0).toString());
    setDescription(p.description || '');
    setBarcode(p.barcode || '');
    setSupplier(p.supplier || '');
    setVariantsText(p.variants ? p.variants.join(', ') : '');
    
    // Fill photo slots
    setPhotoFront(p.images?.[0] || '');
    setPhotoSide(p.images?.[1] || '');
    setPhotoDetail(p.images?.[2] || '');
    setVideoUrl(p.video || '');
    
    // Auto shift to view 
    setActiveFormTab('basic');
    setIsAddingProduct(true);
    playClickSound();
  };

  // Delete product handling
  const handleDeleteProduct = async (p: any) => {
    if (!p) return;
    try {
      if (auth.currentUser && !p.id.startsWith('preset_') && !p.id.startsWith('local_')) {
        await deleteDoc(doc(db, 'products', p.id));
      }
    } catch (e) {
      console.warn("Skipping remote deletion, deleting from local index");
    }

    // Delete locally
    const productsKey = getPartitionedKey('inmarket_products', true);
    const currentLocalsStr = localStorage.getItem(productsKey) || '[]';
    try {
      const parsed = JSON.parse(currentLocalsStr);
      const filtered = parsed.filter((lp: any) => lp.id !== p.id);
      localStorage.setItem(productsKey, JSON.stringify(filtered));
    } catch (e) {
      console.error("error during local deletion", e);
      localStorage.setItem(productsKey, '[]');
    }

    fetchProducts();
    playSuccessSound();
    showNotification('success', language === 'id' ? 'Produk berhasil dihapus.' : 'Product deleted successfully.');
  };

  // CSV Bulk parser logic
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const productsKey = getPartitionedKey('inmarket_products', true);
        const currentLocalsStr = localStorage.getItem(productsKey) || '[]';
        let currentLocals: any[] = [];
        try { currentLocals = JSON.parse(currentLocalsStr); } catch (e) { console.error("error parsing csv storage", e); currentLocals = []; }

        for (const data of results.data as any[]) {
          const item = {
            id: 'local_csv_' + Math.random() + '_' + Date.now(),
            ownerId: auth.currentUser?.uid || 'guest',
            name: data.name || 'Unnamed CSV Stock',
            price: Number(data.price) || 10000,
            stock: Number(data.stock) || 10,
            category: data.category || 'Makanan',
            discount: Number(data.discount) || 0,
            description: data.description || '',
            desc: data.description || '',
            barcode: data.barcode || '',
            supplier: data.supplier || '',
            variants: [],
            images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"],
            photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
            video: "",
            salesCount: 0,
            createdAt: new Date().toISOString()
          };
          currentLocals.unshift(item);

          // Try backup to Firebase with size limit
          try {
            if (auth.currentUser) {
              const cloudItem = {
                ownerId: auth.currentUser.uid,
                ...item,
                id: undefined
              };
              // Simplified size check - Firestore limit is 1MB
              if (JSON.stringify(cloudItem).length < 500000) {
                 await addDoc(collection(db, 'products'), cloudItem);
              } else {
                 console.warn("Item too large to sync to cloud, skipping");
              }
            }
          } catch (e) {
            console.error("Firebase write error:", e);
          }
        }
        
        localStorage.setItem(productsKey, JSON.stringify(currentLocals));
        fetchProducts();
        playSuccessSound();
        showNotification('success', language === 'id' ? 'Bulk CSV Terimpor Sukses!' : 'Bulk CSV Imported Successfully!');
      }
    });
  };

  // Modal stock update 
  const handleUpdateStock = async () => {
    if (!selectedProduct || !quantity) return;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      showNotification('error', 'Enter valid quantity');
      return;
    }

    const isSell = modalType === 'sell';
    if (isSell && selectedProduct.stock < qty) {
      showNotification('error', language === 'id' ? 'Stok produk tidak mencukupi!' : 'Insufficient stock remaining!');
      return;
    }

    const newStock = isSell ? selectedProduct.stock - qty : selectedProduct.stock + qty;
    const newSalesCount = isSell ? (selectedProduct.salesCount || 0) + qty : (selectedProduct.salesCount || 0);

    // Update in database 
    try {
      if (auth.currentUser && !selectedProduct.id.startsWith('preset_') && !selectedProduct.id.startsWith('local_')) {
        await updateDoc(doc(db, 'products', selectedProduct.id), { 
          stock: newStock,
          salesCount: newSalesCount
        });
      }
    } catch {}

    // Update in localStorage
    const productsKey = getPartitionedKey('inmarket_products', true);
    const currentLocalsStr = localStorage.getItem(productsKey) || '[]';
    const parsed = safeJsonParse(currentLocalsStr, []);
    
    const updated = parsed.map((lp: any) => lp.id === selectedProduct.id 
      ? { ...lp, stock: newStock, salesCount: newSalesCount } 
      : lp
    );
    localStorage.setItem(productsKey, JSON.stringify(updated));

    // Record manual adjustment to stock log
    const stockLogsKey = getPartitionedKey('inmarket_stock_logs', true);
    const existingLogsStr = localStorage.getItem(stockLogsKey) || '[]';
    const existingLogs = safeJsonParse(existingLogsStr, []);
    
    const newLog = {
      id: 'log_' + Math.floor(Math.random() * 899999 + 100000),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: isSell ? 'SALE' : 'RESTOCK',
      qty: qty,
      prevStock: selectedProduct.stock,
      newStock: newStock,
      timestamp: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0') + ' ' + String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0')
    };
    localStorage.setItem(stockLogsKey, JSON.stringify([newLog, ...existingLogs]));

    // Insert sales metrics
    if (isSell) {
      try {
        if (auth.currentUser) {
          await addDoc(collection(db, 'sales'), {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: qty,
            pricePerUnit: selectedProduct.price,
            total: qty * (selectedProduct.price - (selectedProduct.price * (selectedProduct.discount || 0) / 100)),
            date: new Date().toISOString(),
            ownerId: auth.currentUser?.uid,
            cashier: auth.currentUser?.email || 'Admin/Owner'
          });
        }
      } catch {}

      // Keep offline fallback sales report
      const localSalesReportStr = localStorage.getItem('local_sales_history') || '[]';
      try {
        const sales = JSON.parse(localSalesReportStr);
        sales.unshift({
          id: 'sale_' + Date.now(),
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: qty,
          pricePerUnit: selectedProduct.price,
          total: qty * (selectedProduct.price - (selectedProduct.price * (selectedProduct.discount || 0) / 100)),
          date: new Date().toISOString(),
          cashier: auth.currentUser?.email || 'Offline Cashier'
        });
        localStorage.setItem('local_sales_history', JSON.stringify(sales));
      } catch (e) {
        console.error("error parsing sales history", e);
      }
    }

    fetchProducts();
    setIsModalOpen(false);
    setQuantity('');
    playSuccessSound();
    showNotification('success', isSell ? 'Sale processed successfully!' : 'Inventory restocked successfully!');
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: language === 'id' ? 'Habis' : 'Out of Stock', color: 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.25)]' };
    if (stock < 10) return { label: language === 'id' ? 'Menipis' : 'Low Stock', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' };
    return { label: language === 'id' ? 'Aman' : 'In Stock', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' };
  };

  // Color guidelines based on violet & cyan gradients
  const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6'];

  // Memoized category distribution stats
  const categoryStats = React.useMemo(() => {
    const statsMap: Record<string, { name: string; count: number; totalStock: number; assetValue: number }> = {};
    
    // Seed with existing pre-defined categories
    categories.forEach(cat => {
      statsMap[cat] = {
        name: cat,
        count: 0,
        totalStock: 0,
        assetValue: 0
      };
    });
    
    products.forEach(p => {
      const cat = p.category || (language === 'id' ? 'Lainnya' : 'Others');
      if (!statsMap[cat]) {
        statsMap[cat] = {
          name: cat,
          count: 0,
          totalStock: 0,
          assetValue: 0
        };
      }
      
      statsMap[cat].count += 1;
      statsMap[cat].totalStock += (Number(p.stock) || 0);
      const capPrice = Number(p.capitalPrice) || Number(p.price) || 0;
      statsMap[cat].assetValue += capPrice * (Number(p.stock) || 0);
    });
    
    // Filter out categories with 0 count to make chart cleaner
    return Object.values(statsMap).filter(item => item.count > 0);
  }, [products, categories, language]);

  // Filter & Search checks
  const lowStockProducts = products.filter(p => p.stock >= 0 && p.stock < 10);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterCategory === 'All' || p.category === filterCategory)
  );

  return (
    <div className="p-4 md:p-8 space-y-6 text-slate-100 min-h-screen relative overflow-hidden bg-transparent">
      
      {/* Dynamic Alert Banner / Portal Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[99] px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border ${
              notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : notification.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/40 text-blue-200'
                : 'bg-purple-950/90 border-purple-500/40 text-purple-200'
            } backdrop-blur-xl`}
          >
            <Sparkles className="animate-pulse text-purple-400" size={18} />
            <span className="text-xs font-semibold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holographic Header Banner */}
      <div className="relative p-6 md:p-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#120D1E]/40 via-[#0A0515]/20 to-[#0A0515]/20 backdrop-blur-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-[1.5px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <div className="w-full h-full bg-[#0D0819] rounded-[14px] flex items-center justify-center">
              <Package className="text-cyan-400 animate-pulse" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent tracking-tight font-sans">
              INMARKET STOCK VAULT
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-[ping_2.5s_infinite]" />
              SaaS Ledger Core &bull; Secure Realtime Management
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex gap-2.5 bg-black/40 border border-white/5 rounded-2xl p-1.5 w-full md:w-auto">
          <button 
            onClick={() => { playClickSound(); setView('inventory'); }} 
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              view === 'inventory' 
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.35)]' 
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Package size={14}/> {t('inventory')}
          </button>
          <button 
            onClick={() => { playClickSound(); setView('sales'); }} 
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              view === 'sales' 
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.35)]' 
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <History size={14}/> {t('salesHistory')}
          </button>
        </div>
      </div>

      {view === 'inventory' ? (
        <>
          {/* Low Stock Warning Box */}
          {lowStockProducts.length > 0 && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 bg-rose-500/5 border border-rose-500/30 rounded-3xl backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(239,68,68,0.1)] relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-rose-500" />
              <div className="flex gap-3.5 items-start">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5 animate-bounce" size={20} />
                <div>
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider">{t('diagnosticsLowStock')}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    {language === 'id' 
                      ? `${lowStockProducts.map(p => p.name).join(', ')} hampir habis dari etalase. Harap segera restock item tersebut.`
                      : `${lowStockProducts.map(p => p.name).join(', ')} reserves are decreasing. Procure restock soon.`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  playClickSound();
                  setSearchTerm('');
                  setFilterCategory('All');
                  // scroll down
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="px-4.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-xs font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer"
              >
                {t('auditItems')}
              </button>
            </motion.div>
          )}

          {/* Futuristic Category Distribution Analytics Dashboard Card */}
          {products.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-[2rem] bg-[#0c091f]/45 border border-violet-500/10 backdrop-blur-3xl relative overflow-hidden text-slate-100 shadow-2xl"
            >
              {/* Dynamic decorative visual indicators */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/5 rounded-full blur-[85px] pointer-events-none" />
              <div className="absolute top-0 inset-x-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              {/* Card Header Row */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-600/10 rounded-xl text-violet-400 border border-violet-500/15">
                    <BarChart3 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                      {language === 'id' ? 'Analisis Distribusi Kategori' : 'Category Distribution Analytics'}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {language === 'id' 
                        ? 'Proporsi item SKU, jumlah total unit stok, dan ringkasan valuasi aset modal harian.' 
                        : 'Unique SKU counts, total stock level units, and capital valuation breakdown.'}
                    </p>
                  </div>
                </div>

                {/* Metric Controllers Hub */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setActiveChartMetric('count'); }}
                      className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activeChartMetric === 'count' 
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {language === 'id' ? 'Unik SKU' : 'SKU Count'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setActiveChartMetric('stock'); }}
                      className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activeChartMetric === 'stock' 
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {language === 'id' ? 'Unit Stok' : 'Total Units'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setActiveChartMetric('value'); }}
                      className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activeChartMetric === 'value' 
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {language === 'id' ? 'Valuasi Modal' : 'Asset Capital'}
                    </button>
                  </div>

                  {/* Expand / Collapse triggers */}
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setIsChartExpanded(!isChartExpanded); }}
                    className="p-2 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition duration-150 cursor-pointer flex items-center justify-center"
                    title={isChartExpanded ? 'Collapse Panels' : 'Expand Panels'}
                  >
                    {isChartExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expandable Chart Canvas container */}
              <AnimatePresence initial={false}>
                {isChartExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 border-t border-white/5 mt-6">
                      {/* Left: Proporsi Pie Donut Chart */}
                      <div className="lg:col-span-5 flex flex-col justify-between p-5 bg-[#080514]/50 border border-white/5 rounded-3xl min-h-[300px]">
                        <div>
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#06b6d4]">
                            {language === 'id' ? 'PROPORSI PERSENTASE SEKTOR' : 'RELATIVE FRACTION PROPORTION'}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {language === 'id' ? 'Fraksi kontribusi relatif antarkategori.' : 'Fractional category contribution weight overview.'}
                          </p>
                        </div>

                        <div className="h-44 relative my-4">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RechartsPieChart>
                              <Pie
                                data={categoryStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey={
                                  activeChartMetric === 'count' ? 'count' : 
                                  activeChartMetric === 'stock' ? 'totalStock' : 'assetValue'
                                }
                              >
                                {categoryStats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0c0a1d', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '14px', color: '#f8fafc' }}
                                formatter={(value: any, name: any, props: any) => {
                                  if (activeChartMetric === 'value') {
                                    return [`Rp ${value.toLocaleString()}`, props.payload.name];
                                  }
                                  if (activeChartMetric === 'stock') {
                                    return [`${value.toLocaleString()} Units`, props.payload.name];
                                  }
                                  return [`${value} SKUs`, props.payload.name];
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                          
                          {/* Inner center label values */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400">
                              {activeChartMetric === 'count' ? 'TOTAL SKU' : activeChartMetric === 'stock' ? 'TOTAL UNIT' : 'TOTAL ASSET'}
                            </span>
                            <span className="text-xs font-black font-mono tracking-tight text-white mt-0.5">
                              {activeChartMetric === 'count' 
                                ? `${products.length} SKU`
                                : activeChartMetric === 'stock'
                                ? `${categoryStats.reduce((acc, c) => acc + c.totalStock, 0).toLocaleString()} Pcs`
                                : `Rp ${categoryStats.reduce((acc, c) => acc + c.assetValue, 0).toLocaleString()}`
                              }
                            </span>
                          </div>
                        </div>

                        {/* Chart Custom Legend Tags */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] text-slate-400 font-medium">
                          {categoryStats.map((item, index) => (
                            <div key={`legend-${item.name}`} className="flex items-center gap-1.5">
                              <span 
                                className="w-2 h-2 rounded-full inline-block shrink-0" 
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} 
                              />
                              <span className="text-slate-300 font-mono text-[9px] font-bold">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Bar comparative ledger Column Chart */}
                      <div className="lg:col-span-7 flex flex-col justify-between p-5 bg-[#080514]/50 border border-white/5 rounded-3xl min-h-[300px]">
                        <div>
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8b5cf6]">
                            {language === 'id' ? 'GRAFIK DETIL HISTOGRAM' : 'COMPARATIVE LEDGER BAR'}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {language === 'id' ? 'Histogram total porsi kuantitatif per kategori.' : 'Actual total scale counts relative across inventory categories.'}
                          </p>
                        </div>

                        <div className="h-52 mt-4">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RechartsBarChart data={categoryStats}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                stroke="rgba(255,255,255,0.4)" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false} 
                              />
                              <YAxis 
                                stroke="rgba(255,255,255,0.4)" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => {
                                  if (activeChartMetric === 'value') {
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                    return value;
                                  }
                                  return value;
                                }}
                              />
                              <RechartsTooltip 
                                cursor={{ fill: 'rgba(255, 255, 255, 0.015)' }}
                                contentStyle={{ backgroundColor: '#0c0a1d', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '14px', color: '#f8fafc' }}
                                formatter={(value: any) => {
                                  if (activeChartMetric === 'value') return [`Rp ${value.toLocaleString()}`, language === 'id' ? 'Valuasi Aset' : 'Asset Value'];
                                  if (activeChartMetric === 'stock') return [`${value.toLocaleString()} Pcs`, language === 'id' ? 'Kuantitas Stok' : 'Units Stock'];
                                  return [`${value} SKU`, language === 'id' ? 'Kategori Unik' : 'Unique SKU'];
                                }}
                              />
                              <Bar 
                                dataKey={
                                  activeChartMetric === 'count' ? 'count' : 
                                  activeChartMetric === 'stock' ? 'totalStock' : 'assetValue'
                                } 
                                fill="#8b5cf6" 
                                radius={[6, 6, 0, 0]}
                              >
                                {categoryStats.map((entry, index) => (
                                  <Cell 
                                    key={`bar-cell-${index}`} 
                                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                  />
                                ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Core Controls Row: Search, Category Quick Filter, CSV Ingestion */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-3.5 text-slate-500 pointer-events-none" size={16} />
              <input 
                placeholder={t('search')} 
                className="w-full p-3.5 pl-11 bg-[#0F0A1C]/80 focus:bg-[#150F26] border border-white/5 focus:border-cyan-500/40 rounded-2xl text-xs text-slate-100 transition-all font-sans"
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
              <AnimatePresence>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              <button
                onClick={() => { playClickSound(); setIsAddingProduct(true); setEditingProduct(null); }}
                className="flex-1 md:flex-initial px-5 py-3.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 active:scale-[0.98] text-white text-xs font-black tracking-wider uppercase rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(139,92,246,0.35)] cursor-pointer"
              >
                <Plus size={15} /> {t('addProduct')}
              </button>
              
              <div>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                <button 
                  onClick={() => { playClickSound(); fileInputRef.current?.click(); }} 
                  className="px-5 py-3.5 bg-[#0F0A1C]/60 hover:bg-[#17112A] border border-white/5 hover:border-white/10 text-slate-300 text-xs font-mono font-bold tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload size={14}/> CSV DATA SOURCE
                </button>
              </div>

              <button 
                onClick={handleBulkExportCSV} 
                className="px-5 py-3.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/25 hover:border-emerald-400 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] active:scale-95"
              >
                <Download size={14}/> {language === 'id' ? 'EKSPOR PRODUK CSV' : 'BULK EXPORT CSV'}
              </button>
            </div>
          </div>

          {/* Categories Tab Pill Belt */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none opacity-90">
            <button
              onClick={() => { playClickSound(); setFilterCategory('All'); }}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                filterCategory === 'All'
                  ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 font-black'
                  : 'bg-[#120B1D]/45 border-white/5 text-slate-400 hover:text-slate-100'
              }`}
            >
              🚀 {t('allCategories')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playClickSound(); setFilterCategory(cat); }}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  filterCategory === cat
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 font-black'
                    : 'bg-[#120B1D]/45 border-white/5 text-slate-400 hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ADD / EDIT DOCK (Futuristic holographic sliding editor drawer) */}
          <AnimatePresence>
            {isAddingProduct && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 15 }}
                className="p-6 md:p-8 rounded-[36px] border border-violet-500/30 bg-gradient-to-b from-[#100B1E]/95 via-[#0D091A]/98 to-[#05030B]/99 backdrop-blur-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] relative"
              >
                {/* Visual laser scanners background decorator */}
                <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
                
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-violet-400 animate-spin-slow" size={18} />
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-slate-100">
                      {editingProduct 
                        ? t('editPremiumProduct')
                        : t('addPremiumProduct')}
                    </h2>
                  </div>
                  <button 
                    onClick={() => { playClickSound(); setIsAddingProduct(false); setEditingProduct(null); }}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tab buttons for form layers */}
                <div className="grid grid-cols-3 gap-2.5 p-1 bg-black/40 border border-white/5 rounded-2xl mb-6 max-w-md">
                  <button 
                    type="button" 
                    onClick={() => { playClickSound(); setActiveFormTab('basic'); }}
                    className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      activeFormTab === 'basic' ? 'bg-white/10 text-cyan-300 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Info size={12} /> Core
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { playClickSound(); setActiveFormTab('media'); }}
                    className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      activeFormTab === 'media' ? 'bg-white/10 text-cyan-300 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon size={12} /> {t('mediaSlots')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { playClickSound(); setActiveFormTab('extra'); }}
                    className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      activeFormTab === 'extra' ? 'bg-white/10 text-cyan-300 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sliders size={12} /> {t('metaTags')}
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-6">
                  
                  {/* TAB 1: BASIC INFORMATION */}
                  {activeFormTab === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          {t('name')} <span className="text-red-400 font-sans">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder={language === 'id' ? 'Contoh: Kopi Brewed Arabika 250gr' : 'e.g. Arabika Bean 250g'}
                          className="w-full p-3.5 bg-black/45 hover:bg-black/60 focus:bg-black/80 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans"
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                        />
                      </div>

                      {/* Category selection */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                          {t('category')} <span className="text-red-400 font-sans">*</span>
                        </label>
                        <select 
                          className="w-full p-3.5 bg-[#0C0717] border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-200 transition-all font-sans focus:outline-none"
                          value={category} 
                          onChange={e => setCategory(e.target.value)}
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Capital Price */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          {language === 'id' ? 'Harga Beli (Modal)' : 'Capital Price (Cost)'} (IDR) <span className="text-red-400 font-sans">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-xs font-bold text-violet-400">Rp</span>
                          <input 
                            type="number" 
                            required
                            min="0"
                            placeholder="e.g. 50000"
                            className="w-full p-3.5 pl-9 bg-black/45 border border-white/5 focus:border-violet-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={capitalPrice} 
                            onChange={e => setCapitalPrice(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          {t('price')} (IDR) <span className="text-red-400 font-sans">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-xs font-bold text-cyan-400">Rp</span>
                          <input 
                            type="number" 
                            required
                            min="0"
                            placeholder="e.g. 75000"
                            className="w-full p-3.5 pl-9 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={price} 
                            onChange={e => setPrice(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Stock Reserve */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          {t('stock')} <span className="text-red-400 font-sans">*</span>
                        </label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          placeholder="e.g. 50"
                          className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={stock} 
                          onChange={e => setStock(e.target.value)} 
                        />
                      </div>

                      {/* Custom discount setting */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                          <span>{language === 'id' ? 'Diskon Promo' : 'Discount Promo'} (%)</span>
                          <span className="text-cyan-400 font-mono text-[10px]">{discount}% OFF</span>
                        </label>
                        <div className="flex items-center gap-3.5">
                          <input 
                            type="range" 
                            min="0" 
                            max="90" 
                            className="flex-1 w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600"
                            value={discount} 
                            onChange={e => setDiscount(e.target.value)} 
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="90" 
                            className="w-16 p-2 bg-black/40 border border-white/5 rounded-lg text-center text-xs text-slate-100 font-mono"
                            value={discount} 
                            onChange={e => setDiscount(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Color list description */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                          {language === 'id' ? 'Varian Warna / Rasa' : 'Color / Taste Variants'}
                        </label>
                        <input 
                          type="text" 
                          placeholder={language === 'id' ? 'Pisahkan dengan koma: Merah, Hijau, Hitam' : 'Separate with comma: Red, Matcha, Spicy'}
                          className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans"
                          value={variantsText} 
                          onChange={e => setVariantsText(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: RICH MEDIA ASSETS (DRAG & DROP, IMAGE SLIDES, AI PROCESSOR) */}
                  {activeFormTab === 'media' && (
                    <div className="space-y-5">
                      
                      {uploadError && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
                          <AlertCircle size={15} />
                          {uploadError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* SLOT A: FRONT/MAIN PHOTO */}
                        <div className="flex flex-col space-y-2.5">
                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider text-center block">
                            🎥 FRONT IMAGE (MAIN)
                          </span>
                          
                          <div 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'front')}
                            className={`h-52 rounded-2xl border-2 border-dashed relative flex flex-col items-center justify-center transition-all ${
                              photoFront 
                                ? 'border-emerald-500/30 bg-emerald-950/5' 
                                : 'border-white/10 hover:border-violet-500/40 bg-black/15'
                            }`}
                          >
                            {photoFront ? (
                              <div className="absolute inset-0 group rounded-2xl overflow-hidden">
                                <img 
                                  src={photoFront} 
                                  alt="Front main illustration" 
                                  className={`w-full h-full object-cover transition-all ${enhancedMetrics.front ? 'brightness-110 contrast-110 saturate-[1.05] shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`} 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      playClickSound();
                                      setViewerImages([photoFront]);
                                      setViewerIndex(0);
                                      setIsViewerZoomed(true);
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
                                  >
                                    <Maximize2 size={15} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => removeUpload('front')}
                                    className="p-2 bg-red-500/30 hover:bg-red-500/55 rounded-full text-red-100 cursor-pointer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                                {enhancedMetrics.front && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-black font-mono text-[8px] font-black tracking-widest rounded-md flex items-center gap-1.5 shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
                                    <Sparkles size={8} className="animate-spin" /> AI COPIED
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center p-4 space-y-2 pointer-events-none">
                                <Plus size={24} className="text-violet-500 animate-pulse" />
                                <p className="text-[10px] text-slate-400 font-sans">
                                  Drag image or <span className="text-cyan-400 font-bold underline">browse</span>
                                </p>
                                <p className="text-[8px] text-slate-500 font-mono">JPG, PNG, WEBP Only</p>
                              </div>
                            )}

                            {/* Trigger select button */}
                            {!photoFront && (
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => handlePhotoUpload(e, 'front')} 
                              />
                            )}
                          </div>

                          {/* AI Optimization Trigger */}
                          {photoFront && (
                            <button
                              type="button"
                              disabled={isEnhancing.front}
                              onClick={() => enhanceImageAI('front')}
                              className="py-1.5 bg-gradient-to-r from-violet-950 to-indigo-900 border border-violet-500/30 hover:brightness-110 rounded-xl text-[9px] font-black tracking-widest uppercase text-slate-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isEnhancing.front ? (
                                <Loader2 size={11} className="animate-spin text-cyan-400" />
                              ) : (
                                <Sparkles size={11} className="text-cyan-400" />
                              )}
                              {isEnhancing.front ? 'ENHANCING...' : 'AI BEAUTIFY IMAGE'}
                            </button>
                          )}
                        </div>

                        {/* SLOT B: SIDE ANGLE PHOTO */}
                        <div className="flex flex-col space-y-2.5">
                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider text-center block">
                            🎥 SIDE ANGLE PHOTO
                          </span>
                          
                          <div 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'side')}
                            className={`h-52 rounded-2xl border-2 border-dashed relative flex flex-col items-center justify-center transition-all ${
                              photoSide 
                                ? 'border-emerald-500/30 bg-emerald-950/5' 
                                : 'border-white/10 hover:border-violet-500/40 bg-black/15'
                            }`}
                          >
                            {photoSide ? (
                              <div className="absolute inset-0 group rounded-2xl overflow-hidden">
                                <img 
                                  src={photoSide} 
                                  alt="Side product perspective" 
                                  className={`w-full h-full object-cover transition-all ${enhancedMetrics.side ? 'brightness-110 contrast-110 saturate-[1.05] shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`} 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      playClickSound();
                                      setViewerImages([photoSide]);
                                      setViewerIndex(0);
                                      setIsViewerZoomed(true);
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
                                  >
                                    <Maximize2 size={15} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => removeUpload('side')}
                                    className="p-2 bg-red-500/30 hover:bg-red-500/55 rounded-full text-red-100 cursor-pointer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                                {enhancedMetrics.side && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-black font-mono text-[8px] font-black tracking-widest rounded-md flex items-center gap-1.5 shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
                                    <Sparkles size={8} className="animate-spin" /> AI COPIED
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center p-4 space-y-2 pointer-events-none">
                                <Plus size={24} className="text-violet-500 animate-pulse" />
                                <p className="text-[10px] text-slate-400 font-sans">
                                  Drag image or <span className="text-cyan-400 font-bold underline">browse</span>
                                </p>
                                <p className="text-[8px] text-slate-500 font-mono">JPG, PNG, WEBP Only</p>
                              </div>
                            )}

                            {!photoSide && (
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => handlePhotoUpload(e, 'side')} 
                              />
                            )}
                          </div>

                          {photoSide && (
                            <button
                              type="button"
                              disabled={isEnhancing.side}
                              onClick={() => enhanceImageAI('side')}
                              className="py-1.5 bg-gradient-to-r from-violet-950 to-indigo-900 border border-violet-500/30 hover:brightness-110 rounded-xl text-[9px] font-black tracking-widest uppercase text-slate-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isEnhancing.side ? (
                                <Loader2 size={11} className="animate-spin text-cyan-400" />
                              ) : (
                                <Sparkles size={11} className="text-cyan-400" />
                              )}
                              {isEnhancing.side ? 'ENHANCING...' : 'AI BEAUTIFY IMAGE'}
                            </button>
                          )}
                        </div>

                        {/* SLOT C: DETAILED SPEC FIELD */}
                        <div className="flex flex-col space-y-2.5">
                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider text-center block">
                            🎥 DETAIL CLOSE-UP PHOTO
                          </span>
                          
                          <div 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'detail')}
                            className={`h-52 rounded-2xl border-2 border-dashed relative flex flex-col items-center justify-center transition-all ${
                              photoDetail 
                                ? 'border-emerald-500/30 bg-emerald-950/5' 
                                : 'border-white/10 hover:border-violet-500/40 bg-black/15'
                            }`}
                          >
                            {photoDetail ? (
                              <div className="absolute inset-0 group rounded-2xl overflow-hidden">
                                <img 
                                  src={photoDetail} 
                                  alt="Close-up detail profile" 
                                  className={`w-full h-full object-cover transition-all ${enhancedMetrics.detail ? 'brightness-110 contrast-110 saturate-[1.05] shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`} 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      playClickSound();
                                      setViewerImages([photoDetail]);
                                      setViewerIndex(0);
                                      setIsViewerZoomed(true);
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
                                  >
                                    <Maximize2 size={15} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => removeUpload('detail')}
                                    className="p-2 bg-red-500/30 hover:bg-red-500/55 rounded-full text-red-100 cursor-pointer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                                {enhancedMetrics.detail && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-black font-mono text-[8px] font-black tracking-widest rounded-md flex items-center gap-1.5 shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
                                    <Sparkles size={8} className="animate-spin" /> AI COPIED
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center p-4 space-y-2 pointer-events-none">
                                <Plus size={24} className="text-violet-500 animate-pulse" />
                                <p className="text-[10px] text-slate-400 font-sans">
                                  Drag image or <span className="text-cyan-400 font-bold underline">browse</span>
                                </p>
                                <p className="text-[8px] text-slate-500 font-mono">JPG, PNG, WEBP Only</p>
                              </div>
                            )}

                            {!photoDetail && (
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => handlePhotoUpload(e, 'detail')} 
                              />
                            )}
                          </div>

                          {photoDetail && (
                            <button
                              type="button"
                              disabled={isEnhancing.detail}
                              onClick={() => enhanceImageAI('detail')}
                              className="py-1.5 bg-gradient-to-r from-violet-950 to-indigo-900 border border-violet-500/30 hover:brightness-110 rounded-xl text-[9px] font-black tracking-widest uppercase text-slate-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isEnhancing.detail ? (
                                <Loader2 size={11} className="animate-spin text-cyan-400" />
                              ) : (
                                <Sparkles size={11} className="text-cyan-400" />
                              )}
                              {isEnhancing.detail ? 'ENHANCING...' : 'AI BEAUTIFY IMAGE'}
                            </button>
                          )}
                        </div>

                      </div>

                      {/* Display AI process logs continuously if active */}
                      <AnimatePresence>
                        {(isEnhancing.front || isEnhancing.side || isEnhancing.detail) && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-3.5 bg-[#080211] border border-cyan-500/30 rounded-2xl flex items-center gap-3"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <p className="text-[10px] font-mono text-cyan-400 tracking-wider">
                              {enhancementLog}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Video clip attachment field */}
                      <div className="space-y-2 max-w-xl">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Video size={13} className="text-violet-400" /> {language === 'id' ? 'Link Video Promosi Pendek' : 'Short Promo Video Link'} (YouTube / MP4 URL)
                        </label>
                        <input 
                          type="url" 
                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans"
                          value={videoUrl} 
                          onChange={e => setVideoUrl(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MARKETING META, DESCRIPTION, BARCODE, VENDOR DEPOSIT */}
                  {activeFormTab === 'extra' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Barcode scanner details block */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Barcode size={13} className="text-violet-400" /> Barcode EAN-13</span>
                          <span className="text-slate-500 text-[10px] uppercase font-mono">Laser Autogenerate</span>
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder={language === 'id' ? 'Input Barcode (opsional)' : 'Enter Barcode ID'}
                            className="flex-1 w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-mono"
                            value={barcode} 
                            onChange={e => setBarcode(e.target.value)} 
                          />
                          <button
                            type="button"
                            onClick={generateLaserBarcode}
                            className="px-4 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wider uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Scan size={14} /> {language === 'id' ? 'LASER SCAN' : 'LASER'}
                          </button>
                        </div>
                      </div>

                      {/* Supplier distribution partner */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Warehouse size={13} className="text-violet-400" /> Supplier Vendor
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Indofood Distrindo"
                          className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-sans"
                          value={supplier} 
                          onChange={e => setSupplier(e.target.value)} 
                        />
                      </div>

                      {/* Multiline description */}
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <FileText size={13} className="text-violet-400" /> {language === 'id' ? 'Deskripsi Lengkap Produk' : 'Product Full Specifications'}
                        </label>
                        <textarea 
                          rows={4}
                          placeholder={language === 'id' ? 'Masukkan info spesifikasi, keunggulan, bahan baku produk...' : 'Describe special specifications, raw materials, instructions...'}
                          className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-200 transition-all font-sans resize-none"
                          value={description} 
                          onChange={e => setDescription(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Submission and controller triggers */}
                  <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-end items-center">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setIsAddingProduct(false); setEditingProduct(null); }}
                      className="w-full sm:w-auto px-6 py-3.5 bg-[#171324] hover:bg-[#201C31] text-slate-300 text-xs font-black tracking-widest uppercase rounded-2xl transition-all cursor-pointer"
                    >
                      {t('cancel')}
                    </button>
                    
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white text-xs font-black tracking-widest uppercase rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(109,40,217,0.45)] cursor-pointer"
                    >
                      <Check size={14} /> {editingProduct ? (language === 'id' ? 'PERBARUI STOK' : 'CONFIRM REWRITE') : t('save')}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FUTURISTIC MARKETPLACE GRID LAYOUT (Bento inspired, Tokopedia Premium aesthetic) */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm animate-pulse min-h-[300px] flex flex-col pt-3 px-3 pb-4">
                  {/* Image skeleton */}
                  <div className="h-44 w-full bg-white/5 rounded-2xl relative mb-4" />
                  
                  {/* Content skeleton */}
                  <div className="flex-1 flex flex-col justify-end space-y-3">
                    {/* Title */}
                    <div className="h-5 w-3/4 bg-white/10 rounded" />
                    {/* Badges/Category */}
                    <div className="flex gap-2">
                       <div className="h-4 w-16 bg-white/10 rounded-full" />
                       <div className="h-4 w-12 bg-white/10 rounded-full" />
                    </div>
                    {/* Price */}
                    <div className="h-7 w-1/2 bg-white/10 rounded my-2" />
                    {/* Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                       <div className="h-10 flex-1 bg-white/5 rounded-xl" />
                       <div className="h-10 w-10 bg-white/5 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-[40px] bg-white/5 backdrop-blur-xl group hover:border-violet-500/20 transition-all"
            >
              <div className="w-24 h-24 rounded-full bg-violet-600/10 flex items-center justify-center mb-6 ring-4 ring-violet-500/5 group-hover:scale-110 transition-transform">
                <Package size={48} className="text-violet-400 opacity-60" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                {language === 'id' ? 'Belum Ada Produk' : 'No Products Found'}
              </h3>
              <p className="text-slate-400 text-sm max-w-xs text-center leading-relaxed mb-8">
                {language === 'id' 
                  ? 'Mulai inventaris bisnis Anda dengan menambahkan produk pertama sekarang juga.' 
                  : 'Kickstart your business inventory by adding your first product now.'}
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => { playClickSound(); setIsAddingProduct(true); setEditingProduct(null); }}
                  className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-black tracking-widest uppercase rounded-2xl shadow-lg hover:shadow-violet-500/25 transition-all active:scale-95"
                >
                  <Plus size={16} className="inline mr-2" /> {t('addProduct')}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredProducts.map(p => {
                const status = getStockStatus(p.stock);
                const discountAmount = Number(p.discount) || 0;
                const hasDiscount = discountAmount > 0;
                
                // Calculate real discounted price
                const discountedPrice = hasDiscount 
                  ? p.price - (p.price * discountAmount / 100) 
                  : p.price;

                // Determine if product is hot (best seller) 
                const isBestSeller = (p.salesCount || 0) > 15;

                return (
                  <motion.div 
                    key={p.id} 
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`group relative p-4 rounded-[28px] border bg-gradient-to-br from-[#120D21]/90 via-[#0B0617]/95 to-[#05020B]/98 backdrop-blur-2xl transition-all duration-300 ${
                      p.stock === 0 
                        ? 'border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
                        : p.stock < 10 
                        ? 'border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                        : 'border-white/5 hover:border-violet-500/35 shadow-[0_5px_20px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    {/* Visual glowing border pulse if hot */}
                    {isBestSeller && (
                      <div className="absolute inset-x-12 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse filter blur-[1px]" />
                    )}

                    {/* BADGES ROW */}
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-1.5">
                      {hasDiscount && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-mono text-[9px] font-black tracking-widest rounded-lg shadow-lg">
                          -{discountAmount}% OFF
                        </span>
                      )}
                      
                      {isBestSeller && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-sans text-[8px] font-black tracking-widest rounded-lg shadow-lg flex items-center gap-1">
                          <Flame size={10} className="fill-black text-black animate-bounce" /> POPULER
                        </span>
                      )}
                    </div>

                    <div className="absolute top-6 right-6 z-10">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* MEDIA PREVIEW CAROUSEL */}
                    <div className="w-full h-48 bg-[#07030F] rounded-[20px] overflow-hidden relative group/media flex items-center justify-center border border-white/5">
                      {p.images && p.images.length > 0 ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={p.images[0]} 
                            alt={p.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                          {/* Indicator that multiple photos exist */}
                          {p.images.length > 1 && (
                            <div className="absolute bottom-3.5 right-3.5 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[8px] font-mono tracking-widest uppercase text-slate-300">
                              + {p.images.length - 1} PERSPECTIVES
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                          <Package size={40} className="text-violet-400" />
                          <span className="text-[10px] font-mono tracking-widest">NO ASSETS LOADED</span>
                        </div>
                      )}

                      {/* Cinematic Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setViewerImages(p.images || []);
                            setViewerIndex(0);
                            setIsViewerZoomed(true);
                          }}
                          className="p-2.5 bg-[#171128]/90 hover:bg-violet-600 rounded-full border border-white/10 text-white transition-all cursor-pointer"
                        >
                          <Maximize2 size={15} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => fillEditProduct(p)}
                          className="p-2.5 bg-[#171128]/90 hover:bg-cyan-600 rounded-full border border-white/10 text-white transition-all cursor-pointer"
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* PRODUCT DESCRIPTION LAYERS */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[9px] font-bold tracking-widest text-[#5FD3F4] font-mono uppercase bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/10 inline-block">
                            {p.category || 'Makanan'}
                          </p>
                          <h3 className="font-sans font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors mt-1 line-clamp-1">
                            {p.name}
                          </h3>
                        </div>
                      </div>

                      {/* GLOWING PREMIUM PRICE TAG */}
                      <div className="py-0.5">
                        {hasDiscount ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                              Rp{discountedPrice.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 line-through">
                              Rp{p.price.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            Rp{p.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Realtime stock count metrics */}
                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1.5">
                          <Warehouse size={12} className="text-slate-500" />
                          Stock: <strong className="text-slate-200">{p.stock}</strong>
                        </span>
                        {p.barcode && (
                          <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                            <Barcode size={10} /> {p.barcode.slice(-4)}
                          </span>
                        )}
                      </div>

                      {/* Display variants if exist */}
                      {p.variants && p.variants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {p.variants.slice(0, 3).map((v: string) => (
                            <span key={v} className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-medium font-sans text-slate-300">
                              {v}
                            </span>
                          ))}
                          {p.variants.length > 3 && (
                            <span className="text-[8px] text-slate-500 font-bold self-center">
                              +{p.variants.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* QUICK BUY / RESTOCK / SELL INTERFACES */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2.5">
                        <button 
                          onClick={() => { setSelectedProduct(p); setModalType('buy'); setIsModalOpen(true); playClickSound(); }}
                          className="py-2.5 bg-[#0D1815] border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus size={12}/> RESTOCK
                        </button>
                        <button 
                          disabled={p.stock === 0}
                          onClick={() => { setSelectedProduct(p); setModalType('sell'); setIsModalOpen(true); playClickSound(); }}
                          className="py-2.5 bg-[#1E0911] border border-rose-500/20 hover:border-rose-500/40 text-rose-400 disabled:text-slate-600 disabled:border-slate-800 disabled:bg-slate-900/10 text-[10px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ShoppingCart size={12}/> SELL ITEM
                        </button>
                      </div>

                      {/* THERMAL BARCODE LABEL PRINT ACCESS ACCORDING TO USER REQ */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => printThermalLabel(p)}
                          className="py-2.5 bg-[#1E1145]/45 hover:bg-indigo-600 hover:text-white border border-[#4F39A3]/30 hover:border-indigo-400 text-indigo-300 text-[10px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                          title={language === 'id' ? 'Cetak Single Label' : 'Print Single Label'}
                        >
                          <Printer size={12} /> {language === 'id' ? 'CETAK 1' : 'PRINT 1'}
                        </button>
                        <button
                          onClick={() => { setSelectedProductForPrint(p); setPrintQuantity('5'); setIsPrintModalOpen(true); playClickSound(); }}
                          className="py-2.5 bg-[#112445]/45 hover:bg-cyan-600 hover:text-white border border-[#396fa3]/30 hover:border-cyan-400 text-cyan-300 text-[10px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                          title={language === 'id' ? 'Cetak Banyak Label' : 'Print Multiple Labels'}
                        >
                          <Printer size={12} /> {language === 'id' ? 'MULTI' : 'MULTI'}
                        </button>
                      </div>

                      {/* TRASH & EDIT ACCESS SYSTEM */}
                      <div className="flex gap-1.5 pt-1">
                        <button 
                          onClick={() => downloadQRCode(p.barcode, p.name)}
                          className="flex-1 py-1.5 bg-violet-900/40 hover:bg-violet-800 rounded-lg text-violet-300 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Barcode size={10}/> QR
                        </button>
                        <button 
                          onClick={() => fillEditProduct(p)}
                          className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={10}/> EDIT
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProductForLog(p);
                            setIsLogModalOpen(true);
                            playClickSound();
                          }}
                          className="px-2.5 py-1.5 bg-violet-950/20 border border-violet-900/45 hover:border-violet-500 hover:bg-violet-900/40 rounded-lg text-violet-400 font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                          title="Lihat Histori Stok"
                        >
                          <History size={12}/> LOG
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(language === 'id' ? 'Apakah Anda yakin ingin menghapus produk ini dari database?' : 'Confirm deleting this product form database?')) {
                              handleDeleteProduct(p);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-950/20 border border-rose-950 hover:bg-red-950/40 rounded-lg text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          )}
        </>
      ) : (
        <SalesHistory />
      )}

      {/* QUICK BUY / DISPENSARY TRANSACTIONS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#10061e] border border-violet-500/40 p-6 md:p-8 rounded-[36px] w-full max-w-sm shadow-2xl relative"
          >
            {/* Pulsing indicator */}
            <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black text-slate-200 tracking-wider uppercase">
                {modalType === 'buy' ? 'Add Reserves' : 'Process Checkout'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 whitespace-nowrap overflow-hidden text-ellipsis leading-relaxed">
              Product: <strong className="text-cyan-400 text-sm block">{selectedProduct?.name}</strong>
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {language === 'id' ? 'Jumlah Kuantiitas' : 'Input Quantity'}
                </label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="e.g. 5" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-mono"
                />
              </div>

              {/* Total calculations */}
              {selectedProduct && modalType === 'sell' && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Total Price:</span>
                  <span className="font-bold text-[#5FD3F4] text-sm">
                    Rp{((Number(quantity) || 0) * (selectedProduct.price - (selectedProduct.price * (selectedProduct.discount || 0) / 100))).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex gap-3.5 pt-2">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 bg-[#1B1629] text-xs font-black tracking-widest uppercase rounded-xl hover:bg-[#252035] transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleUpdateStock} 
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 text-white text-xs font-black tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {language === 'id' ? 'KONFIRMASI' : 'TRANSACT'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PRINT MULTIPLE LABELS MODAL */}
      {isPrintModalOpen && selectedProductForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#10061e] border border-violet-500/40 p-6 md:p-8 rounded-[36px] w-full max-w-sm shadow-2xl relative text-slate-100"
          >
            {/* Pulsing indicator */}
            <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-black text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <Printer size={18} className="text-cyan-400" />
                {language === 'id' ? 'Cetak Multi Label' : 'Print Multi Labels'}
              </h3>
              <button 
                onClick={() => setIsPrintModalOpen(false)} 
                className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition duration-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 whitespace-nowrap overflow-hidden text-ellipsis leading-relaxed border-b border-white/5 pb-3">
              Product: <strong className="text-cyan-400 text-sm block mt-1">{selectedProductForPrint?.name}</strong>
            </p>

            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {language === 'id' ? 'Jumlah Cetak Label' : 'Print Quantity'}
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  placeholder="e.g. 10" 
                  value={printQuantity} 
                  onChange={(e) => setPrintQuantity(e.target.value)}
                  className="w-full p-3.5 bg-black/45 border border-white/5 focus:border-cyan-400/40 rounded-xl text-xs text-slate-100 transition-all font-mono"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {['1', '5', '10', '25', '50'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => { playClickSound(); setPrintQuantity(preset); }}
                    className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border transition-all ${
                      printQuantity === preset
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 font-extrabold'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-3.5 pt-2 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)} 
                  className="flex-1 py-3 bg-[#1B1629] text-xs font-black tracking-widest uppercase rounded-xl hover:bg-[#252035] transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    const qty = Number(printQuantity);
                    if (isNaN(qty) || qty <= 0) {
                      showNotification('error', 'Enter valid quantity');
                      return;
                    }
                    if (qty > 100) {
                      showNotification('error', language === 'id' ? 'Maksimal cetak 100 label sekaligus!' : 'Max print limit is 100 labels!');
                      return;
                    }
                    setIsPrintModalOpen(false);
                    await printMultipleThermalLabels(selectedProductForPrint, qty);
                  }} 
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 text-white text-xs font-black tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {language === 'id' ? 'CETAK' : 'PRINT'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* COMPREHENSIVE IMAGE GALLERY VIEWER & POPUP CAROUSEL */}
      <AnimatePresence>
        {isViewerZoomed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center justify-center p-2 rounded-3xl overflow-hidden"
            >
              
              {/* Close handler */}
              <button 
                onClick={() => { playClickSound(); setIsViewerZoomed(false); }}
                className="absolute top-6 right-6 z-50 p-2.5 bg-black/60 border border-white/10 hover:bg-black/80 rounded-full text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Image box with transition slider */}
              <div className="w-full h-[55vh] md:h-[65vh] flex items-center justify-center relative rounded-2xl overflow-hidden bg-black/40">
                {viewerImages && viewerImages.length > 0 ? (
                  <img 
                    src={viewerImages[viewerIndex]} 
                    alt="Master Product Showcase" 
                    className="max-w-full max-h-full object-contain select-none transition-all"
                  />
                ) : (
                  <div className="text-center space-y-2 text-slate-500">
                    <ImageIcon size={48} />
                    <p className="text-xs font-mono">NO PRODUCT ATTACHMENT</p>
                  </div>
                )}

                {/* Left/Right switches if multi exist */}
                {viewerImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => {
                        playClickSound();
                        setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 p-2 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-white cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        playClickSound();
                        setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 p-2 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-white cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Indicator bar slots */}
              {viewerImages.length > 1 && (
                <div className="flex gap-2 mt-4">
                  {viewerImages.map((img, i) => (
                    <button
                      key={img}
                      onClick={() => { playClickSound(); setViewerIndex(i); }}
                      className={`w-16 h-12 rounded-xl border-2 overflow-hidden transition-all ${
                        viewerIndex === i ? 'border-cyan-500 scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Slider item miniature" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STOCK ADJUSTMENTLOGS HISTORIC MODAL */}
      {isLogModalOpen && selectedProductForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b081c] border border-violet-500/35 p-6 md:p-8 rounded-[32px] w-full max-w-lg shadow-[0_0_50px_rgba(139,92,246,0.3)] relative text-slate-100"
          >
            {/* Glowing accent border line */}
            <div className="absolute top-0 inset-x-16 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-pulse" />
            
            <div className="flex justify-between items-start mb-5 pb-3 border-b border-white/5">
              <div>
                <span className="text-[10px] font-mono font-black text-violet-400 uppercase tracking-widest block leading-none">SEJARAH MUTASI STOK / AUDIT LOG</span>
                <h3 className="text-base font-black text-slate-200 mt-1 uppercase tracking-wide">
                  {selectedProductForLog.name}
                </h3>
              </div>
              <button 
                onClick={() => { playClickSound(); setIsLogModalOpen(false); setSelectedProductForLog(null); }}
                className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition duration-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Info Block Summary */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 rounded-2xl text-center border border-white/5">
                <div>
                  <span className="text-[9px] font-mono opacity-50 block tracking-widest">KATEGORI</span>
                  <span className="text-xs font-black text-cyan-400 block leading-tight">{selectedProductForLog.category || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono opacity-50 block tracking-widest">STOK SAAT INI</span>
                  <span className="text-xs font-black text-emerald-400 block leading-tight">{selectedProductForLog.stock} Unit</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono opacity-50 block tracking-widest">SERIAL BARCODE</span>
                  <span className="text-xs font-black text-slate-300 font-mono block leading-tight">{selectedProductForLog.barcode || 'N/A'}</span>
                </div>
              </div>

              {/* Recent logs items */}
              <div>
                <h4 className="text-[10px] font-mono font-black tracking-widest text-[#5FD3F4] mb-2.5 uppercase">GARIS WAKTU HISTORI PERUBAHAN</h4>
                
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(() => {
                    const stockLogsKey = getPartitionedKey('inmarket_stock_logs', true);
                    let allLogs = [];
                    try {
                      allLogs = JSON.parse(localStorage.getItem(stockLogsKey) || '[]');
                    } catch {
                      allLogs = [];
                    }
                    const filteredLogs = Array.isArray(allLogs) ? allLogs.filter((log: any) => log.productId === selectedProductForLog.id) : [];
                    
                    if (filteredLogs.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs opacity-40 italic font-mono border border-dashed border-white/5 rounded-2xl">
                          Belum ada catatan mutasi stok untuk produk ini.
                          <p className="text-[10px] mt-1 pr-1 leading-normal">Lakukan Transaksi Kasir atau penyesuaian stok di atas untuk memulai perekaman.</p>
                        </div>
                      );
                    }

                    return filteredLogs.map((log: any) => {
                      const isSale = log.type === 'SALE';
                      return (
                        <div 
                          key={log.id} 
                          className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[7%] transition duration-150 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 text-[8px] font-mono font-black tracking-wider rounded uppercase leading-none ${
                                isSale 
                                  ? 'bg-rose-500/15 text-rose-400' 
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}>
                                {isSale ? 'KASIR / PENJUALAN' : 'RESTOCK SUPPLIER'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {log.timestamp}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Mutasi: {log.prevStock} → {log.newStock} Unit
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono font-black text-sm block ${isSale ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isSale ? '-' : '+'}{log.qty}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-center leading-normal font-mono border-t border-white/5 pt-3">
                💡 Log dicatat otomatis setiap kali persediaan dideplesi via POS Kasir, ataupun manual melalui panel admin.
              </p>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
