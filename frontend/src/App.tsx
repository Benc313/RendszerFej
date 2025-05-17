import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AppShell, Burger, Group, Button, Text, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const NotFoundPage = () => <div>404 – Az oldal nem található</div>;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <div>Betöltés...</div>;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>Jegymester</Link>
          </Group>
          <Group>
            {user ? (
              <>
                <Text size="sm">Üdv, {user.name} ({user.role})</Text>
                <Button variant="outline" size="xs" onClick={handleLogout}>Kijelentkezés</Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" variant="default" size="xs">Bejelentkezés</Button>
                <Button component={Link} to="/register" size="xs">Regisztráció</Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink component={Link} to="/" label="Főoldal" onClick={toggle} />
        <NavLink component={Link} to="/movies" label="Filmek" onClick={toggle} />
        {user && <NavLink component={Link} to="/profile" label="Profilom" onClick={toggle} />}
        {user?.role === 'Admin' && <NavLink component={Link} to="/admin" label="Admin felület" onClick={toggle} />}
        {(user?.role === 'Cashier' || user?.role === 'Admin') && <NavLink component={Link} to="/cashier" label="Pénztáros felület" onClick={toggle} />}
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={user?.role === 'Admin' ? <AdminDashboard /> : <Navigate to={user ? "/" : "/login"} replace />} />
          <Route path="/cashier" element={user?.role === 'Cashier' || user?.role === 'Admin' ? <CashierDashboard /> : <Navigate to={user ? "/" : "/login"} replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;