'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export type ToolTourStep = {
  id: string;
  title: string;
  description: string;
  image: { src: string; alt: string; width: number; height: number };
};

export function ToolTour({ title, steps }: {
  title: string;
  steps: readonly [ToolTourStep, ...ToolTourStep[]];
}) {
  const [current, setCurrent] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const id = useId();
  const step = steps[current];
  const last = current === steps.length - 1;
  return <section className="tool-tour" aria-labelledby={id + '-title'}>
    <div className="tool-tour-header"><h2 id={id + '-title'}>{title}</h2><span>Step {current + 1} of {steps.length}</span></div>
    <progress aria-label="Tour progress" value={current + 1} max={steps.length} />
    <div className="tool-tour-image" style={{ aspectRatio: `${step.image.width} / ${step.image.height}` }}>
      {failedImage === step.image.src ? <p className="tool-tour-fallback">Screenshot unavailable. Follow the step below, or open CSV Compare to explore the interface.</p> : <Image key={step.image.src} src={step.image.src} alt={step.image.alt} width={step.image.width} height={step.image.height} loading="lazy" unoptimized onError={() => setFailedImage(step.image.src)} />}
    </div>
    <div className="tool-tour-copy" aria-live="polite" aria-atomic="true"><p className="eyebrow">STEP {String(current + 1).padStart(2, '0')}</p><h3>{step.title}</h3><p>{step.description}</p></div>
    {failedImage !== step.image.src && <a className="text-link" href={step.image.src} target="_blank" rel="noopener noreferrer">View full-size screenshot<span className="sr-only"> (opens in a new tab)</span></a>}
    <div className="tool-tour-controls">
      <button className="button secondary" type="button" disabled={current === 0} onClick={() => setCurrent(index => Math.max(0, index - 1))}><ArrowLeft size={16} aria-hidden="true" />Previous</button>
      <button className="button" type="button" onClick={() => setCurrent(index => last ? 0 : Math.min(steps.length - 1, index + 1))}>{last ? <><RotateCcw size={16} aria-hidden="true" />Restart</> : <>Next<ArrowRight size={16} aria-hidden="true" /></>}</button>
    </div>
  </section>;
}
