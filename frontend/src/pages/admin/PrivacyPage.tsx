import { useState } from 'react';
import { authAPI } from '../../services/api';

export default function PrivacyPage() {
  const [userId, setUserId] = useState('');
  const [exportData, setExportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true); setError(''); setExportData(null);
    try {
      const res = await authAPI.exportData(userId);
      setExportData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al exportar');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== userId) {
      setError('Confirma el ID correctamente'); return;
    }
    setLoading(true); setError('');
    try {
      await authAPI.deleteAccount(userId);
      setMessage(`✅ Datos de ${userId} anonimizados (Ley 1581 art. 8).`);
      setDeleteConfirm('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al anonimizar');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding:40, maxWidth:700, fontFamily: 'sans-serif' }}>
      <h1>Gestión de Privacidad</h1>
      <div style={{ padding:12, backgroundColor:'#fef9c3',
        border:'1px solid #fde047', borderRadius:8, marginBottom:24,
        fontSize:13 }}>
        🛡️ <strong>Ley 1581 de 2012</strong> — Protección de Datos Personales.
        Solo administradores pueden ejecutar estas acciones.
        Todas las operaciones quedan registradas en el log de auditoría.
      </div>

      <div style={{ marginBottom:24 }}>
        <label style={{ display:'block', marginBottom:6, fontWeight:600 }}>
          ID del Usuario
        </label>
        <input value={userId}
          onChange={e => setUserId(e.target.value)}
          placeholder="uuid del usuario"
          style={{ width:'100%', padding:'10px 12px',
            border:'1px solid #d1d5db', borderRadius:6,
            fontFamily:'monospace', boxSizing:'border-box' }} />
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        <button onClick={handleExport} disabled={!userId || loading}
          style={{ padding:'10px 20px', backgroundColor:'#1a56db',
            color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>
          📦 Exportar datos PII
        </button>
      </div>

      {exportData && (
        <div style={{ marginBottom:24, padding:16,
          backgroundColor:'#f0fdf4', border:'1px solid #86efac',
          borderRadius:8 }}>
          <h3 style={{ margin:'0 0 8px', color:'#16a34a' }}>
            Datos exportados (GET /auth/users/{userId}/data)
          </h3>
          <pre style={{ fontSize:12, overflow:'auto', maxHeight:300 }}>
            {JSON.stringify(exportData, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ padding:20, backgroundColor:'#fef2f2',
        border:'2px solid #fca5a5', borderRadius:8 }}>
        <h3 style={{ color:'#dc2626', margin:'0 0 12px' }}>
          ⚠️ Anonimizar datos (Derecho al Olvido)
        </h3>
        <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 12px' }}>
          Esta acción anonimiza los datos PII (nombre, correo) pero
          conserva los datos académicos para estadísticas agregadas.
        </p>
        <label style={{ display:'block', marginBottom:6, fontSize:13 }}>
          Confirma el ID del usuario para proceder:
        </label>
        <input value={deleteConfirm}
          onChange={e => setDeleteConfirm(e.target.value)}
          placeholder="Repetir ID del usuario"
          style={{ width:'100%', padding:'8px 12px',
            border:'1px solid #fca5a5', borderRadius:6,
            marginBottom:10, boxSizing:'border-box',
            fontFamily:'monospace' }} />
        <button onClick={handleDelete}
          disabled={!userId || !deleteConfirm || loading}
          style={{ padding:'10px 20px', backgroundColor:'#dc2626',
            color:'white', border:'none', borderRadius:6,
            cursor:'pointer', fontWeight:600 }}>
          🗑️ Anonimizar datos permanentemente
        </button>
      </div>

      {message && (
        <div style={{ marginTop:16, padding:12, backgroundColor:'#f0fdf4',
          border:'1px solid #16a34a', borderRadius:6, color:'#16a34a' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ marginTop:16, padding:12, backgroundColor:'#fef2f2',
          border:'1px solid #dc2626', borderRadius:6, color:'#dc2626' }}>
          {error}
        </div>
      )}
    </div>
  );
}
