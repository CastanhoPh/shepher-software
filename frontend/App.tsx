import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Users, User, Plus, LogOut, LayoutDashboard, X, Edit, Network,
    Briefcase, Crown, BookOpen, Menu, Calendar, Activity, FolderOpen,
    ArrowLeft, Moon, Sun, ListFilter, Medal, ArrowDown, Lock, Eye, EyeOff,
    Filter, Heart, Smile, Globe, BarChart2, Mail, Check, Copy, ArrowUpRight, Book, Sparkles, ShieldCheck, Award, GraduationCap, Search, Languages, Upload, FileDown
} from 'lucide-react';

import { User as UserType, Role, ViewState, UserId } from './types';
import { Badge } from './components/ui/Badge';
import { AvatarPlaceholder } from './components/ui/AvatarPlaceholder';
import { StatCard } from './components/ui/StatCard';
import { DashboardCharts } from './components/dashboard/DashboardCharts';
import { MobileUserCard } from './components/users/MobileUserCard';
import { PreparacaoEstudo } from './components/study/PreparacaoEstudo';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { usuarioService, dashboardService, DashboardEstatisticas } from './services/api';
import { INITIAL_USERS, INITIAL_DISCIPLES, MINISTERIOS_OPTIONS } from './constants';
import shepherLogo from './assets/shepher_logo.png';

const LOCAL_TEST_MODE = import.meta.env.VITE_LOCAL_TEST_MODE === 'true';

const normalizeLocalUser = (u: any): UserType => ({
    ...u,
    id: String(u.id),
    pastorId: u.pastorId != null ? String(u.pastorId) : null,
    discipuladorId: u.discipuladorId != null ? String(u.discipuladorId) : null,
});

