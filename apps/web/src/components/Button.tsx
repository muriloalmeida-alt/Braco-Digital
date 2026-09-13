import { type ButtonHTMLAttributes } from 'react';
import './Button.css';

type Variant = 'filled' | 'text' | 'outlined';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Composição M3 (Filled Button / Text Button / Outlined Button) —
 * docs/design/18-catalog-availability-ui-spec.md §3.
 */
export function Button({ variant = 'filled', className, ...rest }: ButtonProps) {
  return <button className={`braco-button braco-button--${variant} ${className ?? ''}`} {...rest} />;
}
