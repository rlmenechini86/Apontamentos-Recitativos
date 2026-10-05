import { Router } from 'express';
import comumCongregacaoRoutes from './comumCongregacaoRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import auxiliarJovensRoutes from './auxiliarJovensRoutes.js';
import recitativosRoutes from './recitativosRoutes.js';
import contagensRoutes from './contagensRoutes.js';
import anciaoRoutes from './anciaoRoutes.js';
import tiposEventoRoutes from './tiposEventoRoutes.js';
import reunioesEventosRoutes from './reunioesEventosRoutes.js';
import agendaVisitasRoutes from './agendaVisitasRoutes.js';
import { authRouter } from './authRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/comuns', comumCongregacaoRoutes);
apiRouter.use('/usuarios', usuarioRoutes);
apiRouter.use('/auxiliares', auxiliarJovensRoutes);
apiRouter.use('/recitativos', recitativosRoutes);
apiRouter.use('/contagens', contagensRoutes);
apiRouter.use('/anciaos', anciaoRoutes);
apiRouter.use('/tipos-evento', tiposEventoRoutes);
apiRouter.use('/reunioes-eventos', reunioesEventosRoutes);
apiRouter.use('/visitas', agendaVisitasRoutes);

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    module: 'Módulo 1: Localidades e Usuários',
    system: 'Sistema de Controle de Apontamentos de Jovens e Menores',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
