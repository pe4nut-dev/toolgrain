import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {supabaseConfig,authCookieOptions} from './config';
export async function createSupabaseServerClient(){const config=supabaseConfig();if(!config)return null;const store=await cookies();return createServerClient(config.url,config.key,{cookieOptions:authCookieOptions,cookies:{getAll(){return store.getAll();},setAll(values){try{for(const {name,value,options} of values)store.set(name,value,options);}catch{/* Server Components are read-only; proxy refreshes cookies. */}}}});}
