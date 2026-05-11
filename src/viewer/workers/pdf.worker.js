// src/viewer/workers/pdf.worker.js
// PDF.js worker configuration

import { GlobalWorkerOptions } from 'pdfjs-dist';

// Use CDN worker for better performance
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// For production self-hosted:
// GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

export default GlobalWorkerOptions;