import axios from 'axios';

const API_BASE_URL = 'https://cinescope-backend-jgly.onrender.com/api';

export const fetchMovies = async (searchQuery = '', genre = 'ALL') => {
    try {
        const response = await axios.get(`${API_BASE_URL}/movies`, {
            params: { query: searchQuery, genre }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        return [];
    }
};

export const searchMoviesWithAI = async (prompt) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/movies/ai-search`, { prompt });
        return response.data.data;
    } catch (error) {
        console.error('Error en la bÃºsqueda con IA:', error);
        return [];
    }
};

