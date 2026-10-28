import { Router } from 'express';
import axios from 'axios';

const router = Router();
axios.defaults.timeout = 8000;

// Convierte una descripción de película en un título mediante Gemini.
async function traducirEscenaATitulo(descripcion, apiKey, intento = 1) {
    const prompt = `El usuario describe una escena, personaje o trama de una película: "${descripcion}". Identifica la película y responde ÚNICAMENTE con su título comercial, sin año, comillas ni explicaciones. Si no puedes identificarla, responde NO_IDENTIFICADA.`;

    try {
        const respuesta = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { thinkingConfig: { thinkingBudget: 0 } }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                timeout: 30000
            }
        );

        const partes = respuesta.data?.candidates?.[0]?.content?.parts || [];
        const titulo = partes.filter(p => typeof p.text === 'string' && !p.thought)
            .map(p => p.text).join(' ').split('\n')[0]
            .replace(/\(?\b\d{4}\b\)?/g, '')
            .replace(/['"*_.]/g, '').trim();

        return titulo && titulo !== 'NO_IDENTIFICADA' ? titulo : null;
    } catch (error) {
        const estado = error.response?.status;
        const mensaje = error.response?.data?.error?.message || error.message;
        if (intento === 1 && (estado === 429 || estado === 503 || error.code === 'ECONNABORTED')) {
            console.warn('⚠️ [CineScope IA] Reintentando una vez:', mensaje);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return traducirEscenaATitulo(descripcion, apiKey, 2);
        }
        throw error;
    }
}

