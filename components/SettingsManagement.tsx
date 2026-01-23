import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Image as ImageIcon, Type, Settings, RefreshCw } from 'lucide-react';

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
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-orange-600 animate-spin-slow" />
            Configurações Gerais
          </h2>
          <p className="text-gray-500 text-sm">Personalize a identidade visual do sistema (Mascote, Logo, Nomes).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        
        {/* SEÇÃO DE TEXTOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Type size={20} className="text-blue-500"/>
                Textos do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do App / Marca</label>
                    <input 
                        type="text" 
                        value={formData.appName}
                        onChange={e => handleChange('appName', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700"
                        placeholder="Ex: TÔ FRITO!"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Exibido no topo e na tela de login.</p>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome da Turma / Escola</label>
                    <input 
                        type="text" 
                        value={formData.schoolClass}
                        onChange={e => handleChange('schoolClass', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700"
                        placeholder="Ex: 9ºB"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Exibido no rodapé e nos recibos.</p>
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
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 text-sm"
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
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 text-sm"
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
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 text-sm"
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
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </form>
    </div>
  );
};

export default SettingsManagement;
