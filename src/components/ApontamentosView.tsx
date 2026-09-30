import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Building2,
  CheckCircle2,
  X,
  Check,
} from 'lucide-react';
import { ComumCongregacao, Setor } from '../types';

export interface Apontamento {
  id: string;
  comum_id: string;
  comum_nome: string;
  setor_nome: string;
  data_reuniao: string;
  horario: string;
  qtd_jovens: number;
  qtd_meninos: number;
  qtd_meninas: number;
  qtd_biblias: number;
  qtd_hinarios: number;
  coleta_valor: number;
  responsavel_nome: string;
  status: 'enviado' | 'rascunho';
  observacoes?: string;
}

const mockApontamentosIniciais: Apontamento[] = [
  {
    id: 'apt-1',
    comum_id: '55555555-5555-5555-5555-555555555555',
    comum_nome: 'Brás - Central',
    setor_nome: 'Setor 1 - Centro',
    data_reuniao: '2026-09-27',
    horario: 'Domingo 10hs',
    qtd_jovens: 142,
    qtd_meninos: 48,
    qtd_meninas: 56,
    qtd_biblias: 210,
    qtd_hinarios: 195,
    coleta_valor: 1850.5,
    responsavel_nome: 'Irmão Lucas Santos',
    status: 'enviado',
  },
  {
    id: 'apt-2',
    comum_id: '3f733b4e-d7e1-4bbd-97fb-9104d52de94b',
    comum_nome: 'Vila Galvão',
    setor_nome: 'Setor 1 - Centro',
    data_reuniao: '2026-09-27',
    horario: 'Domingo 10hs',
    qtd_jovens: 84,
    qtd_meninos: 31,
    qtd_meninas: 37,
    qtd_biblias: 132,
    qtd_hinarios: 128,
    coleta_valor: 940.0,
    responsavel_nome: 'Irmão Mateus Silva',
    status: 'enviado',
  },
];

interface ApontamentosViewProps {
  comuns: ComumCongregacao[];
  setores: Setor[];
}

