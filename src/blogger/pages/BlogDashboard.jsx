import PageSkeleton from '../../components/PageSkeleton';
// src/blogger/pages/BlogDashboard.jsx
// Fixed - Working edit navigation with debug

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserPosts, deleteBlogPost } from '../services/blogService';
import { Plus, Edit, Trash2, Eye, Share2, BarChart2, Search, X } from 'lucide-react';

import ShareDialog from '../components/ShareDialog';
import '../styles/blogger.css';
function BlogDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status,setStatus]=useState('published');
  const [search,setSearch]=useState('');
  const [sharing,setSharing]=useState(null);
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
    console.log('📝 Edit button clicked. Post ID:', postId);
    console.log('📝 Post ID type:', typeof postId);
    console.log('📝 Post ID length:', postId?.length);
    navigate(`/blog/edit/${postId}`);
  };

  const publishedPosts = posts.filter((p) => p.status === 'published');
  const draftPosts = posts.filter((p) => p.status === 'draft');

  const stats = {
    total: posts.length,
    published: publishedPosts.length,
    drafts: draftPosts.length,
    totalViews: posts.reduce((sum, p) => sum + (Number(p.views) || 0), 0),
  };

  const parseDate = value => {
    if (!value) return NaN;
    const raw = String(value);
    const iso = raw.replace(' ', 'T');
    return Date.parse(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(iso) ? iso+'Z' : iso);
  };
  const visiblePosts = posts.filter(p=>p.status===status && `${p.title || ''} ${p.slug || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const publishDate = p => {
    const t = parseDate(p.publishedAt);
    return p.status === 'published' && Number.isFinite(t) ? new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(t) : 'Not published';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="py-6">
      <style>{`@media(max-width:767px){.dashboard-dated-actions{gap:1px;justify-content:flex-start;flex-wrap:wrap}.dashboard-dated-actions span,.dashboard-dated-actions button,.dashboard-dated-actions a{padding:6px 3px}.dashboard-dated-actions svg{width:15px;height:15px}}`}</style>

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

        <div className="flex items-center gap-2 mb-3 min-w-0"><div className="flex flex-1 min-w-0 items-center gap-2 border rounded-lg px-2 bg-white"><Search size={16} className="shrink-0 text-gray-500"/><input aria-label="Search posts" className="w-full min-w-0 py-2 text-sm bg-transparent outline-none" placeholder="Search posts..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button type="button" aria-label="Clear search" onClick={()=>setSearch('')}><X size={15}/></button>}</div><select id="post-status" aria-label="Post status" className="border rounded-lg px-2 py-2 text-sm max-w-[48%] shrink-0" value={status} onChange={e=>setStatus(e.target.value)}><option value="published">Published ({publishedPosts.length})</option><option value="draft">Drafts ({draftPosts.length})</option></select></div>
        <div className="space-y-2">{visiblePosts.map(post=><div key={post.id} className="blog-dashboard-card"><h3>{post.title}</h3><div className="blog-dashboard-actions dashboard-dated-actions"><span title="Views"><BarChart2 size={16}/>{Number(post.views||0).toLocaleString()}</span><Link aria-label="View post" title={status==='draft'?'Open draft editor':'View post'} to={status==='published'?`/blog/${post.slug}`:`/blog/edit/${post.id}`}><Eye size={17}/></Link><button title="Edit" aria-label="Edit" onClick={()=>handleEdit(post.id)}><Edit size={17}/></button><button title="Delete" aria-label="Delete" onClick={()=>handleDelete(post.id)}><Trash2 size={17}/></button><button title="Share" aria-label="Share" disabled={status!=='published'} onClick={()=>setSharing(post)}><Share2 size={17}/></button><time className="ml-auto whitespace-nowrap text-[10px] sm:text-xs text-gray-500" dateTime={post.publishedAt || undefined}>{publishDate(post)}</time></div></div>)}</div>
        {!visiblePosts.length&&<p className="text-center py-8 text-gray-500">{search.trim()?"No matching posts.":`No ${status} posts.`}</p>}
        {sharing&&<ShareDialog post={sharing} onClose={()=>setSharing(null)}/>}
      </div>
    </div>
  );
}

export default BlogDashboard;