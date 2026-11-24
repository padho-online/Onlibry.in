import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuickAccessFromD1 } from '../services/d1Service';

export default function CompactHomeLinks() {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    let active = true;
    getQuickAccessFromD1().then(data => {
      if (active) setLinks((Array.isArray(data) ? data : []).filter(b => b.icon === '__compact_link__'));
    }).catch(console.error);
    return () => { active = false; };
  }, []);
  const safe = links.filter(b => typeof b.path === 'string' && /^(\/(?![\/\\])|https?:\/\/)/i.test(b.path) && !/[\\\s]/.test(b.path));
  if (!safe.length) return null;
  const style = 'max-w-full break-words rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-green-600';
  return <section aria-label="Small Links" className="mb-5 rounded-xl border border-gray-200 bg-white p-3">
    <h2 className="mb-2 text-sm font-semibold text-gray-800">Small Links</h2>
    <nav aria-label="Featured educational links" className="flex flex-wrap gap-2">
    {safe.map(b => b.path.startsWith('/') ? <Link key={b.id} to={b.path} className={style}>{b.label}</Link> : <a key={b.id} href={b.path} className={style}>{b.label}</a>)}
  </nav>
  </section>;
}
