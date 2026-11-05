import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PreCadastro,
  CreatePreCadastroDTO,
} from '../types/index.js';
import { usuarioService } from './usuarioService.js';
import { setorService } from './setorService.js';
import { comumCongregacaoService } from './comumCongregacaoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORAGE_PATH = path.resolve(__dirname, '../../../data/pre_cadastros.json');

function loadLocalPreCadastros(): PreCadastro[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[PreCadastroService] Erro ao carregar arquivo local:', err);
    return [];
  }
}

function saveLocalPreCadastros(list: PreCadastro[]): void {
  try {
    const dir = path.dirname(LOCAL_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PreCadastroService] Erro ao salvar arquivo local:', err);
  }
}

export class PreCadastroService {
  /**
   * Retorna os setores e congregações ativos para o formulário público
   */
  async getPublicMeta(): Promise<{ setores: any[]; comuns: any[] }> {
    try {
      const [setoresRes, comunsRes] = await Promise.all([
        setorService.listAll(),
        comumCongregacaoService.list(),
      ]);

      const setores = (setoresRes.data || []).filter((s: any) => s.ativo !== false);
      const comuns = (comunsRes.data || [])
        .filter((c: any) => c.ativo !== false)
        .map((c: any) => ({
          id: c.id,
          nome: c.nome,
          codigo: c.codigo,
          setor_id: c.setor_id,
          setor_pertencente: c.setor_pertencente || c.setores?.nome || '',
        }));

      return { setores, comuns };
    } catch (err: any) {
      console.error('[PreCadastroService] Erro ao carregar meta público:', err.message);
      return { setores: [], comuns: [] };
    }
  }

