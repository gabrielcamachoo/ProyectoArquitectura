export interface RepositoryPort<T> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

export class InMemoryRepository<T extends { id: string }> implements RepositoryPort<T> {
  constructor(private readonly store = new Map<string, T>()) {}

  async list(): Promise<T[]> {
    return [...this.store.values()];
  }

  async getById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async save(entity: T): Promise<T> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
