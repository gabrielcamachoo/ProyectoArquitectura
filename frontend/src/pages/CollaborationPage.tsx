import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Forum, ForumPost, StudyGroup } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

const SEED_COURSE = '00000000-0000-4000-8000-000000000001';

export function CollaborationPage() {
  const { user } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [postContent, setPostContent] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getForums(), api.getStudyGroups()])
      .then(([f, g]) => {
        setForums(f.items ?? []);
        setGroups(g.items ?? []);
        if (f.items?.[0]) selectForum(f.items[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectForum = async (forum: Forum) => {
    setSelectedForum(forum);
    const res = await api.getForumPosts(forum.id);
    setPosts(res.items ?? []);
  };

  const sendPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedForum || !user) return;
    await api.createForumPost(selectedForum.id, { authorId: user.id, content: postContent });
    setPostContent('');
    await selectForum(selectedForum);
  };

  const createGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await api.createStudyGroup({ courseId: SEED_COURSE, name: groupName, leaderId: user.id });
    setGroupName('');
    const g = await api.getStudyGroups();
    setGroups(g.items ?? []);
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-grid two-col">
      <div>
        <Card title="Foros del curso">
          <div className="list-stack">
            {forums.map((f) => (
              <button key={f.id} type="button" className={`list-item ${selectedForum?.id === f.id ? 'active' : ''}`} onClick={() => selectForum(f)}>
                {f.title}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Grupos de estudio" className="mt">
          <ul className="simple-list">
            {groups.map((g) => (
              <li key={g.id}>{g.name}</li>
            ))}
          </ul>
          <form className="form-stack mt" onSubmit={createGroup}>
            <Input label="Nuevo grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
            <Button type="submit" size="sm">
              Crear grupo
            </Button>
          </form>
        </Card>
      </div>
      <Card title={selectedForum?.title ?? 'Publicaciones'} subtitle="Colaboración entre pares">
        <div className="posts-feed">
          {posts.map((p) => (
            <article key={p.id} className="post-item">
              <header>
                <strong>{p.authorId}</strong>
                <time>{new Date(p.createdAt).toLocaleString('es-CO')}</time>
              </header>
              <p>{p.content}</p>
            </article>
          ))}
        </div>
        <form className="form-stack mt" onSubmit={sendPost}>
          <label className="field">
            <span className="field-label">Nueva publicación</span>
            <textarea className="field-input" rows={3} value={postContent} onChange={(e) => setPostContent(e.target.value)} required />
          </label>
          <Button type="submit">Publicar</Button>
        </form>
      </Card>
    </div>
  );
}