  /**
   * Salva uma nova solicitação de pré-cadastro (Público)
   */
  async createPublic(dto: CreatePreCadastroDTO): Promise<PreCadastro> {
    if (!dto.nome_completo?.trim()) {
      throw new Error('O Nome Completo é obrigatório.');
    }
    if (!dto.email?.trim()) {
      throw new Error('O E-mail é obrigatório.');
    }
    if (!dto.celular?.trim()) {
      throw new Error('O Celular / WhatsApp é obrigatório.');
    }
    if (!dto.cargo?.trim()) {
      throw new Error('O Cargo é obrigatório.');
    }
    if (!dto.comum_congregacao_id?.trim()) {
      throw new Error('A Comum Congregação é obrigatória.');
    }

    const cleanEmail = dto.email.trim().toLowerCase();

    // 1. Verifica se já existe usuário ativo com este e-mail no sistema
    const existingUser = await usuarioService.getByEmail(cleanEmail);
    if (existingUser) {
      throw new Error('Já existe um usuário com este e-mail cadastrado e ativo no sistema.');
    }

    // 2. Busca dados da comum selecionada para preencher setor_id e setor_pertencente caso não informados
    let resolvedSetorId = dto.setor_id || null;
    let resolvedSetorNome = dto.setor_pertencente || null;

    if (!resolvedSetorId || !resolvedSetorNome) {
      try {
        const c = await comumCongregacaoService.getById(dto.comum_congregacao_id);
        if (c) {
          resolvedSetorId = resolvedSetorId || c.setor_id || null;
          resolvedSetorNome = resolvedSetorNome || c.setor_pertencente || c.setores?.nome || null;
        }
      } catch (e) {
        // Ignora caso falhe a busca da comum
      }
    }

    const payload: Record<string, any> = {
      nome_completo: dto.nome_completo.trim(),
      email: cleanEmail,
      celular: dto.celular.trim(),
      cargo: dto.cargo.trim(),
      data_apresentacao: dto.data_apresentacao || null,
      data_nascimento: dto.data_nascimento || null,
      ano_casamento: dto.ano_casamento ? Number(dto.ano_casamento) : null,
      selado_promessa: dto.selado_promessa !== undefined ? Boolean(dto.selado_promessa) : null,
      ano_batismo: dto.ano_batismo ? Number(dto.ano_batismo) : null,
      setor_id: resolvedSetorId,
      setor_pertencente: resolvedSetorNome,
      comum_congregacao_id: dto.comum_congregacao_id,
      status: 'pendente',
    };

    // Tenta gravar no Supabase
    try {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .insert([payload])
        .select(`
          *,
          comum_congregacao:comum_congregacao_id (
            id,
            nome,
            codigo,
            setor_pertencente
          ),
          setores:setor_id (
            id,
            nome
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return data as PreCadastro;
    } catch (err: any) {
      console.warn('[PreCadastroService] Supabase indisponível ou tabela ainda não criada. Usando armazenamento local:', err.message);

      // Fallback local caso a tabela ainda não tenha sido criada no Supabase
      const list = loadLocalPreCadastros();
      const newLocalItem: PreCadastro = {
        id: (payload.id as string) || `pc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nome_completo: payload.nome_completo,
        email: payload.email,
        celular: payload.celular,
        cargo: payload.cargo,
        data_apresentacao: payload.data_apresentacao,
        data_nascimento: payload.data_nascimento,
        ano_casamento: payload.ano_casamento,
        selado_promessa: payload.selado_promessa,
        ano_batismo: payload.ano_batismo,
        setor_id: payload.setor_id,
        setor_pertencente: payload.setor_pertencente,
        comum_congregacao_id: payload.comum_congregacao_id,
        status: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      list.unshift(newLocalItem);
      saveLocalPreCadastros(list);
      return newLocalItem;
    }
  }

  /**
   * Lista os pré-cadastros cadastrados (com suporte a filtro setorial)
   */
  async list(filters?: { setorId?: string; setorNome?: string; status?: string; search?: string }): Promise<PreCadastro[]> {
    try {
      let query = supabase
        .from('pre_cadastros')
        .select(`
          *,
          comum_congregacao:comum_congregacao_id (
            id,
            nome,
            codigo,
            setor_pertencente
          ),
          setores:setor_id (
            id,
            nome
          ),
          perfis:perfil_id (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.setorId) {
        query = query.eq('setor_id', filters.setorId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      let result = (data as PreCadastro[]) || [];

      // Filtro adicional por setorNome ou busca caso necessário
      if (filters?.setorNome && !filters?.setorId) {
        result = result.filter(item =>
          item.setor_pertencente === filters.setorNome ||
          item.comum_congregacao?.setor_pertencente === filters.setorNome
        );
      }

      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(item =>
          item.nome_completo?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.celular?.toLowerCase().includes(q) ||
          item.comum_congregacao?.nome?.toLowerCase().includes(q)
        );
      }

      return result;
    } catch (err: any) {
      console.warn('[PreCadastroService] Consulta Supabase falhou, recorrendo a dados locais:', err.message);
      let list = loadLocalPreCadastros();

      if (filters?.status) {
        list = list.filter(item => item.status === filters.status);
      }
      if (filters?.setorId) {
        list = list.filter(item => item.setor_id === filters.setorId);
      }
      if (filters?.setorNome) {
        list = list.filter(item => item.setor_pertencente === filters.setorNome);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(item =>
          item.nome_completo?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.celular?.toLowerCase().includes(q)
        );
      }
      return list;
    }
  }

  /**
   * Aprova o pré-cadastro: cria o usuário em `usuarios` e atualiza o status para `aprovado`
   */
  async aprovar(id: string, perfilId: string, adminUserId?: string): Promise<{ preCadastro: PreCadastro; usuario: any }> {
    if (!perfilId) {
      throw new Error('É obrigatório selecionar um Perfil de Acesso para aprovar o cadastro.');
    }

    // 1. Busca o pré-cadastro
    let pre: PreCadastro | null = null;
    try {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        pre = data as PreCadastro;
      }
    } catch (e) {
      // continua para fallback
    }

    if (!pre) {
      const localList = loadLocalPreCadastros();
      pre = localList.find(x => x.id === id) || null;
    }

    if (!pre) {
      throw new Error('Solicitação de pré-cadastro não encontrada.');
    }

    if (pre.status === 'aprovado') {
      throw new Error('Este pré-cadastro já foi aprovado anteriormente.');
    }

    // 2. Cria o usuário definitivo
    const novoUsuario = await usuarioService.create({
      nome_completo: pre.nome_completo,
      email: pre.email,
      celular: pre.celular,
      cargo_ministerio: pre.cargo,
      data_apresentacao: pre.data_apresentacao || null,
      data_nascimento: pre.data_nascimento || null,
      ano_casamento: pre.ano_casamento || null,
      selado_promessa: pre.selado_promessa,
      ano_batismo: pre.ano_batismo || null,
      perfil_id: perfilId,
      comum_congregacao_id: pre.comum_congregacao_id || null,
      ativo: true,
    });

    const now = new Date().toISOString();

    // 3. Atualiza o status em `pre_cadastros`
    try {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'aprovado',
          perfil_id: perfilId,
          usuario_id: novoUsuario.id,
          aprovado_por: adminUserId || null,
          aprovado_em: now,
          updated_at: now,
        })
        .eq('id', id)
        .select(`
          *,
          comum_congregacao:comum_congregacao_id (
            id,
            nome,
            codigo
          ),
          perfis:perfil_id (
            id,
            nome
          )
        `)
        .single();

      if (!error && data) {
        return { preCadastro: data as PreCadastro, usuario: novoUsuario };
      }
    } catch (e) {
      // continua para fallback local
    }

    // Fallback local
    const localList = loadLocalPreCadastros();
    const idx = localList.findIndex(x => x.id === id);
    if (idx >= 0) {
      localList[idx] = {
        ...localList[idx],
        status: 'aprovado',
        perfil_id: perfilId,
        usuario_id: novoUsuario.id,
        aprovado_por: adminUserId || null,
        aprovado_em: now,
        updated_at: now,
      };
      saveLocalPreCadastros(localList);
      return { preCadastro: localList[idx], usuario: novoUsuario };
    }

    return { preCadastro: pre, usuario: novoUsuario };
  }

  /**
   * Recusa o pré-cadastro
   */
  async recusar(id: string, motivo?: string, adminUserId?: string): Promise<PreCadastro> {
    const now = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'recusado',
          motivo_recusa: motivo?.trim() || 'Cadastro recusado pela administração.',
          aprovado_por: adminUserId || null,
          aprovado_em: now,
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        return data as PreCadastro;
      }
    } catch (e) {
      // continua para fallback local
    }

    const localList = loadLocalPreCadastros();
    const idx = localList.findIndex(x => x.id === id);
    if (idx >= 0) {
      localList[idx] = {
        ...localList[idx],
        status: 'recusado',
        motivo_recusa: motivo?.trim() || 'Cadastro recusado pela administração.',
        aprovado_por: adminUserId || null,
        aprovado_em: now,
        updated_at: now,
      };
      saveLocalPreCadastros(localList);
      return localList[idx];
    }

    throw new Error('Pré-cadastro não encontrado para recusa.');
  }
}

export const preCadastroService = new PreCadastroService();
