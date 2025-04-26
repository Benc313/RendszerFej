import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AppShell, Burger, Group, Button, Text, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from './contexts/AuthContext';
// Oldalak importálása
import LoginPage from './pages/LoginPage'; // Importálva
import RegisterPage from './pages/RegisterPage'; // Importálva
// import HomePage from './pages/HomePage'; // Később
// import MoviesPage from './pages/MoviesPage'; // Később
// import ProfilePage from './pages/ProfilePage'; // Később
// import AdminDashboard from './pages/AdminDashboard'; // Később
// import CashierDashboard from './pages/CashierDashboard'; // Később


function App() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Placeholder komponensek a még hiányzó oldalakhoz
  const HomePage = () => <div>Home Page</div>;
  const MoviesPage = () => <div>Movies Page</div>;
  const ProfilePage = () => <div>Profile Page</div>;
  const AdminDashboard = () => <div>Admin Dashboard</div>;
  const CashierDashboard = () => <div>Cashier Dashboard</div>;
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
         {user?.role === 'Cashier' && <NavLink component={Link} to="/cashier" label="Cashier Dashboard" onClick={toggle}/>}

         {/* Ide jöhetnek a szerepkör-specifikus menüpontok */}
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Használjuk az új komponenseket */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          {/* Védett útvonalak (példa) */}
          {/* <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} /> */}
          <Route path="/profile" element={<ProfilePage />} /> {/* Egyszerűsített, védelem nélkül egyelőre */}
          {/* Szerepkör alapú útvonalak (példa) */}
          {/* <Route path="/admin" element={user?.role === 'Admin' ? <AdminDashboard /> : <Navigate to="/" />} /> */}
          {/* <Route path="/cashier" element={user?.role === 'Cashier' ? <CashierDashboard /> : <Navigate to="/" />} /> */}
           <Route path="/admin" element={<AdminDashboard />} /> {/* Egyszerűsített */}
           <Route path="/cashier" element={<CashierDashboard />} /> {/* Egyszerűsített */}

          <Route path="*" element={<NotFoundPage />} /> {/* Minden másra 404 */}
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
