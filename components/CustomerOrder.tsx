import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Transaction } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Search, ShoppingCart, Plus, Minus, X, ArrowLeft, Send, CheckCircle2, User, UtensilsCrossed, AlertTriangle, Clock, RefreshCw, ChefHat, PackageCheck, Banknote } from 'lucide-react';
import { MASCOT_URL, APP_NAME } from '../constants';
import { createTransaction, fetchNextOrderNumber, fetchTransactionsByIds } from '../services/supabase';

interface CustomerOrderProps {
  products: Product[];
  onExit: () => void;
  nextOrderNumber: number;
}

const CustomerOrder: React.FC<CustomerOrderProps> = ({ products, onExit, nextOrderNumber }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [view, setView] = useState<'menu' | 'cart' | 'success' | 'orders'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [lastOrderInfo, setLastOrderInfo] = useState<{number: string, name: string} | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Estado para Meus Pedidos
  const [myOrders, setMyOrders] = useState<Transaction[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Carregar IDs de pedidos do LocalStorage
  const getStoredOrderIds = (): string[] => {
    const stored = localStorage.getItem('my_order_ids');
    return stored ? JSON.parse(stored) : [];
  };

  const saveOrderId = (id: string) => {
    const current = getStoredOrderIds();
    const updated = [id, ...current]; // Mais recente primeiro
    localStorage.setItem('my_order_ids', JSON.stringify(updated));
  };

  const loadMyOrders = async () => {
    setIsLoadingOrders(true);
    const ids = getStoredOrderIds();
    if (ids.length > 0) {
        const transactions = await fetchTransactionsByIds(ids);
        setMyOrders(transactions);
    }
    setIsLoadingOrders(false);
  };

  // Carregar pedidos sempre que entrar na tela 'orders'
  useEffect(() => {
    if (view === 'orders') {
        loadMyOrders();
    }
  }, [view]);

  // Categorias
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  // Filtro
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const isAvailable = product.isAvailable !== false;
      return matchesSearch && matchesCategory && isAvailable;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart Helpers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleFinishOrder = async () => {
    if (!customerName.trim()) {
        alert("Por favor, digite seu nome.");
        return;
    }

    setIsSending(true);

    // 1. Tenta buscar o número mais atualizado do banco
    let orderNumber = nextOrderNumber.toString();
    const freshNumber = await fetchNextOrderNumber();
    
    if (freshNumber) {
        orderNumber = freshNumber;
    }

    const transactionId = generateId();

    const newTransaction: Transaction = {
        id: transactionId,
        orderNumber: orderNumber,
        customerName: customerName,
        timestamp: Date.now(),
        items: cart,
        subtotal: total,
        discount: 0,
        total: total,
        paymentMethod: 'Aguardando',
        status: 'pending_payment', // Status crucial para o caixa puxar
        kitchenStatus: 'pending' // Só vai aparecer na cozinha qdo o caixa confirmar, mas já deixamos setado
    };

    const success = await createTransaction(newTransaction);
    
    setIsSending(false);

    if (success) {
        saveOrderId(transactionId); // Salva no histórico local
        setLastOrderInfo({ number: orderNumber, name: customerName });
        setCart([]);
        setView('success');
    } else {
        alert("❌ ERRO AO ENVIAR PEDIDO!\n\nTente novamente ou chame um atendente.");
    }
  };

  if (view === 'success') {
      return (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            
            {/* Animação de Confete/Luzes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-red-400 rounded-full animate-bounce delay-100"></div>
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-ping delay-300"></div>
                <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-200 animate-in zoom-in duration-500">
                <CheckCircle2 size={64} className="text-green-600 animate-in spin-in-90 duration-700" />
            </div>
            
            <h1 className="text-4xl font-black text-gray-800 mb-2 animate-in slide-in-from-bottom-4 duration-500">Pedido Recebido!</h1>
            
            {/* AVISO IMPORTANTE DE PAGAMENTO */}
            <div className="my-6 bg-red-100 border-l-4 border-red-500 p-4 rounded-r-lg max-w-md w-full animate-pulse">
                <div className="flex items-center gap-3 mb-1">
                    <Banknote size={28} className="text-red-600" />
                    <h3 className="font-black text-red-700 text-lg uppercase">Atenção, {lastOrderInfo?.name}!</h3>
                </div>
                <p className="text-red-800 font-bold leading-tight text-left">
                    Dirija-se ao CAIXA agora para realizar o pagamento e liberar seu pedido para a cozinha.
                </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-orange-100 w-full max-w-sm mb-8 relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sua Senha</p>
                <p className="text-7xl font-black text-orange-600 tracking-tighter mb-4 drop-shadow-sm">#{lastOrderInfo?.number}</p>
                <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Clock size={12}/>
                    Registrado às {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-sm">
                <button 
                    onClick={() => setView('orders')}
                    className="bg-white text-orange-600 border-2 border-orange-100 font-bold py-4 px-8 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                    <Clock size={20} />
                    ACOMPANHAR PEDIDO
                </button>
                <button 
                    onClick={() => {
                        setView('menu');
                        setCustomerName('');
                        setLastOrderInfo(null);
                    }}
                    className="bg-gray-900 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
                >
                    FAZER NOVO PEDIDO
                </button>
            </div>
        </div>
      );
  }

  // TELA DE MEUS PEDIDOS
  if (view === 'orders') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between shadow-sm">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="font-bold text-lg text-gray-800">Meus Pedidos</h2>
                <button onClick={loadMyOrders} className={`p-2 text-blue-600 hover:bg-blue-50 rounded-full ${isLoadingOrders ? 'animate-spin' : ''}`}>
                    <RefreshCw size={24} />
                </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {isLoadingOrders ? (
                    <div className="text-center py-10 text-gray-400">Carregando seus pedidos...</div>
                ) : myOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <Clock size={48} className="mb-4 opacity-50"/>
                        <p>Você ainda não fez nenhum pedido neste dispositivo.</p>
                    </div>
                ) : (
                    myOrders.map(order => {
                        // Determinar Status
                        let statusConfig = { color: 'bg-yellow-100 text-yellow-800', text: 'Aguardando Pagamento', icon: Banknote };
                        
                        if (order.status === 'completed') {
                            if (order.kitchenStatus === 'done') {
                                statusConfig = { color: 'bg-green-100 text-green-800', text: 'PRONTO! RETIRE NO BALCÃO', icon: CheckCircle2 };
                            } else {
                                statusConfig = { color: 'bg-blue-100 text-blue-800', text: 'Em Preparo', icon: ChefHat };
                            }
                        } else if (order.status === 'cancelled') {
                             statusConfig = { color: 'bg-red-100 text-red-800', text: 'Cancelado', icon: X };
                        }

                        const StatusIcon = statusConfig.icon;

                        return (
                            <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Senha</span>
                                        <p className="text-3xl font-black text-gray-800 leading-none">#{order.orderNumber}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                        {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 ${statusConfig.color}`}>
                                    <StatusIcon size={20} />
                                    <span className="font-bold text-sm uppercase">{statusConfig.text}</span>
                                </div>
                                
                                {order.status === 'pending_payment' && (
                                    <p className="text-xs text-red-500 font-bold mb-3 animate-pulse">
                                        * Vá ao caixa para pagar.
                                    </p>
                                )}

                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </p>
                                    <p className="text-right font-black text-gray-900 mt-2">{formatCurrency(order.total)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      );
  }

  if (view === 'cart') {
    return (
        <div className="min-h-screen bg-white flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} className="text-gray-700" /></button>
                <h2 className="text-xl font-bold text-gray-800">Seu Carrinho</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Seu Nome</label>
                    <div className="relative mt-1">
                        <User className="absolute left-3 top-3 text-orange-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Digite seu nome..." 
                            className="w-full pl-10 pr-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-bold text-gray-800"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Seu carrinho está vazio.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain rounded-lg bg-gray-50" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                                    <p className="text-orange-600 font-bold">{formatCurrency(item.price * item.quantity)}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-orange-600"><Minus size={16} /></button>
                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-orange-600"><Plus size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500">Total</span>
                    <span className="text-2xl font-black text-gray-900">{formatCurrency(total)}</span>
                </div>
                <button 
                    onClick={handleFinishOrder}
                    disabled={cart.length === 0 || !customerName.trim() || isSending}
                    className="w-full bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {isSending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <Send size={20} />
                            ENVIAR PEDIDO
                        </>
                    )}
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-20">
         <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                 <img src={MASCOT_URL} alt="Logo" className="w-8 h-8 object-contain" />
                 <h1 className="font-black text-gray-800 tracking-tight">{APP_NAME}</h1>
             </div>
             <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setView('orders')}
                    className="flex flex-col items-center justify-center text-gray-500 hover:text-orange-600 transition-colors"
                 >
                    <Clock size={20} />
                    <span className="text-[10px] font-bold">Meus Pedidos</span>
                 </button>
                 <button onClick={onExit} className="text-xs text-gray-400 underline ml-2">Sair</button>
             </div>
         </div>
         
         {/* Busca */}
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="O que você quer comer?" 
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all font-medium text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>

         {/* Categorias */}
         <div className="flex gap-2 overflow-x-auto pt-4 pb-1 scrollbar-hide">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border
                        ${selectedCategory === cat 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white text-gray-500 border-gray-200'}`}
                >
                    {cat}
                </button>
            ))}
         </div>
      </div>

      {/* Product List */}
      <div className="flex-1 p-4 pb-24 overflow-y-auto">
         {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
                <UtensilsCrossed size={48} className="mb-2 opacity-50" />
                <p>Nenhum produto encontrado.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-4">
                {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.id === product.id);
                    return (
                        <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                             <div className="w-24 h-24 bg-gray-50 rounded-xl flex-shrink-0">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                             </div>
                             <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h3 className="font-bold text-gray-800 leading-tight mb-1">{product.name}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-2">{product.description || product.category}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black text-orange-600">{formatCurrency(product.price)}</span>
                                    {inCart ? (
                                        <div className="flex items-center gap-3 bg-gray-900 text-white rounded-lg p-1.5 shadow-lg shadow-gray-200">
                                            <button onClick={() => updateQuantity(product.id, -1)}><Minus size={14}/></button>
                                            <span className="text-sm font-bold w-4 text-center">{inCart.quantity}</span>
                                            <button onClick={() => updateQuantity(product.id, 1)}><Plus size={14}/></button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => addToCart(product)}
                                            className="bg-orange-100 text-orange-700 p-2 rounded-lg font-bold hover:bg-orange-200 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    )}
                                </div>
                             </div>
                        </div>
                    );
                })}
            </div>
         )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
         <div className="fixed bottom-6 left-0 w-full px-6 z-30">
             <button 
                onClick={() => setView('cart')}
                className="w-full bg-orange-600 text-white py-4 px-6 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between font-bold animate-in slide-in-from-bottom-4 duration-300"
             >
                 <div className="flex items-center gap-3">
                     <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                         {cartCount}
                     </div>
                     <span>Ver Carrinho</span>
                 </div>
                 <span>{formatCurrency(total)}</span>
             </button>
         </div>
      )}
    </div>
  );
};

export default CustomerOrder;