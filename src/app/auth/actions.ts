'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createSupabaseServerClient} from '../../lib/supabase/server';
import {performAuth,performSignOut,type AuthOperation} from '../../lib/auth/auth-service';
import type {AuthState} from '../../lib/auth/errors';
import {siteConfig} from '../../config/site';
async function submit(operation:AuthOperation,form:FormData):Promise<AuthState>{
 const result=await performAuth(await createSupabaseServerClient(),operation,{email:String(form.get('email')??''),password:String(form.get('password')??''),next:String(form.get('next')??'')},process.env.NODE_ENV==='development'?'http://localhost:3000':siteConfig.url);
 if(result.redirect){revalidatePath('/','layout');redirect(result.redirect);}return result;
}
export async function loginAction(_previous:AuthState,form:FormData){return submit('login',form);}
export async function signupAction(_previous:AuthState,form:FormData){return submit('signup',form);}
export async function magicLinkAction(_previous:AuthState,form:FormData){return submit('magic',form);}
export async function signOutAction(previous:AuthState){void previous;const result=await performSignOut(await createSupabaseServerClient());if(result.error)return result;revalidatePath('/','layout');redirect('/login');}
