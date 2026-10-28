import React, { useState } from 'react';
import { Search, Film, Sparkles } from 'lucide-react';

export default function Navbar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(searchTerm, isAiMode);
    };

    const handleLogoClick = () => {
        setSearchTerm('');
        setIsAiMode(false);
        onSearch('', false);
    };

    return (
        <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                
                {/* Logo Principal CineScope */}
                <div 
                    onClick={handleLogoClick}
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                    <div className="bg-red-600 p-2 rounded-xl group-hover:bg-red-500 transition shadow-lg shadow-red-600/20">
                        <Film className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-lg text-white tracking-wider uppercase">
                        Cine<span className="text-red-500">Scope</span>
                    </span>
                </div>

                {/* Formulario de BÃºsqueda con Toggle IA */}
                <form onSubmit={handleSubmit} className="flex-1 max-w-lg relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                isAiMode 
                                    ? "Describe una escena o personaje (ej: robot que limpia basura y se enamora)..." 
                                    : "Buscar por Nombre o Categoria (ej: Batman, Avengers)..."
                            }
                            className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition ${
                                isAiMode 
                                    ? 'border-purple-500/80 focus:border-purple-400 shadow-lg shadow-purple-950/40' 
                                    : 'border-zinc-800 focus:border-red-500'
                            }`}
                        />
                        {isAiMode ? (
                            <Sparkles className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none animate-pulse" />
                        ) : (
                            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAiMode(!isAiMode)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                            isAiMode 
                                ? 'bg-purple-950/80 border-purple-600 text-purple-300 shadow-md shadow-purple-900/30' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                        title="Buscar describiendo escenas o personajes con IA"
                    >
                        <Sparkles className={`w-3.5 h-3.5 ${isAiMode ? 'text-purple-400' : 'text-zinc-400'}`} />
                        <span className="hidden sm:inline">{isAiMode ? 'Modo IA Activo' : 'Buscar con IA'}</span>
                    </button>
                </form>

            </div>
        </header>
    );
}
