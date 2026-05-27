import { auth, docToData, FieldValue, Timestamp } from '@infrastructure/firebase/client';
import { AppError } from '@errors/AppError';
import { signInWithEmailAndPassword } from '@infrastructure/firebase/auth';
import { UsuarioRepository } from '@repositories/usuarioRepository';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';

type Funcao = 'ADM' | 'PASTOR' | 'DISCIPULADOR' | 'DISCIPULO';

type ImportacaoErro = { linha: number; motivo: string };

export class UsuarioService {
	private readonly usuarioRepository = new UsuarioRepository();

	async exportarRelatorioCSV(params: {
		userId: string;
		userRole: Funcao;
		query: {
			funcao?: unknown;
			genero?: unknown;
			supervisor_id?: unknown;
			ministerio_id?: unknown;
			batizado?: unknown;
		};
	}) {
		const { userId, userRole, query } = params;

		if (userRole !== 'ADM' && userRole !== 'PASTOR') {
			throw new AppError('Apenas ADM e PASTOR podem exportar relatórios', 403);
		}

		const resultado = await this.list({
			userId,
			userRole,
			query: {
				...query,
				page: '1',
				limit: '10000',
			},
		});

		const headers = [
			'id',
			'nome',
			'email',
			'funcao',
			'telefone',
			'genero',
			'dataNascimento',
			'supervisorId',
			'supervisorNome',
			'ministerioId',
			'ministerioNome',
			'batizado',
			'g12',
			'universidadeVida',
			'capacitacaoDestino',
			'capacitacaoDestino1',
			'capacitacaoDestino2',
			'capacitacaoDestino3',
			'nivelAtividade',
			'ativo',
		];

		const linhas = resultado.data.map((u: any) => [
			u.id ?? '',
			u.nome ?? '',
			u.email ?? '',
			u.funcao ?? '',
			u.telefone ?? u.contato ?? '',
			u.genero ?? u.sexo ?? '',
			u.dataNascimento ? new Date(u.dataNascimento).toISOString().split('T')[0] : (u.nascimento ?? ''),
			u.supervisorId ?? u.pastorId ?? u.discipuladorId ?? '',
			u.supervisor?.nome ?? '',
			u.ministerioId ?? '',
			u.ministerio?.nome ?? u.ministerio ?? '',
			this.boolToText(u.batizado),
			this.boolToText(u.g12),
			this.boolToText(u.universidadeVida || u.universidadeDaVida === 'Sim'),
			u.capacitacaoDestino ?? '',
			this.boolToText(u.capacitacaoDestino1),
			this.boolToText(u.capacitacaoDestino2),
			this.boolToText(u.capacitacaoDestino3),
			u.nivelAtividade ?? u.atividade ?? '',
			this.boolToText(u.ativo),
		]);

		const csv = [headers, ...linhas]
			.map((linha) => linha.map((v) => this.escapeCsv(v)).join(','))
			.join('\n');

		return {
			filename: `relatorio-usuarios-${new Date().toISOString().slice(0, 10)}.csv`,
			content: csv,
			total: resultado.total,
		};
	}

