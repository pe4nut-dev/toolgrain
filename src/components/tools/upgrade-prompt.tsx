'use client';
import {useAccount} from '../auth/account-provider';
import {TriangleAlert,ArrowUpRight} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import {plans,planTools,type PlanToolId} from '../../config/plans';
import {getToolLimit,type UsageViolation} from '../../lib/entitlements';
import {formatFileSize} from '../../lib/files';
const number=new Intl.NumberFormat('en');
export function PlanIndicator({tool}:{tool:PlanToolId}){const plan=useAccount().plan;return <p className="plan-indicator">{plans[plan].name} plan · Up to {number.format(getToolLimit(plan,tool))} {planTools[tool].limitUnit} · {formatFileSize(plans[plan].fileSizeBytes)} per file</p>;}
export function UpgradePrompt({usage}:{usage:UsageViolation}){const format=(value:number)=>usage.kind==='file-size'?formatFileSize(value):number.format(value)+' '+planTools[usage.tool].unit;return <section className="upgrade-prompt" aria-label="Usage limit" role="status"><h3 className="upgrade-heading"><TriangleAlert size={18} aria-hidden="true"/>{usage.exceedsPro?'This file exceeds Toolgrain’s supported limit.':'This file exceeds the '+plans[usage.plan].name+' plan limit.'}</h3><p>{usage.label}: {format(usage.actual)}</p><p>{plans[usage.plan].name}: up to {format(usage.limit)}{usage.tool==='csv-compare'&&usage.kind==='rows'?' per file':''}<br/>Toolgrain Pro: up to {format(usage.proLimit)}{usage.tool==='csv-compare'&&usage.kind==='rows'?' per file':''}</p>{usage.exceedsPro&&<p>Reduce the file before processing. This file also exceeds the planned Pro limit.</p>}<Link href="/pricing" className="button upgrade-button">View Pro<ArrowUpRight size={16} aria-hidden="true"/></Link><p className="muted">Your file still stays on your device. Pro is planned to unlock larger local processing limits. Pro purchases are not available yet.</p></section>;}
