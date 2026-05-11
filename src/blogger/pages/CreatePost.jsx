// src/blogger/pages/CreatePost.jsx - Fix publish function

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Editor from '../components/Editor';
import SeoPanel from '../components/SeoPanel';
import PublishPanel from '../components/PublishPanel';
import ImageUploader from '../components/ImageUploader';
import { generateSlug, generateReadingTime } from '../utils/generateSlug';
import { createBlogPost } from '../services/blogService';

function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    slug: '',
    ogImage: '',
    tags: '',
  });

  const handlePublish = async (postData) => {
    if (!user) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!content.trim()) {
      alert('Please enter content');
      return;
    }

    setIsSaving(true);
    try {
      const finalSlug = meta.slug || generateSlug(title);
      const readingTime = generateReadingTime(content);
      
      const newPost = {
        title: title.trim(),
        content: content,
        slug: finalSlug,
        meta: {
          title: meta.title || title,
          description: meta.description || content.substring(0, 160).replace(/<[^>]*>/g, ''),
          ogImage: meta.ogImage || '',
          tags: meta.tags || '',
        },
        readingTime: { text: `${readingTime} min read`, minutes: readingTime },
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email,
        status: postData.status,
        publishedAt: postData.status === 'published' ? new Date().toISOString() : null,
        scheduledFor: postData.scheduledFor || null,
      };

      console.log('📝 Publishing post:', newPost);
      
      const result = await createBlogPost(newPost);
      
      if (result.success) {
        alert('✅ Post published successfully!');
        navigate('/blog/dashboard');
      } else {
        alert('❌ Failed to publish: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async (draftData) => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const finalSlug = meta.slug || generateSlug(title);
      const readingTime = generateReadingTime(content);
      
      const draftPost = {
        title: title.trim(),
        content: content,
        slug: finalSlug,
        meta: {
          title: meta.title || title,
          description: meta.description || content.substring(0, 160).replace(/<[^>]*>/g, ''),
          ogImage: meta.ogImage || '',
          tags: meta.tags || '',
        },
        readingTime: { text: `${readingTime} min read`, minutes: readingTime },
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email,
        status: 'draft',
        publishedAt: null,
      };

      const result = await createBlogPost(draftPost);
      
      if (result.success) {
        alert('✅ Draft saved successfully!');
        navigate('/blog/dashboard');
      } else {
        alert('❌ Failed to save draft: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/blog/dashboard')} className="text-gray-600 hover:text-gray-800">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-800">Create New Post</h1>
        </div>
      </div>

      {/* Title */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title..."
          className="w-full text-3xl md:text-4xl font-bold border-none outline-none bg-transparent placeholder-gray-300"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Editor content={content} onChange={setContent} placeholder="Write your blog post here..." />
          </div>
          <div className="space-y-6">
            <SeoPanel meta={meta} onUpdate={setMeta} previewUrl="https://onlibry.in/blog/" />
            <PublishPanel
              post={{ title, content, status: 'draft' }}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>

      {/* Image Uploader */}
      {showImageUploader && (
        <ImageUploader onClose={() => setShowImageUploader(false)} />
      )}
    </div>
  );
}

export default CreatePost;