import { Router } from 'express';
import { preCadastroController } from '../controllers/preCadastroController.js';

const router = Router();

// Rotas públicas (isentadas no authMiddleware)
router.get('/public-meta', (req, res) => preCadastroController.getPublicMeta(req, res));
router.post('/public', (req, res) => preCadastroController.createPublic(req, res));

// Rotas protegidas (exigem autenticação JWT)
router.get('/', (req, res) => preCadastroController.list(req, res));
router.post('/:id/aprovar', (req, res) => preCadastroController.aprovar(req, res));
router.post('/:id/recusar', (req, res) => preCadastroController.recusar(req, res));

export default router;