export default function App() {
    const { user, login, logout, isLoading } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [view, setView] = useState<ViewState>('login');
    const [usersDb, setUsersDb] = useState<UserType[]>([]);
    const [disciplesDb, setDisciplesDb] = useState<UserType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<UserType | null>(null);
    const [formType, setFormType] = useState<Role>('DISCIPULO');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activityLevel, setActivityLevel] = useState(3);
    const [selectedMinisterios, setSelectedMinisterios] = useState<string[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<UserType | null>(null);
    const [selectedPastor, setSelectedPastor] = useState<UserType | null>(null);
    const [darkMode, setDarkMode] = useState(false);
    
    // Login States
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showFormPassword, setShowFormPassword] = useState(false);
    
    const [selectedStat, setSelectedStat] = useState<string | null>(null);
    
    // Personal Filters State
    const [filterGender, setFilterGender] = useState<string | null>(null);
    const [filterAge, setFilterAge] = useState<string | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardEstatisticas | null>(null);
    const [isImportingExcel, setIsImportingExcel] = useState(false);
    const excelInputRef = useRef<HTMLInputElement | null>(null);

    const calculateAge = (dob?: string) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const diff = Date.now() - birthDate.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const networkDisciples = useMemo(() => {
        if (!user) return [];

        const allPeople = [...usersDb, ...disciplesDb];

        if (view === 'pastors' && selectedPastor) {
            const leadersIds = usersDb.filter(u => u.pastorId === selectedPastor.id).map(u => u.id);
            const relevantIds = [selectedPastor.id, ...leadersIds];
            return allPeople.filter(d => d.id !== selectedPastor.id && (d.pastorId === selectedPastor.id || (d.discipuladorId && relevantIds.includes(d.discipuladorId))));
        }

        if (view === 'leaders' && selectedLeader) {
            return allPeople.filter(d => d.discipuladorId === selectedLeader.id);
        }

        if (user.role === 'ADM') {
            return allPeople.filter(p => p.id !== user.id);
        }
        
        if (user.role === 'PASTOR') {
            const myLeadersIds = usersDb.filter(u => u.pastorId === user.id).map(u => u.id);
            return allPeople.filter(p => 
                p.id !== user.id && (
                    p.pastorId === user.id || 
                    (p.discipuladorId && (p.discipuladorId === user.id || myLeadersIds.includes(p.discipuladorId)))
                )
            );
        }
        
        if (user.role === 'DISCIPULADOR') {
            return allPeople.filter(p => p.discipuladorId === user.id || p.pastorId === user.id);
        }

        return [];
    }, [user, usersDb, disciplesDb, view, selectedLeader, selectedPastor]);

    // Global filtering base
    const baseFilteredList = useMemo(() => {
        let list = networkDisciples;
        
        if (searchTerm) {
            list = list.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (filterGender) {
            list = list.filter(p => p.sexo === filterGender);
        }

        if (filterAge) {
             list = list.filter(p => {
                const age = calculateAge(p.nascimento);
                if (filterAge === '0-12') return age <= 12;
                if (filterAge === '13-17') return age >= 13 && age <= 17;
                if (filterAge === '18-25') return age >= 18 && age <= 25;
                if (filterAge === '26-40') return age >= 26 && age <= 40;
                if (filterAge === '41-60') return age >= 41 && age <= 60;
                if (filterAge === '60+') return age > 60;
                return true;
             });
        }
        return list;
    }, [networkDisciples, searchTerm, filterGender, filterAge]);

    // Disciples view list: filtered by search and ordered by role (Pastor > Discipulador > Discipulo)
    const disciplesList = useMemo(() => {
        const roleOrder: Record<Role, number> = { ADM: 0, PASTOR: 1, DISCIPULADOR: 2, DISCIPULO: 3 };
        return networkDisciples
            .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const diff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
                return diff !== 0 ? diff : a.name.localeCompare(b.name);
            });
    }, [networkDisciples, searchTerm]);

    const getStatData = (type: string | null, list: UserType[]) => {
        if (!type || !user) return list;
        switch(type) {
            case 'G12': return list.filter(d => (d.discipuladorId === user.id || d.pastorId === user.id) && (d.role === 'DISCIPULADOR' || d.role === 'PASTOR'));
            case 'CELULA': return list.filter(d => (d.discipuladorId === user.id || d.pastorId === user.id) && d.role === 'DISCIPULO');
            case 'TODOS': return list;
            case 'REAL_144': return list.filter(d => d.discipuladorId !== user.id && d.pastorId !== user.id);
            case 'BATIZADO': return list.filter(d => d.batizado);
            case 'NAO_BATIZADO': return list.filter(d => !d.batizado);
            case 'UV': return list.filter(d => d.universidadeDaVida === 'Sim');
            case 'NAO_INICIOU_UV': return list.filter(d => d.universidadeDaVida === 'Não');
            case 'NAO_INICIOU_CD': return list.filter(d => d.capacitacaoDestino === 'Não Iniciou');
            case 'CD1': return list.filter(d => d.capacitacaoDestino === 'Nível 1');
            case 'CD2': return list.filter(d => d.capacitacaoDestino === 'Nível 2');
            case 'CD3': return list.filter(d => d.capacitacaoDestino === 'Nível 3' || d.capacitacaoDestino === 'Concluído');
            default: return list;
        }
    };

    const statDetailsList = useMemo(() => {
        return selectedStat ? getStatData(selectedStat, baseFilteredList) : baseFilteredList;
    }, [selectedStat, baseFilteredList]);

    const shouldShowList = useMemo(() => {
        return selectedStat !== null || filterGender !== null || filterAge !== null || searchTerm !== '';
    }, [selectedStat, filterGender, filterAge, searchTerm]);

    const getDashboardValue = (key: string): number => {
        let type = key.toUpperCase();
        if (type === 'TOTAL') type = 'TODOS';
        if (type === 'REAL144') type = 'REAL_144';
        if (type === 'BATIZADOS') type = 'BATIZADO';
        if (type === 'NAOBATIZADOS') type = 'NAO_BATIZADO';
        if (type === 'NAOINICIOUUV') type = 'NAO_INICIOU_UV';
        if (type === 'NAOINICIOUCD') type = 'NAO_INICIOU_CD';
        
        return getStatData(type, baseFilteredList).length;
    };

    const getFilterCount = (type: string, value: string) => {
        // Here we only filter by search to show how many people match the search in that category
        const listWithSearch = networkDisciples.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return listWithSearch.filter(p => {
            if (type === 'sexo') return p.sexo === value;
            if (type === 'age') {
                const age = calculateAge(p.nascimento);
                if (value === '0-12') return age <= 12;
                if (value === '13-17') return age >= 13 && age <= 17;
                if (value === '18-25') return age >= 18 && age <= 25;
                if (value === '26-40') return age >= 26 && age <= 40;
                if (value === '41-60') return age >= 41 && age <= 60;
                if (value === '60+') return age > 60;
            }
            return false;
        }).length;
    };

    const getSupervisorName = (id?: UserId | null) => {
        if (!id) return 'N/A';
        const supervisor = usersDb.find(u => u.id === id);
        return supervisor ? supervisor.name : 'N/A';
    };

    const loadUsuarios = async () => {
        if (LOCAL_TEST_MODE) {
            const localLeaders = INITIAL_USERS.map(normalizeLocalUser).filter(u => u.role !== 'DISCIPULO');
            const localDisciples = INITIAL_DISCIPLES.map(normalizeLocalUser).filter(u => u.role === 'DISCIPULO');
            setUsersDb(localLeaders);
            setDisciplesDb(localDisciples);
            return;
        }
        try {
            const usuarios = await usuarioService.listar();
            const leaders = usuarios.filter(u => u.role !== 'DISCIPULO');
            const disciples = usuarios.filter(u => u.role === 'DISCIPULO');
            setUsersDb(leaders);
            setDisciplesDb(disciples);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const loadDashboardStats = async () => {
        if (LOCAL_TEST_MODE) {
            setDashboardStats(null);
            return;
        }
        try {
            const stats = await dashboardService.obterEstatisticas();
            setDashboardStats(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas do dashboard:', error);
            setDashboardStats(null);
        }
    };

    useEffect(() => {
        if (user && !isLoading) {
            Promise.all([loadUsuarios(), loadDashboardStats()]);
            if (view === 'login') {
                setView('dashboard');
            }
        }
    }, [user, isLoading]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        try {
            await login(loginEmail, loginPassword);
            setLoginEmail('');
            setLoginPassword('');
        } catch (error: any) {
            console.error('Erro no login:', error);
            setLoginError(error.response?.data?.message || t.messages.loginError);
        }
    };

    const handleDelete = async (id: UserId) => { 
        try {
            await usuarioService.deletar(id);
            await Promise.all([loadUsuarios(), loadDashboardStats()]);
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            alert('Erro ao deletar usuário. Tente novamente.');
        }
    };

    const handleExportarRelatorio = async () => {
        if (LOCAL_TEST_MODE) {
            alert('Exportação indisponível no modo local sem backend.');
            return;
        }
        try {
            const blob = await usuarioService.exportarRelatorioCSV();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            const stamp = new Date().toISOString().slice(0, 10);
            anchor.href = url;
            anchor.download = `relatorio-usuarios-${stamp}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            alert('Não foi possível exportar o relatório.');
        }
    };

    const handleAbrirImportacao = () => {
        excelInputRef.current?.click();
    };

    const handleBaixarModelo = async () => {
        try {
            await usuarioService.baixarModeloImportacao();
        } catch (error) {
            console.error('Erro ao baixar modelo:', error);
            alert('Não foi possível baixar o modelo de importação.');
        }
    };

    const handleImportarExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (LOCAL_TEST_MODE) {
            alert('Importação indisponível no modo local sem backend.');
            return;
        }
        try {
            setIsImportingExcel(true);
            const resultado = await usuarioService.importarExcel(file);
            await Promise.all([loadUsuarios(), loadDashboardStats()]);
            const resumo = [
                `Total de linhas: ${resultado.totalLinhas}`,
                `Criados: ${resultado.criados}`,
                `Erros: ${resultado.erros.length}`,
            ];
            if (resultado.erros.length > 0) {
                const preview = resultado.erros.slice(0, 5).map((e) => `Linha ${e.linha}: ${e.motivo}`).join('\n');
                resumo.push('', 'Primeiros erros:', preview);
            }
            alert(resumo.join('\n'));
        } catch (error) {
            console.error('Erro ao importar Excel:', error);
            alert('Não foi possível importar o Excel. Verifique o arquivo e tente novamente.');
        } finally {
            setIsImportingExcel(false);
        }
    };
    
    const openForm = (type: string, item: UserType | null = null) => {
        setFormType(type as Role);
        setEditingItem(item);
        setActivityLevel(item?.atividade || 3);
        const initial = Array.isArray(item?.ministerios) && item!.ministerios!.length > 0
            ? item!.ministerios!
            : (item?.ministerio ? [item.ministerio] : []);
        setSelectedMinisterios(initial);
        setView('form');
        setShowFormPassword(false);
    };

    const toggleMinisterio = (nome: string) => {
        setSelectedMinisterios((prev) => prev.includes(nome)
            ? prev.filter((m) => m !== nome)
            : [...prev, nome]);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData) as any;
        const payload: Partial<UserType> = {
            name: data.name,
            contato: data.contato,
            nascimento: data.nascimento,
            sexo: data.sexo,
            ministerio: selectedMinisterios[0] || '',
            ministerios: selectedMinisterios,
            email: data.email || (data.name.split(' ')[0] + '@alianca.com').toLowerCase(),
            senha: data.senha || '123456',
            role: formType === 'DISCIPULO' ? 'DISCIPULO' : formType,
            pastorId: data.pastorId || null,
            discipuladorId: data.discipuladorId || null,
            g12: data.tipo_discipulo === 'G12',
            batizado: data.batizado_select === 'Sim',
            universidadeDaVida: data.universidade_vida || 'Não',
            capacitacaoDestino: data.capacitacao_destino || 'Não Iniciou',
            atividade: parseInt(data.atividade)
        };
        try {
            if (editingItem) {
                const roleChanged = editingItem.role !== payload.role;
                const { role, ...updatePayload } = payload;
                await usuarioService.atualizar(editingItem.id, updatePayload);
                if (roleChanged && role) {
                    await usuarioService.promover(editingItem.id, role);
                }
            } else {
                await usuarioService.criar(payload);
            }
            await Promise.all([loadUsuarios(), loadDashboardStats()]);
            if (formType === 'PASTOR') setView('pastors');
            else if (formType === 'DISCIPULADOR') setView('leaders');
            else setView('disciples');
            setEditingItem(null);
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            alert(error.response?.data?.message || t.messages.saveError);
        }
    };

    const getActivityLabel = (level: number) => { 
        switch (level) { 
            case 1: return t.activityLabels.leftChurch; 
            case 2: return t.activityLabels.inactive; 
            case 3: return t.activityLabels.neutral; 
            case 4: return t.activityLabels.active; 
            case 5: return t.activityLabels.extremelyActive; 
            default: return t.activityLabels.neutral; 
        } 
    };

    const renderForm = () => {
        if (!user) return null;
        const isEdit = !!editingItem;
        let supervisorOptions: UserType[] = [];
        let supervisorLabel = '';
        let supervisorField = '';
        if (formType === 'PASTOR') {
            supervisorLabel = 'Pastor Supervisor (ADM)';
            supervisorField = 'pastorId';
            supervisorOptions = usersDb.filter(u => u.role === 'ADM');
        } else if (formType === 'DISCIPULADOR') {
            supervisorLabel = 'Pastor Supervisor';
            supervisorField = 'pastorId';
            if (user.role === 'ADM') supervisorOptions = usersDb.filter(u => u.role === 'PASTOR');
            else if (user.role === 'PASTOR') supervisorOptions = [user];
        } else if (formType === 'DISCIPULO') {
            supervisorLabel = 'Líder / Discipulador';
            supervisorField = 'discipuladorId';
            if (user.role === 'ADM') {
                supervisorOptions = usersDb.filter(u => u.role === 'ADM' || u.role === 'PASTOR' || u.role === 'DISCIPULADOR');
            } else if (user.role === 'PASTOR') {
                supervisorOptions = [{ ...user, name: `${user.name} (G12 Direto)` }, ...usersDb.filter(u => u.role === 'DISCIPULADOR' && u.pastorId === user.id)];
            } else if (user.role === 'DISCIPULADOR') {
                supervisorOptions = [user];
            }
        }
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6 md:mb-8"><div><h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">{isEdit ? 'Editar Registro' : 'Novo Cadastro'}</h2><p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm md:text-base">Preencha as informações do {formType === 'DISCIPULADOR' ? 'Líder' : formType === 'PASTOR' ? 'Pastor' : 'Discípulo'}</p></div><button onClick={() => setView('dashboard')} className="p-3 hover:bg-white hover:shadow-lg rounded-full transition-all text-gray-400 hover:text-gray-600"><X /></button></div>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-100/50 dark:shadow-none">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informações Pessoais</h3>
                            <div className="flex flex-wrap gap-2 justify-end">
                                {isEdit && formType === 'DISCIPULO' && (user.role === 'ADM' || user.role === 'PASTOR') && (<button type="button" onClick={() => setFormType('DISCIPULADOR')} className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"><Medal size={14} /> Promover a Líder</button>)}
                                {isEdit && formType === 'DISCIPULADOR' && user.role === 'ADM' && (<button type="button" onClick={() => setFormType('PASTOR')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition"><Crown size={14} /> Promover a Pastor</button>)}
                                {isEdit && formType === 'PASTOR' && user.role === 'ADM' && (<button type="button" onClick={() => setFormType('DISCIPULADOR')} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition border border-red-100 dark:border-red-900/30"><ArrowDown size={14} /> Rebaixar a Líder</button>)}
                                {isEdit && formType === 'DISCIPULADOR' && (user.role === 'ADM' || user.role === 'PASTOR') && (<button type="button" onClick={() => setFormType('DISCIPULO')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition"><ArrowDown size={14} /> Rebaixar a Discípulo</button>)}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.common.fullName}</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-sm md:text-base dark:text-white" placeholder={t.messages.namePlaceholder} /></div>
                            {(formType === 'PASTOR' || formType === 'DISCIPULADOR') && (
                                <>
                                    <div className={!isEdit ? "md:col-span-1" : "md:col-span-2"}>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.messages.emailLabel}</label>
                                        <input name="email" defaultValue={editingItem?.email} type="email" required className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-sm md:text-base dark:text-white" placeholder={t.messages.emailPlaceholder} />
                                    </div>
                                    {!isEdit && (
                                        <div className="md:col-span-1">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Senha de Acesso</label>
                                            <div className="relative">
                                                <input name="senha" type={showFormPassword ? "text" : "password"} required minLength={6} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-sm md:text-base dark:text-white" placeholder="Mínimo 6 caracteres" />
                                                <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition">{showFormPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">WhatsApp</label><input name="contato" defaultValue={editingItem?.contato} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-sm md:text-base dark:text-white" placeholder={t.messages.phonePlaceholder} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.form.birth}</label><input type="date" name="nascimento" defaultValue={editingItem?.nascimento} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-600 dark:text-gray-300 text-sm md:text-base" /></div>
                            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.form.gender}</label><select name="sexo" defaultValue={editingItem?.sexo || 'M'} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-600 dark:text-gray-300 cursor-pointer text-sm md:text-base"><option value="M">{t.form.male}</option><option value="F">{t.form.female}</option></select></div>
                        </div>
                        {(formType !== 'ADM' && (formType === 'DISCIPULADOR' || formType === 'DISCIPULO' || (formType === 'PASTOR' && user.role === 'ADM'))) && (
                            <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-50 dark:border-slate-700"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{t.form.hierarchy}</h3><div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{supervisorLabel}</label><select name={supervisorField} defaultValue={editingItem?.[supervisorField as keyof UserType] as string} required={formType !== 'PASTOR'} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-600 dark:text-gray-300 cursor-pointer text-sm md:text-base"><option value="">{t.form.selectOption}</option>{supervisorOptions.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}</select></div></div>
                        )}
                        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-50 dark:border-slate-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{t.form.ecclesialLife}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><div className="flex justify-between items-center mb-2 ml-1"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t.form.activityLevel}</label><span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{getActivityLabel(activityLevel)}</span></div><input type="range" name="atividade" min="1" max="5" step="1" value={activityLevel} onChange={(e) => setActivityLevel(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" /><div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1"><span>{t.form.left}</span><span>{t.form.extremelyActive}</span></div></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.form.baptized}</label><select name="batizado_select" defaultValue={editingItem?.batized ? 'Sim' : 'Não'} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-600 dark:text-gray-300 cursor-pointer text-sm md:text-base"><option value="Não">{t.form.no}</option><option value="Sim">{t.form.yes}</option></select></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.form.universityOfLife}</label><select name="universidade_vida" defaultValue={editingItem?.universidadeDaVida || 'Não'} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-600 dark:text-gray-300 cursor-pointer text-sm md:text-base"><option value="Não">{t.form.no}</option><option value="Cursando">{t.form.inProgress}</option><option value="Sim">{t.form.yes}</option></select></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.form.destinationTraining}</label><select name="capacitacao_destino" defaultValue={editingItem?.capacitacaoDestino || 'Não Iniciou'} className="w-full px-5 py-3 md:py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-600 dark:text-gray-300 cursor-pointer text-sm md:text-base"><option value="Não Iniciou">{t.form.notStarted}</option><option value="Nível 1">{t.form.level1}</option><option value="Nível 2">{t.form.level2}</option><option value="Nível 3">{t.form.level3}</option><option value="Concluído">{t.form.completed}</option></select></div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">{t.form.ministry}</label>
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-4 flex flex-wrap gap-2">
                                        {MINISTERIOS_OPTIONS.map((m) => {
                                            const ativo = selectedMinisterios.includes(m);
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => toggleMinisterio(m)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition transform active:scale-95 ${ativo
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                                        : 'bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-500'}`}
                                                >
                                                    {ativo && <Check size={14} className="inline mr-1 -mt-0.5" />}
                                                    {m}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedMinisterios.length > 0 && (
                                        <p className="text-xs text-gray-400 mt-2 ml-1">{selectedMinisterios.length} selecionado(s)</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pb-10 md:pb-0"><button type="button" onClick={() => setView('dashboard')} className="px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-sm md:text-base">{t.form.cancel}</button><button type="submit" className="px-8 md:px-10 py-3 md:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition transform active:scale-95 text-sm md:text-base">{t.form.saveRecord}</button></div>
                </form>
            </div>
        );
    };

    if (!user) {
        if (isLoading) {
            return (
                <div className={darkMode ? "dark" : ""}>
                    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-6 font-sans">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{t.messages.loading}</p>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className={darkMode ? "dark" : ""}>
                <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-6 font-sans app-container">
                    <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 dark:shadow-none w-full max-w-lg text-center border border-white dark:border-slate-700 relative">
                        <div className="absolute top-6 right-6 flex gap-1.5">
                            <button onClick={() => setLanguage('pt')} className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all transform hover:scale-110 ${language === 'pt' ? 'ring-3 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800 shadow-lg scale-110' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`} title="Português"><img src="https://flagcdn.com/w40/br.png" alt="Brasil" className="w-full h-full object-cover" /></button>
                            <button onClick={() => setLanguage('es')} className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all transform hover:scale-110 ${language === 'es' ? 'ring-3 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800 shadow-lg scale-110' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`} title="Español"><img src="https://flagcdn.com/w40/es.png" alt="España" className="w-full h-full object-cover" /></button>
                            <button onClick={() => setLanguage('en')} className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all transform hover:scale-110 ${language === 'en' ? 'ring-3 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800 shadow-lg scale-110' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`} title="English"><img src="https://flagcdn.com/w40/us.png" alt="Estados Unidos" className="w-full h-full object-cover" /></button>
                        </div>
                        <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8 shadow-xl shadow-blue-500/30 rotate-3 transform hover:rotate-6 transition duration-500 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-black p-1"><img src={shepherLogo} alt="Logo Ministério Aliança" className="w-full h-full object-contain" /></div>
                        <div className="mb-8 md:mb-10 space-y-2"><h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{t.login.title}</h1><p className="text-gray-400 font-medium text-sm md:text-base pt-2">{t.login.subtitle}</p></div>
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-left ml-1">{t.login.email}</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={20} /></div><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-800 dark:text-white" placeholder="seu@email.com" /></div></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-left ml-1">{t.login.password}</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={20} /></div><input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-200 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 rounded-2xl outline-none transition-all font-medium text-gray-800 dark:text-white" placeholder="••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>
                            </div>
                            {loginError && (<div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl text-sm font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-2"><X size={16} /> {loginError}</div>)}
                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2">{t.login.button} <ArrowUpRight size={20} /></button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    const NavItem = ({ id, icon: Icon, label, color }: any) => {
        const isActive = view === id;
        const baseColor = color || 'blue';
        const activeBg = { 'blue': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', 'amber': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' }[baseColor as string] || 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
        return (<button onClick={() => { setView(id); setSearchTerm(''); setMobileMenuOpen(false); setSelectedLeader(null); setSelectedPastor(null); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive ? `${activeBg} shadow-sm ring-1 ring-inset ring-gray-900/5 dark:ring-white/10` : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-gray-300'}`}><Icon size={22} className={isActive ? 'fill-current opacity-20' : ''} /> {label}</button>);
    };

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="min-h-screen bg-white dark:bg-slate-900 flex font-sans text-gray-800 dark:text-gray-100 selection:bg-blue-100 selection:text-blue-900 app-container transition-colors duration-300">
                {mobileMenuOpen && (<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden print-hidden" onClick={() => setMobileMenuOpen(false)} />)}
                <aside className={`fixed lg:static inset-y-0 left-0 z-[60] w-80 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 transform transition-transform duration-300 lg:transform-none shadow-2xl lg:shadow-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} print-hidden`}>
                    <div className="p-8 h-full flex flex-col">
                        <div className="flex items-center gap-4 text-blue-700 dark:text-blue-400 mb-12 px-2"><div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30 bg-black p-1 flex-shrink-0"><img src={shepherLogo} alt="Logo" className="w-full h-full object-contain" /></div><div><span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white block leading-none">Aliança</span><span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Dashboard</span></div></div>
                        <nav className="space-y-3">
                            <NavItem id="dashboard" icon={LayoutDashboard} label={t.menu.dashboard} />
                            <NavItem id="analytics" icon={BarChart2} label={t.menu.analytics} />
                            {user.role === 'ADM' && <NavItem id="pastors" icon={Crown} label={t.menu.pastors} />}
                            {(user.role === 'ADM' || user.role === 'PASTOR') && <NavItem id="leaders" icon={Briefcase} label={t.menu.leaders} />}
                            <NavItem id="disciples" icon={Users} label={t.menu.disciples} />
                            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-700"><p className="px-6 text-xs font-bold text-gray-300 dark:text-gray-500 uppercase tracking-widest mb-4">{t.menu.tools}</p><NavItem id="study_prep" icon={BookOpen} label={t.menu.study} color="amber" /></div>
                        </nav>
                        <div className="pt-6 border-t border-gray-100 dark:border-slate-700 mt-auto flex flex-col gap-2">
                            <div className="relative px-6 py-3"><div className="flex gap-3 items-center"><Languages size={16} className="text-gray-400" /><div className="flex gap-1.5"><button onClick={() => setLanguage('pt')} className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center transition-all transform hover:scale-110 ${language === 'pt' ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`} title="Português"><img src="https://flagcdn.com/w40/br.png" alt="Brasil" className="w-full h-full object-cover" /></button><button onClick={() => setLanguage('es')} className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center transition-all transform hover:scale-110 ${language === 'es' ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`} title="Español"><img src="https://flagcdn.com/w40/es.png" alt="España" className="w-full h-full object-cover" /></button><button onClick={() => setLanguage('en')} className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center transition-all transform hover:scale-110 ${language === 'en' ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`} title="English"><img src="https://flagcdn.com/w40/us.png" alt="Estados Unidos" className="w-full h-full object-cover" /></button></div></div></div>
                            <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-3 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition px-6 py-2 group">{darkMode ? <Sun size={20} /> : <Moon size={20} />}<span className="text-sm font-bold">{darkMode ? t.menu.lightMode : t.menu.darkMode}</span></button>
                            <button onClick={() => logout()} className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition px-6 py-2 group"><LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> <span className="text-sm font-bold">{t.menu.logout}</span></button>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 p-4 lg:p-10 h-dvh overflow-y-auto scroll-smooth">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12 print-hidden">
                        <div className="flex items-center gap-4 w-full md:w-auto"><button onClick={() => setMobileMenuOpen(true)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition"><Menu /></button><div><h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t.common.hello}, {user.name.split(' ')[0]} <span className="text-3xl md:text-4xl inline-block hover:animate-spin">👋</span></h1><p className="text-gray-400 font-medium text-sm md:text-base">{t.common.welcomeMessage}</p></div></div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-5 w-full md:w-auto bg-white dark:bg-slate-800 p-2 rounded-[1.5rem] shadow-sm border border-gray-100/50 dark:border-slate-700">
                            <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportarExcel} />
                            {(user.role === 'ADM' || user.role === 'PASTOR') && (<button onClick={handleExportarRelatorio} className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2" title="Exportar relatório CSV"><ArrowDown size={14} /> Exportar CSV</button>)}
                            {user.role === 'ADM' && (
                                <>
                                    <button onClick={handleBaixarModelo} className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2" title="Baixar modelo de importação"><FileDown size={14} /> {t.common.downloadTemplate}</button>
                                    <button onClick={handleAbrirImportacao} disabled={isImportingExcel} className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60" title="Importar usuários por Excel"><Upload size={14} /> {isImportingExcel ? 'Importando...' : 'Importar Excel'}</button>
                                </>
                            )}
                            <div className="flex items-center gap-3 px-4 py-2 w-full sm:w-auto justify-end sm:justify-start"><div className="text-right hidden sm:block"><p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{user.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.role}</p></div><AvatarPlaceholder name={user.name} size="md" /></div>
                        </div>
                    </header>
                    {view === 'leaders' && (
                        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                            <div className="flex justify-between items-end">
                                {selectedLeader ? (<div><button onClick={() => setSelectedLeader(null)} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition"><ArrowLeft size={18} /> {t.common.backToList}</button><h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3"><FolderOpen className="text-blue-600 dark:text-blue-400" size={28} /> {t.pages.leaders.cellOf} {selectedLeader.name.split(' ')[0]}</h2><p className="text-gray-400 font-medium">{t.common.viewing} {statDetailsList.length} {t.pages.leaders.viewingDisciples}</p></div>) : (<div><h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t.pages.leaders.title}</h2><p className="text-gray-400 font-medium">{t.pages.leaders.subtitle}</p></div>)}
                                {!selectedLeader && (user.role === 'ADM' || user.role === 'PASTOR') && (<button onClick={() => openForm('DISCIPULADOR')} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 dark:shadow-none transition transform active:scale-95 hover:-translate-y-1"><Plus size={20} /> {t.common.addNew}</button>)}
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
                                <div className="hidden md:block overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50/50 dark:bg-slate-700/50 text-gray-400 text-xs uppercase font-bold tracking-widest"><tr><th className="px-8 py-6">{t.users.name}</th><th className="px-6 py-6">{t.common.position}</th><th className="px-6 py-6">{t.common.supervision}</th><th className="px-8 py-6 text-right">{t.common.actions}</th></tr></thead><tbody className="divide-y divide-gray-50 dark:divide-slate-700">{(selectedLeader ? statDetailsList : networkDisciples.filter(u => u.role === 'DISCIPULADOR' || (u.pastorId === user.id && u.role === 'DISCIPULADOR'))).map((item) => (<tr key={item.id} className="group hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition"><td className="px-8 py-5"><div className="flex items-center gap-5"><AvatarPlaceholder name={item.name} size="md" /><div><p className="font-bold text-gray-800 dark:text-white text-sm">{item.name}</p><p className="text-xs text-gray-400">{item.email || t.users.noEmail}</p></div></div></td><td className="px-6 py-5"><Badge type={item.role}>{item.role}</Badge></td><td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">{getSupervisorName(item.discipuladorId || item.pastorId)}</td><td className="px-8 py-5 text-right"><div className="flex justify-end gap-2">{!selectedLeader && (<button onClick={() => setSelectedLeader(item)} className="p-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md hover:shadow-lg tooltip" title="Ver Célula"><FolderOpen size={18} /></button>)}<button onClick={() => openForm(item.role, item)} className="p-2.5 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-700 hover:shadow-md rounded-xl transition"><Edit size={18} /></button></div></td></tr>))}</tbody></table></div>
                                <div className="md:hidden p-4 bg-gray-50/30 dark:bg-slate-900/30">{(selectedLeader ? statDetailsList : networkDisciples.filter(u => u.role === 'DISCIPULADOR')).map((item) => (<MobileUserCard key={item.id} item={item} view={view} openForm={openForm} handleDelete={handleDelete} user={user} getSupervisorName={getSupervisorName} onOpenCell={selectedLeader ? undefined : setSelectedLeader} />))}</div>
                            </div>
                        </div>
                    )}
                    {view === 'pastors' && (
                        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                             <div className="flex justify-between items-end">
                                {selectedPastor ? (<div><button onClick={() => setSelectedPastor(null)} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition"><ArrowLeft size={18} /> {t.common.backToList}</button><h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3"><FolderOpen className="text-blue-600 dark:text-blue-400" size={28} /> {t.pages.pastors.networkOf} {selectedPastor.name.split(' ')[0]}</h2><p className="text-gray-400 font-medium">{t.common.viewing} {statDetailsList.length} {t.pages.pastors.viewingDisciples}</p></div>) : (<div><h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t.pages.pastors.title}</h2><p className="text-gray-400 font-medium">{t.pages.pastors.subtitle}</p></div>)}
                                {!selectedPastor && (user.role === 'ADM') && (<button onClick={() => openForm('PASTOR')} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 dark:shadow-none transition transform active:scale-95 hover:-translate-y-1"><Plus size={20} /> {t.common.addNew}</button>)}
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
                                <div className="hidden md:block overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50/50 dark:bg-slate-700/50 text-gray-400 text-xs uppercase font-bold tracking-widest"><tr><th className="px-8 py-6">{t.users.name}</th><th className="px-6 py-6">{t.common.position}</th><th className="px-6 py-6">{t.common.supervision}</th><th className="px-8 py-6 text-right">{t.common.actions}</th></tr></thead><tbody className="divide-y divide-gray-50 dark:divide-slate-700">{(selectedPastor ? statDetailsList : networkDisciples.filter(u => u.role === 'PASTOR')).map((item) => (<tr key={item.id} className="group hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition"><td className="px-8 py-5"><div className="flex items-center gap-5"><AvatarPlaceholder name={item.name} size="md" /><div><p className="font-bold text-gray-800 dark:text-white text-sm">{item.name}</p><p className="text-xs text-gray-400">{item.email || t.users.noEmail}</p></div></div></td><td className="px-6 py-5"><Badge type={item.role}>{item.role}</Badge></td><td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">{getSupervisorName(item.pastorId)}</td><td className="px-8 py-5 text-right"><div className="flex justify-end gap-2">{!selectedPastor && (<button onClick={() => setSelectedPastor(item)} className="p-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md hover:shadow-lg tooltip" title={t.tooltips.viewFullNetwork}><FolderOpen size={18} /></button>)}<button onClick={() => openForm(item.role, item)} className="p-2.5 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-700 hover:shadow-md rounded-xl transition"><Edit size={18} /></button></div></td></tr>))}</tbody></table></div>
                                <div className="md:hidden p-4 bg-gray-50/30 dark:bg-slate-900/30">{(selectedPastor ? statDetailsList : networkDisciples.filter(u => u.role === 'PASTOR')).map((item) => (<MobileUserCard key={item.id} item={item} view={view} openForm={openForm} handleDelete={handleDelete} user={user} getSupervisorName={getSupervisorName} onOpenCell={selectedPastor ? undefined : setSelectedPastor} />))}</div>
                            </div>
                        </div>
                    )}
                    {view === 'dashboard' && (
                        <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-0">
                            <div><h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 md:mb-5 flex items-center gap-2"><span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>{t.dashboard.personalFilters}</h3><div className="flex flex-col gap-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"><div className="bg-white dark:bg-slate-700 flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-600 flex-1 w-full shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all"><Search size={20} className="text-gray-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t.common.filterByName} className="bg-transparent outline-none text-sm font-medium text-gray-700 dark:text-white w-full placeholder-gray-400" /></div><div className="flex gap-4 md:gap-6"><StatCard title={t.dashboard.men} value={getFilterCount('sexo', 'M')} icon={User} colorBg="bg-blue-500" shadowColor="shadow-blue-200" onClick={() => { setFilterGender(filterGender === 'M' ? null : 'M'); setSelectedStat(null); setFilterAge(null); }} isSelected={filterGender === 'M'} /><StatCard title={t.dashboard.women} value={getFilterCount('sexo', 'F')} icon={User} colorBg="bg-pink-500" shadowColor="shadow-pink-200" onClick={() => { setFilterGender(filterGender === 'F' ? null : 'F'); setSelectedStat(null); setFilterAge(null); }} isSelected={filterGender === 'F'} /></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6"><StatCard title={t.dashboard.children} value={getFilterCount('age', '0-12')} icon={Smile} colorBg="bg-sky-400" shadowColor="shadow-sky-200" onClick={() => { setFilterAge(filterAge === '0-12' ? null : '0-12'); setSelectedStat(null); setFilterGender(null); }} isSelected={filterAge === '0-12'} /><StatCard title={t.dashboard.teens} value={getFilterCount('age', '13-17')} icon={User} colorBg="bg-orange-400" shadowColor="shadow-orange-200" onClick={() => { setFilterAge(filterAge === '13-17' ? null : '13-17'); setSelectedStat(null); setFilterGender(null); }} isSelected={filterAge === '13-17'} /><StatCard title={t.dashboard.young} value={getFilterCount('age', '18-25')} icon={Sparkles} colorBg="bg-yellow-400" colorText="text-gray-800" shadowColor="shadow-yellow-200" onClick={() => { setFilterAge(filterAge === '18-25' ? null : '18-25'); setSelectedStat(null); setFilterGender(null); }} isSelected={filterAge === '18-25'} /><StatCard title={t.dashboard.adults} value={getFilterCount('age', '26-40')} icon={Briefcase} colorBg="bg-indigo-500" shadowColor="shadow-indigo-200" onClick={() => { setFilterAge(filterAge === '26-40' ? null : '26-40'); setSelectedStat(null); setFilterGender(null); }} isSelected={filterAge === '26-40'} /><StatCard title={t.dashboard.middleAge} value={getFilterCount('age', '41-60')} icon={ShieldCheck} colorBg="bg-slate-500" shadowColor="shadow-slate-200" onClick={() => { setFilterAge(filterAge === '41-60' ? null : '41-60'); setSelectedStat(null); setFilterGender(null); }} isSelected={filterAge === '41-60'} /><StatCard title={t.dashboard.seniors} value={getFilterCount('age', '60+')} icon={Sun} colorBg="bg-purple-500" shadowColor="shadow-purple-200" onClick={() => { setFilterAge(filterAge === '60+' ? null : '60+'); setSelectedStat(null); setFilterGender(null); }} isSelected={filterAge === '60+'} /></div></div></div>
                            <div><h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 md:mb-5 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>{t.dashboard.statistics}</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6"><StatCard title={t.dashboard.g12Disciples} value={getDashboardValue('g12')} icon={Users} colorBg="bg-blue-600" shadowColor="shadow-blue-200" onClick={() => { setSelectedStat('G12'); }} isSelected={selectedStat === 'G12'} /><StatCard title={t.dashboard.cellDisciples} value={getDashboardValue('celula')} icon={User} colorBg="bg-emerald-500" shadowColor="shadow-emerald-200" onClick={() => { setSelectedStat('CELULA'); }} isSelected={selectedStat === 'CELULA'} /><StatCard title={t.dashboard.disciples144} value={getDashboardValue('real144')} icon={Network} colorBg="bg-purple-600" shadowColor="shadow-purple-200" onClick={() => { setSelectedStat('REAL_144'); }} isSelected={selectedStat === 'REAL_144'} /><StatCard title={t.dashboard.allDisciples} value={getDashboardValue('total')} icon={Globe} colorBg="bg-pink-600" shadowColor="shadow-pink-200" onClick={() => { setSelectedStat('TODOS'); }} isSelected={selectedStat === 'TODOS'} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"><StatCard title={t.dashboard.baptized} value={getDashboardValue('batizados')} icon={Book} colorBg="bg-violet-600" shadowColor="shadow-violet-200" onClick={() => { setSelectedStat('BATIZADO'); }} isSelected={selectedStat === 'BATIZADO'} /><StatCard title={t.dashboard.notBaptized} value={getDashboardValue('naoBatizados')} icon={User} colorBg="bg-red-500" shadowColor="shadow-red-200" onClick={() => { setSelectedStat('NAO_BATIZADO'); }} isSelected={selectedStat === 'NAO_BATIZADO'} /></div></div>
                            <div><h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 md:mb-5 flex items-center gap-2"><span className="w-2 h-6 bg-amber-500 rounded-full inline-block"></span>{t.dashboard.growthTrack}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6"><StatCard title={t.dashboard.uv} value={getDashboardValue('uv')} icon={GraduationCap} colorBg="bg-lime-400" shadowColor="shadow-lime-200" onClick={() => { setSelectedStat('UV'); }} isSelected={selectedStat === 'UV'} /><StatCard title={t.dashboard.notStartedUV} value={getDashboardValue('naoIniciouUV')} icon={Book} colorBg="bg-red-500" shadowColor="shadow-red-200" onClick={() => { setSelectedStat('NAO_INICIOU_UV'); }} isSelected={selectedStat === 'NAO_INICIOU_UV'} /></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"><StatCard title={t.dashboard.cd1} value={getDashboardValue('cd1')} icon={Award} colorBg="bg-cyan-400" shadowColor="shadow-cyan-200" onClick={() => { setSelectedStat('CD1'); }} isSelected={selectedStat === 'CD1'} /><StatCard title={t.dashboard.cd2} value={getDashboardValue('cd2')} icon={Award} colorBg="bg-blue-600" shadowColor="shadow-blue-200" onClick={() => { setSelectedStat('CD2'); }} isSelected={selectedStat === 'CD2'} /><StatCard title={t.dashboard.cd3} value={getDashboardValue('cd3')} icon={Award} colorBg="bg-blue-900" shadowColor="shadow-blue-300" onClick={() => { setSelectedStat('CD3'); }} isSelected={selectedStat === 'CD3'} /><StatCard title={t.dashboard.notStartedCD} value={getDashboardValue('naoIniciouCD')} icon={Book} colorBg="bg-red-500" shadowColor="shadow-red-200" onClick={() => { setSelectedStat('NAO_INICIOU_CD'); }} isSelected={selectedStat === 'NAO_INICIOU_CD'} /></div></div>
                            <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-500"><div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center"><div className="flex items-center gap-3"><div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400"><ListFilter size={24} /></div><div><h3 className="font-bold text-gray-800 dark:text-white text-base md:text-lg">{selectedStat ? `${t.dashboard.details}: ${selectedStat}` : t.dashboard.memberList}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{shouldShowList ? `${t.dashboard.showingPeople} ${statDetailsList.length} ${t.dashboard.peopleWithFilters}` : t.dashboard.clickCardMessage}</p></div></div>{(selectedStat || filterGender || filterAge || searchTerm) && (<button onClick={() => { setSelectedStat(null); setFilterGender(null); setFilterAge(null); setSearchTerm(''); }} className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"><X size={16} /> {t.dashboard.clearAll}</button>)}</div><div className="overflow-x-auto max-h-[400px] overflow-y-auto">{shouldShowList ? (statDetailsList.length > 0 ? (<table className="w-full text-left"><thead className="bg-gray-50/50 dark:bg-slate-700/50 text-gray-400 text-xs uppercase font-bold tracking-widest sticky top-0 z-10 backdrop-blur-sm"><tr><th className="px-6 py-4">{t.users.name}</th><th className="px-6 py-4">{t.common.position}</th><th className="px-6 py-4">{t.common.supervision}</th><th className="px-6 py-4 text-right">{t.common.action}</th></tr></thead><tbody className="divide-y divide-gray-50 dark:divide-slate-700">{statDetailsList.map((item) => (<tr key={item.id} className="hover:bg-blue-50/10 dark:hover:bg-slate-700/30 transition"><td className="px-6 py-3"><div className="flex items-center gap-3"><AvatarPlaceholder name={item.name} size="sm" /><div><span className="font-medium text-sm text-gray-700 dark:text-gray-200 block">{item.name}</span>{item.nascimento && <span className="text-[10px] text-gray-400">{calculateAge(item.nascimento)} {t.users.years}</span>}</div></div></td><td className="px-6 py-3"><Badge type={item.role}>{item.role}</Badge></td><td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{getSupervisorName(item.discipuladorId || item.pastorId)}</td><td className="px-6 py-3 text-right"><button onClick={() => openForm(item.role, item)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"><Edit size={16} /></button></td></tr>))}</tbody></table>) : (<div className="p-10 text-center text-gray-400"><p>{t.dashboard.noPersonFound}</p></div>)) : (<div className="p-12 flex flex-col items-center justify-center text-gray-400 opacity-60"><Activity size={48} className="mb-4 text-gray-300 dark:text-slate-600" /><p className="text-sm font-medium">{t.dashboard.selectStatMessage}</p></div>)}</div></div>
                        </div>
                    )}
                    {view === 'analytics' && (<div className="space-y-8 animate-in fade-in duration-500 pb-20"><div className="flex justify-between items-end mb-4"><div><h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t.dashboard.visualAnalysis}</h2><p className="text-gray-400 font-medium">{t.dashboard.detailedIndicators}</p></div></div><DashboardCharts data={networkDisciples} filteredData={statDetailsList} /></div>)}
                    {view === 'form' && renderForm()}
                    {view === 'study_prep' && <PreparacaoEstudo />}
                    {(view === 'disciples') && (
                        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-10"><div><h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t.dashboard.discipleManagement}</h2><p className="text-gray-400 font-medium mt-2 text-sm md:text-base">{t.dashboard.manageNetwork}</p></div>{user.role === 'ADM' || user.role === 'PASTOR' || user.role === 'DISCIPULADOR' ? (<button onClick={() => openForm('DISCIPULO')} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition transform active:scale-95 hover:-translate-y-1"><Plus size={20} /> {t.common.addNew}</button>) : null}</div>
                            <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-100/50 dark:shadow-none overflow-hidden">
                                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4 bg-gray-50/30 dark:bg-slate-700/30"><div className="bg-white dark:bg-slate-700 flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-600 flex-1 w-full shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all"><Search size={20} className="text-gray-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t.common.filterByName} className="bg-transparent outline-none text-sm font-medium text-gray-700 dark:text-white w-full placeholder-gray-400" /></div></div>
                                <div className="hidden md:block overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50/50 dark:bg-slate-700/50 text-gray-400 text-xs uppercase font-bold tracking-widest"><tr><th className="px-8 py-6">{t.users.name}</th><th className="px-6 py-6">{t.common.position}</th><th className="px-6 py-6">{t.common.supervision}</th><th className="px-8 py-6 text-right">{t.common.actions}</th></tr></thead><tbody className="divide-y divide-gray-50 dark:divide-slate-700">{disciplesList.map((item) => (<tr key={item.id} className="group hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition"><td className="px-8 py-5"><div className="flex items-center gap-5"><AvatarPlaceholder name={item.name} size="md" /><div><p className="font-bold text-gray-800 dark:text-white text-sm">{item.name}</p><p className="text-xs text-gray-400">{item.email || t.users.noEmail}</p></div></div></td><td className="px-6 py-5"><Badge type={item.role}>{item.role}</Badge></td><td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">{getSupervisorName(item.discipuladorId || item.pastorId)}</td><td className="px-8 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => openForm(item.role, item)} className="p-2.5 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-700 hover:shadow-md rounded-xl transition"><Edit size={18} /></button></div></td></tr>))}</tbody></table></div>
                                <div className="md:hidden p-4 bg-gray-50/30 dark:bg-slate-900/30">{disciplesList.map((item) => (<MobileUserCard key={item.id} item={item} view={view} openForm={openForm} handleDelete={handleDelete} user={user} getSupervisorName={getSupervisorName} onOpenCell={() => { }} />))}</div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}