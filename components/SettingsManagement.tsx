import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, LayoutBlock, BlockType } from '../types';
import { generateId } from '../utils';
import { 
  Save, RefreshCw, Smartphone, Layout, Type, Palette, Monitor, 
  ChefHat, LayoutGrid, PackageSearch, BarChart3, Users, 
  Image as ImageIcon, CheckCircle2, Lock, Flame, Tv, 
  Move, Trash2, Plus, GripVertical, AlignLeft, AlignCenter, AlignRight,
  Maximize, Minimize, Type as TypeIcon, ArrowDown, ArrowUp, Edit2
} from 'lucide-react';

interface SettingsManagementProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

// Default Layout se não existir
const DEFAULT_LAYOUT: LayoutBlock[] = [
  { id: 'hero-1', type: 'hero', title: 'O que você quer comer?', imageUrl: 'https://i.ibb.co/xt5zh5bR/logoo-Edited.png', style: { height: 'medium', alignment: 'center' } },
  { id: 'products-1', type: 'products', title: 'Cardápio Completo' },
];

const SettingsManagement: React.FC<SettingsManagementProps> = ({ settings, onSave }) => {
  // Inicializa o layout com o salvo ou o padrão
  const [layout, setLayout] = useState<LayoutBlock[]>(settings.customerLayout || DEFAULT_LAYOUT);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'global'>('editor');
  
  // Drag & Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Sync formData with layout changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, customerLayout: layout }));
  }, [layout]);

  const handleGlobalChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    alert('✨ LAYOUT PUBLICADO COM SUCESSO!');
  };

  // --- BLOCK MANAGEMENT ---

  const addBlock = (type: BlockType) => {
    const newBlock: LayoutBlock = {
      id: generateId(),
      type,
      title: type === 'hero' ? 'Novo Destaque' : type === 'text' ? 'Título da Seção' : type === 'marquee' ? 'Aviso Importante' : undefined,
      content: type === 'text' ? 'Seu texto aqui...' : type === 'marquee' ? 'Texto correndo...' : undefined,
      imageUrl: type === 'image' || type === 'hero' ? 'https://via.placeholder.com/400x200' : undefined,
      style: { alignment: 'center', height: 'medium', backgroundColor: '#ffffff', textColor: '#000000' }
    };
    setLayout([...layout, newBlock]);
    setSelectedBlockId(newBlock.id); // Auto-select new block
  };

  const updateBlock = (id: string, updates: Partial<LayoutBlock>) => {
    setLayout(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const updateBlockStyle = (id: string, styleUpdates: any) => {
    setLayout(prev => prev.map(b => b.id === id ? { ...b, style: { ...b.style, ...styleUpdates } } : b));
  };

  const deleteBlock = (id: string) => {
    if (window.confirm('Remover este bloco?')) {
      setLayout(prev => prev.filter(b => b.id !== id));
      setSelectedBlockId(null);
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= layout.length) return;
    const newLayout = [...layout];
    const [movedItem] = newLayout.splice(fromIndex, 1);
    newLayout.splice(toIndex, 0, movedItem);
    setLayout(newLayout);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Visual feedback logic could go here
  };
  const handleDrop = (index: number) => {
    if (draggedItemIndex === null) return;
    moveBlock(draggedItemIndex, index);
    setDraggedItemIndex(null);
  };

  // --- RENDERERS ---

  const renderBlockPreview = (block: LayoutBlock) => {
    const isSelected = selectedBlockId === block.id;
    
    // Base Styles
    const baseClass = `relative group cursor-pointer border-2 transition-all duration-200 overflow-hidden ${isSelected ? 'border-blue-500 ring-4 ring-blue-500/20 z-10' : 'border-transparent hover:border-gray-300'}`;
    
    let content = null;

    switch (block.type) {
      case 'hero':
        content = (
          <div className={`relative w-full overflow-hidden ${block.style?.height === 'small' ? 'h-24' : block.style?.height === 'large' ? 'h-64' : 'h-40'}`}>
            <img src={block.imageUrl} className="w-full h-full object-cover" alt="Hero" />
            <div className={`absolute inset-0 bg-black/40 flex items-center p-4 ${block.style?.alignment === 'center' ? 'justify-center text-center' : block.style?.alignment === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}>
              <h2 className="text-white font-black text-xl leading-tight drop-shadow-md">{block.title}</h2>
            </div>
          </div>
        );
        break;
      case 'text':
        content = (
          <div className="p-4" style={{ backgroundColor: block.style?.backgroundColor || 'transparent', textAlign: block.style?.alignment }}>
            {block.title && <h3 className="font-bold text-gray-800 mb-1" style={{ color: block.style?.textColor }}>{block.title}</h3>}
            <p className="text-sm text-gray-600" style={{ color: block.style?.textColor }}>{block.content}</p>
          </div>
        );
        break;
      case 'marquee':
        content = (
          <div className="bg-orange-600 py-2 overflow-hidden whitespace-nowrap text-white font-bold text-xs uppercase tracking-widest" style={{ backgroundColor: block.style?.backgroundColor }}>
            {block.content || 'Texto correndo...'}
          </div>
        );
        break;
      case 'products':
        content = (
          <div className="p-2 bg-gray-50 border-y border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase text-center mb-2">{block.title || 'Lista de Produtos'}</p>
            <div className="grid grid-cols-2 gap-2 opacity-50 pointer-events-none">
               {[1,2].map(i => (
                 <div key={i} className="bg-white p-2 rounded-lg border h-20"></div>
               ))}
            </div>
          </div>
        );
        break;
      case 'image':
        content = (
            <img src={block.imageUrl} className="w-full h-auto object-cover" alt="Img" />
        );
        break;
      case 'spacer':
        content = <div style={{ height: block.style?.height === 'large' ? '60px' : '20px' }} className="w-full bg-transparent flex items-center justify-center"><span className="text-[10px] text-gray-300 uppercase">Espaço</span></div>;
        break;
    }

    return (
      <div 
        key={block.id}
        onClick={() => setSelectedBlockId(block.id)}
        draggable
        onDragStart={() => handleDragStart(layout.indexOf(block))}
        onDragOver={(e) => handleDragOver(e, layout.indexOf(block))}
        onDrop={() => handleDrop(layout.indexOf(block))}
        className={baseClass}
      >
        {/* Drag Handle (Visible on Hover/Select) */}
        <div className={`absolute left-0 top-0 bottom-0 w-6 bg-gray-100/80 hover:bg-blue-100 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing z-20 transition-opacity`}>
            <GripVertical size={14} className="text-gray-400" />
        </div>
        
        {content}

        {/* Quick Actions */}
        {isSelected && (
            <div className="absolute top-2 right-2 flex gap-1 z-30">
                <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="bg-red-600 text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-transform"><Trash2 size={12}/></button>
            </div>
        )}
      </div>
    );
  };

  // --- RENDER PROPERTY PANEL ---
  const renderPropertyPanel = () => {
    if (!selectedBlockId) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <Move size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Selecione um bloco na tela ao lado para editar.</p>
        </div>
    );

    const block = layout.find(b => b.id === selectedBlockId);
    if (!block) return null;

    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-black text-gray-800 uppercase flex items-center gap-2">
                    <Edit2 size={16} className="text-blue-600"/> Editando {block.type}
                </h3>
                <button onClick={() => deleteBlock(block.id)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"><Trash2 size={12}/> Remover</button>
            </div>

            {/* Common Fields */}
            {(block.type === 'hero' || block.type === 'text' || block.type === 'products') && (
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título / Texto Principal</label>
                    <input 
                        type="text" 
                        value={block.title || ''} 
                        onChange={e => updateBlock(block.id, { title: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg p-2 font-bold text-sm focus:border-blue-500 outline-none"
                    />
                </div>
            )}

            {(block.type === 'text' || block.type === 'marquee') && (
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Conteúdo / Descrição</label>
                    <textarea 
                        value={block.content || ''} 
                        onChange={e => updateBlock(block.id, { content: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none h-20 resize-none"
                    />
                </div>
            )}

            {(block.type === 'hero' || block.type === 'image') && (
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL da Imagem</label>
                    <input 
                        type="url" 
                        value={block.imageUrl || ''} 
                        onChange={e => updateBlock(block.id, { imageUrl: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none"
                    />
                    {block.imageUrl && <img src={block.imageUrl} className="mt-2 h-20 w-full object-cover rounded-md border border-gray-200" />}
                </div>
            )}

            {/* Styling Controls */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ESTILO & APARÊNCIA</p>
                
                {/* Alignment */}
                {(block.type === 'hero' || block.type === 'text') && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">Alinhamento</label>
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            {['left', 'center', 'right'].map((align) => (
                                <button 
                                    key={align}
                                    onClick={() => updateBlockStyle(block.id, { alignment: align })}
                                    className={`flex-1 py-1 rounded-md flex justify-center ${block.style?.alignment === align ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                                >
                                    {align === 'left' ? <AlignLeft size={16}/> : align === 'center' ? <AlignCenter size={16}/> : <AlignRight size={16}/>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size/Height */}
                {(block.type === 'hero' || block.type === 'spacer') && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">Altura</label>
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            {['small', 'medium', 'large'].map((h) => (
                                <button 
                                    key={h}
                                    onClick={() => updateBlockStyle(block.id, { height: h })}
                                    className={`flex-1 py-1 rounded-md flex justify-center ${block.style?.height === h ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                                >
                                    {h === 'small' ? <Minimize size={16}/> : h === 'large' ? <Maximize size={16}/> : <span className="text-xs font-bold">M</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Colors */}
                {(block.type === 'text' || block.type === 'marquee') && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Fundo</label>
                            <input type="color" className="w-full h-8 rounded cursor-pointer" value={block.style?.backgroundColor || '#ffffff'} onChange={e => updateBlockStyle(block.id, { backgroundColor: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Texto</label>
                            <input type="color" className="w-full h-8 rounded cursor-pointer" value={block.style?.textColor || '#000000'} onChange={e => updateBlockStyle(block.id, { textColor: e.target.value })} />
                        </div>
                    </div>
                )}
            </div>

            {/* Position */}
            <div className="flex gap-2">
                <button onClick={() => { const idx = layout.indexOf(block); moveBlock(idx, idx - 1); }} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-bold text-xs flex justify-center gap-1"><ArrowUp size={14}/> Subir</button>
                <button onClick={() => { const idx = layout.indexOf(block); moveBlock(idx, idx + 1); }} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-bold text-xs flex justify-center gap-1"><ArrowDown size={14}/> Descer</button>
            </div>
        </div>
    );
  };

  return (
    <div className="h-full flex bg-slate-100 overflow-hidden">
        
        {/* --- LEFT SIDEBAR: TOOLBOX & GLOBAL --- */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-xl">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <Monitor className="text-blue-600" />
                    APP BUILDER
                </h2>
                <p className="text-xs text-gray-500 mt-1">Construtor Visual de Layout</p>
            </div>

            <div className="flex p-2 gap-1 bg-gray-50 border-b">
                <button onClick={() => setActiveTab('editor')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'editor' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}><Layout size={14}/> Blocos</button>
                <button onClick={() => setActiveTab('global')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'global' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:bg-gray-200'}`}><Palette size={14}/> Cores</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'editor' ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Adicionar Blocos</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => addBlock('hero')} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <ImageIcon className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Banner</span>
                                </button>
                                <button onClick={() => addBlock('text')} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <TypeIcon className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Texto</span>
                                </button>
                                <button onClick={() => addBlock('products')} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <LayoutGrid className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Produtos</span>
                                </button>
                                <button onClick={() => addBlock('marquee')} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <Tv className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Letreiro</span>
                                </button>
                                <button onClick={() => addBlock('image')} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <ImageIcon className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Imagem</span>
                                </button>
                                <button onClick={() => addBlock('spacer')} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <ArrowDown className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Espaço</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Cor Principal do App</label>
                             <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <input type="color" value={formData.primaryColor} onChange={e => handleGlobalChange('primaryColor', e.target.value)} className="h-10 w-10 rounded cursor-pointer border-none bg-transparent"/>
                                <span className="font-mono text-xs font-bold">{formData.primaryColor}</span>
                             </div>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nome da Aplicação</label>
                             <input type="text" value={formData.appName} onChange={e => handleGlobalChange('appName', e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 font-bold text-sm"/>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
                 <button 
                    onClick={handleSave} 
                    className="w-full bg-green-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                    PUBLICAR TUDO
                 </button>
            </div>
        </div>

        {/* --- CENTER: CANVAS (PHONE SIMULATOR) --- */}
        <div className="flex-1 flex items-center justify-center bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 pattern-grid opacity-5 pointer-events-none"></div>
            
            {/* Phone Frame */}
            <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-800 h-[700px] w-[380px] relative overflow-hidden flex flex-col mx-auto ring-8 ring-gray-900/50">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-xl z-50"></div>
                
                {/* Screen */}
                <div className="flex-1 bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative h-full">
                    
                    {/* App Header (Static) */}
                    <div className="bg-white p-4 pt-8 shadow-sm z-40 border-b border-gray-100 flex justify-between items-center pointer-events-none select-none">
                         <div className="flex items-center gap-2">
                             <img src={formData.mascotUrl} className="w-6 h-6 object-contain" />
                             <h1 className="font-black text-gray-800 text-sm tracking-tight">{formData.appName}</h1>
                         </div>
                    </div>

                    {/* DYNAMIC CANVAS AREA */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 relative bg-white">
                        {layout.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300 p-8 text-center border-4 border-dashed border-gray-200 m-4 rounded-2xl">
                                <Plus size={48} className="mb-2"/>
                                <p className="font-bold text-sm">Arraste ou adicione blocos aqui.</p>
                            </div>
                        ) : (
                            layout.map(block => renderBlockPreview(block))
                        )}
                        {/* Drop Zone at bottom (optional visual aid) */}
                        <div className="h-20 flex items-center justify-center text-xs text-gray-300 font-bold uppercase tracking-widest border-t border-dashed border-gray-200 mt-4">
                            Rodapé do App
                        </div>
                    </div>

                    {/* Floating Cart (Static Mockup) */}
                    <div className="absolute bottom-4 left-4 right-4 z-40 pointer-events-none opacity-50">
                         <div className="bg-orange-600 text-white py-3 rounded-xl flex justify-between px-4 text-xs font-bold shadow-lg">
                            <span>Ver Carrinho</span>
                            <span>R$ 0,00</span>
                         </div>
                    </div>

                </div>
            </div>
        </div>

        {/* --- RIGHT SIDEBAR: PROPERTIES --- */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl">
             {renderPropertyPanel()}
        </div>

    </div>
  );
};

export default SettingsManagement;