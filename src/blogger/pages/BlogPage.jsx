// src/blogger/pages/BlogPage.jsx
// Professional White Mode with Native Share API

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostBySlug } from '../services/blogService';
import { formatDate } from '../services/blogService';
import { Calendar, Clock, User, Share2 } from 'lucide-react';

function BlogPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await getBlogPostBySlug(slug);
      if (data) {
        setPost(data);
        document.title = `${data.title} - Onlibry Blog`;
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  // Native Share Function - Mobile friendly
  const handleShare = async () => {
    const shareData = {
      title: post?.title || 'Onlibry Blog',
      text: post?.meta?.description || post?.excerpt || 'Check out this post on Onlibry Blog',
      url: window.location.href,
    };

    // Check if Web Share API is supported (mobile devices)
    if (navigator.share && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } catch (error) {
        console.log('Share cancelled or failed:', error);
        // Fallback to copy on error
        fallbackCopy();
      }
    } else {
      // Desktop fallback - copy to clipboard
      fallbackCopy();
    }
  };

  // Fallback for desktop or when native share fails
  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('✅ Link copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Press Ctrl+C to copy the link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white text-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
        <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist.</p>
        <Link to="/blog" className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <>
      <title>{post.meta?.title || post.title} | Onlibry Blog</title>
      <meta name="description" content={post.meta?.description || post.content?.substring(0, 160)} />
      <meta name="keywords" content={post.meta?.tags} />
      <meta property="og:title" content={post.meta?.title || post.title} />
      <meta property="og:description" content={post.meta?.description} />
      <meta property="og:image" content={post.meta?.ogImage} />
      <meta property="og:url" content={window.location.href} />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Professional White Background */}
      <div className="min-h-screen bg-white">
        <article className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 text-center md:text-left leading-tight">
            {post.title}
          </h1>

          {/* Featured Image */}
          {post.meta?.ogImage && (
            <div className="mb-10">
              <img 
                src={post.meta.ogImage} 
                alt={post.title} 
                className="w-full rounded-xl shadow-sm border border-gray-100" 
              />
            </div>
          )}

          {/* Content - Professional Typography */}
          <div 
            className="prose prose-lg max-w-none 
                       prose-headings:text-gray-900 
                       prose-headings:font-bold 
                       prose-p:text-gray-700 
                       prose-p:leading-relaxed 
                       prose-a:text-green-600 
                       prose-a:no-underline 
                       prose-a:hover:text-green-700 
                       prose-a:hover:underline
                       prose-strong:text-gray-900
                       prose-li:text-gray-700
                       prose-blockquote:text-gray-600
                       prose-blockquote:border-l-green-500
                       prose-code:text-gray-800
                       prose-pre:bg-gray-900
                       prose-pre:text-gray-100
                       mb-10" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Meta Info + Share Icon */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User size={15} className="text-gray-400" />
                <span className="text-gray-700">{post.authorName || 'Onlibry Team'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-gray-400" />
                <span className="text-gray-700">{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-gray-400" />
                <span className="text-gray-700">{post.readingTime?.text || '5 min read'}</span>
              </div>
            </div>
            
            {/* Share Button - Native on Mobile, Copy on Desktop */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-800 border border-gray-200"
              title="Share this post"
            >
              <Share2 size={16} />
              <span className="text-sm">Share</span>
            </button>
          </div>

          {/* Tags */}
          {post.meta?.tags && (
            <div className="flex flex-wrap gap-2 mt-4 pt-2">
              <span className="text-xs text-gray-400 mr-1">Tags:</span>
              {post.meta.tags.split(',').map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200 hover:bg-gray-100 transition">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}

export default BlogPage;