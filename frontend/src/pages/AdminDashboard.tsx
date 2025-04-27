// Filepath: c:\Users\Ati\source\repos\RendszerFej\frontend\src\pages\AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Table, Button, Title, Paper, Alert, Loader, Group, Modal, TextInput, PasswordInput, Textarea, NumberInput, Tabs, Select } from '@mantine/core'; // Select hozzáadva
import { DateTimePicker } from '@mantine/dates'; // DateTimePicker importálása
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconTrash, IconLock, IconUserPlus, IconPencil, IconMovie, IconUsers, IconBuildingSkyscraper, IconCalendarEvent, IconCheck } from '@tabler/icons-react'; // IconCheck hozzáadva
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications'; // notifications importálása
import '@mantine/dates/styles.css'; // Dátumválasztó stílusok

// --- User Management Interfaces ---
interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string;
    bannedTill?: string | null;
}
interface NewCashierForm {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
}
// --- End User Management Interfaces ---

// --- Movie Management Interfaces ---
interface MovieData {
    id: number;
    title: string;
    description: string;
    duration: number;
}
interface MovieFormValues {
    title: string;
    description: string;
    duration: number | '';
}
// --- End Movie Management Interfaces ---

// --- Room Management Interfaces ---
interface RoomData {
    id: number;
    roomName: string; // Backend: Room
    seats: number;
}
interface RoomFormValues {
    roomName: string;
    seats: number | '';
}
// --- End Room Management Interfaces ---

// --- Screening Management Interfaces ---
// Backend ScreeningResponse alapján
interface ScreeningData {
    id: number;
    screeningDate: string; // ISO string
    price: number;
    movieTitle: string;
    roomName: string;
    movieId: number; // Hozzáadva a könnyebb kezeléshez
    roomId: number;  // Hozzáadva a könnyebb kezeléshez
}
// Backend ScreeningRequest alapján (frontend űrlaphoz igazítva)
interface ScreeningFormValues {
    movieId: string | null; // Select komponens string ID-t ad vissza
    roomId: string | null;  // Select komponens string ID-t ad vissza
    screeningDate: Date | null;
    price: number | '';
}
// --- End Screening Management Interfaces ---


