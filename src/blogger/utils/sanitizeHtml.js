import DOMPurify from 'dompurify';
const properties = new Set('color background-color font-size font-family font-weight font-style text-decoration text-decoration-line text-align width height max-width margin margin-top margin-bottom padding border border-collapse vertical-align line-height float border-radius box-shadow'.split(' '));
export function sanitizeHtml(html='') {
 const clean=DOMPurify.sanitize(String(html),{USE_PROFILES:{html:true},FORBID_TAGS:['form','input','button','iframe','style','object','embed'],ADD_ATTR:['target','colwidth']});
 const doc=new DOMParser().parseFromString(clean,'text/html');
 for(const el of doc.body.querySelectorAll('[style]')){const safe=[];for(const key of properties){const v=el.style.getPropertyValue(key);if(v&&!/url\s*\(|expression\s*\(|var\s*\(|\\/i.test(v))safe.push(`${key}:${v}`);}if(safe.length)el.setAttribute('style',safe.join(';'));else el.removeAttribute('style');}
 for(const a of doc.body.querySelectorAll('a[target]')){a.setAttribute('rel','noopener noreferrer');}
 return doc.body.innerHTML;
}
