import React, { useState } from 'react';
import { X, Film, Star, Tv, Clock, User, Globe, Ticket } from 'lucide-react';

export default function MovieModal({ movie, onClose }) {
    const [activeTab, setActiveTab] = useState('tmdb');

    if (!movie) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-y-auto border border-zinc-800 relative text-zinc-200 shadow-2xl">
                
                {/* BotÃ³n Cerrar */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-full p-2 z-10 transition border border-zinc-700/50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Modal */}
                <div className="p-6 bg-gradient-to-b from-zinc-800/60 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row gap-6 items-center">
                    <img 
                        src={movie.tmdb.poster} 
                        alt={movie.tmdb.title} 
                        className="w-36 h-52 object-cover rounded-xl border border-zinc-700/80 shadow-2xl shrink-0" 
                    />
                    <div className="space-y-2 text-center md:text-left flex-1">
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs">
                            <span className="bg-red-950/60 text-red-400 border border-red-800/60 px-2.5 py-0.5 rounded-md font-semibold">
                                {movie.tmdb.genre}
                            </span>
                            <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 rounded-md font-mono">
                                {movie.tmdb.year}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{movie.tmdb.title}</h2>
                        {movie.tmdb.tagline && (
                            <p className="text-xs italic text-zinc-400">{movie.tmdb.tagline}</p>
                        )}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-zinc-300">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-400" /> {movie.tmdb.runtime}</span>
                            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-zinc-400" /> Director: <strong className="text-white font-medium">{movie.tmdb.director}</strong></span>
                        </div>
                    </div>
                </div>

                {/* PestaÃ±as de NavegaciÃ³n */}
                <div className="border-b border-zinc-800 bg-zinc-950/60 px-6 flex space-x-6 text-xs font-medium">
                    <button 
                        onClick={() => setActiveTab('tmdb')} 
                        className={`py-3.5 flex items-center gap-2 border-b-2 transition ${
                            activeTab === 'tmdb' 
                                ? 'border-red-600 text-red-500 font-semibold' 
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Film className="w-4 h-4" /> TMDB (General)
                    </button>
                    <button 
                        onClick={() => setActiveTab('omdb')} 
                        className={`py-3.5 flex items-center gap-2 border-b-2 transition ${
                            activeTab === 'omdb' 
                                ? 'border-amber-500 text-amber-400 font-semibold' 
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Star className="w-4 h-4" /> OMDb (MÃ©tricas)
                    </button>
                    <button 
                        onClick={() => setActiveTab('streaming')} 
                        className={`py-3.5 flex items-center gap-2 border-b-2 transition ${
                            activeTab === 'streaming' 
                                ? 'border-blue-500 text-blue-400 font-semibold' 
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Tv className="w-4 h-4" /> Â¿DÃ³nde ver? (Streaming)
                    </button>
                </div>

                {/* Contenido de las PestaÃ±as */}
                <div className="p-6 text-xs md:text-sm">
                    {/* TMDB / Wikipedia Sinopsis */}
                    {activeTab === 'tmdb' && (
                        <div className="space-y-5">
                            <div>
                                <h4 className="font-bold text-zinc-200 mb-1.5 text-sm flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-400" /> Sinopsis Detallada (Wikipedia / TMDB)
                                </h4>
                                <p className="text-zinc-300 leading-relaxed text-xs md:text-sm bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                    {movie.wikipedia?.summary || movie.tmdb.overview}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold text-zinc-200 mb-2.5 text-sm">Reparto Principal</h4>
                                <div className="flex gap-2.5 flex-wrap">
                                    {movie.tmdb.cast.map((c, idx) => (
                                        <div key={idx} className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-center min-w-[130px] flex-1 sm:flex-none">
                                            <span className="block font-bold text-xs text-zinc-100">{c.name}</span>
                                            <span className="block text-[11px] text-zinc-400 mt-0.5">{c.role}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OMDb Metrics con Emojis */}
                    {activeTab === 'omdb' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-col items-center justify-center">
                                    <span className="text-zinc-400 text-[11px] uppercase font-bold mb-1 flex items-center gap-1.5">
                                        â­ IMDb
                                    </span>
                                    <span className="text-amber-400 font-black text-lg">{movie.omdb.imdbRating}</span>
                                </div>
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-col items-center justify-center">
                                    <span className="text-zinc-400 text-[11px] uppercase font-bold mb-1 flex items-center gap-1.5">
                                        ðŸ… Rotten Tomatoes
                                    </span>
                                    <span className="text-red-400 font-black text-lg">{movie.omdb.rottenTomatoes}</span>
                                </div>
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-col items-center justify-center">
                                    <span className="text-zinc-400 text-[11px] uppercase font-bold mb-1 flex items-center gap-1.5">
                                        ðŸŽ¯ Metacritic
                                    </span>
                                    <span className="text-emerald-400 font-black text-lg">{movie.omdb.metascore}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3">
                                    <span className="text-2xl select-none">ðŸ†</span>
                                    <div>
                                        <span className="text-zinc-400 block text-[11px] font-medium">Premios</span>
                                        <span className="font-semibold text-zinc-100 text-xs mt-0.5 block">{movie.omdb.awards}</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3">
                                    <span className="text-2xl select-none">ðŸ’°</span>
                                    <div>
                                        <span className="text-zinc-400 block text-[11px] font-medium">Taquilla Global</span>
                                        <span className="font-semibold text-zinc-100 text-xs mt-0.5 block">{movie.omdb.boxOffice}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Streaming / Cines */}
                    {activeTab === 'streaming' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                                <Tv className="w-4 h-4 text-blue-400" /> Disponibilidad
                            </h4>

                            {movie.providers && movie.providers.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {movie.providers.map((p, idx) => (
                                        <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                                            <img src={p.logo} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                                            <span className="text-xs font-semibold text-zinc-100">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="bg-red-950/50 p-3.5 rounded-full border border-red-800/50 text-red-500 shadow-inner">
                                        <Ticket className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="font-bold text-zinc-100 text-sm tracking-wide">Solo disponible en cines</h5>
                                        <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                                            Esta pelÃ­cula se encuentra en cartelera cinematogrÃ¡fica o aÃºn no dispone de licencias de streaming digital para la regiÃ³n.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
