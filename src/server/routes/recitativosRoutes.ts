import { Router } from 'express';
import { recitativosController } from '../controllers/recitativosController.js';

const router = Router();

router.get('/', recitativosController.getAll);
router.post('/', recitativosController.create);
router.put('/:id', recitativosController.update);
router.delete('/:id', recitativosController.delete);

export default router;
