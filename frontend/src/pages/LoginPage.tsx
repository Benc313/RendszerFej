import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Box, Title, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api';

// Backend által várt LoginRequest
interface LoginRequest {
    email: string;
    password: string;
}

// Backend által ténylegesen küldött LoginResponse (lokálisan definiálva)
interface ActualLoginResponse {
    name: string;
    email: string;
}


function LoginPage() {
    const navigate = useNavigate();
    // setUserState eltávolítva, nincs rá szükség itt
    const { checkAuthStatus } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // Töltési állapot a gombhoz

    const form = useForm<LoginRequest>({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length < 6 ? 'Password should include at least 6 characters' : null), // Egyszerű validáció
        },
    });

    const handleSubmit = async (values: LoginRequest) => {
        setError(null);
        setLoading(true); // Töltés indítása
        try {
            // 1. Hívjuk a login végpontot. Ez csak beállítja a cookie-t.
            // A válasz (ActualLoginResponse) itt nem létfontosságú a state frissítéséhez.
            await apiCall<ActualLoginResponse>('/login', {
                method: 'POST',
                data: values,
            });

            // 2. Sikeres login után hívjuk a checkAuthStatus-t, ami a /me végpontot hívja
            // és beállítja a user state-et a kontextusban.
            const user = await checkAuthStatus();

            if (user) {
                // Opcionális: Közvetlenül is beállíthatnánk itt, de checkAuthStatus már megteszi
                // setUserState(user);
                navigate('/'); // Sikeres bejelentkezés és adatlekérés után főoldalra navigálás
            } else {
                // Ez nem szabadna megtörténjen, ha a login sikeres volt és a /me végpont jó
                setError("Login succeeded but failed to fetch user data.");
            }

        } catch (err) { // Javítva: any eltávolítva
             // Hiba kezelése Error objektumként
             const errorMessage = (err instanceof Error) ? err.message : "An unexpected error occurred.";
             setError(errorMessage);
             console.error("Login error:", err);
        } finally {
            setLoading(false); // Töltés befejezése
        }
    };

    return (
        <Box maw={340} mx="auto">
            <Title order={2} ta="center" mt="md" mb="xl">
                Login
            </Title>
            {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Login Error" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                    {error}
                </Alert>
            )}
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    required
                    {...form.getInputProps('email')}
                />
                <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    mt="md"
                    {...form.getInputProps('password')}
                />
                {/* Gomb letiltása és loader mutatása töltés közben */}
                <Button type="submit" fullWidth mt="xl" loading={loading}>
                    Sign in
                </Button>
            </form>
        </Box>
    );
}

export default LoginPage;
