import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
