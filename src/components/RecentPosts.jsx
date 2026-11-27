import PageSkeleton from './PageSkeleton';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { getAllBlogPosts, formatDate } from '../blogger/services/blogService';

export default function RecentPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getAllBlogPosts(20).then(data => {
      if (active) setPosts(Array.isArray(data) ? data.slice(0, 20) : []);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return (
    <section aria-labelledby="recent-posts-heading" className="min-w-0 max-h-[50vh] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
      <h2 id="recent-posts-heading" className="shrink-0 text-lg font-bold text-gray-800">Recent Posts</h2>
      <Link to="/blog" className="shrink-0 self-start mt-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline">See all posted articles <ArrowRight size={14} /></Link>
      {loading ? <PageSkeleton/> : posts.length === 0 ? <p className="py-4 text-sm text-gray-500">No recent posts available.</p> : (
        <div role="region" aria-labelledby="recent-posts-heading" tabIndex={0} className="min-h-0 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-600">
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group flex items-start gap-3 py-3">
              {post.meta?.ogImage ? <img src={post.meta.ogImage} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-md bg-gray-50 object-contain object-center" /> : <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-600"><FileText size={22} /></div>}
              <div className="min-w-0"><h3 className="break-words [overflow-wrap:anywhere] text-sm font-semibold text-gray-800 group-hover:text-green-700">{post.title}</h3><p className="mt-1 text-xs text-gray-500">{formatDate(post.publishedAt || post.createdAt)}</p></div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
