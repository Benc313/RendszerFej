import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SimpleGrid, Card, Text, Title, Loader, Alert, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { apiCall } from '../services/api';

// Backend AllMovieResponse alapján
interface MovieSummary {
    id: number;
    title: string;
    description: string;
    duration: number; // Backend uint, itt number
}

function MoviesPage() {
    const [movies, setMovies] = useState<MovieSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            setError(null);
            try {
                // Helyes végpont: /api/movie
                const data = await apiCall<MovieSummary[]>('/api/movie');
                setMovies(data);
            } catch (err) {
                const errorMessage = (err instanceof Error) ? err.message : "Nem sikerült lekérni a filmeket.";
                setError(errorMessage);
                console.error("Hiba a filmek lekérésekor:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) {
        return <Loader />; // Töltésjelző
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba" color="red">
                {error}
            </Alert>
        );
    }

    return (
        <div>
            <Title order={2} mb="lg">Movies</Title>
            {movies.length === 0 ? (
                <Text>Jelenleg nincsenek elérhető filmek.</Text>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {movies.map((movie) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={movie.id}>
                            <Title order={3}>{movie.title}</Title>
                            <Text size="sm" c="dimmed" mt="xs">Hossz: {movie.duration} perc</Text>
                            <Text mt="sm" lineClamp={3}>{movie.description}</Text>

                            <Button
                                component={Link}
                                to={`/movies/${movie.id}`}
                                variant="light"
                                color="blue"
                                fullWidth
                                mt="md"
                                radius="md"
                            >
                                Részletek és Vetítések
                            </Button>
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </div>
    );
}

export default MoviesPage;
