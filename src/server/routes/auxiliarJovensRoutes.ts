import { Router } from 'express';
import { auxiliarJovensController } from '../controllers/auxiliarJovensController.js';

const router = Router();

router.get('/', auxiliarJovensController.list.bind(auxiliarJovensController));
router.post('/', auxiliarJovensController.create.bind(auxiliarJovensController));
router.put('/:id', auxiliarJovensController.update.bind(auxiliarJovensController));
router.delete('/:id', auxiliarJovensController.delete.bind(auxiliarJovensController));

export default router;
