import {NextResponse,type NextRequest} from 'next/server';
import {createSupabaseServerClient} from '../../../lib/supabase/server';
import {confirmAuth} from '../../../lib/auth/callback';
export async function GET(request:NextRequest){const path=await confirmAuth(await createSupabaseServerClient(),request.nextUrl.searchParams);const response=NextResponse.redirect(new URL(path,request.nextUrl.origin));response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');response.headers.set('Referrer-Policy','no-referrer');return response;}
