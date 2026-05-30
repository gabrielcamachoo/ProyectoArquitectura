import type { ReactNode } from 'react';

export function Card({ title, subtitle, children, className = '' }: { title?: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="card-header">
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
