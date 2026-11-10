import { supabase } from '../config/supabase.js';
import { ContagemMocidade, CreateContagemMocidadeDTO, UpdateContagemMocidadeDTO, JustificativaDiminuicao, DetalheMusicoFamilia } from '../types/index.js';

function normalizeContagemRecord(raw: any): ContagemMocidade {
  if (!raw) return raw;
  const rawDetalhes = Array.isArray(raw.detalhes_musicos) ? raw.detalhes_musicos : [];
  const detalhesMusicos: DetalheMusicoFamilia[] = [];
  const embeddedJustificativas: JustificativaDiminuicao[] = [];

  for (const item of rawDetalhes) {
    if (item && item._tipo === 'justificativa_diminuicao') {
      if (item.motivo && Number(item.quantidade) > 0) {
        embeddedJustificativas.push({
          motivo: String(item.motivo),
          quantidade: Number(item.quantidade) || 0,
        });
      }
    } else if (item && item.familia) {
      detalhesMusicos.push({
        familia: String(item.familia),
        quantidade: Number(item.quantidade) || 0,
      });
    }
  }

  const colJustificativas: JustificativaDiminuicao[] = Array.isArray(raw.justificativas_diminuicao)
    ? raw.justificativas_diminuicao
        .filter((j: any) => j && j.motivo && Number(j.quantidade) > 0)
        .map((j: any) => ({ motivo: String(j.motivo), quantidade: Number(j.quantidade) || 0 }))
    : [];

  return {
    ...raw,
    detalhes_musicos: detalhesMusicos,
    justificativas_diminuicao: colJustificativas.length > 0 ? colJustificativas : embeddedJustificativas,
  };
}

function buildCombinedDetalhesJsonb(
  detalhes?: DetalheMusicoFamilia[],
  justificativas?: JustificativaDiminuicao[]
): any[] {
  const cleanMusicos = (Array.isArray(detalhes) ? detalhes : [])
    .filter((m: any) => m && m._tipo !== 'justificativa_diminuicao' && m.familia)
    .map(m => ({ familia: m.familia, quantidade: Number(m.quantidade) || 0 }));

  const cleanJustificativas = (Array.isArray(justificativas) ? justificativas : [])
    .filter(j => j && j.motivo && Number(j.quantidade) > 0)
    .map(j => ({
      _tipo: 'justificativa_diminuicao',
      motivo: j.motivo,
      quantidade: Number(j.quantidade) || 0,
    }));

  return [...cleanMusicos, ...cleanJustificativas];
}

export class ContagensService {
  async getAll(): Promise<{ data: ContagemMocidade[]; source: string }> {
    try {
      const { data, error } = await supabase
        .from('contagens_mocidade')
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .order('data', { ascending: false });

      if (error) throw new Error(error.message);
      const normalized = Array.isArray(data) ? data.map(normalizeContagemRecord) : [];
      return { data: normalized, source: 'supabase' };
    } catch (err: any) {
      console.error('[ContagensService] Exceção na listagem:', err.message);
      throw err;
    }
  }

  async create(dto: CreateContagemMocidadeDTO): Promise<ContagemMocidade> {
    if (!dto.data) throw new Error('Data é obrigatória');
    if (!dto.comum_id) throw new Error('Comum Congregação é obrigatória');
    if (!dto.tipo) throw new Error('Tipo é obrigatório');

    try {
      const sanitized: Record<string, any> = {
        data: dto.data,
        comum_id: dto.comum_id,
        tipo: dto.tipo,
        quantidade: Number(dto.quantidade) || 0,
      };
      if (dto.auxiliares_mocos !== undefined) sanitized.auxiliares_mocos = Number(dto.auxiliares_mocos) || 0;
      if (dto.auxiliares_mocas !== undefined) sanitized.auxiliares_mocas = Number(dto.auxiliares_mocas) || 0;
      if (dto.total_musicos !== undefined) sanitized.total_musicos = Number(dto.total_musicos) || 0;
      if (dto.detalhes_musicos !== undefined || dto.justificativas_diminuicao !== undefined) {
        sanitized.detalhes_musicos = buildCombinedDetalhesJsonb(dto.detalhes_musicos, dto.justificativas_diminuicao);
      }
      if (dto.cadastrado_por !== undefined) sanitized.cadastrado_por = dto.cadastrado_por || null;

      const { data, error } = await supabase
        .from('contagens_mocidade')
        .insert([sanitized])
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .single();

      if (error) throw new Error(error.message);
      return normalizeContagemRecord(data);
    } catch (err: any) {
      console.error('[ContagensService] Exceção na criação:', err.message);
      throw err;
    }
  }

  async update(id: string, dto: UpdateContagemMocidadeDTO): Promise<ContagemMocidade> {
    try {
      const sanitized: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (dto.data !== undefined) sanitized.data = dto.data;
      if (dto.comum_id !== undefined) sanitized.comum_id = dto.comum_id;
      if (dto.tipo !== undefined) sanitized.tipo = dto.tipo;
      if (dto.quantidade !== undefined) sanitized.quantidade = Number(dto.quantidade) || 0;
      if (dto.auxiliares_mocos !== undefined) sanitized.auxiliares_mocos = Number(dto.auxiliares_mocos) || 0;
      if (dto.auxiliares_mocas !== undefined) sanitized.auxiliares_mocas = Number(dto.auxiliares_mocas) || 0;
      if (dto.total_musicos !== undefined) sanitized.total_musicos = Number(dto.total_musicos) || 0;
      if (dto.detalhes_musicos !== undefined || dto.justificativas_diminuicao !== undefined) {
        sanitized.detalhes_musicos = buildCombinedDetalhesJsonb(dto.detalhes_musicos, dto.justificativas_diminuicao);
      }
      if (dto.cadastrado_por !== undefined) sanitized.cadastrado_por = dto.cadastrado_por || null;

      const { data, error } = await supabase
        .from('contagens_mocidade')
        .update(sanitized)
        .eq('id', id)
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .single();

      if (error) throw new Error(error.message);
      return normalizeContagemRecord(data);
    } catch (err: any) {
      console.error('[ContagensService] Exceção na atualização:', err.message);
      throw err;
    }
  }

  async getById(id: string): Promise<ContagemMocidade | null> {
    try {
      const { data, error } = await supabase
        .from('contagens_mocidade')
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .eq('id', id)
        .single();

      if (error) return null;
      return normalizeContagemRecord(data);
    } catch (err: any) {
      console.error('[ContagensService] Exceção ao buscar por ID:', err.message);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('contagens_mocidade')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    } catch (err: any) {
      console.error('[ContagensService] Exceção na exclusão:', err.message);
      throw err;
    }
  }
}
