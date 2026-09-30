import React from 'react';
import { FolderTree, Server, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. Estrutura de Pastas e Arquitetura do Projeto */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center space-x-2 text-emerald-400 mb-4">
          <FolderTree className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-100">
            Estrutura Inicial do Projeto (Arquitetura em Camadas)
          </h2>
        </div>

        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          O projeto adota uma arquitetura em camadas clara e desacoplada, separando responsabilidades entre 
          <strong> Rotas</strong>, <strong>Controladores (Controllers)</strong>, <strong>Serviços (Services)</strong>, 
          <strong> Tipagem/Contratos (DTOs & Domain Models)</strong> e <strong>Cliente de Banco (Supabase)</strong>.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
          {`sistema-apontamentos/
├── database/
│   └── schema.sql                        # Script DDL SQL (Perfis, Setores, Comum, Usuários + Triggers + Seeds)
├── src/
│   ├── server/
│   │   ├── config/
│   │   │   └── supabase.ts               # Conexão e cliente Supabase (URL + Service Role Key)
│   │   ├── types/
│   │   │   └── index.ts                  # Interfaces TypeScript dos Modelos, DTOs e Filtros
│   │   ├── services/
│   │   │   ├── comumCongregacaoService.ts# Regras de Negócio e persistência de Comum Congregação
│   │   │   ├── setorService.ts           # Regras de Negócio e leitura de Setores
│   │   │   ├── usuarioService.ts         # Regras de Negócio e persistência de Usuários
│   │   │   └── perfilService.ts          # Consulta e controle de Perfis de Acesso
│   │   ├── controllers/
│   │   │   ├── comumCongregacaoController.ts # Manipulação de requisições de Comuns
│   │   │   └── usuarioController.ts      # Manipulação de requisições de Usuários
│   │   └── routes/
│   │       ├── comumCongregacaoRoutes.ts # Definição das rotas REST /api/comuns
│   │       ├── usuarioRoutes.ts          # Definição das rotas REST /api/usuarios
│   │       └── index.ts                  # Agregador mestre de rotas da API
│   ├── components/                       # Componentes Frontend da interface de gestão
│   │   ├── Header.tsx
│   │   ├── ComumFormModal.tsx
│   │   ├── UsuarioFormModal.tsx
│   │   ├── UsuarioListView.tsx
│   │   ├── SqlSchemaViewer.tsx
│   │   └── ArchitectureViewer.tsx
│   ├── App.tsx                           # Painel de controle e teste do CRUD
│   └── main.tsx
├── server.ts                             # Entry-point do Backend Express + Vite middleware
├── .env                                  # Variáveis de ambiente com credenciais Supabase
└── package.json`}
        </div>
      </div>

      {/* 2. Endpoints CRUD do Backend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center space-x-2 text-sky-400 mb-4">
          <Server className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-100">
            Contrato da API REST - Módulo de Comum Congregação & Usuários
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
              <span className="text-slate-200">/api/comuns</span>
            </div>
            <span className="text-slate-400 font-sans">Lista congregações (filtros por setor_id, cidade, search, ativo)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">POST</span>
              <span className="text-slate-200">/api/comuns</span>
            </div>
            <span className="text-slate-400 font-sans">Cadastra nova congregação vinculada ao Setor</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
              <span className="text-slate-200">/api/usuarios</span>
            </div>
            <span className="text-slate-400 font-sans">Lista usuários cadastrados (filtros por perfil, comum, busca)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">POST</span>
              <span className="text-slate-200">/api/usuarios</span>
            </div>
            <span className="text-slate-400 font-sans">Cadastra usuário com Perfil de Acesso e vínculo com Comum</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">PUT</span>
              <span className="text-slate-200">/api/usuarios/:id</span>
            </div>
            <span className="text-slate-400 font-sans">Atualiza dados cadastrais, perfil ou congregação do usuário</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">DELETE</span>
              <span className="text-slate-200">/api/usuarios/:id</span>
            </div>
            <span className="text-slate-400 font-sans">Exclui ou inativa um usuário</span>
          </div>
        </div>
      </div>

      {/* 3. Mapeamento das Regras de Negócio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center space-x-2 text-indigo-400 mb-4">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-100">
            Regras de Negócio e Perfis de Acesso
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-sm">Administrador</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase font-bold">
                Visão Global
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tem acesso a todos os setores, congregações, usuários e relatórios de apontamento de forma irrestrita.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-sm">CJM</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase font-bold">
                Visão Setor
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cooperador de Jovens e Menores. Visualiza e acompanha as congregações pertencentes ao seu Setor de atuação.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-sm">Apontamento</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase font-bold">
                Visão Comum
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Irmão ou irmã responsável pelo lançamento de presenças e recitativos exclusivamente da sua própria Comum Congregação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
