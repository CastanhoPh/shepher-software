import { Router } from 'express';
import { AuthController } from '@http/controllers/AuthController';
import { UsuarioController } from '@http/controllers/UsuarioController';
import { DashboardController } from '@http/controllers/DashboardController';
import { authMiddleware } from '@http/middlewares/authMiddleware';
import { loginRateLimiter } from '@http/middlewares/rateLimiter';
import multer from 'multer';

const router = Router();

const authController = new AuthController();
const usuarioController = new UsuarioController();
const dashboardController = new DashboardController();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/auth/login', loginRateLimiter, (req, res, next) => authController.login(req, res, next));

router.use(authMiddleware);

router.get('/auth/me', (req, res, next) => authController.me(req, res, next));
router.post('/auth/logout', (req, res, next) => authController.logout(req, res));

router.get('/usuarios', (req, res, next) => usuarioController.list(req, res, next));
router.get('/usuarios/relatorio/exportar', (req, res, next) => usuarioController.exportarRelatorio(req, res, next));
router.get('/usuarios/modelo-importacao', (req, res, next) => usuarioController.baixarModeloImportacao(req, res, next));
router.post('/usuarios/importar-excel', upload.single('file'), (req, res, next) => usuarioController.importarExcel(req, res, next));
router.get('/usuarios/:id', (req, res, next) => usuarioController.getById(req, res, next));
router.post('/usuarios', (req, res, next) => usuarioController.create(req, res, next));
router.put('/usuarios/:id', (req, res, next) => usuarioController.update(req, res, next));
router.patch('/usuarios/:id/promover', (req, res, next) => usuarioController.promover(req, res, next));
router.delete('/usuarios/:id', (req, res, next) => usuarioController.delete(req, res, next));
router.patch('/usuarios/:id/senha', (req, res, next) => usuarioController.updateSenha(req, res, next));

router.get('/dashboard/estatisticas', (req, res, next) => dashboardController.getEstatisticas(req, res, next));
router.get('/dashboard/hierarquia', (req, res, next) => dashboardController.getHierarquia(req, res, next));

export { router };
