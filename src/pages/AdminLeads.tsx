import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';
import { 
  Users, 
  Mail, 
  Phone, 
  Trash2, 
  Download, 
  Search,
  Calendar,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  id: string;
  contact: string;
  source: string;
  createdAt: string;
}

const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/event-lead');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      const res = await fetchApi(`/api/event-lead/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Lead excluído');
        setLeads(leads.filter(l => l.id !== id));
      }
    } catch (error) {
      toast.error('Erro ao excluir lead');
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Contato', 'Fonte', 'Data'];
    const rows = leads.map(l => [
      l.id,
      l.contact,
      l.source,
      new Date(l.createdAt).toLocaleString('pt-BR')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fauves_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => 
    l.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isEmail = (contact: string) => contact.includes('@');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Gerenciamento de Leads
          </h1>
          <p className="text-slate-500">
            Contatos capturados na homepage e newsletter.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
        >
          <Download size={20} />
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{leads.length}</div>
            <div className="text-sm text-slate-500 font-medium">Total de Leads</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{leads.filter(l => isEmail(l.contact)).length}</div>
            <div className="text-sm text-slate-500 font-medium">Contatos por E-mail</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <Phone size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{leads.filter(l => !isEmail(l.contact)).length}</div>
            <div className="text-sm text-slate-500 font-medium">Contatos WhatsApp</div>
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por contato ou fonte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Fonte</th>
                <th className="px-6 py-4">Data de Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEmail(lead.contact) ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {isEmail(lead.contact) ? <Mail size={14} /> : <Phone size={14} />}
                        </div>
                        <span className="font-bold text-slate-800">{lead.contact}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                         <Layers size={14} />
                         <span className="capitalize">{lead.source}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} />
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeads;
