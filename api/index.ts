import express from 'express';
import apiRouter from '../src/server/routes/index.js';

const app = express();

app.use(express.json());

// Em ambiente Serverless, o Express pode ser importado diretamente.
// A rota raiz do Serverless Vercel já injeta a URI original.
// Montamos no /api para casar com as chamadas do frontend.
app.use('/api', apiRouter);

export default app;
