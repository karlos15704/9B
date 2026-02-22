import React, { useState, useEffect } from 'react';
import { Product, ComboItem } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Search, LayoutGrid, PackageOpen, Ban, CheckCircle2, MousePointerClick, Barcode, Package, Layers } from 'lucide-react';

interface ProductManagementProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [pointsPrice, setPointsPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  // Novos campos para Estoque Inicial
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');

  // States para COMBO
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [selectedSubProduct, setSelectedSubProduct] = useState('');
  const [subProductQty, setSubProductQty] = useState(1);

  // Efeito para ativar disponibilidade automaticamente ao digitar estoque positivo (apenas se não for combo)
  useEffect(() => {
    if (!isCombo) {
        const val = parseInt(stock);
        if (!isNaN(val) && val > 0) {
            setIsAvailable(true);
        }
    }
  }, [stock, isCombo]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setPointsPrice('');
    setCategory('');
    setImageUrl('');
    setDescription('');
    setStock('');
    setBarcode('');
    setIsAvailable(true);
    setIsCombo(false);
    setComboItems([]);
    setSelectedSubProduct('');
    setSubProductQty(1);
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setPointsPrice(product.pointsPrice ? product.pointsPrice.toString() : '');
    setCategory(product.category);
    setImageUrl(product.imageUrl);
    setDescription(product.description || '');
    setStock(product.stock ? product.stock.toString() : '');
    setBarcode(product.barcode || '');
    setIsAvailable(product.isAvailable !== false);
    
    // Configura Combo
    const isProductCombo = !!(product.comboItems && product.comboItems.length > 0);
    setIsCombo(isProductCombo);
    setComboItems(product.comboItems || []);

    setIsModalOpen(true);
  };

  const handleAddSubProduct = () => {
    if (!selectedSubProduct || subProductQty < 1) return;
    
    // Verifica se já existe
    if (comboItems.find(i => i.productId === selectedSubProduct)) {
        alert("Este produto já está no combo. Remova-o para adicionar novamente se quiser mudar a quantidade.");
        return;
    }

    setComboItems([...comboItems, { productId: selectedSubProduct, quantity: subProductQty }]);
    setSelectedSubProduct('');
    setSubProductQty(1);
  };

  const handleRemoveSubProduct = (id: string) => {
    setComboItems(comboItems.filter(i => i.productId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converte estoque para número se houver entrada e NÃO for combo
    const stockValue = isCombo ? 0 : (stock ? parseInt(stock) : 0);
    const pointsValue = pointsPrice ? parseInt(pointsPrice) : undefined;

    const productData: Product = {
      id: editingProduct ? editingProduct.id : generateId(),
      name,
      price: parseFloat(price.replace(',', '.')),
      category,
      imageUrl: imageUrl || 'https://via.placeholder.com/150?text=Sem+Imagem',
      description,
      isAvailable: isAvailable,
      stock: stockValue,
      barcode: barcode,
      comboItems: isCombo ? comboItems : undefined, // Salva itens do combo
      pointsPrice: pointsValue
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    resetForm();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-100">
      {/* Header estilo CMS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <LayoutGrid className="text-blue-600" />
            EDITOR DE CARDÁPIO (CMS)
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o layout dos produtos. Adicione, edite ou clique no <strong>X</strong> para remover.
          </p>
        </div>
        
        {/* Busca */}
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
            type="text"
            placeholder="Filtrar itens..."
            className="w-full md:w-64 pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-bold text-gray-600 bg-gray-50 focus:bg-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Grid Visual (Builder Style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
        
        {/* CARD ADICIONAR (Visual Builder) */}
        <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 min-h-[250px] hover:border-blue-500 hover:bg-blue-50 transition-all group cursor-pointer bg-white"
        >
            <div className="bg-blue-100 p-5 rounded-full text-blue-600 group-hover:scale-110 transition-transform mb-4 shadow-sm group-hover:shadow-md">
                <Plus size={40} strokeWidth={3} />
            </div>
            <span className="font-black text-gray-400 group-hover:text-blue-600 text-sm uppercase tracking-wide">Adicionar Item</span>
            <span className="text-[10px] text-gray-400 mt-1">Clique para criar</span>
        </button>

        {/* LISTA DE PRODUTOS EXISTENTES */}
        {filteredProducts.map(product => {
            const isSoldOut = product.isAvailable === false;
            const isProductCombo = !!(product.comboItems && product.comboItems.length > 0);
            
            return (
              <div key={product.id} className={`bg-white rounded-xl shadow-sm border overflow-visible transition-all group flex flex-col relative hover:shadow-xl hover:-translate-y-1 hover:ring-2 hover:ring-blue-400 ${isSoldOut ? 'border-red-200 opacity-80' : 'border-gray-200'}`}>
                
                {/* BOTÃO X (REMOVER) - Estilo iOS Delete App */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm(`Tem certeza que deseja EXCLUIR "${product.name}" do sistema?`)) onDeleteProduct(product.id);
                    }}
                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg z-30 opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all hover:bg-red-700 hover:rotate-90 cursor-pointer"
                    title="Remover Item"
                >
                    <X size={20} strokeWidth={3} />
                </button>

                {/* BOTÃO EDITAR (Overlay) */}
                <div 
                    onClick={() => openEdit(product)}
                    className="cursor-pointer flex-1 flex flex-col relative"
                >
                    {/* Imagem Preview */}
                    <div className="relative h-32 w-full bg-white p-2 border-b border-gray-50">
                        <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className={`w-full h-full object-contain ${isSoldOut ? 'grayscale' : ''}`}
                            onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Erro'}
                        />
                        
                        {/* Overlay ao passar o mouse para indicar edição */}
                        <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors flex items-center justify-center">
                            <div className="bg-white/90 text-blue-800 px-3 py-1 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-sm flex items-center gap-1">
                                <Edit2 size={12}/> Editar
                            </div>
                        </div>

                        {/* Tag de Esgotado */}
                        {isSoldOut && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded transform -rotate-6 shadow-sm">ESGOTADO</span>
                            </div>
                        )}

                        {/* Tag de COMBO */}
                        {isProductCombo && (
                             <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                <Layers size={10} /> COMBO
                             </div>
                        )}
                        
                        {/* Categoria Tag */}
                        <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                            {product.category}
                        </span>

                         {/* Estoque Tag */}
                         {product.stock !== undefined && !isProductCombo && (
                            <span className={`absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${product.stock > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                QTD: {product.stock}
                            </span>
                         )}
                    </div>
                    
                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1 bg-white rounded-b-xl">
                        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</h3>
                        
                        <div className="mt-auto flex items-center justify-between pt-2">
                            <span className="text-lg font-black text-gray-800">{formatCurrency(product.price)}</span>
                            {isSoldOut ? (
                                <Ban size={16} className="text-red-400" />
                            ) : (
                                <CheckCircle2 size={16} className="text-green-500" />
                            )}
                        </div>
                    </div>
                </div>

              </div>
            );
        })}
      </div>

      {/* Modal de Edição/Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white sticky top-0 z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {editingProduct ? <Edit2 size={20}/> : <Plus size={20}/>}
                {editingProduct ? 'Editar Detalhes' : 'Criar Novo Item'}
              </h3>
              <button onClick={resetForm} className="hover:bg-gray-700 p-1 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* STATUS DO PRODUTO (TOGGLE) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 uppercase">Disponibilidade</span>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`relative inline-flex h-8 w-36 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-28' : 'translate-x-1'}`} />
                    <span className={`absolute text-[10px] font-black uppercase text-white w-full text-center ${isAvailable ? 'pr-8' : 'pl-8'}`}>
                        {isAvailable ? 'EM ESTOQUE' : 'ESGOTADO'}
                    </span>
                  </button>
              </div>

              {/* TIPO DE PRODUTO (Simples vs Combo) */}
              <div className="flex gap-2 mb-4">
                 <button 
                    type="button" 
                    onClick={() => setIsCombo(false)} 
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 ${!isCombo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                 >
                    <Package size={18} /> Produto Simples
                 </button>
                 <button 
                    type="button" 
                    onClick={() => { setIsCombo(true); setStock('0'); }} 
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 ${isCombo ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                 >
                    <Layers size={18} /> Combo / Kit
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                      placeholder="Ex: Combo X-Tudo"
                      required
                    />
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço (R$)</label>
                    <input 
                      type="number"
                      step="0.01" 
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                      placeholder="0.00"
                      required
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço em Pontos</label>
                    <input 
                      type="number"
                      value={pointsPrice}
                      onChange={e => setPointsPrice(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-purple-500 font-bold text-purple-700"
                      placeholder="Opcional"
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                    <input 
                      type="text"
                      list="categories"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                      placeholder="Ex: Bebidas"
                      required
                    />
                    <datalist id="categories">
                        <option value="Combos" />
                        <option value="Porções" />
                        <option value="Bebidas" />
                        <option value="Doces" />
                    </datalist>
                 </div>

                 {/* CAMPOS DE ESTOQUE - SÓ APARECEM SE NÃO FOR COMBO */}
                 {!isCombo && (
                    <>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Package size={12}/> Estoque Inicial</label>
                        <input 
                        type="number" 
                        value={stock}
                        onChange={e => setStock(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                        placeholder="Qtd"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Barcode size={12}/> Código Barras</label>
                        <input 
                        type="text" 
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-bold text-gray-700 font-mono"
                        placeholder="Opcional"
                        />
                    </div>
                    </>
                 )}

                 {/* CONFIGURAÇÃO DE COMBO */}
                 {isCombo && (
                    <div className="col-span-2 bg-purple-50 border-2 border-purple-100 rounded-xl p-4">
                        <h4 className="text-sm font-black text-purple-700 uppercase mb-2 flex items-center gap-2"><Layers size={16}/> Composição do Combo</h4>
                        <p className="text-xs text-purple-500 mb-3 leading-tight">Ao vender este combo, o estoque dos itens abaixo será descontado automaticamente.</p>
                        
                        <div className="flex gap-2 mb-3">
                            <select 
                                value={selectedSubProduct}
                                onChange={e => setSelectedSubProduct(e.target.value)}
                                className="flex-1 text-sm border border-purple-200 rounded-lg p-2 focus:outline-none"
                            >
                                <option value="">Selecione um produto...</option>
                                {products.filter(p => !p.comboItems || p.comboItems.length === 0).filter(p => p.id !== editingProduct?.id).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <input 
                                type="number" 
                                min="1" 
                                value={subProductQty}
                                onChange={e => setSubProductQty(parseInt(e.target.value))}
                                className="w-16 text-sm border border-purple-200 rounded-lg p-2 focus:outline-none text-center" 
                            />
                            <button 
                                type="button" 
                                onClick={handleAddSubProduct}
                                className="bg-purple-600 text-white p-2 rounded-lg font-bold"
                            >
                                <Plus size={18}/>
                            </button>
                        </div>

                        {/* LISTA DE ITENS DO COMBO */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {comboItems.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center italic py-2">Nenhum item adicionado ao combo.</p>
                            ) : (
                                comboItems.map((item, idx) => {
                                    const prod = products.find(p => p.id === item.productId);
                                    return (
                                        <div key={idx} className="bg-white p-2 rounded-lg border border-purple-100 flex justify-between items-center shadow-sm">
                                            <span className="text-xs font-bold text-gray-700">{item.quantity}x {prod?.name || 'Item Removido'}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveSubProduct(item.productId)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                 )}

                 <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Link da Imagem</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <ImageIcon className="absolute left-3 top-3 text-gray-400" size={18}/>
                            <input 
                            type="url" 
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            className="w-full pl-10 border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-sm"
                            placeholder="https://..."
                            />
                        </div>
                    </div>
                    {imageUrl && (
                        <div className="mt-2 h-32 w-full bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            <img src={imageUrl} alt="Preview" className="h-full object-contain" />
                        </div>
                    )}
                 </div>

                 <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição (Opcional)</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-sm resize-none h-20"
                      placeholder="Detalhes do produto..."
                    />
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-4"
              >
                <Save size={20} />
                SALVAR ALTERAÇÕES
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;