
import { Router } from 'express';
import axios from 'axios';

axios.defaults.timeout = 8000;

const router = Router();

// Identificar películas mediante Gemini
async function traducirEscenaATitulo(descripcion, apiKey, intento = 1) {
    const prompt = `Identifica la película descrita: "${descripcion}". Responde únicamente con el título oficial, sin explicaciones, comillas ni año.`;

    try {
        const respuesta = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    thinkingConfig: {
                        thinkingBudget: 0
                    }
                }
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
        const titulo = partes
            .filter(p => !p.thought && p.text)
            .map(p => p.text)
            .join(' ')
            .trim();

        return titulo
            ? titulo.split('\n')[0].replace(/["*]/g, '').trim()
            : null;

    } catch (error) {
        const status = error.response?.status;

        if ((status === 429 || error.code === 'ECONNABORTED') && intento === 1) {
            console.log('Gemini: reintentando solicitud...');
            return traducirEscenaATitulo(descripcion, apiKey, 2);
        }

        console.error(
            'Error en Gemini IA:',
            status,
            error.response?.data?.error?.message || error.message
        );

        return null;
    }
}

// Obtener enlaces de Watchmode
async function obtenerWatchmode(imdbId, apiKey) {
    if (!imdbId || !apiKey) return [];

    try {
        const respuesta = await axios.get(
            `https://api.watchmode.com/v1/title/${encodeURIComponent(imdbId)}/sources/`,
            {
                params: { apiKey }
            }
        );

        const fuentes = Array.isArray(respuesta.data)
            ? respuesta.data
            : [];

        const unicos = new Map();

        for (const fuente of fuentes) {
            const identificador = `${fuente.name}-${fuente.type}`;

            if (!unicos.has(identificador)) {
                unicos.set(identificador, {
                    name: fuente.name,
                    type: fuente.type,
                    region: fuente.region || null,
                    webUrl: fuente.web_url || null,
                    logo: fuente.source_id
                        ? `https://cdn.watchmode.com/posters/small/${fuente.source_id}.png`
                        : null
                });
            }
        }

        return Array.from(unicos.values());

    } catch (error) {
        console.log(
            'Watchmode:',
            error.response?.status || error.message
        );
        return [];
    }
}

// Obtener plataformas desde TMDB
function obtenerPlataformasTMDB(detalles) {
    const resultados = detalles?.['watch/providers']?.results || {};

    // Mostrar solo disponibilidad conocida en Perú
    const region = resultados.PE;

    if (!region) return [];

    const opciones = [
        ...(region.flatrate || []).map(p => ({
            ...p,
            type: 'subscription'
        })),
        ...(region.free || []).map(p => ({
            ...p,
            type: 'free'
        })),
        ...(region.ads || []).map(p => ({
            ...p,
            type: 'ads'
        })),
        ...(region.rent || []).map(p => ({
            ...p,
            type: 'rent'
        })),
        ...(region.buy || []).map(p => ({
            ...p,
            type: 'buy'
        }))
    ];

    const unicos = new Map();

    for (const p of opciones) {
        const id = `${p.provider_id}-${p.type}`;

        if (!unicos.has(id)) {
            unicos.set(id, {
                name: p.provider_name,
                type: p.type,
                region: 'PE',
                logo: p.logo_path
                    ? `https://image.tmdb.org/t/p/original${p.logo_path}`
                    : null,
                // Página de disponibilidad de la película
                webUrl: region.link || null
            });
        }
    }

    return Array.from(unicos.values());
}

// Ruta principal de películas
router.get('/', async (req, res) => {
    const {
        query = '',
        page = '1',
        ai = 'false'
    } = req.query;

    const TMDB_KEY = process.env.TMDB_API_KEY;
    const OMDB_KEY = process.env.OMDB_API_KEY;
    const WATCHMODE_KEY = process.env.WATCHMODE_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!TMDB_KEY) {
        return res.status(500).json({
            success: false,
            error: 'TMDB_API_KEY no configurada',
            data: []
        });
    }

    try {
        const rawQuery = String(query).trim();
        let searchQuery = rawQuery;

        const usarIA =
            (String(ai) === 'true' ||
                rawQuery.split(/\s+/).length >= 4) &&
            rawQuery !== '';

        // Búsqueda inteligente
        if (usarIA && GEMINI_KEY) {
            console.log('[CineScope IA] Analizando:', rawQuery);

            const titulo = await traducirEscenaATitulo(
                rawQuery,
                GEMINI_KEY
            );

            if (titulo) {
                console.log('[CineScope IA] Película identificada:', titulo);
                searchQuery = titulo;
            } else {
                console.log('[CineScope IA] Usando búsqueda normal');
            }
        }

        const numeroPagina = Math.max(
            1,
            Math.floor(Number(page) || 1)
        );

        const urlTMDB = searchQuery
            ? 'https://api.themoviedb.org/3/search/movie'
            : 'https://api.themoviedb.org/3/movie/popular';

        const respuestaTMDB = await axios.get(urlTMDB, {
            params: {
                api_key: TMDB_KEY,
                language: 'es-ES',
                page: numeroPagina,
                ...(searchQuery ? { query: searchQuery } : {})
            }
        });

        const peliculas = respuestaTMDB.data.results || [];

        const totalPages = Math.min(
            respuestaTMDB.data.total_pages || 1,
            500
        );

        // Enriquecer cada película
        const resultados = await Promise.all(
            peliculas.map(async (pelicula) => {
                let detalles = {};
                let reparto = [];
                let director = 'No especificado';
                let imdbId = null;

                // Detalles de TMDB
                try {
                    const respuesta = await axios.get(
                        `https://api.themoviedb.org/3/movie/${pelicula.id}`,
                        {
                            params: {
                                api_key: TMDB_KEY,
                                language: 'es-ES',
                                append_to_response:
                                    'credits,external_ids,watch/providers'
                            }
                        }
                    );

                    detalles = respuesta.data || {};

                    reparto = (detalles.credits?.cast || [])
                        .slice(0, 4)
                        .map(actor => ({
                            name: actor.name,
                            role: actor.character
                        }));

                    const directorEncontrado =
                        detalles.credits?.crew?.find(
                            persona => persona.job === 'Director'
                        );

                    director = directorEncontrado?.name ||
                        'No especificado';

                    imdbId = detalles.external_ids?.imdb_id ||
                        detalles.imdb_id || null;

                } catch (error) {
                    console.log('Error detalle TMDB:', pelicula.id);
                }

                // Métricas iniciales
                let imdbRating = pelicula.vote_average
                    ? `${pelicula.vote_average.toFixed(1)}/10`
                    : 'N/D';

                let rottenTomatoes = 'N/D';
                let metascore = 'N/D';
                let awards = 'No disponible';

                let boxOffice = detalles.revenue > 0
                    ? `$${detalles.revenue.toLocaleString('en-US')} USD`
                    : 'No disponible';

                // OMDb
                if (OMDB_KEY) {
                    try {
                        const respuesta = await axios.get(
                            'https://www.omdbapi.com/',
                            {
                                params: imdbId
                                    ? { apikey: OMDB_KEY, i: imdbId }
                                    : {
                                        apikey: OMDB_KEY,
                                        t: pelicula.original_title
                                    }
                            }
                        );

                        const omdb = respuesta.data;

                        if (omdb.Response === 'True') {
                            if (omdb.imdbRating &&
                                omdb.imdbRating !== 'N/A') {
                                imdbRating = `${omdb.imdbRating}/10`;
                            }

                            const rt = (omdb.Ratings || []).find(
                                r => r.Source === 'Rotten Tomatoes'
                            );

                            rottenTomatoes = rt?.Value || 'N/D';

                            metascore = omdb.Metascore &&
                                omdb.Metascore !== 'N/A'
                                ? `${omdb.Metascore}/100`
                                : 'N/D';

                            awards = omdb.Awards &&
                                omdb.Awards !== 'N/A'
                                ? omdb.Awards
                                : awards;

                            if (omdb.BoxOffice &&
                                omdb.BoxOffice !== 'N/A') {
                                boxOffice = omdb.BoxOffice;
                            }
                        }
                    } catch (error) {
                        console.log('OMDb no disponible');
                    }
                }

                // Streaming
                let plataformas = [];

                if (WATCHMODE_KEY && imdbId) {
                    plataformas = await obtenerWatchmode(
                        imdbId,
                        WATCHMODE_KEY
                    );
                }

                // Respaldo TMDB
                const plataformasTMDB =
                    obtenerPlataformasTMDB(detalles);

                if (plataformas.length === 0) {
                    plataformas = plataformasTMDB;
                } else {
                    // Añadir plataformas de TMDB que no estén
                    // entre los resultados de Watchmode
                    const nombres = new Set(
                        plataformas.map(p => p.name.toLowerCase())
                    );

                    for (const p of plataformasTMDB) {
                        if (!nombres.has(p.name.toLowerCase())) {
                            plataformas.push(p);
                        }
                    }
                }

                // Wikipedia
                let sinopsis = pelicula.overview ||
                    'Sinopsis no disponible.';

                let wikiUrl = null;

                try {
                    const wiki = await axios.get(
                        `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pelicula.title)}`
                    );

                    if (wiki.data?.extract) {
                        sinopsis = wiki.data.extract;
                        wikiUrl = wiki.data.content_urls?.desktop?.page || null;
                    }
                } catch (error) {
                    // Mantener sinopsis de TMDB
                }

                return {
                    id: `tmdb-${pelicula.id}`,

                    tmdb: {
                        title: pelicula.title,
                        year: pelicula.release_date
                            ? pelicula.release_date.slice(0, 4)
                            : 'N/D',
                        genre: 'Cine',
                        tagline: detalles.tagline ||
                            pelicula.original_title,
                        overview: pelicula.overview,
                        poster: pelicula.poster_path
                            ? `https://image.tmdb.org/t/p/w500${pelicula.poster_path}`
                            : 'https://placehold.co/500x750/18181b/f4f4f5?text=Poster',
                        director,
                        runtime: detalles.runtime
                            ? `${detalles.runtime} min`
                            : 'N/D',
                        cast: reparto.length > 0
                            ? reparto
                            : [{
                                name: 'Elenco principal',
                                role: 'Reparto'
                            }]
                    },

                    omdb: {
                        imdbRating,
                        rottenTomatoes,
                        metascore,
                        awards,
                        boxOffice
                    },

                    wikipedia: {
                        summary: sinopsis,
                        wikiUrl
                    },

                    providers: plataformas
                };
            })
        );

        return res.json({
            success: true,
            page: numeroPagina,
            totalPages,
            count: resultados.length,
            data: resultados
        });

    } catch (error) {
        console.error(
            'Error en CineScope:',
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            page: 1,
            totalPages: 1,
            data: [],
            error: 'No se pudieron obtener las películas'
        });
    }
});

export default router;
