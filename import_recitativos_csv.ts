import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltando SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeName(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseDate(dateStr: string): string | null {
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function run() {
  const csvPath = path.join(__dirname, 'Importa_recitativos.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo não encontrado: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂 Lendo arquivo: ${csvPath}`);
  const rawBuffer = fs.readFileSync(csvPath);
  // Arquivo gerado em Windows OEM / CP850
  const csvText = iconv.decode(rawBuffer, 'cp850');
  const lines = csvText.trim().split(/\r?\n/);

  console.log(`📄 Total de linhas no arquivo: ${lines.length}`);
  console.log(`📌 Cabeçalho: ${lines[0]}`);

  // Buscar todas as congregações cadastradas
  const { data: comuns, error: comunsError } = await supabase
    .from('comum_congregacao')
    .select('id, nome');
  if (comunsError) {
    throw new Error(`Erro ao buscar congregações: ${comunsError.message}`);
  }

  console.log(`⛪ Congregações cadastradas no sistema: ${comuns.length}`);

  const comunsMap = new Map<string, { id: string; nome: string }>();
  comuns.forEach(c => {
    comunsMap.set(normalizeName(c.nome), c);
  });

  interface RecordItem {
    data: string;
    comum_id: string;
    comum_nome: string;
    mocas: number;
    mocos: number;
    meninas: number;
    meninos: number;
  }

  const items: RecordItem[] = [];
  const unfound = new Set<string>();
  let skipCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    if (parts.length < 6) {
      skipCount++;
      continue;
    }

    const [dateStr, nomeComumRaw, mocasStr, mocosStr, meninasStr, meninosStr] = parts;
    const data = parseDate(dateStr);
    if (!data) {
      skipCount++;
      continue;
    }

    const norm = normalizeName(nomeComumRaw);
    let match = comunsMap.get(norm);

    // Fallback de aproximação
    if (!match) {
      for (const [k, v] of comunsMap.entries()) {
        if (k.includes(norm) || norm.includes(k)) {
          match = v;
          break;
        }
      }
    }

    if (!match) {
      unfound.add(nomeComumRaw);
      continue;
    }

    items.push({
      data,
      comum_id: match.id,
      comum_nome: match.nome,
      mocas: parseInt(mocasStr, 10) || 0,
      mocos: parseInt(mocosStr, 10) || 0,
      meninas: parseInt(meninasStr, 10) || 0,
      meninos: parseInt(meninosStr, 10) || 0,
    });
  }

  console.log(`\n📋 Registros válidos para processar: ${items.length}`);
  if (unfound.size > 0) {
    console.warn(`⚠️ Comuns não encontradas (${unfound.size}):`, Array.from(unfound));
  }
  if (skipCount > 0) {
    console.warn(`⚠️ Linhas ignoradas por formato inválido: ${skipCount}`);
  }

  if (items.length === 0) {
    console.log('Nenhum registro para importar.');
    return;
  }

  // Verificar existentes para evitar duplicidade e fazer update quando já existir
  const distinctDatas = Array.from(new Set(items.map(r => r.data)));
  const { data: existingRecitativos, error: existingError } = await supabase
    .from('recitativos')
    .select('id, data, comum_id')
    .in('data', distinctDatas);

  if (existingError) {
    throw new Error(`Erro ao consultar recitativos existentes: ${existingError.message}`);
  }

  const existingMap = new Map<string, string>(); // "data_comumId" -> id
  (existingRecitativos || []).forEach(r => {
    existingMap.set(`${r.data}_${r.comum_id}`, r.id);
  });

  const toInsert: any[] = [];
  const toUpdate: { id: string; payload: any }[] = [];

  for (const item of items) {
    const key = `${item.data}_${item.comum_id}`;
    const payload = {
      data: item.data,
      comum_id: item.comum_id,
      mocas: item.mocas,
      mocos: item.mocos,
      meninas: item.meninas,
      meninos: item.meninos,
    };

    const existingId = existingMap.get(key);
    if (existingId) {
      toUpdate.push({ id: existingId, payload });
    } else {
      toInsert.push(payload);
    }
  }

  console.log(`\n🚀 Iniciando importação no banco:`);
  console.log(`   - Novos registros para inserção: ${toInsert.length}`);
  console.log(`   - Registros existentes para atualização: ${toUpdate.length}`);

  let insertedCount = 0;
  let updatedCount = 0;
  let errorsCount = 0;

  // 1. Inserir novos em lotes
  const batchSize = 100;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('recitativos').insert(batch);
    if (error) {
      console.error(`Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorsCount += batch.length;
    } else {
      insertedCount += batch.length;
    }
  }

  // 2. Atualizar existentes
  for (const up of toUpdate) {
    const { error } = await supabase
      .from('recitativos')
      .update({
        ...up.payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', up.id);

    if (error) {
      console.error(`Erro ao atualizar recitativo ID ${up.id}:`, error.message);
      errorsCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`\n🎉 Processamento concluído com sucesso!`);
  console.log(`   ✅ Inseridos: ${insertedCount}`);
  console.log(`   🔄 Atualizados: ${updatedCount}`);
  if (errorsCount > 0) {
    console.log(`   ❌ Erros: ${errorsCount}`);
  }
}

run().catch(err => {
  console.error('❌ Falha na execução:', err);
  process.exit(1);
});
