export function supabaseConfig(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key||url.includes('YOUR_PROJECT')||key.includes('YOUR_PUBLISHABLE'))return null;
 try{const parsed=new URL(url);if(parsed.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))return null;if(!key.startsWith('sb_publishable_'))return null;return {url:parsed.origin,key};}catch{return null;}
}
export const authCookieOptions={path:'/',sameSite:'lax' as const,secure:process.env.NODE_ENV==='production'};
