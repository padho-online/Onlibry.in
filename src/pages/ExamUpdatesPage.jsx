import React, { useEffect, useMemo, useState } from 'react';
import { getExamUpdates, rankExamUpdates } from '../services/examFetchService';
import ExamUpdateCard from '../components/ExamUpdateCard';
import { Search } from 'lucide-react';
export default function ExamUpdatesPage() {
  const [data,setData]=useState([]), [q,setQ]=useState(''), [limit,setLimit]=useState(30), [status,setStatus]=useState('Loading…'), [attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;setStatus('Loading…');getExamUpdates().then(r=>{if(active){setData(r);setStatus('');}}).catch(e=>{if(active)setStatus(e.message);});return()=>{active=false;};},[attempt]);
  const list=useMemo(()=>rankExamUpdates(data,q),[data,q]);
  return <main className="max-w-5xl mx-auto p-4 space-y-4">
    <h1 className="text-3xl font-bold text-gray-800">Exam Updates</h1>
    <p className="text-sm text-gray-600">University examination notices</p>
    <div className="flex items-center gap-2 border rounded-lg bg-white p-3"><Search size={18} className="text-gray-500"/><input type="search" aria-label="Search exam notices" className="w-full min-w-0 outline-none" placeholder="Search by keywords, e.g. MBA Osmania December" value={q} onChange={e=>{setQ(e.target.value);setLimit(30);}}/></div>
    <p role="status" className="text-sm text-gray-600">{status||`Showing ${Math.min(limit,list.length)} of ${list.length} notices`}</p>
    {status&&status!=='Loading…'&&<button onClick={()=>setAttempt(a=>a+1)}>Retry</button>}
    {!status&&!list.length&&<p>No matching notices found.</p>}
    {list.slice(0,limit).map(r=><ExamUpdateCard key={r.id} record={r}/>)}
    {limit<list.length&&<button className="border rounded p-3" onClick={()=>setLimit(limit+30)}>Load more</button>}
  </main>;
}
