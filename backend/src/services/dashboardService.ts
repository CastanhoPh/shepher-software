import { AppError } from '@errors/AppError';
import { DashboardRepository } from '@repositories/dashboardRepository';

type Role = 'ADM' | 'PASTOR' | 'DISCIPULADOR' | 'DISCIPULO';

export class DashboardService {
	private readonly dashboardRepository = new DashboardRepository();

	async getEstatisticas(params: {
		userId: string;
		userRole: Role;
		filtro_genero?: unknown;
		filtro_idade_min?: unknown;
		filtro_idade_max?: unknown;
	}) {
		const { userId, userRole, filtro_genero, filtro_idade_min, filtro_idade_max } = params;

		const redeIds = await this.dashboardRepository.getRedeIds(userId, userRole);

		if (redeIds.length === 0) {
			return this.emptyStats();
		}

		const usuarios = await this.dashboardRepository.fetchBatchUsuarios(redeIds);

		const filtered = usuarios.filter((u) => {
			if (filtro_genero && u.genero !== filtro_genero) return false;

			if (filtro_idade_min || filtro_idade_max) {
				const idade = this.calcularIdade(u.dataNascimento);
				if (filtro_idade_min && idade < parseInt(filtro_idade_min as string, 10)) return false;
				if (filtro_idade_max && idade > parseInt(filtro_idade_max as string, 10)) return false;
			}

			return true;
		});

		const total = filtered.length;
		// G12 Diretos: quem tem o supervisorId igual ao meu ID, mas não sou eu
		const g12Diretos = filtered.filter((u) => u.id !== userId && u.supervisorId === userId).length;

		const batizados = filtered.filter((u) => u.batizado).length;
		const universidadeVida = filtered.filter((u) => u.universidadeVida).length;
		const cd1 = filtered.filter((u) => u.capacitacaoDestino1).length;
		const cd2 = filtered.filter((u) => u.capacitacaoDestino2).length;
		const cd3 = filtered.filter((u) => u.capacitacaoDestino3).length;

		const homens = filtered.filter((u) => u.genero === 'M').length;
		const mulheres = filtered.filter((u) => u.genero === 'F').length;

		const faixasEtarias: Record<string, number> = {
			'0-12': 0,
			'13-17': 0,
			'18-25': 0,
			'26-35': 0,
			'36-50': 0,
			'51+': 0,
		};

		filtered.forEach((u) => {
			const idade = this.calcularIdade(u.dataNascimento);
			if (idade <= 12) faixasEtarias['0-12']++;
			else if (idade <= 17) faixasEtarias['13-17']++;
			else if (idade <= 25) faixasEtarias['18-25']++;
			else if (idade <= 35) faixasEtarias['26-35']++;
			else if (idade <= 50) faixasEtarias['36-50']++;
			else faixasEtarias['51+']++;
		});

		// Para ADM ou PASTOR, "celula" são os discípulos diretos que não são líderes
		const celula = filtered.filter((u) => u.id !== userId && u.supervisorId === userId && u.funcao === 'DISCIPULO').length;

		return {
			totais: {
				discipulos: total,
				g12_diretos: g12Diretos,
				celula: userRole === 'DISCIPULADOR' ? total - 1 : celula,
				rede_completa: total,
			},
			espirituais: {
				batizados,
				universidade_vida: universidadeVida,
				capacitacao_destino_1: cd1,
				capacitacao_destino_2: cd2,
				capacitacao_destino_3: cd3,
			},
			demograficos: {
				homens,
				mulheres,
				faixas_etarias: faixasEtarias,
			},
		};
	}

	async getHierarquia(params: { userId: string }) {
		const { userId } = params;

		const usuarioDoc = await this.dashboardRepository.getUsuarioById(userId);
		if (!usuarioDoc.exists) {
			throw new AppError('Usuário não encontrado', 404);
		}

		const discipulosSnap = await this.dashboardRepository.getDiscipulosDiretos(userId);

		const discipuloIds = discipulosSnap.docs.map((d) => d.id);
		const contagens = await this.dashboardRepository.batchCountDiscipulos(discipuloIds);

		const discipulosDirectos = discipulosSnap.docs.map((doc) => {
			const d = doc.data();
			return {
				id: doc.id,
				nome: d.nome,
				email: d.email,
				funcao: d.funcao,
				fotoUrl: d.fotoUrl ?? null,
				total_discipulos: contagens[doc.id] ?? 0,
			};
		});

		const u = usuarioDoc.data()!;
		return {
			usuario: {
				id: userId,
				nome: u.nome,
				email: u.email,
				funcao: u.funcao,
				fotoUrl: u.fotoUrl ?? null,
			},
			discipulos_diretos: discipulosDirectos,
		};
	}

	private calcularIdade(dataNascimento: Date | null): number {
		if (!dataNascimento) return 0;
		const hoje = new Date();
		let idade = hoje.getFullYear() - dataNascimento.getFullYear();
		const mes = hoje.getMonth() - dataNascimento.getMonth();
		if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
			idade--;
		}
		return idade;
	}

	private emptyStats() {
		return {
			totais: { discipulos: 0, g12_diretos: 0, celula: 0, rede_completa: 0 },
			espirituais: {
				batizados: 0,
				universidade_vida: 0,
				capacitacao_destino_1: 0,
				capacitacao_destino_2: 0,
				capacitacao_destino_3: 0,
			},
			demograficos: {
				homens: 0,
				mulheres: 0,
				faixas_etarias: { '0-12': 0, '13-17': 0, '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0 },
			},
		};
	}
}
