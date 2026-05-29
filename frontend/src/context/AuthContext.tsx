import { createContext, useContext, useMemo, useState } from 'react';

type Role = 'student' | 'teacher' | 'admin';

const AuthContext = createContext<{ role: Role; setRole: (r: Role) => void }>({ role: 'student', setRole: () => undefined });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('student');
  const value = useMemo(() => ({ role, setRole }), [role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
