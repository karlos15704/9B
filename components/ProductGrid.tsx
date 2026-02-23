import React, { useState, useMemo } from 'react';
import { Product, CartItem, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { Plus, X, Search, UtensilsCrossed, Ban, RefreshCw, Layers, Heart, CheckCircle2 } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (productId: string) => void;
  settings?: AppSettings;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, cart, onAddToCart, onRemoveFromCart, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [customDonation, setCustomDonation] = useState('');

  const primaryColor = settings?.primaryColor || '#ea580c';

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordenação Alfabética A-Z
  }, [products, searchTerm, selectedCategory]);

  // Função para calcular estoque real (Considerando ingredientes do combo)
  const getProductStockStatus = (product: Product) => {
    // Se for desativado manualmente, retorna 0 (Esgotado)
    if (product.isAvailable === false) return 0;

    // Se for um combo, calcula baseado nos ingredientes
    if (product.comboItems && product.comboItems.length > 0) {
        let minCombos = 999999;
        let hasIngredients = false;
        
        for (const comboItem of product.comboItems) {
            const ingredient = products.find(p => p.id === comboItem.productId);
            
            // SE O INGREDIENTE NÃO EXISTE MAIS (FOI EXCLUÍDO), O COMBO ESTÁ ESGOTADO
            if (!ingredient) {
                return 0;
            }
            
            // SE O INGREDIENTE ESTÁ INDISPONÍVEL
            if (ingredient.isAvailable === false) {
                return 0;
            }

            hasIngredients = true;

            // Se o ingrediente tem estoque controlado (numérico)
            if (ingredient.stock !== undefined && ingredient.stock !== null) {
                const stockVal = typeof ingredient.stock === 'string' ? parseInt(ingredient.stock) : ingredient.stock;
                // Prevenção contra NaN
                const safeStock = isNaN(stockVal) ? 0 : stockVal;
                
                const possible = Math.floor(safeStock / comboItem.quantity);
                if (possible < minCombos) minCombos = possible;
            }
        }
        
        // Se minCombos não foi alterado (nenhum ingrediente com estoque limitado), retorna -1
        return minCombos === 999999 ? -1 : minCombos;
    }

    // Se for produto simples com controle de estoque
    if (product.stock !== undefined && product.stock !== null) {
        const stockVal = typeof product.stock === 'string' ? parseInt(product.stock) : product.stock;
        return isNaN(stockVal) ? 0 : stockVal;
    }

    // Sem controle de estoque e disponível
    return -1;
  };

  const handleAddDonation = (amount: number) => {
      const donationProduct: Product = {
          id: `donation-${Date.now()}`,
          name: 'Doação Formatura 2026',
          price: amount,
          category: 'Doação',
          description: 'Contribuição para a formatura',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/2904/2904973.png', // Icone de coração ou similar
          isAvailable: true
      };
      onAddToCart(donationProduct);
      setShowDonationModal(false);
      setCustomDonation('');
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50/50">
      
      {/* MODAL DE DOAÇÃO */}
      {showDonationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 relative">
                  <button onClick={() => setShowDonationModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                          <Heart size={32} fill="currentColor" />
                      </div>
                      <h3 className="text-xl font-black text-gray-800">Apoie a Formatura 2026!</h3>
                      <p className="text-gray-500 text-sm mt-1">Sua contribuição ajuda a realizar nosso sonho.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                      {[2, 5, 10].map(val => (
                          <button 
                              key={val}
                              onClick={() => handleAddDonation(val)}
                              className="py-3 rounded-xl border-2 border-pink-100 bg-pink-50 text-pink-600 font-black hover:bg-pink-100 hover:border-pink-300 transition-all active:scale-95"
                          >
                              {formatCurrency(val)}
                          </button>
                      ))}
                  </div>

                  <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                      <input 
                          type="number" 
                          placeholder="Outro valor" 
                          value={customDonation}
                          onChange={e => setCustomDonation(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:outline-none font-bold text-gray-800"
                      />
                  </div>

                  <button 
                      onClick={() => {
                          const val = parseFloat(customDonation);
                          if (val > 0) handleAddDonation(val);
                      }}
                      disabled={!customDonation || parseFloat(customDonation) <= 0}
                      className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
                  >
                      <CheckCircle2 size={20} /> CONFIRMAR DOAÇÃO
                  </button>
              </div>
          </div>
      )}

      {/* BARRA DE FERRAMENTAS FIXA NO TOPO DO GRID */}
      <div className="flex-none p-4 space-y-3 bg-white border-b border-gray-200 shadow-sm z-10 sticky top-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar produto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium text-gray-700 placeholder-gray-400"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties} 
          />
          {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
                <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all border shadow-sm
                  ${isSelected 
                    ? 'text-white shadow-md transform scale-105' 
                    : 'bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* GRID DE PRODUTOS */}
      <div 
        className="flex-1 p-4 pb-24 md:pb-6 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 mt-10">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <UtensilsCrossed size={40} className="opacity-50" />
            </div>
            <p className="font-bold text-gray-500">Nenhum produto encontrado.</p>
            {(searchTerm || selectedCategory !== 'Todos') && (
                <button 
                    onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                    className="mt-4 text-orange-600 font-bold flex items-center gap-2 hover:underline bg-white px-4 py-2 rounded-lg border border-orange-100 shadow-sm"
                >
                    <RefreshCw size={16}/> Limpar Filtros
                </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 content-start">
            
            {/* CARD DE DOAÇÃO */}
            {(!searchTerm || searchTerm.toLowerCase().includes('doa') || searchTerm.toLowerCase().includes('formatura')) && (
                <div 
                  onClick={() => setShowDonationModal(true)}
                  className="bg-gradient-to-br from-pink-50 to-white rounded-2xl shadow-sm border border-pink-200 transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 active:scale-95"
                >
                  <div className="relative h-32 md:h-40 w-full bg-pink-50 p-2 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-pink-500 shadow-md group-hover:scale-110 transition-transform">
                        <Heart size={32} fill="currentColor" />
                    </div>
                    <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">
                        2026
                    </div>
                  </div>
                  <div className="p-3 border-t border-pink-100 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-gray-800 text-xs md:text-sm leading-tight">
                      Doação Formatura
                    </h3>
                    <div className="mt-2">
                        <p className="text-[10px] text-gray-500 leading-tight mb-1">Ajude nossa turma!</p>
                        <p className="font-black text-sm md:text-base text-pink-600">
                            Contribua ❤️
                        </p>
                    </div>
                  </div>
                </div>
            )}

            {filteredProducts.map((product) => {
              const cartItem = cart.find(item => item.id === product.id);
              const quantity = cartItem ? cartItem.quantity : 0;
              
              const currentStock = getProductStockStatus(product);
              // É esgotado se stock for explicitamente 0
              const isSoldOut = currentStock === 0;
              const isCombo = !!(product.comboItems && product.comboItems.length > 0);

              const borderStyle = quantity > 0 ? { borderColor: primaryColor } : {};

              return (
                <div 
                  key={product.id} 
                  className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col h-full
                    ${isSoldOut ? 'border-red-200 bg-red-50/10' : quantity > 0 ? 'ring-2 ring-orange-100' : 'border-gray-200 hover:border-gray-300'}
                    ${!isSoldOut && 'active:scale-95 md:hover:shadow-lg md:hover:-translate-y-1'}
                  `}
                  style={borderStyle}
                  onClick={() => {
                      if (!isSoldOut) onAddToCart(product);
                  }}
                >
                  {/* Imagem */}
                  <div className="relative h-32 md:h-40 w-full bg-white p-2">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className={`w-full h-full object-contain transition-transform duration-500 ${isSoldOut ? 'grayscale opacity-50' : 'group-hover:scale-105'} drop-shadow-sm`}
                      loading="lazy"
                    />
                    
                    {isCombo && (
                        <div className="absolute top-2 left-2 z-20 bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 border border-purple-200">
                            <Layers size={10} /> Combo
                        </div>
                    )}

                    {isSoldOut && (
                        <div className="absolute inset-0 flex items-center justify-center z-30">
                            <div className="bg-red-600 text-white font-black uppercase text-[10px] md:text-xs px-3 py-1 transform -rotate-12 border-2 border-white shadow-lg">
                                ESGOTADO
                            </div>
                        </div>
                    )}

                    {!isSoldOut && (
                        <div className="hidden md:flex absolute inset-0 bg-black/5 transition-opacity opacity-0 group-hover:opacity-100 items-center justify-center">
                            <div className="text-white rounded-full p-3 shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300" style={{ backgroundColor: primaryColor }}>
                                <Plus size={24} />
                            </div>
                        </div>
                    )}

                    {quantity > 0 && !isSoldOut && (
                      <>
                        <div className="absolute top-2 right-2 text-white font-black text-xs md:text-sm w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-200 border-2 border-white z-20" style={{ backgroundColor: primaryColor }}>
                          {quantity}
                        </div>
                        
                        <button 
                          className="absolute top-2 left-2 z-30 bg-white text-red-500 rounded-full p-1.5 shadow-md border border-red-100 hover:bg-red-50 hover:scale-110 transition-all animate-in zoom-in duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRemoveFromCart) onRemoveFromCart(product.id);
                          }}
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 bg-white border-t border-gray-50 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight min-h-[2.5em]">
                      {product.name}
                    </h3>
                    <div className="flex flex-col justify-between mt-2 gap-1">
                      {isSoldOut ? (
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded border border-red-100 w-full text-center">
                            Sem Estoque
                          </span>
                      ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-[60px]">
                                {product.category}
                            </span>
                            <p className="font-black text-sm md:text-base" style={{ color: primaryColor }}>
                                {formatCurrency(product.price)}
                            </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;