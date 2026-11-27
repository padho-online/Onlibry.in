import useBlogPanels from '../hooks/useBlogPanels';
import PageSkeleton from '../../components/PageSkeleton';
import ShareDialog from '../components/ShareDialog';
import '../styles/blogger.css';
import BlogCard from '../components/BlogCard';
import { sanitizeHtml } from '../utils/sanitizeHtml';
// src/blogger/pages/BlogPage.jsx
// Professional White Mode with Native Share API

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostBySlug, getAllBlogPosts, calculateReadingTime } from '../services/blogService';
import { formatDate } from '../services/blogService';
import { Calendar, Clock, User, Share2 } from 'lucide-react';

function BlogPage() {
  const { slug } = useParams();
  const [sharing,setSharing]=useState(false);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related,setRelated]=useState([]);
  const [progress,setProgress]=useState(0);
  const [headings,setHeadings]=useState([]);
  const panels = useBlogPanels(!loading && !!post && !error);
  useEffect(()=>{let active=true;getAllBlogPosts(500).then(items=>{if(active)setRelated(items.filter(p=>p.slug!==slug));});return()=>{active=false}},[slug]);
  useEffect(() => {
    if (!post || loading || error) return;
    const root = document.getElementById('onlibry-article-body');
    const panel = panels.current?.querySelector('.blog-reading');
    if (!root || !panel) return;
    panel.scrollTop = 0;
    setHeadings(Array.from(root.querySelectorAll('h2,h3,h4')).map((el,i) => {
      el.id = 'article-section-' + i;
      return {id:el.id,text:el.textContent};
    }));
    const update = () => {
      const r = root.getBoundingClientRect();
      const bottom = window.matchMedia('(min-width: 901px)').matches
        ? panel.getBoundingClientRect().bottom : window.innerHeight;
      setProgress(Math.max(0, Math.min(100, 100 * (bottom-r.top)/Math.max(1,r.height))));
    };
    update();
    panel.addEventListener('scroll', update, {passive:true});
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(root);
    return () => {panel.removeEventListener('scroll',update);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);observer?.disconnect();};
  }, [post,loading,error,panels]);

  useEffect(() => {
    loadPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
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

  const handleShare=async()=>{if(navigator.share&&/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){try{await navigator.share({title:post.title,text:post.meta?.description||post.excerpt||'',url:window.location.href});return}catch(e){if(e.name==='AbortError')return}}setSharing(true)};
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center py-20">
        <PageSkeleton />
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
      {sharing&&<ShareDialog post={post} onClose={()=>setSharing(false)}/>}
      <title>{post.meta?.title || post.title} | Onlibry Blog</title>
      <meta name="description" content={post.meta?.description || post.content?.substring(0, 160)} />
      <meta name="keywords" content={post.meta?.tags} />
      <meta property="og:title" content={post.meta?.title || post.title} />
      <meta property="og:description" content={post.meta?.description} />
      <meta property="og:image" content={post.meta?.ogImage} />
      <meta property="og:url" content={window.location.href} />
      <link rel="canonical" href={`https://onlibry.in/blog/${encodeURIComponent(post.slug)}`} />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Professional White Background */}
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 h-1 bg-gray-100"><div className="h-full bg-green-600" style={{width:progress+'%'}}/></div>
        <div ref={panels} className="blog-shell blog-layout blog-reading-layout blog-independent-panels"><article className="blog-reading" tabIndex={0} aria-label="Article content">
          
          <Link to="/blog" className="text-green-700 text-sm">← All articles</Link>
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
                className="blog-featured" 
              />
            </div>
          )}

          {headings.length>0 && <nav aria-label="Table of contents" className="border rounded-xl p-4 mb-6"><h2 className="font-bold mb-2">Contents</h2>{headings.map(h=><a key={h.id} href={'#'+h.id} className="block text-green-700 py-1">{h.text}</a>)}</nav>}
          {/* Content - Professional Typography */}
          <div 
            id="onlibry-article-body" className="blog-content prose prose-lg max-w-none break-words overflow-x-auto [&_img]:max-w-full [&_img]:h-auto [&_pre]:overflow-x-auto 
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
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} 
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
                <span className="text-gray-700">{post.readingTime?.text || calculateReadingTime(post.content||'').text}</span>
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
        </article><aside className="blog-sidebar" tabIndex={0} aria-label="Popular and latest articles"><section><h2>Popular articles</h2>{[...related].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,4).map(post=><BlogCard key={post.id} post={post}/>)}</section><section><h2>Latest articles</h2>{[...related].sort((a,b)=>new Date(b.publishedAt||b.createdAt)-new Date(a.publishedAt||a.createdAt)).slice(0,4).map(post=><BlogCard key={post.id} post={post}/>)}</section></aside></div>
      </div>
    </>
  );
}

export default BlogPage;