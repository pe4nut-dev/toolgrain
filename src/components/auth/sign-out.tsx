'use client';
import React,{useActionState} from 'react';
import {signOutAction} from '../../app/auth/actions';
import type {AuthState} from '../../lib/auth/errors';
export function SignOut(){const [state,action,pending]=useActionState<AuthState>(signOutAction,{});return <form action={action}><button className="button secondary" type="submit" disabled={pending}>{pending?'Signing out…':'Sign out'}</button>{state.error&&<p role="alert">{state.error}</p>}</form>;}
