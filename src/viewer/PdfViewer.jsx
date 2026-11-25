import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

function ToolIcon({name}) {
  const paths = {download:'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',fit:'M4 4v16M20 4v16M7 12h10m-7-3-3 3 3 3m4-6 3 3-3 3',rotate:'M3 11a9 9 0 1 1 3 8M3 4v7h7',fullscreen:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6',retry:'M20 7a9 9 0 1 0 1 10M20 3v5h-5'};
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}

function Page({ doc, number, width, zoom, rotation, locked, onSubscribe, onBuyFile, preview, retryKey }) {
  const host = useRef(null), canvas = useRef(null);
  const [near, setNear] = useState(false), [ratio, setRatio] = useState(1.414), [error, setError] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '500px 0px' });
    observer.observe(host.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near || locked) return;
    let stopped = false, task, page;
    const target = canvas.current;
    setError(false);
    (async () => {
      page = await doc.getPage(number); if (stopped) return;
      const base = page.getViewport({ scale: 1, rotation: (page.rotate + rotation) % 360 });
      setRatio(base.height / base.width);
      const cssWidth = width * zoom;
      const factor = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4000000 / (cssWidth * cssWidth * base.height / base.width)));
      const viewport = page.getViewport({ scale: cssWidth / base.width * factor, rotation: (page.rotate + rotation) % 360 });
      target.width = Math.ceil(viewport.width); target.height = Math.ceil(viewport.height);
      task = page.render({ canvasContext: target.getContext('2d', { alpha: false }), viewport });
      await task.promise;
    })().catch(e => { if (!stopped && e.name !== 'RenderingCancelledException') setError(true); });
    return () => { stopped = true; task?.cancel(); if (target) { target.width = 0; target.height = 0; } };
  }, [doc, number, near, locked, width, zoom, rotation, retryKey]);
  return <section ref={host} data-page={number} className="relative mx-auto mb-5 shrink-0" style={{width: width * zoom, maxWidth: 'none'}}>
    <div className="text-center text-xs mb-2 text-slate-600">Page {number}</div>
    <div className="relative bg-white text-slate-900 border border-slate-200 shadow-sm" style={{aspectRatio: 1 / ratio}}>
      {locked ? <div className="absolute inset-0 bg-white text-slate-900 flex flex-col items-center justify-center p-2 sm:p-4 text-center overflow-auto"><div className="my-auto w-full max-w-sm space-y-2 text-xs sm:text-sm"><p>To download and unlock all files, subscribe to any pack.</p><p className="font-semibold">🔒 Page {number} is locked</p><button onClick={onBuyFile} className="bg-green-700 text-white rounded px-3 py-2 font-semibold">Buy File</button><p>to unlock all pages</p><p className="pt-2 border-t border-slate-200">Download is only available for subscribed users</p><button onClick={onSubscribe} className="bg-green-700 text-white rounded px-3 py-2 font-semibold">Subscribe Now</button></div></div> : <><canvas ref={canvas} className="block w-full h-full" aria-label={`PDF page ${number}`} />{preview && <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500/40 font-bold pointer-events-none">Onlibry.in</span>}{error && <div className="absolute inset-0 grid place-items-center bg-white">Page could not render. Use Retry pages.</div>}</>}
    </div>
  </section>;
}
export default function PdfViewer({pdfUrl, fileName='Document', isSubscribed=false, isPreviewMode=false, onDownload, onPageChange, onSubscribe, onBuyFile, onClose}) {
  const [doc,setDoc]=useState(null), [error,setError]=useState(''), [progress,setProgress]=useState(null), [retry,setRetry]=useState(0), [pageRetry,setPageRetry]=useState(0);
  const [width,setWidth]=useState(600), [zoom,setZoom]=useState(1), [rotation,setRotation]=useState(0), [current,setCurrent]=useState(1), [jump,setJump]=useState('1');
  const [menuOpen,setMenuOpen]=useState(false), [compact,setCompact]=useState(true);
  const header=useRef(null), titleProbe=useRef(null), toolsProbe=useRef(null);
  useEffect(()=>{const measure=()=>{if(header.current&&titleProbe.current&&toolsProbe.current)setCompact(titleProbe.current.scrollWidth+toolsProbe.current.offsetWidth+64>header.current.clientWidth);}; const ro=new ResizeObserver(measure); if(header.current)ro.observe(header.current); if(toolsProbe.current)ro.observe(toolsProbe.current); measure(); return()=>ro.disconnect();},[fileName,doc?.numPages]);
  const scroll=useRef(null), root=useRef(null), currentRef=useRef(1), callback=useRef(onPageChange);
  callback.current=onPageChange;
  const preview=isPreviewMode&&!isSubscribed;
  useEffect(()=>{ let active=true; setDoc(null);setError('');setProgress(null);setCurrent(1);setJump('1');currentRef.current=1;
    if(!pdfUrl) return;
    const task=pdfjs.getDocument({url:pdfUrl,isEvalSupported:false,cMapUrl:'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',cMapPacked:true});
    task.onProgress=({loaded,total})=>{if(active&&total>0)setProgress(Math.min(100,Math.round(loaded/total*100)));};
    task.promise.then(d=>{if(active)setDoc(d);}).catch(()=>{if(active)setError('Unable to load PDF. Please retry.');});
    return ()=>{active=false;task.destroy().catch(()=>{});};
  },[pdfUrl,retry]);
  useEffect(()=>{const el=scroll.current;if(!el)return;const ro=new ResizeObserver(()=>setWidth(Math.max(120,Math.min(1000,el.clientWidth-24))));ro.observe(el);return()=>ro.disconnect();},[]);
  const go=(n)=>{if(!doc)return;const p=Math.max(1,Math.min(doc.numPages,Number(n)||1));scroll.current?.querySelector(`[data-page="${p}"]`)?.scrollIntoView({block:'start'});setJump(String(p));};
  const onScroll=()=>{const el=scroll.current;if(!el)return;const top=el.getBoundingClientRect().top;const pages=el.querySelectorAll('[data-page]');let lo=0,hi=pages.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(pages[mid].getBoundingClientRect().bottom<=top+20)lo=mid+1;else hi=mid;}const n=Number(pages[lo]?.dataset.page);if(n&&n!==currentRef.current){currentRef.current=n;setCurrent(n);setJump(String(n));callback.current?.(n);}};
  const btn='inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-900 text-sm';
  return <div ref={root} className="h-full min-h-0 flex flex-col bg-white text-slate-900" style={{colorScheme: 'light'}}>
    <div ref={header} className="relative shrink-0 px-2 py-1 border-b border-slate-200 flex items-center gap-2 min-w-0">
      <strong className="min-w-0 flex-1 truncate text-sm" title={fileName}>{fileName}</strong>
      <span ref={titleProbe} className="absolute invisible pointer-events-none whitespace-nowrap text-sm font-bold" aria-hidden="true">{fileName}</span>
      <div ref={toolsProbe} className="absolute invisible pointer-events-none w-[390px] sm:w-[700px]" aria-hidden="true" />
      {compact&&<button className={btn} aria-label="Reader menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>☰</button>}
      <div className={compact?(menuOpen?'absolute right-2 top-full z-50 bg-white border rounded shadow-lg p-2 flex flex-wrap gap-1 max-w-[calc(100vw-16px)]':'hidden'):'flex items-center gap-1 whitespace-nowrap'}> {tools} {!preview&&isSubscribed&&onDownload&&<button className={btn} onClick={onDownload} aria-label="Download" title="Download"><ToolIcon name="download"/><span className="hidden sm:inline">Download</span></button>}</div>
      {onClose&&<button className={btn} onClick={onClose} aria-label="Close viewer" title="Close viewer">✕</button>}
    </div>
    <div ref={scroll} onScroll={onScroll} className="flex-1 min-h-0 overflow-auto p-3">{error?<div className="text-center p-8">{error} <button className={btn} onClick={()=>setRetry(r=>r+1)}>Retry</button></div>:!doc?<div className="text-center p-8">Loading PDF… {progress!==null?`${progress}%`:''}</div>:Array.from({length:doc.numPages},(_,i)=><Page key={i+1} doc={doc} number={i+1} width={width} zoom={zoom} rotation={rotation} locked={preview&&i%3!==0} onSubscribe={onSubscribe} preview={preview} retryKey={pageRetry} onBuyFile={onBuyFile}/>)}</div>
    <div className="shrink-0 px-3 py-1 text-xs">Page {current} / {doc?.numPages||0}<progress className="w-full block" value={current} max={doc?.numPages||1}/></div>
  </div>;
}
