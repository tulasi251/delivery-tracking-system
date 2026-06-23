// src/App.jsx
import { useStore } from './store/useStore.js';
import LoginPage from './pages/LoginPage.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';

export default function App() {
  const user = useStore(state => state.user);

  if (!user) return <LoginPage />;
  if (user.role === 'manager') return <ManagerDashboard />;
  if (user.role === 'driver') return <DriverDashboard />;
  return <LoginPage />;
}
