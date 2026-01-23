import React, { useState } from 'react';
import { AppSettings, AppModules } from '../types';
import { Save, Image as ImageIcon, Type, Settings, RefreshCw, Palette, Layout, MousePointerClick, LayoutGrid, ChefHat, PackageSearch, BarChart3, Users, Smartphone, Eye, EyeOff } from 'lucide-react';

interface SettingsManagementProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleModule = (moduleKey: keyof AppModules) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: !prev.modules[moduleKey]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    alert('✅ ESTRUTURA ATUALIZADA!\n\nAs alterações foram enviadas para todos os dispositivos conectados em tempo real.');
  };

  // Configuração visual dos módulos para o editor
  const modulesConfig = [
    { key: 'pos', label: 'Terminal de Vendas (Caixa)', icon: LayoutGrid, desc: 'Tela principal para lançar pedidos.' },
    { key: 'kitchen', label: 'Display da Cozinha', icon: ChefHat, desc: 'Tela para ver e dar baixa em pedidos.' },
    { key: 'products', label: 'Gestão de Cardápio', icon: PackageSearch, desc: 'Adicionar/Editar produtos.' },
    { key: 'reports', label: 'Relatórios Financeiros', icon: BarChart3, desc: 'Gráficos e fechamento de caixa.' },
    { key: 'users', label: 'Gestão de Equipe', icon: Users, desc: 'Cadastrar usuários e senhas.' },
    { key: 'customer', label: 'Modo Autoatendimento', icon: Smartphone, desc: 'Tela para o cliente pedir sozinho.' },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-[var(--primary-color)] animate-spin-slow" />
            Editor Global do Sistema
          </h2>
          <p className="text-gray-500 text-sm">Controle total sobre a aparência e as funcionalidades ativas do site.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-24">
        
        {/* --- EDITOR DE ESTRUTURA (MÓDULOS) --- */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-[var(--primary-color)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[var(--primary-color)]"></div>
            <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <Layout size={28} className="text-[var(--primary-color)]"/>
                ESTRUTURA DO APP (Ligar/Desligar Abas)
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
                Selecione quais telas estarão disponíveis no sistema. O que você desativar aqui, sumirá instantaneamente para todos os funcionários.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modulesConfig.map((mod) => {
                    const isActive = formData.modules?.[mod.key as keyof AppModules] ?? true;
                    const Icon = mod.icon;

                    return (
                        <div 
                            key={mod.key}
                            onClick={() => toggleModule(mod.key as keyof AppModules)}
                            className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-white border-[var(--primary-color)] shadow-md transform hover:-translate-y-1' 
                                    : 'bg-gray-50 border-gray-200 opacity-60 grayscale hover:opacity-80'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-3 rounded-xl ${isActive ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                            
                            <h4 className={`font-bold text-lg mb-1 ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{mod.label}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{mod.desc}</p>

                            <div className={`absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {isActive ? <><Eye size={12}/> Ativo</> : <><EyeOff size={12}/> Oculto</>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* --- APARÊNCIA E TEMA --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Palette size={20} className="text-purple-500"/>
                Aparência e Cores
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COR DO TEMA */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        Cor Principal
                    </label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={formData.primaryColor || '#ea580c'}
                            onChange={e => handleChange('primaryColor', e.target.value)}
                            className="w-14 h-14 rounded-2xl cursor-pointer border-4 border-gray-100 shadow-sm"
                        />
                        <div className="flex-1">
                            <input 
                                type="text" 
                                value={formData.primaryColor || '#ea580c'}
                                onChange={e => handleChange('primaryColor', e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] font-mono text-sm uppercase font-bold text-gray-600"
                            />
                        </div>
                    </div>
                </div>

                {/* TAMANHO DOS BOTÕES */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        <MousePointerClick size={16}/> Tamanho dos Elementos
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {['small', 'medium', 'large', 'xl'].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => handleChange('buttonSize', size)}
                                className={`py-3 rounded-xl border-2 font-bold text-xs transition-all capitalize
                                    ${formData.buttonSize === size 
                                        ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md' 
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {size === 'xl' ? 'Gigante' : size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- IDENTIDADE VISUAL (IMAGENS E TEXTOS) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <ImageIcon size={20} className="text-blue-500"/>
                Identidade Visual (Imagens e Textos)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do App</label>
                    <input 
                        type="text" 
                        value={formData.appName}
                        onChange={e => handleChange('appName', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] font-bold text-gray-700"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome da Turma</label>
                    <input 
                        type="text" 
                        value={formData.schoolClass}
                        onChange={e => handleChange('schoolClass', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] font-bold text-gray-700"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {[
                    { label: 'Mascote Principal', key: 'mascotUrl', desc: 'Aparece no login e topo.' },
                    { label: 'Logo da Escola', key: 'schoolLogoUrl', desc: 'Aparece no rodapé e menu.' },
                    { label: 'Imagem Carrinho Vazio', key: 'emptyCartImageUrl', desc: 'Aparece na barra lateral.' }
                ].map((item) => (
                    <div key={item.key} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center p-1 flex-shrink-0">
                            <img 
                                src={formData[item.key as keyof AppSettings] as string} 
                                className="w-full h-full object-contain" 
                                onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Erro'}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-600 uppercase block">{item.label}</label>
                            <input 
                                type="url" 
                                value={formData[item.key as keyof AppSettings] as string}
                                onChange={e => handleChange(item.key as keyof AppSettings, e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 focus:border-[var(--primary-color)] outline-none text-sm py-1 text-gray-600"
                                placeholder="https://..."
                            />
                            <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <button 
            type="submit"
            disabled={isSaving}
            className="fixed bottom-6 right-6 md:relative md:bottom-auto md:right-auto w-auto md:w-full bg-[var(--primary-color)] text-white font-black py-4 px-8 rounded-full md:rounded-xl shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 z-50"
        >
            {isSaving ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} />}
            {isSaving ? 'SINCRONIZANDO...' : 'SALVAR ESTRUTURA E CONFIGURAÇÕES'}
        </button>
      </form>
    </div>
  );
};

export default SettingsManagement;
