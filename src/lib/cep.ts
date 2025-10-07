// Reusable CEP lookup util using ViaCEP
// Returns normalized { cep, address, city, state, country } or throws Error
export interface CepResult {
  cep: string; // digits only
  address: string;
  city: string;
  state: string;
  country: string;
}

export async function fetchCep(rawCep: string): Promise<CepResult> {
  const digits = (rawCep || '').replace(/\D+/g,'').slice(0,8);
  if (digits.length !== 8) throw new Error('CEP inválido');
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) throw new Error('Falha ao consultar CEP');
  const data = await res.json();
  if (data.erro) throw new Error('CEP não encontrado');
  return {
    cep: digits,
    address: (data.logradouro || '').trim(),
    city: data.localidade || '',
    state: data.uf || '',
    country: 'Brasil'
  };
}

export function maskCep(v: string) {
  const d = v.replace(/\D+/g,'').slice(0,8);
  if (d.length <=5) return d;
  return d.slice(0,5)+'-'+d.slice(5);
}
