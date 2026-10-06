import type {SupabaseClient} from '@supabase/supabase-js';
import {safeReturnPath} from './return-path';
import {authErrorMessage,type AuthState} from './errors';
export type AuthOperation='login'|'signup'|'magic';
export async function performAuth(client:SupabaseClient|null,operation:AuthOperation,input:{email:string;password:string;next:string},origin:string):Promise<AuthState&{redirect?:string}>{
 if(!client)return {error:'Account sign-in is not available yet. You can still use all Free tools without an account.'};
 const email=input.email.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return {error:'Enter a valid email address.'};
 if(operation!=='magic'&&(!input.password||input.password.length>256||operation==='signup'&&input.password.length<8))return {error:operation==='signup'?'Use a password with at least 8 characters.':'Enter your password.'};
 const next=safeReturnPath(input.next),emailRedirectTo=origin+'/auth/callback?next='+encodeURIComponent(next);
 try{
 if(operation==='login'){const {error}=await client.auth.signInWithPassword({email,password:input.password});return error?{error:authErrorMessage(error.code,operation)}:{redirect:next};}
 if(operation==='signup'){const {data,error}=await client.auth.signUp({email,password:input.password,options:{emailRedirectTo}});if(error)return {error:authErrorMessage(error.code,operation)};return data.session?{redirect:next}:{message:'Check your email to confirm your Toolgrain account. If you already have an account, try signing in.'};}
 const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo,shouldCreateUser:false}});return error?{error:authErrorMessage(error.code,operation)}:{message:'If this email has a Toolgrain account, a sign-in link has been sent. Check your inbox.'};
 }catch{return {error:'Unable to connect to the sign-in service. Please try again.'};}
}
export async function performSignOut(client:SupabaseClient|null):Promise<AuthState>{if(!client)return {};try{const {error}=await client.auth.signOut();return error?{error:authErrorMessage(error.code,'signout')}:{};}catch{return {error:'Unable to connect to the sign-in service. Please try again.'};}}
