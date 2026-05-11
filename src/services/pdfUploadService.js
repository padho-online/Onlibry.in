// src/services/pdfUploadService.js
// SINGLE VERSION - PDF with watermark, header, footer (same for view & download)

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
const ADMIN_KEY = import.meta.env.VITE_CLOUDFLARE_ADMIN_KEY || 'Habibul@812922112';
const WEBSITE_URL = 'https://Onlibry.in';

// ============================================
// Add Complete Watermark to PDF (Single Version)
// ============================================
async function addWatermarkToPDF(fileBuffer, fileName) {
  console.log('📝 Adding watermark to PDF...');
  
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPages()[i];
    const { width, height } = page.getSize();
    const pageNumber = i + 1;
    
    // ============================================
    // 1. TOP-LEFT STRIP - Full width white header background
    // ============================================
    const headerHeight = 35;
    const headerY = height - headerHeight;
    
    // Draw white background strip that covers the entire header area
    page.drawRectangle({
      x: 0,
      y: headerY,
      width: width,
      height: headerHeight,
      color: rgb(1, 1, 1),
      opacity: 1
    });
    
    // Draw bottom border line for header
    page.drawLine({
      start: { x: 0, y: headerY },
      end: { x: width, y: headerY },
      thickness: 0.8,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    // Header text on left side - NON-CLICKABLE (plain text)
    const headerText = "File from Onlibry .in";
    const headerFontSize = 10;
    const headerPadding = 12;
    
    page.drawText(headerText, {
      x: headerPadding,
      y: headerY + 12,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
      opacity: 1
    });
    
    // ============================================
    // 2. CENTRE WATERMARK - NON-CLICKABLE
    // ============================================
    const watermarkText = 'ONLIBRY';
    const watermarkFontSize = 48;
    const watermarkWidth = boldFont.widthOfTextAtSize(watermarkText, watermarkFontSize);
    
    page.drawText(watermarkText, {
      x: (width - watermarkWidth) / 2,
      y: height / 2 + 15,
      size: watermarkFontSize,
      font: boldFont,
      color: rgb(0.9, 0.3, 0.2),
      opacity: 0.12
    });
    
    // Centre URL text - NON-CLICKABLE (plain text only, no link annotation)
    // Removed https:// to make it non-clickable in most PDF viewers
    const urlText = 'Onlibry .in';
    const urlFontSize = 14;
    const urlWidth = font.widthOfTextAtSize(urlText, urlFontSize);
    
    page.drawText(urlText, {
      x: (width - urlWidth) / 2,
      y: height / 2 - 20,
      size: urlFontSize,
      font: boldFont,
      color: rgb(0.2, 0.6, 0.3),
      opacity: 0.18
    });
    
    // ============================================
    // 3. BOTTOM FOOTER - Full width, Light Green - NON-CLICKABLE
    // ============================================
    const footerHeight = 35;
    const footerY = 0;
    
    page.drawRectangle({
      x: 0,
      y: footerY,
      width: width,
      height: footerHeight,
      color: rgb(0.85, 0.98, 0.85),
      opacity: 1
    });
    
    page.drawLine({
      start: { x: 0, y: footerHeight },
      end: { x: width, y: footerHeight },
      thickness: 0.8,
      color: rgb(0.6, 0.8, 0.6)
    });
    
    // Footer text - NON-CLICKABLE plain text
    const footerText = "Visit Onlibry .in for more educational resources, Books, Materials, Mock Tests & more!";
    const footerFontSize = 10;
    const footerTextWidth = boldFont.widthOfTextAtSize(footerText, footerFontSize);
    
    page.drawText(footerText, {
      x: (width - footerTextWidth) / 2,
      y: 12,
      size: footerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
      opacity: 1
    });
    
    // ============================================
    // 4. PAGE NUMBER - Bottom Right
    // ============================================
    const pageNumberText = `${pageNumber} / ${totalPages}`;
    const pageNumberFontSize = 8;
    const pageNumberWidth = font.widthOfTextAtSize(pageNumberText, pageNumberFontSize);
    
    page.drawText(pageNumberText, {
      x: width - pageNumberWidth - 10,
      y: 6,
      size: pageNumberFontSize,
      font: font,
      color: rgb(0, 0, 0),
      opacity: 0.6
    });
  }
  
  console.log(`✅ Watermark added to ${totalPages} pages`);
  return await pdfDoc.save();
}

// ============================================
// Upload to R2 (Single File)
// ============================================
async function uploadToR2(fileId, pdfBuffer) {
  console.log('📤 Uploading to R2...');
  
  const formData = new FormData();
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `${fileId}.pdf`);
  formData.append('fileId', fileId);
  
  const response = await fetch(`${WORKER_URL}/upload`, {
    method: 'POST',
    headers: { 'X-Admin-Key': ADMIN_KEY },
    body: formData
  });
  
  const result = await response.json();
  console.log('✅ Upload response:', result);
  return result;
}

// ============================================
// Main Export Function - Single Version
// ============================================
export async function uploadPDFWithWatermark(file, metadata) {
  try {
    console.log('🚀 Starting upload with watermark...');
    
    const fileBuffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const cleanFileName = file.name.replace(/\s+/g, '_').replace('.pdf', '');
    const fileId = `${timestamp}_${randomId}_${cleanFileName}`;
    
    console.log('🆔 File ID:', fileId);
    
    // Add watermark to PDF
    const watermarkedPdf = await addWatermarkToPDF(fileBuffer, file.name);
    
    // Upload single file to Cloudflare
    const uploadResult = await uploadToR2(fileId, watermarkedPdf);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }
    
    return {
      success: true,
      fileId: fileId,
      viewUrl: `${WORKER_URL}/view/${fileId}`,
      downloadUrl: `${WORKER_URL}/download/${fileId}`,
      ...uploadResult
    };
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    return { success: false, error: error.message };
  }
}