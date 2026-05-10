// src/services/downloadService.js
// PHASE 7 - Fixed filename format: Onlibry.in_"actual_name"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

const functions = getFunctions(app);

// Call cloud function to get secure download URL
export async function requestSecureDownload(fileId) {
  try {
    const downloadFileFn = httpsCallable(functions, 'downloadFile');
    const result = await downloadFileFn({ fileId });
    return result.data;
  } catch (error) {
    console.error('Download request failed:', error);
    throw error;
  }
}

// Trigger actual download with proper filename format
export function triggerDownload(downloadUrl, fileName) {
  try {
    // Format filename: Onlibry.in_"actual_name"
    let formattedFileName = fileName;
    if (fileName && !fileName.startsWith('Onlibry.in')) {
      formattedFileName = `Onlibry.in_"${fileName}"`;
    }
    
    // Create hidden anchor and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = formattedFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Trigger download error:', error);
    // Fallback: open in new window
    window.open(downloadUrl, '_blank');
  }
}

// Direct download with filename formatting
export async function downloadFile(downloadUrl, fileName) {
  try {
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Onlibry.in_"${fileName}"`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}