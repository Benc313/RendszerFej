import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Alert, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';


function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

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
        setIsLoading(true);
        setError(null);
        try {
            // Bejelentkezés a context login függvényével
            const userData = await login(values.email, values.password);
            
            // Sikeres bejelentkezés értesítés
            notifications.show({
                title: 'Sikeres Bejelentkezés',
                message: `Üdvözlünk, ${userData.name}!`,
                color: 'green',
                icon: <IconCheck size={16} />
            });
            
            navigate('/'); // Átirányítás a főoldalra
        } catch (err) {
            setError(err instanceof Error ? err.message : 'A bejelentkezés sikertelen. Ellenőrizd az adatokat.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center" mb={20}>Bejelentkezés</Title>
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba a bejelentkezéskor" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                            {error}
                        </Alert>
                    )}
                    <TextInput
                        label="Email cím"
                        placeholder="email@pelda.hu"
                        required
                        {...form.getInputProps('email')}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Jelszó"
                        placeholder="Jelszó"
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
