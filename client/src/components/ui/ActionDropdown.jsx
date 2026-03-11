import React, { useState, useRef, useEffect } from 'react';

/**
 * A lightweight dropdown menu suitable for actions.
 * Props:
 *   label - text to display on the trigger (default "Actions")
 *   options - array of { label, onClick }
 */
export default function ActionDropdown({ label = 'Actions', options = [] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // close when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (open && ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleKey = (e) => {
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
        }
    };

    return (
        <div ref={ref} className="relative inline-block text-left">
            <button
                type="button"
                className="inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                onClick={() => setOpen((o) => !o)}
                onKeyDown={handleKey}
                aria-haspopup="true"
                aria-expanded={open}
            >
                {label}
                <svg
                    className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 transition-opacity ease-out duration-200"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                >
                    <div className="py-1">
                        {options.map((opt, idx) => (
                            <button
                                key={idx}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                    setOpen(false);
                                    opt.onClick && opt.onClick();
                                }}
                                role="menuitem"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
