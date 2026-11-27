import { uploadImage } from '../services/blogService';
import '../styles/blogger.css';
// src/blogger/components/SeoPanel.jsx

import React, { useState, useRef } from 'react';
import { Globe, Search, Image as ImageIcon, Hash, Eye } from 'lucide-react';

const SeoPanel = ({ meta, onUpdate, previewUrl }) => {
  const [showPreview, setShowPreview] = useState(false);

  const latest=useRef(meta);latest.current=meta;
  const busy=useRef(false);const [uploading,setUploading]=useState(false),[uploadError,setUploadError]=useState('');
  const upload=async(file)=>{if(!file||busy.current)return;if(!/^image\/(png|jpeg|gif|webp|avif)$/.test(file.type)||file.size>5*1024*1024){setUploadError('Choose a supported image up to 5 MB.');return}busy.current=true;setUploading(true);setUploadError('');try{const result=await uploadImage(file);if(!result.success||!/^https:\/\//i.test(result.url||''))throw Error(result.error||'Upload failed');onUpdate({...latest.current,ogImage:result.url})}catch(e){setUploadError(e.message)}finally{busy.current=false;setUploading(false)}};
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
            onPaste={e=>{const file=Array.from(e.clipboardData.items).find(i=>i.kind==='file'&&i.type.startsWith('image/'))?.getAsFile();if(file){e.preventDefault();upload(file)}}}
            onChange={(e) => handleChange('ogImage', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="https://onlibry.in/images/og-image.jpg"
          />
          <div className="flex flex-wrap gap-2 mt-2"><label className="border rounded px-3 py-2 text-sm cursor-pointer">Upload image<input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" disabled={uploading} className="sr-only" onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/></label><button type="button" disabled={uploading} className="border rounded px-3 py-2 text-sm" onClick={async()=>{try{const items=await navigator.clipboard.read();for(const item of items){const type=item.types.find(t=>t.startsWith('image/'));if(type){const blob=await item.getType(type);await upload(new File([blob],'clipboard-image',{type}));return}}setUploadError('No image in clipboard.')}catch{setUploadError('Clipboard permission unavailable. Focus the URL field and paste directly.')}}}>Paste image</button></div><p role="status" className="text-xs">{uploading?'Uploading image…':uploadError}</p>
          {meta.ogImage && <img src={meta.ogImage} alt="OG image preview" className="blog-featured" />}
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