import React, { useState } from 'react';
import { 
    Sparkles, Loader2, CheckCircle2, Printer, Copy, Check 
} from 'lucide-react';
import { EstudoRenderer } from './EstudoRenderer';
import { generateStudyPlan } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';

export const PreparacaoEstudo: React.FC = () => {
    const { t } = useLanguage();
    const [tema, setTema] = useState('');
    const [resultado, setResultado] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const gerarEstudo = async () => {
        if (!tema) { 
            setError(t.study.emptyTheme); 
            setResultado(''); 
            return; 
        }
        setLoading(true); 
        setError(''); 
        setResultado('');
        
        try {
            const text = await generateStudyPlan(tema);
            setResultado(text);
        } catch (e) {
            console.error("Erro na chamada da API:", e);
            setError(t.study.errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const textArea = document.createElement("textarea"); 
        textArea.value = resultado; 
        textArea.style.position = 'fixed'; 
        textArea.style.left = '-9999px'; 
        textArea.style.top = '0'; 
        document.body.appendChild(textArea); 
        textArea.focus(); 
        textArea.select();
        try { 
            const successful = document.execCommand('copy'); 
            if (successful) { 
                setCopied(true); 
                setTimeout(() => setCopied(false), 2000); 
            } 
        } catch (err) { 
            console.error('Erro ao copiar texto: ', err); 
        } 
        document.body.removeChild(textArea);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <style>{`@media print { @page { margin: 2cm; size: auto; } body * { visibility: hidden; } .study-result, .study-result * { visibility: visible; } .study-result { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; background: white !important; z-index: 9999; } .decorative-bg { display: none !important; } }`}</style>
            <div className="flex items-center justify-between mb-6 md:mb-8 print-hidden">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Sparkles className="text-amber-500 fill-amber-500" /> {t.study.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">{t.study.subtitle}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-6 relative overflow-hidden study-container">
                <div className="decorative-bg absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
                <div className="input-area flex flex-col md:flex-row gap-4 relative z-10">
                    <input 
                        type="text" 
                        value={tema} 
                        onChange={(e) => setTema(e.target.value)} 
                        placeholder={t.study.themePlaceholder} 
                        className="w-full px-5 py-4 md:px-6 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-amber-200 focus:ring-4 focus:ring-amber-50 dark:focus:ring-amber-900/30 rounded-2xl outline-none transition-all duration-300 font-medium text-sm md:text-base text-gray-800 dark:text-white" 
                        disabled={loading} 
                    />
                    <button 
                        onClick={gerarEstudo} 
                        disabled={loading} 
                        className="w-full md:w-auto px-6 md:px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={18} />}
                        {loading ? t.study.generating : t.study.generate}
                    </button>
                </div>
                {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl font-medium border border-red-100 dark:border-red-900/50 print-hidden text-sm">{error}</div>}
                {resultado && (
                    <div className="mt-8 md:mt-12 pt-0">
                        <div className="flex items-center gap-3 mb-4 md:mb-6 print-hidden">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-300"><CheckCircle2 size={20} /></div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{t.study.successTitle}</h3>
                        </div>
                        <div className="study-result p-6 md:p-12 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                            <div className="decorative-bg absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
                            <EstudoRenderer content={resultado} />
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 print-hidden">
                            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm w-full sm:w-auto">
                                <Printer size={18} /> {t.study.print}
                            </button>
                            <button 
                                className={`flex items-center justify-center gap-2 px-5 py-3 font-bold rounded-xl transition shadow-sm w-full sm:w-auto ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`} 
                                onClick={handleCopy}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? t.study.copied : t.study.copy}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};