'use client';
import React,{createContext,useContext} from 'react';
import type {PlanId} from '../../config/plans';
const AccountContext=createContext<{plan:PlanId;signedIn:boolean}>({plan:'free',signedIn:false});
// Read-only server snapshot for local tool limits. No setter or public plan selection.
export function AccountProvider({plan,signedIn,children}:{plan:PlanId;signedIn:boolean;children?:React.ReactNode}){return <AccountContext.Provider value={{plan,signedIn}}>{children}</AccountContext.Provider>;}
export function useAccount(){return useContext(AccountContext);}