	async gerarTemplateImportacao(): Promise<Buffer> {
		const colunas = [
			{
				nome: 'nome',
				obrigatorio: 'Sim',
				descricao: 'Nome completo do membro',
				aceita: 'Texto',
				exemplo: 'João Silva',
			},
			{
				nome: 'email',
				obrigatorio: 'Sim',
				descricao: 'Email do membro (único no sistema)',
				aceita: 'usuario@dominio.com',
				exemplo: 'joao@exemplo.com',
			},
			{
				nome: 'senha',
				obrigatorio: 'Obrigatória para ADM/PASTOR/DISCIPULADOR',
				descricao: 'Senha de acesso (mín. 6 caracteres). DISCIPULO não acessa o sistema; deixe em branco.',
				aceita: 'Texto',
				exemplo: 'Senha@123',
			},
			{
				nome: 'genero',
				obrigatorio: 'Sim',
				descricao: 'Gênero do membro',
				aceita: 'M ou F',
				exemplo: 'M',
			},
			{
				nome: 'funcao',
				obrigatorio: 'Não (padrão: DISCIPULO)',
				descricao: 'Função na igreja. ADM/PASTOR/DISCIPULADOR recebem login no sistema; DISCIPULO não.',
				aceita: 'ADM, PASTOR, DISCIPULADOR, DISCIPULO',
				exemplo: 'DISCIPULO',
			},
			{
				nome: 'telefone',
				obrigatorio: 'Não',
				descricao: 'Telefone de contato',
				aceita: 'Números/texto',
				exemplo: '11999990000',
			},
			{
				nome: 'dataNascimento',
				obrigatorio: 'Não',
				descricao: 'Data de nascimento',
				aceita: 'AAAA-MM-DD ou data nativa do Excel',
				exemplo: '1998-05-12',
			},
			{
				nome: 'supervisorId',
				obrigatorio: 'Não',
				descricao: 'ID (slug) do supervisor: pastor de um discipulador, discipulador de um discípulo.',
				aceita: 'ID já existente no sistema',
				exemplo: 'pastor-joao',
			},
			{
				nome: 'ministerio',
				obrigatorio: 'Não',
				descricao: 'Nome do ministério. Se não existir, é criado automaticamente. Use OU este OU ministerioId.',
				aceita: 'Texto',
				exemplo: 'Louvor',
			},
			{
				nome: 'ministerioId',
				obrigatorio: 'Não',
				descricao: 'ID de um ministério já existente. Use OU este OU ministerio.',
				aceita: 'ID já existente no sistema',
				exemplo: '',
			},
			{
				nome: 'batizado',
				obrigatorio: 'Não',
				descricao: 'Se o membro é batizado',
				aceita: 'true/false, sim/não, 1/0',
				exemplo: 'true',
			},
			{
				nome: 'universidadeVida',
				obrigatorio: 'Não',
				descricao: 'Concluiu a Universidade da Vida',
				aceita: 'true/false, sim/não, 1/0',
				exemplo: 'false',
			},
			{
				nome: 'capacitacaoDestino1',
				obrigatorio: 'Não',
				descricao: 'Concluiu Capacitação Destino Nível 1',
				aceita: 'true/false, sim/não, 1/0',
				exemplo: 'false',
			},
			{
				nome: 'capacitacaoDestino2',
				obrigatorio: 'Não',
				descricao: 'Concluiu Capacitação Destino Nível 2',
				aceita: 'true/false, sim/não, 1/0',
				exemplo: 'false',
			},
			{
				nome: 'capacitacaoDestino3',
				obrigatorio: 'Não',
				descricao: 'Concluiu Capacitação Destino Nível 3',
				aceita: 'true/false, sim/não, 1/0',
				exemplo: 'false',
			},
			{
				nome: 'nivelAtividade',
				obrigatorio: 'Não',
				descricao: 'Nível de engajamento do membro (1 = baixo, 5 = alto)',
				aceita: 'Número de 1 a 5',
				exemplo: '3',
			},
		];

		const headers = colunas.map((c) => c.nome);
		const exemplos = [
			[
				'João Silva',
				'joao@exemplo.com',
				'',
				'M',
				'DISCIPULO',
				'11999990000',
				'1998-05-12',
				'',
				'Louvor',
				'',
				'true',
				'false',
				'false',
				'false',
				'false',
				'3',
			],
			[
				'Maria Santos',
				'maria@exemplo.com',
				'Senha@123',
				'F',
				'DISCIPULADOR',
				'11999990001',
				'1992-09-20',
				'pastor-joao',
				'Consolidação',
				'',
				'true',
				'true',
				'true',
				'false',
				'false',
				'4',
			],
		];

		const wsDados = XLSX.utils.aoa_to_sheet([headers, ...exemplos]);
		colunas.forEach((col, idx) => {
			const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
			const cell = wsDados[cellRef];
			if (!cell) return;
			cell.c = [
				{
					a: 'Shepher',
					t: `${col.descricao}\n\nObrigatório: ${col.obrigatorio}\nAceita: ${col.aceita}\nExemplo: ${col.exemplo}`,
				},
			];
		});
		wsDados['!cols'] = colunas.map((c) => ({
			wch: Math.max(c.nome.length + 2, 18),
		}));

		const instrucoesHeader = ['Coluna', 'Obrigatório', 'Descrição', 'Valores aceitos', 'Exemplo'];
		const instrucoesRows = colunas.map((c) => [
			c.nome,
			c.obrigatorio,
			c.descricao,
			c.aceita,
			c.exemplo,
		]);
		const wsInstr = XLSX.utils.aoa_to_sheet([instrucoesHeader, ...instrucoesRows]);
		wsInstr['!cols'] = [
			{ wch: 22 },
			{ wch: 38 },
			{ wch: 62 },
			{ wch: 38 },
			{ wch: 18 },
		];

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, wsDados, 'Dados');
		XLSX.utils.book_append_sheet(workbook, wsInstr, 'Instruções');

