import React, { useState } from 'react';
import { AppSettings, AppModules } from '../types';
import { Save, RefreshCw, Smartphone, Layout, Type, Palette, Monitor, ChefHat, LayoutGrid, PackageSearch, BarChart3, Users, Image as ImageIcon, CheckCircle2, Lock, Flame, Tv, MessageSquare, UserCircle2 } from 'lucide-react';

interface SettingsManagementProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'branding' | 'content'>('structure');
  
  // Novo estado para controlar qual tela está sendo simulada
  const [previewMode, setPreviewMode] = useState<'app' | 'customer' | 'display'>('app');

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

  // --- SIMULADOR MULTI-TELA ---
  const LivePreview = () => {
    const { primaryColor, appName, schoolClass, mascotUrl, schoolLogoUrl, modules, buttonSize, customerHeroUrl, marqueeText } = formData;
    
    // Preview: TELÃO (TV)
    if (previewMode === 'display') {
        return (
            <div className="bg-black rounded-xl border-8 border-gray-800 w-full aspect-video relative overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-b from-gray-900 to-black h-16 flex items-center justify-between px-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <img src={mascotUrl} className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}/>
                        <div>
                            <h1 className="text-white font-black uppercase text-sm">{appName}</h1>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{schoolClass}</span>
                        </div>
                    </div>
                    <div className="text-white font-mono font-bold text-lg">12:30</div>
                </div>
                {/* Body Split */}
                <div className="flex-1 flex">
                    <div className="w-1/2 bg-[#1a1a1a] border-r border-gray-800 p-4 flex flex-col items-center justify-center">
                        <h2 className="text-yellow-500 font-black uppercase text-xs mb-2 tracking-widest">Preparando</h2>
                        <div className="text-4xl font-black text-yellow-500/50">#001</div>
                    </div>
                    <div className="w-1/2 bg-black relative p-4 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-green-900/20"></div>
                        <h2 className="text-green-500 font-black uppercase text-xs mb-2 tracking-widest z-10">Pronto</h2>
                        <div className="text-4xl font-black text-white z-10">#005</div>
                    </div>
                </div>
                {/* Marquee Footer */}
                <div className="h-8 bg-orange-600 flex items-center overflow-hidden whitespace-nowrap">
                    <div className="text-white font-black text-xs uppercase tracking-widest px-4">
                        {marqueeText || "RETIRE SEU PEDIDO IMEDIATAMENTE • BOM APETITE!"}
                    </div>
                </div>
            </div>
        )
    }

    // Preview: AUTOATENDIMENTO (CLIENTE)
    if (previewMode === 'customer') {
        return (
            <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border-8 border-gray-800 h-[600px] w-[320px] relative overflow-hidden flex flex-col mx-auto bg-slate-50">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <img src={mascotUrl} className="w-6 h-6 object-contain" />
                            <h1 className="font-black text-gray-800 text-sm">{appName}</h1>
                        </div>
                    </div>
                </div>
                {/* Hero Image Area */}
                <div className="relative w-full h-32 bg-gray-200 overflow-hidden group">
                    <img 
                        src={customerHeroUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=60"} 
                        className="w-full h-full object-cover"
                        alt="Hero"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <h2 className="text-white font-black text-xl text-center px-4 leading-tight">
                            {formData.customerWelcomeTitle || "O que você quer comer?"}
                        </h2>
                    </div>
                </div>
                {/* Products Grid */}
                <div className="flex-1 p-3 overflow-hidden">
                    <div className="flex gap-2 mb-2">
                        <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold">Todos</div>
                        <div className="bg-white border border-gray-200 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold">Combos</div>
                    </div>
                    <div className="space-y-2">
                        {[1,2].map(i => (
                            <div key={i} className="bg-white p-2 rounded-xl border border-gray-100 flex gap-2">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                                <div className="flex-1">
                                    <div className="h-3 w-3/4 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-2 w-1/2 bg-gray-100 rounded mb-2"></div>
                                    <div className="h-4 w-10 bg-orange-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Floating Button */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-orange-600 text-white py-3 rounded-xl flex justify-between px-4 text-xs font-bold shadow-lg">
                        <span>1 Item</span>
                        <span>R$ 15,00</span>
                    </div>
                </div>
            </div>
        )
    }

    // Preview: APP FUNCIONÁRIO (Default)
    return (
      <div className="bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl border-8 border-gray-800 h-[600px] w-[320px] relative overflow-hidden flex flex-col mx-auto">
        <div className="h-5 w-full flex justify-center mb-1"><div className="w-20 h-4 bg-black rounded-b-xl"></div></div>
        <div className="flex-1 bg-slate-50 rounded-2xl overflow-hidden flex flex-col relative">
            <div className="bg-white p-3 shadow-sm border-b border-gray-100 flex items-center justify-center relative z-10">
                <div className="flex items-center gap-2">
                    <img src={mascotUrl} className="w-8 h-8 object-contain mix-blend-multiply" alt="" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}/>
                    <h1 className="font-black uppercase tracking-tighter text-lg" style={{ color: primaryColor }}>{appName}</h1>
                </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto bg-slate-50">
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                            <div className="h-16 bg-gray-100 rounded mb-2"></div>
                            <div className="h-2 w-full bg-gray-200 rounded mb-1"></div>
                            <div className="h-2 w-1/2 bg-gray-300 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Bottom Nav Mockup */}
            <div className="bg-white border-t border-gray-200 p-2 flex justify-around items-center">
                {modules.pos && <div className="text-[var(--primary-color)]"><LayoutGrid size={16} /></div>}
                {modules.kitchen && <div className="text-gray-300"><ChefHat size={16} /></div>}
                {modules.products && <div className="text-gray-300"><PackageSearch size={16} /></div>}
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
                    CENTRO DE COMANDO
                </h2>
                <p className="text-xs text-gray-500">Configure telas, mensagens e acessos.</p>
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
                <Layout size={16} /> Módulos e Acesso
            </button>
            <button 
                onClick={() => setActiveTab('branding')} 
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'branding' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
                <Palette size={16} /> Cores e Estilo
            </button>
            <button 
                onClick={() => setActiveTab('content')} 
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'content' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
                <Type size={16} /> Textos e Imagens
            </button>
        </div>

        {/* Conteúdo dos Controles */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* 1. ESTRUTURA (TOGGLES) */}
            {activeTab === 'structure' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-2"><Lock size={16}/> Controle de Módulos (Global)</h3>
                        <p className="text-xs text-blue-600">
                            Ligue ou desligue telas para <strong>todos os funcionários</strong>. 
                            Use a aba "Equipe" no menu principal para gerenciar cargos individuais.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'pos', icon: LayoutGrid, label: 'Terminal de Vendas', desc: 'Tela principal do Caixa.' },
                            { id: 'kitchen', icon: ChefHat, label: 'Monitor da Cozinha', desc: 'Tela de preparação de pedidos.' },
                            { id: 'customer', icon: Smartphone, label: 'App do Cliente', desc: 'Autoatendimento via QR Code.' },
                            { id: 'products', icon: PackageSearch, label: 'Editor de Cardápio', desc: 'Permitir edição de produtos.' },
                            { id: 'reports', icon: BarChart3, label: 'Acesso a Relatórios', desc: 'Financeiro e fechamento.' },
                            { id: 'users', icon: Users, label: 'Gestão de Usuários', desc: 'Criar/Editar funcionários.' },
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
                        <label className="text-sm font-bold text-gray-700 uppercase mb-3 block">Cor da Identidade Visual</label>
                        <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <input 
                                type="color" 
                                value={formData.primaryColor}
                                onChange={e => handleChange('primaryColor', e.target.value)}
                                className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 bg-transparent"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Cor Primária (Hex)</p>
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
                        <label className="text-sm font-bold text-gray-700 uppercase mb-3 block">Ergonomia e Tamanho</label>
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
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                    
                    {/* BÁSICOS */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Type size={18}/> Informações Básicas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nome do App</label>
                                <input 
                                    type="text" 
                                    value={formData.appName}
                                    onChange={e => handleChange('appName', e.target.value)}
                                    className="w-full border-b-2 border-gray-200 focus:border-orange-500 outline-none py-1 font-bold text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Subtítulo / Turma</label>
                                <input 
                                    type="text" 
                                    value={formData.schoolClass}
                                    onChange={e => handleChange('schoolClass', e.target.value)}
                                    className="w-full border-b-2 border-gray-200 focus:border-orange-500 outline-none py-1 font-bold text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* IMAGENS GERAIS */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider ml-1">Imagens do Sistema</h3>
                        {[
                            { key: 'mascotUrl', label: 'Mascote Principal', desc: 'Login e Cabeçalho' },
                            { key: 'schoolLogoUrl', label: 'Logo da Escola', desc: 'Menus e Rodapés' },
                            { key: 'emptyCartImageUrl', label: 'Imagem Carrinho Vazio', desc: 'Barra lateral' }
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
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PERSONALIZAÇÃO ESPECÍFICA (Autoatendimento & Telão) */}
                    <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 space-y-6">
                        <h3 className="font-bold text-orange-800 flex items-center gap-2"><Smartphone size={18}/> Personalização Avançada</h3>
                        
                        {/* Autoatendimento */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-orange-700 uppercase block">Imagem Banner (Autoatendimento)</label>
                            <input 
                                type="url" 
                                value={formData.customerHeroUrl || ''}
                                onChange={e => handleChange('customerHeroUrl', e.target.value)}
                                className="w-full bg-white border border-orange-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                                placeholder="https://exemplo.com/banner-promocional.jpg"
                            />
                            
                            <label className="text-xs font-bold text-orange-700 uppercase block mt-3">Mensagem de Boas-vindas (Cliente)</label>
                            <input 
                                type="text" 
                                value={formData.customerWelcomeTitle || ''}
                                onChange={e => handleChange('customerWelcomeTitle', e.target.value)}
                                className="w-full bg-white border border-orange-200 rounded-lg p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200"
                                placeholder="O que você quer comer hoje?"
                            />
                        </div>

                        <div className="h-px bg-orange-200 w-full"></div>

                        {/* Telão */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-orange-700 uppercase block flex items-center gap-2"><Tv size={14}/> Mensagem Rodapé do Telão</label>
                            <textarea 
                                value={formData.marqueeText || ''}
                                onChange={e => handleChange('marqueeText', e.target.value)}
                                className="w-full bg-white border border-orange-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 h-20 resize-none"
                                placeholder="Ex: RETIRE SEU PEDIDO IMEDIATAMENTE • BOM APETITE!"
                            />
                        </div>
                    </div>

                </div>
            )}

        </div>
      </div>

      {/* --- DIREITA: PREVIEW (SIMULADOR) --- */}
      <div className="hidden md:flex w-[400px] lg:w-[500px] bg-gray-100 border-l border-gray-200 flex-col items-center justify-center relative p-8">
         <div className="absolute top-4 text-center w-full z-10">
            <h3 className="font-black text-gray-400 text-xs tracking-widest uppercase mb-2">Selecione o Dispositivo</h3>
            <div className="flex justify-center gap-2 bg-white p-1 rounded-full shadow-sm border border-gray-200 w-fit mx-auto">
                <button onClick={() => setPreviewMode('app')} className={`p-2 rounded-full transition-all ${previewMode === 'app' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-100'}`} title="App Funcionário"><Smartphone size={16}/></button>
                <button onClick={() => setPreviewMode('customer')} className={`p-2 rounded-full transition-all ${previewMode === 'customer' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`} title="Autoatendimento"><UserCircle2 size={16}/></button>
                <button onClick={() => setPreviewMode('display')} className={`p-2 rounded-full transition-all ${previewMode === 'display' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`} title="Telão / TV"><Tv size={16}/></button>
            </div>
         </div>
         
         <div className={`transition-transform origin-center duration-500 flex items-center justify-center
            ${previewMode === 'display' ? 'w-full scale-90' : 'scale-[0.85] lg:scale-100'}
         `}>
            <LivePreview />
         </div>

         <div className="absolute bottom-6 text-center w-full px-8">
            <p className="text-[10px] text-gray-400 leading-relaxed">
                Você está vendo o modo: <strong className="uppercase text-gray-600">{previewMode === 'app' ? 'Funcionário' : previewMode === 'customer' ? 'Cliente' : 'Telão'}</strong>.
                <br/>Clique em <strong className="text-green-600">PUBLICAR AGORA</strong> para aplicar.
            </p>
         </div>
      </div>

    </div>
  );
};

export default SettingsManagement;