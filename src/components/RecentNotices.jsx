import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell } from 'lucide-react';
import { getExamUpdates, confirmedPublished, examDetailUrl } from '../services/examFetchService';
import { getLatestNotificationsFromD1 } from '../services/d1Service';

export default function RecentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [manual, exams] = await Promise.allSettled([getLatestNotificationsFromD1(10), getExamUpdates()]);
        const data = manual.status === 'fulfilled' && Array.isArray(manual.value) ? manual.value : [];
        const automatic = exams.status === 'fulfilled' ? exams.value.filter(confirmedPublished).map(r => ({id:'examfetch:'+r.id, title:r.title, published_at:r.published, detailUrl:examDetailUrl(r)})) : [];
        const merged = [...data, ...automatic].sort((a,b) => (Date.parse(b.published_at)||0)-(Date.parse(a.published_at)||0));
        if (active) { setNotices(merged.slice(0,10)); setError(manual.status==='rejected' && exams.status==='rejected'); }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);
  return (
    <section aria-labelledby="recent-notices-heading" className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <h2 id="recent-notices-heading" className="text-lg font-bold text-gray-800">Latest Updates</h2>
      <Link to="/notifications" className="mt-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline">See all updates <ArrowRight size={14} /></Link>
      {loading ? <p role="status" className="py-4 text-sm text-gray-500">Loading recent notices...</p> : error ? <p className="py-4 text-sm text-gray-500">Unable to load notices.</p> : notices.length === 0 ? <p className="py-4 text-sm text-gray-500">No recent notices available.</p> : (
        <div role="region" aria-labelledby="recent-notices-heading" tabIndex={0} className="max-h-[350px] overflow-y-auto overflow-x-hidden divide-y divide-gray-100 pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-600">
          {notices.map(notice => (
            <Link key={notice.id} to={notice.detailUrl || `/notification/${encodeURIComponent(notice.id)}`} className="group flex items-start gap-3 py-3">
              <Bell size={18} className="mt-1 shrink-0 text-green-600" />
              <div className="min-w-0">
                <h3 className="break-words [overflow-wrap:anywhere] text-sm font-semibold text-gray-800 group-hover:text-green-700">{notice.title}</h3>
                {notice.published_at && <p className="mt-1 text-xs text-gray-500">{new Date(notice.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
