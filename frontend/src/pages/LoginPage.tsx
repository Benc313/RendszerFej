import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Alert, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
// Remove direct apiCall import if no longer needed elsewhere in this file
// import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Interface matching the backend's *updated* LoginResponse DTO (now same as MeResponse/User)
// This interface might not be strictly needed here anymore if we rely on AuthContext's User type
/*
interface LoginResponse {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    bannedTill?: string | null;
}
*/


function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    // Get the login function from AuthContext instead of just setUserState
    const auth = useAuth();

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
            // Use the login function from AuthContext
            const loggedInUser = await auth.login(values.email, values.password);

            // Navigate based on role from the user object returned by auth.login
            if (loggedInUser.role === 'Admin') {
                navigate('/admin');
            } else if (loggedInUser.role === 'Cashier') {
                navigate('/cashier');
            } else {
                navigate('/'); // Navigate to home page for regular users
            }

        } catch (err) {
            // auth.login will throw an error on failure, which we catch here
            // The error message might already be handled by apiCall's notification
            // Set a generic error or use the error message if available
            setError(err instanceof Error ? err.message : 'Sikertelen bejelentkezés. Kérjük, ellenőrizze adatait.');
            // No need to call setUserState(null) here, auth.login handles it on failure
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
