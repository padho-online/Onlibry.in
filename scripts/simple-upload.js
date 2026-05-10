// scripts/simple-upload.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_URL = 'https://onlibry.mdhabibul12212141.workers.dev';
const ADMIN_KEY = 'Habibul@812922112';

async function uploadPDF(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, fileName);
    
    console.log('📤 Uploading PDF...');
    
    const response = await fetch(`${WORKER_URL}/upload`, {
      method: 'POST',
      headers: { 'X-Admin-Key': ADMIN_KEY },
      body: formData
    });
    
    const result = await response.json();
    console.log('✅ Upload Complete');
    console.log(result);
    
    return result;
  } catch (err) {
    console.error('❌ Upload failed:', err);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node scripts/simple-upload.js yourfile.pdf');
  process.exit(1);
}

uploadPDF(filePath);