import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'; // Navigate hozzáadva
import { AppShell, Burger, Group, Button, Text, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from './contexts/AuthContext';
import { Notifications } from '@mantine/notifications'; // Import Notifications
// Oldalak importálása
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import ProfilePage from './pages/ProfilePage'; // Később
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard'; // ÚJ: Importálva


function App() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Placeholder komponensek eltávolítása vagy átnevezése, ha ütköznek
  // const HomePage = () => <div>Home Page</div>;
  // const MoviesPage = () => <div>Movies Page</div>;
  // const AdminDashboard = () => <div>Admin Dashboard</div>;
  // const ProfilePage = () => <div>Profile Page</div>; // Ezt majd lecseréljük
  // const CashierDashboard = () => <div>Cashier Dashboard</div>; // Eltávolítva, mert importáljuk
  const NotFoundPage = () => <div>404 Not Found</div>;

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Visszairányítás a főoldalra kijelentkezés után
  };

  if (isLoading) {
      return <div>Loading...</div>; // Vagy egy szebb Mantine loader
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <Notifications /> {/* Add Notifications provider */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between"> {/* justify="space-between" hozzáadva */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>Jegymester</Link>
          </Group>
          <Group>
            {user ? (
              <>
                <Text size="sm">Welcome, {user.name} ({user.role})</Text>
                <Button variant="outline" size="xs" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" variant="default" size="xs">Login</Button>
                <Button component={Link} to="/register" size="xs">Register</Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
         <NavLink component={Link} to="/" label="Home" onClick={toggle}/>
         <NavLink component={Link} to="/movies" label="Movies" onClick={toggle}/>
         {user && <NavLink component={Link} to="/profile" label="My Profile" onClick={toggle}/>}

         {/* Szerepkör-specifikus linkek */}
         {user?.role === 'Admin' && <NavLink component={Link} to="/admin" label="Admin Dashboard" onClick={toggle}/>}
         {/* Cashier link (Admin is láthatja) */}
         {(user?.role === 'Cashier' || user?.role === 'Admin') && <NavLink component={Link} to="/cashier" label="Cashier Dashboard" onClick={toggle}/>}

      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          {/* Használjuk az importált HomePage komponenst */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} /> {/* ÚJ: Film részletek útvonal */}
          {/* Védett útvonalak */}
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} /> {/* Védett útvonal */}
          {/* Admin útvonal védelemmel */}
         <Route
            path="/admin"
            element={
              user?.role === 'Admin'
                ? <AdminDashboard />
                : <Navigate to={user ? "/" : "/login"} replace />
            }
          />
          {/* Cashier útvonal védelemmel (Admin is elérheti) */}
           <Route
            path="/cashier"
            element={
              user?.role === 'Cashier' || user?.role === 'Admin'
                ? <CashierDashboard /> // Itt használjuk az importált komponenst
                : <Navigate to={user ? "/" : "/login"} replace />
            }
          />

          <Route path="*" element={<NotFoundPage />} /> {/* Minden másra 404 */}
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;