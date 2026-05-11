// src/blogger/pages/BlogPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostBySlug } from '../services/blogService';
import { formatDate, calculateReadingTime } from '../utils/readingTime';
import { Calendar, Clock, User, Tag, Share2, Bookmark, Heart } from 'lucide-react';

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
        // Update meta tags for SEO
        document.title = `${data.title} - Onlibry Blog`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.meta?.description || '');
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
        <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist.</p>
        <Link to="/blog" className="px-5 py-2 bg-green-600 text-white rounded-lg">Back to Blog</Link>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <title>{post.meta?.title || post.title} | Onlibry Blog</title>
      <meta name="description" content={post.meta?.description || post.content?.substring(0, 160)} />
      <meta name="keywords" content={post.meta?.tags} />
      <meta property="og:title" content={post.meta?.title || post.title} />
      <meta property="og:description" content={post.meta?.description} />
      <meta property="og:image" content={post.meta?.ogImage} />
      <meta property="og:url" content={window.location.href} />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Category/Tag */}
        {post.meta?.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.meta.tags.split(',').map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{post.readingTime?.text || '5 min read'}</span>
          </div>
          <div className="flex items-center gap-1">
            <User size={14} />
            <span>{post.authorName || 'Onlibry Team'}</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.meta?.ogImage && (
          <img
            src={post.meta.ogImage}
            alt={post.title}
            className="w-full rounded-xl mb-8"
          />
        )}

        {/* Blog Content */}
        <div
          className="prose prose-lg max-w-none blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <Share2 size={16} /> Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <Bookmark size={16} /> Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <Heart size={16} /> Like
          </button>
        </div>
      </article>
    </>
  );
}

export default BlogPage; 