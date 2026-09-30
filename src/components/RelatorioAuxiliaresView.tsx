import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, HeartHandshake
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { ComumCongregacao, Usuario, ContagemMocidade, AuxiliarJovens } from '../types';
import { apiGet } from '../utils/api';

interface Props {
  comuns: ComumCongregacao[];
  usuarios: Usuario[];
}

export const RelatorioAuxiliaresView: React.FC<Props> = ({ comuns: propComuns, usuarios: propUsuarios }) => {
  const [loading, setLoading] = useState(true);

  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);
  const [auxiliares, setAuxiliares] = useState<AuxiliarJovens[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resContagens, resAuxiliares] = await Promise.all([
          apiGet('/api/contagens'),
          apiGet('/api/auxiliares').catch(() => ({ ok: true, json: () => ({ data: [] }) }))
        ]);
        
        const [jsonContagens, jsonAuxiliares] = await Promise.all([
          resContagens.ok ? resContagens.json() : { data: [] },
          'ok' in resAuxiliares ? resAuxiliares.json() : { data: [] }
        ]);

        setContagens(jsonContagens.data || []);
        setAuxiliares(jsonAuxiliares.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const comuns = propComuns;
  const usuarios = propUsuarios;

  const totalCjms = useMemo(() => {
    return usuarios.filter(u => u.cargo_ministerio?.toLowerCase().includes('cjm') && u.ativo).length;
  }, [usuarios]);

  const totalAuxiliares = useMemo(() => {
    return auxiliares.filter(a => a.ativo).length;
  }, [auxiliares]);

  const totalMocidade = useMemo(() => {
    // Pega a maior contagem de mocidade de cada congregação no ano atual
    const currentYear = new Date().getFullYear().toString();
    const maxPorComum: Record<string, number> = {};
    
    contagens.forEach(c => {
      if (c.tipo === 'Mocidade' && c.data.startsWith(currentYear)) {
        if (!maxPorComum[c.comum_id] || c.quantidade > maxPorComum[c.comum_id]) {
          maxPorComum[c.comum_id] = c.quantidade;
        }
      }
    });
    
    return Object.values(maxPorComum).reduce((a, b) => a + b, 0);
  }, [contagens]);

  const chartData = useMemo(() => {
    const data = comuns.map(comum => {
      const auxComum = auxiliares.filter(a => a.comum_id === comum.id && a.ativo);
      const irmaos = auxComum.filter(a => a.sexo === 'Masculino').length;
      const irmas = auxComum.filter(a => a.sexo === 'Feminino').length;
      const total = irmaos + irmas;
      
      // Encurta nomes muito grandes
      let shortName = comum.nome;
      if (shortName.length > 15) {
        shortName = shortName.substring(0, 15) + '...';
      }

      return {
        id: comum.id,
        nome: comum.nome,
        shortName,
        irmaos,
        irmas,
        total
      };
    });
    
    // Sort by name or total? The mockup seems random or alphabetical.
    return data.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [comuns, auxiliares]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Carregando relatório...</p>
      </div>
    );
  }

  // Custom Label for the total on top of stacked bars
  const renderTotalLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const total = chartData[index].total;
    
    if (total === 0) return null;

    return (
      <g>
        <rect 
          x={x + width / 2 - 12} 
          y={y - 25} 
          width="24" 
          height="16" 
          fill="#f1f5f9" 
          rx="4"
        />
        <text 
          x={x + width / 2} 
          y={y - 14} 
          fill="#1e293b" 
          fontSize="11" 
          fontWeight="bold"
          textAnchor="middle"
        >
          {total}
        </text>
      </g>
    );
  };

  // Custom label inside the bars
  const renderInsideLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0 || height < 15) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2 + 4} 
        fill="#ffffff" 
        fontSize="10" 
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded shadow-md overflow-hidden border border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        
        {/* Card CJMs */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-slate-800">{totalCjms}</div>
          <div className="w-full bg-[#c0c0c0] text-[#333] text-center text-xs font-bold py-1.5 mt-2 rounded">
            Quantidade de CJMs
          </div>
        </div>

        {/* Card Auxiliares */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-slate-800">{totalAuxiliares}</div>
          <div className="w-full bg-[#c0c0c0] text-[#333] text-center text-xs font-bold py-1.5 mt-2 rounded">
            Quantidade de Auxiliares
          </div>
        </div>

        {/* Card Mocidade */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-slate-800">{totalMocidade.toLocaleString('pt-BR')}</div>
          <div className="w-full bg-[#c0c0c0] text-[#333] text-center text-xs font-bold py-1.5 mt-2 rounded">
            Quantidade de Mocidade
          </div>
        </div>

      </div>

      {/* Gráfico Stacked */}
      <div className="bg-white p-4 rounded shadow-md border border-slate-200 h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="shortName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 10, angle: -45, textAnchor: 'end' }} 
              interval={0}
            />
            <YAxis hide />
            <RechartsTooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value, name) => [value, name]}
            />
            
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            <Bar dataKey="irmaos" name="Moços (Azul)" stackId="a" fill="#3b82f6" barSize={20}>
              <LabelList dataKey="irmaos" content={renderInsideLabel} />
            </Bar>
            <Bar dataKey="irmas" name="Moças (Rosa)" stackId="a" fill="#f472b6" barSize={20}>
              <LabelList dataKey="irmas" content={renderInsideLabel} />
              <LabelList dataKey="total" content={renderTotalLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