		return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
	}

	async importarUsuariosExcel(params: {
		userRole: Funcao;
		fileBuffer: Buffer;
	}) {
		const { userRole, fileBuffer } = params;

		if (userRole !== 'ADM') {
			throw new AppError('Apenas ADM pode importar Excel', 403);
		}

		const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
		const firstSheet = workbook.SheetNames[0];
		if (!firstSheet) {
			throw new AppError('Arquivo Excel sem abas válidas', 400);
		}

		const sheet = workbook.Sheets[firstSheet];
		const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

		if (rows.length === 0) {
			throw new AppError('Arquivo Excel vazio', 400);
		}

		let criados = 0;
		const erros: ImportacaoErro[] = [];

		for (let index = 0; index < rows.length; index++) {
			const linha = index + 2;
			const row = rows[index];

			try {
				const nome = this.pickString(row, ['nome']);
				const email = this.pickString(row, ['email']);
				const genero = this.pickString(row, ['genero', 'sexo'])?.toUpperCase();

				if (!nome || !email || !genero) {
					throw new Error('Campos obrigatórios: nome, email, genero');
				}

				if (genero !== 'M' && genero !== 'F') {
					throw new Error('Genero deve ser M ou F');
				}

				const funcaoRaw = this.pickString(row, ['funcao', 'role'])?.toUpperCase() ?? 'DISCIPULO';
				const funcao = this.parseFuncao(funcaoRaw);

				let senha = this.pickString(row, ['senha', 'password']);
				if (!senha) {
					if (funcao === 'DISCIPULO') {
						senha = '123456'; // Senha padrão para discípulos que não acessam
					} else {
						throw new Error('Senha é obrigatória para Pastores e Líderes');
					}
				}

				// Define g12 baseado na função: PASTOR e DISCIPULADOR são G12
				const isG12 = funcao === 'PASTOR' || funcao === 'DISCIPULADOR' || funcao === 'ADM';

				const payload = {
					nome,
					email,
					senha,
					telefone: this.pickString(row, ['telefone', 'contato']) ?? undefined,
					dataNascimento: this.parseExcelDate(
						row,
						['dataNascimento', 'nascimento', 'data_nascimento'],
					),
					genero: genero as 'M' | 'F',
					funcao,
					supervisorId: this.pickString(row, ['supervisorId', 'pastorId', 'discipuladorId']) ?? undefined,
					ministerioId: this.pickString(row, ['ministerioId']) ?? undefined,
					ministerio: this.pickString(row, ['ministerio']) ?? undefined,
					batizado: this.parseBoolean(this.pick(row, ['batizado'])),
					g12: isG12,
					universidadeVida: this.parseBoolean(this.pick(row, ['universidadeVida', 'universidadeDaVida'])),
					capacitacaoDestino1: this.parseBoolean(this.pick(row, ['capacitacaoDestino1'])),
					capacitacaoDestino2: this.parseBoolean(this.pick(row, ['capacitacaoDestino2'])),
					capacitacaoDestino3: this.parseBoolean(this.pick(row, ['capacitacaoDestino3'])),
					capacitacaoDestino: this.pickString(row, ['capacitacaoDestino']),
					nivelAtividade: this.parseNivelAtividade(this.pick(row, ['nivelAtividade', 'atividade'])),
				};

				await this.create({ userRole: 'ADM', data: payload });
				criados++;
			} catch (error: any) {
				erros.push({ linha, motivo: error?.message ?? 'Erro desconhecido' });
			}
		}

		return {
			totalLinhas: rows.length,
			criados,
			erros,
		};
	}

	async list(params: {
		userId: string;
		userRole: Funcao;
		query: {
			funcao?: unknown;
			genero?: unknown;
			supervisor_id?: unknown;
			ministerio_id?: unknown;
			batizado?: unknown;
			page?: unknown;
			limit?: unknown;
		};
	}) {
		const { userId, userRole, query } = params;
		const {
			funcao,
			genero,
			supervisor_id,
			ministerio_id,
			batizado,
			page = '1',
			limit = '20',
		} = query;

		const pageNum = parseInt(page as string, 10);
		const limitNum = parseInt(limit as string, 10);

		let allowedIds: string[] | null = null;
		if (userRole === 'PASTOR') {
			allowedIds = await this.getRedeIds(userId);
		} else if (userRole === 'DISCIPULADOR') {
			allowedIds = await this.getCelulaIds(userId);
		} else if (userRole === 'DISCIPULO') {
			allowedIds = [userId];
		}

		if (allowedIds !== null && allowedIds.length === 0) {
			return { data: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
		}

		let pagedDocs: QueryDocumentSnapshot[];
		let total: number;

		if (allowedIds !== null) {
			const allDocs = await this.fetchDocsByIds('usuarios', allowedIds);

			const filtered = allDocs.filter((doc) => {
				const d = doc.data();
				if (!d.ativo) return false;
				if (funcao && d.funcao !== funcao) return false;
				if (genero && d.genero !== genero) return false;
				if (supervisor_id && d.supervisorId !== supervisor_id) return false;
				if (ministerio_id && d.ministerioId !== ministerio_id) return false;
				if (batizado !== undefined && d.batizado !== (batizado === 'true')) return false;
				return true;
			});

			filtered.sort((a, b) => (a.data().nome as string).localeCompare(b.data().nome as string));

			total = filtered.length;
			pagedDocs = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);
		} else {
			const result = await this.usuarioRepository.queryAdminUsuarios(
				{ funcao, genero, supervisor_id, ministerio_id, batizado },
				pageNum,
				limitNum,
			);
			total = result.total;
			pagedDocs = result.docs;
		}

		const supervisorIds = [
			...new Set(pagedDocs.map((d) => d.data().supervisorId).filter(Boolean) as string[]),
		];
		const ministerioIds = [
			...new Set(pagedDocs.map((d) => d.data().ministerioId).filter(Boolean) as string[]),
		];

		const [supervisorMap, ministerioMap, discipulosMap] = await Promise.all([
			this.batchFetchMap('usuarios', supervisorIds),
			this.batchFetchMap('ministerios', ministerioIds),
			this.batchCountDiscipulos(pagedDocs.map((d) => d.id)),
		]);

		const usuarios = pagedDocs.map((doc) => {
			const d = doc.data();
			return {
				...docToData(doc),
				supervisor: d.supervisorId ? this.supervisorBasic(supervisorMap[d.supervisorId]) : null,
				ministerio: d.ministerioId ? ministerioMap[d.ministerioId] ?? null : null,
				_count: { discipulos: discipulosMap[doc.id] ?? 0 },
			};
		});

		return { data: usuarios, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
	}

	async getById(params: { id: string; userId: string; userRole: Funcao }) {
		const { id, userId, userRole } = params;

		const doc = await this.usuarioRepository.getUsuarioDocById(id);

		if (!doc.exists) {
			throw new AppError('Usuário não encontrado', 404);
		}

		await this.checkPermission(userId, userRole, id);

		const d = doc.data()!;
		const [ministerioDoc, supervisorDoc, discipulosSnap] = await Promise.all([
			d.ministerioId ? this.usuarioRepository.getMinisterioDocById(d.ministerioId) : Promise.resolve(null),
			d.supervisorId ? this.usuarioRepository.getUsuarioDocById(d.supervisorId) : Promise.resolve(null),
			this.usuarioRepository.getDiscipulosBySupervisorId(id),
		]);

		const ministerio = ministerioDoc?.exists ? docToData(ministerioDoc) : null
		const supervisorRaw = supervisorDoc?.exists ? supervisorDoc.data() : null;
		const supervisor = supervisorRaw
			? { id: supervisorDoc!.id, nome: supervisorRaw.nome, funcao: supervisorRaw.funcao }
			: null;

		const discipulos = discipulosSnap.docs.map((disc) => ({
			id: disc.id,
			nome: disc.data().nome,
			email: disc.data().email,
			funcao: disc.data().funcao,
			fotoUrl: disc.data().fotoUrl ?? null,
		}));

		return {
			...docToData(doc),
			ministerio,
			supervisor,
			discipulos,
			_count: { discipulos: discipulosSnap.size },
		};
	}

	async create(params: { userRole: Funcao; data: any }) {
		const { userRole, data } = params;

		if (userRole === 'DISCIPULO') {
			throw new AppError('Você não tem permissão para criar usuários', 403);
		}

		const userId = await this.gerarIdUnicoPorNome(data.nome);
		const needsAuth = data.funcao === 'PASTOR' || data.funcao === 'DISCIPULADOR' || data.funcao === 'ADM';

		if (needsAuth) {
			try {
				await auth.createUser({
					uid: userId,
					email: data.email,
					password: data.senha,
					displayName: data.nome,
				});
			} catch (err: any) {
				if (err.code === 'auth/email-already-exists') {
					throw new AppError('Já existe um usuário com este email', 409);
				}
				if (err.code === 'auth/uid-already-exists') {
					throw new AppError('Já existe um usuário com este ID. Tente novamente.', 409);
				}
				throw err;
			}
		}

		const { senha, ministerio, ministerioId, ...perfil } = data;
		const resolvedMinisterioId = await this.resolveMinisterioId(ministerioId, ministerio);

		const novoDoc: Record<string, unknown> = {
			...perfil,
			ministerioId: resolvedMinisterioId,
			dataNascimento: data.dataNascimento ? Timestamp.fromDate(new Date(data.dataNascimento)) : null,
			ativo: true,
			dataCadastro: FieldValue.serverTimestamp(),
			dataAtualizacao: FieldValue.serverTimestamp(),
		};

		await this.usuarioRepository.createUsuarioDoc(userId, novoDoc);

		const criado = await this.usuarioRepository.getUsuarioDocById(userId);
		const d = criado.data()!;

		const [supervisorDoc, ministerioDoc] = await Promise.all([
			d.supervisorId ? this.usuarioRepository.getUsuarioDocById(d.supervisorId) : Promise.resolve(null),
			d.ministerioId ? this.usuarioRepository.getMinisterioDocById(d.ministerioId) : Promise.resolve(null),
		]);

		const supervisorRaw = supervisorDoc?.exists ? supervisorDoc.data() : null;
		return {
			...docToData(criado),
			supervisor: supervisorRaw
				? { id: supervisorDoc!.id, nome: supervisorRaw.nome, funcao: supervisorRaw.funcao }
				: null,
			ministerio: ministerioDoc?.exists ? docToData(ministerioDoc) : null
		};
	}

	async update(params: { id: string; userId: string; userRole: Funcao; data: any }) {
		const { id, userId, userRole, data } = params;

		await this.checkPermission(userId, userRole, id);

		const { ministerio, ministerioId, ...restData } = data;
		const resolvedMinisterioId = await this.resolveMinisterioId(ministerioId, ministerio);

		const updateData: Record<string, unknown> = {
			...restData,
			dataAtualizacao: FieldValue.serverTimestamp(),
		};

		if (ministerio !== undefined || ministerioId !== undefined) {
			updateData.ministerioId = resolvedMinisterioId;
		}

		if (data.dataNascimento) {
			updateData.dataNascimento = Timestamp.fromDate(new Date(data.dataNascimento));
		}

		if (data.nome) {
			await auth.updateUser(id, { displayName: data.nome });
		}

		await this.usuarioRepository.updateUsuarioDoc(id, updateData);

		const atualizado = await this.usuarioRepository.getUsuarioDocById(id);
		const d = atualizado.data()!;

		const [supervisorDoc, ministerioDoc] = await Promise.all([
			d.supervisorId ? this.usuarioRepository.getUsuarioDocById(d.supervisorId) : Promise.resolve(null),
			d.ministerioId ? this.usuarioRepository.getMinisterioDocById(d.ministerioId) : Promise.resolve(null),
		]);

		const supervisorRaw = supervisorDoc?.exists ? supervisorDoc.data() : null;
		return {
			...docToData(atualizado),
			supervisor: supervisorRaw
				? { id: supervisorDoc!.id, nome: supervisorRaw.nome, funcao: supervisorRaw.funcao }
				: null,
			ministerio: ministerioDoc?.exists ? docToData(ministerioDoc) : null
		};
	}

	async promover(params: {
		id: string;
		userId: string;
		userRole: Funcao;
		novaFuncao: Funcao;
		motivo?: string;
	}) {
		const { id, userId, userRole, novaFuncao, motivo } = params;

		const permissoes: Record<string, Funcao[]> = {
			ADM: ['PASTOR', 'DISCIPULADOR', 'DISCIPULO'],
			PASTOR: ['DISCIPULADOR', 'DISCIPULO'],
			DISCIPULADOR: ['DISCIPULO'],
		};

		if (!permissoes[userRole]?.includes(novaFuncao)) {
			throw new AppError('Você não tem permissão para esta promoção', 403);
		}

		await this.checkPermission(userId, userRole, id);

		const usuarioSnap = await this.usuarioRepository.getUsuarioDocById(id);
		if (!usuarioSnap.exists) {
			throw new AppError('Usuário não encontrado', 404);
		}

		const funcaoAnterior = usuarioSnap.data()!.funcao as Funcao;

		await this.usuarioRepository.runPromocaoTransaction({
			id,
			userId,
			funcaoAnterior,
			novaFuncao,
			motivo: motivo ?? `Promovido para ${novaFuncao}`,
			dataAtualizacao: FieldValue.serverTimestamp(),
			dataAlteracao: FieldValue.serverTimestamp(),
		});

		const atualizado = await this.usuarioRepository.getUsuarioDocById(id);
		const d = atualizado.data()!;

		const [supervisorDoc, ministerioDoc] = await Promise.all([
			d.supervisorId ? this.usuarioRepository.getUsuarioDocById(d.supervisorId) : Promise.resolve(null),
			d.ministerioId ? this.usuarioRepository.getMinisterioDocById(d.ministerioId) : Promise.resolve(null),
		]);

		const supervisorRaw = supervisorDoc?.exists ? supervisorDoc.data() : null;
		return {
			...docToData(atualizado),
			supervisor: supervisorRaw
				? { id: supervisorDoc!.id, nome: supervisorRaw.nome, funcao: supervisorRaw.funcao }
				: null,
			ministerio: ministerioDoc?.exists ? docToData(ministerioDoc) : null
		};
	}

	async delete(params: { id: string; userId: string; userRole: Funcao }) {
		const { id, userId, userRole } = params;

		await this.checkPermission(userId, userRole, id);

		await Promise.all([
			this.usuarioRepository.updateUsuarioDoc(id, {
				ativo: false,
				dataAtualizacao: FieldValue.serverTimestamp(),
			}),
			auth.updateUser(id, { disabled: true }),
		]);
	}

	async updateSenha(params: {
		id: string;
		userId: string;
		userRole: Funcao;
		senhaAtual: string;
		novaSenha: string;
	}) {
		const { id, userId, userRole, senhaAtual, novaSenha } = params;

		if (userId !== id && userRole !== 'ADM') {
			throw new AppError('Você não tem permissão para alterar a senha deste usuário', 403);
		}

		if (userId === id) {
			const userDoc = await this.usuarioRepository.getUsuarioDocById(id);
			if (!userDoc.exists) throw new AppError('Usuário não encontrado', 404);
			const email = userDoc.data()!.email as string;

			try {
				await signInWithEmailAndPassword(email, senhaAtual);
			} catch {
				throw new AppError('Senha atual incorreta', 401);
			}
		}

		await auth.updateUser(id, { password: novaSenha });

		return { message: 'Senha atualizada com sucesso' };
	}

	private async getRedeIds(userId: string): Promise<string[]> {
		const ids: string[] = [userId];
		const queue: string[] = [userId];

		while (queue.length > 0) {
			const current = queue.shift()!;
			const diretos = await this.usuarioRepository.getDiscipulosDiretosIds(current);
			diretos.forEach((id) => {
				ids.push(id);
				queue.push(id);
			});
		}

		return ids;
	}

	private async getCelulaIds(userId: string): Promise<string[]> {
		const discipulosDiretos = await this.usuarioRepository.getDiscipulosDiretosIds(userId);
		return [userId, ...discipulosDiretos];
	}

	private async checkPermission(userId: string, userRole: Funcao, targetId: string): Promise<void> {
		if (userRole === 'ADM') return;
		if (userRole === 'PASTOR') {
			const rede = await this.getRedeIds(userId);
			if (!rede.includes(targetId)) {
				throw new AppError('Você não tem permissão para acessar este usuário', 403);
			}
		} else if (userRole === 'DISCIPULADOR') {
			const celula = await this.getCelulaIds(userId);
			if (!celula.includes(targetId)) {
				throw new AppError('Você não tem permissão para acessar este usuário', 403);
			}
		} else {
			if (userId !== targetId) {
				throw new AppError('Você não tem permissão para acessar este usuário', 403);
			}
		}
	}

	private async fetchDocsByIds(
		collection: string,
		ids: string[],
	): Promise<QueryDocumentSnapshot[]> {
		return this.usuarioRepository.fetchDocsByIds(collection, ids);
	}

	private async batchFetchMap(
		collection: string,
		ids: string[],
	): Promise<Record<string, Record<string, unknown> | null>> {
		if (ids.length === 0) return {};
		const docs = await this.fetchDocsByIds(collection, ids);
		const map: Record<string, Record<string, unknown> | null> = {};
		docs.forEach((doc) => {
			map[doc.id] = docToData(doc);
		});
		return map;
	}

	private async batchCountDiscipulos(ids: string[]): Promise<Record<string, number>> {
		return this.usuarioRepository.batchCountDiscipulos(ids);
	}

	private supervisorBasic(data: Record<string, unknown> | null | undefined) {
		if (!data) return null;
		return { id: data.id, nome: data.nome, funcao: data.funcao };
	}

	private async gerarIdUnicoPorNome(nome: string): Promise<string> {
		const base = this.slugifyNome(nome ?? '');
		if (!base) {
			throw new AppError('Nome inválido para gerar ID', 400);
		}

		let candidato = base;
		let sufixo = 2;
		while (true) {
			const existente = await this.usuarioRepository.getUsuarioDocById(candidato);
			if (!existente.exists) return candidato;
			candidato = `${base}-${sufixo}`;
			sufixo++;
		}
	}

	private slugifyNome(text: string): string {
		return text
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	private async resolveMinisterioId(
		ministerioId?: string,
		ministerioNome?: string,
	): Promise<string | null | undefined> {
		if (ministerioId !== undefined) {
			return ministerioId || null;
		}

		if (ministerioNome === undefined) {
			return undefined;
		}

		const nome = ministerioNome.trim();
		if (!nome) {
			return null;
		}

		const existing = await this.usuarioRepository.findMinisterioByNome(nome);
		if (!existing.empty) {
			return existing.docs[0].id;
		}

		return this.usuarioRepository.createMinisterio(nome, FieldValue.serverTimestamp());
	}

	private escapeCsv(value: unknown): string {
		const text = String(value ?? '');
		const escaped = text.replace(/"/g, '""');
		if (/[",\n]/.test(escaped)) return `"${escaped}"`;
		return escaped;
	}

	private boolToText(value: unknown): string {
		return value === true ? 'true' : 'false';
	}

	private normalizeHeader(value: string): string {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase();
	}

	private pick(row: Record<string, unknown>, aliases: string[]): unknown {
		const keyMap: Record<string, string> = {};
		Object.keys(row).forEach((k) => {
			keyMap[this.normalizeHeader(k)] = k;
		});

		for (const alias of aliases) {
			const normalized = this.normalizeHeader(alias);
			const originalKey = keyMap[normalized];
			if (originalKey !== undefined) {
				return row[originalKey];
			}
		}

		return undefined;
	}

	private pickString(row: Record<string, unknown>, aliases: string[]): string | undefined {
		const value = this.pick(row, aliases);
		if (value === undefined || value === null) return undefined;
		const text = String(value).trim();
		return text.length > 0 ? text : undefined;
	}

	private parseBoolean(value: unknown): boolean | undefined {
		if (value === undefined || value === null || value === '') return undefined;
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value === 1;
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			if (['true', '1', 'sim', 's', 'yes'].includes(normalized)) return true;
			if (['false', '0', 'nao', 'não', 'n', 'no'].includes(normalized)) return false;
		}
		return undefined;
	}

	private parseNivelAtividade(value: unknown): number | undefined {
		if (value === undefined || value === null || value === '') return undefined;
		const num = Number(value);
		if (!Number.isFinite(num)) return undefined;
		if (num < 1 || num > 5) return undefined;
		return Math.floor(num);
	}

	private parseExcelDate(
		row: Record<string, unknown>,
		aliases: string[],
	): string | undefined {
		const value = this.pick(row, aliases);
		if (value === undefined || value === null || value === '') return undefined;

		if (value instanceof Date && !Number.isNaN(value.getTime())) {
			return value.toISOString();
		}

		if (typeof value === 'number') {
			const parsed = XLSX.SSF.parse_date_code(value);
			if (!parsed) return undefined;
			const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
			return date.toISOString();
		}

		if (typeof value === 'string') {
			const date = new Date(value);
			if (!Number.isNaN(date.getTime())) {
				return date.toISOString();
			}
		}

		return undefined;
	}

	private parseFuncao(value: string): Funcao {
		if (value === 'ADM' || value === 'PASTOR' || value === 'DISCIPULADOR' || value === 'DISCIPULO') {
			return value;
		}
		throw new Error('Funcao invalida. Use ADM, PASTOR, DISCIPULADOR ou DISCIPULO');
	}
}
