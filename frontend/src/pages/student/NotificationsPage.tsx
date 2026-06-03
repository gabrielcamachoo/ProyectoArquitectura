import { useEffect, useState } from 'react';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    notificationsAPI.getStudentNotifications(user.id)
      .then(data => {
        setNotifs(Array.isArray(data) ? data : (data?.items || data?.notifications || []));
      })
      .catch((err) => {
        console.error(err);
        setNotifs([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const validNotifs = Array.isArray(notifs) ? notifs : [];
  const unread = validNotifs.filter(n => !n.read).length;

  return (
    <div style={{ padding:40, maxWidth:700, fontFamily: 'sans-serif' }}>
      <h1>Notificaciones
        {unread > 0 && (
          <span style={{ marginLeft:10, padding:'2px 10px',
            backgroundColor:'#dc2626', color:'white', borderRadius:20,
            fontSize:14 }}>{unread} nuevas</span>
        )}
      </h1>
      {loading && <p>Cargando notificaciones...</p>}
      {!loading && validNotifs.length === 0 && (
        <p style={{ color:'#6b7280' }}>No tienes notificaciones.</p>
      )}
      {validNotifs.map(n => (
        <div key={n.id} style={{ padding:16, marginBottom:12,
          backgroundColor: n.read ? '#f9fafb' : '#eff6ff',
          border: `1px solid ${n.read ? '#e5e7eb' : '#bfdbfe'}`,
          borderRadius:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <p style={{ margin:0, fontWeight: n.read ? 400 : 600 }}>
              {n.message}
            </p>
            {!n.read && (
              <span style={{ padding:'2px 8px', backgroundColor:'#1a56db',
                color:'white', borderRadius:12, fontSize:11,
                whiteSpace:'nowrap', marginLeft:12 }}>Nueva</span>
            )}
          </div>
          <p style={{ margin:'6px 0 0', fontSize:12, color:'#9ca3af' }}>
            {new Date(n.createdAt).toLocaleString('es-CO')}
          </p>
        </div>
      ))}
    </div>
  );
}
