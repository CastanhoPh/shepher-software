import { Request, Response, NextFunction } from 'express';
import { auth, db } from '@infrastructure/firebase/client';
import { AppError } from '@errors/AppError';

export type UserRole = 'ADM' | 'PASTOR' | 'DISCIPULADOR' | 'DISCIPULO';

export interface AuthRequest extends Request {
	userId: string;
	userRole: UserRole;
}

export const authMiddleware = async (
	req: Request,
	_res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			throw new AppError('Token não fornecido', 401);
		}

		const [, token] = authHeader.split(' ');

		if (!token) {
			throw new AppError('Token mal formatado', 401);
		}

		const decoded = await auth.verifyIdToken(token);
		const userDoc = await db.collection('usuarios').doc(decoded.uid).get();

		if (!userDoc.exists || !userDoc.data()?.ativo) {
			throw new AppError('Usuário inativo ou não encontrado', 401);
		}

		const userData = userDoc.data()!;
		const userRole = userData.funcao as UserRole;

		if (userRole === 'DISCIPULO') {
			throw new AppError('Acesso negado. Discípulos não têm acesso ao sistema.', 403);
		}

		(req as AuthRequest).userId = decoded.uid;
		(req as AuthRequest).userRole = userRole;

		next();
	} catch (error) {
		if (error instanceof AppError) {
			next(error);
		} else {
			next(new AppError('Token inválido ou expirado', 401));
		}
	}
};
