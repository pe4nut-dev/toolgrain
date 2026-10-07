'use client';
import Link from 'next/link';
import {useAccount} from '@/components/auth/account-provider';
import {trackToolgrainEvent} from '@/lib/analytics-events';
export function UpgradeLink(){
 const {plan}=useAccount();
 return <Link href="/pricing" className="button" onClick={()=>{if(plan==='free')trackToolgrainEvent('upgrade_clicked',{plan});}}>Upgrade to Toolgrain Pro</Link>;
}
