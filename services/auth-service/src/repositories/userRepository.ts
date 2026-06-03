import { User } from '../domain/types';
import { TypeORMUserRepository } from './TypeORMUserRepository';
import { AppDataSource } from './dataSource';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

export class UserRepository {
  private typeormRepo = new TypeORMUserRepository();
  private inMemory = new Map<string, User>();
  private usePostgres = AppDataSource.isInitialized;

  constructor() {
    this.usePostgres = AppDataSource.isInitialized;
    this.seedIfInMemory();
  }

  private seedIfInMemory() {
    if (this.usePostgres) return;
    if (process.env.NODE_ENV === 'production') return;

    const now = new Date().toISOString();
    const passwordHashStudent = bcrypt.hashSync('StudentPass123!', 12);
    const passwordHashTeacher = bcrypt.hashSync('TeacherPass123!', 12);
    const passwordHashAdmin = bcrypt.hashSync('AdminPass123!', 12);

    const users: User[] = [
      {
        id: randomUUID(),
        fullName: 'Demo Student',
        institutionalEmail: 'student_demo@puj.edu.co',
        passwordHash: passwordHashStudent,
        role: 'student',
        status: 'active',
        consent: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: randomUUID(),
        fullName: 'Demo Teacher',
        institutionalEmail: 'teacher_demo@puj.edu.co',
        passwordHash: passwordHashTeacher,
        role: 'teacher',
        status: 'active',
        consent: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: randomUUID(),
        fullName: 'Demo Admin',
        institutionalEmail: 'admin_demo@puj.edu.co',
        passwordHash: passwordHashAdmin,
        role: 'admin',
        status: 'active',
        consent: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const user of users) {
      if (![...this.inMemory.values()].some((u) => u.institutionalEmail === user.institutionalEmail)) {
        this.inMemory.set(user.id, user);
      }
    }
  }

  async list(): Promise<User[]> {
    if (this.usePostgres) {
      const public_list = await this.typeormRepo.listPublic();
      return public_list as User[];
    }
    return [...this.inMemory.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listPublic(): Promise<Array<Pick<User, 'id' | 'fullName' | 'institutionalEmail' | 'role' | 'status' | 'createdAt'>>> {
    if (this.usePostgres) {
      return this.typeormRepo.listPublic();
    }
    return [...this.inMemory.values()].map(({ id, fullName, institutionalEmail, role, status, createdAt }) => ({
      id,
      fullName,
      institutionalEmail,
      role,
      status,
      createdAt
    }));
  }

  async create(user: User): Promise<User> {
    if (this.usePostgres) {
      return this.typeormRepo.create(user);
    }
    this.inMemory.set(user.id, user);
    return user;
  }

  async update(user: User): Promise<User> {
    if (this.usePostgres) {
      return this.typeormRepo.update(user);
    }
    this.inMemory.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.usePostgres) {
      return this.typeormRepo.findByEmail(email);
    }
    return [...this.inMemory.values()].find((u) => u.institutionalEmail === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    if (this.usePostgres) {
      return this.typeormRepo.findById(id);
    }
    return this.inMemory.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    if (this.usePostgres) {
      await this.typeormRepo.delete(id);
      return;
    }
    this.inMemory.delete(id);
  }
}
