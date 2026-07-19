import React, { useState } from 'react';
import { Settings, Save, Bell, Shield, Database, Mail, Palette, Globe, Key, Server } from 'lucide-react';
import { FauvesSwitch } from '@/components/v2/FauvesSwitch';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Fauves Platform',
    siteUrl: 'https://fauves.com.br',
    supportEmail: 'suporte@fauves.com.br',
    enableRegistrations: true,
    requireEmailVerification: true,
    enableNotifications: true,
    maintenanceMode: false,
    maxUploadSize: '10',
    sessionTimeout: '24',
    defaultLanguage: 'pt-BR',
    enableAnalytics: true,
    pixKey: '',
    stripeKey: ''
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Simulate save
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Configurações do Sistema</h1>
          <p className="text-slate-600 text-sm">Gerencie as configurações gerais da plataforma</p>
        </div>
        <button 
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-3 h-9 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
              <Save className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-emerald-900 font-medium text-sm">Configurações salvas com sucesso!</p>
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-teal-600" />
            <h3 className="text-base font-semibold text-slate-900">Configurações Gerais</h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Nome do Site</label>
              <input 
                type="text" 
                value={settings.siteName}
                onChange={e => handleChange('siteName', e.target.value)}
                className="w-full px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">URL do Site</label>
              <input 
                type="url" 
                value={settings.siteUrl}
                onChange={e => handleChange('siteUrl', e.target.value)}
                className="w-full px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Email de Suporte</label>
              <input 
                type="email" 
                value={settings.supportEmail}
                onChange={e => handleChange('supportEmail', e.target.value)}
                className="w-full px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Idioma Padrão</label>
              <select 
                value={settings.defaultLanguage}
                onChange={e => handleChange('defaultLanguage', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
              >
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* User Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Configurações de Usuários</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Permitir Novos Cadastros</div>
              <div className="text-sm text-slate-600">Usuários podem criar novas contas</div>
            </div>
            <FauvesSwitch checked={settings.enableRegistrations} onCheckedChange={(checked) => handleChange('enableRegistrations', checked)} label="Permitir novos cadastros" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Verificação de Email Obrigatória</div>
              <div className="text-sm text-slate-600">Novos usuários devem verificar o email</div>
            </div>
            <FauvesSwitch checked={settings.requireEmailVerification} onCheckedChange={(checked) => handleChange('requireEmailVerification', checked)} label="Verificação de email obrigatória" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Timeout de Sessão (horas)</label>
              <input 
                type="number" 
                value={settings.sessionTimeout}
                onChange={e => handleChange('sessionTimeout', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Configurações do Sistema</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Modo Manutenção</div>
              <div className="text-sm text-slate-600">Site ficará inacessível temporariamente</div>
            </div>
            <FauvesSwitch checked={settings.maintenanceMode} onCheckedChange={(checked) => handleChange('maintenanceMode', checked)} label="Modo manutenção" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Google Analytics</div>
              <div className="text-sm text-slate-600">Rastreamento de visitantes</div>
            </div>
            <FauvesSwitch checked={settings.enableAnalytics} onCheckedChange={(checked) => handleChange('enableAnalytics', checked)} label="Google Analytics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tamanho Máximo de Upload (MB)</label>
            <input 
              type="number" 
              value={settings.maxUploadSize}
              onChange={e => handleChange('maxUploadSize', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Configurações de Pagamento</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Moeda Padrão</label>
            <div aria-label="Moeda padrão fixa" className="flex h-[46px] w-full items-center rounded-xl border border-slate-300 bg-slate-50 px-4 font-medium text-slate-700">
              Real Brasileiro (BRL)
            </div>
            <p className="mt-1.5 text-xs text-slate-500">A Fauves utiliza exclusivamente o Real brasileiro neste momento.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Chave PIX</label>
            <input 
              type="text" 
              value={settings.pixKey}
              onChange={e => handleChange('pixKey', e.target.value)}
              placeholder="Digite sua chave PIX"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Stripe API Key</label>
            <input 
              type="password" 
              value={settings.stripeKey}
              onChange={e => handleChange('stripeKey', e.target.value)}
              placeholder="sk_live_..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Notificações</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Notificações Push</div>
              <div className="text-sm text-slate-600">Enviar notificações para usuários</div>
            </div>
            <FauvesSwitch checked={settings.enableNotifications} onCheckedChange={(checked) => handleChange('enableNotifications', checked)} label="Notificações push" />
          </div>
        </div>
      </div>
    </div>
  );
}
