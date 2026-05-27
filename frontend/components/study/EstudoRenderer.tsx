import React from 'react';
import { Quote } from 'lucide-react';

interface EstudoRendererProps {
    content: string;
}

export const EstudoRenderer: React.FC<EstudoRendererProps> = ({ content }) => {
    if (!content) return null;

    const renderBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) { 
                return <strong key={index} className="font-extrabold text-gray-900">{part.slice(2, -2)}</strong>; 
            }
            return part;
        });
    };

    const lines = content.split('\n');
    return (
        <div className="space-y-4 font-sans text-gray-600 print:text-black">
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={index} className="h-2"></div>;
                if (trimmed === '---' || trimmed === '***') { return <hr key={index} className="border-gray-200 my-6" />; }
                if (trimmed.match(/^#\s/) || trimmed.startsWith('Título:')) {
                    const text = trimmed.replace(/^#\s+|Título:\s*/, '');
                    return (<div key={index} className="mt-8 mb-6 pb-4 border-b border-amber-100 print:mt-0 print:border-black"><h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight print:text-3xl">{renderBold(text)}</h1></div>);
                }
                if (trimmed.match(/^##\s/)) {
                    const text = trimmed.replace(/^##\s+/, '');
                    return (<h2 key={index} className="text-xl md:text-2xl font-bold text-blue-700 mt-8 mb-3 flex items-center gap-3 print:text-black print:mt-6"><span className="w-2 h-8 bg-amber-500 rounded-full inline-block print:hidden"></span>{renderBold(text)}</h2>);
                }
                if (trimmed.match(/^###\s/)) {
                    const text = trimmed.replace(/^###\s+/, '');
                    return (<h3 key={index} className="text-lg md:text-xl font-bold text-gray-800 mt-6 mb-2 uppercase tracking-wide print:text-black print:mt-4">{renderBold(text)}</h3>);
                }
                if (trimmed.match(/^[-*]\s/)) {
                    const text = trimmed.replace(/^[-*]\s+/, '');
                    return (<div key={index} className="flex items-start gap-3 ml-2 mb-2"><div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 print:bg-black"></div><p className="text-sm md:text-base leading-relaxed">{renderBold(text)}</p></div>);
                }
                if (trimmed.startsWith('>')) {
                    const text = trimmed.replace(/^>\s*/, '');
                    return (<div key={index} className="bg-blue-50/50 border-l-4 border-blue-400 p-4 rounded-r-xl my-4 italic text-blue-900 flex gap-3 print:bg-transparent print:border-l-2 print:border-gray-400 print:text-black print:p-2"><Quote className="text-blue-300 flex-shrink-0 print:hidden" size={20} /><p className="text-sm md:text-base">{renderBold(text)}</p></div>)
                }
                return (<p key={index} className="text-sm md:text-base leading-7 text-gray-600 print:text-black">{renderBold(trimmed)}</p>);
            })}
        </div>
    );
};