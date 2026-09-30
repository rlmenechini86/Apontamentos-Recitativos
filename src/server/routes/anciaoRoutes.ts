import { Router } from 'express';
import { anciaoController } from '../controllers/anciaoController.js';

const router = Router();

router.get('/', anciaoController.list.bind(anciaoController));
router.post('/', anciaoController.create.bind(anciaoController));
router.put('/:id', anciaoController.update.bind(anciaoController));
router.delete('/:id', anciaoController.delete.bind(anciaoController));

export default router;
