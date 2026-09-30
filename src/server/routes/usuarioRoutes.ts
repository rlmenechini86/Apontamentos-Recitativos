import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.js';

const router = Router();

// Rota auxiliar de metadados
router.get('/meta/perfis', (req, res) => usuarioController.listPerfis(req, res));

// Rotas CRUD da entidade Usuário
router.get('/', (req, res) => usuarioController.list(req, res));
router.get('/:id', (req, res) => usuarioController.getById(req, res));
router.post('/', (req, res) => usuarioController.create(req, res));
router.put('/:id', (req, res) => usuarioController.update(req, res));
router.delete('/:id', (req, res) => usuarioController.delete(req, res));

export default router;
