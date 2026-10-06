'use client';
import React,{useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {AlertCircle,TriangleAlert,Info} from 'lucide-react';
import type {ValidationIssue} from '../../lib/shopify/types';
import {issueSeverity} from '../../lib/shopify/issue-index';
export function ShopifyIssueValue({value,issues,row,field,onEdit}:{value:string;issues:readonly ValidationIssue[];row:number;field:string;onEdit?:()=>void}){
 const id=useId(),anchor=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false),[position,setPosition]=useState({left:12,top:12});
 const severity=issueSeverity(issues);
 useLayoutEffect(()=>{
  if(!open)return;
  function place(){if(!anchor.current||!popup.current)return;const rect=anchor.current.getBoundingClientRect(),height=popup.current.offsetHeight,width=popup.current.offsetWidth;setPosition({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:rect.bottom+8+height<=window.innerHeight-12?rect.bottom+8:Math.max(12,rect.top-height-8)});}
  place();const close=()=>setOpen(false);window.addEventListener('scroll',close,true);window.addEventListener('resize',close);return()=>{window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close);};
 },[open]);
 if(!severity)return <>{value===''?<span className="muted">(empty)</span>:value}</>;
 const Icon=severity==='error'?AlertCircle:severity==='warning'?TriangleAlert:Info;
 const text=issues.map(issue=>issue.severity+': '+issue.message).join(' ');
 return <><button ref={anchor} className={'shopify-issue-trigger '+severity} type="button" aria-label={'Row '+row+', '+field+', '+severity+': '+(value||'(empty)')} aria-describedby={id} aria-invalid={severity==='error'?true:undefined} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>{if(document.activeElement!==anchor.current)setOpen(false);}} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onClick={()=>{if(onEdit){setOpen(false);onEdit();}else setOpen(true);}} onKeyDown={event=>{if(event.key==='Escape')setOpen(false);}}><span>{value||'(empty)'}</span><Icon size={14} aria-hidden="true"/></button><span id={id} className="sr-only">{text}</span>{open&&createPortal(<div ref={popup} role="tooltip" className="shopify-issue-popover" style={position}><strong>{field} · Row {row}</strong>{issues.map((issue,index)=><p key={index}><span className={'issue-severity '+issue.severity}>{issue.severity}</span> {issue.message}</p>)}</div>,document.body)}</>;
}
