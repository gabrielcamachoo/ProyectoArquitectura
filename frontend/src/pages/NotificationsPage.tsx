import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Notification } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const res = await api.getNotifications(user.id);
    setItems(res.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-grid">
      <Card title="Centro de notificaciones" subtitle="Eventos académicos vía RabbitMQ">
        {items.length === 0 ? (
          <p className="muted">No tiene notificaciones. Se generan al calificar evaluaciones o emitir recomendaciones.</p>
        ) : (
          <div className="list-stack">
            {items.map((n) => (
              <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`}>
                <div>
                  <Badge tone={n.read ? 'neutral' : 'info'}>{n.type}</Badge>
                  <p>{typeof n.content === 'string' ? n.content : JSON.stringify(n.content)}</p>
                  <time>{new Date(n.createdAt).toLocaleString('es-CO')}</time>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Marcar leída
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
