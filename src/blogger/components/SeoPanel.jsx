// src/blogger/components/SeoPanel.jsx

import React, { useState } from 'react';
import { Globe, Search, Image as ImageIcon, Hash, Eye } from 'lucide-react';

const SeoPanel = ({ meta, onUpdate, previewUrl }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (field, value) => {
    onUpdate({ ...meta, [field]: value });
  };

  const generateSlug = () => {
    if (meta.title) {
      const slug = meta.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      handleChange('slug', slug);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Search size={18} className="text-green-600" />
          SEO Settings
        </h3>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-green-600 hover:underline flex items-center gap-1"
        >
          <Eye size={14} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Meta Title</label>
          <input
            type="text"
            value={meta.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Blog post title"
          />
          <p className="text-xs text-gray-400 mt-1">
            {60 - (meta.title?.length || 0)} characters remaining
          </p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            <Hash size={14} /> Slug / URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={meta.slug || ''}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
              placeholder="auto-generated-from-title"
            />
            <button
              onClick={generateSlug}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Meta Description</label>
          <textarea
            value={meta.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            placeholder="Brief description for search engines"
          />
          <p className="text-xs text-gray-400 mt-1">
            {160 - (meta.description?.length || 0)} characters remaining
          </p>
        </div>

        {/* OG Image */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            <ImageIcon size={14} /> OG Image URL
          </label>
          <input
            type="text"
            value={meta.ogImage || ''}
            onChange={(e) => handleChange('ogImage', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="https://onlibry.in/images/og-image.jpg"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input
            type="text"
            value={meta.tags || ''}
            onChange={(e) => handleChange('tags', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="javascript, react, web development"
          />
        </div>
      </div>

      {/* Google Search Preview */}
      {showPreview && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Google Search Preview</h4>
          <div className="space-y-1">
            <div className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
              {meta.title || 'Blog Post Title'}
            </div>
            <div className="text-green-700 text-sm">
              {previewUrl || 'https://onlibry.in/blog/'}{meta.slug || 'blog-post'}
            </div>
            <div className="text-gray-600 text-sm line-clamp-2">
              {meta.description || 'This is where your meta description will appear in search results.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoPanel;