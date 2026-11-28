import PageSkeleton from '../components/PageSkeleton';
import React, { useEffect, useMemo, useState } from 'react';
import { getExamUpdates, rankExamUpdates, recentExamUpdates } from '../services/examFetchService';
import ExamUpdateCard from '../components/ExamUpdateCard';
import { Search, Filter } from 'lucide-react';
export default function ExamUpdatesPage() {
  const [data,setData]=useState([]), [q,setQ]=useState(''), [limit,setLimit]=useState(30), [status,setStatus]=useState('Loading…'), [attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;setStatus('Loading…');getExamUpdates().then(r=>{if(active){setData(r);setStatus('');}}).catch(e=>{if(active)setStatus(e.message);});return()=>{active=false;};},[attempt]);
  const [university,setUniversity]=useState('');
  const recent=useMemo(()=>recentExamUpdates(data),[data]);
  const universities=useMemo(()=>[...new Set(recent.map(r=>r.university).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),[recent]);
  const list=useMemo(()=>rankExamUpdates(recent.filter(r=>!university||r.university===university),q),[recent,q,university]);
  return <section className="w-full min-w-0 mx-auto p-4 space-y-2">
    <h1 className="text-3xl font-bold text-gray-800">Exam Updates</h1>
    <div className="flex items-center gap-2 min-w-0"><div className="flex flex-1 min-w-0 items-center gap-2 border rounded-lg bg-white px-3 py-1"><Search size={18} className="text-gray-500"/><input type="search" aria-label="Search exam notices" className="w-full min-w-0 outline-none" placeholder="Search by keywords, e.g. MBA Osmania December" value={q} onChange={e=>{setQ(e.target.value);setLimit(30);}}/></div><label className="relative flex shrink-0 items-center gap-2 border rounded-lg bg-white px-3 h-12 max-w-[45%]" title="Filter by university"><Filter size={18} className={university?'text-green-600':'text-gray-600'}/><span className="hidden md:inline text-sm truncate">{university||'All universities'}</span><select aria-label="Filter by university" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value={university} onChange={e=>{setUniversity(e.target.value);setLimit(30);}}><option value="">All universities</option>{universities.map(u=><option key={u} value={u}>{u}</option>)}</select></label></div>
    <p role="status" className="text-sm text-gray-600">{status||`Showing ${Math.min(limit,list.length)} of ${list.length} notices`}</p>
    {status==='Loading…'&&<PageSkeleton/>}
    {status&&status!=='Loading…'&&<button onClick={()=>setAttempt(a=>a+1)}>Retry</button>}
    {!status&&!list.length&&<p>No matching notices found.</p>}
    <div className="notice-grid space-y-2 md:space-y-0">{list.slice(0,limit).map(r=><ExamUpdateCard key={r.id} record={r}/>)}</div>
    {limit<list.length&&<button className="border rounded p-3" onClick={()=>setLimit(limit+30)}>Load more</button>}
  </section>;
}
