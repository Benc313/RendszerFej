import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Alert, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../services/api';

function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            phoneNumber: (value) => (value.trim().length >= 6 ? null : 'Phone number seems too short'),
            password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
            confirmPassword: (value, values) =>
                value === values.password ? null : 'Passwords do not match',
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setIsLoading(true);
        setError(null);

        if (values.password !== values.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            // Helyes endpoint és mezőnevek
            const response = await apiCall<{ success: boolean; message: string }>('/api/auth/register', {
                method: 'POST',
                data: {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    phoneNumber: values.phoneNumber, // Helyes mezőnév
                },
            });

            if (response.success) {
                // Sikeres regisztráció
                navigate('/login');
            } else {
                setError(response.message || 'Registration failed.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Register
            </Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Registration Error" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                            {error}
                        </Alert>
                    )}
                    <TextInput
                        label="Name"
                        placeholder="Your name"
                        required
                        {...form.getInputProps('name')}
                        mb="sm"
                    />
                    <TextInput
                        label="Email"
                        placeholder="you@mantine.dev"
                        required
                        {...form.getInputProps('email')}
                        mb="sm"
                    />
                     <TextInput
                        label="Phone Number"
                        placeholder="+36..."
                        required
                        {...form.getInputProps('phoneNumber')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        {...form.getInputProps('password')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Confirm Password"
                        placeholder="Confirm password"
                        required
                        {...form.getInputProps('confirmPassword')}
                        mb="lg"
                    />
                    <Group justify="space-between" mt="lg">
                         <Button onClick={() => navigate('/login')} variant="subtle" size="xs">
                            Already have an account? Login
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Register
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}

export default RegisterPage;
