import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Table, Button, Title, Paper, Alert, Loader, Group, Modal, TextInput, PasswordInput, Textarea, NumberInput, Tabs, Select } from '@mantine/core'; 
import { DateTimePicker } from '@mantine/dates'; 
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconTrash, IconLock, IconUserPlus, IconPencil, IconMovie, IconUsers, IconBuildingSkyscraper, IconCalendarEvent, IconCheck, IconLockOpen } from '@tabler/icons-react'; 
import { notifications } from '@mantine/notifications'; 
import '@mantine/dates/styles.css'; 

// --- Felhasználókezelési Interfészek ---
interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string;
    bannedTill?: string | null; 
}
interface NewCashierForm { // Új pénztáros űrlap adatai
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
}

// --- Filmkezelési Interfészek ---
interface MovieData { // Film adatai
    id: number;
    title: string;
    description: string;
    duration: number;
}
interface MovieFormValues { // Film űrlap értékei
    title: string;
    description: string;
    duration: number | ''; 
}

// --- Teremkezelési Interfészek ---
interface RoomData { // Terem adatai
    id: number;
    roomName: string; 
    seats: number;    
}
interface RoomFormValues { // Terem űrlap értékei
    roomName: string;
    seats: number | ''; 
}


// --- Vetítéskezelési Interfészek ---
interface BackendScreeningResponse {
    id: number;
    screeningDate: string; 
    price: number;
    movieName: string; 
    roomName: string;  
    movieId: number;   
    roomId: number;    
}

// Frontend állapot interfész
interface ScreeningData {
    id: number;
    screeningDate: string; // ISO string
    price: number;
    movieTitle: string; // Megjelenítéshez
    roomName: string;   // Megjelenítéshez
    movieId: number;    // Űrlap kitöltéshez/szerkesztéshez
    roomId: number;     // Űrlap kitöltéshez/szerkesztéshez
}

// Backend ScreeningRequest interfész
interface ScreeningFormValues {
    movieId: string | null; // Select komponens string ID-t ad vissza
    roomId: string | null;  // Select komponens string ID-t ad vissza
    screeningDate: Date | null; // Dátum objektum az űrlapon
    price: number | ''; // Lehet üres string a NumberInput miatt
}



