import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    colorBg: string;
    colorText?: string;
    shadowColor?: string;
    onClick?: () => void;
    isSelected?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorBg, colorText, shadowColor, onClick, isSelected }) => (
    <div 
        onClick={onClick}
        className={`
            bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border 
            ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-gray-100 dark:border-slate-700'} 
            shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] 
            hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-none 
            transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-300
            flex items-center justify-between group cursor-pointer 
            min-h-[7rem] md:min-h-[8rem] relative overflow-hidden
        `}
    >
        <div className={`absolute -right-10 -bottom-10 w-24 h-24 md:w-32 md:h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${colorBg}`}></div>
        <div className="flex flex-col justify-between h-full py-1 z-10">
            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>{title}</p>
            <h3 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${colorText || 'text-gray-800 dark:text-white'}`}>{value}</h3>
        </div>
        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center text-white shadow-lg ${shadowColor || 'shadow-gray-200'} dark:shadow-none ${colorBg} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 z-10`}>
            <Icon size={20} className="md:w-7 md:h-7" strokeWidth={2} />
        </div>
    </div>
);