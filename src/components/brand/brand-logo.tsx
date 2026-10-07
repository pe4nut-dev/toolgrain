import React from 'react';
import Image from 'next/image';
export function BrandLogo({compact=false,markOnly=false}:{compact?:boolean;markOnly?:boolean}){const size=compact?28:34;return <span className={'brand-logo'+(compact?' brand-logo-compact':'')}><Image src="/brand/toolgrain-mark.png" width={size} height={size} alt={markOnly?'Toolgrain':''} unoptimized/>{!markOnly&&<span className="brand-wordmark">Toolgrain</span>}</span>;}
