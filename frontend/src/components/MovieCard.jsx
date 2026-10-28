
import React from 'react';
import { Bookmark, Star } from 'lucide-react';

export default function MovieCard({
    movie,
    onClick,
    isFavorite = false,
    onToggleFavorite
}) {
    if (!movie) return null;

    const title = movie.tmdb?.title || movie.title || 'Sin título';
    const poster = movie.tmdb?.poster || movie.poster;
    const year = movie.tmdb?.year || movie.year || '2026';
    const rating = movie.omdb?.imdbRating || '8.0/10';
    const overview = movie.wikipedia?.summary ||
        movie.tmdb?.overview ||
        movie.overview || '';

    return (
        <div
            onClick={onClick}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700 hover:scale-[1.02] transition duration-200 group relative flex flex-col justify-between shadow-lg"
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">

                {/* Imagen de la película */}
                <img
                    src={poster}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                />

                <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-[10px] text-zinc-300 px-2 py-0.5 rounded border border-zinc-700/50">
                    Cine
                </span>

                {/* BOTÓN PARA GUARDAR PELÍCULAS */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(movie);
                    }}
                    title={
                        isFavorite
                            ? 'Quitar de favoritos'
                            : 'Guardar película'
                    }
                    aria-label={
                        isFavorite
                            ? 'Quitar de favoritos'
                            : 'Guardar película'
                    }
                    aria-pressed={isFavorite}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition border ${
                        isFavorite
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border-zinc-700/40'
                    }`}
                >
                    <Bookmark
                        className={`w-3.5 h-3.5 ${
                            isFavorite ? 'fill-current' : ''
                        }`}
                    />
                </button>
            </div>

            {/* Información de la película */}
            <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center gap-1">
                        <h3 className="font-bold text-sm text-white truncate group-hover:text-red-500 transition">
                            {title}
                        </h3>

                        <span className="text-[11px] text-zinc-500 font-mono">
                            {year}
                        </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {overview}
                    </p>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs border-t border-zinc-800/80 mt-2">
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {rating}
                    </span>

                    <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition font-medium">
                        Ver ficha →
                    </span>
                </div>
            </div>
        </div>
    );
}
