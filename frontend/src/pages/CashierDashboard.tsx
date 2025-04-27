// Filepath: c:\Users\Ati\source\repos\RendszerFej\frontend\src\pages\CashierDashboard.tsx
import React, { useState, useCallback } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Table, Button, Title, Paper, Alert, Loader, Group, Modal, TextInput, Tabs, NumberInput, Box } from '@mantine/core';
import { IconAlertCircle, IconTicket, IconListDetails, IconShoppingCartPlus } from '@tabler/icons-react';
import { useForm } from '@mantine/form';

// --- Order Interface (based on OrderResponse) ---
interface OrderData {
    id: number;
    phone?: string | null;
    email?: string | null;
    userId?: number | null;
    totalPrice: number;
    tickets: TicketData[];
}

// --- Ticket Interface (based on TicketResponse) ---
interface TicketData {
    id: number;
    seatNumber: number;
    price: number;
    status: string;
    screeningId: number;
}

// --- Ticket Validation Form ---
interface ValidateTicketForm {
    ticketId: number | '';
}

function CashierDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('validate');

    // --- State for Ticket Validation ---
    const [validationLoading, setValidationLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

    // --- State for Orders ---
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState<string | null>(null);

    // --- Forms ---
    const validationForm = useForm<ValidateTicketForm>({
        initialValues: { ticketId: '' },
        validate: {
            ticketId: (value) => (value !== '' && value > 0 ? null : 'Valid Ticket ID is required'),
        },
    });

    // --- Data Fetching ---
    const fetchOrders = useCallback(async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
            const data = await apiCall<OrderData[]>('/orders');
            setOrders(data);
        } catch (err) {
            setOrdersError(err instanceof Error ? err.message : "Failed to fetch orders.");
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    // --- Handlers ---
    const handleValidateTicket = async (values: ValidateTicketForm) => {
        setValidationLoading(true);
        setValidationError(null);
        setValidationSuccess(null);
        try {
            const response = await apiCall<{ message: string }>(`/tickets/validate/${values.ticketId}`, {
                method: 'GET', // Backend uses GET for validation
            });
            setValidationSuccess(response.message || `Ticket ${values.ticketId} validated successfully.`);
            validationForm.reset();
            // Optionally refetch orders if status change needs to be reflected immediately
            if (activeTab === 'orders') await fetchOrders();
        } catch (err) {
            setValidationError(err instanceof Error ? err.message : `Failed to validate ticket ${values.ticketId}.`);
        } finally {
            setValidationLoading(false);
        }
    };

    // --- Effects ---
    React.useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
        // Reset messages when switching tabs
        setValidationError(null);
        setValidationSuccess(null);
        setOrdersError(null);
    }, [activeTab, fetchOrders]);


    // --- Role Check ---
    if (user?.role !== 'Admin' && user?.role !== 'Cashier') {
        return <Alert icon={<IconAlertCircle size="1rem" />} title="Access Denied" color="orange">You do not have permission to view this page.</Alert>;
    }

    // --- Table Rows ---
    const orderRows = orders.map((order) => (
        <Table.Tr key={order.id}>
            <Table.Td>{order.id}</Table.Td>
            <Table.Td>{order.userId ?? 'Guest'}</Table.Td>
            <Table.Td>{order.email ?? '-'}</Table.Td>
            <Table.Td>{order.phone ?? '-'}</Table.Td>
            <Table.Td>{order.totalPrice} Ft</Table.Td>
            <Table.Td>
                {order.tickets.map(t => `ID: ${t.id} (Seat: ${t.seatNumber}, Scr: ${t.screeningId}, Status: ${t.status})`).join('; ')}
            </Table.Td>
            {/* Add actions if needed, e.g., view details */}
        </Table.Tr>
    ));

    return (
        <Paper shadow="xs" p="md">
            <Title order={2} mb="lg">Cashier Dashboard</Title>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow>
                    <Tabs.Tab value="validate" leftSection={<IconTicket size={14} />}>Validate Ticket</Tabs.Tab>
                    <Tabs.Tab value="orders" leftSection={<IconListDetails size={14} />}>View Orders</Tabs.Tab>
                    {/* <Tabs.Tab value="purchase" leftSection={<IconShoppingCartPlus size={14} />}>Purchase for User</Tabs.Tab> */}
                </Tabs.List>

                {/* Ticket Validation Panel */}
                <Tabs.Panel value="validate" pt="lg">
                    <Title order={4} mb="md">Validate Ticket by ID</Title>
                    {validationError && <Alert icon={<IconAlertCircle size="1rem" />} title="Validation Error" color="red" mb="md" withCloseButton onClose={() => setValidationError(null)}>{validationError}</Alert>}
                    {validationSuccess && <Alert icon={<IconAlertCircle size="1rem" />} title="Validation Successful" color="green" mb="md" withCloseButton onClose={() => setValidationSuccess(null)}>{validationSuccess}</Alert>}
                    <Box component="form" onSubmit={validationForm.onSubmit(handleValidateTicket)} maw={400}>
                        <NumberInput
                            label="Ticket ID"
                            placeholder="Enter ticket ID"
                            required
                            min={1}
                            allowDecimal={false}
                            {...validationForm.getInputProps('ticketId')}
                            mb="md"
                        />
                        <Button type="submit" loading={validationLoading}>Validate Ticket</Button>
                    </Box>
                </Tabs.Panel>

                {/* View Orders Panel */}
                <Tabs.Panel value="orders" pt="lg">
                    <Title order={4} mb="md">All Orders</Title>
                    {ordersLoading && <Loader my="lg" />}
                    {ordersError && !ordersLoading && <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Orders" color="red">{ordersError}</Alert>}
                    {!ordersLoading && !ordersError && (
                        <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Order ID</Table.Th>
                                    <Table.Th>User ID / Guest</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Phone</Table.Th>
                                    <Table.Th>Total Price</Table.Th>
                                    <Table.Th>Tickets</Table.Th>
                                    {/* <Table.Th>Actions</Table.Th> */}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{orderRows}</Table.Tbody>
                        </Table>
                    )}
                </Tabs.Panel>

                {/* Purchase for User Panel (Placeholder) */}
                {/*
                <Tabs.Panel value="purchase" pt="lg">
                    <Title order={4} mb="md">Purchase Tickets for User/Guest</Title>
                    <Alert color="blue" title="Under Construction">This feature is not yet implemented.</Alert>
                    {/* Ide jönne a jegyvásárlási komponens, ami lehetővé teszi a pénztárosnak a vásárlást *}
                </Tabs.Panel>
                */}
            </Tabs>
        </Paper>
    );
}

export default CashierDashboard;