function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<string | null>('users'); // Aktív fül állapota
    const { user } = useAuth(); // Bejelentkezett felhasználó adatai

    // --- Állapotok és Hook-ok ---
    // --- Felhasználókezelési Állapotok ---
    const [users, setUsers] = useState<UserData[]>([]); // Felhasználók listája
    const [usersLoading, setUsersLoading] = useState(false); // Felhasználók betöltése folyamatban
    const [usersError, setUsersError] = useState<string | null>(null); // Hiba a felhasználók betöltésekor
    const [userActionError, setUserActionError] = useState<string | null>(null); // Hiba felhasználói művelet közben (pl. hozzáadás, törlés)
    const [isCashierModalOpen, setIsCashierModalOpen] = useState(false); // Pénztáros hozzáadása modális ablak állapota
    // --- Felhasználókezelési Állapotok Vége ---

    // --- Filmkezelési Állapotok ---
    const [movies, setMovies] = useState<MovieData[]>([]); // Filmek listája (vetítés űrlaphoz is)
    const [moviesLoading, setMoviesLoading] = useState(false); // Filmek betöltése folyamatban
    const [moviesError, setMoviesError] = useState<string | null>(null); // Hiba a filmek betöltésekor
    const [movieActionError, setMovieActionError] = useState<string | null>(null); // Hiba film művelet közben
    const [isMovieModalOpen, setIsMovieModalOpen] = useState(false); // Film hozzáadása/szerkesztése modális ablak állapota
    const [editingMovie, setEditingMovie] = useState<MovieData | null>(null); // Szerkesztett film adatai (vagy null, ha újat adunk hozzá)
    // --- Filmkezelési Állapotok Vége ---

    // --- Teremkezelési Állapotok ---
    const [rooms, setRooms] = useState<RoomData[]>([]); // Termek listája (vetítés űrlaphoz is)
    const [roomsLoading, setRoomsLoading] = useState(false); // Termek betöltése folyamatban
    const [roomsError, setRoomsError] = useState<string | null>(null); // Hiba a termek betöltésekor
    const [roomActionError, setRoomActionError] = useState<string | null>(null); // Hiba terem művelet közben
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false); // Terem hozzáadása/szerkesztése modális ablak állapota
    const [editingRoom, setEditingRoom] = useState<RoomData | null>(null); // Szerkesztett terem adatai
    // --- Teremkezelési Állapotok Vége ---

    // --- Vetítéskezelési Állapotok ---
    const [screenings, setScreenings] = useState<ScreeningData[]>([]); // Vetítések listája (frontend formátum)
    const [screeningsLoading, setScreeningsLoading] = useState(false); // Vetítések betöltése folyamatban
    const [screeningsError, setScreeningsError] = useState<string | null>(null); // Hiba a vetítések betöltésekor
    const [screeningActionError, setScreeningActionError] = useState<string | null>(null); // Hiba vetítés művelet közben
    const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false); // Vetítés hozzáadása/szerkesztése modális ablak állapota
    const [editingScreening, setEditingScreening] = useState<ScreeningData | null>(null); // Szerkesztett vetítés adatai
    // --- Vetítéskezelési Állapotok Vége ---


    // --- Űrlapok Kezelése (useForm Hook) ---
    // Pénztáros hozzáadása űrlap
    const cashierForm = useForm<NewCashierForm>({
        initialValues: { name: '', email: '', phoneNumber: '', password: '' },
        validate: { // Validációs szabályok
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Érvénytelen email cím'),
            password: (value) => (value.length >= 6 ? null : 'A jelszónak legalább 6 karakter hosszúnak kell lennie'),
            name: (value) => (value.trim().length > 0 ? null : 'A név megadása kötelező'),
            phoneNumber: (value) => (value.trim().length >= 6 ? null : 'A telefonszám túl rövidnek tűnik'),
        },
     });
     // Film hozzáadása/szerkesztése űrlap
    const movieForm = useForm<MovieFormValues>({
        initialValues: { title: '', description: '', duration: '' },
        validate: {
            title: (value) => (value.trim().length > 0 ? null : 'A cím megadása kötelező'),
            description: (value) => (value.trim().length > 0 ? null : 'A leírás megadása kötelező'),
            duration: (value) => (value !== '' && value > 0 ? null : 'A játékidőnek pozitív számnak kell lennie'),
        },
    });
    // Terem hozzáadása/szerkesztése űrlap
    const roomForm = useForm<RoomFormValues>({
        initialValues: { roomName: '', seats: '' },
        validate: {
            roomName: (value) => (value.trim().length > 0 ? null : 'A terem nevének megadása kötelező'),
            seats: (value) => (value !== '' && value > 0 ? null : 'Az ülések számának pozitív számnak kell lennie'),
        },
    });
    // Vetítés hozzáadása/szerkesztése űrlap
    const screeningForm = useForm<ScreeningFormValues>({
        initialValues: { movieId: null, roomId: null, screeningDate: null, price: '' },
        validate: {
            movieId: (value) => (value ? null : 'A film kiválasztása kötelező'),
            roomId: (value) => (value ? null : 'A terem kiválasztása kötelező'),
            screeningDate: (value) => (value ? null : 'A vetítés időpontjának megadása kötelező'),
            price: (value) => (value !== '' && value >= 0 ? null : 'Az árnak nem negatív számnak kell lennie'),
        },
    });
    // -- Űrlapok Kezelése Vége ---

    // --- Adatlekérdezések ---
    // Felhasználók lekérdezése
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        setUsersError(null);
        setUserActionError(null); // Hiba törlése
        try {
            const data = await apiCall<UserData[]>('/api/user/users');
            setUsers(data);
        } catch (err) {
            setUsersError(err instanceof Error ? err.message : "Felhasználók lekérdezése sikertelen.");
        } finally {
            setUsersLoading(false);
        }
    }, []);

    // Filmek lekérdezése (lista és dropdownokhoz)
    const fetchMovies = useCallback(async () => {
        setMoviesLoading(true);
        setMoviesError(null);
        setMovieActionError(null);
        try {
            const data = await apiCall<MovieData[]>('/api/movie');
            setMovies(data);
        } catch (err) {
            setMoviesError(err instanceof Error ? err.message : "Filmek lekérdezése sikertelen.");
        } finally {
            setMoviesLoading(false);
        }
    }, []);

    // Termek lekérdezése (lista és dropdownokhoz)
    const fetchRooms = useCallback(async () => {
        setRoomsLoading(true);
        setRoomsError(null);
        setRoomActionError(null);
        try {
            const data = await apiCall<RoomData[]>('/api/room');
            setRooms(data);
        } catch (err) {
            setRoomsError(err instanceof Error ? err.message : "Termek lekérdezése sikertelen.");
        } finally {
            setRoomsLoading(false);
        }
    }, []);

    // Vetítések lekérdezése
    const fetchScreenings = useCallback(async () => {
        setScreeningsLoading(true);
        setScreeningsError(null);
        setScreeningActionError(null);
        try {
            // Backend válaszának lekérdezése
            const data = await apiCall<BackendScreeningResponse[]>('/api/screening');
            // Backend válasz átalakítása a frontend állapot (ScreeningData) struktúrájára
            const mappedData: ScreeningData[] = data.map(s => ({
                id: s.id,
                screeningDate: s.screeningDate,
                price: s.price,
                movieTitle: s.movieName,
                roomName: s.roomName,
                movieId: s.movieId,     
                roomId: s.roomId,       
            }));
            setScreenings(mappedData);
        } catch (err) {
            setScreeningsError(err instanceof Error ? err.message : "Vetítések lekérdezése sikertelen.");
        } finally {
            setScreeningsLoading(false);
        }
    }, []);

    // Filmek és termek lekérdezése egyszer a komponens betöltődésekor (dropdownokhoz)
    useEffect(() => {
        fetchMovies();
        fetchRooms();
    }, [fetchMovies, fetchRooms]);


    // Adatok lekérdezése az aktív fül alapján
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'movies') {
            if (movies.length === 0) fetchMovies();
        } else if (activeTab === 'rooms') {
            if (rooms.length === 0) fetchRooms();
        } else if (activeTab === 'screenings') {
            fetchScreenings();
            if (movies.length === 0) fetchMovies();
            if (rooms.length === 0) fetchRooms();
        }
    }, [activeTab, fetchUsers, fetchMovies, fetchRooms, fetchScreenings, movies.length, rooms.length]);
    // --- Adatlekérdezések Vége ---

    // --- Modális Ablak Megnyitó Handler-ek (Kombinált) ---
    // Pénztáros modális megnyitása és előkészítése
    const openAndPrepareCashierModal = () => {
        setUserActionError(null); // Hiba törlése
        cashierForm.reset(); // Űrlap alaphelyzetbe állítása
        setIsCashierModalOpen(true); // Modális megnyitása
    };

    // Film modális megnyitása és előkészítése (hozzáadás vagy szerkesztés)
    const openAndPrepareMovieModal = (movieToEdit: MovieData | null = null) => {
        setMovieActionError(null);
        if (movieToEdit) { // Szerkesztés
            setEditingMovie(movieToEdit);
            movieForm.setValues({ // Űrlap feltöltése a szerkesztendő film adataival
                title: movieToEdit.title,
                description: movieToEdit.description,
                duration: movieToEdit.duration,
            });
        } else { // Hozzáadás
            setEditingMovie(null);
            movieForm.reset();
        }
        setIsMovieModalOpen(true);
    };

    // Terem modális megnyitása és előkészítése
    const openAndPrepareRoomModal = (roomToEdit: RoomData | null = null) => {
        setRoomActionError(null);
        if (roomToEdit) { // Szerkesztés
            setEditingRoom(roomToEdit);
            roomForm.setValues({ roomName: roomToEdit.roomName, seats: roomToEdit.seats });
        } else { // Hozzáadás
            setEditingRoom(null);
            roomForm.reset();
        }
        setIsRoomModalOpen(true);
    };

    // Vetítés modális megnyitása és előkészítése
    const openAndPrepareScreeningModal = (screeningToEdit: ScreeningData | null = null) => {
        setScreeningActionError(null);
        if (screeningToEdit) { // Szerkesztés
            setEditingScreening(screeningToEdit);
            // movieId és roomId kikeresése név alapján
            const foundMovie = movies.find(m => m.title === screeningToEdit.movieTitle);
            const foundRoom = rooms.find(r => r.roomName === screeningToEdit.roomName);
            screeningForm.setValues({
                movieId: foundMovie ? foundMovie.id.toString() : '',
                roomId: foundRoom ? foundRoom.id.toString() : '',
                screeningDate: screeningToEdit.screeningDate ? new Date(screeningToEdit.screeningDate) : null,
                price: screeningToEdit.price,
            });
        } else { // Hozzáadás
            setEditingScreening(null);
            screeningForm.reset();
        }
        setIsScreeningModalOpen(true);
    };
    // --- Modális Ablak Megnyitó Handler-ek Vége ---


    // --- Felhasználókezelési Handler-ek ---
    // Új pénztáros hozzáadása
    const handleAddCashier = async (values: NewCashierForm) => {
        setUserActionError(null);
        try {
            await apiCall<void>('/api/admin/cashier', {
                method: 'POST',
                data: values,
            });
            notifications.show({ // Sikeres hozzáadás értesítés
                title: 'Pénztáros hozzáadva',
                message: `A(z) ${values.name} nevű pénztáros sikeresen hozzáadva.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            setIsCashierModalOpen(false); // Modális bezárása
            cashierForm.reset(); // Űrlap ürítése
            if (activeTab === 'users') await fetchUsers(); // Lista frissítése, ha a felhasználók fül aktív
        } catch (err) {
            setUserActionError(err instanceof Error ? err.message : "Pénztáros hozzáadása sikertelen.");
        }
     };
     // Felhasználó törlése
    const handleDeleteUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Biztosan törölni szeretnéd a(z) ${userName} (ID: ${userId}) felhasználót? Ez a művelet nem vonható vissza.`)) return;
        setUserActionError(null);
        try {
            await apiCall<void>(`/api/admin/user/${userId}`, { method: 'DELETE' });
            notifications.show({ // Sikeres törlés értesítés
                title: 'Felhasználó törölve',
                message: `A(z) ${userName} (ID: ${userId}) felhasználó sikeresen törölve.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            if (activeTab === 'users') await fetchUsers(); // Lista frissítése
        } catch (err) {
            setUserActionError(err instanceof Error ? err.message : `Felhasználó (ID: ${userId}) törlése sikertelen.`);
        }
     };
     // Felhasználó tiltása
    const handleBanUser = async (userId: number, userName: string) => {
         if (!window.confirm(`Biztosan tiltani szeretnéd a(z) ${userName} (ID: ${userId}) felhasználót 30 napra?`)) return;
        setUserActionError(null);
        try {
            const response = await apiCall<{ message: string }>(`/api/admin/ban/${userId}`, { method: 'POST' });
            notifications.show({ // Sikeres tiltás értesítés
                title: 'Felhasználó tiltva',
                message: response.message || `A(z) ${userName} (ID: ${userId}) felhasználó sikeresen tiltva.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            if (activeTab === 'users') await fetchUsers(); // Lista frissítése
        } catch (err) {
             setUserActionError(err instanceof Error ? err.message : `Felhasználó (ID: ${userId}) tiltása sikertelen.`);
        }
     };
     // Felhasználó tiltásának feloldása
    const handleUnbanUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Biztosan fel szeretnéd oldani a(z) ${userName} (ID: ${userId}) felhasználó tiltását?`)) return;
        setUserActionError(null);
        try {
            const response = await apiCall<{ message: string }>(`/api/admin/unban/${userId}`, { method: 'POST' });
            notifications.show({ // Sikeres feloldás értesítés
                title: 'Tiltás feloldva',
                message: response.message || `A(z) ${userName} (ID: ${userId}) felhasználó tiltása sikeresen feloldva.`,
                color: 'green',
                icon: <IconLockOpen size={16} /> 
            });
            if (activeTab === 'users') await fetchUsers(); // Lista frissítése
        } catch (err) {
             setUserActionError(err instanceof Error ? err.message : `Felhasználó (ID: ${userId}) tiltásának feloldása sikertelen.`);
        }
     };
     // Tiltás dátumának formázása 
    const formatBanDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Nincs tiltva';
        try {
            const date = new Date(dateString);
            // Ellenőrzi, hogy a tiltás még érvényes-e
            return date > new Date() ? date.toLocaleString('hu-HU') : 'Nincs tiltva (Lejárt)';
        } catch { return 'Érvénytelen dátum'; }
    };
    // --- Felhasználókezelési Handler-ek Vége ---

    // --- Filmkezelési Handler-ek ---
    // Film hozzáadása vagy szerkesztése
    const handleMovieSubmit = async (values: MovieFormValues) => {
        setMovieActionError(null);
        // Adatok előkészítése a backend kéréshez
        const movieData = {
            title: values.title,
            description: values.description,
            duration: Number(values.duration) // String -> Number konverzió
        };
        try {
            const action = editingMovie ? 'módosítva' : 'hozzáadva'; 
            if (editingMovie) { // Szerkesztés (PUT kérés)
                await apiCall<MovieData>(`/api/movie/${editingMovie.id}`, { method: 'PUT', data: movieData });
            } else { // Hozzáadás (POST kérés)
                await apiCall<MovieData>('/api/movie', { method: 'POST', data: movieData });
            }
            notifications.show({ // Sikeres művelet értesítés
                title: `Film ${action}`,
                message: `A(z) "${values.title}" című film sikeresen ${action}.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            setIsMovieModalOpen(false); // Modális bezárása
            movieForm.reset(); // Űrlap ürítése
            await fetchMovies(); // Filmek listájának és a dropdownok frissítése
        } catch (err) {
            setMovieActionError(err instanceof Error ? err.message : `Film ${editingMovie ? 'módosítása' : 'hozzáadása'} sikertelen.`);
        }
    };
    // Film törlése
    const handleDeleteMovie = async (movieId: number, movieTitle: string) => {
        if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${movieTitle}" (ID: ${movieId}) című filmet? Ez a művelet nem vonható vissza.`)) return;
        setMovieActionError(null);
        try {
            // DELETE kérés a /api/movie/{id} végpontra
            await apiCall<void>(`/api/movie/${movieId}`, { method: 'DELETE' });
            notifications.show({ // Sikeres törlés értesítés
                title: 'Film törölve',
                message: `A(z) "${movieTitle}" (ID: ${movieId}) című film sikeresen törölve.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            await fetchMovies(); // Filmek listájának frissítése
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `Film (ID: ${movieId}) törlése sikertelen.`;
            // Specifikus hiba kezelése, ha a backend jelzi, hogy aktív vetítés miatt nem törölhető
            if (errorMsg.includes("Cannot delete a movie with active screenings")) {
                 setMovieActionError("Ez a film nem törölhető, mert aktív vetítések tartoznak hozzá.");
            } else {
                 setMovieActionError(errorMsg);
            }
        }
    };
    // Film szerkesztése gombra kattintáskor
    const handleEditMovieClick = (movie: MovieData) => {
        openAndPrepareMovieModal(movie); // Megnyitja a modálist szerkesztésre
    };
    // --- Filmkezelési Handler-ek Vége ---

    // --- Teremkezelési Handler-ek ---
    // Terem hozzáadása vagy szerkesztése
    const handleRoomSubmit = async (values: RoomFormValues) => {
        setRoomActionError(null);
        const roomData = { roomName: values.roomName, seats: Number(values.seats) };
        try {
            const action = editingRoom ? 'módosítva' : 'hozzáadva';
            if (editingRoom) { // Szerkesztés (PUT)
                await apiCall<RoomData>(`/api/room/${editingRoom.id}`, { method: 'PUT', data: roomData });
            } else { // Hozzáadás (POST)
                await apiCall<void>('/api/room', { method: 'POST', data: roomData });
            }
            notifications.show({ // Sikeres művelet értesítés
                title: `Terem ${action}`,
                message: `A(z) "${values.roomName}" nevű terem sikeresen ${action}.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            setIsRoomModalOpen(false); // Modális bezárása
            roomForm.reset(); // Űrlap ürítése
            await fetchRooms(); // Termek listájának frissítése
        } catch (err) {
            setRoomActionError(err instanceof Error ? err.message : `Terem ${editingRoom ? 'módosítása' : 'hozzáadása'} sikertelen.`);
        }
    };
    // Terem törlése
    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${roomName}" (ID: ${roomId}) nevű termet? Ez a művelet nem vonható vissza.`)) return;
        setRoomActionError(null);
        try {
            // DELETE kérés a /api/room/{id} végpontra
            await apiCall<void>(`/api/room/${roomId}`, { method: 'DELETE' });
            notifications.show({ // Sikeres törlés értesítés
                title: 'Terem törölve',
                message: `A(z) "${roomName}" (ID: ${roomId}) nevű terem sikeresen törölve.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            await fetchRooms(); // Termek listájának frissítése
        } catch (err) {
             // Specifikus hiba kezelése (ha a backend jelzi)
             const errorMsg = err instanceof Error ? err.message : `Terem (ID: ${roomId}) törlése sikertelen.`;
             if (errorMsg.includes("Cannot delete room with active screenings")) { 
                 setRoomActionError("Ez a terem nem törölhető, mert aktív vetítések tartoznak hozzá.");
             } else {
                 setRoomActionError(errorMsg);
             }
        }
    };
    // Terem szerkesztése gombra kattintáskor
    const handleEditRoomClick = (room: RoomData) => {
        openAndPrepareRoomModal(room); // Megnyitja a modálist szerkesztésre
    };
    // --- Teremkezelési Handler-ek Vége ---

    // --- Vetítéskezelési Handler-ek ---
    // Vetítés hozzáadása vagy szerkesztése
    const handleScreeningSubmit = async (values: ScreeningFormValues) => {
        setScreeningActionError(null);

        // Kiválasztott film és terem objektumok megkeresése a nevük kinyeréséhez
        const selectedMovie = movies.find(m => m.id.toString() === values.movieId);
        const selectedRoom = rooms.find(r => r.id.toString() === values.roomId);

        // Ellenőrzés
        if (!selectedMovie || !selectedRoom || !values.screeningDate) {
            setScreeningActionError("Érvénytelen film, terem vagy dátum lett kiválasztva.");
            notifications.show({
                title: 'Hiba',
                message: 'Kérjük, válasszon érvényes filmet, termet és dátumot.',
                color: 'red',
            });
            return;
        }

        // Payload összeállítása
        const screeningPayload = {
            movieTitle: selectedMovie.title,       // Cím a kiválasztott filmből
            teremName: selectedRoom.roomName,      // Teremnév a kiválasztott teremből
            screeningDate: values.screeningDate.toISOString(), // ISO string formátumban küldés
            price: Number(values.price) // Ár számként
        };

        try {
            const action = editingScreening ? 'módosítva' : 'hozzáadva';
            const endpoint = editingScreening ? `/api/screening/${editingScreening.id}` : '/api/screening'; 
            const method = editingScreening ? 'PUT' : 'POST';

            // Helyes payload (screeningPayload) használata a kérésben
            await apiCall<BackendScreeningResponse>(endpoint, { method: method, data: screeningPayload });

            notifications.show({ // Sikeres művelet értesítés
                title: `Vetítés ${action}`,
                message: `A(z) "${selectedMovie.title}" film vetítése a(z) "${selectedRoom.roomName}" teremben sikeresen ${action}.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            setIsScreeningModalOpen(false); // Modális bezárása
            screeningForm.reset(); // Űrlap ürítése
            await fetchScreenings(); // Vetítések listájának frissítése
        } catch (err) {
            setScreeningActionError(err instanceof Error ? err.message : `Vetítés ${editingScreening ? 'módosítása' : 'hozzáadása'} sikertelen.`);
        }
    };

    // Vetítés törlése
    const handleDeleteScreening = async (screeningId: number, movieTitle: string, roomName: string) => {
        if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${movieTitle}" film vetítését a(z) "${roomName}" teremben (ID: ${screeningId})? Ez a művelet nem vonható vissza.`)) return;
        setScreeningActionError(null);
        try {
            // DELETE kérés a /api/screening/{id} végpontra
            await apiCall<void>(`/api/screening/${screeningId}`, { method: 'DELETE' });
            notifications.show({ // Sikeres törlés értesítés
                title: 'Vetítés törölve',
                message: `A(z) ${screeningId} ID-jű vetítés sikeresen törölve.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            await fetchScreenings(); // Vetítések listájának frissítése
        } catch (err) {
            setScreeningActionError(err instanceof Error ? err.message : `Vetítés (ID: ${screeningId}) törlése sikertelen.`);
        }
    };
    // Vetítés szerkesztése gombra kattintáskor
    const handleEditScreeningClick = (screening: ScreeningData) => {
        openAndPrepareScreeningModal(screening); // Megnyitja a modálist szerkesztésre
    };
    // --- Vetítéskezelési Handler-ek Vége ---


    // Ellenőrzés: Csak adminisztrátor láthatja ezt az oldalt
    if (user?.role !== 'Admin') {
         return <Alert icon={<IconAlertCircle size="1rem" />} title="Hozzáférés megtagadva" color="orange">Nincs jogosultságod az oldal megtekintéséhez.</Alert>;
    }

    // --- Táblázat Sorok Generálása ---
    // Felhasználók táblázat sorai
    const userRows = users.map((u) => {
        const isBanned = u.bannedTill && new Date(u.bannedTill) > new Date(); // tiltás aktív-e
        return (
            <Table.Tr key={u.id}>
                <Table.Td>{u.id}</Table.Td>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>{u.phone}</Table.Td>
                <Table.Td>{u.role}</Table.Td>
                <Table.Td>{formatBanDate(u.bannedTill)}</Table.Td> {/* Formázott tiltási dátum */}
                <Table.Td>
                    <Group gap="xs">
                         {/* Törlés gomb (önmagát nem törölheti) */}
                         <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteUser(u.id, u.name)} disabled={u.id === user?.id} title={u.id === user?.id ? "Saját magad nem törölheted" : "Felhasználó törlése"}><IconTrash size={14} /></Button>
                         {/* Feltételes Tiltás/Feloldás gomb */}
                         {isBanned ? (
                             <Button size="xs" variant="outline" color="green" onClick={() => handleUnbanUser(u.id, u.name)} title="Tiltás feloldása"><IconLockOpen size={14} /></Button>
                         ) : (
                             <Button size="xs" variant="outline" color="orange" onClick={() => handleBanUser(u.id, u.name)} disabled={u.id === user?.id} title={u.id === user?.id ? "Saját magad nem tilthatod" : "Felhasználó tiltása"}><IconLock size={14} /></Button>
                         )}
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    // Filmek táblázat sorai
    const movieRows = movies.map((m) => (
        <Table.Tr key={m.id}>
            <Table.Td>{m.id}</Table.Td>
            <Table.Td>{m.title}</Table.Td>
            {/* Leírás levágása, ha túl hosszú */}
            <Table.Td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</Table.Td>
            <Table.Td>{m.duration} perc</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    {/* Szerkesztés gomb */}
                    <Button size="xs" variant="outline" color="blue" onClick={() => handleEditMovieClick(m)} title="Film szerkesztése"><IconPencil size={14} /></Button>
                    {/* Törlés gomb */}
                    <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteMovie(m.id, m.title)} title="Film törlése"><IconTrash size={14} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // Termek táblázat sorai
    const roomRows = rooms.map((r) => (
        <Table.Tr key={r.id}>
            <Table.Td>{r.id}</Table.Td>
            <Table.Td>{r.roomName}</Table.Td>
            <Table.Td>{r.seats}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                     {/* Szerkesztés gomb */}
                    <Button size="xs" variant="outline" color="blue" onClick={() => handleEditRoomClick(r)} title="Terem szerkesztése"><IconPencil size={14} /></Button>
                    {/* Törlés gomb */}
                    <Button size="xs" variant="outline" color="red" onClick={() => handleDeleteRoom(r.id, r.roomName)} title="Terem törlése"><IconTrash size={14} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // Vetítések táblázat sorai ScreeningData
    const screeningRows = screenings.map((s) => (
        <Table.Tr key={s.id}>
            <Table.Td>{s.id}</Table.Td>
            <Table.Td>{s.movieTitle}</Table.Td> {/* Kinyert filmcím */}
            <Table.Td>{s.roomName}</Table.Td>   {/* Kinyert teremnév */}
            <Table.Td>{new Date(s.screeningDate).toLocaleString('hu-HU')}</Table.Td> {/* Formázott dátum */}
            <Table.Td>{s.price} Ft</Table.Td>
            <Table.Td>
                <Group gap="xs">
                     {/* Szerkesztés gomb (a helyes ScreeningData objektumot adja át) */}
                    <Button size="xs" variant="outline" onClick={() => handleEditScreeningClick(s)} leftSection={<IconPencil size={14} />}>Szerkesztés</Button>
                    {/* Törlés gomb (a helyes adatokat adja át a törléshez/megerősítéshez) */}
                    <Button size="xs" variant="filled" color="red" onClick={() => handleDeleteScreening(s.id, s.movieTitle, s.roomName)} leftSection={<IconTrash size={14} />}>Törlés</Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));
    // --- Táblázat Sorok Generálása Vége ---

    // --- Dropdown Adatok Előkészítése ---
    // Filmek a Select komponenshez (csak a létező címekkel)
    const movieOptions = movies
        .filter(movie => movie && typeof movie.title === 'string') // Biztosítja, hogy a film és a cím létezik
        .map(movie => ({ value: movie.id.toString(), label: movie.title }));

    // Termek a Select komponenshez (csak a létező nevekkel)
    const roomOptions = rooms
        .filter(room => room && typeof room.roomName === 'string')
        .map(room => ({ value: room.id.toString(), label: room.roomName }));
    // --- Dropdown Adatok Előkészítése Vége ---

    return (
        // A modális ablakokat a Tabs komponensen kívül helyezzük el a helyes működés érdekében
        <Paper shadow="xs" p="md" style={{ minWidth: '80vw' }}>
            <Title order={2} mb="lg">Adminisztrációs Felület</Title>

            {/* Fülek a különböző kezelőfelületekhez */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow> {/* Fülek kitöltik a rendelkezésre álló helyet */}
                    <Tabs.Tab value="users" leftSection={<IconUsers size={14} />}>Felhasználókezelés</Tabs.Tab>
                    <Tabs.Tab value="movies" leftSection={<IconMovie size={14} />}>Filmkezelés</Tabs.Tab>
                    <Tabs.Tab value="rooms" leftSection={<IconBuildingSkyscraper size={14} />}>Teremkezelés</Tabs.Tab>
                    <Tabs.Tab value="screenings" leftSection={<IconCalendarEvent size={14} />}>Vetítéskezelés</Tabs.Tab>
                </Tabs.List>

                {/* Felhasználókezelési Panel */}
                <Tabs.Panel value="users" pt="lg">
                    {/* Hibaüzenet megjelenítése felhasználói műveletnél */}
                    {userActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Felhasználói művelet hiba" color="red" mb="md" withCloseButton onClose={() => setUserActionError(null)}>{userActionError}</Alert>}
                    {/* Új pénztáros hozzáadása gomb */}
                    <Button leftSection={<IconUserPlus size={14} />} onClick={openAndPrepareCashierModal} mb="md">Új pénztáros hozzáadása</Button>
                    {/* Betöltésjelző */}
                    {usersLoading && <Loader my="lg" />}
                    {/* Hibaüzenet betöltéskor */}
                    {usersError && !usersLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a felhasználók betöltésekor" color="red">{usersError}</Alert>}
                    {/* Felhasználók táblázata */}
                    {!usersLoading && !usersError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Név</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Telefon</Table.Th>
                                    <Table.Th>Szerepkör</Table.Th>
                                    <Table.Th>Tiltva eddig</Table.Th>
                                    <Table.Th>Műveletek</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{userRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Filmkezelési Panel */}
                <Tabs.Panel value="movies" pt="lg">
                     {/* Hibaüzenet film műveletnél */}
                     {movieActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Film művelet hiba" color="red" mb="md" withCloseButton onClose={() => setMovieActionError(null)}>{movieActionError}</Alert>}
                     {/* Új film hozzáadása gomb (null-t ad át, jelezve, hogy új filmről van szó) */}
                    <Button leftSection={<IconMovie size={14} />} onClick={() => openAndPrepareMovieModal(null)} mb="md">Új film hozzáadása</Button>
                    {/* Betöltésjelző */}
                    {moviesLoading && <Loader my="lg" />}
                    {/* Hibaüzenet betöltéskor */}
                    {moviesError && !moviesLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a filmek betöltésekor" color="red">{moviesError}</Alert>}
                    {/* Filmek táblázata */}
                    {!moviesLoading && !moviesError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Cím</Table.Th>
                                    <Table.Th>Leírás</Table.Th>
                                    <Table.Th>Játékidő</Table.Th>
                                    <Table.Th>Műveletek</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{movieRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Teremkezelési Panel */}
                <Tabs.Panel value="rooms" pt="lg">
                     {/* Hibaüzenet terem műveletnél */}
                     {roomActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Terem művelet hiba" color="red" mb="md" withCloseButton onClose={() => setRoomActionError(null)}>{roomActionError}</Alert>}
                     {/* Új terem hozzáadása gomb */}
                    <Button leftSection={<IconBuildingSkyscraper size={14} />} onClick={() => openAndPrepareRoomModal(null)} mb="md">Új terem hozzáadása</Button>
                    {/* Betöltésjelző */}
                    {roomsLoading && <Loader my="lg" />}
                    {/* Hibaüzenet betöltéskor */}
                    {roomsError && !roomsLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a termek betöltésekor" color="red">{roomsError}</Alert>}
                    {/* Termek táblázata */}
                    {!roomsLoading && !roomsError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Terem neve</Table.Th>
                                    <Table.Th>Ülőhelyek</Table.Th>
                                    <Table.Th>Műveletek</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{roomRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Vetítéskezelési Panel */}
                <Tabs.Panel value="screenings" pt="lg">
                    <Group justify="space-between" mb="md">
                        <Title order={3}>Vetítések</Title>
                        {/* Új vetítés hozzáadása gomb */}
                        <Button onClick={() => openAndPrepareScreeningModal(null)} leftSection={<IconCalendarEvent size={14} />}>Új vetítés hozzáadása</Button>
                    </Group>
                     {/* Betöltésjelző */}
                     {screeningsLoading && <Loader my="lg" />}
                     {/* Hibaüzenet betöltéskor */}
                    {screeningsError && !screeningsLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a vetítések betöltésekor" color="red">{screeningsError}</Alert>}
                    {/* Hibaüzenet vetítés műveletnél */}
                    {screeningActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Vetítés művelet hiba" color="red" mb="md" withCloseButton onClose={() => setScreeningActionError(null)}>{screeningActionError}</Alert>}
                    {/* Vetítések táblázata */}
                    {!screeningsLoading && !screeningsError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Film</Table.Th>
                                    <Table.Th>Terem</Table.Th>
                                    <Table.Th>Dátum és idő</Table.Th>
                                    <Table.Th>Ár</Table.Th>
                                    <Table.Th>Műveletek</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{screeningRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

            </Tabs>

            {/* --- Modális Ablakok --- */}
            {/* Pénztáros hozzáadása modális */}
            <Modal opened={isCashierModalOpen} onClose={() => setIsCashierModalOpen(false)} title="Új pénztáros hozzáadása" centered>
                 {/* Hibaüzenet a modálisban */}
                 {userActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red" mb="md">{userActionError}</Alert>}
                 {/* Pénztáros űrlap */}
                 <form onSubmit={cashierForm.onSubmit(handleAddCashier)}>
                    <TextInput label="Név" required {...cashierForm.getInputProps('name')} mb="sm" />
                    <TextInput label="Email" required type="email" {...cashierForm.getInputProps('email')} mb="sm" />
                    <TextInput label="Telefonszám" required {...cashierForm.getInputProps('phoneNumber')} mb="sm" />
                    <PasswordInput label="Jelszó" required {...cashierForm.getInputProps('password')} mb="lg" />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setIsCashierModalOpen(false)}>Mégse</Button>
                        <Button type="submit">Pénztáros hozzáadása</Button>
                    </Group>
                 </form>
            </Modal>

            {/* Film hozzáadása/szerkesztése modális */}
            <Modal opened={isMovieModalOpen} onClose={() => setIsMovieModalOpen(false)} title={editingMovie ? 'Film szerkesztése' : 'Új film hozzáadása'} centered> {/* Added centered prop */}
                 {/* Hibaüzenet */}
                 {movieActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red" mb="md">{movieActionError}</Alert>}
                 {/* Film űrlap */}
                 <form onSubmit={movieForm.onSubmit(handleMovieSubmit)}>
                     <TextInput label="Cím" required {...movieForm.getInputProps('title')} mb="sm" />
                     <Textarea label="Leírás" required {...movieForm.getInputProps('description')} mb="sm" />
                     <NumberInput label="Játékidő (perc)" required min={1} allowDecimal={false} {...movieForm.getInputProps('duration')} mb="lg" />
                     <Group justify="flex-end">
                         <Button variant="default" onClick={() => setIsMovieModalOpen(false)}>Mégse</Button>
                         <Button type="submit">Film mentése</Button>
                     </Group>
                 </form>
            </Modal>

            {/* Terem hozzáadása/szerkesztése modális */}
            <Modal opened={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoom ? 'Terem szerkesztése' : 'Új terem hozzáadása'} centered> {/* Added centered prop */}
                 {/* Hibaüzenet */}
                 {roomActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red" mb="md">{roomActionError}</Alert>}
                 {/* Terem űrlap */}
                 <form onSubmit={roomForm.onSubmit(handleRoomSubmit)}>
                     <TextInput label="Terem neve" required {...roomForm.getInputProps('roomName')} mb="sm" />
                     <NumberInput label="Ülőhelyek száma" required min={1} allowDecimal={false} {...roomForm.getInputProps('seats')} mb="lg" />
                     <Group justify="flex-end">
                         <Button variant="default" onClick={() => setIsRoomModalOpen(false)}>Mégse</Button>
                         <Button type="submit">Terem mentése</Button>
                     </Group>
                 </form>
            </Modal>

            {/* Vetítés hozzáadása/szerkesztése modális */}
            <Modal opened={isScreeningModalOpen} onClose={() => setIsScreeningModalOpen(false)} title={editingScreening ? 'Vetítés szerkesztése' : 'Új vetítés hozzáadása'} centered> {/* Added centered prop */}
                {/* Hibaüzenet */}
                {screeningActionError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red" mb="md">{screeningActionError}</Alert>}
                {/* Vetítés űrlap */}
                <form onSubmit={screeningForm.onSubmit(handleScreeningSubmit)}>
                    {/* Film kiválasztása */}
                    <Select
                        label="Film"
                        placeholder="Válassz filmet"
                        data={movieOptions} // Előkészített film opciók
                        {...screeningForm.getInputProps('movieId')} // Összekötés a movieId állapottal
                        searchable // Kereshetővé teszi a listát
                        required
                        mb="sm"
                        error={screeningForm.errors.movieId} // Hiba megjelenítése
                    />
                    {/* Terem kiválasztása */}
                    <Select
                        label="Terem"
                        placeholder="Válassz termet"
                        data={roomOptions} // Előkészített terem opciók
                        {...screeningForm.getInputProps('roomId')} // Összekötés a roomId állapottal
                        searchable
                        required
                        mb="sm"
                        error={screeningForm.errors.roomId} // Hiba megjelenítése
                    />
                    {/* Dátum és idő választó */}
                    <DateTimePicker
                        label="Vetítés dátuma és ideje"
                        placeholder="Válassz dátumot és időt"
                        valueFormat="YYYY-MM-DD HH:mm" // Megjelenítési formátum
                        {...screeningForm.getInputProps('screeningDate')} // Összekötés a screeningDate állapottal
                        required
                        mb="sm"
                        error={screeningForm.errors.screeningDate} // Hiba megjelenítése
                    />
                    {/* Ár megadása */}
                    <NumberInput
                        label="Ár (Ft)"
                        placeholder="Add meg az árat"
                        min={0} // Minimum ár 0
                        allowDecimal={false} // Egész szám
                        {...screeningForm.getInputProps('price')} // Összekötés a price állapottal
                        required
                        mb="lg"
                        error={screeningForm.errors.price} // Hiba megjelenítése
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setIsScreeningModalOpen(false)}>Mégse</Button>
                        <Button type="submit">Vetítés mentése</Button>
                    </Group>
                </form>
            </Modal>

        </Paper>
    );
}

export default AdminDashboard;
