import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Alert, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Interface matching the backend's *updated* LoginResponse DTO (now same as MeResponse/User)
interface LoginResponse {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string;
    bannedTill?: string | null; // Keep as string from backend JSON
}


function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setUserState } = useAuth(); // Get setUserState from context

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Érvénytelen email cím'), 
            password: (value) => (value.length > 0 ? null : 'A jelszó megadása kötelező'), 
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setError(null);
        setIsLoading(true);
        try {
            // This call now receives the full user object due to backend change
            const loginResponse = await apiCall<LoginResponse>('/login', {
                method: 'POST',
                data: values,
            });

            // Update the auth context - loginResponse now has all required fields (id, role, etc.)
            // No need to convert bannedTill here if AuthContext handles string
            setUserState(loginResponse); // Directly use the full response

            // Navigate based on role - loginResponse.role is now available immediately
            if (loginResponse.role === 'Admin') {
                navigate('/admin');
            } else if (loginResponse.role === 'Cashier') {
                navigate('/cashier');
            } else {
                navigate('/'); // Navigate to home page for regular users
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sikertelen bejelentkezés. Kérjük, ellenőrizze adatait.');
            setUserState(null); // Clear user state on login failure
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Bejelentkezés 
            </Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Bejelentkezési Hiba" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                            {error}
                        </Alert>
                    )}
                    <TextInput
                        label="Email" 
                        placeholder="neved@email.com" 
                        required
                        {...form.getInputProps('email')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Jelszó" 
                        placeholder="Jelszavad" 
                        required
                        {...form.getInputProps('password')}
                        mb="lg"
                    />
                     <Group justify="space-between" mt="lg">
                         <Button onClick={() => navigate('/register')} variant="subtle" size="xs">
                            Nincs még fiókod? Regisztrálj 
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Bejelentkezés 
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}

export default LoginPage;
