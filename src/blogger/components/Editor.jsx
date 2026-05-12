// src/blogger/pages/EditPost.jsx
// ✅ FIXED: Post not found issue

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBlogPostById, updateBlogPost } from '../services/blogService';
import HtmlEditor from '../components/HtmlEditor';
import SeoPanel from '../components/SeoPanel';
import PublishPanel from '../components/PublishPanel';

function EditPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPost();
  }, [id, user]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📝 Loading post with ID:', id);
      console.log('📝 ID type:', typeof id);
      console.log('📝 ID length:', id?.length);
      
      if (!id || id === 'undefined' || id === 'null') {
        setError('Invalid post ID');
        setLoading(false);
        return;
      }
      
      const data = await getBlogPostById(id);
      console.log('📝 Loaded post data:', data);
      
      if (data) {
        setPost(data);
        setTitle(data.title || '');
        setContent(data.content || '');
        setMeta(data.meta || {});
      } else {
        setError('Post not found. The post may have been deleted or the ID is invalid.');
        console.error('❌ Post not found with ID:', id);
      }
    } catch (error) {
      console.error('❌ Load post error:', error);
      setError('Failed to load post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (postData) => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        title: title.trim(),
        content: content,
        meta: meta,
        status: postData.status,
        updatedAt: new Date().toISOString(),
      };

      if (postData.status === 'published' && !post?.publishedAt) {
        updates.publishedAt = new Date().toISOString();
      }

      console.log('📝 Updating post:', id, updates);
      const result = await updateBlogPost(id, updates);
      console.log('📝 Update result:', result);

      if (result.success) {
        alert('✅ Post updated successfully!');
        navigate('/blog/dashboard');
      } else {
        alert('❌ Update failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      alert('Failed to update post: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ {error}</h1>
        <p className="text-gray-500 mb-6">The post you're trying to edit doesn't exist or has been deleted.</p>
        <button 
          onClick={() => navigate('/blog/dashboard')}
          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
        <p className="text-gray-500 mb-6">The post you're trying to edit doesn't exist.</p>
        <button 
          onClick={() => navigate('/blog/dashboard')}
          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/blog/dashboard')} className="text-gray-600 hover:text-gray-800">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-800">Edit Post</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title..."
          className="w-full text-3xl md:text-4xl font-bold border-none outline-none bg-transparent"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HtmlEditor content={content} onChange={setContent} />
          </div>
          <div className="space-y-6">
            <SeoPanel meta={meta} onUpdate={setMeta} previewUrl="https://onlibry.in/blog/" />
            <PublishPanel
              post={post}
              onPublish={handleUpdate}
              onSaveDraft={() => handleUpdate({ status: 'draft' })}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPost;