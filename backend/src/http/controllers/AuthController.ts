import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '@validators/schemas';
import { AuthService } from '@services/authService';
import { AuthRequest } from '@http/middlewares/authMiddleware';

export class AuthController {
	private readonly authService = new AuthService();

	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { email, senha } = loginSchema.parse(req.body);
			const response = await this.authService.login(email, senha);
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async me(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { userId } = req as AuthRequest;
			const response = await this.authService.me(userId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	async logout(_req: Request, res: Response): Promise<void> {
		res.json(this.authService.logout());
	}
}