export const ApontamentosView: React.FC<ApontamentosViewProps> = ({ comuns, setores }) => {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>(mockApontamentosIniciais);
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State para Novo Apontamento
  const [novoApt, setNovoApt] = useState({
    comum_id: comuns[0]?.id || '',
    data_reuniao: new Date().toISOString().split('T')[0],
    horario: 'Domingo 10hs',
    qtd_jovens: 50,
    qtd_meninos: 20,
    qtd_meninas: 25,
    qtd_biblias: 80,
    qtd_hinarios: 75,
    coleta_valor: 650.0,
    responsavel_nome: 'Operador Local',
  });

  const filteredApontamentos = apontamentos.filter((item) => {
    if (selectedSetorId) {
      const matchComum = comuns.find((c) => c.nome === item.comum_nome && c.setor_id === selectedSetorId);
      if (!matchComum && item.setor_nome !== setores.find((s) => s.id === selectedSetorId)?.nome) return false;
    }
    if (selectedComumId && item.comum_id !== selectedComumId) {
      return false;
    }
    return true;
  });

  // Totais Consolidados
  const totalJovens = filteredApontamentos.reduce((acc, a) => acc + a.qtd_jovens, 0);
  const totalMenores = filteredApontamentos.reduce((acc, a) => acc + a.qtd_meninos + a.qtd_meninas, 0);
  const totalGeral = totalJovens + totalMenores;
  const totalColeta = filteredApontamentos.reduce((acc, a) => acc + a.coleta_valor, 0);

  const handleSalvarApontamento = (e: React.FormEvent) => {
    e.preventDefault();
    const comum = comuns.find((c) => c.id === novoApt.comum_id);
    const novo: Apontamento = {
      id: `apt-${Date.now()}`,
      comum_id: novoApt.comum_id,
      comum_nome: comum?.nome || 'Congregação Local',
      setor_nome: comum?.setor_pertencente || comum?.setores?.nome || 'Setor 1 - Centro',
      data_reuniao: novoApt.data_reuniao,
      horario: novoApt.horario,
      qtd_jovens: Number(novoApt.qtd_jovens) || 0,
      qtd_meninos: Number(novoApt.qtd_meninos) || 0,
      qtd_meninas: Number(novoApt.qtd_meninas) || 0,
      qtd_biblias: Number(novoApt.qtd_biblias) || 0,
      qtd_hinarios: Number(novoApt.qtd_hinarios) || 0,
      coleta_valor: Number(novoApt.coleta_valor) || 0,
      responsavel_nome: novoApt.responsavel_nome,
      status: 'enviado',
    };

    setApontamentos([novo, ...apontamentos]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Apontamentos da Reunião de Jovens e Menores</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro semanal de presença, menores, materiais e coleta oficial.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Apontamento</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Geral Presentes
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalGeral}</p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Jovens + Menores</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Jovens Presentes
          </span>
          <p className="text-2xl font-extrabold text-sky-700 dark:text-sky-400 mt-1">{totalJovens}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Mocidade</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Menores (Crianças)
          </span>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{totalMenores}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Meninos e Meninas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Coleta Consolidada
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
            {totalColeta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Ofertas da Reunião</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filtro Setor */}
          <select
            value={selectedSetorId}
            onChange={(e) => setSelectedSetorId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Todos os Setores</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>

          {/* Filtro Comum */}
          <select
            value={selectedComumId}
            onChange={(e) => setSelectedComumId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Todas as Congregações</option>
            {comuns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando {filteredApontamentos.length} registro(s)
        </span>
      </div>

      {/* Tabela de Apontamentos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Data / Horário</th>
                <th className="px-5 py-3.5">Comum Congregação</th>
                <th className="px-5 py-3.5 text-center">Jovens</th>
                <th className="px-5 py-3.5 text-center">Menores (M/F)</th>
                <th className="px-5 py-3.5 text-center">Total Geral</th>
                <th className="px-5 py-3.5 text-center">Materiais (B/H)</th>
                <th className="px-5 py-3.5 text-right">Coleta</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {filteredApontamentos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 text-sm">
                    Nenhum apontamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredApontamentos.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-xs">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">
                        {apt.data_reuniao.split('-').reverse().join('/')}
                      </div>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        {apt.horario}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{apt.comum_nome}</div>
                      <span className="text-[11px] text-slate-500">{apt.setor_nome}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-sky-700 dark:text-sky-400">
                      {apt.qtd_jovens}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-700 dark:text-slate-300">
                      {apt.qtd_meninos} / {apt.qtd_meninas}
                    </td>
                    <td className="px-5 py-3.5 text-center font-extrabold text-slate-900 dark:text-white">
                      {apt.qtd_jovens + apt.qtd_meninos + apt.qtd_meninas}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400">
                      {apt.qtd_biblias} Bíbl. / {apt.qtd_hinarios} Hin.
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                      {apt.coleta_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Enviado
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Apontamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-base">
                  Lançar Apontamento da Reunião
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarApontamento} className="p-6 overflow-y-auto space-y-4">
              {/* Comum */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Comum Congregação *
                </label>
                <select
                  value={novoApt.comum_id}
                  onChange={(e) => setNovoApt({ ...novoApt, comum_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {comuns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo ? `${c.codigo} - ` : ''}
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Data da Reunião *
                  </label>
                  <input
                    type="date"
                    value={novoApt.data_reuniao}
                    onChange={(e) => setNovoApt({ ...novoApt, data_reuniao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Horário da Reunião *
                  </label>
                  <select
                    value={novoApt.horario}
                    onChange={(e) => setNovoApt({ ...novoApt, horario: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="Domingo 10hs">Domingo 10hs</option>
                    <option value="Domingo 14:30hs">Domingo 14:30hs</option>
                  </select>
                </div>
              </div>

              {/* Quantidades Presença */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-400">
                    Qtd Jovens *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={novoApt.qtd_jovens}
                    onChange={(e) => setNovoApt({ ...novoApt, qtd_jovens: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 text-center font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
                    Meninos *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={novoApt.qtd_meninos}
                    onChange={(e) => setNovoApt({ ...novoApt, qtd_meninos: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 text-center font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
                    Meninas *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={novoApt.qtd_meninas}
                    onChange={(e) => setNovoApt({ ...novoApt, qtd_meninas: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 text-center font-bold"
                    required
                  />
                </div>
              </div>

              {/* Materiais e Coleta */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Bíblias
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={novoApt.qtd_biblias}
                    onChange={(e) => setNovoApt({ ...novoApt, qtd_biblias: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Hinários
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={novoApt.qtd_hinarios}
                    onChange={(e) => setNovoApt({ ...novoApt, qtd_hinarios: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                    Coleta (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={novoApt.coleta_valor}
                    onChange={(e) => setNovoApt({ ...novoApt, coleta_valor: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-center font-semibold text-emerald-700 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Apontamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
