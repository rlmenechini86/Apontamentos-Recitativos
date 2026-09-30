import { Router } from 'express';
import { comumCongregacaoController } from '../controllers/comumCongregacaoController.js';

const router = Router();

// Endpoints de metadados / auxiliares (devem vir antes do /:id para evitar conflito de rota)
router.get('/meta/setores', (req, res) => comumCongregacaoController.listSetores(req, res));
router.get('/meta/status', (req, res) => comumCongregacaoController.getStatus(req, res));
router.get('/meta/next-codigo', (req, res) => comumCongregacaoController.getNextCodigo(req, res));

// Endpoints CRUD Comum Congregação
router.get('/', (req, res) => comumCongregacaoController.list(req, res));
router.get('/:id', (req, res) => comumCongregacaoController.getById(req, res));
router.post('/', (req, res) => comumCongregacaoController.create(req, res));
router.put('/:id', (req, res) => comumCongregacaoController.update(req, res));
router.delete('/:id', (req, res) => comumCongregacaoController.delete(req, res));

export default router;
