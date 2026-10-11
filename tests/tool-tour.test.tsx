/* eslint-disable @typescript-eslint/no-explicit-any -- Small React action harness, matching existing workflow tests without a DOM dependency. */
import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const state = vi.hoisted(() => ({ values: [] as any[], cursor: 0 }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useId: () => 'tour-test', useState: (initial: any) => {
  const index = state.cursor++;
  if (!(index in state.values)) state.values[index] = initial;
  return [state.values[index], (value: any) => { state.values[index] = typeof value === 'function' ? value(state.values[index]) : value; }];
} }));
import Image from 'next/image';
import { ToolTour } from '../src/components/guides/tool-tour';
import { csvCompareTourSteps } from '../src/config/csv-compare-tour';
function render() { state.cursor = 0; return ToolTour({ title: 'See CSV Compare in action', steps: csvCompareTourSteps }); }
function nodes(node: any): any[] { return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []; }
function button(tree: any, name: string) { return nodes(tree).find(node => node.type === 'button' && JSON.stringify(node.props.children).includes(name)); }
beforeEach(() => { state.values = []; state.cursor = 0; vi.stubGlobal('React', React); });
afterEach(() => vi.unstubAllGlobals());

describe('reusable ToolTour interactions', () => {
  it('contains exactly four authentic, consistently sized local screenshots and descriptions', () => {
    expect(csvCompareTourSteps.map(step => step.title)).toEqual(['Load two CSV files', 'Choose your matching key', 'Review the differences', 'Export your results']);
    expect(new Set(csvCompareTourSteps.map(step => step.id)).size).toBe(4);
    for (const step of csvCompareTourSteps) {
      const bytes = readFileSync(new URL('../public' + step.image.src, import.meta.url));
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
      expect(bytes.length).toBeLessThan(100_000);
      expect(step.image).toMatchObject({ width: 1160, height: 720 });
      expect(step.image.alt.length).toBeGreaterThan(30);
    }
  });
  it('starts on the first step with a disabled Previous boundary and accessible progress', () => {
    const tree = render();
    expect(button(tree, 'Previous').props.disabled).toBe(true);
    button(tree, 'Previous').props.onClick();
    expect(state.values[0]).toBe(0);
    expect(nodes(render()).find(node => node.type === 'progress').props).toMatchObject({ value: 1, max: 4, 'aria-label': 'Tour progress' });
  });
  it('supports next, previous, final-step restart and does not advance past the final step', () => {
    button(render(), 'Next').props.onClick(); expect(state.values[0]).toBe(1);
    button(render(), 'Previous').props.onClick(); expect(state.values[0]).toBe(0);
    for (let i = 0; i < 3; i++) button(render(), 'Next').props.onClick();
    expect(state.values[0]).toBe(3);
    expect(button(render(), 'Next')).toBeUndefined();
    expect(nodes(render()).find(node => node.type === 'progress').props.value).toBe(4);
    button(render(), 'Restart').props.onClick(); expect(state.values[0]).toBe(0);
  });
  it('uses native keyboard-accessible buttons and a polite step announcement', () => {
    const tree = render();
    for (const node of nodes(tree).filter(node => node.type === 'button')) expect(node.props.type).toBe('button');
    expect(nodes(tree).find(node => node.props['aria-live'] === 'polite').props['aria-atomic']).toBe('true');
    expect(tree.props['aria-labelledby']).toBe('tour-test-title');
  });
  it('shows a useful fallback after an image error and still allows navigation', () => {
    nodes(render()).find(node => node.type === Image).props.onError();
    const tree = render();
    expect(JSON.stringify(tree)).toContain('Screenshot unavailable');
    expect(nodes(tree).some(node => node.type === Image)).toBe(false);
    button(tree, 'Next').props.onClick();
    expect(nodes(render()).find(node => node.type === Image).props.src).toBe(csvCompareTourSteps[1].image.src);
  });
  it('lazy-loads local images with reserved dimensions and never calls analytics or browser storage', () => {
    const image = nodes(render()).find(node => node.type === Image);
    expect(image.props).toMatchObject({ width: 1160, height: 720, loading: 'lazy', unoptimized: true });
    const source = readFileSync(new URL('../src/components/guides/tool-tour.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/fetch\(|localStorage|sessionStorage|document\.cookie|umami|trackToolgrainEvent|setInterval/);
  });
});
