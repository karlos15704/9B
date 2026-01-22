import React, { useState } from 'react';
import { Product } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Search, LayoutGrid, PackageOpen } from 'lucide-react';

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
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('');
    setImageUrl('');
    setDescription('');
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImageUrl(product.imageUrl);
    setDescription(product.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      id: editingProduct ? editingProduct.id : generateId(),
      name,
      price: parseFloat(price.replace(',', '.')),
      category,
      imageUrl: imageUrl || 'https://via.placeholder.com/150?text=Sem+Imagem',
      description,
      isAvailable: true
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
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutGrid className="text-orange-600" />
            Gestão de Cardápio
          </h2>
          <p className="text-gray-500 text-sm">Adicione, edite ou remova produtos do sistema.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg animate-cta-bounce active:animate-none"
        >
          <Plus size={20} />
          NOVO PRODUTO
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar produto por nome ou categoria..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col">
            <div className="relative h-48 bg-gray-50 p-4">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Erro+Imagem';
                }}
              />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEdit(product)}
                  className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    if(window.confirm(`Excluir ${product.name}?`)) onDeleteProduct(product.id);
                  }}
                  className="p-2 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white px-2 py-1 rounded backdrop-blur-sm">
                {product.category}
              </span>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{product.name}</h3>
              {product.description && <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>}
              
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-2xl font-black text-orange-600">{formatCurrency(product.price)}</span>
                <span className={`w-3 h-3 rounded-full ${product.isAvailable !== false ? 'bg-green-500' : 'bg-red-500'}`} title={product.isAvailable !== false ? 'Disponível' : 'Indisponível'}></span>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 opacity-60">
                <PackageOpen size={64} className="mb-4"/>
                <p className="text-xl font-bold">Nenhum produto encontrado</p>
            </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white sticky top-0 z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {editingProduct ? <Edit2 size={20}/> : <Plus size={20}/>}
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={resetForm} className="hover:bg-gray-700 p-1 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700"
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
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700"
                      placeholder="0.00"
                      required
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                    <input 
                      type="text"
                      list="categories"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700"
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

                 <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL da Imagem</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <ImageIcon className="absolute left-3 top-3 text-gray-400" size={18}/>
                            <input 
                            type="url" 
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            className="w-full pl-10 border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 text-sm"
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
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 text-sm resize-none h-20"
                      placeholder="Detalhes do produto..."
                    />
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-4"
              >
                <Save size={20} />
                SALVAR PRODUTO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;