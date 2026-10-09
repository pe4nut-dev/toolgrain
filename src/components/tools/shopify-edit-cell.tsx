'use client';
import React,{useId,useRef,useState} from 'react';
import {Save,X,Info,Pencil} from 'lucide-react';
import type {ShopifyField} from '../../lib/shopify/fields';
import type {ValidationIssue} from '../../lib/shopify/types';
import {ShopifyIssueValue} from './shopify-issue-value';
export function ShopifyEditCell({value,issues,row,field,onApply,editing,onOpen,onClose}:{value:string;issues:readonly ValidationIssue[];row:number;field:ShopifyField;onApply:(value:string)=>string[];editing:boolean;onOpen:()=>void;onClose:()=>void}){
 const [draft,setDraft]=useState(value),id=useId(),returnFocus=useRef<HTMLSpanElement>(null);
 const [messages,setMessages]=useState<string[]>([]),[showDetails,setShowDetails]=useState(false);
 function open(){setDraft(value);setMessages([]);setShowDetails(false);onOpen();}
 function close(){onClose();requestAnimationFrame(()=>returnFocus.current?.focus({preventScroll:true}));}
 function save(){const errors=onApply(draft);setMessages(errors);if(!errors.length)close();}
 if(editing)return <div className="shopify-cell-editor"><label htmlFor={id}>New {field}<input id={id} autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')close();if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();save();}}}/></label><div className="shopify-editor-actions"><button type="button" title="Save change" aria-label="Save change" onClick={save}><Save size={16} aria-hidden="true"/></button><button type="button" title="Cancel edit" aria-label="Cancel edit" onClick={close}><X size={16} aria-hidden="true"/></button>{issues.length>0&&<button type="button" title="Issue details" aria-label="Issue details" aria-expanded={showDetails} aria-controls={id+'-details'} onClick={()=>setShowDetails(current=>!current)}><Info size={16} aria-hidden="true"/></button>}</div>{showDetails&&<div id={id+'-details'}>{issues.map((issue,i)=><p key={i}>{issue.message}</p>)}</div>}<p role="alert">{messages.join(' ')}</p></div>;
 return <span className="shopify-editable" ref={returnFocus} tabIndex={-1}>{issues.length?<ShopifyIssueValue value={value} issues={issues} row={row} field={field} onEdit={open}/>:<button type="button" className="shopify-cell-value" aria-label={'Edit '+field+' in row '+row+': '+(value||'(empty)')} onClick={open}><span>{value||'(empty)'}</span><Pencil size={14} aria-hidden="true"/></button>}</span>;
}
