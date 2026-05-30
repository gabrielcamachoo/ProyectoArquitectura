export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'info' | 'danger' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
