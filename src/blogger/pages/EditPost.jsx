// src/blogger/pages/EditPost.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBlogPostById, updateBlogPost } from '../services/blogService';
import Editor from '../components/Editor';
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPost();
  }, [id, user]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await getBlogPostById(id);
      if (data) {
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setMeta(data.meta || {});
        console.log('📝 Loaded post:', data);
      } else {
        alert('Post not found');
        navigate('/blog/dashboard');
      }
    } catch (error) {
      console.error('Load post error:', error);
      alert('Failed to load post');
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
      
      if (postData.status === 'published' && !post.publishedAt) {
        updates.publishedAt = new Date().toISOString();
      }

      const result = await updateBlogPost(id, updates);
      
      if (result.success) {
        alert('✅ Post updated successfully!');
        navigate('/blog/dashboard');
      } else {
        alert('❌ Update failed: ' + result.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/blog/dashboard')} className="text-gray-600 hover:text-gray-800">← Dashboard</button>
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
            <Editor content={content} onChange={setContent} />
          </div>
          <div className="space-y-6">
            <SeoPanel meta={meta} onUpdate={setMeta} previewUrl="https://onlibry.in/blog/" />
            <PublishPanel post={post} onPublish={handleUpdate} onSaveDraft={() => handleUpdate({ status: 'draft' })} isSaving={isSaving} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPost;