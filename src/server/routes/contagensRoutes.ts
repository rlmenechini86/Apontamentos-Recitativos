import { Router } from 'express';
import { contagensController } from '../controllers/contagensController.js';

const router = Router();

router.get('/', contagensController.getAll);
router.post('/', contagensController.create);
router.put('/:id', contagensController.update);
router.delete('/:id', contagensController.delete);

export default router;
