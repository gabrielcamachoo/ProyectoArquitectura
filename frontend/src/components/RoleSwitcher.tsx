import { useAuth } from '../context/AuthContext';

export default function RoleSwitcher() {
  const { role, setRole } = useAuth();
  return (
    <select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher' | 'admin')}>
      <option value="student">student</option>
      <option value="teacher">teacher</option>
      <option value="admin">admin</option>
    </select>
  );
}
