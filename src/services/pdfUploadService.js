// src/services/pdfUploadService.js
// COMPLETE - PDF upload with 3 versions
// - Preview PDF: diagonal watermark, footer
// - Download PDF: top-right strip, bottom footer, page numbers, centre watermark

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const WORKER_URL = 'https://onlibry.mdhabibul12212141.workers.dev';
const ADMIN_KEY = 'Habibul@812922112';

// ============================================
// Generate Preview PDF (First 3 pages only)
// ============================================
async function generatePreviewPDF(fileBuffer) {
  console.log('📝 Generating preview PDF (first 3 pages)...');
  
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();
  const pagesToKeep = Math.min(totalPages, 3);
  
  const newPdfDoc = await PDFDocument.create();
  const pages = await newPdfDoc.copyPages(pdfDoc, [...Array(pagesToKeep).keys()]);
  pages.forEach(page => newPdfDoc.addPage(page));
  
  const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  for (let i = 0; i < pagesToKeep; i++) {
    const page = newPdfDoc.getPages()[i];
    const { width, height } = page.getSize();
    const footerHeight = 40;
    const footerY = 0;
    
    // =========================
    // WATERMARK
    // =========================
    page.drawText('PREVIEW ONLY', {
      x: width / 2 - 130,
      y: height / 2,
      size: 32,
      font: boldFont,
      color: rgb(0.9, 0.3, 0.2),
      opacity: 0.22,
      rotate: degrees(-25)
    });
    
    // =========================
    // FOOTER BACKGROUND
    // =========================
    page.drawRectangle({
      x: 0,
      y: footerY,
      width: width,
      height: footerHeight,
      color: rgb(0.85, 0.98, 0.85),
      opacity: 1
    });
    
    // =========================
    // TOP BORDER LINE
    // =========================
    page.drawLine({
      start: { x: 0, y: footerHeight },
      end: { x: width, y: footerHeight },
      thickness: 1,
      color: rgb(0.6, 0.8, 0.6)
    });
    
    // =========================
    // FOOTER TEXT
    // =========================
    const footerText = 'This is a preview. Full version available on Onlibry.in';
    const footerFontSize = 14;
    const textWidth = boldFont.widthOfTextAtSize(footerText, footerFontSize);
    
    page.drawText(footerText, {
      x: (width - textWidth) / 2,
      y: 13,
      size: footerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
      opacity: 1
    });
  }
  
  console.log(`✅ Preview PDF generated (${pagesToKeep} pages)`);
  return await newPdfDoc.save();
}

// ============================================
// Add Complete Watermark to Download PDF
// ============================================
async function addWatermarkToPDF(fileBuffer, fileName) {
  console.log('📝 Adding watermark to PDF (download version)...');
  
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPages()[i];
    const { width, height } = page.getSize();
    const pageNumber = i + 1;
    
    // ============================================
    // 1. TOP-RIGHT STRIP - Light Orange
    // ============================================
    const stripText = "File downloaded from Onlibry.in";
    const stripFontSize = 9;
    const textWidth = boldFont.widthOfTextAtSize(stripText, stripFontSize);
    const stripPadding = 12;
    const stripWidth = textWidth + stripPadding * 2;
    const stripHeight = 22;
    const stripX = width - stripWidth - 8;
    const stripY = height - stripHeight - 8;
    
    // Draw light orange background
    page.drawRectangle({
      x: stripX,
      y: stripY,
      width: stripWidth,
      height: stripHeight,
      color: rgb(1, 0.85, 0.7),
      opacity: 1
    });
    
    // Draw text on strip (centered)
    page.drawText(stripText, {
      x: stripX + stripPadding,
      y: stripY + 6,
      size: stripFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
      opacity: 1
    });
    
    // ============================================
    // 2. CENTRE WATERMARK
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
    
    const urlText = 'onlibry.in';
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
    // 3. BOTTOM FOOTER - Full width, Light Green
    // ============================================
    const footerHeight = 35;
    const footerY = 0;
    
    // Draw light green background
    page.drawRectangle({
      x: 0,
      y: footerY,
      width: width,
      height: footerHeight,
      color: rgb(0.85, 0.98, 0.85),
      opacity: 1
    });
    
    // Draw top border line
    page.drawLine({
      start: { x: 0, y: footerHeight },
      end: { x: width, y: footerHeight },
      thickness: 0.8,
      color: rgb(0.6, 0.8, 0.6)
    });
    
    // Draw footer text
    const footerText = "Visit Onlibry.in for more educational resources, Books, Materials, Mock Tests & more!";
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
// Upload to R2
// ============================================
async function uploadToR2(fileId, cleanPdf, previewPdf, downloadPdf) {
  console.log('📤 Uploading to R2...');
  
  const formData = new FormData();
  formData.append('clean', new Blob([cleanPdf], { type: 'application/pdf' }), 'clean.pdf');
  formData.append('preview', new Blob([previewPdf], { type: 'application/pdf' }), 'preview.pdf');
  formData.append('download', new Blob([downloadPdf], { type: 'application/pdf' }), 'download.pdf');
  formData.append('fileId', fileId);
  
  const response = await fetch(`${WORKER_URL}/upload-multi`, {
    method: 'POST',
    headers: { 'X-Admin-Key': ADMIN_KEY },
    body: formData
  });
  
  const result = await response.json();
  console.log('✅ Upload response:', result);
  return result;
}

// ============================================
// Main Export Function
// ============================================
export async function uploadPDFWithVersions(file, metadata) {
  try {
    console.log('🚀 Starting upload...');
    
    const fileBuffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const cleanFileName = file.name.replace(/\s+/g, '_').replace('.pdf', '');
    const fileId = `${timestamp}_${randomId}_${cleanFileName}`;
    
    console.log('🆔 File ID:', fileId);
    
    const previewPdf = await generatePreviewPDF(fileBuffer);
    const downloadPdf = await addWatermarkToPDF(fileBuffer, file.name);
    const cleanPdf = fileBuffer;
    
    const uploadResult = await uploadToR2(fileId, cleanPdf, previewPdf, downloadPdf);
    
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