router.get('/', async (req, res) => {
    const { query = '', page = 1, ai = 'false' } = req.query;
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const OMDB_KEY = process.env.OMDB_API_KEY;
    const WATCHMODE_KEY = process.env.WATCHMODE_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!TMDB_KEY) {
        console.error('❌ Falta TMDB_API_KEY en Render → Environment');
        return res.status(500).json({ success: false, data: [], error: 'Falta configuración de TMDB' });
    }

    try {
        const rawQuery = String(query).trim();
        let searchQuery = rawQuery;
        const pagina = Math.max(1, Number.parseInt(page, 10) || 1);
        const usarIA = String(ai) === 'true' && rawQuery !== '';

        if (usarIA) {
            if (!GEMINI_KEY) {
                console.error('❌ [CineScope IA] Falta GEMINI_API_KEY en Render → Environment');
            } else {
                console.log(`🔍 [CineScope IA] Analizando búsqueda: "${rawQuery}"`);
                try {
                    const titulo = await traducirEscenaATitulo(rawQuery, GEMINI_KEY);
                    if (titulo) {
                        searchQuery = titulo;
                        console.log(`✅ [CineScope IA] Película identificada: "${titulo}"`);
                    } else {
                        console.warn('⚠️ [CineScope IA] No se identificó una película; usando búsqueda normal.');
                    }
                } catch (error) {
                    console.error('❌ Error en Gemini IA:', error.response?.status, error.response?.data?.error?.message || error.message);
                    console.log('🔄 Buscando en TMDB sin IA como respaldo.');
                }
            }
        }

        const tmdbUrl = searchQuery
            ? 'https://api.themoviedb.org/3/search/movie'
            : 'https://api.themoviedb.org/3/movie/popular';
        const tmdbRes = await axios.get(tmdbUrl, {
            params: {
                api_key: TMDB_KEY,
                language: 'es-ES',
                page: pagina,
                ...(searchQuery ? { query: searchQuery } : {})
            }
        });

        const rawMovies = tmdbRes.data.results || [];
        const totalPages = Math.min(tmdbRes.data.total_pages || 1, 500);

        const enrichedMovies = await Promise.all(rawMovies.map(async (movie) => {
            let cast = [];
            let director = 'No especificado';
            let imdbId = null;
            let watchProviders = [];
            let detailData = {};

            try {
                const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
                    params: {
                        api_key: TMDB_KEY,
                        language: 'es-ES',
                        append_to_response: 'credits,external_ids,watch/providers'
                    }
                });
                detailData = detailRes.data || {};
                if (detailData.credits) {
                    cast = (detailData.credits.cast || []).slice(0, 4).map(c => ({
                        name: c.name, role: c.character
                    }));
                    const persona = (detailData.credits.crew || []).find(c => c.job === 'Director');
                    if (persona) director = persona.name;
                }
                imdbId = detailData.external_ids?.imdb_id || null;
            } catch (error) {
                console.warn(`TMDB detalle ${movie.id}:`, error.message);
            }

            let boxOfficeFormatted = detailData.revenue > 0
                ? `$${detailData.revenue.toLocaleString('en-US')} USD`
                : 'En cartelera / Pendiente';
            let imdbRating = `${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/D'}/10`;
            let rottenTomatoes = 'N/D';
            let metascore = 'N/D';
            let awards = 'Sin datos de premios';

            if (OMDB_KEY && OMDB_KEY !== 'tu_clave_de_omdb_aqui') {
                try {
                    const params = imdbId
                        ? { apikey: OMDB_KEY, i: imdbId }
                        : { apikey: OMDB_KEY, t: movie.original_title || movie.title };
                    const omdbRes = await axios.get('https://www.omdbapi.com/', { params });
                    if (omdbRes.data.Response === 'True') {
                        const info = omdbRes.data;
                        const rt = (info.Ratings || []).find(r => r.Source === 'Rotten Tomatoes');
                        if (info.imdbRating && info.imdbRating !== 'N/A') imdbRating = `${info.imdbRating}/10`;
                        if (rt?.Value) rottenTomatoes = rt.Value;
                        if (info.Metascore && info.Metascore !== 'N/A') metascore = `${info.Metascore}/100`;
                        if (info.Awards && info.Awards !== 'N/A') awards = info.Awards;
                        if (info.BoxOffice && info.BoxOffice !== 'N/A' && boxOfficeFormatted === 'En cartelera / Pendiente') boxOfficeFormatted = info.BoxOffice;
                    }
                } catch (error) {
                    console.warn(`OMDb ${movie.id}:`, error.message);
                }
            }

            if (WATCHMODE_KEY && WATCHMODE_KEY !== 'tu_clave_de_watchmode' && imdbId) {
                try {
                    const wmRes = await axios.get(`https://api.watchmode.com/v1/title/${imdbId}/sources/`, {
                        params: { apiKey: WATCHMODE_KEY }
                    });
                    if (Array.isArray(wmRes.data)) {
                        const mapa = new Map();
                        wmRes.data.forEach(source => {
                            if (source.name && !mapa.has(source.name)) {
                                mapa.set(source.name, {
                                    name: source.name,
                                    type: source.type,
                                    webUrl: source.web_url,
                                    logo: `https://cdn.watchmode.com/posters/small/${source.source_id}.png`
                                });
                            }
                        });
                        watchProviders = Array.from(mapa.values());
                    }
                } catch (error) {
                    console.warn(`Watchmode ${movie.id}:`, error.message);
                }
            }

            if (watchProviders.length === 0 && detailData['watch/providers']) {
                const results = detailData['watch/providers'].results;
                const regionData = results?.PE || results?.US || results?.ES;
                if (regionData) {
                    const allProviders = [
                        ...(regionData.flatrate || []),
                        ...(regionData.rent || []),
                        ...(regionData.buy || [])
                    ];
                    const unique = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values());
                    watchProviders = unique.map(p => ({
                        name: p.provider_name,
                        logo: `https://image.tmdb.org/t/p/original${p.logo_path}`
                    }));
                }
            }

            const wikipediaData = {
                summary: movie.overview || 'Sinopsis oficial disponible.',
                wikiUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(movie.title)}`
            };
            try {
                const wikiRes = await axios.get(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(movie.title)}`);
                if (wikiRes.data?.extract) wikipediaData.summary = wikiRes.data.extract;
            } catch (error) {
                // Conservamos la sinopsis de TMDB.
            }

            return {
                id: `tmdb-${movie.id}`,
                tmdb: {
                    title: movie.title,
                    year: movie.release_date ? movie.release_date.substring(0, 4) : 'Sin fecha',
                    genre: 'Cine',
                    tagline: movie.original_title,
                    overview: wikipediaData.summary || movie.overview,
                    poster: movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : 'https://placehold.co/500x750/18181b/f4f4f5?text=Poster',
                    director,
                    runtime: detailData.runtime ? `${detailData.runtime} min` : 'No disponible',
                    cast: cast.length ? cast : [{ name: 'Elenco Principal', role: 'Reparto' }]
                },
                omdb: {
                    imdbRating, rottenTomatoes, metascore, awards,
                    boxOffice: boxOfficeFormatted
                },
                wikipedia: wikipediaData,
                providers: watchProviders
            };
        }));

        res.json({
            success: true,
            page: pagina,
            totalPages,
            count: enrichedMovies.length,
            data: enrichedMovies
        });
    } catch (error) {
        console.error('❌ Error en backend TMDB:', error.response?.data || error.message);
        res.status(502).json({ success: false, page: 1, totalPages: 1, data: [] });
    }
});

export default router;
