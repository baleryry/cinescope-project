import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import MovieModal from './components/MovieModal';
import Pagination from './components/Pagination';

export default function App() {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMovies = async (query = '', page = 1, ai = false) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/movies?query=${encodeURIComponent(query)}&page=${page}&ai=${ai}`);
            const data = await res.json();
            if (data.success) {
                setMovies(data.data || []);
                setCurrentPage(data.page || 1);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies(searchQuery, currentPage, isAiMode);
    }, [currentPage]);

    const handleSearch = (query, aiMode) => {
        setSearchQuery(query);
        setIsAiMode(aiMode);
        setCurrentPage(1);
        fetchMovies(query, 1, aiMode);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            <Navbar onSearch={handleSearch} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        Catálogo Cinematográfico
                        {isAiMode && (
                            <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2.5 py-0.5 rounded-full font-normal">
                                Búsqueda IA Activada
                            </span>
                        )}
                    </h1>
                    <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full font-mono">
                        Página {currentPage} de {totalPages}
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 text-sm space-y-3">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p>{isAiMode ? 'La IA está analizando tu escena...' : 'Cargando catálogo...'}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {movies.map((movie) => (
                                <MovieCard 
                                    key={movie.id} 
                                    movie={movie} 
                                    onClick={() => setSelectedMovie(movie)} 
                                />
                            ))}
                        </div>

                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={handlePageChange} 
                        />
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