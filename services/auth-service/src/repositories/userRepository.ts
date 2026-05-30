import { User } from '../domain/types';

export class UserRepository {
  private users = new Map<string, User>();

  async list(): Promise<User[]> {
    return [...this.users.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listPublic(): Promise<Array<Pick<User, 'id' | 'fullName' | 'institutionalEmail' | 'role' | 'status' | 'createdAt'>>> {
    return (await this.list()).map(({ id, fullName, institutionalEmail, role, status, createdAt }) => ({
      id,
      fullName,
      institutionalEmail,
      role,
      status,
      createdAt
    }));
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.institutionalEmail === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}
