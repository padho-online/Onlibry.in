import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, ExternalLink, ChevronRight } from 'lucide-react';
import { examDetailUrl } from '../services/examFetchService';
export default function ExamUpdateCard({record:r, detail=false}) {
  const drive = r.url?.match(/^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/);
  const action = 'inline-flex items-center gap-1 rounded-md border border-green-200 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50';
  return <article className="bg-white border border-gray-200 rounded-lg px-3 py-2 space-y-1">
    <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs">
      <span className="font-medium text-green-700">{r.university}</span>
      <span className="text-gray-600">{r.published ? `Published: ${r.published}` : r.examPeriod ? `Exam period (inferred): ${r.examPeriod}` : 'Date unavailable'}</span>
    </div>
    <h3 className="text-sm font-semibold leading-snug text-gray-900">{detail ? r.title : <Link className="hover:underline" to={examDetailUrl(r)}>{r.title}</Link>}</h3>
    <p className="text-xs text-gray-600">{[r.courses,r.semester && `Semester ${r.semester}`,r.type].filter(Boolean).join(' · ')}</p>
    <div className="flex flex-wrap gap-1.5 pt-1">
      {!detail && <Link className={action} to={examDetailUrl(r)}><ChevronRight size={13}/>Details</Link>}
      {r.url && <a className={action} href={r.url} target="_blank" rel="noopener noreferrer"><FileText size={13}/>{drive ? 'PDF' : 'Notice'}</a>}
      {drive && <a className={action} href={`https://drive.google.com/uc?export=download&id=${drive[1]}`} target="_blank" rel="noopener noreferrer"><Download size={13}/>Download</a>}
      {r.source && <a className={action} href={r.source} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/>Source</a>}
    </div>
  </article>;
}
