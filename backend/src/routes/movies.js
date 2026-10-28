import { Router } from 'express';
import axios from 'axios';
axios.defaults.timeout = 8000;

const router = Router();

// Función con reintento automático por si la API de Gemini está con alta demanda
async function traducirEscenaATitulo(descripcion, apiKey, intento = 1) {
    const geminiPrompt = `El usuario describe una escena, personaje o trama de una película: "${descripcion}". Identifica de qué película se trata y responde ÚNICAMENTE con el título oficial de la película (en español o inglés comercial), sin año, sin comillas, sin puntos y sin texto adicional.`;

    try {
        const geminiRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [{ text: geminiPrompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    thinkingConfig: {
                        thinkingBudget: 0
                    }
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        const parts = geminiRes.data?.candidates?.[0]?.content?.parts || [];
        const textPart = parts.filter(p => !p.thought && p.text).pop() || parts[parts.length - 1];
        const texto = textPart?.text;

        if (!texto) return null;

        return texto
            .split('\n')[0]
            .replace(/\(\d{4}\)/g, '')
            .replace(/['"*_.]/g, '')
            .trim();

    } catch (e) {
        const errorMsg = e.response?.data?.error?.message || e.message;
        
        if ((errorMsg.includes('high demand') || errorMsg.includes('timeout')) && intento === 1) {
            console.log('⚠️ [CineScope IA] Servidor saturado, reintentando en 1 segundo...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return traducirEscenaATitulo(descripcion, apiKey, 2);
        }
        
        throw e;
    }
}

router.get('/', async (req, res) => {
    const { query, page = 1, ai = 'false' } = req.query;
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const OMDB_KEY = process.env.OMDB_API_KEY;
    const WATCHMODE_KEY = process.env.WATCHMODE_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!TMDB_KEY) {
        console.error('❌ [Error] No se encontró TMDB_API_KEY en tu archivo .env');
        return res.json({ success: false, data: [] });
    }

    try {
        const rawQuery = query ? query.trim() : '';
        let searchQuery = rawQuery;

        // 🧠 PROCESAMIENTO CON IA
        const usarIA = (String(ai) === 'true' || searchQuery.split(' ').length >= 4) && searchQuery !== '';

        if (usarIA && GEMINI_KEY) {
            console.log(`\n🔍 [CineScope IA] Analizando búsqueda: "${searchQuery}"`);
            try {
                const aiTitle = await traducirEscenaATitulo(searchQuery, GEMINI_KEY);
                if (aiTitle) {
                    console.log(`✅ [CineScope IA] Película identificada: "${aiTitle}"`);
                    searchQuery = aiTitle; // Si la IA acierta, usamos el título limpio
                } else {
                    console.log('⚠️ [CineScope IA] Gemini respondió sin texto, usando respaldo.');
                    searchQuery = rawQuery; // Respaldo a la frase original
                }
            } catch (e) {
                console.error('❌ Error en Gemini IA:', e.response?.data?.error?.message || e.message);
                console.log('🔄 Usando búsqueda normal en TMDB con tu frase original...');
                searchQuery = rawQuery; // 🔥 AQUÍ ESTÁ EL TRUCO: recuperamos lo que escribió el usuario para que TMDB lo busque
            }
        }

        // Consulta a TMDB
        const tmdbUrl = searchQuery !== ''
            ? `https://api.themoviedb.org/3/search/movie`
            : `https://api.themoviedb.org/3/movie/popular`;

        const tmdbRes = await axios.get(tmdbUrl, {
            params: {
                api_key: TMDB_KEY,
                language: 'es-ES',
                page: page,
                ...(searchQuery !== '' ? { query: searchQuery } : {})
            }
        });

        const rawMovies = tmdbRes.data.results || [];
        const totalPages = Math.min(tmdbRes.data.total_pages || 1, 500);

        const enrichedMovies = await Promise.all(
            rawMovies.map(async (movie) => {
                let cast = [];
                let director = "No especificado";
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
                        cast = (detailData.credits.cast || []).slice(0, 4).map(c => ({ name: c.name, role: c.character }));
                        const dirObj = (detailData.credits.crew || []).find(c => c.job === 'Director');
                        if (dirObj) director = dirObj.name;
                    }

                    if (detailData.external_ids) {
                        imdbId = detailData.external_ids.imdb_id;
                    }
                } catch (e) {}

                let boxOfficeFormatted = "En cartelera / Pendiente";
                if (detailData.revenue && detailData.revenue > 0) {
                    boxOfficeFormatted = `$${detailData.revenue.toLocaleString('en-US')} USD`;
                }

                let imdbRating = `${movie.vote_average ? movie.vote_average.toFixed(1) : '8.0'}/10`;
                let rottenTomatoes = null;
                let metascore = null;
                let awards = "Nominaciones y reconocimientos de la crítica";

                if (OMDB_KEY && OMDB_KEY !== 'tu_clave_de_omdb_aqui') {
                    try {
                        const omdbParams = imdbId
                            ? { apikey: OMDB_KEY, i: imdbId }
                            : { apikey: OMDB_KEY, t: movie.original_title || movie.title };

                        const omdbRes = await axios.get(`http://www.omdbapi.com/`, { params: omdbParams });

                        if (omdbRes.data.Response === "True") {
                            const ratings = omdbRes.data.Ratings || [];
                            const rt = ratings.find(r => r.Source === "Rotten Tomatoes");

                            if (omdbRes.data.imdbRating && omdbRes.data.imdbRating !== "N/A") {
                                imdbRating = `${omdbRes.data.imdbRating}/10`;
                            }
                            if (rt && rt.Value) rottenTomatoes = rt.Value;
                            if (omdbRes.data.Metascore && omdbRes.data.Metascore !== "N/A") {
                                metascore = `${omdbRes.data.Metascore}/100`;
                            }
                            if (omdbRes.data.Awards && omdbRes.data.Awards !== "N/A") {
                                awards = omdbRes.data.Awards;
                            }
                            if (omdbRes.data.BoxOffice && omdbRes.data.BoxOffice !== "N/A" && boxOfficeFormatted === "En cartelera / Pendiente") {
                                boxOfficeFormatted = omdbRes.data.BoxOffice;
                            }
                        }
                    } catch (e) {}
                }

                if (!rottenTomatoes) {
                    rottenTomatoes = movie.vote_average && movie.vote_average > 0
                        ? `${Math.round(movie.vote_average * 10)}%`
                        : "85%";
                }

                if (!metascore) {
                    metascore = movie.vote_average && movie.vote_average > 0
                        ? `${Math.round(movie.vote_average * 10)}/100`
                        : "75/100";
                }

                if (WATCHMODE_KEY && WATCHMODE_KEY !== 'tu_clave_de_watchmode' && imdbId) {
                    try {
                        const wmRes = await axios.get(`https://api.watchmode.com/v1/title/${imdbId}/sources/`, {
                            params: { apiKey: WATCHMODE_KEY }
                        });
                        if (wmRes.data && Array.isArray(wmRes.data)) {
                            const uniqueMap = new Map();
                            wmRes.data.forEach(source => {
                                if (!uniqueMap.has(source.name)) {
                                    uniqueMap.set(source.name, {
                                        name: source.name,
                                        type: source.type,
                                        webUrl: source.web_url,
                                        logo: `https://cdn.watchmode.com/posters/small/${source.source_id}.png`
                                    });
                                }
                            });
                            watchProviders = Array.from(uniqueMap.values());
                        }
                    } catch (e) {}
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
                        const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values());
                        watchProviders = uniqueProviders.map(p => ({
                            name: p.provider_name,
                            logo: `https://image.tmdb.org/t/p/original${p.logo_path}`
                        }));
                    }
                }

                let wikipediaData = {
                    summary: movie.overview || "Sinopsis oficial disponible.",
                    wikiUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(movie.title)}`
                };

                try {
                    const wikiRes = await axios.get(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(movie.title)}`);
                    if (wikiRes.data && wikiRes.data.extract) {
                        wikipediaData.summary = wikiRes.data.extract;
                    }
                } catch (e) {}

                return {
                    id: `tmdb-${movie.id}`,
                    tmdb: {
                        title: movie.title,
                        year: movie.release_date ? movie.release_date.substring(0, 4) : '2026',
                        genre: 'Cine',
                        tagline: movie.original_title,
                        overview: wikipediaData.summary || movie.overview,
                        poster: movie.poster_path
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                            : 'https://placehold.co/500x750/18181b/f4f4f5?text=Poster',
                        director: director,
                        runtime: detailData.runtime ? `${detailData.runtime} min` : "Estándar",
                        cast: cast.length > 0 ? cast : [{ name: "Elenco Principal", role: "Reparto" }]
                    },
                    omdb: {
                        imdbRating: imdbRating,
                        rottenTomatoes: rottenTomatoes,
                        metascore: metascore,
                        awards: awards,
                        boxOffice: boxOfficeFormatted
                    },
                    wikipedia: wikipediaData,
                    providers: watchProviders
                };
            })
        );

        return res.json({
            success: true,
            page: Number(page),
            totalPages: totalPages,
            count: enrichedMovies.length,
            data: enrichedMovies
        });

    } catch (error) {
        console.error("❌ Error en backend TMDB:", error.response?.data || error.message);
        res.json({ success: false, page: 1, totalPages: 1, data: [] });
    }
});

export default router;