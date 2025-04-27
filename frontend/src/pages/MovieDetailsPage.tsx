import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, Alert, Title, Text, Paper, List, ThemeIcon, Button, Group, Modal, NumberInput, Box, TextInput } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck, IconCalendar, IconBuildingSkyscraper, IconCurrencyForint } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Backend MovieResponse alapján (részleges)
interface Screening {
    id: number;
    screeningDate: string; // Vagy Date, ha konvertáljuk
    movieName: string; // Backend ScreeningResponse alapján
    room: string;      // Backend ScreeningResponse alapján
    price: number;     // Backend ScreeningResponse alapján
    // A backend MovieResponse-ban lévő Screening objektum más, mint a ScreeningResponse!
    // Itt a ScreeningResponse struktúrát használjuk, amit a /screenings végpont adna vissza,
    // de a /movies/{id} végpont Screening objektumokat ad vissza. Ezt backend oldalon egységesíteni kellene.
    // Addig is feltételezzük, hogy a szükséges adatok elérhetők.
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
            seatNumber: 1, // Kezdőérték
            email: '', // Nem regisztrált felhasználónak
            phone: '', // Nem regisztrált felhasználónak
        },
        validate: {
            seatNumber: (value) => (value <= 0 ? 'A szék számának pozitívnak kell lennie' : null),
            email: (value) => (!user && !/^\S+@\S+$/.test(value) ? 'Érvénytelen e-mail cím szükséges a vendég vásárláshoz' : null),
            phone: (value) => (!user && value.trim().length < 6 ? 'Telefonszám szükséges a vendég vásárláshoz' : null),
        },
    });

    useEffect(() => {
        const fetchMovieDetails = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                // A backend /movies/{id} végpont MovieResponse-t ad vissza,
                // amiben a Screenings lista van. Ezt kell használnunk.
                // A típusokat ennek megfelelően kellene definiálni, de most feltételezzük a kompatibilitást.
                const data = await apiCall<MovieDetails>(`/movies/${id}`);
                setMovie(data);
            } catch (err) {
                const errorMessage = (err instanceof Error) ? err.message : "Nem sikerült lekérni a film részleteit.";
                setError(errorMessage);
                console.error("Hiba a film részleteinek lekérésekor:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovieDetails();
    }, [id]);

    const handlePurchaseClick = (screening: Screening) => {
        setSelectedScreening(screening);
        setOrderError(null);
        setOrderSuccess(null);
        form.reset(); // Reset form when opening modal
        open();
    };

    const handleConfirmPurchase = async (values: typeof form.values) => {
        if (!selectedScreening) return;
        setOrderError(null);
        setOrderSuccess(null);

        const orderRequest: OrderRequest = {
            tickets: [{
                seatNumber: values.seatNumber,
                screeningId: selectedScreening.id,
            }],
        };

        if (user) {
            orderRequest.userId = user.id;
        } else {
            orderRequest.email = values.email;
            orderRequest.phone = values.phone;
        }

        try {
            const response = await apiCall<OrderResponse>('/orders', {
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

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red">
                {error}
            </Alert>
        );
    }

    if (!movie) {
        return <Text>A film nem található.</Text>;
    }

    // Dátum formázása olvashatóbbra
    const formatScreeningDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('hu-HU', { // Magyar formátum
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Paper shadow="xs" p="md">
            <Title order={2}>{movie.title}</Title>
            <Text c="dimmed" size="sm">Hossz: {movie.duration} perc</Text>
            <Text mt="md">{movie.description}</Text>

            <Title order={3} mt="xl" mb="md">Vetítések</Title>
            {movie.screenings && movie.screenings.length > 0 ? (
                <List
                    spacing="md"
                    size="sm"
                    center
                >
                    {movie.screenings.map((screening) => (
                        <List.Item
                            key={screening.id}
                            icon={
                                <ThemeIcon color="blue" size={24} radius="xl">
                                    <IconCalendar size="1rem" />
                                </ThemeIcon>
                            }
                        >
                            <Group justify="space-between">
                                <div>
                                    <Text fw={500}>{formatScreeningDate(screening.screeningDate)}</Text>
                                    <Text size="sm" c="dimmed">
                                        <IconBuildingSkyscraper size="0.9rem" /> Terem: {screening.room} | <IconCurrencyForint size="0.9rem" /> Ár: {screening.price} Ft
                                    </Text>
                                </div>
                                <Button size="xs" onClick={() => handlePurchaseClick(screening)}>Jegyvásárlás</Button>
                            </Group>
                        </List.Item>
                    ))}
                </List>
            ) : (
                <Text>Ehhez a filmhez még nincsenek elérhető vetítések.</Text>
            )}

            {/* Jegyvásárlási Modális Ablak */}
            <Modal opened={opened} onClose={close} title={`Jegyvásárlás - ${movie.title}`} centered>
                {orderSuccess ? (
                    <Alert icon={<IconCircleCheck size="1rem" />} title="Sikeres vásárlás!" color="green">
                        Rendelés azonosító: {orderSuccess.id}, Teljes ár: {orderSuccess.totalPrice} Ft.
                    </Alert>
                ) : (
                    <Box component="form" onSubmit={form.onSubmit(handleConfirmPurchase)}>
                        {selectedScreening && (
                            <>
                                <Text>Vetítés: {formatScreeningDate(selectedScreening.screeningDate)}</Text>
                                <Text>Terem: {selectedScreening.room}</Text>
                                <Text mb="md">Ár: {selectedScreening.price} Ft</Text>
                            </>
                        )}

                        <NumberInput
                            label="Szék száma"
                            placeholder="Adja meg a szék számát"
                            min={1}
                            required
                            {...form.getInputProps('seatNumber')}
                        />

                        {!user && (
                            <>
                                <TextInput
                                    label="E-mail cím (vendég vásárláshoz)"
                                    placeholder="nev@email.com"
                                    required
                                    mt="md"
                                    {...form.getInputProps('email')}
                                />
                                <TextInput
                                    label="Telefonszám (vendég vásárláshoz)"
                                    placeholder="+36..."
                                    required
                                    mt="md"
                                    {...form.getInputProps('phone')}
                                />
                            </>
                        )}

                        {orderError && (
                            <Alert icon={<IconAlertCircle size="1rem" />} title="Vásárlási hiba" color="red" mt="md">
                                {orderError}
                            </Alert>
                        )}

                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={close}>Mégse</Button>
                            <Button type="submit">Vásárlás megerősítése</Button>
                        </Group>
                    </Box>
                )}
            </Modal>
        </Paper>
    );
}

export default MovieDetailsPage;
