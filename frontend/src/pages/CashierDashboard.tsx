// Filepath: c:\Users\Ati\source\repos\RendszerFej\frontend\src\pages\CashierDashboard.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// Select, Radio, Stack hozzáadva az importokhoz
import { Table, Button, Title, Paper, Alert, Loader, Group, Modal, TextInput, Tabs, NumberInput, Box, List, Select, Radio, Stack } from '@mantine/core';
import { IconAlertCircle, IconTicket, IconListDetails, IconShoppingCartPlus, IconCheck } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

// --- Rendelés Interfész (OrderResponse alapján) ---
interface OrderData {
    id: number;
    phone?: string | null; // Telefonszám (opcionális)
    email?: string | null; // Email cím (opcionális)
    userId?: number | null; // Felhasználó ID (opcionális, ha regisztrált)
    totalPrice: number; // Teljes ár
    tickets: TicketData[]; // Jegyek listája
}

// --- Jegy Interfész (TicketResponse alapján) ---
interface TicketData {
    id: number;
    seatNumber: number; // Ülésszám
    price: number; // Jegyár
    status: string; // Jegy státusza (pl. "VALIDATED", "ACTIVE")
    screeningId: number; // Vetítés ID
}

// --- Jegyérvényesítő Űrlap Interfész ---
interface ValidateTicketForm {
    ticketId: number | ''; // Jegy ID (lehet üres string a NumberInput miatt)
}

// --- Vetítés Interfész (ScreeningResponse alapján, egyszerűsítve a dropdownhoz) ---
interface ScreeningOption {
    id: number;
    movieTitle: string;
    roomName: string;
    screeningDate: string; // ISO string
    price: number;
}

// --- Vásárlási Űrlap Interfész ---
interface PurchaseFormValues {
    screeningId: string | null; // Vetítés ID (Select stringet ad vissza)
    seatNumber: number | ''; // Ülésszám
    purchaseType: 'guest' | 'user'; // Vásárló típusa
    userId: number | ''; // Felhasználó ID (ha purchaseType === 'user')
    email: string; // Email (ha purchaseType === 'guest')
    phone: string; // Telefon (ha purchaseType === 'guest')
}

