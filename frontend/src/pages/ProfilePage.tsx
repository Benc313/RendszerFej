import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api';
import { Paper, Title, TextInput, PasswordInput, Button, Group, Alert, Text, Loader, Table, Tabs, Box, List } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUserCircle, IconTicket, IconTrash, IconCircleCheck } from '@tabler/icons-react';

// --- Interfaces ---
interface UpdateUserForm {
    email: string;
    phone: string;
    password?: string;
    confirmPassword?: string;
}

interface UpdateProfilePayload {
    email: string;
    phone: string;
    password?: string;
}

interface NestedScreeningData {
    id: number;
    screeningDate: string;
    movieName: string;
    roomName: string;
}

interface TicketData {
    id: number;
    seatNumber: number;
    price: number;
    status: string;
    screeningId: number;
    screening?: NestedScreeningData; // Feltételezzük, hogy a backend ezt beágyazza
}

interface OrderData {
    id: number;
    phone?: string | null;
    email?: string | null;
    userId?: number | null;
    totalPrice: number;
    tickets: TicketData[];
}

// Új: ScreeningDetails típus a /api/screening/{id} válaszhoz
interface ScreeningDetails {
    id: number;
    screeningDate: string;
    movieName: string;
    roomName: string;
}
// --- End Interfaces ---

