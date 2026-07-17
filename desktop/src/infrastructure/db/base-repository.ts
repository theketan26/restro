export interface BaseRepository<T, TKey = string> {
  findAll(): Promise<T[]>;
  findById(id: TKey): Promise<T | undefined>;
  save(entity: T): Promise<TKey>;
  saveMany(entities: T[]): Promise<void>;
  update(id: TKey, partial: Partial<T>): Promise<void>;
  delete(id: TKey): Promise<void>;
}
