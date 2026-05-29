import './App.css';
import RoleSwitcher from './components/RoleSwitcher';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { getRoleView } from './hooks/useRoleView';

function Main() {
  const { role } = useAuth();
  return (
    <>
      <h1>Plataforma de Aprendizaje Adaptativo y Colaborativo</h1>
      <RoleSwitcher />
      {getRoleView(role)}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
