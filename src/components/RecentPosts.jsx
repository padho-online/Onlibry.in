import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { getAllBlogPosts, formatDate } from '../blogger/services/blogService';

export default function RecentPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getAllBlogPosts().then(data => {
      if (active) setPosts(Array.isArray(data) ? data : []);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return (
    <section aria-labelledby="recent-posts-heading" className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <h2 id="recent-posts-heading" className="text-lg font-bold text-gray-800">Recent Posts</h2>
      <Link to="/blog" className="mt-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline">See all posted articles <ArrowRight size={14} /></Link>
      {loading ? <p role="status" className="py-4 text-sm text-gray-500">Loading recent posts...</p> : posts.length === 0 ? <p className="py-4 text-sm text-gray-500">No recent posts available.</p> : (
        <div className="divide-y divide-gray-100">
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group flex items-start gap-3 py-3">
              {post.meta?.ogImage ? <img src={post.meta.ogImage} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-md object-cover" /> : <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-600"><FileText size={22} /></div>}
              <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-gray-800 group-hover:text-green-700">{post.title}</h3><p className="mt-1 text-xs text-gray-500">{formatDate(post.publishedAt || post.createdAt)}</p></div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
