import busboy from 'busboy';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@errors/AppError';

export interface UploadedFile {
	fieldname: string;
	originalname: string;
	mimetype: string;
	size: number;
	buffer: Buffer;
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			/** Arquivo enviado via multipart, preenchido por `uploadSingle`. */
			file?: UploadedFile;
			/** Corpo bruto — injetado pelo runtime do Cloud Functions. */
			rawBody?: Buffer;
		}
	}
}

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Recebe um único arquivo de um formulário multipart e o expõe em `req.file`.
 *
 * Substitui o multer porque no Cloud Functions o corpo da requisição já foi
 * consumido pelo runtime antes do Express: não há mais stream para ler, apenas
 * `req.rawBody`. Aqui alimentamos o busboy com o rawBody quando ele existe e
 * caímos no pipe normal do stream quando rodando localmente.
 */
export function uploadSingle(field: string, maxBytes: number = DEFAULT_MAX_BYTES) {
	return (req: Request, _res: Response, next: NextFunction): void => {
		const contentType = req.headers['content-type'] ?? '';

		if (!contentType.includes('multipart/form-data')) {
			next();
			return;
		}

		let parser: busboy.Busboy;
		try {
			parser = busboy({ headers: req.headers, limits: { fileSize: maxBytes, files: 1 } });
		} catch {
			next(new AppError('Requisição multipart inválida', 400));
			return;
		}

		const chunks: Buffer[] = [];
		let fileFound = false;
		let truncated = false;
		let originalname = '';
		let mimetype = 'application/octet-stream';
		let settled = false;

		const finish = (error?: Error) => {
			if (settled) return;
			settled = true;
			next(error);
		};

		parser.on('file', (name, stream, info) => {
			if (name !== field || fileFound) {
				stream.resume();
				return;
			}
			fileFound = true;
			originalname = info.filename ?? '';
			mimetype = info.mimeType ?? mimetype;

			stream.on('data', (chunk: Buffer) => chunks.push(chunk));
			stream.on('limit', () => {
				truncated = true;
			});
		});

		parser.on('field', (name, value) => {
			if (!req.body || typeof req.body !== 'object') req.body = {};
			(req.body as Record<string, unknown>)[name] = value;
		});

		parser.on('close', () => {
			if (truncated) {
				finish(
					new AppError(
						`Arquivo maior que o limite de ${Math.floor(maxBytes / 1024 / 1024)} MB`,
						413,
					),
				);
				return;
			}

			if (fileFound) {
				const buffer = Buffer.concat(chunks);
				req.file = { fieldname: field, originalname, mimetype, size: buffer.length, buffer };
			}

			finish();
		});

		parser.on('error', (error) => finish(error as Error));

		if (req.rawBody) {
			parser.end(req.rawBody);
		} else {
			req.pipe(parser);
		}
	};
}
