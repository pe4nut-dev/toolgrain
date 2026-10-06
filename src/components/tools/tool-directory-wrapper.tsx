'use client';
import { useSearchParams } from 'next/navigation';
import { ToolDirectory } from './tool-directory';
export function ToolDirectoryWithCategory() { const params = useSearchParams(); return <ToolDirectory key={params.get('category') ?? 'all'} initialCategory={params.get('category')}/>; }
