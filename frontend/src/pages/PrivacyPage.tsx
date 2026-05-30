import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { UserExport, UserSummary } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

export function PrivacyPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [exportData, setExportData] = useState<UserExport | null>(null);
  const [loading, setLoading] = useState(isAdmin);
  const [message, setMessage] = useState('');
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    api
      .listUsers()
      .then((res) => setUsers(res.items ?? []))
      .catch(() => setMessage('No se pudo cargar el listado de usuarios.'))
      .finally(() => setLoading(false));
  }, [isAdmin, user]);

  const handleExport = async (id: string) => {
    setMessage('');
    try {
      const data = await api.exportUserData(id);
      setExportData(data);
      setMessage('Exportación generada (Ley 1581 de 2012 — derecho de acceso).');
    } catch {
      setMessage('Usuario no encontrado o sin permisos.');
      setExportData(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Confirma la supresión/anonimización de datos personales? Esta acción es irreversible.')) return;
    try {
      await api.deleteUserData(id);
      setMessage('Datos anonimizados correctamente (derecho de supresión).');
      setExportData(null);
      if (isAdmin) {
        const res = await api.listUsers();
        setUsers(res.items ?? []);
      }
    } catch {
      setMessage('No se pudo completar la supresión.');
    }
  };

  const downloadJson = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datos-personales-${exportData.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onExportSelf = async (e: FormEvent) => {
    e.preventDefault();
    await handleExport(user?.id ?? manualId);
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-grid">
      <section className="hero-banner compact">
        <h2>Protección de datos personales</h2>
        <p>Ley 1581 de 2012 (Colombia) — derecho de acceso, rectificación y supresión de información.</p>
      </section>

      {!isAdmin && (
        <Card title="Mis datos personales">
          <form className="form-stack" onSubmit={onExportSelf}>
            <p className="muted">Puede exportar una copia completa de su información registrada en la plataforma.</p>
            <Button type="submit">Exportar mis datos</Button>
          </form>
        </Card>
      )}

      {isAdmin && (
        <Card title="Administración — usuarios registrados" subtitle="Gestión Ley 1581">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.institutionalEmail}</td>
                    <td>
                      <Badge tone="info">{u.role}</Badge>
                    </td>
                    <td>{u.status}</td>
                    <td>
                      <div className="btn-row">
                        <Button size="sm" variant="secondary" onClick={() => handleExport(u.id)}>
                          Exportar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(u.id)}>
                          Suprimir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form
            className="form-inline mt"
            onSubmit={(e) => {
              e.preventDefault();
              handleExport(manualId);
            }}
          >
            <Input label="ID de usuario (manual)" value={manualId} onChange={(e) => setManualId(e.target.value)} />
            <Button type="submit" variant="secondary">
              Exportar por ID
            </Button>
          </form>
        </Card>
      )}

      {message && <p className={message.includes('correctamente') || message.includes('generada') ? 'form-success' : 'form-error'}>{message}</p>}

      {exportData && (
        <Card title="Resultado de exportación">
          <dl className="detail-list">
            <div>
              <dt>ID</dt>
              <dd>{exportData.id}</dd>
            </div>
            <div>
              <dt>Nombre</dt>
              <dd>{exportData.fullName}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{exportData.institutionalEmail}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{exportData.role}</dd>
            </div>
            <div>
              <dt>Consentimiento</dt>
              <dd>{exportData.consent ? 'Sí' : 'No'}</dd>
            </div>
            <div>
              <dt>Registro</dt>
              <dd>{new Date(exportData.createdAt).toLocaleString('es-CO')}</dd>
            </div>
          </dl>
          <div className="btn-row mt">
            <Button onClick={downloadJson}>Descargar JSON</Button>
            {isAdmin && (
              <Button variant="danger" onClick={() => handleDelete(exportData.id)}>
                Anonimizar usuario
              </Button>
            )}
          </div>
          <pre className="json-preview">{JSON.stringify(exportData, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}
