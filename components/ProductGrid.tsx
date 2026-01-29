import React, { useState, useMemo } from 'react';
import { Product, CartItem, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { Plus, X, Search, UtensilsCrossed, Ban } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (productId: string) => void;
  settings?: AppSettings; // Configurações visuais opcionais
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, cart, onAddToCart, onRemoveFromCart, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Cores dinâmicas (Fallback se settings for undefined)
  const primaryColor = settings?.primaryColor || '#ea580c';

  // Extrair categorias
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-orange-50/50">
      
      {/* --- BARRA DE FERRAMENTAS --- */}
      <div className="p-4 space-y-3 bg-white border-b border-orange-100 shadow-sm sticky top-0 z-40">
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar produto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-200 bg-orange-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium text-gray-700 placeholder-orange-300"
            style={{ focusRingColor: primaryColor }} // Note: inline styles for focus rings are tricky, relying on tailwind defaults or css variables injected in App.tsx
          />
        </div>

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all border
                  ${isSelected 
                    ? 'text-white shadow-md transform scale-105' 
                    : 'bg-white text-gray-500 border-gray-200 hover:text-gray-800'
                  }`}
                style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* --- GRID DE PRODUTOS --- */}
      <div className="flex-1 overflow-y-auto p-3 md:pb-3">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 opacity-60">
            <UtensilsCrossed size={48} className="mb-2" />
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
              {filteredProducts.map((product) => {
                const cartItem = cart.find(item => item.id === product.id);
                const quantity = cartItem ? cartItem.quantity : 0;
                const isSoldOut = product.isAvailable === false;

                // Borda dinâmica se selecionado
                const borderStyle = quantity > 0 ? { borderColor: primaryColor } : {};

                return (
                  <div 
                    key={product.id} 
                    className={`bg-white rounded-xl shadow-sm border transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col
                      ${isSoldOut ? 'border-red-200 opacity-90' : quantity > 0 ? 'ring-2 ring-orange-100' : 'border-orange-100 hover:border-gray-300'}
                      ${!isSoldOut && 'active:scale-95 md:hover:scale-105 md:hover:shadow-xl'}
                    `}
                    style={borderStyle}
                    onClick={() => {
                        if (!isSoldOut) onAddToCart(product);
                    }}
                  >
                    {/* Imagem */}
                    <div className="relative h-28 md:h-40 w-full bg-white p-2">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className={`w-full h-full object-contain transition-transform duration-500 ${isSoldOut ? 'grayscale' : 'group-hover:scale-110'} drop-shadow-sm`}
                        loading="lazy"
                      />
                      
                      {isSoldOut && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-30">
                              <div className="bg-red-600 text-white font-black uppercase text-sm px-6 py-1 transform -rotate-12 border-2 border-white shadow-xl">
                                  ESGOTADO
                              </div>
                          </div>
                      )}

                      {!isSoldOut && (
                          <div className="hidden md:flex absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                              <div className="text-white rounded-full p-2 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300" style={{ backgroundColor: primaryColor }}>
                                  <Plus size={24} />
                              </div>
                          </div>
                      )}

                      {quantity > 0 && !isSoldOut && (
                        <>
                          <div className="absolute top-2 right-2 text-white font-black text-sm w-7 h-7 flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-200 border-2 border-white z-20" style={{ backgroundColor: primaryColor }}>
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
                      <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight min-h-[2.5em] group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-1">
                        {isSoldOut ? (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded border border-red-100 w-full text-center">
                              INDISPONÍVEL
                            </span>
                        ) : (
                          <>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 w-fit">
                                  {product.category}
                              </span>
                              <p className="font-black text-sm md:text-base" style={{ color: primaryColor }}>
                                  {formatCurrency(product.price)}
                              </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 
              ESPAÇADOR GIGANTE PARA MOBILE 
              Isso garante que o conteúdo role até o topo da tela se necessário,
              livrando completamente o botão flutuante e a navbar.
            */}
            <div className="w-full h-64 md:hidden block" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;