import { randomUUID } from 'crypto';
import { ForumEntity, ForumPost, StudyGroup, TutoringSession } from '../domain/entities';
import { AppDataSource } from './dataSource';

export interface Forum {
  id: string;
  courseId: string;
  title: string;
  status: 'active' | 'archived';
  moderatorId: string;
}

export interface ForumPostDTO {
  id: string;
  forumId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface StudyGroupDTO {
  id: string;
  courseId: string;
  name: string;
  leaderId: string;
  status: 'active' | 'archived';
}

export interface TutoringDTO {
  id: string;
  tutorId: string;
  tuteeId: string;
  courseId: string;
  topic?: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export class TypeORMCollaborationRepository {
  private get forumRepo() { return AppDataSource.getRepository(ForumEntity); }
  private get postRepo() { return AppDataSource.getRepository(ForumPost); }
  private get groupRepo() { return AppDataSource.getRepository(StudyGroup); }
  private get tutoringRepo() { return AppDataSource.getRepository(TutoringSession); }

  // Forums
  async getForums(): Promise<Forum[]> {
    const forums = await this.forumRepo.find();
    return forums.map((f) => this.entityToForum(f));
  }

  async createForum(data: { courseId: string; title: string; moderatorId: string }): Promise<Forum> {
    const entity = this.forumRepo.create({
      id: randomUUID(),
      courseId: data.courseId,
      title: data.title,
      status: 'active',
      moderatorId: data.moderatorId
    });
    const saved = await this.forumRepo.save(entity);
    return this.entityToForum(saved);
  }

  // Forum Posts
  async getForumPosts(forumId: string): Promise<ForumPostDTO[]> {
    const posts = await this.postRepo.findBy({ forumId });
    return posts.map((p) => this.entityToForumPost(p));
  }

  async createForumPost(forumId: string, data: { authorId: string; content: string }): Promise<ForumPostDTO> {
    const entity = this.postRepo.create({
      id: randomUUID(),
      forumId,
      authorId: data.authorId,
      content: data.content
    });
    const saved = await this.postRepo.save(entity);
    return this.entityToForumPost(saved);
  }

  // Study Groups
  async getStudyGroups(): Promise<StudyGroupDTO[]> {
    const groups = await this.groupRepo.find();
    return groups.map((g) => this.entityToStudyGroup(g));
  }

  async createStudyGroup(data: { courseId: string; name: string; leaderId: string }): Promise<StudyGroupDTO> {
    const entity = this.groupRepo.create({
      id: randomUUID(),
      courseId: data.courseId,
      name: data.name,
      leaderId: data.leaderId,
      status: 'active'
    });
    const saved = await this.groupRepo.save(entity);
    return this.entityToStudyGroup(saved);
  }

  // Tutoring Sessions
  async getTutoringSessions(userId?: string, role?: string): Promise<TutoringDTO[]> {
    const sessions = await this.tutoringRepo.find();
    let filtered = sessions.map((s) => this.entityToTutoring(s));

    if (userId && role === 'tutor') {
      filtered = filtered.filter((s) => s.tutorId === userId);
    } else if (userId && role === 'tutee') {
      filtered = filtered.filter((s) => s.tuteeId === userId);
    } else if (userId) {
      filtered = filtered.filter((s) => s.tutorId === userId || s.tuteeId === userId);
    }

    return filtered;
  }

  async createTutoringSession(data: {
    tutorId: string;
    tuteeId: string;
    courseId: string;
    topic?: string;
    scheduledAt?: string;
  }): Promise<TutoringDTO> {
    const entity = this.tutoringRepo.create({
      id: randomUUID(),
      tutorId: data.tutorId,
      tuteeId: data.tuteeId,
      courseId: data.courseId,
      topic: data.topic,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
      status: 'scheduled'
    });
    const saved = await this.tutoringRepo.save(entity);
    return this.entityToTutoring(saved);
  }

  async updateTutoringStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled'): Promise<TutoringDTO | null> {
    const session = await this.tutoringRepo.findOneBy({ id });
    if (!session) return null;

    session.status = status;
    const saved = await this.tutoringRepo.save(session);
    return this.entityToTutoring(saved);
  }

  private entityToForum(entity: ForumEntity): Forum {
    return {
      id: entity.id,
      courseId: entity.courseId,
      title: entity.title,
      status: entity.status,
      moderatorId: entity.moderatorId
    };
  }

  private entityToForumPost(entity: ForumPost): ForumPostDTO {
    return {
      id: entity.id,
      forumId: entity.forumId,
      authorId: entity.authorId,
      content: entity.content,
      createdAt: entity.createdAt.toISOString()
    };
  }

  private entityToStudyGroup(entity: StudyGroup): StudyGroupDTO {
    return {
      id: entity.id,
      courseId: entity.courseId,
      name: entity.name,
      leaderId: entity.leaderId,
      status: entity.status
    };
  }

  private entityToTutoring(entity: TutoringSession): TutoringDTO {
    return {
      id: entity.id,
      tutorId: entity.tutorId,
      tuteeId: entity.tuteeId,
      courseId: entity.courseId,
      topic: entity.topic,
      scheduledAt: entity.scheduledAt.toISOString(),
      status: entity.status
    };
  }
}
