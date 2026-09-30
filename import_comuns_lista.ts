import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const comunsList = [
  "Cid. Nova Soberana", "Inocoop I", "Inocoop II", "Jd. Álamo", "Jd. Fátima", 
  "Jd. Fortaleza", "Jd. Fortaleza II", "Jd. Fortaleza III", "Jd. Hanna", "Jd. Jade", 
  "Jd. Lavras", "Jd. Lenize", "Jd. Maria Dirce", "Jd. Munira", "Jd. Novo Portugal", 
  "Jd. Ponte Alta", "Jd. Ponte Alta II", "Jd. Pres. Dutra", "Jd. St. Paula", "Jd. Triunfo", 
  "Jd. Vila Rica", "Jd. Vila Rica II", "Maria Paula", "Orquidiama", "Pq. Residencial Bambi", 
  "Pq. Santos Dumont", "Pq. São Luiz", "Soberana I", "Soberana II", "Vila Carmela", 
  "Vila Nova Bonsucesso", "Vila São João", "Vila São José", "Vila União", "Jd Bananal"
];

async function main() {
  console.log('Buscando Setor 3 - Bonsucesso...');
  const { data: setor, error: errSetor } = await supabase
    .from('setores')
    .select('*')
    .ilike('nome', '%Bonsucesso%')
    .limit(1)
    .single();
  
  if (errSetor || !setor) {
    console.log('Setor não encontrado:', errSetor);
    return;
  }
  console.log('Setor encontrado:', setor.nome, setor.id);

  console.log('Buscando código máximo existente...');
  const { data: maxCodData, error: codErr } = await supabase.from('comum_congregacao').select('codigo');
  let maxNum = 0;
  maxCodData?.forEach(item => {
    if (item.codigo) {
      const match = item.codigo.match(/CC-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  console.log('Maior número de código atual:', maxNum);

  console.log('Preparando inserts...');
  const toInsert = comunsList.map((nome, index) => {
    const nextNum = maxNum + 1 + index;
    const codigo = `CC-${String(nextNum).padStart(3, '0')}`;
    return {
      nome,
      setor_id: setor.id,
      setor_pertencente: 'Setor 3 - Bonsucesso', // Fix string due to table schema constraints
      dia_reuniao_jovens: 'Domingo 10hs',
      codigo,
      ativo: true
    };
  });

  console.log('Inserindo no banco...');
  const { data, error } = await supabase.from('comum_congregacao').insert(toInsert).select('*');
  
  if (error) {
    console.error('Erro ao inserir:', error);
    // Maybe setor_pertencente constraint or something? Let's try without it if it fails
  } else {
    console.log(`Sucesso! Inseridas ${data.length} congregações.`);
  }
}

main().catch(console.error);
