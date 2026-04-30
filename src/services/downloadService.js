// src/services/downloadService.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

// Get functions instance with region
const functions = getFunctions(app);
// For local emulator:
// const functions = getFunctions(app, 'asia-south1');

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

// Trigger actual download
export function triggerDownload(downloadUrl, fileName) {
  try {
    // Create hidden anchor and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download';
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