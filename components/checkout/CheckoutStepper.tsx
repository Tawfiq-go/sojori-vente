'use client';

import styles from './CheckoutStepper.module.css';

export type CheckoutStep = 1 | 2;

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
}

const STEPS: Array<{ number: CheckoutStep; label: string }> = [
  { number: 1, label: 'Informations & Paiement' },
  { number: 2, label: 'Confirmation' },
];

export default function CheckoutStepper({ currentStep, onStepClick }: CheckoutStepperProps) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((step, index) => {
        const isDone = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isClickable = isDone && onStepClick;

        return (
          <div key={step.number} className={styles.stepWrapper}>
            <div
              className={`${styles.step} ${isDone ? styles.done : ''} ${isActive ? styles.active : ''}`}
              onClick={() => isClickable && onStepClick(step.number)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              <div className={styles.number}>
                {isDone ? (
                  <span className={styles.checkmark}>✓</span>
                ) : (
                  <span className={styles.num}>{step.number}</span>
                )}
              </div>
              <span className={styles.label}>{step.label}</span>
            </div>

            {/* Line between steps */}
            {index < STEPS.length - 1 && (
              <div className={`${styles.line} ${isDone ? styles.lineDone : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
