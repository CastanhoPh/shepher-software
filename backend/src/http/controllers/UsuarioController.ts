import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@http/middlewares/authMiddleware';
import { UsuarioService } from '@services/usuarioService';
import {
	createUsuarioSchema,
	updateUsuarioSchema,
	promoverUsuarioSchema,
} from '@validators/schemas';
import { AppError } from '@errors/AppError';

export class UsuarioController {
	private readonly usuarioService = new UsuarioService();

	async list(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userId, userRole } = req as AuthRequest;
			const response = await this.usuarioService.list({ userId, userRole, query: req.query });
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { id } = req.params;
			const { userId, userRole } = req as AuthRequest;
			const response = await this.usuarioService.getById({ id, userId, userRole });
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userRole } = req as AuthRequest;
			const data = createUsuarioSchema.parse(req.body);
			const response = await this.usuarioService.create({ userRole, data });
			res.status(201).json(response);
		} catch (error) {
			next(error);
		}
	}

	async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { id } = req.params;
			const { userId, userRole } = req as AuthRequest;
			const data = updateUsuarioSchema.parse(req.body);
			const response = await this.usuarioService.update({ id, userId, userRole, data });
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async promover(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { id } = req.params;
			const { userId, userRole } = req as AuthRequest;
			const { novaFuncao, motivo } = promoverUsuarioSchema.parse(req.body);
			const response = await this.usuarioService.promover({
				id,
				userId,
				userRole,
				novaFuncao,
				motivo,
			});
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { id } = req.params;
			const { userId, userRole } = req as AuthRequest;
			await this.usuarioService.delete({ id, userId, userRole });
			res.status(204).send();
		} catch (error) {
			next(error);
		}
	}

	async updateSenha(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { id } = req.params;
			const { userId, userRole } = req as AuthRequest;
			const { senhaAtual, novaSenha } = req.body;
			const response = await this.usuarioService.updateSenha({
				id,
				userId,
				userRole,
				senhaAtual,
				novaSenha,
			});
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async exportarRelatorio(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userId, userRole } = req as AuthRequest;
			const relatorio = await this.usuarioService.exportarRelatorioCSV({
				userId,
				userRole,
				query: req.query,
			});

			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename="${relatorio.filename}"`);
			res.status(200).send(relatorio.content);
		} catch (error) {
			next(error);
		}
	}

	async importarExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userRole } = req as AuthRequest;
			if (!req.file?.buffer) {
				throw new AppError('Arquivo Excel é obrigatório no campo file', 400);
			}

			const resultado = await this.usuarioService.importarUsuariosExcel({
				userRole,
				fileBuffer: req.file.buffer,
			});

			res.status(200).json(resultado);
		} catch (error) {
			next(error);
		}
	}

	async baixarModeloImportacao(_req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const buffer = await this.usuarioService.gerarTemplateImportacao();
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			);
			res.setHeader(
				'Content-Disposition',
				'attachment; filename="modelo-importacao-usuarios.xlsx"',
			);
			res.status(200).send(buffer);
		} catch (error) {
			next(error);
		}
	}
}
