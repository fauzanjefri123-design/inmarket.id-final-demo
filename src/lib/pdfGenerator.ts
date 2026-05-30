import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface SaleItem {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptData {
  id: string;
  cashier: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  cashReceived: number;
  change: number;
  membershipDiscount?: number;
  promoDiscount?: number;
  promoCode?: string | null;
}

export const generateReceiptPDF = (data: ReceiptData, storeName: string = 'InMarket.id') => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Receipt paper size (80mm width)
  }) as any;

  const margin = 5;
  const width = 80;
  let cursorY = 10;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName.toUpperCase(), width / 2, cursorY, { align: 'center' });
  
  cursorY += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Business Operating System', width / 2, cursorY, { align: 'center' });
  
  cursorY += 4;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, cursorY, width - margin, cursorY);
  
  // Receipt Info
  cursorY += 6;
  doc.text(`No. Struk: #${data.id.slice(-6).toUpperCase()}`, margin, cursorY);
  cursorY += 4;
  doc.text(`Kasir: ${data.cashier}`, margin, cursorY);
  cursorY += 4;
  doc.text(`Waktu: ${new Date(data.date).toLocaleString()}`, margin, cursorY);
  
  cursorY += 4;
  doc.line(margin, cursorY, width - margin, cursorY);
  
  // Items Table
  cursorY += 2;
  const tableData = data.items.map(item => [
    item.name,
    `${item.qty}x`,
    (item.price * item.qty).toLocaleString()
  ]);

  doc.autoTable({
    startY: cursorY,
    margin: { left: margin, right: margin },
    tableWidth: width - (margin * 2),
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 20, halign: 'right' }
    },
    didDrawPage: (d: any) => {
      cursorY = d.cursor.y;
    }
  });

  cursorY += 4;
  doc.line(margin, cursorY, width - margin, cursorY);
  
  // Footer Totals
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', margin, cursorY);
  doc.text(`Rp ${data.subtotal.toLocaleString()}`, width - margin, cursorY, { align: 'right' });
  
  if (data.membershipDiscount && data.membershipDiscount > 0) {
    cursorY += 4;
    doc.text('Disc Member', margin, cursorY);
    doc.text(`-Rp ${data.membershipDiscount.toLocaleString()}`, width - margin, cursorY, { align: 'right' });
  }
  
  if (data.promoDiscount && data.promoDiscount > 0) {
    cursorY += 4;
    doc.text(`Promo (${data.promoCode})`, margin, cursorY);
    doc.text(`-Rp ${data.promoDiscount.toLocaleString()}`, width - margin, cursorY, { align: 'right' });
  }

  cursorY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL BILL', margin, cursorY);
  doc.text(`Rp ${data.total.toLocaleString()}`, width - margin, cursorY, { align: 'right' });
  
  cursorY += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Metode Bayar', margin, cursorY);
  doc.text(data.paymentMethod, width - margin, cursorY, { align: 'right' });
  
  cursorY += 4;
  doc.text('Tunai Diterima', margin, cursorY);
  doc.text(`Rp ${data.cashReceived.toLocaleString()}`, width - margin, cursorY, { align: 'right' });
  
  cursorY += 4;
  doc.text('Kembalian', margin, cursorY);
  doc.text(`Rp ${data.change.toLocaleString()}`, width - margin, cursorY, { align: 'right' });
  
  cursorY += 10;
  doc.setFont('helvetica', 'italic');
  doc.text('Terima kasih atas kunjungan Anda!', width / 2, cursorY, { align: 'center' });
  cursorY += 4;
  doc.text('Powered by InMarket.id', width / 2, cursorY, { align: 'center' });

  // Save the PDF
  doc.save(`Receipt_${data.id.slice(-6).toUpperCase()}.pdf`);
};
