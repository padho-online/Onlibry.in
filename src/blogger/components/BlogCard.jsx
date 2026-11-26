import React,{useLayoutEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {formatDate} from '../utils/readingTime';
import '../styles/blogger.css';
export default function BlogCard({post}){
 const title=useRef(null),[lines,setLines]=useState(2),[failed,setFailed]=useState(false);
 useLayoutEffect(()=>{const el=title.current; if(!el)return; const measure=()=>setLines(el.getBoundingClientRect().height>21?2:1);measure();const ro=new ResizeObserver(measure);ro.observe(el);return()=>ro.disconnect();},[post.title]);
 return <Link to={`/blog/${post.slug}`} className="blog-card"><div className="blog-card-copy"><h3 ref={title}>{post.title}</h3><p style={{WebkitLineClamp:4-lines}}>{post.meta?.description||post.excerpt||post.content?.replace(/<[^>]*>/g,' ')}</p><footer><span>{formatDate(post.publishedAt||post.createdAt)}</span><span>{post.views||0} views</span></footer></div>{post.meta?.ogImage&&!failed&&<img src={post.meta.ogImage} alt="" loading="lazy" onError={()=>setFailed(true)}/>}</Link>;
}