function ProfilePage() {
    const { user, checkAuthStatus } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('details');

    // --- User Details State & Form ---
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);

    const detailsForm = useForm<UpdateUserForm>({
        initialValues: {
            email: user?.email || '',
            phone: user?.phone || '',
            password: '',
            confirmPassword: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email format'),
            phone: (value) => (value && value.trim().length >= 6 ? null : 'Phone number seems too short'),
            password: (value) => {
                if (value && value.length < 6) {
                    return 'Password must be at least 6 characters long';
                }
                return null;
            },
            confirmPassword: (value, values) => {
                if (values.password && value !== values.password) {
                    return 'Passwords do not match';
                }
                return null;
            },
        },
    });

    // Effekt a felhasználói adatok frissítésére, ha a user objektum változik
    useEffect(() => {
        if (user) {
            detailsForm.setValues({
                email: user.email || '',
                phone: user.phone || '',
                password: '',
                confirmPassword: '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // detailsForm eltávolítva

    // --- Orders State ---
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
    // --- End Orders State ---

    // Új: screening adatok cache
    const [screeningDetailsById, setScreeningDetailsById] = useState<Record<number, ScreeningDetails>>({});
    const [screeningLoading, setScreeningLoading] = useState(false);

    // --- Helper Functions ---
    const formatScreeningDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A'; // Ha nincs dátum, 'N/A'-t adunk vissza
        try {
            return new Date(dateString).toLocaleString('hu-HU', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    };
    // --- End Helper Functions ---

    // --- Handlers ---
    const handleUpdateProfile = async (values: UpdateUserForm) => {
        if (!user) return;
        setDetailsLoading(true);
        setDetailsError(null);
        setDetailsSuccess(null);

        const updateData: UpdateProfilePayload = {
            email: values.email,
            phone: values.phone,
        };

        if (values.password) {
            if (values.password.length < 6) {
                setDetailsError("Password must be at least 6 characters long.");
                setDetailsLoading(false);
                return;
            }
            if (values.password === values.confirmPassword) {
                updateData.password = values.password;
            } else {
                 setDetailsError("Passwords do not match.");
                 setDetailsLoading(false);
                 return;
            }
        }

        try {
            await apiCall<void>(`/api/user/user/${user.id}`, {
                method: 'PUT',
                data: updateData,
            });
            setDetailsSuccess('Profile updated successfully!');
            await checkAuthStatus(); // Refresh user data in context

        } catch (err) {
            setDetailsError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setDetailsLoading(false);
            detailsForm.setFieldValue('password', '');
            detailsForm.setFieldValue('confirmPassword', '');
        }
    };

    // --- Új: Screening adatok lekérése ---
    const fetchScreeningDetails = useCallback(async (screeningIds: number[]) => {
        const uniqueIds = Array.from(new Set(screeningIds));
        const details: Record<number, ScreeningDetails> = {};
        setScreeningLoading(true);
        await Promise.all(uniqueIds.map(async (id) => {
            try {
                const data = await apiCall<ScreeningDetails>(`/api/screening/${id}`);
                details[id] = data;
            } catch {
                // Ha hiba van, ne álljon le az összes
            }
        }));
        setScreeningDetailsById(details);
        setScreeningLoading(false);
    }, []);

    // --- Orders lekérdezése + screening adatok lekérése ---
    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setOrdersLoading(true);
        setOrdersError(null);
        setCancelError(null);
        setCancelSuccess(null);
        try {
            const userOrders = await apiCall<OrderData[]>("/api/user/my-orders");
            setOrders(userOrders);
            // ScreeningId-k kigyűjtése
            const allScreeningIds = userOrders.flatMap(order => order.tickets.map(t => t.screeningId));
            if (allScreeningIds.length > 0) {
                await fetchScreeningDetails(allScreeningIds);
            } else {
                setScreeningDetailsById({});
            }
        } catch (err) {
            setOrdersError(err instanceof Error ? err.message : "Failed to fetch orders.");
        } finally {
            setOrdersLoading(false);
        }
    }, [user, fetchScreeningDetails]);

     const handleCancelOrder = async (orderId: number) => {
        if (!window.confirm(`Are you sure you want to cancel order ID: ${orderId}? This cannot be undone.`)) {
            return;
        }
        setCancelError(null);
        setCancelSuccess(null);
        try {
            await apiCall<void>(`/api/order/${orderId}`, { method: 'DELETE' }); // Javított endpoint
            setCancelSuccess(`Order ${orderId} cancelled successfully.`);
            await fetchOrders(); // Refresh list after cancellation
        } catch (err) {
             const errorMsg = err instanceof Error ? err.message : `Failed to cancel order ${orderId}.`;
             if (errorMsg.includes("Cannot cancel order within 4 hours of screening")) {
                 setCancelError("Cannot cancel order: The screening is less than 4 hours away.");
             } else {
                 setCancelError(errorMsg);
             }
        }
    };

    // --- Effects ---
    useEffect(() => {
        if (activeTab === 'orders' && user) {
            fetchOrders();
        }
        // Clear messages on tab change
        setDetailsError(null);
        setDetailsSuccess(null);
        setOrdersError(null);
        setCancelError(null);
        setCancelSuccess(null);
    }, [activeTab, user, fetchOrders]); // fetchOrders added

    // --- Loading/Initial State ---
    if (!user) {
        return <Alert color="orange">Kérjük, jelentkezz be a profilod megtekintéséhez.</Alert>;
    }

    // --- Table Rows ---
    const orderRows = orders.map((order) => (
        <Table.Tr key={order.id}>
            <Table.Td>{order.id}</Table.Td>
            <Table.Td>{order.totalPrice} Ft</Table.Td>
            <Table.Td>
                {order.tickets && order.tickets.length > 0 ? (
                    <List size="sm" spacing="xs">
                        {order.tickets.map(ticket => {
                            const screening = screeningDetailsById[ticket.screeningId];
                            return (
                                <List.Item key={ticket.id}>
                                    <Text fw={500}>Seat: {ticket.seatNumber}</Text>
                                    {screening ? (
                                        <>
                                            <Text size="sm">Movie: {screening.movieName}</Text>
                                            <Text size="sm">Room: {screening.roomName}</Text>
                                            <Text size="sm">Date: {formatScreeningDate(screening.screeningDate)}</Text>
                                        </>
                                    ) : (
                                        <Text size="sm" c="dimmed">Screening details unavailable</Text>
                                    )}
                                    <Text size="sm">Status: {ticket.status}</Text>
                                </List.Item>
                            );
                        })}
                    </List>
                ) : (
                    <Text size="sm" c="dimmed">No tickets found for this order.</Text>
                )}
            </Table.Td>
            <Table.Td>
                {order.tickets?.some(t => t.status === 'Purchased') && (
                    <Button
                        size="xs"
                        color="red"
                        onClick={() => handleCancelOrder(order.id)}
                        loading={ordersLoading && activeTab === 'orders'}
                        leftSection={<IconTrash size={14} />}
                    >
                        Cancel Order
                    </Button>
                )}
            </Table.Td>
        </Table.Tr>
    ));
    // --- End Table Rows ---

    return (
        <Paper shadow="xs" p="md">
            <Title order={2} mb="lg">Profilom</Title>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow>
                    <Tabs.Tab value="details" leftSection={<IconUserCircle size={14} />}>Adatok módosítása</Tabs.Tab>
                    <Tabs.Tab value="orders" leftSection={<IconTicket size={14} />}>Saját jegyeim</Tabs.Tab>
                </Tabs.List>

                {/* User Details Panel */}
                <Tabs.Panel value="details" pt="lg">
                    <Title order={4} mb="md">Személyes adatok frissítése</Title>
                    {user.name && <Text mb="xs">Név: {user.name}</Text>}
                    <Text mb="md">Szerepkör: {user.role}</Text>
                    {detailsError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a frissítéskor" color="red" mb="md" withCloseButton onClose={() => setDetailsError(null)}>{detailsError}</Alert>}
                    {detailsSuccess && <Alert icon={<IconCircleCheck size="1rem" />} title="Sikeres frissítés" color="green" mb="md" withCloseButton onClose={() => setDetailsSuccess(null)}>{detailsSuccess}</Alert>}

                    <Box component="form" onSubmit={detailsForm.onSubmit(handleUpdateProfile)} maw={400}>
                        <TextInput
                            label="Email cím"
                            placeholder="email@pelda.hu"
                            required
                            {...detailsForm.getInputProps('email')}
                            mb="sm"
                        />
                        <TextInput
                            label="Telefonszám"
                            placeholder="+36..."
                            required
                            {...detailsForm.getInputProps('phone')}
                            mb="sm"
                        />
                        <PasswordInput
                            label="Új jelszó (nem kötelező)"
                            placeholder="Hagyja üresen, ha nem változtatja"
                            {...detailsForm.getInputProps('password')}
                            mb="sm"
                        />
                        <PasswordInput
                            label="Új jelszó megerősítése"
                            placeholder="Új jelszó újra"
                            {...detailsForm.getInputProps('confirmPassword')}
                            mb="lg"
                        />
                        <Group justify="flex-end">
                            <Button type="submit" loading={detailsLoading}>Mentés</Button>
                        </Group>
                    </Box>
                </Tabs.Panel>

                {/* My Orders Panel */}
                <Tabs.Panel value="orders" pt="lg">
                    <Title order={3} mt="xl" mb="md">Saját jegyeim</Title>
                    {screeningLoading && <Loader my="md" />}
                    {cancelError && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a lemondáskor" color="red" mb="md" withCloseButton onClose={() => setCancelError(null)}>{cancelError}</Alert>}
                    {cancelSuccess && <Alert icon={<IconCircleCheck size="1rem" />} title="Sikeres lemondás" color="green" mb="md" withCloseButton onClose={() => setCancelSuccess(null)}>{cancelSuccess}</Alert>}

                    {ordersLoading && <Loader my="lg" />}
                    {ordersError && !ordersLoading && (
                         <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a rendelések betöltésekor" color="red" mb="md">
                            {ordersError}
                         </Alert>
                    )}
                    {!ordersLoading && !ordersError && orders.length === 0 && (
                        <Text>Még nem vásároltál jegyet.</Text>
                    )}
                    {!ordersLoading && !ordersError && orders.length > 0 && (
                         <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Rendelés azonosító</Table.Th>
                                    <Table.Th>Teljes ár</Table.Th>
                                    <Table.Th>Jegyek</Table.Th>
                                    <Table.Th>Műveletek</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{orderRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Paper>
    );
}

export default ProfilePage;

