// src/blogger/components/ImageUploader.jsx
// Fixed with Edit support and size control

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle, Edit2 } from 'lucide-react';
import { uploadImage } from '../services/blogService';

const ImageUploader = ({ onUpload, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('medium');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size: 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    
    try {
      console.log('📤 Starting upload:', file.name, file.size);
      const result = await uploadImage(file);
      console.log('📤 Upload result:', result);
      
      if (result.success) {
        setUploadedImages(prev => [...prev, { url: result.url, name: file.name }]);
        setError(null);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error in component:', error);
      setError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const insertImage = (url) => {
    // Pass to parent with size
    if (onUpload) {
      onUpload(url, selectedSize);
    }
    onClose();
  };

  const editImage = (url) => {
    // Pass to parent for editing
    if (onUpload) {
      onUpload(url);
    }
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

        {/* Error display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Upload Error</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-200">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <div className="flex flex-col items-center">
              {uploading ? (
                <Loader2 size={32} className="animate-spin text-green-600" />
              ) : (
                <Upload size={32} className="text-gray-400" />
              )}
              <p className="mt-2 text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Click to select image'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect} 
              disabled={uploading} 
            />
          </label>
        </div>

        {/* Size Selection */}
        {uploadedImages.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <label className="text-sm font-medium block mb-1">Image Size</label>
            <div className="flex gap-2">
              {['small', 'medium', 'large', 'full'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedSize === size
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="font-medium mb-3">Uploaded Images</h4>
          <div className="grid grid-cols-2 gap-4">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                <div className="p-2 flex gap-2">
                  <button
                    onClick={() => insertImage(img.url)}
                    className="flex-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center justify-center gap-1"
                  >
                    <Check size={12} /> Insert
                  </button>
                  <button
                    onClick={() => editImage(img.url)}
                    className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          {uploadedImages.length === 0 && !uploading && (
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