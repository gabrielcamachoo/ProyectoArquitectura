export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  fullName: string;
  institutionalEmail: string;
  passwordHash: string;
  role: Role;
  status: 'active' | 'inactive';
  consent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserExport extends Omit<User, 'passwordHash'> {
  passwordHashMasked: string;
}
