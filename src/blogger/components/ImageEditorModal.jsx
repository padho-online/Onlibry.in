// src/blogger/components/ImageEditorModal.jsx
// Image Editor with Pixel Control + Live Preview + Apply

import React, { useState, useEffect } from 'react';
import { X, Check, Crop, Maximize, Minus, Plus, RefreshCw } from 'lucide-react';

const ImageEditorModal = ({ imageUrl, onSave, onClose }) => {
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(600 / 400);
  const [previewSize, setPreviewSize] = useState({ w: 600, h: 400 });
  const [loading, setLoading] = useState(true);

  // Calculate aspect ratio when image loads
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      setAspectRatio(naturalWidth / naturalHeight);
      setWidth(naturalWidth > 800 ? 800 : naturalWidth);
      setHeight(Math.round((naturalWidth > 800 ? 800 : naturalWidth) / aspectRatio));
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update preview when width/height changes
  useEffect(() => {
    setPreviewSize({ w: width, h: height });
  }, [width, height]);

  const handleWidthChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setWidth(val);
    if (maintainAspect && val > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setHeight(val);
    if (maintainAspect && val > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handleApply = () => {
    // Generate HTML with exact dimensions
    const imgHtml = `
      <div style="margin: 16px 0; text-align: center;">
        <img 
          src="${imageUrl}" 
          width="${width}" 
          height="${height}" 
          alt="Image" 
          style="width: ${width}px; height: ${height}px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
        />
      </div>
    `;
    onSave(imgHtml);
    onClose();
  };

  const resetToOriginal = () => {
    const img = new Image();
    img.onload = () => {
      setWidth(img.naturalWidth > 800 ? 800 : img.naturalWidth);
      setHeight(Math.round((img.naturalWidth > 800 ? 800 : img.naturalWidth) / aspectRatio));
    };
    img.src = imageUrl;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-8 text-center">
          <RefreshCw size={48} className="animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Crop size={20} className="text-green-600" />
            <h3 className="text-lg font-semibold">Image Editor</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              {/* Dimensions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Dimensions (Pixels)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Width</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={width}
                        onChange={handleWidthChange}
                        min="50"
                        max="2000"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Height</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={height}
                        onChange={handleHeightChange}
                        min="50"
                        max="2000"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Maintain Aspect Ratio</label>
                  <button
                    onClick={() => setMaintainAspect(!maintainAspect)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      maintainAspect
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {maintainAspect ? '✅ ON' : 'OFF'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {maintainAspect
                    ? `Aspect ratio: ${aspectRatio.toFixed(2)}:1`
                    : 'Free resize mode'}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Quick Presets</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Small', w: 300, h: 200 },
                    { label: 'Medium', w: 600, h: 400 },
                    { label: 'Large', w: 800, h: 533 },
                    { label: 'Full', w: 1200, h: 800 },
                    { label: 'Square', w: 500, h: 500 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setWidth(preset.w);
                        if (maintainAspect) {
                          setHeight(Math.round(preset.w / aspectRatio));
                        } else {
                          setHeight(preset.h);
                        }
                      }}
                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={resetToOriginal}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Reset Original
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                >
                  <Check size={16} /> Apply
                </button>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Live Preview</h4>
              <div
                className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
                style={{
                  minHeight: '300px',
                  maxHeight: '500px',
                }}
              >
                {width > 0 && height > 0 ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: width > 800 ? '100%' : `${width}px`,
                      height: height > 533 ? 'auto' : `${height}px`,
                      maxWidth: '100%',
                      maxHeight: '500px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                ) : (
                  <p className="text-gray-400">Invalid dimensions</p>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400 text-center">
                Preview Size: {width} × {height} px
                {width > 800 && ' (scaled to fit)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;