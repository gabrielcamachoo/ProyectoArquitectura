import AdminView from '../views/AdminView';
import StudentView from '../views/StudentView';
import TeacherView from '../views/TeacherView';

export function useRoleView(role: 'student' | 'teacher' | 'admin') {
  if (role === 'teacher') return <TeacherView />;
  if (role === 'admin') return <AdminView />;
  return <StudentView />;
}
