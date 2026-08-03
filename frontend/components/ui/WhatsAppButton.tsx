import React from 'react';

/**
 * Converte o telefone cadastrado em um numero para o link do WhatsApp.
 *
 * Devolve null quando o numero nao da para usar — melhor desabilitar o botao do
 * que abrir uma conversa com a pessoa errada.
 *
 * Regras, tiradas dos dados reais da base:
 * - 11 digitos (DDD + celular) ou 10 (DDD + fixo): numero brasileiro, recebe o
 *   DDI 55. E o caso de praticamente todos os cadastros.
 * - 12 digitos ou mais: o numero JA traz DDI proprio e vai como esta. Existem
 *   membros com telefone da Venezuela (58...) e da Colombia (57...); prefixar
 *   55 neles geraria um numero inexistente.
 * - menos de 10 digitos: incompleto (ex.: sem DDD) -> invalido.
 */
export function telefoneParaWhatsApp(contato?: string | null): string | null {
	const digitos = (contato ?? '').replace(/\D/g, '');
	if (digitos.length >= 12) return digitos;
	if (digitos.length >= 10) return `55${digitos}`;
	return null;
}

interface WhatsAppButtonProps {
	/** Telefone como esta cadastrado, em qualquer formato. */
	contato?: string | null;
	/** Nome da pessoa, usado no rotulo de acessibilidade. */
	nome: string;
	/** 'md' nas tabelas (desktop), 'sm' nos cards (mobile). */
	tamanho?: 'sm' | 'md';
	/** Texto do tooltip quando ha numero. */
	titulo?: string;
	/** Texto do tooltip quando nao ha numero utilizavel. */
	tituloSemNumero?: string;
}

const IconeWhatsApp: React.FC<{ size: number }> = ({ size }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.297.348-.495.116-.198.058-.372-.058-.52-.116-.15-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
		<path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.9 11.9 0 0 0 5.71 1.447h.006c6.585 0 11.946-5.335 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411m-8.47 18.297h-.006a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.375a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.457-9.884 9.939-9.884a9.86 9.86 0 0 1 7.023 2.906 9.82 9.82 0 0 1 2.909 6.99c-.003 5.45-4.458 9.881-9.986 9.881" />
	</svg>
);

/**
 * Botao que abre a conversa do WhatsApp com a pessoa.
 *
 * Usa o link universal wa.me: no celular abre o app, no desktop abre o
 * WhatsApp Web ou o app instalado.
 */
export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
	contato,
	nome,
	tamanho = 'md',
	titulo,
	tituloSemNumero,
}) => {
	const numero = telefoneParaWhatsApp(contato);
	const icone = tamanho === 'md' ? 18 : 16;
	const base = tamanho === 'md' ? 'p-2.5 rounded-xl' : 'p-2 rounded-lg';

	if (!numero) {
		return (
			<span
				className={`${base} inline-flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-500 cursor-not-allowed`}
				title={tituloSemNumero ?? 'Sem telefone cadastrado'}
				aria-label={`${nome}: sem telefone cadastrado`}
			>
				<IconeWhatsApp size={icone} />
			</span>
		);
	}

	return (
		<a
			href={`https://wa.me/${numero}`}
			target="_blank"
			rel="noopener noreferrer"
			onClick={(e) => e.stopPropagation()}
			className={`${base} inline-flex items-center justify-center text-white bg-[#25D366] hover:bg-[#1DA851] transition shadow-md hover:shadow-lg`}
			title={titulo ? `${titulo} ${nome}` : `WhatsApp de ${nome}`}
			aria-label={`Abrir conversa no WhatsApp com ${nome}`}
		>
			<IconeWhatsApp size={icone} />
		</a>
	);
};
