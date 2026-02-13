import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TestSupabase() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: result, error: err } = await supabase
        .from('events')  // ou outra tabela que você tenha
        .select('*');
      if (err) setError(err);
      else setData(result || []);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>Teste Supabase</h1>
      {error && <p>Erro: {error.message}</p>}
      <ul>
        {data.map((item) => (
          <li key={item.id}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}