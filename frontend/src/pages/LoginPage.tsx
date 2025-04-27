import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Alert, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Interface matching the backend's LoginResponse DTO
interface LoginResponse {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string;
    bannedTill?: string | null; // Match the MeResponse/User interface used in AuthContext
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
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length > 0 ? null : 'Password is required'),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setError(null);
        setIsLoading(true);
        try {
            const loginResponse = await apiCall<LoginResponse>('/login', {
                method: 'POST',
                data: values,
            });

            // Update the auth context with the user data from the response
            // Convert bannedTill string to Date object if necessary
            const userData = {
                ...loginResponse,
                bannedTill: loginResponse.bannedTill ? new Date(loginResponse.bannedTill) : null,
            };
            setUserState(userData);

            // Navigate based on role
            if (userData.role === 'Admin') {
                navigate('/admin');
            } else if (userData.role === 'Cashier') {
                navigate('/cashier');
            } else {
                navigate('/'); // Navigate to home page for regular users
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
            setUserState(null); // Clear user state on login failure
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Login
            </Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Login Error" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                            {error}
                        </Alert>
                    )}
                    <TextInput
                        label="Email"
                        placeholder="you@mantine.dev"
                        required
                        {...form.getInputProps('email')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        {...form.getInputProps('password')}
                        mb="lg"
                    />
                     <Group justify="space-between" mt="lg">
                         <Button onClick={() => navigate('/register')} variant="subtle" size="xs">
                            Don't have an account? Register
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Login
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}

export default LoginPage;
