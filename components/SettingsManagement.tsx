import React, { useState } from 'react';
import { AppSettings, AppModules } from '../types';
import { Save, RefreshCw, Smartphone, Layout, Type, Palette, Monitor, ChefHat, LayoutGrid, PackageSearch, BarChart3, Users, Image as ImageIcon, CheckCircle2, Lock, Flame } from 'lucide-react';

interface SettingsManagementProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'branding' | 'content'>('structure');

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
    alert('🚀 SISTEMA ATUALIZADO GLOBALMENTE!\n\nTodos os dispositivos conectados receberam o novo layout.');
  };

  // --- COMPONENTE DE PREVIEW (SIMULADOR) ---
  const LivePreview = () => {
    const { primaryColor, appName, schoolClass, mascotUrl, schoolLogoUrl, modules, buttonSize } = formData;
    
    // Simulação de estilos dinâmicos
    const btnStyle = { 
        backgroundColor: primaryColor, 
        padding: buttonSize === 'small' ? '8px' : buttonSize === 'xl' ? '16px' : '12px',
        fontSize: buttonSize === 'small' ? '10px' : buttonSize === 'xl' ? '14px' : '12px'
    };

    return (
      <div className="bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl border-8 border-gray-800 h-[650px] w-[340px] relative overflow-hidden flex flex-col mx-auto transition-all duration-300">
        {/* Status Bar Fake */}
        <div className="h-6 w-full flex justify-between items-center px-4 mb-2">
            <span className="text-[10px] text-white font-medium">12:30</span>
            <div className="flex gap-1">
                <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
                <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
            </div>
        </div>

        {/* App Content Fake */}
        <div className="flex-1 bg-slate-50 rounded-2xl overflow-hidden flex flex-col relative">
            
            {/* Header */}
            <div className="bg-white p-3 shadow-sm border-b border-gray-100 flex items-center justify-center relative z-10">
                <div className="flex items-center gap-2">
                    <img src={mascotUrl} className="w-8 h-8 object-contain mix-blend-multiply" alt="" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}/>
                    <h1 className="font-black uppercase tracking-tighter text-lg" style={{ color: primaryColor }}>{appName}</h1>
                </div>
            </div>

            {/* Body (Product Grid Fake) */}
            <div className="flex-1 p-3 overflow-y-auto bg-slate-50">
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                            <div className="h-16 bg-gray-100 rounded mb-2"></div>
                            <div className="h-3 w-3/4 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botão Flutuante (Exemplo) */}
            <div className="absolute bottom-20 right-4">
                 <div className="text-white p-3 rounded-full shadow-lg" style={{ backgroundColor: primaryColor }}>
                    <LayoutGrid size={20} />
                 </div>
            </div>

            {/* Bottom Nav (Dinâmica baseada nos módulos) */}
            <div className="bg-white border-t border-gray-200 p-2 flex justify-around items-center">
                {modules.pos && (
                    <div className="flex flex-col items-center gap-1 opacity-100" style={{ color: primaryColor }}>
                        <LayoutGrid size={18} />
                        <span className="text-[8px] font-bold">Vendas</span>
                    </div>
                )}
                {modules.kitchen && (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                        <ChefHat size={18} />
                        <span className="text-[8px] font-bold">Cozinha</span>
                    </div>
                )}
                {modules.products && (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                        <PackageSearch size={18} />
                        <span className="text-[8px] font-bold">Cardápio</span>
                    </div>
                )}
                {modules.reports && (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                        <BarChart3 size={18} />
                        <span className="text-[8px] font-bold">Gestão</span>
                    </div>
                )}
            </div>
        </div>

        {/* Login Screen Preview Overlay (Small) */}
        <div className="absolute top-10 left-4 bg-white/90 p-2 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 w-24 transform rotate-6 pointer-events-none">
            <div className="flex flex-col items-center">
                <img src={schoolLogoUrl} className="w-6 h-6 mb-1" alt="" />
                <span className="text-[8px] font-bold bg-gray-900 text-white px-1 rounded">{schoolClass}</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      
      {/* --- ESQUERDA: EDITOR (CONTROLES) --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200 bg-white">
        
        {/* Header do Editor */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <Monitor className="text-blue-600" />
                    APP BUILDER
                </h2>
                <p className="text-xs text-gray-500">Edite e veja o resultado ao lado.</p>
            </div>
            <button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
                {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {isSaving ? 'ENVIANDO...' : 'PUBLICAR AGORA'}
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('structure')} 
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'structure' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
                <Layout size={16} /> Estrutura & Abas
            </button>
            <button 
                onClick={() => setActiveTab('branding')} 
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'branding' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
                <Palette size={16} /> Cores & Visual
            </button>
            <button 
                onClick={() => setActiveTab('content')} 
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'content' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
                <Type size={16} /> Textos & Imagens
            </button>
        </div>

        {/* Conteúdo dos Controles */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* 1. ESTRUTURA (TOGGLES) */}
            {activeTab === 'structure' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-2"><Lock size={16}/> Controle de Acesso</h3>
                        <p className="text-xs text-blue-600">Marque as caixas abaixo para ativar ou desativar telas no sistema inteiro.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'pos', icon: LayoutGrid, label: 'Caixa / Vendas', desc: 'Tela principal de lançamento.' },
                            { id: 'kitchen', icon: ChefHat, label: 'Cozinha (KDS)', desc: 'Tela de pedidos para preparo.' },
                            { id: 'products', icon: PackageSearch, label: 'Gestão de Produtos', desc: 'Adicionar/Editar itens.' },
                            { id: 'reports', icon: BarChart3, label: 'Relatórios & Gráficos', desc: 'Financeiro e fechamento.' },
                            { id: 'users', icon: Users, label: 'Gestão de Usuários', desc: 'Controle de equipe e senhas.' },
                            { id: 'customer', icon: Smartphone, label: 'Modo Autoatendimento', desc: 'App para o cliente pedir.' },
                        ].map(item => {
                            const isActive = formData.modules[item.id as keyof AppModules];
                            const Icon = item.icon;
                            return (
                                <div key={item.id} 
                                     onClick={() => toggleModule(item.id as keyof AppModules)}
                                     className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'bg-white border-blue-500 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{item.label}</h4>
                                            <p className="text-xs text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* 2. BRANDING (CORES & ESTILO) */}
            {activeTab === 'branding' && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                    <div>
                        <label className="text-sm font-bold text-gray-700 uppercase mb-3 block">Cor Principal do Tema</label>
                        <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <input 
                                type="color" 
                                value={formData.primaryColor}
                                onChange={e => handleChange('primaryColor', e.target.value)}
                                className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 bg-transparent"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Código Hex</p>
                                <input 
                                    type="text" 
                                    value={formData.primaryColor}
                                    onChange={e => handleChange('primaryColor', e.target.value)}
                                    className="w-full font-mono text-lg font-bold text-gray-800 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 uppercase mb-3 block">Tamanho dos Botões e Fontes</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['small', 'medium', 'large', 'xl'].map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => handleChange('buttonSize', size)}
                                    className={`py-4 rounded-xl border-2 font-bold text-sm capitalize transition-all
                                        ${formData.buttonSize === size 
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {size === 'xl' ? 'Extra Grande' : size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CONTEÚDO (TEXTOS E IMAGENS) */}
            {activeTab === 'content' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do App / Projeto</label>
                        <input 
                            type="text" 
                            value={formData.appName}
                            onChange={e => handleChange('appName', e.target.value)}
                            className="w-full text-xl font-black text-gray-800 border-b-2 border-gray-200 focus:border-orange-500 outline-none py-2"
                            placeholder="Ex: TÔ FRITO!"
                        />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subtítulo / Turma</label>
                        <input 
                            type="text" 
                            value={formData.schoolClass}
                            onChange={e => handleChange('schoolClass', e.target.value)}
                            className="w-full text-lg font-bold text-gray-600 border-b-2 border-gray-200 focus:border-orange-500 outline-none py-2"
                            placeholder="Ex: 9º Ano B"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h3 className="font-bold text-gray-800">Imagens do Sistema</h3>
                        
                        {[
                            { key: 'mascotUrl', label: 'Mascote Principal', desc: 'Login e Cabeçalho' },
                            { key: 'schoolLogoUrl', label: 'Logo da Escola', desc: 'Menus e Rodapés' },
                            { key: 'emptyCartImageUrl', label: 'Imagem Carrinho Vazio', desc: 'Sidebar quando sem itens' }
                        ].map(img => (
                            <div key={img.key} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-gray-200">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                                    <img src={formData[img.key as keyof AppSettings] as string} className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50'} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-700 block">{img.label}</label>
                                    <input 
                                        type="url" 
                                        value={formData[img.key as keyof AppSettings] as string}
                                        onChange={e => handleChange(img.key as keyof AppSettings, e.target.value)}
                                        className="w-full text-xs text-gray-500 border-b border-gray-200 focus:border-orange-500 outline-none py-1"
                                        placeholder="Cole a URL da imagem aqui..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>

      {/* --- DIREITA: PREVIEW (SIMULADOR) --- */}
      <div className="hidden md:flex w-[400px] lg:w-[500px] bg-gray-100 border-l border-gray-200 flex-col items-center justify-center relative p-8">
         <div className="absolute top-6 text-center w-full">
            <h3 className="font-black text-gray-400 text-sm tracking-widest uppercase mb-1">Preview em Tempo Real</h3>
            <p className="text-[10px] text-gray-400">Veja como fica antes de salvar</p>
         </div>
         
         <div className="transform scale-[0.85] lg:scale-100 transition-transform origin-center">
            <LivePreview />
         </div>

         <div className="absolute bottom-6 text-center w-full px-8">
            <p className="text-[10px] text-gray-400 leading-relaxed">
                As alterações mostradas aqui são apenas uma prévia. 
                Clique em <strong className="text-green-600">PUBLICAR AGORA</strong> para atualizar todos os celulares conectados.
            </p>
         </div>
      </div>

    </div>
  );
};

export default SettingsManagement;
