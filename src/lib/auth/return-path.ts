export function safeReturnPath(input:unknown):string {
 if(typeof input!=='string'||input.length>2048||!input.startsWith('/')||input.startsWith('//')||input.includes(String.fromCharCode(92))||/[\x00-\x20]/.test(input)||/%(?:2f|5c|00|0a|0d|25)/i.test(input))return '/account';
 try{const url=new URL(input,'https://toolgrain.com');if(url.origin!=='https://toolgrain.com')return '/account';const path=url.pathname;return path==='/'||['/tools','/pricing','/about','/privacy','/imprint','/account'].some(p=>path===p||p==='/tools'&&path.startsWith(p+'/'))?path:'/account';}catch{return '/account';}
}
