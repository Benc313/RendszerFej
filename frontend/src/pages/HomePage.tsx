import { Title, Text, Container, Button, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
    const { user } = useAuth(); // Felhasználói adatok lekérése

    return (
        <Container size="md" mt="xl">
            <Title order={1} ta="center" mb="lg">
                Üdvözlünk a Jegymesternél!
            </Title>
            <Text ta="center" mb="xl">
                A mozijegyek egy helyen. Böngéssz a legújabb vetítéseink között és foglald le a helyed még ma.
            </Text>
            <Group justify="center">
                <Button component={Link} to="/movies" size="lg">
                    Filmek Böngészése
                </Button>
                {!user && ( // Bejelentkezés/Regisztráció gombok, ha nincs bejelentkezve
                    <>
                        <Button component={Link} to="/login" variant="default" size="lg">
                            Bejelentkezés
                        </Button>
                        <Button component={Link} to="/register" variant="outline" size="lg">
                            Regisztráció
                        </Button>
                    </>
                )}
                 {user && ( // Profil link, ha be van jelentkezve
                    <Button component={Link} to="/profile" variant="light" size="lg">
                        Profilom
                    </Button>
                )}
            </Group>
        </Container>
    );
}

export default HomePage;
