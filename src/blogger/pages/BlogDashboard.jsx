// src/blogger/pages/BlogDashboard.jsx - Fixed version

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserPosts, deleteBlogPost } from '../services/blogService';
import { Plus, Edit, Trash2, Eye, Globe, Clock } from 'lucide-react';

function BlogDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const userPosts = await getUserPosts(user.uid);
      setPosts(userPosts);
      console.log('📊 Loaded posts:', userPosts);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Delete this post permanently?')) {
      const result = await deleteBlogPost(postId);
      if (result.success) {
        loadPosts();
        alert('✅ Post deleted');
      } else {
        alert('❌ Delete failed');
      }
    }
  };

  const handleEdit = (postId) => {
    navigate(`/blog/edit/${postId}`);
  };

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');

  const stats = {
    total: posts.length,
    published: publishedPosts.length,
    drafts: draftPosts.length,
    totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Blog Dashboard</h1>
          <Link
            to="/blog/create"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus size={16} /> New Post
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Posts</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-xs text-gray-500">Published</div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.drafts}</div>
            <div className="text-xs text-gray-500">Drafts</div>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <div className="text-xs text-gray-500">Total Views</div>
          </div>
        </div>

        {/* Published Posts */}
        {publishedPosts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Published</h2>
            <div className="space-y-3">
              {publishedPosts.map(post => (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{post.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">Slug: {post.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/blog/${post.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-green-600">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => handleEdit(post.id)} className="p-2 text-gray-500 hover:text-blue-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                    <Globe size={14} className="text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drafts */}
        {draftPosts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Drafts</h2>
            <div className="space-y-3">
              {draftPosts.map(post => (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{post.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">Last updated: {new Date(post.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEdit(post.id)} className="p-2 text-gray-500 hover:text-blue-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No posts yet. Click "New Post" to create your first blog!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogDashboard;