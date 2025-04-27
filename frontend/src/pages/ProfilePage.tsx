import { useState, useEffect, useCallback } from 'react'; // React importálása
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api';
import { Paper, Title, TextInput, PasswordInput, Button, Group, Alert, Text, Loader, Table, Tabs, Box } from '@mantine/core'; // Table, Tabs, Box importálása
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUserCircle, IconTicket, IconTrash, IconCircleCheck } from '@tabler/icons-react'; // Új ikonok importálása, IconCircleCheck hozzáadva

// --- Interfaces based on Backend DTOs ---
// Interface a backend UserRequest alapján (kiegészítve a jelszó megerősítéssel)
interface UpdateUserForm {
    // name: string; // A backend UserRequest nem várja a nevet, de a controller kezeli. Maradhat a formban.
    email: string;
    phone: string; // Backend UserRequest 'Phone'-ként várja, de a Users modell 'Phone'-ként tárolja. Frontend 'phone'-ként kezeli.
    password?: string;
    confirmPassword?: string;
}

// Interface a profilfrissítéshez küldendő adatokhoz
interface UpdateProfilePayload {
    email: string;
    phone: string;
    password?: string; // Csak akkor küldjük, ha van új jelszó
}

// Interface a backend OrderResponse alapján
interface OrderData {
    id: number;
    phone?: string | null;
    email?: string | null;
    userId?: number | null;
    totalPrice: number;
    tickets: TicketData[];
    // Add screening details if needed/available from backend
    // Ezeket a backendnek kellene szolgáltatnia a /orders/my végponton
    screeningDate?: string; // Example: Add if backend provides this
    movieTitle?: string;    // Example: Add if backend provides this
}

// Interface a backend TicketResponse alapján
interface TicketData {
    id: number;
    seatNumber: number;
    price: number;
    status: string; // e.g., "Purchased", "Validated", "Cancelled"
    screeningId: number;
    // Add screening details if needed/available from backend
    screeningDate?: string; // Example: Add if backend provides this
    movieTitle?: string;    // Example: Add if backend provides this
}
// --- End Interfaces ---


function ProfilePage() {
    const { user, checkAuthStatus } = useAuth(); // setUserState eltávolítva
    const [activeTab, setActiveTab] = useState<string | null>('details'); // Tab state

    // --- User Details State & Form ---
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
    // const [loading, setLoading] = useState(false); // Ezt átnevezzük detailsLoading-ra
    // const [error, setError] = useState<string | null>(null); // Ezt átnevezzük detailsError-ra
    // const [success, setSuccess] = useState<string | null>(null); // Ezt átnevezzük detailsSuccess-re

    const detailsForm = useForm<UpdateUserForm>({ // Átnevezés form -> detailsForm
        initialValues: {
            // name: user?.name || '', // Name maradjon, hátha a backend kezeli
            email: user?.email || '',
            phone: user?.phone || '',
            password: '',
            confirmPassword: '',
        },
        validate: {
            email: (value) => (/^\\S+@\\S+$/.test(value) ? null : 'Invalid email'),
            phone: (value) => (value && value.trim().length >= 6 ? null : 'Phone number seems too short'), // Ellenőrizzük, hogy van-e érték
            password: (value) => { // values paraméter eltávolítva
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
            detailsForm.setValues({ // form -> detailsForm
                // name: user.name,
                email: user.email,
                phone: user.phone,
                password: '',
                confirmPassword: '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // --- Orders State ---
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null); // Külön hiba a törléshez
    const [cancelSuccess, setCancelSuccess] = useState<string | null>(null); // Külön siker a törléshez
    // --- End Orders State ---

    // --- Handlers ---
    const handleUpdateProfile = async (values: UpdateUserForm) => {
        // if (!user) return; // Ezt a külső if user ellenőrzés kezeli
        setDetailsLoading(true);
        setDetailsError(null);
        setDetailsSuccess(null);

        // Pontosabb típus használata
        const updateData: UpdateProfilePayload = {
            email: values.email,
            phone: values.phone,
        };

        if (values.password && values.password === values.confirmPassword) {
            updateData.password = values.password; // Nagybetűs 'P'
        } else if (values.password && values.password !== values.confirmPassword) {
             setDetailsError("Passwords do not match.");
             setDetailsLoading(false);
             return;
        }

        try {
            // Végpont módosítása: /api/user/user/{id} -> /api/user/update (feltételezve, hogy ez a biztonságos, authentikált végpont)
            await apiCall<void>('/api/user/update', { // Végpont módosítva
                method: 'PUT',
                data: updateData,
            });
            setDetailsSuccess('Profile updated successfully!');
            await checkAuthStatus(); // Újra lekérdezi a /me végpontot

        } catch (err) {
            setDetailsError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setDetailsLoading(false);
            detailsForm.setFieldValue('password', ''); // form -> detailsForm
            detailsForm.setFieldValue('confirmPassword', ''); // form -> detailsForm
        }
    };

    // Rendelések lekérdezése
    const fetchOrders = useCallback(async () => {
        // if (!user) return; // Ezt a külső if user ellenőrzés kezeli
        setOrdersLoading(true);
        setOrdersError(null);
        setCancelError(null); // Törlési üzenetek törlése
        setCancelSuccess(null);
        try {
            // Végpont módosítása: /api/user/my-orders -> /orders/my (feltételezve, hogy ez a helyes végpont)
            const userOrders = await apiCall<OrderData[]>('/orders/my');
            // Itt lehetne a backend válaszát átalakítani, ha szükséges
            // Pl. hozzáadni a vetítés dátumát/film címét a jegyekhez, ha a backend nem adja meg közvetlenül
            setOrders(userOrders);
        } catch (err) {
            setOrdersError(err instanceof Error ? err.message : "Failed to fetch orders.");
        } finally {
            setOrdersLoading(false);
        }
    }, []); // user függőség kivéve, mert a külső if user kezeli

    // Rendelés törlése
     const handleCancelOrder = async (orderId: number) => {
        if (!window.confirm(`Are you sure you want to cancel order ID: ${orderId}? This cannot be undone.`)) {
            return;
        }
        // setOrdersLoading(true); // Nem kell az egész listát loading state-be tenni törléskor
        setCancelError(null);
        setCancelSuccess(null);
        try {
            await apiCall<void>(`/orders/${orderId}`, { method: 'DELETE' });
            setCancelSuccess(`Order ${orderId} cancelled successfully.`);
            // Sikeres törlés után frissítsük a rendelések listáját a backendről
            await fetchOrders(); // Újra lekérdezés
            // setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId)); // Helyi szűrés helyett újratöltés
        } catch (err) {
             const errorMsg = err instanceof Error ? err.message : `Failed to cancel order ${orderId}.`;
             // Pontosabb hibaüzenet a 4 órás szabályra
             if (errorMsg.includes("Cannot cancel order within 4 hours of screening")) {
                 setCancelError("Cannot cancel order: The screening is less than 4 hours away.");
             } else {
                 setCancelError(errorMsg);
             }
             // setOrdersError(errorMsg); // Külön state a törlési hibához: setCancelError
        } finally {
             // setOrdersLoading(false);
        }
    };

    // --- Effects ---
    // Effekt a tab váltás figyelésére és adatok betöltésére
    useEffect(() => {
        if (activeTab === 'orders' && user) { // Csak akkor töltsön, ha be van jelentkezve
            fetchOrders();
        }
        // Üzenetek törlése tab váltáskor
        setDetailsError(null);
        setDetailsSuccess(null);
        setOrdersError(null);
        setCancelError(null);
        setCancelSuccess(null);
    }, [activeTab, user, fetchOrders]); // user és fetchOrders hozzáadva a függőségekhez

    // --- Helper Functions ---
    // Dátum formázása olvashatóbbra
    const formatScreeningDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('hu-HU', {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (_) { // Használatlan változó átnevezése
            return 'Invalid Date';
        }
    };
    // --- End Helper Functions ---


    if (!user) {
        return <Alert color="orange">Please log in to view your profile.</Alert>; // Záró tag hozzáadva
    }

    // --- Table Rows ---
    const orderRows = orders.map((order) => (
        <Table.Tr key={order.id}>
            <Table.Td>{order.id}</Table.Td>
            <Table.Td>{order.totalPrice} Ft</Table.Td>
            <Table.Td>
                {order.tickets && order.tickets.length > 0 ? (
                    <ul>
                        {order.tickets.map(ticket => (
                            <li key={ticket.id}>
                                {/* Itt használjuk a formatScreeningDate-et */}
                                Seat: {ticket.seatNumber} (Screening: {ticket.screeningId} on {formatScreeningDate(ticket.screening?.screeningDate)}) - Status: {ticket.status}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Text size="sm" c="dimmed">No tickets found for this order.</Text>
                )}
            </Table.Td>
            <Table.Td>
                {/* Törlés gomb csak akkor, ha van törölhető jegy (pl. status alapján) */}
                {order.tickets?.some(t => t.status === 'Purchased') && (
                    <Button
                        size="xs"
                        color="red"
                        onClick={() => handleCancelOrder(order.id)}
                        loading={ordersLoading} // Loading state a törléshez
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
            <Title order={2} mb="lg">My Profile</Title>

            {/* Tabs hozzáadása */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow>
                    <Tabs.Tab value="details" leftSection={<IconUserCircle size={14} />}>My Details</Tabs.Tab>
                    <Tabs.Tab value="orders" leftSection={<IconTicket size={14} />}>My Orders</Tabs.Tab>
                </Tabs.List>

                {/* User Details Panel */}
                <Tabs.Panel value="details" pt="lg">
                    <Title order={4} mb="md">Update Your Information</Title>
                    {/* Name megjelenítése, ha van */}
                    {user.name && <Text mb="md">Name: {user.name}</Text>}
                    <Text mb="md">Role: {user.role}</Text>
                    {detailsError && <Alert icon={<IconAlertCircle size="1rem" />} title="Update Error" color="red" mb="md" withCloseButton onClose={() => setDetailsError(null)}>{detailsError}</Alert>}
                    {detailsSuccess && <Alert icon={<IconCircleCheck size="1rem" />} title="Success" color="green" mb="md" withCloseButton onClose={() => setDetailsSuccess(null)}>{detailsSuccess}</Alert>}

                    {/* Form átnevezve detailsForm-ra */}
                    <Box component="form" onSubmit={detailsForm.onSubmit(handleUpdateProfile)} maw={400}>
                        {/* Name input eltávolítva, ha a backend nem várja a UserRequest-ben */}
                        {/* <TextInput
                            label="Name"
                            placeholder="Your name"
                            required
                            {...detailsForm.getInputProps('name')}
                            mb="sm"
                        /> */}
                        <TextInput
                            label="Email"
                            placeholder="your@email.com"
                            required
                            {...detailsForm.getInputProps('email')}
                            mb="sm"
                        />
                        <TextInput
                            label="Phone Number"
                            placeholder="+36..."
                            required
                            {...detailsForm.getInputProps('phone')} // 'phone' maradjon, ha a backend kezeli
                            mb="sm"
                        />
                        <PasswordInput
                            label="New Password (optional)"
                            placeholder="Leave blank to keep current password"
                            {...detailsForm.getInputProps('password')}
                            mb="sm"
                        />
                        <PasswordInput
                            label="Confirm New Password"
                            placeholder="Confirm new password"
                            {...detailsForm.getInputProps('confirmPassword')}
                            mb="lg"
                        />

                        {/* Error/Success Alert áthelyezve a form fölé */}

                        <Group justify="flex-end">
                            <Button type="submit" loading={detailsLoading}>Update Profile</Button>
                        </Group>
                    </Box>
                </Tabs.Panel>

                {/* My Orders Panel */}
                <Tabs.Panel value="orders" pt="lg">
                    <Title order={3} mt="xl" mb="md">My Orders</Title>
                    {/* Külön hiba/siker üzenetek a törléshez */}
                    {cancelError && <Alert icon={<IconAlertCircle size="1rem" />} title="Cancellation Error" color="red" mb="md" withCloseButton onClose={() => setCancelError(null)}>{cancelError}</Alert>}
                    {cancelSuccess && <Alert icon={<IconCircleCheck size="1rem" />} title="Cancellation Successful" color="green" mb="md" withCloseButton onClose={() => setCancelSuccess(null)}>{cancelSuccess}</Alert>}

                    {ordersLoading && <Loader my="lg" />}
                    {ordersError && !ordersLoading && (
                         <Alert icon={<IconAlertCircle size="1rem" />} title="Orders Error" color="red" mb="md">
                            {ordersError}
                         </Alert>
                    )}
                    {!ordersLoading && !ordersError && orders.length === 0 && (
                        <Text>You haven't purchased any tickets yet.</Text>
                    )}
                    {/* Táblázat használata a List helyett */}
                    {!ordersLoading && !ordersError && orders.length > 0 && (
                         <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Order ID</Table.Th>
                                    <Table.Th>Total Price</Table.Th>
                                    <Table.Th>Tickets</Table.Th>
                                    <Table.Th>Actions</Table.Th>
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

