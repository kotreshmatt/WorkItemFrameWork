import { User } from '../orgmodel/User';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
}
