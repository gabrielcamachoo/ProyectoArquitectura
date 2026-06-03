import { useEffect, useState } from 'react';
import { collaborationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CollaborationPage() {
  const { user } = useAuth();
  const [forums, setForums] = useState<any[]>([]);
  const [selectedForum, setSelectedForum] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    collaborationAPI.getForums()
      .then(res => setForums(res.data.items ?? res.data ?? []))
      .catch(console.error);
  }, []);

  const openForum = (forum: any) => {
    setSelectedForum(forum);
    loadPosts(forum.id);
  };

  const loadPosts = (forumId: string) => {
    collaborationAPI.getForumPosts(forumId)
      .then(res => setPosts(res.data.items ?? res.data ?? []))
      .catch(console.error);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !selectedForum) return;
    setLoading(true);
    try {
      await collaborationAPI.createForumPost(selectedForum.id, {
        content: newPost,
        authorId: user?.id
      });
      setNewPost('');
      loadPosts(selectedForum.id);
    } catch (err) {
      console.error(err);
      alert('Error al publicar mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Foros de Colaboración</h2>
      <div style={{ padding: 24, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e3a8a' }}>💬 Espacio Colaborativo</h3>
        <p style={{ margin: 0, color: '#1e40af' }}>Interactúa con tus compañeros en foros de discusión.</p>
      </div>

      {!selectedForum ? (
        <>
          {forums.length === 0 ? (
            <div style={{ padding: 32, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ color: '#6b7280', margin: 0 }}>No hay hilos de discusión activos en este momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {forums.map(f => (
                <div key={f.id} onClick={() => openForum(f)} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                     onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                     onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#003b5c' }}>{f.title}</h4>
                  <p style={{ margin: 0, color: '#4b5563', fontSize: 14 }}>{f.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <button onClick={() => setSelectedForum(null)} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#003b5c', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Volver a los Foros
          </button>
          
          <div style={{ padding: 20, border: '1px solid #d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>{selectedForum.title}</h3>
            <p style={{ color: '#4b5563', margin: 0 }}>{selectedForum.description}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {posts.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', margin: '20px 0' }}>No hay mensajes aún. ¡Sé el primero en participar!</p>
            ) : (
              posts.map(p => (
                <div key={p.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white' }}>
                  <p style={{ margin: '0 0 8px 0' }}>{p.content}</p>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Publicado el {new Date(p.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePost} style={{ display: 'flex', gap: 12 }}>
            <input type="text" value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Escribe tu mensaje..." required
              style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: '1px solid #d1d5db' }} />
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#003b5c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              {loading ? '...' : 'Enviar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
