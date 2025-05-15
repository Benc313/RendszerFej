import { useState } from 'react';
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
            const response = await apiCall<{ success: boolean; message: string }>('/api/auth/register', {
                method: 'POST',
                data: {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    phoneNumber: values.phoneNumber, 
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
            <Title ta="center" mb={20}>Regisztráció</Title>
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a regisztrációkor" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                            {error}
                        </Alert>
                    )}
                    <TextInput
                        label="Név"
                        placeholder="Teljes név"
                        required
                        {...form.getInputProps('name')}
                        mb="sm"
                    />
                    <TextInput
                        label="Email cím"
                        placeholder="email@pelda.hu"
                        required
                        {...form.getInputProps('email')}
                        mb="sm"
                    />
                    <TextInput
                        label="Telefonszám"
                        placeholder="+36..."
                        required
                        {...form.getInputProps('phoneNumber')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Jelszó"
                        placeholder="Jelszó"
                        required
                        {...form.getInputProps('password')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Jelszó megerősítése"
                        placeholder="Jelszó újra"
                        required
                        {...form.getInputProps('confirmPassword')}
                        mb="lg"
                    />
                    <Group justify="space-between" mt="lg">
                        <Button onClick={() => navigate('/login')} variant="subtle" size="xs">
                            Van már fiókod? Jelentkezz be
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Regisztráció
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}

export default RegisterPage;
