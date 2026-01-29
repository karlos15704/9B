import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, CartItem, Transaction, AppSettings, LayoutBlock } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Search, ShoppingCart, Plus, Minus, X, ArrowLeft, Send, CheckCircle2, User, UtensilsCrossed, AlertTriangle, Clock, RefreshCw, ChefHat, PackageCheck, Banknote, BellRing, Ban, AlertOctagon } from 'lucide-react';
import { createTransaction, fetchNextOrderNumber, fetchTransactionsByIds, subscribeToTransactions } from '../services/supabase';

interface CustomerOrderProps {
  products: Product[];
  onExit: () => void;
  nextOrderNumber: number;
  settings: AppSettings;
}

// Sons para notificação
const SOUND_PAYMENT_CONFIRMED = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/glass_ting.mp3";
const SOUND_ORDER_READY = "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3";

const CustomerOrder: React.FC<CustomerOrderProps> = ({ products, onExit, nextOrderNumber, settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [view, setView] = useState<'menu' | 'cart' | 'success' | 'orders'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [lastOrderInfo, setLastOrderInfo] = useState<{number: string, name: string} | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [myOrders, setMyOrders] = useState<Transaction[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [readyOrderModal, setReadyOrderModal] = useState<Transaction | null>(null);
  const prevOrdersRef = useRef<Transaction[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback layout se não houver um definido
  // ATENÇÃO: Removido 'settings.customerHeroUrl' para garantir que a nova imagem seja usada por padrão
  const displayLayout = settings.customerLayout || [
      { id: 'h1', type: 'hero', title: settings.customerWelcomeTitle || 'Bem-vindo', imageUrl: 'https://i.ibb.co/xt5zh5bR/logoo-Edited.png', style: { height: 'medium', alignment: 'center' } },
      { id: 'p1', type: 'products' }
  ];

  // ... (Lógica de som e notificações permanece igual) ...
  const stopNotificationSound = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; 
    }
  };

  const requestNotificationPermission = () => {
    try {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission().catch(err => console.log("Erro permissão notificação:", err));
        }
    } catch (e) {
        console.log("Notificações não suportadas.");
    }
  };

  const sendSystemNotification = (title: string, body: string, soundUrl: string) => {
    try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([500, 200, 500]); } catch(e) {}
        }
        try {
            stopNotificationSound();
            const audio = new Audio(soundUrl);
            audioRef.current = audio; 
            const playPromise = audio.play();
            if (playPromise !== undefined) { playPromise.catch(e => console.log("Audio block", e)); }
        } catch(e) {}
        if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification(title, { body: body, icon: settings.mascotUrl, tag: 'order-update', requireInteraction: true }); } catch(e) {}
        }
    } catch (err) {}
  };

  const getStoredOrderIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('my_order_ids') || '[]'); } catch(e) { return []; }
  };
  const saveOrderId = (id: string) => {
    localStorage.setItem('my_order_ids', JSON.stringify([id, ...getStoredOrderIds()]));
  };
  const loadMyOrders = async () => {
    if (myOrders.length === 0) setIsLoadingOrders(true);
    const ids = getStoredOrderIds();
    if (ids.length > 0) {
        const transactions = await fetchTransactionsByIds(ids);
        if (transactions) setMyOrders(transactions);
    }
    setIsLoadingOrders(false);
  };

  useEffect(() => {
    if (myOrders.length > 0 && prevOrdersRef.current.length > 0) {
        myOrders.forEach(newOrder => {
            const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
            if (oldOrder) {
                if (oldOrder.status === 'pending_payment' && newOrder.status === 'completed') {
                    sendSystemNotification(`Pagamento Confirmado!`, `Seu pedido #${newOrder.orderNumber} foi enviado para a cozinha.`, SOUND_PAYMENT_CONFIRMED);
                }
                if (oldOrder.kitchenStatus === 'pending' && newOrder.kitchenStatus === 'done') {
                    sendSystemNotification(`PEDIDO PRONTO!`, `Sua senha #${newOrder.orderNumber} está pronta! Retire no balcão.`, SOUND_ORDER_READY);
                    setReadyOrderModal(newOrder);
                }
            }
        });
    }
    prevOrdersRef.current = myOrders;
  }, [myOrders]);

  useEffect(() => {
    requestNotificationPermission(); 
    loadMyOrders(); 
    const subscription = subscribeToTransactions(() => { loadMyOrders(); });
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (selectedCategory === 'Todos' || p.category === selectedCategory)), [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.isAvailable === false) return; 
    
    // --- VALIDAÇÃO DE ESTOQUE ---
    const existingItem = cart.find(item => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (product.stock !== undefined && (currentQty + 1) > product.stock) {
        alert(`Ops! Só existem ${product.stock} unidades de "${product.name}" disponíveis.`);
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    // --- VALIDAÇÃO DE ESTOQUE (Apenas ao aumentar) ---
    if (delta > 0) {
        const product = products.find(p => p.id === id);
        const item = cart.find(i => i.id === id);
        
        if (product && item && product.stock !== undefined) {
             if ((item.quantity + delta) > product.stock) {
                 alert(`Ops! Limite de estoque atingido. Só temos ${product.stock} disponíveis.`);
                 return;
             }
        }
    }

    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleFinishOrder = async () => {
    if (!customerName.trim()) { alert("Por favor, digite seu nome."); return; }
    setIsSending(true);
    let orderNumber = nextOrderNumber.toString();
    const freshNumber = await fetchNextOrderNumber();
    if (freshNumber) orderNumber = freshNumber;
    const transactionId = generateId();
    const newTransaction: Transaction = {
        id: transactionId, orderNumber, customerName, timestamp: Date.now(), items: cart, subtotal: total, discount: 0, total, paymentMethod: 'Aguardando', status: 'pending_payment', kitchenStatus: 'pending'
    };
    const success = await createTransaction(newTransaction);
    setIsSending(false);
    if (success) {
        saveOrderId(transactionId); setLastOrderInfo({ number: orderNumber, name: customerName }); setCart([]); setView('success'); requestNotificationPermission(); loadMyOrders();
    } else {
        alert("❌ ERRO AO ENVIAR PEDIDO!\n\nTente novamente ou chame um atendente.");
    }
  };

  const renderReadyModal = () => {
    if (!readyOrderModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center animate-in zoom-in-95 duration-300 relative">
                <div className="mb-4 flex justify-center"><div className="bg-green-100 p-4 rounded-full animate-bounce"><CheckCircle2 size={48} className="text-green-600" /></div></div>
                <h2 className="text-2xl font-black text-gray-800 uppercase mb-2">Seu Pedido está Pronto!</h2>
                <div className="bg-orange-100 border-2 border-orange-200 border-dashed rounded-xl p-4 mb-4"><span className="text-xs font-bold text-orange-600 uppercase">Sua Senha</span><p className="text-6xl font-black text-orange-600">#{readyOrderModal.orderNumber}</p></div>
                <p className="text-gray-600 font-medium mb-6">Pode retirar no balcão agora.</p>
                <button onClick={() => { stopNotificationSound(); setReadyOrderModal(null); }} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">ENTENDI, TÔ INDO!</button>
            </div>
        </div>
    );
  };

  // --- COMPONENTE: PRODUTOS ---
  const renderProductGrid = () => (
    <div className="p-4">
        {/* Busca e Categorias dentro do componente para ficarem no fluxo do layout */}
        <div className="mb-4 space-y-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="O que você quer comer?" className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>{cat}</button>
                ))}
             </div>
        </div>

        {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <UtensilsCrossed size={48} className="mb-2 opacity-50" />
                <p>Nenhum produto encontrado.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.id === product.id);
                    const isSoldOut = product.isAvailable === false;
                    return (
                        <div key={product.id} className={`bg-white p-3 rounded-2xl shadow-sm border flex gap-4 overflow-hidden relative ${isSoldOut ? 'border-red-200 opacity-90' : 'border-gray-100'}`}>
                                <div className="w-24 h-24 bg-gray-50 rounded-xl flex-shrink-0 relative">
                                <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-contain ${isSoldOut ? 'grayscale' : ''}`} />
                                {isSoldOut && <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-xl"><div className="bg-red-600 text-white font-black uppercase text-[10px] px-2 py-1 transform -rotate-12 border border-white shadow-sm">ESGOTADO</div></div>}
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                <div><h3 className="font-bold text-gray-800 leading-tight mb-1">{product.name}</h3><p className="text-xs text-gray-400 line-clamp-2">{product.description || product.category}</p></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black text-orange-600">{formatCurrency(product.price)}</span>
                                    {isSoldOut ? <button disabled className="bg-gray-100 text-gray-400 cursor-not-allowed p-2 rounded-lg font-bold flex items-center gap-1"><Ban size={16} /> Indisponível</button> : inCart ? <div className="flex items-center gap-3 bg-gray-900 text-white rounded-lg p-1.5 shadow-lg shadow-gray-200"><button onClick={() => updateQuantity(product.id, -1)}><Minus size={14}/></button><span className="text-sm font-bold w-4 text-center">{inCart.quantity}</span><button onClick={() => updateQuantity(product.id, 1)}><Plus size={14}/></button></div> : <button onClick={() => addToCart(product)} className="bg-orange-100 text-orange-700 p-2 rounded-lg font-bold hover:bg-orange-200 transition-colors"><Plus size={20} /></button>}
                                </div>
                                </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );

  // --- RENDERIZADOR DE BLOCOS (ENGINE DO LAYOUT) ---
  const renderLayout = () => {
     return displayLayout.map(block => {
        switch(block.type) {
            case 'hero':
                return (
                    <div key={block.id} className={`relative w-full overflow-hidden ${block.style?.height === 'small' ? 'h-32' : block.style?.height === 'large' ? 'h-64' : 'h-48'}`}>
                        <img src={block.imageUrl} className="w-full h-full object-cover" alt="Hero" />
                        <div className={`absolute inset-0 bg-black/40 flex items-center p-6 ${block.style?.alignment === 'center' ? 'justify-center text-center' : block.style?.alignment === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}>
                            <h2 className="text-white font-black text-2xl leading-tight drop-shadow-md animate-in slide-in-from-bottom-2">{block.title}</h2>
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div key={block.id} className="p-4" style={{ backgroundColor: block.style?.backgroundColor || 'transparent', textAlign: block.style?.alignment || 'left' }}>
                        {block.title && <h3 className="font-bold text-lg mb-1" style={{ color: block.style?.textColor || '#1f2937' }}>{block.title}</h3>}
                        <p className="text-sm" style={{ color: block.style?.textColor || '#4b5563' }}>{block.content}</p>
                    </div>
                );
            case 'marquee':
                return (
                    <div key={block.id} className="py-2 overflow-hidden whitespace-nowrap font-bold text-xs uppercase tracking-widest flex items-center" style={{ backgroundColor: block.style?.backgroundColor || '#ea580c', color: block.style?.textColor || '#ffffff' }}>
                         <div className="animate-[marquee_20s_linear_infinite] px-4 flex gap-4">
                             <span><AlertOctagon size={14} className="inline mr-1"/> {block.content}</span>
                             <span><AlertOctagon size={14} className="inline mr-1"/> {block.content}</span>
                             <span><AlertOctagon size={14} className="inline mr-1"/> {block.content}</span>
                         </div>
                    </div>
                );
            case 'image':
                return <img key={block.id} src={block.imageUrl} className="w-full h-auto object-cover" />;
            case 'spacer':
                return <div key={block.id} style={{ height: block.style?.height === 'large' ? '60px' : '20px' }}></div>;
            case 'products':
                return <React.Fragment key={block.id}>{renderProductGrid()}</React.Fragment>;
            default:
                return null;
        }
     });
  };

  if (view === 'success') {
      return (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {renderReadyModal()}
            {/* ... success view content (mesmo código anterior) ... */}
            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-200 animate-in zoom-in duration-500">
                <CheckCircle2 size={64} className="text-green-600 animate-in spin-in-90 duration-700" />
            </div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">Pedido Recebido!</h1>
            <div className="my-6 bg-red-100 border-l-4 border-red-500 p-4 rounded-r-lg max-w-md w-full animate-pulse">
                <div className="flex items-center gap-3 mb-1"><Banknote size={28} className="text-red-600" /><h3 className="font-black text-red-700 text-lg uppercase">Atenção, {lastOrderInfo?.name}!</h3></div>
                <p className="text-red-800 font-bold leading-tight text-left">Dirija-se ao CAIXA agora para realizar o pagamento e liberar seu pedido para a cozinha.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-orange-100 w-full max-w-sm mb-8 relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sua Senha</p>
                <p className="text-7xl font-black text-orange-600 tracking-tighter mb-4 drop-shadow-sm">#{lastOrderInfo?.number}</p>
                <div className="text-xs text-gray-400 flex items-center justify-center gap-1"><Clock size={12}/> Registrado às {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-sm">
                <button onClick={() => setView('orders')} className="bg-white text-orange-600 border-2 border-orange-100 font-bold py-4 px-8 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"><Clock size={20} /> ACOMPANHAR PEDIDO</button>
                <button onClick={() => { setView('menu'); setCustomerName(''); setLastOrderInfo(null); }} className="bg-gray-900 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-orange-600 transition-colors">FAZER NOVO PEDIDO</button>
            </div>
        </div>
      );
  }

  if (view === 'orders') {
      // ... same orders view code ...
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {renderReadyModal()}
            <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between shadow-sm">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={24} /></button>
                <h2 className="font-bold text-lg text-gray-800">Meus Pedidos</h2>
                <button onClick={loadMyOrders} className={`p-2 text-blue-600 hover:bg-blue-50 rounded-full ${isLoadingOrders ? 'animate-spin' : ''}`}><RefreshCw size={24} /></button>
            </div>
            <div className="bg-blue-50 px-4 py-2 text-xs text-blue-700 flex items-center justify-center gap-2 border-b border-blue-100"><BellRing size={14} className="animate-pulse" /><span>Nós te avisaremos aqui quando estiver pronto!</span></div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {isLoadingOrders ? <div className="text-center py-10 text-gray-400">Carregando seus pedidos...</div> : myOrders.length === 0 ? <div className="text-center py-10 text-gray-400 flex flex-col items-center"><Clock size={48} className="mb-4 opacity-50"/><p>Você ainda não fez nenhum pedido.</p></div> : myOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-start mb-3"><div><span className="text-xs font-bold text-gray-400 uppercase">Senha</span><p className="text-3xl font-black text-gray-800 leading-none">#{order.orderNumber}</p></div><span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                        <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 ${order.status === 'completed' ? (order.kitchenStatus === 'done' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}><span className="font-bold text-sm uppercase">{order.status === 'completed' ? (order.kitchenStatus === 'done' ? 'PRONTO! RETIRE' : 'Em Preparo') : order.status === 'cancelled' ? 'Cancelado' : 'Aguardando Pagto'}</span></div>
                        <div className="border-t border-gray-100 pt-3"><p className="text-sm text-gray-600 line-clamp-2">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p><p className="text-right font-black text-gray-900 mt-2">{formatCurrency(order.total)}</p></div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  if (view === 'cart') {
    // ... same cart view code ...
    return (
        <div className="min-h-screen bg-white flex flex-col animate-in slide-in-from-right duration-300">
            {renderReadyModal()}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10"><button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} className="text-gray-700" /></button><h2 className="text-xl font-bold text-gray-800">Seu Carrinho</h2></div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Seu Nome</label><div className="relative mt-1"><User className="absolute left-3 top-3 text-orange-500" size={20} /><input type="text" placeholder="Digite seu nome..." className="w-full pl-10 pr-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-bold text-gray-800" value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus /></div></div>
                {cart.length === 0 ? <div className="text-center py-10 text-gray-400"><ShoppingCart size={48} className="mx-auto mb-2 opacity-50" /><p>Seu carrinho está vazio.</p></div> : <div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex gap-3 items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm"><img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain rounded-lg bg-gray-50" /><div className="flex-1"><h3 className="font-bold text-gray-800 text-sm">{item.name}</h3><p className="text-orange-600 font-bold">{formatCurrency(item.price * item.quantity)}</p></div><div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-orange-600"><Minus size={16} /></button><span className="font-bold text-sm w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-orange-600"><Plus size={16} /></button></div></div>))}</div>}
            </div>
            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]"><div className="flex justify-between items-center mb-4"><span className="text-gray-500">Total</span><span className="text-2xl font-black text-gray-900">{formatCurrency(total)}</span></div><button onClick={handleFinishOrder} disabled={cart.length === 0 || !customerName.trim() || isSending} className="w-full bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all">{isSending ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <><Send size={20} /> ENVIAR PEDIDO</>}</button></div>
        </div>
    );
  }

  // --- MENU VIEW (AGORA BASEADA EM LAYOUT DINÂMICO) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {renderReadyModal()}
      
      {/* Static App Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-20 flex justify-between items-center">
         <div className="flex items-center gap-2">
             <img src={settings.mascotUrl} alt="Logo" className="w-8 h-8 object-contain" />
             <h1 className="font-black text-gray-800 tracking-tight">{settings.appName}</h1>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={() => setView('orders')} className="flex flex-col items-center justify-center text-gray-500 hover:text-orange-600 transition-colors"><Clock size={20} /><span className="text-[10px] font-bold">Meus Pedidos</span></button>
             <button onClick={onExit} className="text-xs text-gray-400 underline ml-2">Sair</button>
         </div>
      </div>

      {/* RENDER LAYOUT DINÂMICO */}
      <div className="flex-1 overflow-y-auto pb-24">
        {renderLayout()}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
         <div className="fixed bottom-6 left-0 w-full px-6 z-30">
             <button onClick={() => setView('cart')} className="w-full bg-orange-600 text-white py-4 px-6 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between font-bold animate-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center gap-3"><div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">{cartCount}</div><span>Ver Carrinho</span></div>
                 <span>{formatCurrency(total)}</span>
             </button>
         </div>
      )}
    </div>
  );
};

export default CustomerOrder;