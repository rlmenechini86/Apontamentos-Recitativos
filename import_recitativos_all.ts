import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltando SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(dateStr: string): string | null {
  // Format: DD/MM/YYYY -> YYYY-MM-DD
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function run() {
  // Read with Windows-1252 encoding by converting first
  const rawBuffer = fs.readFileSync(path.join(__dirname, 'Apontamentos.tsv'));
  // Try to decode as latin1 (covers Windows-1252 characters like ç, ã, etc.)
  const tsv = rawBuffer.toString('latin1');
  const lines = tsv.trim().split(/\r?\n/);

  console.log(`Total de linhas no arquivo: ${lines.length}`);
  console.log(`Header: ${lines[0]}`);

  // Get comuns mapping
  const { data: comuns, error: comunsError } = await supabase
    .from('comum_congregacao')
    .select('id, nome');
  if (comunsError) throw comunsError;

  console.log(`Comuns cadastradas: ${comuns!.length}`);

  const comunsMap = new Map<string, string>();
  comuns!.forEach(c => {
    comunsMap.set(c.nome.trim().toLowerCase(), c.id);
  });

  const inserts: any[] = [];
  let unfoundCount = 0;
  const unfoundNames = new Set<string>();
  let skipCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split('\t');
    if (columns.length < 6) {
      skipCount++;
      continue;
    }

    const [dateStr, nomeComumRaw, mocasStr, mocosStr, meninasStr, meninosStr] = columns;

    const data = parseDate(dateStr);
    if (!data) {
      skipCount++;
      continue;
    }

    const nomeComum = nomeComumRaw.trim();
    let comumId = comunsMap.get(nomeComum.toLowerCase());

    // Fuzzy match fallback
    if (!comumId) {
      const possibleMatch = comuns!.find(c =>
        c.nome.toLowerCase().includes(nomeComum.toLowerCase()) ||
        nomeComum.toLowerCase().includes(c.nome.toLowerCase())
      );
      if (possibleMatch) comumId = possibleMatch.id;
    }

    if (!comumId) {
      unfoundCount++;
      unfoundNames.add(nomeComum);
      continue;
    }

    const mocas = parseInt(mocasStr) || 0;
    const mocos = parseInt(mocosStr) || 0;
    const meninas = parseInt(meninasStr) || 0;
    const meninos = parseInt(meninosStr) || 0;

    inserts.push({
      data,
      comum_id: comumId,
      mocas,
      mocos,
      meninas,
      meninos,
    });
  }

  console.log(`\nRegistros prontos para inserir: ${inserts.length}`);
  console.log(`Registros ignorados (sem comum): ${unfoundCount}`);
  console.log(`Registros pulados (dados inválidos): ${skipCount}`);
  
  if (unfoundNames.size > 0) {
    console.log(`\nNomes não encontrados:`);
    Array.from(unfoundNames).sort().forEach(n => console.log(`  - "${n}"`));
  }

  if (inserts.length === 0) {
    console.log('\nNenhum registro para inserir.');
    return;
  }

  // Insert in batches of 200
  const batchSize = 200;
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    const { error } = await supabase.from('recitativos').insert(batch);
    if (error) {
      console.error(`Erro no batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      totalErrors += batch.length;
    } else {
      totalInserted += batch.length;
      process.stdout.write(`\rInseridos: ${totalInserted}/${inserts.length}`);
    }
  }

  console.log(`\n\n✅ Importação concluída!`);
  console.log(`   Inseridos com sucesso: ${totalInserted}`);
  console.log(`   Erros: ${totalErrors}`);
}

run().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
