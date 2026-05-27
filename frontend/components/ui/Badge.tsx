import React from 'react';
import { Role } from '../../types';

interface BadgeProps {
    children: React.ReactNode;
    type: Role | string;
}

export const Badge: React.FC<BadgeProps> = ({ children, type }) => {
    const styles: Record<string, string> = {
        ADM: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 ring-1 ring-red-100 dark:ring-red-900",
        PASTOR: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 ring-1 ring-amber-100 dark:ring-amber-900",
        DISCIPULADOR: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 ring-1 ring-purple-100 dark:ring-purple-900",
        DISCIPULO: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 ring-1 ring-gray-100 dark:ring-gray-700",
        G12: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900"
    };
    
    // Normalize type string to handle edge cases or uppercase
    const key = (type as string).toUpperCase();
    const styleClass = styles[key] || styles.DISCIPULO;
    
    return (
        <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${styleClass}`}>
            {children}
        </span>
    );
};