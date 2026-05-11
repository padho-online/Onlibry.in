// src/blogger/components/BlogPreview.jsx

import React from 'react';

const BlogPreview = ({ title, content }) => {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-bold mb-4">{title || 'Untitled Post'}</h1>
      <div dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Start writing your content here...</p>' }} />
    </div>
  );
};

export default BlogPreview;