
import React, { useState } from 'react';
import {
    X, Film, Star, Tv, Clock,
    User, Globe, Ticket, ExternalLink
} from 'lucide-react';

export default function MovieModal({ movie, onClose }) {
    const [activeTab, setActiveTab] = useState('tmdb');

    if (!movie) return null;

    const tmdb = movie.tmdb || {};
    const omdb = movie.omdb || {};
    const providers = movie.providers || [];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-y-auto border border-zinc-800 relative text-zinc-200 shadow-2xl">

                {/* Cerrar ventana */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-full p-2 z-10 transition border border-zinc-700/50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Información principal */}
                <div className="p-6 bg-gradient-to-b from-zinc-800/60 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row gap-6 items-center">

                    <img
                        src={tmdb.poster}
                        alt={tmdb.title}
                        className="w-36 h-52 object-cover rounded-xl border border-zinc-700/80 shadow-2xl shrink-0"
                    />

                    <div className="space-y-2 text-center md:text-left flex-1">
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs">
                            <span className="bg-red-950/60 text-red-400 border border-red-800/60 px-2.5 py-0.5 rounded-md font-semibold">
                                {tmdb.genre || 'Cine'}
                            </span>

                            <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 rounded-md font-mono">
                                {tmdb.year || 'N/D'}
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            {tmdb.title}
                        </h2>

                        {tmdb.tagline && (
                            <p className="text-xs italic text-zinc-400">
                                {tmdb.tagline}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-zinc-300">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                {tmdb.runtime || 'N/D'}
                            </span>

                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                Director:
                                <strong className="text-white font-medium">
                                    {tmdb.director || 'No especificado'}
                                </strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pestañas */}
                <div className="border-b border-zinc-800 bg-zinc-950/60 px-6 flex space-x-6 text-xs font-medium overflow-x-auto">

                    <button
                        onClick={() => setActiveTab('tmdb')}
                        className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'tmdb'
                                ? 'border-red-600 text-red-500 font-semibold'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Film className="w-4 h-4" />
                        TMDB (General)
                    </button>

                    <button
                        onClick={() => setActiveTab('omdb')}
                        className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'omdb'
                                ? 'border-amber-500 text-amber-400 font-semibold'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Star className="w-4 h-4" />
                        OMDb (Métricas)
                    </button>

                    <button
                        onClick={() => setActiveTab('streaming')}
                        className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'streaming'
                                ? 'border-blue-500 text-blue-400 font-semibold'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Tv className="w-4 h-4" />
                        ¿Dónde ver? (Streaming)
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6 text-xs md:text-sm">

                    {/* Sinopsis y reparto */}
                    {activeTab === 'tmdb' && (
                        <div className="space-y-5">
                            <div>
                                <h4 className="font-bold text-zinc-200 mb-1.5 text-sm flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-400" />
                                    Sinopsis Detallada (Wikipedia / TMDB)
                                </h4>

                                <p className="text-zinc-300 leading-relaxed text-xs md:text-sm bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                    {movie.wikipedia?.summary || tmdb.overview || 'Sinopsis no disponible.'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold text-zinc-200 mb-2.5 text-sm">
                                    Reparto Principal
                                </h4>

                                <div className="flex gap-2.5 flex-wrap">
                                    {(tmdb.cast || []).map((actor, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-center min-w-[130px] flex-1 sm:flex-none"
                                        >
                                            <span className="block font-bold text-xs text-zinc-100">
                                                {actor.name}
                                            </span>
                                            <span className="block text-[11px] text-zinc-400 mt-0.5">
                                                {actor.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Métricas */}
                    {activeTab === 'omdb' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">

                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                                    <div className="text-zinc-400 text-[11px] font-bold mb-1">
                                        ⭐ IMDb
                                    </div>
                                    <span className="text-amber-400 font-black text-lg">
                                        {omdb.imdbRating || 'N/D'}
                                    </span>
                                </div>

                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                                    <div className="text-zinc-400 text-[11px] font-bold mb-1">
                                        🍅 Rotten Tomatoes
                                    </div>
                                    <span className="text-red-400 font-black text-lg">
                                        {omdb.rottenTomatoes || 'N/D'}
                                    </span>
                                </div>

                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                                    <div className="text-zinc-400 text-[11px] font-bold mb-1">
                                        🎯 Metacritic
                                    </div>
                                    <span className="text-emerald-400 font-black text-lg">
                                        {omdb.metascore || 'N/D'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                                    <div className="text-zinc-400 text-[11px] mb-1">
                                        🏆 Premios
                                    </div>
                                    <span className="font-semibold text-zinc-100 text-xs">
                                        {omdb.awards || 'No disponible'}
                                    </span>
                                </div>

                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                                    <div className="text-zinc-400 text-[11px] mb-1">
                                        💰 Taquilla Global
                                    </div>
                                    <span className="font-semibold text-zinc-100 text-xs">
                                        {omdb.boxOffice || 'No disponible'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Streaming con enlaces */}
                    {activeTab === 'streaming' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                                <Tv className="w-4 h-4 text-blue-400" />
                                Disponibilidad en plataformas
                            </h4>

                            {providers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {providers.map((provider, idx) => {
                                        const url = provider.webUrl ||
                                            provider.web_url ||
                                            provider.link;

                                        const validUrl =
                                            typeof url === 'string' &&
                                            /^https?:\/\//i.test(url);

                                        const content = (
                                            <>
                                                {provider.logo && (
                                                    <img
                                                        src={provider.logo}
                                                        alt={provider.name}
                                                        className="w-8 h-8 rounded-lg object-cover"
                                                    />
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-semibold text-zinc-100 block">
                                                        {provider.name}
                                                    </span>

                                                    <span className="text-[10px] text-zinc-400 block">
                                                        {validUrl
                                                            ? 'Abrir enlace ↗'
                                                            : 'Enlace no disponible'}
                                                    </span>
                                                </div>

                                                {validUrl && (
                                                    <ExternalLink className="w-4 h-4 text-blue-400" />
                                                )}
                                            </>
                                        );

                                        return validUrl ? (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center gap-3 hover:border-blue-500 hover:bg-zinc-800 transition"
                                            >
                                                {content}
                                            </a>
                                        ) : (
                                            <div
                                                key={idx}
                                                className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center gap-3 opacity-60"
                                            >
                                                {content}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="bg-red-950/50 p-3.5 rounded-full border border-red-800/50 text-red-500">
                                        <Ticket className="w-7 h-7" />
                                    </div>

                                    <h5 className="font-bold text-zinc-100 text-sm">
                                        No hay plataformas disponibles
                                    </h5>

                                    <p className="text-zinc-400 text-xs max-w-sm leading-relaxed">
                                        No encontramos información de streaming para esta película en las fuentes consultadas.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
