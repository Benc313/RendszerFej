import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, Alert, Title, Text, Paper, List, ThemeIcon, Button, Group, Modal, Box, TextInput } from '@mantine/core';
import { IconAlertCircle, IconCalendar, IconBuildingSkyscraper } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Backend MovieResponse alapján (részleges)
interface Screening {
    id: number;
    screeningDate: string; // ISO string
    price: number;
    movie: MovieSummary; // Csak az összefoglaló adatok
    room: string; // Vagy egy Room interfész, ha több adat kell
}

interface MovieSummary {
    id: number;
    title: string;
    duration: number;
    description: string;
    // ...esetleg további mezők...
}

interface MovieDetails extends MovieSummary { // MovieSummary az előző fájlból
    screenings: Screening[];
}

// Backend OrderRequest alapján
interface TicketRequest {
    seatNumber: number;
    screeningId: number;
}

interface OrderRequest {
    phone?: string | null;
    email?: string | null;
    userId?: number | null;
    tickets: TicketRequest[];
}

// Backend OrderResponse alapján
interface OrderResponse {
    id: number;
    totalPrice: number;
    // ...többi mező...
}

// Helper function to format date
const formatScreeningDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('hu-HU', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

function MovieDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [movie, setMovie] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<OrderResponse | null>(null);

    const form = useForm({
        initialValues: {
            seatNumbers: '',
            email: '',
            phone: '',
        },
        validate: {
            seatNumbers: (value) => {
                if (!value.trim()) return 'Legalább egy székszámot meg kell adni.';
                const seats = value.split(',').map(s => s.trim()).filter(s => s !== '');
                if (seats.length === 0) return 'Legalább egy székszámot meg kell adni.';
                const invalidSeat = seats.find(seat => !/^\d+$/.test(seat) || parseInt(seat, 10) <= 0);
                if (invalidSeat) return `Érvénytelen székszám: "${invalidSeat}". Csak pozitív egész számok adhatók meg vesszővel elválasztva.`;
                return null;
            },
            email: (value) => (!user && !/^\S+@\S+$/.test(value) ? 'Érvénytelen email cím' : null),
            phone: (value) => (!user && value.trim().length < 6 ? 'Telefonszám megadása kötelező (min. 6 karakter)' : null),
        },
    });

    useEffect(() => {
        const fetchMovieDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiCall<MovieDetails>(`/api/movie/${id}`);
                setMovie(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Film részleteinek lekérdezése sikertelen.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMovieDetails();
        }
    }, [id]);

    const handleScreeningSelect = (screening: Screening) => {
        setSelectedScreening(screening);
        setOrderError(null); // Hiba törlése új választáskor
        setOrderSuccess(null); // Siker törlése új választáskor
        form.reset(); // Űrlap alaphelyzetbe állítása
        open(); // Modális ablak megnyitása
    };

    const handleConfirmPurchase = async (values: typeof form.values) => {
        if (!selectedScreening) return;
        setOrderError(null);
        setOrderSuccess(null);

        // Vesszővel elválasztott string feldolgozása számtömbbé
        const seatNumbers = values.seatNumbers
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '' && /^\d+$/.test(s)) // Üres stringek és nem számok kiszűrése
            .map(s => parseInt(s, 10))
            .filter(n => n > 0); // Csak pozitív számok

        if (seatNumbers.length === 0) {
            setOrderError("Legalább egy érvényes, pozitív székszámot meg kell adni.");
            return;
        }

        // TicketRequest objektumok létrehozása minden székhez
        const ticketRequests: TicketRequest[] = seatNumbers.map(seatNumber => ({
            seatNumber: seatNumber,
            screeningId: selectedScreening.id,
        }));

        const orderRequest: OrderRequest = {
            tickets: ticketRequests, // Több jegy hozzáadása
        };

        if (user) {
            orderRequest.userId = user.id;
        } else {
            orderRequest.email = values.email;
            orderRequest.phone = values.phone;
        }

        try {
            const response = await apiCall<OrderResponse>('/api/order', {
                method: 'POST',
                data: orderRequest,
            });
            setOrderSuccess(response);
            // Optionally close modal after a delay or keep it open to show success
            // setTimeout(close, 2000);
        } catch (err) {
            const errorMessage = (err instanceof Error) ? err.message : "Nem sikerült a jegyvásárlás.";
            setOrderError(errorMessage);
            console.error("Rendelési hiba:", err);
        }
    };

    if (loading) return <Loader />;
    if (error) return <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red">{error}</Alert>;
    if (!movie) return <Alert icon={<IconAlertCircle size="1rem" />} title="Hoppá!" color="orange">A film nem található.</Alert>;

    return (
        <>
            <Paper shadow="xs" p="md">
                <Title order={2} mb="md">{movie.title}</Title>
                <Text mb="md">{movie.description}</Text>
                <Text mb="md">Játékidő: {movie.duration} perc</Text>

                <Title order={4} mt="lg" mb="sm">Elérhető vetítések:</Title>
                {movie.screenings && movie.screenings.length > 0 ? (
                    <List
                        spacing="xs"
                        size="sm"
                        center
                        icon={
                            <ThemeIcon color="teal" size={24} radius="xl">
                                <IconCalendar size="1rem" />
                            </ThemeIcon>
                        }
                    >
                        {movie.screenings.map((screening) => (
                            <List.Item
                                key={screening.id}
                                icon={
                                    <ThemeIcon color="blue" size={24} radius="xl">
                                        <IconBuildingSkyscraper size="1rem" />
                                    </ThemeIcon>
                                }
                            >
                                <Group justify="space-between">
                                    <div>
                                        <Text>{formatScreeningDate(screening.screeningDate)}</Text>
                                        <Text size="xs" c="dimmed">Terem: {screening.room}, Ár: {screening.price} Ft</Text>
                                    </div>
                                    <Button size="xs" onClick={() => handleScreeningSelect(screening)}>Jegyvásárlás</Button>
                                </Group>
                            </List.Item>
                        ))}
                    </List>
                ) : (
                    <Text>Nincsenek elérhető vetítések ehhez a filmhez.</Text>
                )}
            </Paper>

            <Modal
                opened={opened}
                onClose={close}
                title="Jegyvásárlás megerősítése"
                centered
                withinPortal={true} // Explicit portal használat (alapértelmezett)
            >
                {orderError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red" mb="md">{orderError}</Alert>}
                {orderSuccess ? (
                    <Alert title="Sikeres Vásárlás" color="green" mb="md">
                        Rendelés azonosító: {orderSuccess.id}, Teljes ár: {orderSuccess.totalPrice} Ft.
                    </Alert>
                ) : (
                    selectedScreening && (
                        <Box component="form" onSubmit={form.onSubmit(handleConfirmPurchase)}>
                            <Text>Vetítés: {formatScreeningDate(selectedScreening.screeningDate)}</Text>
                            <Text>Terem: {selectedScreening.room}</Text>
                            <Text mb="md">Ár: {selectedScreening.price} Ft / jegy</Text>

                            <TextInput
                                label="Szék számok (vesszővel elválasztva)"
                                placeholder="Pl.: 5, 12, 23"
                                required
                                {...form.getInputProps('seatNumbers')}
                                mb="sm"
                            />

                            {!user && (
                                <>
                                    <TextInput
                                        label="E-mail cím (vendég vásárláshoz)"
                                        placeholder="nev@email.com"
                                        required
                                        type="email"
                                        {...form.getInputProps('email')}
                                        mb="sm"
                                    />
                                    <TextInput
                                        label="Telefonszám (vendég vásárláshoz)"
                                        placeholder="+36 30 123 4567"
                                        required
                                        {...form.getInputProps('phone')}
                                        mb="lg"
                                    />
                                </>
                            )}

                            <Group justify="flex-end" mt="md">
                                <Button variant="default" onClick={close}>Mégse</Button>
                                <Button type="submit">Vásárlás megerősítése</Button>
                            </Group>
                        </Box>
                    )
                )}
            </Modal>
        </>
    );
}

export default MovieDetailsPage;