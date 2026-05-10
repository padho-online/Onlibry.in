// scripts/generate-watermark-pdf.js
// FIXED - rotate issue resolved

import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WORKER_URL = 'https://onlibry.mdhabibul12212141.workers.dev';
const ADMIN_KEY = 'Habibul@812922112';

// Logo path (local file)
const LOGO_PATH = path.join(__dirname, '../src/assets/logo.png');
const WEBSITE_URL = 'https://onlibry.in';

// Footer text
const FOOTER_TEXT = "Visit Onlibry.in for more educational Resources, Books, Materials, Mock Tests etc.";

// ============================================
// Convert image to base64 for embedding
// ============================================
async function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.log('⚠️ Image read error:', error.message);
    return null;
  }
}

// ============================================
// Add watermark to PDF (logo + footer)
// ============================================
async function addWatermarkToPDF(inputPdfBytes, fileName) {
  console.log('📝 Adding watermark to PDF...');
  
  const pdfDoc = await PDFDocument.load(inputPdfBytes);
  const totalPages = pdfDoc.getPageCount();
  console.log(`📄 Total pages: ${totalPages}`);
  
  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Load logo image
  let logoImage = null;
  try {
    const logoBase64 = await imageToBase64(LOGO_PATH);
    if (logoBase64) {
      logoImage = await pdfDoc.embedPng(logoBase64);
      console.log('✅ Logo loaded successfully');
    }
  } catch (error) {
    console.log('⚠️ Logo not found, using text fallback');
  }
  
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPages()[i];
    const { width, height } = page.getSize();
    
    // ============================================
    // 1. CENTER WATERMARK (Logo)
    // ============================================
    const logoWidth = 100;
    const logoHeight = 100;
    const logoX = (width - logoWidth) / 2;
    const logoY = (height - logoHeight) / 2;
    
    if (logoImage) {
      page.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
        opacity: 0.15
      });
      
      // Add URL text below logo
      page.drawText('Onlibry.in', {
        x: (width - 80) / 2,
        y: logoY - 15,
        size: 36,
        font: boldFont,
        color: rgb(0.2, 0.6, 0.3),
        opacity: 0.3
      });
    } else {
      // Fallback text logo
      page.drawText('ONLIBRY', {
        x: (width - 100) / 2,
        y: height / 2 + 20,
        size: 36,
        font: boldFont,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.2
      });
      
      page.drawText('Onlibry.in', {
        x: (width - 80) / 2,
        y: height / 2 - 20,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.6, 0.3),
        opacity: 0.3
      });
    }
    
    // ============================================
    // 2. FOOTER WATERMARK (White background)
    // ============================================
    const footerHeight = 40;
    const footerY = 20;
    
    // Draw white background for footer
    page.drawRectangle({
      x: 0,
      y: footerY - 5,
      width: width,
      height: footerHeight,
      color: rgb(1, 1, 1),
      opacity: 0.95
    });
    
    // Draw footer text
    page.drawText(FOOTER_TEXT, {
      x: 50,
      y: footerY + 15,
      size: 16,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
      opacity: 0.8
    });
    
    // Draw separator line above footer
    page.drawLine({
      start: { x: 30, y: footerY + footerHeight - 5 },
      end: { x: width - 30, y: footerY + footerHeight - 5 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    });
  }
  
  console.log(`✅ Watermark added to ${totalPages} pages`);
  return await pdfDoc.save();
}

// ============================================
// Generate Preview PDF (First 3 pages only)
// ============================================
async function generatePreviewPDF(inputPdfBytes) {
  console.log('📝 Generating preview PDF (first 3 pages)...');
  
  const pdfDoc = await PDFDocument.load(inputPdfBytes);
  const totalPages = pdfDoc.getPageCount();
  const pagesToKeep = Math.min(totalPages, 3);
  
  // Create new document with only first 3 pages
  const newPdfDoc = await PDFDocument.create();
  const pages = await newPdfDoc.copyPages(pdfDoc, [...Array(pagesToKeep).keys()]);
  pages.forEach(page => newPdfDoc.addPage(page));
  
  // Add "PREVIEW ONLY" watermark
  const font = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  for (let i = 0; i < pagesToKeep; i++) {
    const page = newPdfDoc.getPages()[i];
    const { width, height } = page.getSize();
    
    // 🔥 FIXED: Use degrees() function for rotation
    page.drawText('PREVIEW ONLY-Onlibry.in', {
      x: width / 2 - 80,
      y: height / 2,
      size: 30,
      font: font,
      color: rgb(0.9, 0.3, 0.2),
      opacity: 0.25,
      rotate: degrees(-25)
    });
    
    // Footer with warning
    page.drawText('This is a preview. Full version available on Onlibry.in', {
      x: 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.2, 0.2),
      opacity: 0.7
    });
  }
  
  console.log(`✅ Preview PDF generated (${pagesToKeep} pages)`);
  return await newPdfDoc.save();
}

// ============================================
// Upload to R2 via Worker
// ============================================
async function uploadToR2(fileId, cleanPdf, previewPdf, downloadPdf) {
  console.log('📤 Uploading to R2 via Worker...');
  
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
// Generate Complete PDF Package
// ============================================
async function generateAndUploadPDFs(inputPdfBytes, fileId, fileName) {
  console.log('🚀 Starting PDF generation for:', fileName);
  console.log('📁 File ID:', fileId);
  
  try {
    // 1. Save clean.pdf (original)
    const cleanPdf = inputPdfBytes;
    console.log('✅ Clean PDF ready');
    
    // 2. Generate preview.pdf (first 3 pages only)
    const previewPdf = await generatePreviewPDF(inputPdfBytes);
    
    // 3. Generate download.pdf (with watermark)
    const downloadPdf = await addWatermarkToPDF(inputPdfBytes, fileName);
    
    // 4. Upload to R2
    const uploadResult = await uploadToR2(fileId, cleanPdf, previewPdf, downloadPdf);
    
    console.log('🎉 All done!');
    return uploadResult;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// ============================================
// CLI USAGE
// ============================================
const filePath = process.argv[2];
const fileId = process.argv[3];

console.log('========================================');
console.log('📚 Onlibry PDF Watermark Generator');
console.log('========================================');
console.log('');

if (!filePath) {
  console.error('❌ Usage: node generate-watermark-pdf.js <file-path> [file-id]');
  console.error('📖 Example: node generate-watermark-pdf.js ./book.pdf my-book-001');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

console.log('📄 Input file:', filePath);
console.log('📏 File size:', (fs.statSync(filePath).size / 1024).toFixed(2), 'KB');
console.log('');

const inputPdfBytes = fs.readFileSync(filePath);
const finalFileId = fileId || `book_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
const fileName = path.basename(filePath, '.pdf');

console.log('🆔 Final File ID:', finalFileId);
console.log('📛 File Name:', fileName);
console.log('');

generateAndUploadPDFs(inputPdfBytes, finalFileId, fileName)
  .then(result => {
    console.log('');
    console.log('========================================');
    console.log('✅ SUCCESS!');
    console.log('========================================');
    console.log('📖 View URL:', `${WORKER_URL}/view/${finalFileId}`);
    console.log('⬇️ Download URL:', `${WORKER_URL}/download/${finalFileId}`);
    console.log('========================================');
  })
  .catch(err => {
    console.error('');
    console.error('========================================');
    console.error('❌ FAILED:', err.message);
    console.error('========================================');
    process.exit(1);
  });