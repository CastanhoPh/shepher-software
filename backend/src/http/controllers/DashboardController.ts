import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '@services/dashboardService';
import { AuthRequest } from '@http/middlewares/authMiddleware';

export class DashboardController {
	private readonly dashboardService = new DashboardService();

	async getEstatisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userId, userRole } = req as AuthRequest;
			const { filtro_genero, filtro_idade_min, filtro_idade_max } = req.query;

			const response = await this.dashboardService.getEstatisticas({
				userId,
				userRole,
				filtro_genero,
				filtro_idade_min,
				filtro_idade_max,
			});

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async getHierarquia(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userId } = req as AuthRequest;
			const response = await this.dashboardService.getHierarquia({ userId });
			res.json(response);
		} catch (error) {
			next(error);
		}
	}
}
