import './App.css';
import RoleSwitcher from './components/RoleSwitcher';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRoleView } from './hooks/useRoleView';

function Main() {
  const { role } = useAuth();
  return (
    <>
      <h1>Plataforma de Aprendizaje Adaptativo y Colaborativo</h1>
      <RoleSwitcher />
      {useRoleView(role)}
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
