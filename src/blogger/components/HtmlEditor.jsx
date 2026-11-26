import '../styles/blogger.css';
import React, { useEffect, useRef, useState } from 'react';
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import { sanitizeHtml } from '../utils/sanitizeHtml';

// Keep the existing HTML-based publishing contract; Jodit owns the editable DOM.
export default function HtmlEditor({ content = '', onChange, placeholder = 'Write your blog post here...', editorRef, draftKey, onSaveDraft }) {
  const host = useRef(null), instance = useRef(null), latest = useRef(content), emitted = useRef(content);
  const callbacks = useRef({ onChange, onSaveDraft });
  callbacks.current = { onChange, onSaveDraft };
  const selection = useRef(null), object = useRef(null);
  const [sourceMode,setSourceMode]=useState(false), [sourceHtml,setSourceHtml]=useState(''), [dimensions,setDimensions]=useState({width:250,height:250});
  const sourceRef=useRef(false), sourceValue=useRef('');
  const [kind,setKind]=useState(''), [borderColor,setBorderColor]=useState('#64748b'), [thickness,setThickness]=useState(1), [scope,setScope]=useState('all');
  const dirty = useRef(false), timer = useRef(null), applying = useRef(false);
  const [notice, setNotice] = useState(''), [recovery, setRecovery] = useState(null), [saved, setSaved] = useState('');
  const [changed, setChanged] = useState(false);
  const backup = () => {
    if (!draftKey || !dirty.current) return;
    try { localStorage.setItem(draftKey, JSON.stringify({html: latest.current, time: new Date().toISOString()})); }
    catch { setNotice('Local backup failed. Save your draft manually.'); }
  };
  useEffect(() => {
    const api = import.meta.env.VITE_BLOG_API_URL;
    const editor = Jodit.make(host.current, {
      height: 580, minHeight: 350, width: '100%', theme: 'default',
      placeholder, toolbarAdaptive: false, buttons: ['source','undo','redo','bold','italic','underline','strikethrough','paragraph','fontsize','brush','ul','ol','outdent','indent','align','link','image','table','hr','fullsize'], defaultImageWidth: 250, toolbarSticky: true, spellcheck: true,
      showCharsCounter: true, showWordsCounter: true, showXPathInStatusbar: false,
      enter: 'p', useNativeTooltip: true, allowResizeX: true, allowResizeY: true,
      askBeforePasteHTML: true, askBeforePasteFromWord: true,
      uploader: {
        url: api ? `${api.replace(/\/$/, '')}/api/upload` : '',
        insertImageAsBase64URI: false, filesVariableName: () => 'file',
        prepareData(form) {
          // Existing Worker accepts exactly one multipart field named file.
          const files = Array.from(form.entries()).filter(([, v]) => v instanceof File);
          if (!api || files.length !== 1 || !/^image\/(png|jpeg|gif|webp|avif)$/.test(files[0]?.[1]?.type || '') || files[0][1].size > 5 * 1024 * 1024) {
            throw new Error('Select one PNG, JPEG, GIF, WebP or AVIF image up to 5 MB; upload API must be configured.');
          }
          const payload = new FormData(); payload.append('file', files[0][1]); return payload;
        },
        isSuccess: response => Boolean(response?.success && /^https:\/\//i.test(response.url || '')),
        getMessage: response => response?.error || 'Image upload failed',
        process: response => ({files: [response.url], path: '', baseurl: '', error: 0, msg: ''}),
        defaultHandlerSuccess(data) { for (const url of data.files || []) insertUploaded(url); },
        defaultHandlerError(error) { setNotice(error?.message || String(error || 'Image upload failed')); }
      }
    });
    instance.current = editor;
    const root = editor.editor;
    const remember = () => { const sel = root.ownerDocument.getSelection(); if(sel?.rangeCount && root.contains(sel.getRangeAt(0).commonAncestorContainer)) selection.current=sel.getRangeAt(0).cloneRange(); };
    const selectObject = e => { const node=e.target.closest('img,td,th,table'); object.current=node;if(node){const r=node.getBoundingClientRect();setDimensions({width:Math.round(r.width)||250,height:Math.round(r.height)||250});}setKind(node?.tagName==='IMG'?'image':node?'table':''); };
    root.ownerDocument.addEventListener('selectionchange',remember);
    root.addEventListener('click',selectObject);
    const insertUploaded = url => { const img=root.ownerDocument.createElement('img');img.src=url;img.alt='';img.style.width='250px';img.style.height='250px';img.style.objectFit='contain';img.style.maxWidth='100%';const range=selection.current;if(range&&root.contains(range.commonAncestorContainer)){range.deleteContents();range.insertNode(img);range.setStartAfter(img);range.collapse(true);const sel=root.ownerDocument.getSelection();sel.removeAllRanges();sel.addRange(range);}else root.appendChild(img);object.current=img;setKind('image');setDimensions({width:250,height:250});editor.synchronizeValues();change(); };
    const upload = async e => { const file=e.target.files?.[0];if(!file)return;try{if(!api)throw Error('Upload API not configured');const form=new FormData();form.append('file',file);const res=await fetch(`${api.replace(/\/$/,'')}/api/upload`,{method:'POST',body:form});const data=await res.json();if(!res.ok||!data.success||!/^https:\/\//i.test(data.url))throw Error(data.error||'Upload failed');insertUploaded(data.url);}catch(err){setNotice(err.message);}finally{e.target.value='';} };
    const fileInput=host.current.closest('section').querySelector('[data-blog-upload]');fileInput.addEventListener('change',upload);
    const dragStart=e=>{const node=e.target.closest('table,img');if(!node||e.button!==0)return;const r=node.getBoundingClientRect();if(Math.abs(e.clientX-r.right)>12||Math.abs(e.clientY-r.bottom)>12)return;e.preventDefault();const move=ev=>{node.style.width=Math.max(40,r.width+ev.clientX-e.clientX)+'px';node.style.height=Math.max(20,r.height+ev.clientY-e.clientY)+'px';};const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);editor.synchronizeValues();change();};document.addEventListener('pointermove',move);document.addEventListener('pointerup',end);};root.addEventListener('pointerdown',dragStart);

    applying.current = true; editor.value = sanitizeHtml(latest.current); latest.current = editor.value; applying.current = false;
    const change = () => {
      if (applying.current) return;
      latest.current = editor.value; dirty.current = true; setChanged(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { emitted.current = latest.current; callbacks.current.onChange?.(latest.current); }, 150);
    };
    editor.events.on('change', change);
    const shortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && host.current?.parentElement?.contains(document.activeElement)) {
        event.preventDefault(); callbacks.current.onSaveDraft?.();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => { clearTimeout(timer.current); document.removeEventListener('keydown', shortcut); root.ownerDocument.removeEventListener('selectionchange',remember);root.removeEventListener('click',selectObject);root.removeEventListener('pointerdown',dragStart);fileInput.removeEventListener('change',upload);editor.events.off('change', change); editor.destruct(); instance.current = null; };
  }, [placeholder]);
  useEffect(() => {
    if (!instance.current || content === emitted.current || content === latest.current) return;
    applying.current = true; instance.current.value = sanitizeHtml(content); latest.current = instance.current.value; emitted.current = content; applying.current = false;
  }, [content]);
  useEffect(() => {
    if (!editorRef) return;
    editorRef.current = {
      getContent: () => sanitizeHtml(sourceRef.current ? sourceValue.current : (instance.current?.value ?? latest.current)),
      markSaved: () => { dirty.current = false; setChanged(false); clearTimeout(timer.current); try { if (draftKey) localStorage.removeItem(draftKey); } catch {} }
    };
    return () => { editorRef.current = null; };
  }, [editorRef, draftKey]);
  useEffect(() => {
    if (!draftKey) return;
    try { const raw = localStorage.getItem(draftKey); if (raw) { const draft = JSON.parse(raw); if (draft.html !== latest.current) setRecovery(draft); } } catch { setNotice('Draft recovery unavailable.'); }
    const id = setInterval(() => { if (dirty.current) { backup(); setSaved(new Date().toLocaleTimeString()); } }, 2000);
    const unload = event => { if (dirty.current) { backup(); event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => { clearInterval(id); window.removeEventListener('beforeunload', unload); backup(); };
  }, [draftKey]);
  const format=(command,value)=>{const ed=instance.current,r=selection.current;if(!ed||!r||!ed.editor.contains(r.commonAncestorContainer))return;ed.editor.focus();const sel=ed.editor.ownerDocument.getSelection();sel.removeAllRanges();sel.addRange(r);ed.editor.ownerDocument.execCommand(command,false,value);ed.synchronizeValues();};
  const applyBorder=()=>{const ed=instance.current,t=object.current?.closest('table');if(!ed||!t)return;const b=`${thickness}px solid ${borderColor}`;if(scope!=='inner')t.style.border=b;if(scope!=='outer')t.querySelectorAll('td,th').forEach(c=>c.style.border=b);ed.synchronizeValues();};
  const resize=(axis,value)=>{const ed=instance.current,n=kind==='table'?object.current?.closest('table'):object.current;if(n&&Number(value)>0){n.style[axis]=Number(value)+'px';ed.synchronizeValues();}};
  const toggleSource=()=>{const ed=instance.current;if(!ed)return;if(!sourceRef.current){sourceValue.current=ed.value;setSourceHtml(ed.value);sourceRef.current=true;setSourceMode(true);}else{const html=sanitizeHtml(sourceValue.current);sourceRef.current=false;setSourceMode(false);ed.value=html;latest.current=html;emitted.current=html;callbacks.current.onChange?.(html);}};
  const editSource=value=>{sourceValue.current=value;setSourceHtml(value);latest.current=value;dirty.current=true;setChanged(true);emitted.current=value;callbacks.current.onChange?.(value);};
  return <section className="min-w-0 bg-white text-gray-900 rounded border">
    {notice && <div role="alert" className="p-2 bg-amber-100">{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></div>}
    {recovery && <div className="p-3 bg-blue-100">Recover local draft from {recovery.time}? <button type="button" onClick={() => { if (instance.current) { instance.current.value = sanitizeHtml(recovery.html); latest.current = instance.current.value; dirty.current = true; setChanged(true); emitted.current = latest.current; callbacks.current.onChange?.(latest.current); } setRecovery(null); }}>Recover</button> / <button type="button" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setRecovery(null); }}>Discard</button></div>}
    <div className="blog-object-tools"><button type="button" onClick={toggleSource}>{sourceMode?"Apply HTML / Visual editor":"Edit HTML </>"}</button></div><div className="blog-object-tools" style={{display:sourceMode?"none":undefined}}><label>Upload image <input data-blog-upload type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" /></label><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>format('insertUnorderedList')}>Bullets (selection)</button><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>format('insertOrderedList')}>Numbering (selection)</button><label>Text highlight <input type="color" onChange={e=>format('hiliteColor',e.target.value)}/></label><label>Text color <input type="color" onChange={e=>format('foreColor',e.target.value)}/></label>{kind&&<><span>{kind} selected</span><input type="number" min="20" placeholder="Width px" aria-label="Object width" value={dimensions.width} onChange={e=>{setDimensions(d=>({...d,width:e.target.value}));resize('width',e.target.value);}}/><input type="number" min="20" placeholder="Height px" aria-label="Object height" value={dimensions.height} onChange={e=>{setDimensions(d=>({...d,height:e.target.value}));resize('height',e.target.value);}}/>{kind==='table'&&<><select value={scope} onChange={e=>setScope(e.target.value)}><option value="all">All borders</option><option value="outer">Outer border</option><option value="inner">Cell borders</option></select><input type="color" value={borderColor} onChange={e=>setBorderColor(e.target.value)}/><input type="number" min="0" max="20" value={thickness} onChange={e=>setThickness(Math.max(0,Math.min(20,Number(e.target.value))))}/><button type="button" onClick={applyBorder}>Apply borders</button></>}</>}</div>
    <div className="min-w-0" style={{display:sourceMode?"none":undefined}}><textarea ref={host} aria-label="Article content" /></div>
    {sourceMode&&<textarea aria-label="HTML source" className="w-full p-4 font-mono text-sm border" style={{minHeight:580}} value={sourceHtml} onChange={e=>editSource(e.target.value)} spellCheck={false}/>}
    <div className="px-3 py-2 text-xs text-gray-600">{changed ? 'Unsaved changes' : 'No unsaved editor changes'}{saved && ` · Local backup attempted at ${saved}`}</div>
  </section>;
}
