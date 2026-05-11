// src/blogger/components/BlogCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye } from 'lucide-react';
import { formatDate } from '../utils/readingTime';

const BlogCard = ({ post }) => {
  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden">
        {post.meta?.ogImage && (
          <img src={post.meta.ogImage} alt={post.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-3">
            {post.meta?.description || post.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.publishedAt || post.createdAt)}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readingTime?.text || '5 min read'}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {post.views || 0}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;