import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Box, Title, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { apiCall } from '../services/api';

// Backend által várt RegisterRequest struktúra
interface RegisterRequest {
    name: string;
    email: string;
    phoneNumber: string; // Backend ezt várja
    password: string;
}

// Az űrlaphoz használt értékek (tartalmazza a confirmPassword-öt is)
interface RegisterFormValues {
    name: string;
    email: string;
    phone: string; // Ez van az űrlapon
    password: string;
    confirmPassword: string;
}

function RegisterPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const form = useForm<RegisterFormValues>({
        initialValues: {
            name: '',
            email: '',
            phone: '', // Űrlapon 'phone'
            password: '',
            confirmPassword: '',
        },
        validate: {
            name: (value) => (value.trim().length < 2 ? 'Name must have at least 2 letters' : null),
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            phone: (value) => (value.trim().length < 6 ? 'Phone number seems too short' : null), // Alap validáció
            password: (value) => (value.length < 6 ? 'Password should include at least 6 characters' : null),
            confirmPassword: (value, values) =>
                value !== values.password ? 'Passwords did not match' : null,
        },
    });

    const handleSubmit = async (values: RegisterFormValues) => {
        setError(null);
        setSuccess(false);
        // A confirmPassword itt szándékosan nincs használva a destrukturálás után
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, phone, ...restValues } = values; // ESLint figyelmeztetés kikapcsolása a confirmPassword-re
        const registerData: RegisterRequest = {
            ...restValues,
            phoneNumber: phone, // Átalakítás phoneNumber-ré
        };

        try {
            // A backend Ok()-t ad vissza tartalom nélkül (void)
            await apiCall<void>('/register', {
                method: 'POST',
                data: registerData,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000); // Átirányítás loginra siker után
        } catch (err) {
             // Hiba kezelése Error objektumként
             const errorMessage = (err instanceof Error) ? err.message : "An unexpected error occurred during registration.";
             setError(errorMessage);
             console.error("Registration error:", err);
        }
    };

    return (
        <Box maw={340} mx="auto">
            <Title order={2} ta="center" mt="md" mb="xl">
                Register
            </Title>
            {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Registration Error" color="red" withCloseButton onClose={() => setError(null)} mb="md">
                    {error}
                </Alert>
            )}
             {success && (
                <Alert color="green" title="Registration Successful" mb="md">
                    You can now log in. Redirecting...
                </Alert>
            )}
            {!success && ( // Form csak akkor jelenik meg, ha nem volt sikeres a regisztráció
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label="Name"
                        placeholder="Your Name"
                        required
                        {...form.getInputProps('name')}
                    />
                    <TextInput
                        label="Email"
                        placeholder="your@email.com"
                        required
                        mt="md"
                        {...form.getInputProps('email')}
                    />
                    <TextInput
                        label="Phone Number"
                        placeholder="+36 20 123 4567"
                        required
                        mt="md"
                        {...form.getInputProps('phone')} // Az űrlapon 'phone' marad
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        mt="md"
                        {...form.getInputProps('password')}
                    />
                    <PasswordInput
                        label="Confirm Password"
                        placeholder="Confirm password"
                        required
                        mt="md"
                        {...form.getInputProps('confirmPassword')}
                    />
                    <Button type="submit" fullWidth mt="xl">
                        Register
                    </Button>
                </form>
            )}
        </Box>
    );
}

export default RegisterPage;
