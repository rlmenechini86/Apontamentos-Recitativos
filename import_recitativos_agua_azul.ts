import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const rawData = `Data	Nome da comum 	Moças	Moços	Meninas	Meninos
19/12/2019	Agua Azul	8	8	9	12
05/01/2020	Agua Azul	7	6	7	10
12/01/2020	Agua Azul	8	8	9	9
19/01/2020	Agua Azul	14	8	6	7
02/02/2020	Agua Azul	6	7	9	8
09/02/2020	Agua Azul	5	10	9	8
16/02/2020	Agua Azul	10	9	8	8
23/02/2020	Agua Azul	5	9	12	15
08/03/2020	Agua Azul	8	9	11	7
13/12/2020	Agua Azul	8	7	3	6
20/12/2020	Agua Azul	4	5	1	2
17/01/2021	Agua Azul	2	8	4	6
14/02/2021	Agua Azul	6	3	8	7
25/04/2021	Agua Azul	7	5	9	5
09/05/2021	Agua Azul	5	4	1	3
16/05/2021	Agua Azul	6	6	6	8
30/05/2021	Agua Azul	3	3	3	6
06/06/2021	Agua Azul	3	4	5	6
13/06/2021	Agua Azul	8	5	4	7
20/06/2021	Agua Azul	4	3	3	8
27/06/2021	Agua Azul	4	2	4	8
04/07/2021	Agua Azul	5	7	6	4
11/07/2021	Agua Azul	11	10	5	4
18/07/2021	Agua Azul	5	4	4	9
25/07/2021	Agua Azul	11	10	7	6
08/08/2021	Agua Azul	5	3	3	7
15/08/2021	Agua Azul	3	3	7	10
22/08/2021	Agua Azul	6	4	9	9
05/09/2021	Agua Azul	8	3	4	9
12/09/2021	Agua Azul	6	3	10	6
19/09/2021	Agua Azul	4	5	7	10
26/09/2021	Agua Azul	5	7	5	9
17/10/2021	Agua Azul	8	7	9	10
24/10/2021	Agua Azul	18	13	4	3
31/10/2021	Agua Azul	8	8	8	9
07/11/2021	Agua Azul	8	7	7	13
14/11/2021	Agua Azul	4	4	8	7
21/11/2021	Agua Azul	4	5	5	10
28/11/2021	Agua Azul	6	6	8	10
02/01/2022	Agua Azul	6	7	4	7
09/01/2022	Agua Azul	5	3	2	8
16/01/2022	Agua Azul	4	4	3	5
23/01/2022	Agua Azul	19	20	9	9
30/01/2022	Agua Azul	5	4	2	9
06/02/2022	Agua Azul	6	4	5	12
13/02/2022	Agua Azul	7	3	4	10
20/02/2022	Agua Azul	5	8	11	11
27/02/2022	Agua Azul	5	5	9	15
06/03/2022	Agua Azul	8	6	6	9
13/03/2022	Agua Azul	5	5	3	9
20/03/2022	Agua Azul	4	3	7	6
27/03/2022	Agua Azul	6	5	8	12
03/04/2022	Agua Azul	5	5	7	7
10/04/2022	Agua Azul	4	6	6	9
17/04/2022	Agua Azul	7	4	6	8
24/04/2022	Agua Azul	11	8	8	10
01/05/2022	Agua Azul	6	5	10	9
08/05/2022	Agua Azul	6	5	10	9
15/05/2022	Agua Azul	4	2	12	9
22/05/2022	Agua Azul	5	7	8	12
29/05/2022	Agua Azul	10	15	10	18
05/06/2022	Agua Azul	5	4	9	12
19/06/2022	Agua Azul	5	3	14	8
26/06/2022	Agua Azul	4	3	2	7
03/07/2022	Agua Azul	5	8	4	5
10/07/2022	Agua Azul	4	3	5	9
17/07/2022	Agua Azul	5	3	9	14
24/07/2022	Agua Azul	5	3	7	10
31/07/2022	Agua Azul	11	12	5	8
07/08/2022	Agua Azul	4	3	5	9
14/08/2022	Agua Azul	5	3	4	7
21/08/2022	Agua Azul	6	6	10	8
28/08/2022	Agua Azul	1	3	7	8
04/09/2022	Agua Azul	21	25	10	5
11/09/2022	Agua Azul	5	4	5	9
18/09/2022	Agua Azul	5	5	9	4
25/09/2022	Agua Azul	5	3	6	7
02/10/2022	Agua Azul	5	4	6	8
09/10/2022	Agua Azul	5	5	10	12
16/10/2022	Agua Azul	4	10	11	10
23/10/2022	Agua Azul	4	4	8	6
30/10/2022	Agua Azul	5	3	5	2
06/11/2022	Agua Azul	4	3	12	5
13/11/2022	Agua Azul	4	8	21	15
20/11/2022	Agua Azul	6	3	12	10
27/11/2022	Agua Azul	4	4	4	9
04/12/2022	Agua Azul	7	7	7	3
11/12/2022	Agua Azul	7	7	10	15
18/12/2022	Agua Azul	7	4	10	11
25/12/2022	Agua Azul	5	3	9	5
01/01/2023	Agua Azul	7	3	3	8
08/01/2023	Agua Azul	7	3	4	7
15/01/2023	Agua Azul	5	4	6	8
22/01/2023	Agua Azul	5	4	6	12
29/01/2023	Agua Azul	6	5	8	14
05/02/2023	Agua Azul	6	5	9	13
12/02/2023	Agua Azul	6	4	6	13
19/02/2023	Agua Azul	7	3	7	4
26/02/2023	Agua Azul	7	5	6	11
05/03/2023	Agua Azul	17	17	14	5
12/03/2023	Agua Azul	7	4	18	14
19/03/2023	Agua Azul	7	1	10	9
26/03/2023	Agua Azul	6	5	13	12
02/04/2023	Agua Azul	4	5	8	4
09/04/2023	Agua Azul	6	3	8	3
16/04/2023	Agua Azul	7	4	7	8
23/04/2023	Agua Azul	7	6	11	10
30/04/2023	Agua Azul	7	7	7	7
07/05/2023	Agua Azul	10	6	8	2
14/05/2023	Agua Azul	5	5	8	4
21/05/2023	Agua Azul	5	3	10	10
28/05/2023	Agua Azul	6	7	13	11
04/06/2023	Agua Azul	6	5	14	15
18/06/2023	Agua Azul	6	5	10	8
25/06/2023	Agua Azul	6	7	13	11
02/07/2023	Agua Azul	14	15	9	4
09/07/2023	Agua Azul	5	7	5	3
16/07/2023	Agua Azul	5	10	12	5
23/07/2023	Agua Azul	5	6	10	9
30/07/2023	Agua Azul	6	6	8	9
06/08/2023	Agua Azul	20	22	19	10
13/08/2023	Agua Azul	06	06	09	05
20/08/2023	Agua Azul	6	8	13	11
27/08/2023	Agua Azul	05	07	06	07
27/08/2023	Agua Azul	05	06	07	08
03/09/2023	Agua Azul	05	08	15	10
10/09/2023	Agua Azul	06	10	13	10
17/09/2023	Agua Azul	9	13	8	10
24/09/2023	Agua Azul	16	22	15	06
01/10/2023	Agua Azul	07	06	12	10
08/10/2023	Agua Azul	05	06	12	11
15/10/2023	Agua Azul	06	06	14	13
22/10/2023	Agua Azul	06	05	16	14
29/10/2023	Agua Azul	04	10	12	08
05/11/2023	Agua Azul	4	10	7	3
12/11/2023	Agua Azul	02	04	11	15
19/11/2023	Agua Azul	3	7	13	11
26/11/2023	Agua Azul	04	06	12	14
10/12/2023	Agua Azul	2	6	11	12
17/12/2023	Agua Azul	2	7	14	8
24/12/2023	Agua Azul	4	5	12	8
24/12/2023	Agua Azul	4	5	12	8
31/12/2023	Agua Azul	1	10	16	14
07/01/2024	Agua Azul	5	7	13	12
14/01/2024	Agua Azul	9	8	11	10
21/01/2024	Agua Azul	8	6	6	9
28/01/2024	Agua Azul	9	8	10	9
04/02/2024	Agua Azul	8	6	11	14
11/02/2024	Agua Azul	6	10	12	11
18/02/2024	Agua Azul	7	6	8	11
25/02/2024	Agua Azul	10	10	16	10
03/03/2024	Agua Azul	10	9	10	11
10/03/2024	Agua Azul	10	7	12	9
17/03/2024	Agua Azul	8	6	3	10
24/03/2024	Agua Azul	4	6	8	7
07/04/2024	Agua Azul	09	07	07	10
14/04/2024	Agua Azul	11	10	8	5
21/04/2024	Agua Azul	7	10	9	9
28/04/2024	Agua Azul	9	9	11	9
05/05/2024	Agua Azul	5	7	9	11
12/05/2024	Agua Azul	8	8	7	7
26/05/2024	Agua Azul	6	10	9	7
02/06/2024	Agua Azul	5	8	10	4
09/06/2024	Agua Azul	0	0	0	0
16/06/2024	Agua Azul	10	11	11	8
23/06/2024	Agua Azul	8	9	17	9
30/06/2024	Agua Azul	8	7	11	7
07/07/2024	Agua Azul	8	9	10	9
14/07/2024	Agua Azul	9	12	14	7
21/07/2024	Agua Azul	9	9	12	10
28/07/2024	Agua Azul	7	11	11	12
11/08/2024	Agua Azul	7	9	7	6
18/08/2024	Agua Azul	8	11	9	12
25/08/2024	Agua Azul	6	6	6	8
01/09/2024	Agua Azul	8	9	12	18
08/09/2024	Agua Azul	10	11	8	7
15/09/2024	Agua Azul	9	12	9	8
22/09/2024	Agua Azul	12	11	11	17
06/10/2024	Agua Azul	6	7	7	10
13/10/2024	Agua Azul	11	12	20	15
20/10/2024	Agua Azul	11	5	7	10
20/10/2024	Agua Azul	11	5	7	10
27/10/2024	Agua Azul	9	8	10	10
03/11/2024	Agua Azul	8	6	7	10
10/11/2024	Agua Azul	9	8	9	10
17/11/2024	Agua Azul	11	6	15	13
24/11/2024	Agua Azul	12	10	12	15
01/12/2024	Agua Azul	12	8	7	13
08/12/2024	Agua Azul	10	8	11	8
15/12/2024	Agua Azul	10	3	8	6
22/12/2024	Agua Azul	4	7	8	5
29/12/2024	Agua Azul	11	5	13	13
05/01/2025	Agua Azul	8	9	8	7
12/01/2025	Agua Azul	8	7	8	7
19/01/2025	Agua Azul	6	11	12	14
26/01/2025	Agua Azul	12	10	10	12
02/02/2025	Agua Azul	7	9	11	6
09/02/2025	Agua Azul	10	8	12	14
16/02/2025	Agua Azul	10	10	10	10
23/02/2025	Agua Azul	11	8	13	14
02/03/2025	Agua Azul	9	7	10	6
09/03/2025	Agua Azul	10	6	10	11
16/03/2025	Agua Azul	9	13	10	11
23/03/2025	Agua Azul	7	5	8	12
06/04/2025	Agua Azul	8	6	8	8
13/04/2025	Agua Azul	8	8	11	11
20/04/2025	Agua Azul	0	0	0	0
27/04/2025	Agua Azul	8	11	14	10
04/05/2025	Agua Azul	0	0	0	0
11/05/2025	Agua Azul	7	8	8	8
18/05/2025	Agua Azul	7	7	9	13
25/05/2025	Agua Azul	8	7	5	5
01/06/2025	Agua Azul	0	0	0	0
08/06/2025	Agua Azul	0	0	0	0
15/06/2025	Agua Azul	8	8	6	6
22/06/2025	Agua Azul	8	8	11	9
29/06/2025	Agua Azul	9	7	13	10
06/07/2025	Agua Azul	0	0	0	0
13/07/2025	Agua Azul	4	6	8	10
20/07/2025	Agua Azul	8	10	10	8
10/08/2025	Agua Azul	11	10	11	10
17/08/2025	Agua Azul	7	10	7	10
24/08/2024	Agua Azul	7	8	8	12
03/08/2025	Agua Azul	8	8	7	8
24/08/2025	Agua Azul	7	8	8	12
31/08/2025	Agua Azul	0	0	0	0
07/09/2025	Agua Azul	8	10	8	10
14/09/2025	Agua Azul	8	11	7	11
21/09/2025	Agua Azul	9	4	12	9
28/09/2025	Agua Azul	0	0	0	0
05/10/2025	Agua Azul	0	0	0	0
12/10/2025	Agua Azul	13	9	11	14
19/10/2025	Agua Azul	10	11	8	8
19/10/2025	Agua Azul	10	11	10	7
26/10/2025	Agua Azul	08	10	6	7
09/11/2025	Agua Azul	13	8	11	9
16/11/2025	Agua Azul	14	12	3	4
23/11/2025	Agua Azul	11	8	7	11
02/11/2025	Agua Azul	0	0	0	0
30/11/2025	Agua Azul	12	6	7	8
21/12/2025	Agua Azul	9	8	10	3
28/12/2025	Agua Azul	9	8	9	2
28/12/2025	Agua Azul	9	10	10	2
21/12/2025	Agua Azul	9	8	10	3
14/12/2025	Agua Azul	9	6	2	5
11/01/2026	Agua Azul	9	5	8	7
04/01/2026	Agua Azul	5	6	5	5
25/01/2026	Agua Azul	9	9	6	8
18/01/2026	Agua Azul	10	4	10	8
08/02/2026	Agua Azul	8	5	7	9
15/02/2026	Agua Azul	10	10	9	9
29/03/2026	Agua Azul	8	7	14	7
15/03/2026	Agua Azul	10	10	12	8
08/03/2026	Agua Azul	7	7	9	11
01/03/2026	Agua Azul	6	7	5	7
22/02/2026	Agua Azul	8	9	10	8
05/04/2026	Agua Azul	26	17	6	5
12/04/2026	Agua Azul	7	4	6	7
12/04/2026	Agua Azul	7	4	6	7
10/05/2026	Agua Azul	6	6	2	6
03/05/2026	Agua Azul	14	11	8	9
19/04/2026	Agua Azul	14	11	9	10
14/06/2026	Agua Azul	11	9	8	7
24/05/2026	Agua Azul	8	11	8	7
17/05/2026	Agua Azul	8	7	7	8
07/06/2026	Agua Azul	0	0	0	0
21/06/2026	Agua Azul	9	7	10	8
28/06/2026	Agua Azul	11	8	11	6
05/07/2026	Agua Azul	0	0	0	0
12/07/2026	Agua Azul	7	5	6	11
31/05/2026	Agua Azul	0	0	0	0
19/07/2026	Agua Azul	9	4	7	7
26/07/2026	Agua Azul	12	9	9	8
02/08/2026	Agua Azul	0	0	0	0
09/08/2026	Agua Azul	10	4	9	7
16/08/2026	Agua Azul	8	10	8	9
23/08/2026	Agua Azul	10	9	12	12
30/08/2026	Agua Azul	8	10	12	12
20/09/2026	Agua Azul	9	8	9	9
06/09/2026	Agua Azul	8	4	6	7
13/09/2026	Agua Azul	10	8	5	11`;

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const { data: comuns, error: errComum } = await supabase
    .from('comum_congregacao')
    .select('id, nome')
    .ilike('nome', '%Água Azul%')
    .limit(1);

  if (errComum || !comuns || comuns.length === 0) {
    const { data: todas } = await supabase.from('comum_congregacao').select('id, nome');
    console.log('Comuns cadastradas:', todas);
    console.error('Comum Agua Azul nao encontrada no BD. Certifique-se de cadastra-la primeiro!');
    return;
  }

  const comumId = comuns[0].id;
  console.log('Comum ID:', comumId);

  const lines = rawData.trim().split('\n').slice(1);
  const rowsToInsert = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // As colunas: 0=Data, 1=Nome, 2=Mocas, 3=Mocos, 4=Meninas, 5=Meninos
    const cols = line.split('\t');
    const dataParts = cols[0].trim().split('/'); // DD/MM/YYYY
    if (dataParts.length === 3) {
      const dataIso = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`;
      const mocas = parseInt(cols[2], 10) || 0;
      const mocos = parseInt(cols[3], 10) || 0;
      const meninas = parseInt(cols[4], 10) || 0;
      const meninos = parseInt(cols[5], 10) || 0;
      const total = mocas + mocos + meninas + meninos;

      rowsToInsert.push({
        data: dataIso,
        comum_id: comumId,
        mocos: mocos,
        mocas: mocas,
        meninos: meninos,
        meninas: meninas,
      });
    }
  }

  console.log(`Inserindo ${rowsToInsert.length} recitativos...`);
  
  const chunked = [];
  const chunkSize = 100;
  for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
    chunked.push(rowsToInsert.slice(i, i + chunkSize));
  }

  for (const chunk of chunked) {
    const { error } = await supabase.from('recitativos').insert(chunk);
    if (error) {
      console.error('Erro inserindo chunk:', error.message);
    } else {
      console.log(`Inserido chunk de ${chunk.length} registros.`);
    }
  }
  
  console.log('Finalizado com sucesso!');
}

main().catch(console.error);
