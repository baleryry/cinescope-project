import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-1.5 my-8 select-none">
            {/* Botón Anterior */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Números de página */}
            {getPageNumbers().map((num, idx) => (
                num === '...' ? (
                    <span key={idx} className="w-10 h-10 flex items-center justify-center text-zinc-500 font-bold">
                        ...
                    </span>
                ) : (
                    <button
                        key={idx}
                        onClick={() => onPageChange(num)}
                        className={`w-10 h-10 font-medium text-sm rounded-lg border transition ${
                            currentPage === num
                                ? 'bg-sky-500 border-sky-400 text-white font-bold shadow-lg shadow-sky-500/20'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                    >
                        {num}
                    </button>
                )
            ))}

            {/* Botón Siguiente */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}