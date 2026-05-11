// src/blogger/components/ImageUploader.jsx

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Copy } from 'lucide-react';

const ImageUploader = ({ onUpload, onClose, multiple = false }) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  // Upload image to Cloudflare R2 or use base64
  const uploadImage = async (file) => {
    // For now, use base64 (works without backend)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      try {
        const imageUrl = await uploadImage(file);
        setImages(prev => [...prev, { url: imageUrl, name: file.name }]);
        onUpload?.(imageUrl);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
  };

  const insertImageToEditor = (url) => {
    onUpload?.(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Upload Images</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <div className="flex flex-col items-center">
              {uploading ? (
                <Loader2 size={32} className="animate-spin text-green-600" />
              ) : (
                <Upload size={32} className="text-gray-400" />
              )}
              <p className="mt-2 text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Click or drag to upload images'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              multiple={multiple}
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                <div className="p-2 flex justify-between items-center">
                  <button
                    onClick={() => insertImageToEditor(img.url)}
                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Insert
                  </button>
                  <button
                    onClick={() => copyToClipboard(img.url)}
                    className="text-xs text-gray-500 hover:text-green-600"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {images.length === 0 && !uploading && (
            <div className="text-center py-8 text-gray-400">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No images uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;