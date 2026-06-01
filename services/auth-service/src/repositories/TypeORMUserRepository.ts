import { UserEntity } from '../domain/entities/User';
import { RoleEntity } from '../domain/entities/Role';
import { User } from '../domain/types';
import { AppDataSource } from './dataSource';

export class TypeORMUserRepository {
  private getRepository() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(UserEntity);
  }

  private async resolveRoleId(roleName: string): Promise<string> {
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const role = await roleRepo.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`role_not_found:${roleName}`);
    }
    return role.id;
  }

  async create(user: User): Promise<User> {
    const repository = this.getRepository();
    const roleId = await this.resolveRoleId(user.role);
    const entity = repository.create({
      id: user.id,
      fullName: user.fullName,
      institutionalEmail: user.institutionalEmail,
      passwordHash: user.passwordHash,
      roleId,
      status: user.status,
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    });
    const saved = await repository.save(entity);
    return this.entityToUser(saved);
  }

  async update(user: User): Promise<User> {
    const repository = this.getRepository();
    const entity = await repository.findOne({ where: { id: user.id }, relations: ['role'] });
    if (!entity) throw new Error('User not found');

    entity.fullName = user.fullName;
    entity.institutionalEmail = user.institutionalEmail;
    entity.passwordHash = user.passwordHash;
    entity.status = user.status;
    entity.updatedAt = new Date(user.updatedAt);

    const saved = await repository.save(entity);
    return this.entityToUser(saved);
  }

  async findById(id: string): Promise<User | null> {
    const repository = this.getRepository();
    const entity = await repository.findOne({ where: { id }, relations: ['role'] });
    return entity ? this.entityToUser(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const repository = this.getRepository();
    const entity = await repository.findOne({
      where: { institutionalEmail: email },
      relations: ['role']
    });
    return entity ? this.entityToUser(entity) : null;
  }

  async listPublic(): Promise<Array<Pick<User, 'id' | 'fullName' | 'institutionalEmail' | 'role' | 'status' | 'createdAt'>>> {
    const repository = this.getRepository();
    const entities = await repository.find({ relations: ['role'] });
    return entities.map((entity) => ({
      id: entity.id,
      fullName: entity.fullName,
      institutionalEmail: entity.institutionalEmail,
      role: (entity.role?.name as User['role']) || 'student',
      status: entity.status,
      createdAt: entity.createdAt.toISOString()
    }));
  }

  async delete(id: string): Promise<void> {
    const repository = this.getRepository();
    await repository.delete(id);
  }

  private entityToUser(entity: UserEntity): User {
    return {
      id: entity.id,
      fullName: entity.fullName,
      institutionalEmail: entity.institutionalEmail,
      passwordHash: entity.passwordHash,
      role: (entity.role?.name as User['role']) || 'student',
      status: entity.status,
      consent: entity.consentAccepted,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }
}
