import { Title, Text, Container, Button, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function HomePage() {
    const { user } = useAuth(); // Get user info

    return (
        <Container size="md" mt="xl">
            <Title order={1} ta="center" mb="lg">
                Welcome to Jegymester!
            </Title>
            <Text ta="center" mb="xl">
                Your one-stop shop for movie tickets. Browse our latest screenings and book your seats today.
            </Text>
            <Group justify="center">
                <Button component={Link} to="/movies" size="lg">
                    Browse Movies
                </Button>
                {!user && ( // Show login/register only if not logged in
                    <>
                        <Button component={Link} to="/login" variant="default" size="lg">
                            Login
                        </Button>
                        <Button component={Link} to="/register" variant="outline" size="lg">
                            Register
                        </Button>
                    </>
                )}
                 {user && ( // Show profile link if logged in
                    <Button component={Link} to="/profile" variant="light" size="lg">
                        My Profile
                    </Button>
                )}
            </Group>
            {/* You could add featured movies or upcoming screenings here later */}
        </Container>
    );
}

export default HomePage;
