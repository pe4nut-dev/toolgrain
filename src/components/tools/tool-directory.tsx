'use client';
import { useRef, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { categories, tools, getCategory, type CategoryId } from '@/lib/tools';
import { ToolGrid } from './tool-card';

export function ToolDirectory({ initialCategory }: { initialCategory?: string | null }) {
  const [category, setCategory] = useState<CategoryId | 'all'>(categories.find(item => item.id === initialCategory)?.id ?? 'all');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTerm = query.trim().toLowerCase();
  const filtered = tools.filter(tool =>
    (category === 'all' || tool.category === category) &&
    [tool.name, tool.shortDescription, tool.description, getCategory(tool.category).name]
      .join(' ').toLowerCase().includes(searchTerm)
  );
  const allPlanned = tools.every(tool => tool.status === 'coming-soon');

  function resetFilters() {
    setCategory('all');
    setQuery('');
    searchRef.current?.focus();
  }

  return <>
    <p className="directory-value">Small tools. No complicated software.</p>
    <div className="directory-controls">
      <div className="filters" role="group" aria-label="Filter by category">
        <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All tools <span>{tools.length}</span></button>
        {categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.name}<span>{tools.filter(tool => tool.category === item.id).length}</span></button>)}
      </div>
      <label className="search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search tools</span>
        <input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tools…" />
      </label>
    </div>
    <p className="result-count" role="status" aria-live="polite" aria-atomic="true">{filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}{allPlanned && ' · In development'}</p>
    {filtered.length ? <ToolGrid items={filtered} /> : <div className="empty-state">
      <Search size={28} aria-hidden="true" />
      <h2>No tools found.</h2>
      <p>{category === 'marketing' && !searchTerm ? 'Marketing tools are on the way. Explore another category for now.' : 'Try a different search or reset your filters.'}</p>
      <button type="button" className="button secondary" onClick={resetFilters}>Reset filters <ArrowRight size={16} aria-hidden="true" /></button>
    </div>}
  </>;
}
