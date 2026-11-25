let cached,expires=0,pending;
export const safeUrl=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
export async function getExamUpdates(){if(cached&&Date.now()<expires)return cached;if(pending)return pending;pending=(async()=>{const r=await fetch('/api/exam-updates');if(!r.ok)throw Error('Exam updates temporarily unavailable');const x=await r.json();if(!Array.isArray(x.records))throw Error('Invalid exam data');cached=[...new Map(x.records.filter(r=>r.id&&r.title).map(r=>[r.id,{...r,url:safeUrl(r.url),source:safeUrl(r.source),sortDate:r.sortDate||r.published||r.examPeriod||''}])).values()];expires=Date.now()+300000;return cached;})();try{return await pending;}finally{pending=null;}}

export function confirmedPublished(r) {
  if (r.examPeriod || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.published || ''))) return '';
  const d = new Date(r.published + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === r.published ? r.published : '';
}
export const examDetailUrl = r => `/notification/${encodeURIComponent('examfetch:' + r.id)}`;
export function rankExamUpdates(data, query) {
  const normalize = v => String(v || '').toLowerCase().replace(/\b(?:[a-z]\.){2,}[a-z]?\.?/g, x => x.replace(/\./g, '')).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const tokens = [...new Set(normalize(query).split(/\s+/).filter(Boolean))];
  return data.map(r => {
    const hay = normalize([r.title,r.university,r.courses,r.semester,r.type,r.published,r.examPeriod].join(' '));
    return {r, score: tokens.filter(t => hay.includes(t)).length};
  }).filter(x => !tokens.length || x.score > 0).sort((a,b) => b.score-a.score || confirmedPublished(b.r).localeCompare(confirmedPublished(a.r)) || String(b.r.sortDate || '').localeCompare(String(a.r.sortDate || '')) || String(a.r.id).localeCompare(String(b.r.id))).map(x=>x.r);
}
