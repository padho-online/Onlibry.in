import '../styles/blogger.css';
// src/blogger/pages/BlogHome.jsx

import React, { useState, useEffect } from 'react';
import { getAllBlogPosts } from '../services/blogService';
import BlogCard from '../components/BlogCard';
import { Search } from 'lucide-react';

function BlogHome() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tag,setTag]=useState('');
  const [visible,setVisible]=useState(12);
  const tags=[...new Set(posts.flatMap(p=>(p.meta?.tags||'').split(',').map(t=>t.trim()).filter(Boolean)))];
  const results=filteredPosts.filter(p=>!tag||(p.meta?.tags||'').split(',').map(t=>t.trim()).includes(tag)).sort((a,b)=>new Date(b.publishedAt||b.createdAt)-new Date(a.publishedAt||a.createdAt));
  useEffect(()=>setVisible(12),[tag,searchQuery]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredPosts(posts.filter(p => 
        p.title.toLowerCase().includes(query) || (p.excerpt||'').toLowerCase().includes(query) ||
        p.meta?.tags?.toLowerCase().includes(query)
      ));
    } else {
      setFilteredPosts(posts);
    }
  }, [searchQuery, posts]);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getAllBlogPosts(500);
    setPosts(data);
    setFilteredPosts(data);
    setLoading(false);
  };
  
  return (
    <div className="py-6">
      <div className="blog-shell">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Onlibry Posts</h1>
          <p className="text-gray-500">Insights, tutorials, and resources for students</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mb-5">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="blog-layout blog-home-layout"><div className="blog-home-main">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : results.length > 0 ? (
          <div className="blog-grid">
            {results.slice(0,visible).map(post => <BlogCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found.</p>
          </div>
        )}
        {!loading && results.length>visible && <button className="block mx-auto my-8 border rounded px-6 py-2" onClick={()=>setVisible(v=>v+12)}>Load more</button>}
      </div><aside className="blog-sidebar"><section><h2>Most viewed</h2>{[...posts].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,4).map(post=><BlogCard key={post.id} post={post}/>)}</section><section><h2>Browse tags</h2><div className="flex flex-wrap gap-2">{["",...tags].map(t=><button key={t} onClick={()=>setTag(t)} className={"border rounded-full px-3 py-1 text-sm "+(tag===t?"bg-green-700 text-white":"")}>{t||"All posts"}</button>)}</div></section></aside></div>
      </div>
    </div>
  );
}

export default BlogHome;