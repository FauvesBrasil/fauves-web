export interface CnpjResult {
  companyName: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
}

export async function fetchCnpj(rawCnpj: string): Promise<CnpjResult> {
  const cnpj = String(rawCnpj || '').replace(/\D/g, '').slice(0, 14);
  if (cnpj.length !== 14) throw new Error('CNPJ inválido');

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new Error(data?.message || 'CNPJ não encontrado');
  }

  return {
    companyName: String(data.razao_social || '').trim(),
    zipCode: String(data.cep || '').replace(/\D/g, '').slice(0, 8),
    state: String(data.uf || '').trim(),
    city: String(data.municipio || '').trim(),
    neighborhood: String(data.bairro || '').trim(),
    street: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ').trim(),
    number: String(data.numero || '').trim(),
    complement: String(data.complemento || '').trim(),
  };
}
