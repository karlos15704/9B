import React, { useState } from 'react';
import { AppSettings, AppModules, RoulettePrize } from '../types';
import { Save, RefreshCw, Smartphone, Monitor, Palette, Image as ImageIcon, LayoutGrid, ChefHat, PackageSearch, BarChart3, Users, Wallet, Type, UploadCloud, Dices, Plus, Trash2 } from 'lucide-react';
import { uploadGalleryImage } from '../services/supabase';

interface SettingsManagementProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleModuleToggle = (moduleKey: keyof AppModules) => {
      setFormData(prev => ({
          ...prev,
          modules: {
              ...prev.modules,
              [moduleKey]: !prev.modules[moduleKey]
          }
      }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    
    const url = await uploadGalleryImage(file);
    
    if (url) {
        const newImg = { id: Date.now().toString(), url, timestamp: Date.now() };
        setFormData(prev => ({ ...prev, galleryImages: [newImg, ...(prev.galleryImages || [])] }));
    } else {
        alert("Erro ao fazer upload da imagem. Verifique se o bucket 'gallery' existe.");
    }
    
    setIsUploading(false);
    e.target.value = ''; // Reset input
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Ao salvar no modo simples, removemos o layout personalizado (customerLayout) 
    // para que o sistema use as configurações simples (título, imagem, etc).
    const settingsToSave = {
        ...formData,
        customerLayout: undefined // Reseta o layout visual para usar o padrão configurável
    };
    await onSave(settingsToSave);
    setIsSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  return (
      <div className="p-6 h-full overflow-y-auto bg-slate-100">
          <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                          <Monitor className="text-blue-600" />
                          CONFIGURAÇÕES DO SISTEMA
                      </h2>
                      <p className="text-gray-500 text-sm">Personalize a aparência e funcionalidades do app.</p>
                  </div>
                  <button 
                    onClick={handleSave} 
                    className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                 >
                    {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                    SALVAR ALTERAÇÕES
                 </button>
              </div>

              {/* APARÊNCIA GERAL */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <Palette className="text-orange-500"/> Identidade Visual
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome da Aplicação</label>
                          <input type="text" value={formData.appName} onChange={e => handleChange('appName', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 font-bold text-sm" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Turma / Identificação</label>
                          <input type="text" value={formData.schoolClass} onChange={e => handleChange('schoolClass', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 font-bold text-sm" />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Cor Principal</label>
                           <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <input type="color" value={formData.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} className="h-10 w-10 rounded cursor-pointer border-none bg-transparent"/>
                              <span className="font-mono text-xs font-bold">{formData.primaryColor}</span>
                           </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tamanho dos Botões</label>
                          <select value={formData.buttonSize} onChange={e => handleChange('buttonSize', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 font-bold text-sm">
                              <option value="small">Pequeno</option>
                              <option value="medium">Médio (Padrão)</option>
                              <option value="large">Grande</option>
                              <option value="xl">Extra Grande</option>
                          </select>
                      </div>
                  </div>
              </div>

              {/* CONFIGURAÇÃO DA ROLETA */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <Dices className="text-purple-600"/> Configuração da Roleta
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase mb-2 px-2">
                          <div className="col-span-3">Nome do Prêmio</div>
                          <div className="col-span-2">Tipo</div>
                          <div className="col-span-2">Valor/Pontos</div>
                          <div className="col-span-2">Peso (%)</div>
                          <div className="col-span-2">Cor</div>
                          <div className="col-span-1"></div>
                      </div>

                      {(formData.roulettePrizes || []).map((prize, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <div className="col-span-3">
                                  <input 
                                      type="text" 
                                      value={prize.label} 
                                      onChange={e => {
                                          const newPrizes = [...(formData.roulettePrizes || [])];
                                          newPrizes[index].label = e.target.value;
                                          setFormData(prev => ({ ...prev, roulettePrizes: newPrizes }));
                                      }}
                                      className="w-full text-sm font-bold bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                                      placeholder="Ex: 50 Pontos"
                                  />
                              </div>
                              <div className="col-span-2">
                                  <select 
                                      value={prize.type}
                                      onChange={e => {
                                          const newPrizes = [...(formData.roulettePrizes || [])];
                                          newPrizes[index].type = e.target.value as any;
                                          setFormData(prev => ({ ...prev, roulettePrizes: newPrizes }));
                                      }}
                                      className="w-full text-xs bg-white border border-gray-200 rounded p-1"
                                  >
                                      <option value="points">Pontos</option>
                                      <option value="item">Item</option>
                                      <option value="none">Nada</option>
                                  </select>
                              </div>
                              <div className="col-span-2">
                                  <input 
                                      type="number" 
                                      value={prize.value} 
                                      onChange={e => {
                                          const newPrizes = [...(formData.roulettePrizes || [])];
                                          newPrizes[index].value = parseInt(e.target.value) || 0;
                                          setFormData(prev => ({ ...prev, roulettePrizes: newPrizes }));
                                      }}
                                      className="w-full text-sm bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                                  />
                              </div>
                              <div className="col-span-2">
                                  <input 
                                      type="number" 
                                      value={prize.weight} 
                                      onChange={e => {
                                          const newPrizes = [...(formData.roulettePrizes || [])];
                                          newPrizes[index].weight = parseInt(e.target.value) || 0;
                                          setFormData(prev => ({ ...prev, roulettePrizes: newPrizes }));
                                      }}
                                      className="w-full text-sm bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                                  />
                              </div>
                              <div className="col-span-2 flex items-center gap-2">
                                  <input 
                                      type="color" 
                                      value={prize.color} 
                                      onChange={e => {
                                          const newPrizes = [...(formData.roulettePrizes || [])];
                                          newPrizes[index].color = e.target.value;
                                          setFormData(prev => ({ ...prev, roulettePrizes: newPrizes }));
                                      }}
                                      className="h-6 w-6 rounded cursor-pointer border-none bg-transparent"
                                  />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                  <button 
                                      onClick={() => {
                                          const newPrizes = (formData.roulettePrizes || []).filter((_, i) => i !== index);
                                          setFormData(prev => ({ ...prev, roulettePrizes: newPrizes }));
                                      }}
                                      className="text-red-400 hover:text-red-600"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                      ))}

                      <button 
                          onClick={() => {
                              const newPrize: RoulettePrize = { label: 'Novo Prêmio', value: 0, type: 'points', color: '#cccccc', weight: 10 };
                              setFormData(prev => ({ ...prev, roulettePrizes: [...(prev.roulettePrizes || []), newPrize] }));
                          }}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-purple-400 hover:text-purple-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                          <Plus size={16} /> ADICIONAR PRÊMIO
                      </button>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <ImageIcon className="text-blue-500"/> Imagens e Logos
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL do Mascote (Logo Principal)</label>
                          <input type="url" value={formData.mascotUrl} onChange={e => handleChange('mascotUrl', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 text-xs" />
                          {formData.mascotUrl && <img src={formData.mascotUrl} className="h-12 w-12 object-contain mt-2 border rounded bg-gray-50" />}
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL Logo da Escola (Pequeno)</label>
                          <input type="url" value={formData.schoolLogoUrl} onChange={e => handleChange('schoolLogoUrl', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 text-xs" />
                          {formData.schoolLogoUrl && <img src={formData.schoolLogoUrl} className="h-8 w-8 object-contain mt-2 border rounded bg-gray-50" />}
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL Imagem Carrinho Vazio</label>
                          <input type="url" value={formData.emptyCartImageUrl} onChange={e => handleChange('emptyCartImageUrl', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                  </div>
              </div>
              
              {/* CONFIGURAÇÃO DO MODO CLIENTE (SIMPLIFICADO) */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <Smartphone className="text-purple-500"/> Autoatendimento (Modo Cliente)
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título de Boas-vindas</label>
                          <div className="flex items-center gap-2">
                              <Type size={18} className="text-gray-400"/>
                              <input type="text" value={formData.customerWelcomeTitle || ''} onChange={e => handleChange('customerWelcomeTitle', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 font-bold text-sm" placeholder="Ex: O que você quer comer?" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Imagem de Capa (Banner)</label>
                          <div className="flex items-center gap-2">
                             <ImageIcon size={18} className="text-gray-400"/>
                             <input type="url" value={formData.customerHeroUrl || ''} onChange={e => handleChange('customerHeroUrl', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 text-xs" placeholder="URL da imagem..." />
                          </div>
                          {formData.customerHeroUrl ? (
                              <img src={formData.customerHeroUrl} className="h-32 w-full object-contain mt-2 border rounded-xl bg-gray-900" />
                          ) : (
                              <img src="https://i.ibb.co/xt5zh5bR/logoo-Edited.png" className="h-32 w-full object-contain mt-2 border rounded-xl bg-gray-900 opacity-50" title="Imagem Padrão" />
                          )}
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Texto do Letreiro (Rodapé)</label>
                          <input type="text" value={formData.marqueeText || ''} onChange={e => handleChange('marqueeText', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm" placeholder="Avisos no rodapé..." />
                      </div>
                  </div>
              </div>


              {/* GALERIA DA TURMA (NOVO) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <ImageIcon className="text-pink-500"/> Galeria da Turma (9ºB)
                  </h3>
                  <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex-1 w-full">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Nova Foto</label>
                              <div className="flex gap-2">
                                  <label className={`flex-1 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-pink-500 hover:text-pink-500 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                      <UploadCloud size={20} />
                                      <span className="text-sm font-bold">{isUploading ? 'Enviando...' : 'Escolher Arquivo'}</span>
                                      <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={isUploading} />
                                  </label>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 font-bold">Formatos: JPG, PNG, WEBP</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {formData.galleryImages?.map(img => (
                              <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  <img src={img.url} className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => setFormData(prev => ({ ...prev, galleryImages: prev.galleryImages?.filter(i => i.id !== img.id) }))}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  >
                                      <Users size={14} />
                                  </button>
                              </div>
                          ))}
                          {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                              <div className="col-span-full text-center py-8 text-gray-400 text-sm italic">
                                  Nenhuma foto na galeria. Faça upload acima.
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* MÓDULOS */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <LayoutGrid className="text-green-500"/> Módulos Ativos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                          { key: 'pos', label: 'Frente de Caixa', icon: LayoutGrid },
                          { key: 'kitchen', label: 'Cozinha (KDS)', icon: ChefHat },
                          { key: 'products', label: 'Gestão de Produtos', icon: PackageSearch },
                          { key: 'financial', label: 'Financeiro & Estoque', icon: Wallet },
                          { key: 'reports', label: 'Relatórios', icon: BarChart3 },
                          { key: 'users', label: 'Gestão de Equipe', icon: Users },
                          { key: 'customer', label: 'Autoatendimento', icon: Smartphone },
                      ].map((mod) => (
                          <div key={mod.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                                  <mod.icon size={18}/> {mod.label}
                              </div>
                              <button 
                                  onClick={() => handleModuleToggle(mod.key as keyof AppModules)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.modules[mod.key as keyof AppModules] ? 'bg-green-500' : 'bg-gray-300'}`}
                              >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.modules[mod.key as keyof AppModules] ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );
};

export default SettingsManagement;