import PageSkeleton from '../../components/PageSkeleton';
import '../styles/blogger.css';
// src/blogger/pages/BlogHome.jsx

import React, { useState, useEffect, useRef } from 'react';
import { getAllBlogPosts } from '../services/blogService';
import BlogCard from '../components/BlogCard';
import { Search, Tags, ChevronDown } from 'lucide-react';

function BlogHome() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tag,setTag]=useState('');
  const [tagsOpen,setTagsOpen]=useState(false);
  const tagsPopupRef=useRef(null);
  const tagsButtonRef=useRef(null);
  useEffect(()=>{
    if(!tagsOpen) return;
    const outside=e=>{if(!tagsPopupRef.current?.contains(e.target)) setTagsOpen(false);};
    const escape=e=>{if(e.key==='Escape'){setTagsOpen(false);tagsButtonRef.current?.focus();}};
    const desktop=window.matchMedia('(min-width: 768px)');
    const resize=e=>{if(e.matches)setTagsOpen(false);};
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    desktop.addEventListener('change',resize);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);desktop.removeEventListener('change',resize);};
  },[tagsOpen]);
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
        <div className="max-w-xl mb-5 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              aria-label="Search articles"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div ref={tagsPopupRef} className="relative shrink-0 md:hidden">
            <button ref={tagsButtonRef} type="button" aria-expanded={tagsOpen} aria-controls="mobile-blog-tags" onClick={()=>setTagsOpen(v=>!v)} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700">
              <Tags size={16} aria-hidden="true"/><span className="max-w-[80px] truncate">{tag||'Tags'}</span><ChevronDown size={14} aria-hidden="true"/>
            </button>
            {tagsOpen && <div id="mobile-blog-tags" role="region" aria-label="Browse tags" style={{maxHeight: "35vh", ...(typeof CSS !== "undefined" && CSS.supports("height", "1dvh") ? {maxHeight: "35dvh"} : {})}} className="absolute right-0 top-full z-50 mt-2 w-[min(280px,85vw)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg flex flex-col overflow-hidden">
              <h2 className="mb-2 shrink-0 text-sm font-semibold text-gray-800">Browse tags</h2>
              <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto overflow-x-hidden overscroll-contain">
                {["",...tags.slice(0,80)].map(t=><button type="button" key={t} aria-pressed={tag===t} onClick={()=>{setTag(t);setTagsOpen(false);tagsButtonRef.current?.focus();}} className={"max-w-full break-words rounded-full border px-3 py-1 text-xs "+(tag===t?"bg-green-700 text-white":"text-gray-700")}>{t||"All posts"}</button>)}
              </div>
            </div>}
          </div>
        </div>

        <div className="blog-layout blog-home-layout"><div className="blog-home-main">
        {loading ? (
          <div className="flex justify-center py-12"><PageSkeleton /></div>
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
      </div><aside className="blog-sidebar"><section><h2>Most viewed</h2><div className="blog-sidebar-scroll">{[...posts].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,10).map(post=><BlogCard key={post.id} post={post}/>)}</div></section><section className="hidden md:block"><h2>Browse tags</h2><div className="blog-sidebar-scroll blog-tag-scroll flex flex-wrap gap-2">{["",...tags.slice(0,80)].map(t=><button key={t} onClick={()=>setTag(t)} className={"border rounded-full px-3 py-1 text-sm "+(tag===t?"bg-green-700 text-white":"")}>{t||"All posts"}</button>)}</div></section></aside></div>
      </div>
    </div>
  );
}

export default BlogHome;