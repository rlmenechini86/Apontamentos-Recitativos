import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

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

async function run() {
  const dataPath = path.join(__dirname, 'data_mocidade_2026.tsv');
  const tsv = fs.readFileSync(dataPath, 'utf-8');
  const lines = tsv.trim().split('\n');

  // get comuns mapping
  const { data: comuns, error: comunsError } = await supabase.from('comum_congregacao').select('id, nome');
  if (comunsError) throw comunsError;

  const comunsMap = new Map();
  comuns.forEach(c => {
    // Normalizar nomes para ajudar no matching
    comunsMap.set(c.nome.trim().toLowerCase(), c.id);
  });

  const headers = lines[0].split('\t');
  // headers: Comum Congregação	01/01/2026
  const dates = headers.slice(1); // Todos depois do nome da comum

  const inserts: any[] = [];
  let unfoundCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split('\t');
    const nomeComum = columns[0].trim();
    const values = columns.slice(1); // counts for each date
    
    // Tentativa de achar o ID
    let comumId = comunsMap.get(nomeComum.toLowerCase());
    
    // Fallbacks para nomes ligeiramente diferentes
    if (!comumId) {
      if (nomeComum === 'Água Azul') comumId = comunsMap.get('agua azul');
      if (nomeComum === 'Agua Azul') comumId = comunsMap.get('água azul');
    }

    if (!comumId) {
      // Find matching using includes or something similar
      const possibleMatch = comuns.find(c => c.nome.toLowerCase().includes(nomeComum.toLowerCase()) || nomeComum.toLowerCase().includes(c.nome.toLowerCase()));
      if (possibleMatch) {
        comumId = possibleMatch.id;
      } else {
        console.warn(`⚠️ Comum não encontrada no BD: "${nomeComum}"`);
        unfoundCount++;
        continue;
      }
    }

    for (let d = 0; d < dates.length; d++) {
      const dateStr = dates[d].trim(); // DD/MM/YYYY
      const countStr = values[d]?.trim();
      
      if (!countStr) continue;
      
      const count = parseInt(countStr, 10);
      if (isNaN(count)) continue;
      
      // parse date "01/01/2021" to "2021-01-01"
      const [day, month, year] = dateStr.split('/');
      const isoDate = `${year}-${month}-${day}`;

      inserts.push({
        comum_id: comumId,
        data: isoDate,
        quantidade: count,
        tipo: 'Mocidade'
      });
    }
  }

  console.log(`Preparando para inserir ${inserts.length} registros...`);
  if (unfoundCount > 0) {
    console.log(`(Aviso: ${unfoundCount} congregações não foram encontradas)`);
  }

  if (inserts.length === 0) {
    console.log("Nada a inserir.");
    return;
  }

  // batch insert
  const { error: insertError } = await supabase.from('contagens_mocidade').insert(inserts);
  if (insertError) {
    console.error("Erro ao inserir:", insertError);
  } else {
    console.log("✅ Inserções realizadas com sucesso!");
  }
}

run().catch(console.error);
