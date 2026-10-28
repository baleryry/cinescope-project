
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import MovieModal from './components/MovieModal';
import Pagination from './components/Pagination';

const API_URL = 'https://cinescope-backend-jgly.onrender.com';

export default function App() {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFavorites, setShowFavorites] = useState(false);

    // Recuperar las películas que ya estaban guardadas
    const [favorites, setFavorites] = useState(() => {
        try {
            const stored = localStorage.getItem('cinescope_favorites');
            const parsed = stored ? JSON.parse(stored) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    // Guardar favoritos cada vez que cambien
    useEffect(() => {
        localStorage.setItem(
            'cinescope_favorites',
            JSON.stringify(favorites)
        );
    }, [favorites]);

    // Agregar o quitar una película de favoritos
    const toggleFavorite = (movie) => {
        setFavorites((previous) => {
            const exists = previous.some(
                (item) => item.id === movie.id
            );

            if (exists) {
                return previous.filter(
                    (item) => item.id !== movie.id
                );
            }

            return [...previous, movie];
        });
    };

    // Obtener películas del backend
    const fetchMovies = async (query = '', page = 1, ai = false) => {
        setLoading(true);

        try {
            const res = await fetch(
                `${API_URL}/api/movies?query=${encodeURIComponent(query)}&page=${page}&ai=${ai}`
            );

            if (!res.ok) {
                throw new Error('Error al cargar películas');
            }

            const data = await res.json();

            if (data.success) {
                setMovies(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                setMovies([]);
            }
        } catch (error) {
            console.error('Error de API:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar películas al iniciar o cambiar de página
    useEffect(() => {
        fetchMovies(searchQuery, currentPage, isAiMode);
    }, [currentPage]);

    // Buscar películas
    const handleSearch = (query, aiMode) => {
        setShowFavorites(false);
        setSearchQuery(query);
        setIsAiMode(aiMode);

        if (currentPage === 1) {
            fetchMovies(query, 1, aiMode);
        } else {
            setCurrentPage(1);
        }
    };

    // Cambiar página
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Elegir qué películas mostrar
    const displayedMovies = showFavorites ? favorites : movies;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            <Navbar onSearch={handleSearch} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <h1 className="text-xl font-bold text-white">
                        {showFavorites
                            ? 'Mis Películas Favoritas'
                            : 'Catálogo Cinematográfico'}

                        {isAiMode && !showFavorites && (
                            <span className="ml-3 text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2 py-1 rounded-full">
                                Búsqueda IA Activada
                            </span>
                        )}
                    </h1>

                    <div className="flex items-center gap-3">
                        {/* Botón para ver películas guardadas */}
                        <button
                            type="button"
                            onClick={() => setShowFavorites(!showFavorites)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                showFavorites
                                    ? 'bg-red-600 border-red-500 text-white'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                            }`}
                        >
                            <Bookmark className="w-4 h-4" />
                            {showFavorites
                                ? 'Volver al catálogo'
                                : `Mis favoritos (${favorites.length})`}
                        </button>

                        {!showFavorites && (
                            <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                                Página {currentPage} de {totalPages}
                            </span>
                        )}
                    </div>
                </div>

                {loading && !showFavorites ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 text-sm space-y-3">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p>
                            {isAiMode
                                ? 'La IA está analizando tu escena...'
                                : 'Cargando catálogo...'}
                        </p>
                    </div>
                ) : (
                    <>
                        {displayedMovies.length === 0 ? (
                            <p className="text-center text-zinc-400 py-20">
                                {showFavorites
                                    ? 'Todavía no tienes películas guardadas.'
                                    : 'No se encontraron películas.'}
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {displayedMovies.map((movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        onClick={() => setSelectedMovie(movie)}
                                        isFavorite={favorites.some(
                                            (item) => item.id === movie.id
                                        )}
                                        onToggleFavorite={toggleFavorite}
                                    />
                                ))}
                            </div>
                        )}

                        {!showFavorites && !loading && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </main>

            {selectedMovie && (
                <MovieModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </div>
    );
}
