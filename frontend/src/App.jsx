
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import MovieModal from './components/MovieModal';
import Pagination from './components/Pagination';

const API_URL = 'https://cinescope-backend-jgly.onrender.com';
const STORAGE_KEY = 'cinescope_favorites';

export default function App() {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFavorites, setShowFavorites] = useState(false);

    // Recuperar favoritos del navegador
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error leyendo favoritos:', error);
            return [];
        }
    });

    // Comprobar si una película está guardada
    const isFavorite = (movie) => {
        return favorites.some(
            (item) => String(item.id) === String(movie.id)
        );
    };

    // Guardar o eliminar favoritos
    const toggleFavorite = (movie) => {
        if (!movie || movie.id == null) return;

        const exists = favorites.some(
            (item) => String(item.id) === String(movie.id)
        );

        const updated = exists
            ? favorites.filter(
                (item) => String(item.id) !== String(movie.id)
            )
            : [...favorites, movie];

        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updated)
            );

            setFavorites(updated);

            console.log(
                exists
                    ? 'Película eliminada de favoritos'
                    : 'Película guardada correctamente',
                movie.tmdb?.title || movie.title
            );
        } catch (error) {
            console.error('Error guardando favoritos:', error);
            alert('No se pudo guardar la película en este navegador.');
        }
    };

    // Obtener películas desde Render
    const fetchMovies = async (query = '', page = 1, ai = false) => {
        setLoading(true);
        setError('');

        try {
            const url = `${API_URL}/api/movies?query=${encodeURIComponent(query)}&page=${page}&ai=${ai}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setMovies(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                setMovies([]);
                setTotalPages(1);
                setError('No se pudieron obtener las películas.');
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
            setError('Error al conectar con el servidor de CineScope.');
        } finally {
            setLoading(false);
        }
    };

    // Cargar el catálogo inicialmente y al cambiar de página
    useEffect(() => {
        fetchMovies(searchQuery, currentPage, isAiMode);
    }, [currentPage]);

    // Buscar películas normalmente o mediante IA
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
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Mostrar catálogo o favoritos
    const displayedMovies = showFavorites ? favorites : movies;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

            <Navbar onSearch={handleSearch} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">

                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        {showFavorites
                            ? 'Mis Películas Favoritas'
                            : 'Catálogo Cinematográfico'}

                        {isAiMode && !showFavorites && (
                            <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2.5 py-0.5 rounded-full font-normal">
                                Búsqueda IA Activada
                            </span>
                        )}
                    </h1>

                    <div className="flex items-center gap-3">

                        {/* BOTÓN PARA VER FAVORITOS */}
                        <button
                            type="button"
                            onClick={() => setShowFavorites(!showFavorites)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                showFavorites
                                    ? 'bg-red-600 border-red-500 text-white'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                            }`}
                        >
                            <Bookmark
                                className={`w-4 h-4 ${
                                    showFavorites ? 'fill-current' : ''
                                }`}
                            />

                            {showFavorites
                                ? 'Volver al catálogo'
                                : `Mis favoritos (${favorites.length})`}
                        </button>

                        {!showFavorites && (
                            <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full font-mono">
                                Página {currentPage} de {totalPages}
                            </span>
                        )}
                    </div>
                </div>

                {/* MENSAJE DE CARGA */}
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
                        {/* MENSAJE DE ERROR */}
                        {error && !showFavorites && (
                            <p className="text-center text-red-400 mb-5">
                                {error}
                            </p>
                        )}

                        {/* CUANDO NO HAY PELÍCULAS */}
                        {displayedMovies.length === 0 ? (
                            <div className="text-center text-zinc-400 py-20">
                                <Bookmark className="w-10 h-10 mx-auto mb-4 text-zinc-600" />

                                <p>
                                    {showFavorites
                                        ? 'Todavía no tienes películas guardadas.'
                                        : 'No se encontraron películas.'}
                                </p>

                                {showFavorites && (
                                    <button
                                        onClick={() => setShowFavorites(false)}
                                        className="mt-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
                                    >
                                        Explorar catálogo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

                                {displayedMovies.map((movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        onClick={() => setSelectedMovie(movie)}
                                        isFavorite={isFavorite(movie)}
                                        onToggleFavorite={toggleFavorite}
                                    />
                                ))}

                            </div>
                        )}

                        {/* PAGINACIÓN */}
                        {!showFavorites && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </main>

            {/* VENTANA DE DETALLES */}
            {selectedMovie && (
                <MovieModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </div>
    );
}