function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('users');

    // --- User Management State ---
    const [users, setUsers] = useState<UserData[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [userActionError, setUserActionError] = useState<string | null>(null);
    const [cashierModalOpened, { open: openCashierModal, close: closeCashierModal }] = useDisclosure(false);
    // --- End User Management State ---

    // --- Movie Management State ---
    const [movies, setMovies] = useState<MovieData[]>([]); // Ezt használjuk a vetítés űrlaphoz is
    const [moviesLoading, setMoviesLoading] = useState(false);
    const [moviesError, setMoviesError] = useState<string | null>(null);
    const [movieActionError, setMovieActionError] = useState<string | null>(null);
    const [movieModalOpened, { open: openMovieModal, close: closeMovieModal }] = useDisclosure(false);
    const [editingMovie, setEditingMovie] = useState<MovieData | null>(null);
    // --- End Movie Management State ---

    // --- Room Management State ---
    const [rooms, setRooms] = useState<RoomData[]>([]); // Ezt használjuk a vetítés űrlaphoz is
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [roomActionError, setRoomActionError] = useState<string | null>(null);
    const [roomModalOpened, { open: openRoomModal, close: closeRoomModal }] = useDisclosure(false);
    const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
    // --- End Room Management State ---

    // --- Screening Management State ---
    const [screenings, setScreenings] = useState<ScreeningData[]>([]);
    const [screeningsLoading, setScreeningsLoading] = useState(false);
    const [screeningsError, setScreeningsError] = useState<string | null>(null);
    const [screeningActionError, setScreeningActionError] = useState<string | null>(null);
    const [screeningModalOpened, { open: openScreeningModal, close: closeScreeningModal }] = useDisclosure(false);
    const [editingScreening, setEditingScreening] = useState<ScreeningData | null>(null); // Szerkesztett vetítés state
    // --- End Screening Management State ---


    // --- Data Fetching ---
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        setUsersError(null);
        setUserActionError(null);
        try {
            const data = await apiCall<UserData[]>('/api/user/users');
            setUsers(data);
        } catch (err) {
            setUsersError(err instanceof Error ? err.message : "Failed to fetch users.");
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchMovies = useCallback(async () => {
        setMoviesLoading(true); // Akkor is loading, ha csak a dropdownhoz kell
        setMoviesError(null);
        setMovieActionError(null);
        try {
            const data = await apiCall<MovieData[]>('/movies');
            setMovies(data);
        } catch (err) {
            setMoviesError(err instanceof Error ? err.message : "Failed to fetch movies.");
        } finally {
            setMoviesLoading(false);
        }
    }, []);

    const fetchRooms = useCallback(async () => {
        setRoomsLoading(true); // Akkor is loading, ha csak a dropdownhoz kell
        setRoomsError(null);
        setRoomActionError(null);
        try {
            const data = await apiCall<RoomData[]>('/room');
            setRooms(data);
        } catch (err) {
            setRoomsError(err instanceof Error ? err.message : "Failed to fetch rooms.");
        } finally {
            setRoomsLoading(false);
        }
    }, []);

    const fetchScreenings = useCallback(async () => {
        setScreeningsLoading(true);
        setScreeningsError(null);
        setScreeningActionError(null);
        try {
            // A /screenings végpont ScreeningResponse[]-t ad vissza
            const data = await apiCall<ScreeningData[]>('/screenings');
            setScreenings(data);
        } catch (err) {
            setScreeningsError(err instanceof Error ? err.message : "Failed to fetch screenings.");
        } finally {
            setScreeningsLoading(false);
        }
    }, []);

    // Fetch movies and rooms once when the component mounts for the dropdowns
    useEffect(() => {
        fetchMovies();
        fetchRooms();
    }, [fetchMovies, fetchRooms]);


    useEffect(() => {
        // Fetch data based on the active tab
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'movies') {
            // Movies might be already fetched, but fetch again if needed or rely on initial fetch
            if (movies.length === 0) fetchMovies();
        } else if (activeTab === 'rooms') {
            // Rooms might be already fetched, but fetch again if needed or rely on initial fetch
            if (rooms.length === 0) fetchRooms();
        } else if (activeTab === 'screenings') {
            fetchScreenings();
            // Ensure movies and rooms are available for the form
            if (movies.length === 0) fetchMovies();
            if (rooms.length === 0) fetchRooms();
        }
    }, [activeTab, fetchUsers, fetchMovies, fetchRooms, fetchScreenings, movies.length, rooms.length]);

    // --- User Management Handlers ---
    const cashierForm = useForm<NewCashierForm>({
        initialValues: { name: '', email: '', phoneNumber: '', password: '' },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
            name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
            phoneNumber: (value) => (value.trim().length >= 6 ? null : 'Phone number seems too short'),
        },
     });
    const handleAddCashier = async (values: NewCashierForm) => {
        setUserActionError(null);
        try {
            await apiCall<void>('/admin/admin/cashier', {
                method: 'POST', // Corrected from 'Post'
                data: values,
            });
            // setUserActionSuccess(`Cashier ${values.name} added successfully.`); // Replaced
            notifications.show({
                title: 'Cashier Added',
                message: `Cashier ${values.name} added successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            closeCashierModal();
            cashierForm.reset();
            if (activeTab === 'users') await fetchUsers(); // Fetch only if tab is active
        } catch (err) {
            setUserActionError(err instanceof Error ? err.message : "Failed to add cashier.");
        }
     };
    const handleDeleteUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete user ${userName} (ID: ${userId})? This cannot be undone.`)) return;
        setUserActionError(null);
        try {
            await apiCall<void>(`/admin/admin/user/${userId}`, { method: 'DELETE' });
            // setUserActionSuccess(`User ${userName} (ID: ${userId}) deleted successfully.`); // Replaced
            notifications.show({
                title: 'User Deleted',
                message: `User ${userName} (ID: ${userId}) deleted successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            if (activeTab === 'users') await fetchUsers();
        } catch (err) {
            setUserActionError(err instanceof Error ? err.message : `Failed to delete user ${userId}.`);
        }
     };
    const handleBanUser = async (userId: number, userName: string) => {
         if (!window.confirm(`Are you sure you want to ban user ${userName} (ID: ${userId}) for 30 days?`)) return;
        setUserActionError(null);
        try {
            const response = await apiCall<{ message: string }>(`/admin/ban/${userId}`, { method: 'POST' }); // Corrected from 'Post'
            // setUserActionSuccess(response.message || `User ${userName} (ID: ${userId}) banned successfully.`); // Replaced
            notifications.show({
                title: 'User Banned',
                message: response.message || `User ${userName} (ID: ${userId}) banned successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            if (activeTab === 'users') await fetchUsers();
        } catch (err) {
             setUserActionError(err instanceof Error ? err.message : `Failed to ban user ${userId}.`);
        }
     };
    const formatBanDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Not banned';
        try {
            const date = new Date(dateString);
            return date > new Date() ? date.toLocaleString('hu-HU') : 'Not banned (Expired)';
        } catch (e) { return 'Invalid date'; }
    };
    // --- End User Management Handlers ---

    // --- Movie Management Handlers ---
    const movieForm = useForm<MovieFormValues>({
        initialValues: { title: '', description: '', duration: '' },
        validate: {
            title: (value) => (value.trim().length > 0 ? null : 'Title is required'),
            description: (value) => (value.trim().length > 0 ? null : 'Description is required'),
            duration: (value) => (value !== '' && value > 0 ? null : 'Duration must be a positive number'),
        },
    });
    const handleOpenAddMovieModal = () => {
        setEditingMovie(null);
        movieForm.reset();
        setMovieActionError(null);
        openMovieModal();
    };
    const handleEditMovieClick = (movie: MovieData) => {
        setEditingMovie(movie);
        movieForm.setValues({
            title: movie.title,
            description: movie.description,
            duration: movie.duration,
        });
        setMovieActionError(null);
        openMovieModal();
    };
    const handleMovieSubmit = async (values: MovieFormValues) => {
        setMovieActionError(null);
        const movieData = {
            title: values.title,
            description: values.description,
            duration: Number(values.duration)
        };
        try {
            const action = editingMovie ? 'updated' : 'added';
            if (editingMovie) {
                await apiCall<MovieData>(`/movies/${editingMovie.id}`, { method: 'PUT', data: movieData });
            } else {
                await apiCall<MovieData>('/movies', { method: 'POST', data: movieData });
            }
            // setMovieActionSuccess(`Movie "${values.title}" ${action} successfully.`); // Replaced
            notifications.show({
                title: `Movie ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                message: `Movie "${values.title}" ${action} successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            closeMovieModal();
            movieForm.reset();
            await fetchMovies(); // Fetch movies again for dropdowns and list
        } catch (err) {
            setMovieActionError(err instanceof Error ? err.message : `Failed to ${editingMovie ? 'update' : 'add'} movie.`);
        }
    };
    const handleDeleteMovie = async (movieId: number, movieTitle: string) => {
        if (!window.confirm(`Are you sure you want to delete the movie "${movieTitle}" (ID: ${movieId})? This cannot be undone.`)) return;
        setMovieActionError(null);
        try {
            await apiCall<void>(`/movies/${movieId}`, { method: 'DELETE' });
            // setMovieActionSuccess(`Movie "${movieTitle}" (ID: ${movieId}) deleted successfully.`); // Replaced
            notifications.show({
                title: 'Movie Deleted',
                message: `Movie "${movieTitle}" (ID: ${movieId}) deleted successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            await fetchMovies(); // Fetch movies again
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `Failed to delete movie ${movieId}.`;
            if (errorMsg.includes("Cannot delete a movie with active screenings")) {
                 setMovieActionError("Cannot delete this movie because it has active screenings associated with it.");
            } else {
                 setMovieActionError(errorMsg);
            }
        }
    };
    // --- End Movie Management Handlers ---

    // --- Room Management Handlers ---
    const roomForm = useForm<RoomFormValues>({
        initialValues: { roomName: '', seats: '' },
        validate: {
            roomName: (value) => (value.trim().length === 1 ? null : 'Room name must be a single character'),
            seats: (value) => (value !== '' && value > 0 ? null : 'Seats must be a positive number'),
        },
    });
    const handleOpenAddRoomModal = () => {
        setEditingRoom(null);
        roomForm.reset();
        setRoomActionError(null);
        openRoomModal();
    };
    const handleEditRoomClick = (room: RoomData) => {
        setEditingRoom(room);
        roomForm.setValues({ roomName: room.roomName, seats: room.seats });
        setRoomActionError(null);
        openRoomModal();
    };
    const handleRoomSubmit = async (values: RoomFormValues) => {
        setRoomActionError(null);
        const roomData = { roomName: values.roomName, seats: Number(values.seats) };
        try {
            const action = editingRoom ? 'updated' : 'added';
            if (editingRoom) {
                await apiCall<RoomData>(`/room/${editingRoom.id}`, { method: 'PUT', data: roomData });
            } else {
                await apiCall<void>('/room', { method: 'POST', data: roomData });
            }
            // setRoomActionSuccess(`Room "${values.roomName}" ${action} successfully.`); // Replaced
            notifications.show({
                title: `Room ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                message: `Room "${values.roomName}" ${action} successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            closeRoomModal();
            roomForm.reset();
            await fetchRooms(); // Fetch rooms again
        } catch (err) {
            setRoomActionError(err instanceof Error ? err.message : `Failed to ${editingRoom ? 'update' : 'add'} room.`);
        }
    };
    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        // TODO: Check for screenings using this room before deleting? Backend might handle this.
        if (!window.confirm(`Are you sure you want to delete room "${roomName}" (ID: ${roomId})? This cannot be undone.`)) return;
        setRoomActionError(null);
        try {
            await apiCall<void>(`/room/${roomId}`, { method: 'DELETE' });
            // setRoomActionSuccess(`Room "${roomName}" (ID: ${roomId}) deleted successfully.`); // Replaced
            notifications.show({
                title: 'Room Deleted',
                message: `Room "${roomName}" (ID: ${roomId}) deleted successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            await fetchRooms(); // Fetch rooms again
        } catch (err) {
             // Handle specific error if backend prevents deletion due to screenings
             const errorMsg = err instanceof Error ? err.message : `Failed to delete room ${roomId}.`;
             // Example: Adjust based on actual backend error message
             if (errorMsg.includes("Cannot delete room with active screenings")) {
                 setRoomActionError("Cannot delete this room because it has active screenings associated with it.");
             } else {
                 setRoomActionError(errorMsg);
             }
        }
    };
    // --- End Room Management Handlers ---

    // --- Screening Management Handlers ---
    const screeningForm = useForm<ScreeningFormValues>({
        initialValues: {
            movieId: null,
            roomId: null,
            screeningDate: null,
            price: '',
        },
        validate: {
            movieId: (value) => (value ? null : 'Movie is required'),
            roomId: (value) => (value ? null : 'Room is required'),
            screeningDate: (value) => (value ? null : 'Screening date and time are required'),
            price: (value) => (value !== '' && value >= 0 ? null : 'Price must be a non-negative number'), // Price can be 0
        },
    });

    // Modális ablak megnyitása (új vetítéshez)
    const handleOpenAddScreeningModal = () => {
        setEditingScreening(null);
        screeningForm.reset();
        setScreeningActionError(null);
        openScreeningModal();
    };

    // Modális ablak megnyitása (szerkesztéshez)
    const handleEditScreeningClick = (screening: ScreeningData) => {
        setEditingScreening(screening);
        screeningForm.setValues({
            movieId: screening.movieId.toString(), // Select expects string value
            roomId: screening.roomId.toString(),   // Select expects string value
            screeningDate: new Date(screening.screeningDate), // Convert ISO string to Date object
            price: screening.price,
        });
        setScreeningActionError(null);
        openScreeningModal();
    };

    // Vetítés hozzáadása vagy szerkesztése
    const handleScreeningSubmit = async (values: ScreeningFormValues) => {
        setScreeningActionError(null);

        // Find movie title and room name based on selected IDs
        const selectedMovie = movies.find(m => m.id === Number(values.movieId));
        const selectedRoom = rooms.find(r => r.id === Number(values.roomId));

        if (!selectedMovie || !selectedRoom || !values.screeningDate) {
            setScreeningActionError("Invalid movie, room, or date selected.");
            return;
        }

        // Backend expects MovieTitle and TeremName
        const screeningRequestData = {
            movieTitle: selectedMovie.title,
            teremName: selectedRoom.roomName,
            screeningDate: values.screeningDate.toISOString(), // Send as ISO string
            price: Number(values.price)
        };

        try {
            const action = editingScreening ? 'updated' : 'added';
            if (editingScreening) {
                // Szerkesztés (PUT /screenings/{id})
                await apiCall<ScreeningData>(`/screenings/${editingScreening.id}`, {
                    method: 'PUT',
                    data: screeningRequestData,
                });
            } else {
                // Hozzáadás (POST /screenings)
                await apiCall<ScreeningData>('/screenings', {
                    method: 'POST',
                    data: screeningRequestData,
                });
            }
            // setScreeningActionSuccess(`Screening ${action} successfully.`); // Replaced
            notifications.show({
                title: `Screening ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                message: `Screening for ${selectedMovie.title} ${action} successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            closeScreeningModal();
            screeningForm.reset();
            if (activeTab === 'screenings') await fetchScreenings(); // Lista frissítése
        } catch (err) {
            setScreeningActionError(err instanceof Error ? err.message : `Failed to ${editingScreening ? 'update' : 'add'} screening.`);
        }
    };

    // Vetítés törlése
    const handleDeleteScreening = async (screeningId: number) => {
        if (!window.confirm(`Are you sure you want to delete screening ID: ${screeningId}? This cannot be undone.`)) {
            return;
        }
        setScreeningActionError(null);
        try {
            await apiCall<void>(`/screenings/${screeningId}`, { method: 'DELETE' });
            // setScreeningActionSuccess(`Screening (ID: ${screeningId}) deleted successfully.`); // Replaced
            notifications.show({
                title: 'Screening Deleted',
                message: `Screening (ID: ${screeningId}) deleted successfully.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            if (activeTab === 'screenings') await fetchScreenings(); // Lista frissítése
        } catch (err) {
            // Handle specific error if backend prevents deletion (e.g., tickets sold)
            const errorMsg = err instanceof Error ? err.message : `Failed to delete screening ${screeningId}.`;
            // Example: Adjust based on actual backend error message
             if (errorMsg.includes("Cannot delete screening with purchased tickets")) {
                 setScreeningActionError("Cannot delete this screening because tickets have been purchased for it.");
             } else {
                 setScreeningActionError(errorMsg);
             }
        }
    };

    // Helper to format date string
    const formatScreeningDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('hu-HU', {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };
    // --- End Screening Management Handlers ---


    // Check if the logged-in user is actually an Admin
    if (user?.role !== 'Admin') {
         return <Alert icon={<IconAlertCircle size="1rem" />} title="Access Denied" color="orange">You do not have permission to view this page.</Alert>;
    }

    // --- Table Rows ---
    const userRows = users.map((u) => (
        <Table.Tr key={u.id}>
            <Table.Td>{u.id}</Table.Td>
            <Table.Td>{u.name}</Table.Td>
            <Table.Td>{u.email}</Table.Td>
            <Table.Td>{u.phone}</Table.Td>
            <Table.Td>{u.role}</Table.Td>
            <Table.Td>{formatBanDate(u.bannedTill)}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                     <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteUser(u.id, u.name)} disabled={u.id === user?.id} title={u.id === user?.id ? "Cannot delete yourself" : "Delete User"}><IconTrash size={14} /></Button>
                     <Button size="xs" variant="outline" color="orange" onClick={() => handleBanUser(u.id, u.name)} disabled={u.id === user?.id || (u.bannedTill && new Date(u.bannedTill) > new Date())} title={u.id === user?.id ? "Cannot ban yourself" : (u.bannedTill && new Date(u.bannedTill) > new Date() ? "User already banned" : "Ban User")}><IconLock size={14} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const movieRows = movies.map((m) => (
        <Table.Tr key={m.id}>
            <Table.Td>{m.id}</Table.Td>
            <Table.Td>{m.title}</Table.Td>
            <Table.Td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</Table.Td>
            <Table.Td>{m.duration} min</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button size="xs" variant="outline" color="blue" onClick={() => handleEditMovieClick(m)} title="Edit Movie"><IconPencil size={14} /></Button>
                    <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteMovie(m.id, m.title)} title="Delete Movie"><IconTrash size={14} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const roomRows = rooms.map((r) => (
        <Table.Tr key={r.id}>
            <Table.Td>{r.id}</Table.Td>
            <Table.Td>{r.roomName}</Table.Td>
            <Table.Td>{r.seats}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button size="xs" variant="outline" color="blue" onClick={() => handleEditRoomClick(r)} title="Edit Room"><IconPencil size={14} /></Button>
                    <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteRoom(r.id, r.roomName)} title="Delete Room"><IconTrash size={14} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const screeningRows = screenings.map((s) => (
        <Table.Tr key={s.id}>
            <Table.Td>{s.id}</Table.Td>
            <Table.Td>{s.movieTitle}</Table.Td>
            <Table.Td>{s.roomName}</Table.Td>
            <Table.Td>{formatScreeningDate(s.screeningDate)}</Table.Td>
            <Table.Td>{s.price} Ft</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button size="xs" variant="outline" color="blue" onClick={() => handleEditScreeningClick(s)} title="Edit Screening"><IconPencil size={14} /></Button>
                    <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteScreening(s.id)} title="Delete Screening"><IconTrash size={14} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));
    // --- End Table Rows ---

    // --- Dropdown Data ---
    const movieOptions = movies.map(movie => ({ value: movie.id.toString(), label: movie.title }));
    const roomOptions = rooms.map(room => ({ value: room.id.toString(), label: `Room ${room.roomName} (${room.seats} seats)` }));
    // --- End Dropdown Data ---


    return (
        <Paper shadow="xs" p="md" style={{ minWidth: '80vw' }}> {/* Szélesebb Paper */}
            <Title order={2} mb="lg">Admin Dashboard</Title>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow> {/* Grow a fülekhez */}
                    <Tabs.Tab value="users" leftSection={<IconUsers size={14} />}>User Management</Tabs.Tab>
                    <Tabs.Tab value="movies" leftSection={<IconMovie size={14} />}>Movie Management</Tabs.Tab>
                    <Tabs.Tab value="rooms" leftSection={<IconBuildingSkyscraper size={14} />}>Room Management</Tabs.Tab>
                    <Tabs.Tab value="screenings" leftSection={<IconCalendarEvent size={14} />}>Screening Management</Tabs.Tab> {/* Új fül */}
                </Tabs.List>

                {/* User Management Panel */}
                <Tabs.Panel value="users" pt="lg">
                    {userActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="User Action Error" color="red" mb="md" withCloseButton onClose={() => setUserActionError(null)}>{userActionError}</Alert>}
                    <Button leftSection={<IconUserPlus size={14} />} onClick={openCashierModal} mb="md">Add New Cashier</Button>
                    {usersLoading && <Loader my="lg" />}
                    {usersError && !usersLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Users" color="red">{usersError}</Alert>}
                    {!usersLoading && !usersError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Phone</Table.Th>
                                    <Table.Th>Role</Table.Th>
                                    <Table.Th>Banned Until</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{userRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Movie Management Panel */}
                <Tabs.Panel value="movies" pt="lg">
                     {movieActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Movie Action Error" color="red" mb="md" withCloseButton onClose={() => setMovieActionError(null)}>{movieActionError}</Alert>}
                    <Button leftSection={<IconMovie size={14} />} onClick={handleOpenAddMovieModal} mb="md">Add New Movie</Button>
                    {moviesLoading && <Loader my="lg" />}
                    {moviesError && !moviesLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Movies" color="red">{moviesError}</Alert>}
                    {!moviesLoading && !moviesError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Title</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th>Duration</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{movieRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Room Management Panel */}
                <Tabs.Panel value="rooms" pt="lg">
                     {roomActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Room Action Error" color="red" mb="md" withCloseButton onClose={() => setRoomActionError(null)}>{roomActionError}</Alert>}
                    <Button leftSection={<IconBuildingSkyscraper size={14} />} onClick={handleOpenAddRoomModal} mb="md">Add New Room</Button>
                    {roomsLoading && <Loader my="lg" />}
                    {roomsError && !roomsLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Rooms" color="red">{roomsError}</Alert>}
                    {!roomsLoading && !roomsError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Room Name</Table.Th>
                                    <Table.Th>Seats</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{roomRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Screening Management Panel */}
                <Tabs.Panel value="screenings" pt="lg">
                     {screeningActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Screening Action Error" color="red" mb="md" withCloseButton onClose={() => setScreeningActionError(null)}>{screeningActionError}</Alert>}
                    <Button leftSection={<IconCalendarEvent size={14} />} onClick={handleOpenAddScreeningModal} mb="md">Add New Screening</Button>
                    {screeningsLoading && <Loader my="lg" />}
                    {screeningsError && !screeningsLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Screenings" color="red">{screeningsError}</Alert>}
                    {!screeningsLoading && !screeningsError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Movie</Table.Th>
                                    <Table.Th>Room</Table.Th>
                                    <Table.Th>Date & Time</Table.Th>
                                    <Table.Th>Price</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{screeningRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

            </Tabs>

            {/* --- Modals --- */}
            {/* Add/Edit Cashier Modal */}
            <Modal opened={cashierModalOpened} onClose={closeCashierModal} title="Add New Cashier" centered>
                 <form onSubmit={cashierForm.onSubmit(handleAddCashier)}>
                    <TextInput label="Name" placeholder="Cashier's name" required {...cashierForm.getInputProps('name')} mb="sm" />
                    <TextInput label="Email" placeholder="cashier@example.com" required {...cashierForm.getInputProps('email')} mb="sm" />
                    <TextInput label="Phone Number" placeholder="+36..." required {...cashierForm.getInputProps('phoneNumber')} mb="sm" />
                    <PasswordInput label="Password" placeholder="Password" required {...cashierForm.getInputProps('password')} mb="lg" />
                    {userActionError && <Alert color="red" mb="md">{userActionError}</Alert>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeCashierModal}>Cancel</Button>
                        <Button type="submit">Add Cashier</Button>
                    </Group>
                 </form>
            </Modal>

            {/* Add/Edit Movie Modal */}
            <Modal opened={movieModalOpened} onClose={closeMovieModal} title={editingMovie ? "Edit Movie" : "Add New Movie"} centered>
                 <form onSubmit={movieForm.onSubmit(handleMovieSubmit)}>
                    <TextInput label="Title" placeholder="Movie Title" required {...movieForm.getInputProps('title')} mb="sm" />
                    <Textarea label="Description" placeholder="Movie Description" required {...movieForm.getInputProps('description')} mb="sm" minRows={3} autosize/>
                    <NumberInput label="Duration (minutes)" placeholder="e.g., 120" required min={1} {...movieForm.getInputProps('duration')} mb="lg" />
                    {movieActionError && <Alert color="red" mb="md">{movieActionError}</Alert>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeMovieModal}>Cancel</Button>
                        <Button type="submit">{editingMovie ? "Update Movie" : "Add Movie"}</Button>
                    </Group>
                 </form>
            </Modal>

            {/* Add/Edit Room Modal */}
            <Modal opened={roomModalOpened} onClose={closeRoomModal} title={editingRoom ? "Edit Room" : "Add New Room"} centered>
                 <form onSubmit={roomForm.onSubmit(handleRoomSubmit)}>
                    <TextInput label="Room Name (single character)" placeholder="e.g., A" required maxLength={1} {...roomForm.getInputProps('roomName')} mb="sm" />
                    <NumberInput label="Number of Seats" placeholder="e.g., 50" required min={1} {...roomForm.getInputProps('seats')} mb="lg" />
                    {roomActionError && <Alert color="red" mb="md">{roomActionError}</Alert>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeRoomModal}>Cancel</Button>
                        <Button type="submit">{editingRoom ? "Update Room" : "Add Room"}</Button>
                    </Group>
                 </form>
            </Modal>

            {/* Add/Edit Screening Modal */}
            <Modal opened={screeningModalOpened} onClose={closeScreeningModal} title={editingScreening ? "Edit Screening" : "Add New Screening"} centered>
                 <form onSubmit={screeningForm.onSubmit(handleScreeningSubmit)}>
                    <Select
                        label="Movie"
                        placeholder="Select movie"
                        data={movieOptions}
                        searchable
                        required
                        {...screeningForm.getInputProps('movieId')}
                        mb="sm"
                        disabled={moviesLoading} // Disable if movies are loading
                    />
                     <Select
                        label="Room"
                        placeholder="Select room"
                        data={roomOptions}
                        searchable
                        required
                        {...screeningForm.getInputProps('roomId')}
                        mb="sm"
                        disabled={roomsLoading} // Disable if rooms are loading
                    />
                    <DateTimePicker
                        label="Screening Date and Time"
                        placeholder="Pick date and time"
                        required
                        valueFormat="YYYY.MM.DD HH:mm"
                        {...screeningForm.getInputProps('screeningDate')}
                        mb="sm"
                    />
                    <NumberInput
                        label="Price (Ft)"
                        placeholder="e.g., 2500"
                        required
                        min={0} // Price can be 0
                        step={100}
                        {...screeningForm.getInputProps('price')}
                        mb="lg"
                    />
                    {screeningActionError && <Alert color="red" mb="md">{screeningActionError}</Alert>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeScreeningModal}>Cancel</Button>
                        <Button type="submit">{editingScreening ? "Update Screening" : "Add Screening"}</Button>
                    </Group>
                 </form>
            </Modal>

        </Paper>
    );
}

export default AdminDashboard;
