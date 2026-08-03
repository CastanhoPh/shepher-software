import React from 'react';
import { AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

/** Campos de cadastro que o filtro "Dados Pendentes" considera. */
export type CampoPendente = 'nascimento' | 'telefone';

/**
 * Diz quais campos de cadastro estao faltando.
 *
 * Fonte UNICA de verdade: o filtro "Dados Pendentes" (getStatData) e estes
 * indicadores usam esta mesma funcao, para nunca discordarem — seria confuso a
 * pessoa aparecer no filtro sem nenhum aviso, ou o contrario.
 *
 * Sexo nao entra: o adaptador do frontend preenche com 'M' quando o campo esta
 * vazio, entao "faltando" e indistinguivel de "masculino" nesta camada.
 */
export function pendenciasDe(item: Pick<User, 'nascimento' | 'contato'>): CampoPendente[] {
	const faltando: CampoPendente[] = [];
	if (!item.nascimento) faltando.push('nascimento');
	if (!item.contato) faltando.push('telefone');
	return faltando;
}

export function temPendencia(item: Pick<User, 'nascimento' | 'contato'>): boolean {
	return pendenciasDe(item).length > 0;
}

interface PendenciaBadgesProps {
	item: Pick<User, 'nascimento' | 'contato'>;
	/** 'inline' nas tabelas; 'chip' na faixa de etiquetas do card mobile. */
	variante?: 'inline' | 'chip';
}

/**
 * Mostra o que falta no cadastro da pessoa. Nao renderiza nada quando o
 * cadastro esta completo, entao pode ficar sempre visivel nas listas.
 */
export const PendenciaBadges: React.FC<PendenciaBadgesProps> = ({ item, variante = 'inline' }) => {
	const { t } = useLanguage();
	const faltando = pendenciasDe(item);

	if (faltando.length === 0) return null;

	const rotulo: Record<CampoPendente, string> = {
		nascimento: t.users.missingBirthdate,
		telefone: t.users.missingPhone,
	};

	if (variante === 'chip') {
		return (
			<>
				{faltando.map(campo => (
					<span
						key={campo}
						className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md"
					>
						{rotulo[campo]}
					</span>
				))}
			</>
		);
	}

	return (
		<span className="mt-1 flex flex-wrap items-center gap-1.5">
			{faltando.map(campo => (
				<span
					key={campo}
					className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md whitespace-nowrap"
				>
					<AlertCircle size={11} className="shrink-0" />
					{rotulo[campo]}
				</span>
			))}
		</span>
	);
};
