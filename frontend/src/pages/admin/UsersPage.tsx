import { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    authAPI.listUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Administrar Usuarios</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Lista de todos los usuarios registrados en la plataforma.</p>

      {users.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No hay usuarios registrados o no tienes permisos suficientes.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Nombre</th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 12 }}>{u.fullName}</td>
                <td style={{ padding: 12 }}>{u.institutionalEmail}</td>
                <td style={{ padding: 12 }}>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
