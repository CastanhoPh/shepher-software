import React from 'react';
import { 
    FolderOpen, Edit, Trash2, Mail, Phone, ShieldCheck, Activity, Calendar 
} from 'lucide-react';
import { User, UserId } from '../../types';
import { AvatarPlaceholder } from '../ui/AvatarPlaceholder';
import { useLanguage } from '../../contexts/LanguageContext';

interface MobileUserCardProps {
    item: User;
    view: string;
    openForm: (type: string, item: User) => void;
    handleDelete: (id: UserId, isUserTable: boolean) => void;
    user: User;
    getSupervisorName: (id: UserId | null | undefined) => string;
    onOpenCell?: (item: User) => void;
}

export const MobileUserCard: React.FC<MobileUserCardProps> = ({ 
    item, view, openForm, handleDelete, user, getSupervisorName, onOpenCell 
}) => {
    const { t } = useLanguage();
    const activityLevels = [
        t.users.activityLevels.left,
        t.users.activityLevels.inactive,
        t.users.activityLevels.neutral,
        t.users.activityLevels.active,
        t.users.activityLevels.veryActive
    ];
    
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border border-gray-100 dark:border-slate-700 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <AvatarPlaceholder name={item.name} size="md" />
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{item.name}</p>
                        <p className="text-xs font-medium text-gray-400">{item.role || t.users.member}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {onOpenCell && ((view === 'leaders' && item.role === 'DISCIPULADOR') || (view === 'pastors' && item.role === 'PASTOR')) && (
                        <button onClick={() => onOpenCell(item)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
                            <FolderOpen size={16} />
                        </button>
                    )}
                    <button onClick={() => openForm(item.role || 'DISCIPULO', item)} className="p-2 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <Edit size={16} />
                    </button>
                    {item.role !== 'ADM' && (
                        <button onClick={() => handleDelete(item.id, item.role !== 'DISCIPULO')} className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Mail size={14} className="text-gray-300 dark:text-slate-600" />
                    <span className="truncate max-w-[200px]">{item.email || t.users.noEmail}</span>
                </div>
                {view === 'pastors' ? (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Phone size={14} className="text-gray-300 dark:text-slate-600" />
                        <span>{item.contato || t.users.noContact}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>{t.users.sup}: {item.role === 'DISCIPULADOR' ? getSupervisorName(item.pastorId) : getSupervisorName(item.discipuladorId)}</span>
                    </div>
                )}
                {item.atividade && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Activity size={14} className="text-blue-400" />
                        <span>{t.users.activityLevel}: {activityLevels[item.atividade - 1]}</span>
                    </div>
                )}
                {item.nascimento && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Calendar size={14} className="text-gray-300 dark:text-slate-600" />
                        <span>{t.users.age}: {new Date().getFullYear() - new Date(item.nascimento).getFullYear()} {t.users.years}</span>
                    </div>
                )}
                <div className="pt-3 border-t border-gray-50 dark:border-slate-700 flex flex-wrap gap-2 mt-2">
                    {item.g12 && <span className="text-[10px] font-bold text-white bg-purple-500 px-2 py-1 rounded-md">{t.users.g12}</span>}
                    {item.batizado && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">{t.users.baptized}</span>}
                    {item.capacitacaoDestino && item.capacitacaoDestino !== 'Não Iniciou' && (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md">{item.capacitacaoDestino}</span>
                    )}
                </div>
            </div>
        </div>
    );
};