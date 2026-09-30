import { supabase } from '../config/supabase.js';
import {
  ComumCongregacao,
  CreateComumDTO,
  UpdateComumDTO,
  ComumFilterOptions,
} from '../types/index.js';
import { setorService } from './setorService.js';


export class ComumCongregacaoService {
  /**
   * Status de conexão com o Supabase e tabelas
   */
  async checkStatus(): Promise<{ connected: boolean; tableExists: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from('comum_congregacao').select('id').limit(1);
      if (error) {
        return {
          connected: true,
          tableExists: false,
          message: `Conectado ao Supabase, mas a tabela 'comum_congregacao' ainda não existe ou não foi inicializada: ${error.message}`,
        };
      }
      return {
        connected: true,
        tableExists: true,
        message: 'Tabelas sincronizadas no banco de dados Supabase.',
      };
    } catch (err: any) {
      return {
        connected: false,
        tableExists: false,
        message: `Erro ao conectar com Supabase: ${err.message}`,
      };
    }
  }

  /**
   * READ: Lista as Comuns Congregações com suporte a filtros
   */
  async list(filters?: ComumFilterOptions): Promise<{ data: ComumCongregacao[]; source: 'supabase' | 'in-memory' }> {
    try {
      let query = supabase
        .from('comum_congregacao')
        .select(`
          *,
          setores:setor_id (
            id,
            codigo,
            nome,
            cidade,
            estado
          )
        `)
        .order('nome', { ascending: true });

      if (filters?.setor_id) {
        query = query.eq('setor_id', filters.setor_id);
      }
      if (filters?.cidade) {
        query = query.ilike('cidade', `%${filters.cidade}%`);
      }
      if (filters?.ativo !== undefined) {
        query = query.eq('ativo', filters.ativo);
      }
      if (filters?.search) {
        query = query.or(`nome.ilike.%${filters.search}%,codigo.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[ComumService] Consulta no Supabase falhou:', error.message);
        throw new Error(error.message);
      }

      return { data: (data as unknown as ComumCongregacao[]) || [], source: 'supabase' };
    } catch (err: any) {
      console.error('[ComumService] Exceção na listagem:', err.message);
      throw err;
    }
  }

  /**
   * READ: Obtém uma Comum Congregação pelo ID
   */
  async getById(id: string): Promise<ComumCongregacao | null> {
    try {
      const { data, error } = await supabase
        .from('comum_congregacao')
        .select(`
          *,
          setores:setor_id (
            id,
            codigo,
            nome,
            cidade,
            estado
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return data as unknown as ComumCongregacao;
    } catch (err: any) {
      console.error('[ComumService] Erro ao buscar por ID:', err.message);
      throw err;
    }
  }

  /**
   * Gera o próximo código de controle interno sequencial (ex: CC-001, CC-002...)
   */
  async generateNextCodigo(): Promise<string> {
    try {
      const { data } = await supabase.from('comum_congregacao').select('codigo');
      let maxNum = 0;
      if (data && data.length > 0) {
        for (const item of data) {
          if (item.codigo) {
            const match = item.codigo.match(/CC-(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
        }
      }
      const nextNum = maxNum + 1;
      return `CC-${String(nextNum).padStart(3, '0')}`;
    } catch (err: any) {
      console.error('[ComumService] Erro ao gerar próximo código:', err.message);
      throw err;
    }
  }

  /**
   * CREATE: Cadastra uma nova Comum Congregação vinculada ao Setor
   */
  async create(dto: CreateComumDTO): Promise<ComumCongregacao> {
    // Validações de Regra de Negócio
    if (!dto.nome?.trim()) {
      throw new Error('O nome da Comum Congregação é obrigatório.');
    }
    if (!dto.setor_id?.trim()) {
      throw new Error('Toda Comum Congregação deve obrigatoriamente estar vinculada a um Setor.');
    }

    // Código de controle interno gerado automaticamente caso não fornecido
    const codigo = dto.codigo?.trim() || (await this.generateNextCodigo());

    const setor = await setorService.getById(dto.setor_id);
    const setor_pertencente = dto.setor_pertencente?.trim() || setor?.nome || 'Setor 1 - Centro';

    const newRecordPayload: Record<string, any> = {
      setor_id: dto.setor_id,
      setor_pertencente,
      codigo,
      nome: dto.nome.trim(),
      dia_reuniao_jovens: dto.dia_reuniao_jovens?.trim() || 'Domingo 10hs',
      anciao_id: (dto as any).anciao_id || null,
      ativo: dto.ativo !== undefined ? dto.ativo : true,
    };

    // Campos legados preenchidos para compatibilidade antes da migration
    if (dto.cidade || setor?.cidade) newRecordPayload.cidade = dto.cidade?.trim() || setor?.cidade || 'Guarulhos';
    if (dto.estado || setor?.estado) newRecordPayload.estado = dto.estado?.trim() || setor?.estado || 'SP';

    try {
      let { data, error } = await supabase
        .from('comum_congregacao')
        .insert([newRecordPayload])
        .select(`
          *,
          setores:setor_id (
            id,
            codigo,
            nome,
            cidade,
            estado
          )
        `)
        .single();

      // Se a coluna setor_pertencente ainda não existir no cache do Supabase (pré-migration),
      // faz fallback automático sem o campo
      if (error && error.message?.includes('setor_pertencente')) {
        const fallbackPayload = { ...newRecordPayload };
        delete fallbackPayload.setor_pertencente;
        const retry = await supabase
          .from('comum_congregacao')
          .insert([fallbackPayload])
          .select(`
            *,
            setores:setor_id (
              id,
              codigo,
              nome,
              cidade,
              estado
            )
          `)
          .single();
        data = retry.data;
        error = retry.error;
      }

      // Se as colunas antigas cidade/estado já tiverem sido removidas (pós-migration)
      if (error && (error.message?.includes('cidade') || error.message?.includes('estado'))) {
        const cleanPayload = { ...newRecordPayload };
        delete cleanPayload.cidade;
        delete cleanPayload.estado;
        delete cleanPayload.endereco;
        delete cleanPayload.bairro;
        delete cleanPayload.cep;
        const retry = await supabase
          .from('comum_congregacao')
          .insert([cleanPayload])
          .select(`
            *,
            setores:setor_id (
              id,
              codigo,
              nome,
              cidade,
              estado
            )
          `)
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('[ComumService] Falha ao gravar no Supabase:', error.message);
        throw new Error(error.message);
      }

      return data as unknown as ComumCongregacao;
    } catch (err: any) {
      console.error('[ComumService] Exceção ao gravar no Supabase:', err.message);
      throw err;
    }
  }

  /**
   * UPDATE: Atualiza os dados de uma Comum Congregação
   */
  async update(id: string, dto: UpdateComumDTO): Promise<ComumCongregacao> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Comum Congregação com ID '${id}' não encontrada.`);
    }

    const updatePayload: Record<string, any> = {};
    if (dto.nome !== undefined) updatePayload.nome = dto.nome.trim();
    if (dto.setor_id !== undefined) {
      updatePayload.setor_id = dto.setor_id;
      const setor = await setorService.getById(dto.setor_id);
      if (setor) updatePayload.setor_pertencente = setor.nome;
    }
    if (dto.setor_pertencente !== undefined) updatePayload.setor_pertencente = dto.setor_pertencente.trim();
    if (dto.codigo !== undefined) updatePayload.codigo = dto.codigo.trim();
    if (dto.dia_reuniao_jovens !== undefined) updatePayload.dia_reuniao_jovens = dto.dia_reuniao_jovens?.trim() || null;
    if ((dto as any).anciao_id !== undefined) updatePayload.anciao_id = (dto as any).anciao_id || null;
    if (dto.ativo !== undefined) updatePayload.ativo = dto.ativo;

    try {
      let { data, error } = await supabase
        .from('comum_congregacao')
        .update(updatePayload)
        .eq('id', id)
        .select(`
          *,
          setores:setor_id (
            id,
            codigo,
            nome,
            cidade,
            estado
          )
        `)
        .single();

      if (error && error.message?.includes('setor_pertencente')) {
        const fallbackPayload = { ...updatePayload };
        delete fallbackPayload.setor_pertencente;
        const retry = await supabase
          .from('comum_congregacao')
          .update(fallbackPayload)
          .eq('id', id)
          .select(`
            *,
            setores:setor_id (
              id,
              codigo,
              nome,
              cidade,
              estado
            )
          `)
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('[ComumService] Falha no update Supabase:', error.message);
        throw new Error(error.message);
      }

      return data as unknown as ComumCongregacao;
    } catch (err: any) {
      console.error('[ComumService] Exceção no update Supabase:', err.message);
      throw err;
    }
  }

  /**
   * DELETE: Remove uma Comum Congregação
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Comum Congregação com ID '${id}' não encontrada.`);
    }

    try {
      const { error } = await supabase
        .from('comum_congregacao')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ComumService] Falha no delete Supabase:', error.message);
        throw new Error(error.message);
      }

      return true;
    } catch (err: any) {
      console.error('[ComumService] Exceção no delete Supabase:', err.message);
      throw err;
    }
  }

}

export const comumCongregacaoService = new ComumCongregacaoService();
