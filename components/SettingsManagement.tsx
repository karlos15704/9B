import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Image as ImageIcon, Type, Settings, RefreshCw, Palette, Layout, MousePointerClick } from 'lucide-react';

interface SettingsManagementProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof AppSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    alert('Configurações globais atualizadas! Todos os dispositivos receberão as mudanças.');
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-[var(--primary-color)] animate-spin-slow" />
            Configurações & Estrutura
          </h2>
          <p className="text-gray-500 text-sm">Personalize a identidade visual e a estrutura do sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* SEÇÃO DE ESTRUTURA VISUAL (NOVO) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-2 ring-[var(--primary-color)] ring-opacity-20">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Layout size={20} className="text-[var(--primary-color)]"/>
                Estrutura e Tema do Site
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COR DO TEMA */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        <Palette size={16}/> Cor Principal do Sistema
                    </label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={formData.primaryColor || '#ea580c'}
                            onChange={e => handleChange('primaryColor', e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 p-1"
                        />
                        <div className="flex-1">
                            <input 
                                type="text" 
                                value={formData.primaryColor || '#ea580c'}
                                onChange={e => handleChange('primaryColor', e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] font-mono text-sm uppercase"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Afeta botões, bordas, ícones e destaques de todo o site.</p>
                        </div>
                    </div>
                </div>

                {/* TAMANHO DOS BOTÕES */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        <MousePointerClick size={16}/> Tamanho dos Botões e Controles
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {['small', 'medium', 'large', 'xl'].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => handleChange('buttonSize', size)}
                                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all capitalize
                                    ${formData.buttonSize === size 
                                        ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md' 
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : size === 'large' ? 'Grande' : 'Extra Grande'}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Ajuste para facilitar o toque em telas menores ou maiores.</p>
                </div>
            </div>
        </div>

        {/* SEÇÃO DE TEXTOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Type size={20} className="text-blue-500"/>
                Identidade Textual
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do App / Marca</label>
                    <input 
                        type="text" 
                        value={formData.appName}
                        onChange={e => handleChange('appName', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] font-bold text-gray-700"
                        placeholder="Ex: TÔ FRITO!"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome da Turma / Escola</label>
                    <input 
                        type="text" 
                        value={formData.schoolClass}
                        onChange={e => handleChange('schoolClass', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] font-bold text-gray-700"
                        placeholder="Ex: 9ºB"
                    />
                </div>
            </div>
        </div>

        {/* SEÇÃO DE IMAGENS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <ImageIcon size={20} className="text-purple-500"/>
                Imagens e Ícones
            </h3>
            
            <div className="space-y-6">
                {/* Mascote Principal */}
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-gray-50 rounded-xl border flex items-center justify-center p-2 flex-shrink-0">
                        <img src={formData.mascotUrl} alt="Mascote" className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Erro'} />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL do Mascote Principal</label>
                        <input 
                            type="url" 
                            value={formData.mascotUrl}
                            onChange={e => handleChange('mascotUrl', e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] text-sm"
                            placeholder="https://..."
                        />
                         <p className="text-[10px] text-gray-400 mt-1">Aparece no Login, Topo do Caixa e Telão.</p>
                    </div>
                </div>

                {/* Logo da Escola */}
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-gray-50 rounded-xl border flex items-center justify-center p-2 flex-shrink-0">
                        <img src={formData.schoolLogoUrl} alt="Logo Escola" className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Erro'} />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL do Logo da Escola/Projeto</label>
                        <input 
                            type="url" 
                            value={formData.schoolLogoUrl}
                            onChange={e => handleChange('schoolLogoUrl', e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] text-sm"
                            placeholder="https://..."
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Aparece no menu lateral e tela de login.</p>
                    </div>
                </div>

                {/* Carrinho Vazio */}
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-gray-50 rounded-xl border flex items-center justify-center p-2 flex-shrink-0">
                        <img src={formData.emptyCartImageUrl} alt="Carrinho Vazio" className="w-full h-full object-contain mix-blend-multiply" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Erro'} />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL da Imagem de Carrinho Vazio</label>
                        <input 
                            type="url" 
                            value={formData.emptyCartImageUrl}
                            onChange={e => handleChange('emptyCartImageUrl', e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[var(--primary-color)] text-sm"
                            placeholder="https://..."
                        />
                         <p className="text-[10px] text-gray-400 mt-1">Aparece na barra lateral quando não há itens.</p>
                    </div>
                </div>
            </div>
        </div>

        <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-[var(--primary-color)] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'SINCRONIZANDO...' : 'SALVAR ALTERAÇÕES GLOBAIS'}
        </button>
      </form>
    </div>
  );
};

export default SettingsManagement;
