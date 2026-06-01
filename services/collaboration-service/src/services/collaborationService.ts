import { randomUUID } from 'crypto';
import {
  TypeORMCollaborationRepository,
  Forum,
  ForumPostDTO,
  StudyGroupDTO,
  TutoringDTO
} from '../repositories/TypeORMCollaborationRepository';
import { AppDataSource } from '../repositories/dataSource';

const forums = new Map<string, Forum>();
const forumPosts = new Map<string, ForumPostDTO[]>();
const studyGroups = new Map<string, StudyGroupDTO>();
const tutoringSessions = new Map<string, TutoringDTO>();

let typeormRepo: TypeORMCollaborationRepository | null = null;

const getRepository = (): TypeORMCollaborationRepository | null => {
  if (AppDataSource.isInitialized) {
    if (!typeormRepo) {
      typeormRepo = new TypeORMCollaborationRepository();
    }
    return typeormRepo;
  }
  return null;
};

const ensureSeed = () => {
  if (forums.size > 0) return;
  const forum: Forum = {
    id: randomUUID(),
    courseId: '00000000-0000-4000-8000-000000000001',
    title: 'Foro general — Arquitectura de Software',
    status: 'active',
    moderatorId: 'teacher-demo'
  };
  forums.set(forum.id, forum);
  forumPosts.set(forum.id, [
    {
      id: randomUUID(),
      forumId: forum.id,
      authorId: 'teacher-demo',
      content: 'Bienvenidos al foro del curso. Compartan dudas sobre microservicios y el proyecto integrador.',
      createdAt: new Date().toISOString()
    }
  ]);
};

export class CollaborationService {
  async listForums(): Promise<Forum[]> {
    const repo = getRepository();
    if (repo) return repo.getForums();
    ensureSeed();
    return [...forums.values()];
  }

  async createForum(data: { courseId: string; title: string; moderatorId: string }): Promise<Forum> {
    if (!data.courseId || !data.title) throw new Error('course_id_and_title_required');

    const repo = getRepository();
    if (repo) return repo.createForum(data);

    const forum: Forum = { id: randomUUID(), ...data, status: 'active' };
    forums.set(forum.id, forum);
    return forum;
  }

  async listForumPosts(forumId: string): Promise<ForumPostDTO[]> {
    const repo = getRepository();
    if (repo) return repo.getForumPosts(forumId);
    return forumPosts.get(forumId) ?? [];
  }

  async createForumPost(forumId: string, data: { authorId: string; content: string }): Promise<ForumPostDTO> {
    if (!data.content?.trim()) throw new Error('content_required');

    const repo = getRepository();
    if (repo) return repo.createForumPost(forumId, data);

    const post: ForumPostDTO = {
      id: randomUUID(),
      forumId,
      ...data,
      createdAt: new Date().toISOString()
    };
    const items = forumPosts.get(forumId) ?? [];
    items.push(post);
    forumPosts.set(forumId, items);
    return post;
  }

  async listStudyGroups(): Promise<StudyGroupDTO[]> {
    const repo = getRepository();
    if (repo) return repo.getStudyGroups();
    return [...studyGroups.values()];
  }

  async createStudyGroup(data: { courseId: string; name: string; leaderId: string }): Promise<StudyGroupDTO> {
    if (!data.courseId || !data.name) throw new Error('course_id_and_name_required');

    const repo = getRepository();
    if (repo) return repo.createStudyGroup(data);

    const group: StudyGroupDTO = { id: randomUUID(), ...data, status: 'active' };
    studyGroups.set(group.id, group);
    return group;
  }

  async listTutoring(userId?: string, role?: string): Promise<TutoringDTO[]> {
    const repo = getRepository();
    if (repo) return repo.getTutoringSessions(userId, role);

    let items = [...tutoringSessions.values()];
    if (userId && role === 'tutor') items = items.filter((t) => t.tutorId === userId);
    else if (userId && role === 'tutee') items = items.filter((t) => t.tuteeId === userId);
    else if (userId) items = items.filter((t) => t.tutorId === userId || t.tuteeId === userId);
    return items;
  }

  async createTutoring(data: {
    tutorId: string;
    tuteeId: string;
    courseId: string;
    topic?: string;
    scheduledAt?: string;
  }): Promise<TutoringDTO> {
    if (!data.tutorId || !data.tuteeId || !data.courseId) {
      throw new Error('tutor_tutee_course_required');
    }

    const repo = getRepository();
    if (repo) return repo.createTutoringSession(data);

    const tutoring: TutoringDTO = {
      id: randomUUID(),
      ...data,
      scheduledAt: data.scheduledAt ?? new Date().toISOString(),
      status: 'scheduled'
    };
    tutoringSessions.set(tutoring.id, tutoring);
    return tutoring;
  }

  async updateTutoringStatus(id: string, status: TutoringDTO['status']): Promise<TutoringDTO | null> {
    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      throw new Error('invalid_status');
    }

    const repo = getRepository();
    if (repo) return repo.updateTutoringStatus(id, status);

    const session = tutoringSessions.get(id);
    if (!session) return null;
    const updated = { ...session, status };
    tutoringSessions.set(updated.id, updated);
    return updated;
  }

  async matchTutorsByTopic(courseId: string, topic: string): Promise<TutoringDTO[]> {
    const normalized = topic.trim().toLowerCase();
    if (!normalized) throw new Error('topic_required');

    const sessions = await this.listTutoring();
    return sessions.filter(
      (s) =>
        s.courseId === courseId &&
        s.status === 'scheduled' &&
        (s.topic?.toLowerCase().includes(normalized) ?? false)
    );
  }
}

let serviceInstance: CollaborationService | null = null;

export function getCollaborationService(): CollaborationService {
  if (!serviceInstance) {
    serviceInstance = new CollaborationService();
  }
  return serviceInstance;
}
