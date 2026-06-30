import React, { useMemo } from 'react';
import {
    Users, Activity, Heart, User, GraduationCap, Award, Church
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { User as UserType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardChartsProps {
    data: UserType[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
    const { t } = useLanguage();
    const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    
    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;

        const total = data.length || 1;
        
        // Calculate average age (idade real pela data completa, consistente com os cards de faixa etária)
        const ages = data.map(p => {
            if (!p.nascimento) return null;
            const birthDate = new Date(p.nascimento);
            if (isNaN(birthDate.getTime())) return null;
            const diff = Date.now() - birthDate.getTime();
            return Math.abs(new Date(diff).getUTCFullYear() - 1970);
        }).filter((age): age is number => age !== null && !isNaN(age));
        
        const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;

        // Gender data (%)
        const genderData = [
            { name: t.charts.men, value: data.filter(p => p.sexo === 'M').length },
            { name: t.charts.women, value: data.filter(p => p.sexo === 'F').length }
        ];

        // Baptism data (%)
        const baptismData = [
            { name: t.dashboard.baptized, value: data.filter(p => p.batizado).length },
            { name: t.dashboard.notBaptized, value: data.filter(p => !p.batizado).length }
        ];

        // UV data (%)
        const uvData = [
            { name: t.charts.completedUV, value: data.filter(p => p.universidadeDaVida === 'Sim').length },
            { name: t.charts.notCompleted, value: data.filter(p => p.universidadeDaVida !== 'Sim').length }
        ];

        // CD data (%) - Percentage of total people in each level
        const cdData = [
            { name: 'CD 1', percentage: Number(((data.filter(p => p.capacitacaoDestino === 'Nível 1').length / total) * 100).toFixed(1)) },
            { name: 'CD 2', percentage: Number(((data.filter(p => p.capacitacaoDestino === 'Nível 2').length / total) * 100).toFixed(1)) },
            { name: 'CD 3', percentage: Number(((data.filter(p => p.capacitacaoDestino === 'Nível 3' || p.capacitacaoDestino === 'Concluído').length / total) * 100).toFixed(1)) }
        ];

        // Pessoas por Ministério — soma de todos os ministérios em que a pessoa participa.
        const ministerioCounts = new Map<string, number>();
        data.forEach((p) => {
            const lista = (p.ministerios && p.ministerios.length > 0)
                ? p.ministerios
                : (p.ministerio ? [p.ministerio] : []);
            const nomes = lista
                .map((m) => (typeof m === 'string' ? m : (m as any)?.nome))
                .map((m) => (m ?? '').toString().trim())
                .filter((m) => m.length > 0);
            if (nomes.length === 0) {
                ministerioCounts.set(t.charts.noMinistry, (ministerioCounts.get(t.charts.noMinistry) ?? 0) + 1);
                return;
            }
            nomes.forEach((nome) => {
                ministerioCounts.set(nome, (ministerioCounts.get(nome) ?? 0) + 1);
            });
        });
        const ministerioData = Array.from(ministerioCounts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { avgAge, genderData, baptismData, uvData, cdData, ministerioData };
    }, [data, t.charts.noMinistry]);

    if (!stats) return <div className="p-10 text-center text-gray-500">{t.charts.noDataAvailable}</div>;

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
      
        return (
          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
            {`${(percent * 100).toFixed(0)}%`}
          </text>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.charts.totalGeneral}</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{data.length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Activity size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.charts.averageAge}</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.avgAge} {t.users.years}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Heart size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.charts.activity}</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                            {((data.filter(p => p.atividade >= 4).length / (data.length || 1)) * 100).toFixed(0)}% {t.charts.active}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gender Percentage */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <User className="text-blue-500" size={20} /> {t.charts.genderDistribution}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={renderCustomizedLabel}
                                    labelLine={false}
                                >
                                    {stats.genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} ${t.charts.people}`, name]} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Baptism Status */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Heart className="text-emerald-500" size={20} /> {t.charts.baptismStatus}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.baptismData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={renderCustomizedLabel}
                                    labelLine={false}
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} ${t.charts.people}`]} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* UV Completion */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <GraduationCap className="text-amber-500" size={20} /> {t.charts.uvCompletion}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.uvData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={renderCustomizedLabel}
                                    labelLine={false}
                                >
                                    <Cell fill="#f59e0b" />
                                    <Cell fill="#94a3b8" />
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} ${t.charts.people}`]} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CD Levels */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Award className="text-indigo-500" size={20} /> {t.charts.cdLevels}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.cdData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} unit="%" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                    formatter={(value) => [`${value}%`, t.charts.completion]}
                                />
                                <Bar dataKey="percentage" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={45}>
                                    <LabelList dataKey="percentage" position="top" formatter={(val: any) => `${val}%`} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#6366f1' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* People per Ministry */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Church className="text-rose-500" size={20} /> {t.charts.byMinistry}
                    </h3>
                    {stats.ministerioData.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">{t.charts.noDataAvailable}</div>
                    ) : (
                        <div style={{ height: `${Math.max(220, stats.ministerioData.length * 40 + 40)}px` }} className="w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.ministerioData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                    <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={140} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }}
                                        formatter={(value: any) => [`${value} ${t.charts.people}`, t.charts.byMinistry]}
                                    />
                                    <Bar dataKey="value" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={22}>
                                        <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#f43f5e' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
