import React, { useEffect, useRef, useState } from 'react';
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import { sanitizeHtml } from '../utils/sanitizeHtml';

// Keep the existing HTML-based publishing contract; Jodit owns the editable DOM.
export default function HtmlEditor({ content = '', onChange, placeholder = 'Write your blog post here...', editorRef, draftKey, onSaveDraft }) {
  const host = useRef(null), instance = useRef(null), latest = useRef(content), emitted = useRef(content);
  const callbacks = useRef({ onChange, onSaveDraft });
  callbacks.current = { onChange, onSaveDraft };
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
      placeholder, toolbarAdaptive: true, toolbarSticky: true, spellcheck: true,
      showCharsCounter: true, showWordsCounter: true, showXPathInStatusbar: false,
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
        defaultHandlerSuccess(data) { for (const url of data.files || []) this.j.s.insertImage(url); },
        defaultHandlerError(error) { setNotice(error?.message || String(error || 'Image upload failed')); }
      }
    });
    instance.current = editor;
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
    return () => { clearTimeout(timer.current); document.removeEventListener('keydown', shortcut); editor.events.off('change', change); editor.destruct(); instance.current = null; };
  }, [placeholder]);
  useEffect(() => {
    if (!instance.current || content === emitted.current || content === latest.current) return;
    applying.current = true; instance.current.value = sanitizeHtml(content); latest.current = instance.current.value; emitted.current = content; applying.current = false;
  }, [content]);
  useEffect(() => {
    if (!editorRef) return;
    editorRef.current = {
      getContent: () => sanitizeHtml(instance.current?.value ?? latest.current),
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
  return <section className="min-w-0 bg-white text-gray-900 rounded border">
    {notice && <div role="alert" className="p-2 bg-amber-100">{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></div>}
    {recovery && <div className="p-3 bg-blue-100">Recover local draft from {recovery.time}? <button type="button" onClick={() => { if (instance.current) { instance.current.value = sanitizeHtml(recovery.html); latest.current = instance.current.value; dirty.current = true; setChanged(true); emitted.current = latest.current; callbacks.current.onChange?.(latest.current); } setRecovery(null); }}>Recover</button> / <button type="button" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setRecovery(null); }}>Discard</button></div>}
    <div className="min-w-0"><textarea ref={host} aria-label="Article content" /></div>
    <div className="px-3 py-2 text-xs text-gray-600">{changed ? 'Unsaved changes' : 'No unsaved editor changes'}{saved && ` · Local backup attempted at ${saved}`}</div>
  </section>;
}