function CashierDashboard() {
    const { user } = useAuth(); // Bejelentkezett felhasználó adatai
    const [activeTab, setActiveTab] = useState<string | null>('validate'); // Aktív fül állapota

    // --- Jegyérvényesítés Állapotai ---
    const [validationLoading, setValidationLoading] = useState(false); // Érvényesítés folyamatban
    const [validationError, setValidationError] = useState<string | null>(null); // Hiba az érvényesítés során
    // const [validationSuccess, setValidationSuccess] = useState<string | null>(null); // Sikeres üzenet helyett notification használata

    // --- Rendelések Állapotai ---
    const [orders, setOrders] = useState<OrderData[]>([]); // Rendelések listája
    const [ordersLoading, setOrdersLoading] = useState(false); // Rendelések betöltése folyamatban
    const [ordersError, setOrdersError] = useState<string | null>(null); // Hiba a rendelések betöltésekor

    // --- Vetítések Állapotai (Vásárláshoz) ---
    const [screenings, setScreenings] = useState<ScreeningOption[]>([]); // Elérhető vetítések listája
    const [screeningsLoading, setScreeningsLoading] = useState(false); // Vetítések betöltése folyamatban
    const [screeningsError, setScreeningsError] = useState<string | null>(null); // Hiba a vetítések betöltésekor

    // --- Vásárlás Állapotai ---
    const [purchaseLoading, setPurchaseLoading] = useState(false); // Vásárlás folyamatban
    const [purchaseError, setPurchaseError] = useState<string | null>(null); // Hiba a vásárlás során

    // --- Űrlapok Kezelése (useForm Hook) ---
    // Jegyérvényesítő űrlap
    const validationForm = useForm<ValidateTicketForm>({
        initialValues: { ticketId: '' },
        validate: {
            ticketId: (value) => (value !== '' && value > 0 ? null : 'Érvényes Jegy ID megadása kötelező'),
        },
    });

    // Vásárlási űrlap
    const purchaseForm = useForm<PurchaseFormValues>({
        initialValues: {
            screeningId: null,
            seatNumber: '',
            purchaseType: 'guest', // Alapértelmezett a vendég vásárlás
            userId: '',
            email: '',
            phone: '',
        },
        validate: (values) => ({
            screeningId: values.screeningId ? null : 'Vetítés kiválasztása kötelező',
            seatNumber: values.seatNumber !== '' && values.seatNumber > 0 ? null : 'Érvényes ülésszám megadása kötelező',
            // Feltételes validáció
            userId: values.purchaseType === 'user' && (values.userId === '' || values.userId <= 0) ? 'Érvényes Felhasználó ID megadása kötelező' : null,
            email: values.purchaseType === 'guest' && !/^\S+@\S+$/.test(values.email) ? 'Érvénytelen email cím' : null,
            phone: values.purchaseType === 'guest' && values.phone.trim().length < 6 ? 'Telefonszám megadása kötelező (min. 6 karakter)' : null,
        }),
    });

    // --- Adatlekérdezések ---
    // Rendelések lekérdezése
    const fetchOrders = useCallback(async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
            // GET kérés a /orders végpontra
            const data = await apiCall<OrderData[]>('/orders');
            setOrders(data);
        } catch (err) {
            setOrdersError(err instanceof Error ? err.message : "Rendelések lekérdezése sikertelen.");
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    // Vetítések lekérdezése (Vásárláshoz)
    const fetchScreenings = useCallback(async () => {
        setScreeningsLoading(true);
        setScreeningsError(null);
        try {
            // Backend válasz (BackendScreeningResponse) lekérdezése
            // Figyelem: A BackendScreeningResponse struktúrát használjuk itt is, mint az AdminDashboardban
            interface BackendScreeningResponse {
                id: number;
                screeningDate: string;
                price: number;
                movie?: { id: number; title: string; description: string; duration: number; }; // Movie lehet opcionális
                terem?: { id: number; roomName: string; seats: number; }; // Terem lehet opcionális
            }
            const data = await apiCall<BackendScreeningResponse[]>('/screenings');
            // Átalakítás a frontend Select komponenshez és állapothoz (ScreeningOption)
            // Szűrés és biztonságos hozzáférés
            const options: ScreeningOption[] = data
                .filter(s => s.movie && s.terem) // Csak azokat tartjuk meg, ahol van film és terem adat
                .map(s => ({
                    id: s.id,
                    movieTitle: s.movie!.title, // Biztosak lehetünk benne, hogy létezik a filter miatt
                    roomName: s.terem!.roomName, // Biztosak lehetünk benne, hogy létezik a filter miatt
                    screeningDate: s.screeningDate,
                    price: s.price,
                }));
            setScreenings(options);
        } catch (err) {
            setScreeningsError(err instanceof Error ? err.message : "Vetítések lekérdezése sikertelen.");
        } finally {
            setScreeningsLoading(false);
        }
    }, []);

    // --- Eseménykezelők ---
    // Jegy érvényesítése
    const handleValidateTicket = async (values: ValidateTicketForm) => {
        setValidationLoading(true);
        setValidationError(null);
        // setValidationSuccess(null); // Felesleges, notificationt használunk
        try {
            // GET kérés a /tickets/validate/{id} végpontra
            const response = await apiCall<{ message: string }>(`/tickets/validate/${values.ticketId}`, {
                method: 'GET',
            });
            notifications.show({ // Sikeres érvényesítés értesítés
                title: 'Jegy érvényesítve',
                message: response.message || `A(z) ${values.ticketId} ID-jű jegy sikeresen érvényesítve.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            validationForm.reset(); // Űrlap ürítése
            // Opcionálisan frissítjük a rendelések listáját, ha az "orders" fül aktív
            if (activeTab === 'orders') await fetchOrders();
        } catch (err) {
            setValidationError(err instanceof Error ? err.message : `A(z) ${values.ticketId} ID-jű jegy érvényesítése sikertelen.`);
        } finally {
            setValidationLoading(false);
        }
    };

    // Jegyvásárlás kezelése
    const handlePurchase = async (values: PurchaseFormValues) => {
        setPurchaseLoading(true);
        setPurchaseError(null);

        // Backend kérés összeállítása (OrderRequest alapján)
        const orderRequest = {
            // Vagy userId, vagy email/phone
            ...(values.purchaseType === 'user' ? { userId: Number(values.userId) } : { email: values.email, phone: values.phone }),
            // Jegyek listája (egyelőre csak egy jeggyel)
            tickets: [
                {
                    screeningId: Number(values.screeningId), // String -> Number
                    seatNumber: Number(values.seatNumber),   // String/Number -> Number
                },
            ],
        };

        try {
            // POST kérés a /orders végpontra
            const response = await apiCall<OrderData>('/orders', {
                method: 'POST',
                data: orderRequest,
            });
            notifications.show({ // Sikeres vásárlás értesítés
                title: 'Sikeres Jegyvásárlás',
                message: `Rendelés ID: ${response.id}. A jegy(ek) sikeresen létrehozva. Teljes ár: ${response.totalPrice} Ft.`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            purchaseForm.reset(); // Űrlap ürítése
            // Opcionálisan frissítjük a rendelések listáját, ha az "orders" fül aktív
            if (activeTab === 'orders') await fetchOrders();
        } catch (err) {
            setPurchaseError(err instanceof Error ? err.message : "Jegyvásárlás sikertelen.");
        } finally {
            setPurchaseLoading(false);
        }
    };

    // --- Effektek (useEffect Hook) ---
    // Adatok lekérdezése és állapotok visszaállítása fülváltáskor
    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders(); // Rendelések lekérdezése
        } else if (activeTab === 'purchase') {
            fetchScreenings(); // Vetítések lekérdezése a vásárláshoz
        }
        // Hibaüzenetek törlése fülváltáskor
        setValidationError(null);
        setOrdersError(null);
        setPurchaseError(null); // Vásárlási hiba törlése is
        setScreeningsError(null); // Vetítés hiba törlése is
    }, [activeTab, fetchOrders, fetchScreenings]); // Függőségek: aktív fül és a lekérdező függvények


    // --- Szerepkör Ellenőrzés ---
    // Csak Admin vagy Pénztáros láthatja az oldalt
    if (user?.role !== 'Admin' && user?.role !== 'Cashier') {
        return <Alert icon={<IconAlertCircle size="1rem" />} title="Hozzáférés megtagadva" color="orange">Nincs jogosultságod az oldal megtekintéséhez.</Alert>;
    }

    // --- Táblázat Sorok Generálása ---
    // Rendelések táblázat sorai
    const orderRows = orders.map((order) => (
        // Biztosítjuk, hogy ne legyen felesleges whitespace a Table.Tr körül
        <Table.Tr key={order.id}>
            <Table.Td>{order.id}</Table.Td>
            <Table.Td>{order.userId ?? 'Vendég'}</Table.Td>
            <Table.Td>{order.email ?? '-'}</Table.Td>
            <Table.Td>{order.phone ?? '-'}</Table.Td>
            <Table.Td>{order.totalPrice} Ft</Table.Td>
            <Table.Td>
                {order.tickets.length > 0 ? (
                    <List size="sm" spacing="xs">
                        {order.tickets.map(t => (
                            <List.Item key={t.id}>
                                ID: {t.id}, Ülés: {t.seatNumber}, Vetítés ID: {t.screeningId}, Státusz: {t.status}
                            </List.Item>
                        ))}
                    </List>
                ) : (
                    'Nincsenek jegyek'
                )}
            </Table.Td>
        </Table.Tr>
    ));

    // --- Dropdown Adatok Előkészítése (Vásárláshoz) ---
    const screeningOptionsForSelect = screenings.map(s => ({
        value: s.id.toString(),
        // Biztonságos hozzáférés itt is, bár a fetchScreenings már szűrt
        label: `${s.movieTitle || 'Ismeretlen film'} - ${s.roomName || 'Ismeretlen terem'} (${new Date(s.screeningDate).toLocaleString('hu-HU')}) - ${s.price} Ft`,
    }));

    return (
        <Paper shadow="xs" p="md">
            <Title order={2} mb="lg">Pénztáros Kezelőfelület</Title>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow> {/* Fülek kitöltik a helyet */}
                    <Tabs.Tab value="validate" leftSection={<IconTicket size={14} />}>Jegy Érvényesítés</Tabs.Tab>
                    <Tabs.Tab value="orders" leftSection={<IconListDetails size={14} />}>Rendelések Megtekintése</Tabs.Tab>
                    {/* Vásárlás fül aktiválása */}
                    <Tabs.Tab value="purchase" leftSection={<IconShoppingCartPlus size={14} />}>Vásárlás Másnak</Tabs.Tab>
                </Tabs.List>

                {/* Jegyérvényesítési Panel */}
                <Tabs.Panel value="validate" pt="lg">
                    <Title order={4} mb="md">Jegy Érvényesítése ID Alapján</Title>
                    {/* Hibaüzenet érvényesítéskor */}
                    {validationError && <Alert icon={<IconAlertCircle size="1rem" />} title="Érvényesítési Hiba" color="red" mb="md" withCloseButton onClose={() => setValidationError(null)}>{validationError}</Alert>}
                    {/* Sikeres üzenet helyett notification jelenik meg */}
                    {/* {validationSuccess && <Alert icon={<IconCheck size="1rem" />} title="Sikeres Érvényesítés" color="green" mb="md" withCloseButton onClose={() => setValidationSuccess(null)}>{validationSuccess}</Alert>} */}
                    {/* Érvényesítő űrlap */}
                    <Box component="form" onSubmit={validationForm.onSubmit(handleValidateTicket)} maw={400}>
                        <NumberInput
                            label="Jegy ID"
                            placeholder="Adja meg a jegy ID-ját"
                            required
                            min={1}
                            allowDecimal={false}
                            {...validationForm.getInputProps('ticketId')}
                            mb="md"
                        />
                        <Button type="submit" loading={validationLoading}>Jegy Érvényesítése</Button>
                    </Box>
                </Tabs.Panel>

                {/* Rendelések Megtekintése Panel */}
                <Tabs.Panel value="orders" pt="lg">
                    <Title order={4} mb="md">Összes Rendelés</Title>
                    {/* Betöltésjelző */}
                    {ordersLoading && <Loader my="lg" />}
                    {/* Hibaüzenet betöltéskor */}
                    {ordersError && !ordersLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a rendelések betöltésekor" color="red">{ordersError}</Alert>}
                    {/* Rendelések táblázata */}
                    {!ordersLoading && !ordersError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Rendelés ID</Table.Th>
                                    <Table.Th>Felhasználó ID / Vendég</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Telefon</Table.Th>
                                    <Table.Th>Teljes Ár</Table.Th>
                                    <Table.Th>Jegyek</Table.Th>
                                    {/* <Table.Th>Műveletek</Table.Th> */}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{orderRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Vásárlás Másnak Panel */}
                <Tabs.Panel value="purchase" pt="lg">
                    <Title order={4} mb="md">Jegyvásárlás Felhasználónak/Vendégnek</Title>
                    {/* Hibaüzenet vásárláskor */}
                    {purchaseError && <Alert icon={<IconAlertCircle size="1rem" />} title="Vásárlási Hiba" color="red" mb="md" withCloseButton onClose={() => setPurchaseError(null)}>{purchaseError}</Alert>}
                    {/* Hibaüzenet vetítések betöltésekor */}
                    {screeningsError && !screeningsLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a vetítések betöltésekor" color="red" mb="md">{screeningsError}</Alert>}
                    {/* Betöltésjelző vetítésekhez */}
                    {screeningsLoading && <Loader my="lg" />}

                    {/* Vásárlási űrlap (csak ha nincs hiba és betöltés) */}
                    {!screeningsLoading && !screeningsError && (
                        <Box component="form" onSubmit={purchaseForm.onSubmit(handlePurchase)} maw={500}>
                            <Stack>
                                {/* Vetítés kiválasztása */}
                                <Select
                                    label="Vetítés"
                                    placeholder="Válassz vetítést"
                                    data={screeningOptionsForSelect} // Előkészített vetítés opciók
                                    searchable
                                    required
                                    {...purchaseForm.getInputProps('screeningId')}
                                />

                                {/* Ülésszám megadása */}
                                <NumberInput
                                    label="Ülésszám"
                                    placeholder="Add meg az ülésszámot"
                                    required
                                    min={1}
                                    allowDecimal={false}
                                    {...purchaseForm.getInputProps('seatNumber')}
                                />

                                {/* Vásárló típusának kiválasztása */}
                                <Radio.Group
                                    name="purchaseType"
                                    label="Vásárló típusa"
                                    required
                                    {...purchaseForm.getInputProps('purchaseType')}
                                >
                                    <Group mt="xs">
                                        <Radio value="guest" label="Vendég" />
                                        <Radio value="user" label="Regisztrált felhasználó" />
                                    </Group>
                                </Radio.Group>

                                {/* Feltételes mezők a vásárló típusától függően */}
                                {purchaseForm.values.purchaseType === 'user' ? (
                                    <NumberInput
                                        label="Felhasználó ID"
                                        placeholder="Add meg a felhasználó ID-ját"
                                        required
                                        min={1}
                                        allowDecimal={false}
                                        {...purchaseForm.getInputProps('userId')}
                                    />
                                ) : (
                                    <>
                                        <TextInput
                                            label="Email cím"
                                            placeholder="vendeg@email.com"
                                            required
                                            type="email"
                                            {...purchaseForm.getInputProps('email')}
                                        />
                                        <TextInput
                                            label="Telefonszám"
                                            placeholder="+36 30 123 4567"
                                            required
                                            {...purchaseForm.getInputProps('phone')}
                                        />
                                    </>
                                )}

                                <Button type="submit" loading={purchaseLoading} mt="md">Vásárlás Indítása</Button>
                            </Stack>
                        </Box>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Paper>
    );
}

export default CashierDashboard;
