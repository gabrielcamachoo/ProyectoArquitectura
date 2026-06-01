import { User } from '../domain/types';
import { TypeORMUserRepository } from './TypeORMUserRepository';
import { AppDataSource } from './dataSource';

export class UserRepository {
  private typeormRepo = new TypeORMUserRepository();
  private inMemory = new Map<string, User>();
  private usePostgres = false;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, falling back to in-memory storage');
      return;
    }

    AppDataSource.initialize()
      .then(() => {
        this.usePostgres = true;
        console.log('Connected to PostgreSQL');
      })
      .catch((error) => {
        console.warn('PostgreSQL connection failed, falling back to in-memory storage:', error.message);
      });
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
