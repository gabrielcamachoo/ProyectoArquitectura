export function StatCard({ label, value, hint, icon }: { label: string; value: string | number; hint?: string; icon?: string }) {
  return (
    <div className="stat-card">
      {icon && <span className="stat-icon" aria-hidden>{icon}</span>}
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}
