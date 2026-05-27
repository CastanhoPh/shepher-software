import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface AvatarPlaceholderProps {
    name: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({ name, size = "md" }) => {
    const sizes = { 
        sm: "w-8 h-8 text-xs", 
        md: "w-10 h-10 text-sm", 
        lg: "w-10 h-10 md:w-12 md:h-12 text-sm md:text-base", 
        xl: "w-20 h-20 md:w-24 md:h-24 text-xl md:text-2xl" 
    };
    
    return (
        <div className={`${sizes[size]} flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center border border-indigo-100/50 dark:border-slate-600 shadow-inner`}>
            {name ? name.charAt(0).toUpperCase() : <UserIcon size={16} />}
        </div>
    );
};