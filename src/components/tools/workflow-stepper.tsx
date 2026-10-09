export function WorkflowStepper({ steps, current }: { steps: readonly string[]; current: string }) {
  const active = steps.indexOf(current);
  return <ol className="tool-workflow-stepper" aria-label="Workflow progress">{steps.map((step, index) => <li key={step} className={index < active ? 'is-complete' : undefined} aria-current={index === active ? 'step' : undefined}>
    <span className="tool-step-number" aria-hidden="true">{index < active ? '✓' : index + 1}</span><span>{step}</span><span className="sr-only">: {index < active ? 'completed' : index === active ? 'current step' : 'upcoming'}</span>
  </li>)}</ol>;
}
