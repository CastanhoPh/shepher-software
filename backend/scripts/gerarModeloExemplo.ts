/**
 * Gera um modelo de importação .xlsx pré-preenchido com a hierarquia atual
 * (líderes que já existem no Firestore) + linhas vazias de exemplo para
 * facilitar a importação em massa.
 *
 * Uso (a partir de backend/):
 *   npx ts-node -r tsconfig-paths/register scripts/gerarModeloExemplo.ts
 *
 * Saída: backend/templates/modelo-exemplo-preenchido.xlsx
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const headers = [
	'nome',
	'email',
	'senha',
	'genero',
	'funcao',
	'telefone',
	'dataNascimento',
	'supervisorId',
	'ministerio',
	'batizado',
	'universidadeVida',
	'capacitacaoDestino1',
	'capacitacaoDestino2',
	'capacitacaoDestino3',
	'nivelAtividade',
];

// ⚠️ EDITE AQUI: adicione/remova linhas conforme sua planilha real.
// Os supervisores já estão na ordem correta (topo → base).
const linhas = [
	// ───── Discípulos novos (exemplos prontos para você editar) ─────
	['Ana Beatriz Lima', 'ana.lima@exemplo.com', '', 'F', 'DISCIPULO', '11999000001', '2003-04-12', 'agleston-teruo-hirano', 'Salas de Cura', 'true', 'false', 'false', 'false', 'false', '3'],
	['Bruno Carvalho', 'bruno.c@exemplo.com', '', 'M', 'DISCIPULO', '11999000002', '2001-08-25', 'agleston-teruo-hirano', 'Intercessão', 'true', 'true', 'true', 'false', 'false', '4'],
	['Camila Rocha', 'camila.r@exemplo.com', '', 'F', 'DISCIPULO', '11999000003', '2005-01-30', 'pedro-henrique-ferreira-castanho', 'Teatro', 'false', 'false', 'false', 'false', 'false', '2'],
	['Daniel Souza', 'daniel.s@exemplo.com', '', 'M', 'DISCIPULO', '11999000004', '1999-11-05', 'pedro-henrique-ferreira-castanho', 'Conectados', 'true', 'true', 'false', 'false', 'false', '3'],
	['Eduarda Mello', 'eduarda.m@exemplo.com', '', 'F', 'DISCIPULO', '11999000005', '2007-06-18', 'leonardo-d-ingianni-macedo', 'Impulso', 'false', 'false', 'false', 'false', 'false', '3'],
	['Felipe Antunes', 'felipe.a@exemplo.com', '', 'M', 'DISCIPULO', '11999000006', '2002-02-09', 'leonardo-d-ingianni-macedo', 'Produção', 'true', 'true', 'true', 'true', 'false', '4'],
	['Giovana Prado', 'giovana.p@exemplo.com', '', 'F', 'DISCIPULO', '11999000007', '2004-09-14', 'agleston-teruo-hirano', 'Capacitação Destino', 'true', 'false', 'false', 'false', 'false', '3'],
	['Henrique Bispo', 'henrique.b@exemplo.com', '', 'M', 'DISCIPULO', '11999000008', '2000-03-22', 'pedro-henrique-ferreira-castanho', 'Salas de Cura', 'true', 'true', 'true', 'false', 'false', '4'],
	['Isabela Cunha', 'isabela.c@exemplo.com', '', 'F', 'DISCIPULO', '11999000009', '2006-12-01', 'leonardo-d-ingianni-macedo', 'Teatro', 'false', 'false', 'false', 'false', 'false', '2'],
	['João Marcos', 'joao.m@exemplo.com', '', 'M', 'DISCIPULO', '11999000010', '1998-07-19', 'agleston-teruo-hirano', 'Invoxx', 'true', 'true', 'true', 'true', 'true', '5'],
];

const comentarios: Record<string, string> = {
	nome: 'Nome completo do membro. Mín. 3 caracteres.\nObrigatório: Sim',
	email: 'Email do membro (único no sistema).\nObrigatório: Sim',
	senha: 'Senha de acesso (mín. 6 caracteres).\nObrigatório para ADM/PASTOR/DISCIPULADOR.\nDISCIPULO: pode deixar em branco.',
	genero: 'M ou F.\nObrigatório: Sim',
	funcao: 'ADM, PASTOR, DISCIPULADOR ou DISCIPULO.\nPadrão: DISCIPULO',
	telefone: 'Telefone de contato.',
	dataNascimento: 'Formato AAAA-MM-DD ou data nativa do Excel.\nEx.: 1998-05-12',
	supervisorId: 'Slug do nome do supervisor (ex.: agleston-teruo-hirano).\nEle precisa já existir OU vir antes nesta planilha.',
	ministerio: 'Nome do ministério. Cria automaticamente se não existir.',
	batizado: 'true/false, sim/não, 1/0',
	universidadeVida: 'true/false, sim/não, 1/0',
	capacitacaoDestino1: 'true/false, sim/não, 1/0',
	capacitacaoDestino2: 'true/false, sim/não, 1/0',
	capacitacaoDestino3: 'true/false, sim/não, 1/0',
	nivelAtividade: 'Número de 1 a 5 (1=baixo, 5=alto).',
};

const wsDados = XLSX.utils.aoa_to_sheet([headers, ...linhas]);

// Anota cada cabeçalho com comentário explicativo
headers.forEach((h, idx) => {
	const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
	const cell = wsDados[cellRef];
	if (cell && comentarios[h]) {
		cell.c = [{ a: 'Shepher', t: comentarios[h] }];
	}
});

// Larguras de coluna
wsDados['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));

// Aba de instruções
const instrucoes = [
	['Coluna', 'Obrigatório', 'Descrição', 'Valores aceitos', 'Exemplo'],
	['nome', 'Sim', 'Nome completo', 'Texto, mín. 3 caracteres', 'João Silva'],
	['email', 'Sim', 'Email único', 'usuario@dominio.com', 'joao@exemplo.com'],
	['senha', 'Sim p/ ADM/PASTOR/DISCIPULADOR', 'Senha de acesso', 'Mín. 6 caracteres', 'Senha@123'],
	['genero', 'Sim', 'Gênero', 'M ou F', 'M'],
	['funcao', 'Não (padrão DISCIPULO)', 'Função na igreja', 'ADM, PASTOR, DISCIPULADOR, DISCIPULO', 'DISCIPULO'],
	['telefone', 'Não', 'Telefone', 'Texto/números', '11999990000'],
	['dataNascimento', 'Não', 'Data de nascimento', 'AAAA-MM-DD', '1998-05-12'],
	['supervisorId', 'Não', 'Slug do supervisor já existente', 'slug-do-nome-do-supervisor', 'agleston-teruo-hirano'],
	['ministerio', 'Não', 'Nome do ministério (cria se não existir)', 'Texto', 'Louvor'],
	['batizado', 'Não', 'Se é batizado', 'true/false, sim/não, 1/0', 'true'],
	['universidadeVida', 'Não', 'Concluiu UV', 'true/false, sim/não, 1/0', 'true'],
	['capacitacaoDestino1', 'Não', 'Concluiu CD Nível 1', 'true/false, sim/não, 1/0', 'true'],
	['capacitacaoDestino2', 'Não', 'Concluiu CD Nível 2', 'true/false, sim/não, 1/0', 'false'],
	['capacitacaoDestino3', 'Não', 'Concluiu CD Nível 3', 'true/false, sim/não, 1/0', 'false'],
	['nivelAtividade', 'Não', 'Engajamento', '1 a 5', '3'],
	[],
	['REGRAS IMPORTANTES'],
	['1.', 'Ordem das linhas: ADM → PASTOR → DISCIPULADOR → DISCIPULO. Supervisor vem antes do supervisionado.'],
	['2.', 'supervisorId = slug do NOME do supervisor (minúsculas, sem acento, com hífens).'],
	['3.', 'DISCIPULO não recebe login (senha pode ficar em branco).'],
	['4.', 'A coluna g12 é calculada automaticamente (ADM/PASTOR/DISCIPULADOR = G12).'],
	['5.', 'Use apenas ministerio OU ministerioId, não ambos.'],
	['6.', 'Tamanho máx. do arquivo: 5 MB. Só a primeira aba é lida.'],
	[],
	['SUPERVISORES DISPONÍVEIS (já no sistema)'],
	['Slug', 'Nome', 'Função'],
	['maria-lucia-zagato-thomazi', 'Maria Lucia Zagato Thomazi', 'ADM'],
	['guilherme-haro', 'Guilherme Haro', 'PASTOR'],
	['marina-zagato-thomazi', 'Marina Zagato Thomazi', 'PASTOR'],
	['raquel-zagato-thomazi-haro', 'Raquel Zagato Thomazi Haro', 'PASTOR'],
	['agleston-teruo-hirano', 'Agleston Teruo Hirano', 'DISCIPULADOR'],
	['leonardo-d-ingianni-macedo', 'Leonardo D Ingianni Macedo', 'DISCIPULADOR'],
	['pedro-henrique-ferreira-castanho', 'Pedro Henrique Ferreira Castanho', 'DISCIPULADOR'],
];
const wsInstr = XLSX.utils.aoa_to_sheet(instrucoes);
wsInstr['!cols'] = [{ wch: 32 }, { wch: 32 }, { wch: 60 }, { wch: 40 }, { wch: 24 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsDados, 'Dados');
XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruções');

const outDir = path.resolve(__dirname, '..', 'templates');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'modelo-exemplo-preenchido.xlsx');
XLSX.writeFile(wb, outPath);

console.log(`✅ Modelo gerado: ${outPath}`);
console.log(`   ${linhas.length} linhas de exemplo prontas para editar.`);
