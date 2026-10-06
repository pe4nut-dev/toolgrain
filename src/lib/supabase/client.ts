'use client';
import {createBrowserClient} from '@supabase/ssr';
import {supabaseConfig,authCookieOptions} from './config';
// Auth-only browser helper. Current forms use server actions; tools never import this.
export function createSupabaseBrowserClient(){const config=supabaseConfig();if(!config)return null;return createBrowserClient(config.url,config.key,{cookieOptions:authCookieOptions});}
