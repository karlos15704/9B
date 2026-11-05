import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, CartItem, Transaction, AppSettings, LayoutBlock, PaymentMethod } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Search, ShoppingCart, Plus, Minus, X, ArrowLeft, Send, CheckCircle2, User, UtensilsCrossed, AlertTriangle, Clock, RefreshCw, ChefHat, PackageCheck, Banknote, BellRing, Ban, Heart } from 'lucide-react';
import { createTransaction, fetchNextOrderNumber, fetchTransactionsByIds, subscribeToTransactions, authPromise } from '../services/supabase';

interface CustomerOrderProps {
  products: Product[];
  onExit: () => void;
  nextOrderNumber: number;
  settings: AppSettings;
}

const SOUND_PAYMENT_CONFIRMED = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/glass_ting.mp3";
const SOUND_ORDER_READY = "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3";

const THANK_YOU_MESSAGES = [
    "Obrigado por apoiar nosso sonho! 🎓✨",
    "Sua ajuda faz a diferença na nossa formatura! 🚀",
    "Gratidão! Você está ajudando a construir nosso futuro. ❤️",
    "Valeu demais! A turma de 2026 agradece. 🙌",
    "Cada contribuição nos aproxima da nossa festa! 🎉",
    "Você é incrível! Obrigado por acreditar em nós. 🌟",
    "Sua generosidade vai ficar para a história! 📖",
    "Obrigado por fazer parte da nossa jornada! 🎓"
];

const CustomerOrder: React.FC<CustomerOrderProps> = ({ products, onExit, nextOrderNumber, settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [view, setView] = useState<'menu' | 'cart' | 'success' | 'orders'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [lastOrderInfo, setLastOrderInfo] = useState<{number: string, name: string} | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [customDonation, setCustomDonation] = useState('');
  const [donationMessage, setDonationMessage] = useState<string | null>(null);
  const [isPureDonationOrder, setIsPureDonationOrder] = useState(false);
  
  const [myOrders, setMyOrders] = useState<Transaction[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [readyOrderModal, setReadyOrderModal] = useState<Transaction | null>(null);
  const prevOrdersRef = useRef<Transaction[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAddDonation = (amount: number) => {
      const donationProduct: Product = {
          id: `donation-${Date.now()}`,
          name: 'Doação Formatura 2026',
          price: amount,
          category: 'Doação',
          description: 'Contribuição para a formatura',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/2904/2904973.png',
          isAvailable: true
      };
      addToCart(donationProduct);
      setShowDonationModal(false);
      setCustomDonation('');
      setView('cart');
  };

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
    try {
        await authPromise;
        const ids = getStoredOrderIds();
        if (ids.length > 0) {
            const transactions = await fetchTransactionsByIds(ids);
            if (transactions) setMyOrders(transactions);
        }
    } catch (err) {
        console.error("Auth failed, cannot load orders", err);
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

  const categories = useMemo(() => {
      return ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
          if (selectedCategory === 'Todos') return matchesSearch;
          return matchesSearch && p.category === selectedCategory;
      });
  }, [products, searchTerm, selectedCategory]);

  const calculateMaxStock = (product: Product): number => {
    if (product.isAvailable === false) return 0;
    if (product.comboItems && product.comboItems.length > 0) {
        let minCombos = 999999;
        for (const item of product.comboItems) {
            const ingredient = products.find(p => p.id === item.productId);
            if (!ingredient || ingredient.isAvailable === false) return 0;
            if (ingredient.stock !== undefined && ingredient.stock !== null) {
                const possible = Math.floor(ingredient.stock / item.quantity);
                if (possible < minCombos) minCombos = possible;
            }
        }
        return minCombos === 999999 ? 999999 : minCombos; 
    }
    if (product.stock !== undefined && product.stock !== null) return product.stock;
    return 999999;
  };

  const addToCart = (product: Product) => {
    const maxStock = calculateMaxStock(product);
    if (maxStock === 0) return;
    const existingItem = cart.find(item => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    if ((currentQty + 1) > maxStock) {
        const isCombo = !!product.comboItems?.length;
        alert(`Ops! ${isCombo ? 'Ingredientes insuficientes' : 'Estoque insuficiente'}. Só temos ${maxStock} unidades de "${product.name}".`);
        return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (delta > 0) {
        const product = products.find(p => p.id === id);
        const item = cart.find(i => i.id === id);
        if (product && item) {
             const maxStock = calculateMaxStock(product);
             if ((item.quantity + delta) > maxStock) {
                 alert(`Ops! Limite de estoque atingido. Só temos ${maxStock} disponíveis.`);
                 return;
             }
        }
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [donationNote, setDonationNote] = useState('');
  const [showDonationNoteModal, setShowDonationNoteModal] = useState(false);

  const finishOrderProcess = async () => {
    setIsSending(true);
    const isPureDonation = cart.every(item => item.category === 'Doação');
    const hasDonation = cart.some(item => item.category === 'Doação');
    let orderNumber = "";
    if (isPureDonation) {
        orderNumber = "D-" + Math.floor(1000 + Math.random() * 9000);
    } else {
        orderNumber = nextOrderNumber.toString();
        const freshNumber = await fetchNextOrderNumber();
        if (freshNumber) orderNumber = freshNumber;
    }
    const transactionId = generateId();
    const newTransaction: Transaction = {
        id: transactionId, 
        orderNumber, 
        customerName, 
        timestamp: Date.now(), 
        items: cart, 
        subtotal: total, 
        discount: 0, 
        total, 
        paymentMethod: 'Aguardando', 
        status: 'pending_payment', 
        kitchenStatus: 'pending',
        donationMessage: hasDonation ? donationNote : undefined
    };
    const success = await createTransaction(newTransaction);
    if (success) {
        setIsPureDonationOrder(isPureDonation);
        if (hasDonation) {
            const randomMsg = THANK_YOU_MESSAGES[Math.floor(Math.random() * THANK_YOU_MESSAGES.length)];
            setDonationMessage(randomMsg);
        } else {
            setDonationMessage(null);
        }
        setIsSending(false);
        saveOrderId(transactionId); 
        setLastOrderInfo({ number: orderNumber, name: customerName }); 
        setCart([]); 
        setDonationNote('');
        loadMyOrders();
        setView('success');
    } else {
        setIsSending(false);
        alert("❌ ERRO AO ENVIAR PEDIDO!\n\nTente novamente ou chame um atendente.");
    }
  };

  const handleFinishOrder = async () => {
    if (!customerName.trim()) { alert("Por favor, digite seu nome."); return; }
    const hasDonation = cart.some(item => item.category === 'Doação');
    if (hasDonation && !donationNote && !showDonationNoteModal) {
        setShowDonationNoteModal(true);
        return;
    }
    await finishOrderProcess();
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

  const renderDonationNoteModal = () => (
      showDonationNoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 relative">
            <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
                    <Heart size={40} className="text-pink-600 fill-current animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Deixe uma Mensagem!</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Sua mensagem aparecerá no telão da formatura para os alunos no final do ano. ❤️
                </p>
            </div>
            <textarea
                value={donationNote}
                onChange={(e) => setDonationNote(e.target.value)}
                placeholder="Escreva sua mensagem de carinho aqui..."
                className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl mb-6 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all resize-none text-gray-700 font-medium"
                maxLength={150}
            />
            <div className="flex gap-3">
                <button onClick={() => { setShowDonationNoteModal(false); finishOrderProcess(); }} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Pular</button>
                <button onClick={() => { setShowDonationNoteModal(false); finishOrderProcess(); }} className="flex-1 py-3 px-4 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200 transition-colors">Enviar Mensagem</button>
            </div>
          </div>
        </div>
      )
  );

  const renderProductGrid = () => (
    <div className="p-4 md:p-6 pb-32">
        {renderDonationNoteModal()}
        {showDonationModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl max-sm w-full p-6 animate-in zoom-in-95 relative">
                    <button onClick={() => setShowDonationModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500 shadow-inner">
                            <Heart size={40} fill="currentColor" className="animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 leading-tight">Apoie a Formatura 2026!</h3>
                        <p className="text-gray-500 font-medium mt-2">Sua contribuição é muito importante para nós.</p>
                        <p className="text-xs text-gray-400 mt-1 font-bold uppercase bg-gray-100 inline-block px-2 py-1 rounded">Pagamento via Pix ou Dinheiro no Caixa</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[2, 5, 10].map(val => (
                            <button key={val} onClick={() => handleAddDonation(val)} className="py-4 rounded-2xl border-2 border-pink-100 bg-pink-50 text-pink-600 font-black text-lg hover:bg-pink-100 hover:border-pink-300 transition-all active:scale-95 shadow-sm">{formatCurrency(val)}</button>
                        ))}
                    </div>
                    <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                        <input type="number" placeholder="Outro valor..." value={customDonation} onChange={e => setCustomDonation(e.target.value)} className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-500 focus:outline-none font-bold text-gray-800 text-lg bg-gray-50 focus:bg-white transition-colors" />
                    </div>
                    <button onClick={() => { const val = parseFloat(customDonation); if (val > 0) handleAddDonation(val); }} disabled={!customDonation || parseFloat(customDonation) <= 0} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"><CheckCircle2 size={24} /> CONFIRMAR DOAÇÃO</button>
                </div>
            </div>
        )}
        <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-8 shadow-xl group bg-gray-900">
            <div className="absolute inset-0 opacity-40 blur-2xl scale-110" style={{ backgroundImage: `url(${settings.customerHeroUrl || settings.mascotUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>
            <img src={settings.customerHeroUrl || settings.mascotUrl} className="relative z-10 w-full h-full object-contain p-2 md:p-4 origin-right md:origin-center transform group-hover:scale-105 transition-transform duration-700" alt="Hero" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 max-w-lg">
                <h2 className="text-white font-black text-3xl md:text-5xl drop-shadow-lg mb-2 leading-tight">{settings.customerWelcomeTitle || 'Bem-vindo'}</h2>
                <p className="text-white/90 font-medium text-sm md:text-lg drop-shadow-md">Escolha o que você quer comer e receba rapidinho!</p>
            </div>
        </div>
        <div onClick={() => setShowDonationModal(true)} className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 mb-6 shadow-lg shadow-pink-200 text-white flex items-center justify-between relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Heart className="fill-white animate-pulse" size={20} />
                    <span className="font-black text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Formatura 2026</span>
                </div>
                <h3 className="font-black text-xl md:text-2xl leading-tight mb-1">Faça uma doação!</h3>
                <p className="text-white/90 text-xs md:text-sm font-medium max-w-[200px]">Ajude nossa turma a realizar este sonho.</p>
            </div>
            <div className="relative z-10 bg-white text-pink-600 px-4 py-2 rounded-xl font-black shadow-md text-sm whitespace-nowrap">CONTRIBUIR</div>
            <Heart className="absolute -right-6 -bottom-6 text-white/10 w-32 h-32 rotate-12" />
        </div>
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 py-4 -mx-4 px-4 md:mx-0 md:px-0 mb-6 space-y-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input type="text" placeholder="O que você quer comer hoje?" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-orange-200 focus:ring-4 focus:ring-orange-100 transition-all font-bold text-gray-700 shadow-sm group-hover:shadow-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`snap-start flex-shrink-0 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all transform hover:scale-105 active:scale-95 ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>{cat}</button>
                ))}
             </div>
        </div>
        {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in zoom-in duration-500">
                <div className="bg-gray-200 p-6 rounded-full mb-4"><UtensilsCrossed size={48} className="opacity-50" /></div>
                <p className="font-bold text-lg">Nenhum produto encontrado.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredProducts.map(product => {
                    const cartItem = cart.find(item => item.id === product.id);
                    const qty = cartItem ? cartItem.quantity : 0;
                    const maxStock = calculateMaxStock(product);
                    const isSoldOut = maxStock === 0;
                    const isProductCombo = !!(product.comboItems && product.comboItems.length > 0);
                    return (
                        <div key={product.id} onClick={() => !isSoldOut && addToCart(product)} className={`bg-white rounded-3xl shadow-sm border-2 transition-all duration-300 relative overflow-hidden flex flex-col group ${isSoldOut ? 'border-red-100 opacity-70 grayscale' : qty > 0 ? 'border-orange-500 shadow-orange-100 shadow-xl -translate-y-1' : 'border-transparent hover:border-orange-200 hover:shadow-lg hover:-translate-y-1 active:scale-95'}`}>
                            <div className="relative h-40 md:h-56 w-full p-4 bg-white flex items-center justify-center">
                                {isProductCombo && product.comboItems && product.comboItems.length > 0 ? (
                                    <div className="w-full h-full grid grid-cols-2 gap-2 bg-gray-50 rounded-2xl p-2">
                                        {product.comboItems.slice(0, 4).map((item, idx) => {
                                            const ingredient = products.find(p => p.id === item.productId);
                                            return (
                                                <div key={idx} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm">
                                                    <img 
                                                        src={ingredient?.imageUrl || '/images/placeholder.png'} 
                                                        alt="" 
                                                        className={`w-full h-full object-contain ${isSoldOut ? 'grayscale opacity-50' : ''}`}
                                                    />
                                                    {item.quantity > 1 && (
                                                        <div className="absolute bottom-0 right-0 bg-orange-600 text-white text-[10px] font-black px-1.5 rounded-tl-lg">
                                                            x{item.quantity}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain transform transition-transform group-hover:scale-110" />
                                )}
                                {isSoldOut && <div className="absolute inset-0 bg-white/40 flex items-center justify-center"><div className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-lg transform -rotate-12">ESGOTADO</div></div>}
                                {qty > 0 && <div className="absolute top-3 right-3 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg animate-in zoom-in">{qty}</div>}
                            </div>
                            <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                                <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 leading-tight mb-2">{product.name}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-orange-600 text-lg">{formatCurrency(product.price)}</span>
                                    {!isSoldOut && <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Plus size={20} strokeWidth={3} /></div>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
    </div>
  );

  const renderCart = () => (
    <div className="h-full flex flex-col bg-slate-50">
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-xl text-gray-800 uppercase tracking-tight">Seu Carrinho</h2>
            <div className="w-10"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400"><UtensilsCrossed size={64} className="mb-4 opacity-20" /><p className="font-bold">Carrinho vazio</p></div>
            ) : (
                <>
                <div className="bg-white p-6 rounded-3xl border-2 border-orange-100 shadow-sm mb-4">
                    <label className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3 block">Identificação</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={24} />
                        <input type="text" placeholder="Qual o seu nome?" className="w-full pl-12 pr-4 py-4 bg-orange-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-800 text-lg" value={customerName} onChange={e => setCustomerName(e.target.value)} autoFocus />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Precisamos do seu nome para chamar sua senha no telão.</p>
                </div>
                <div className="space-y-3">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
                            <div className="w-16 h-16 rounded-xl bg-gray-50 p-1 flex-shrink-0"><img src={item.imageUrl} alt="" className="w-full h-full object-contain" /></div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                <p className="font-black text-orange-600">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600"><Minus size={16} /></button>
                                <span className="font-black text-gray-800 w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600"><Plus size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}
        </div>
        <div className="p-4 bg-white border-t border-gray-200 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end">
                <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Total a pagar</span>
                <span className="text-4xl font-black text-gray-800">{formatCurrency(total)}</span>
            </div>
            <button onClick={handleFinishOrder} disabled={cart.length === 0 || isSending} className="w-full bg-orange-600 text-white font-black py-5 rounded-2xl text-xl shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                {isSending ? <RefreshCw className="animate-spin" /> : <><Send size={24} /> ENVIAR PEDIDO</>}
            </button>
        </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white relative overflow-hidden">
        {isPureDonationOrder ? (
            <div className="relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="w-32 h-32 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-pink-100">
                    <Heart size={64} className="text-pink-600 fill-current animate-pulse" />
                </div>
                <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tighter uppercase">Gratidão Eterna!</h2>
                <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-6 mb-8 transform rotate-1">
                    <p className="text-xl font-bold text-pink-700 italic">"{donationMessage || 'Obrigado por sua generosidade!'}"</p>
                </div>
                <p className="text-gray-500 font-medium text-lg mb-8 max-w-xs mx-auto">Sua contribuição foi registrada. Verifique as instruções de pagamento no caixa.</p>
                <button onClick={() => setView('menu')} className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase">Voltar ao Cardápio</button>
            </div>
        ) : (
            <div className="relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><CheckCircle2 size={48} className="text-green-600" /></div>
                <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Pedido Enviado!</h2>
                <p className="text-gray-500 font-bold mb-8">Pague no caixa para liberar seu pedido.</p>
                <div className="bg-orange-100 border-4 border-dashed border-orange-200 rounded-3xl p-8 mb-10 transform -rotate-1 shadow-inner">
                    <span className="text-sm font-black text-orange-600 uppercase tracking-widest block mb-1">Sua Senha</span>
                    <span className="text-8xl font-black text-orange-600 tracking-tighter">#{lastOrderInfo?.number}</span>
                </div>
                <div className="space-y-4">
                    <button onClick={() => setView('orders')} className="w-full bg-orange-600 text-white font-black py-5 rounded-2xl text-xl shadow-xl shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-tight">Ver Meus Pedidos</button>
                    <button onClick={() => setView('menu')} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-sm">Novo Pedido</button>
                </div>
            </div>
        )}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
    </div>
  );

  const renderMyOrders = () => (
    <div className="h-full flex flex-col bg-slate-50">
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-xl text-gray-800 uppercase tracking-tight">Meus Pedidos</h2>
            <button onClick={loadMyOrders} className="p-2 text-orange-600"><RefreshCw size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400"><RefreshCw className="animate-spin mb-4" size={48} /><p className="font-bold">Buscando seus pedidos...</p></div>
            ) : myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center"><ChefHat size={64} className="mb-4 opacity-20" /><p className="font-bold">Nenhum pedido encontrado.</p><button onClick={() => setView('menu')} className="mt-4 text-orange-600 font-bold">Fazer meu primeiro pedido</button></div>
            ) : (
                myOrders.map(order => (
                    <div key={order.id} className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden transition-all ${order.kitchenStatus === 'done' ? 'border-green-200' : 'border-gray-100'}`}>
                        <div className="p-5 flex justify-between items-start">
                            <div>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg mb-2 inline-block ${order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{order.status === 'pending_payment' ? 'Aguardando Pagamento' : 'Pago / Na Cozinha'}</span>
                                <h3 className="text-4xl font-black text-gray-800 tracking-tighter">#{order.orderNumber}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-1">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-xl text-gray-800">{formatCurrency(order.total)}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{order.items.length} itens</p>
                            </div>
                        </div>
                        <div className="px-5 pb-5 pt-2 flex items-center gap-4 border-t border-gray-50">
                            {order.status === 'pending_payment' ? (
                                <div className="flex-1 flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-2xl"><Banknote size={24}/><div className="flex-1 text-xs font-bold leading-tight uppercase">Pague no caixa para liberar para a cozinha</div></div>
                            ) : order.kitchenStatus === 'pending' ? (
                                <div className="flex-1 flex items-center gap-3 text-orange-600 bg-orange-50 p-3 rounded-2xl"><ChefHat size={24} className="animate-bounce"/><div className="flex-1 text-xs font-bold leading-tight uppercase tracking-tight">Sendo preparado com carinho! Aguarde.</div></div>
                            ) : (
                                <div className="flex-1 flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-2xl"><PackageCheck size={24} className="animate-pulse"/><div className="flex-1 text-xs font-black leading-tight uppercase">Pedido Pronto! Pode retirar no balcão agora.</div></div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
        {renderReadyModal()}
        <div className="flex-1 overflow-hidden relative">
            {view === 'menu' && (
                <div className="h-full flex flex-col">
                    <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center p-2"><img src={settings.mascotUrl} alt="" className="w-full h-full object-contain" /></div>
                            <div>
                                <h1 className="font-black text-gray-800 leading-none tracking-tighter text-xl uppercase italic">TÔ FRITO!</h1>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{settings.schoolClass}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setView('orders')} className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 relative transition-all active:scale-95"><Clock size={24} />{myOrders.some(o => o.kitchenStatus === 'done' || o.status === 'pending_payment') && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}</button>
                             <button onClick={onExit} className="p-3 bg-gray-900 rounded-2xl text-white hover:bg-black transition-all active:scale-95"><ArrowLeft size={24} /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">{renderProductGrid()}</div>
                </div>
            )}
            {view === 'cart' && renderCart()}
            {view === 'success' && renderSuccess()}
            {view === 'orders' && renderMyOrders()}
        </div>
        {view === 'menu' && (
            <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sticky bottom-0 z-40">
                <div className="relative">
                    <button onClick={() => setView('cart')} className="p-5 bg-gray-900 rounded-2xl text-white shadow-xl shadow-gray-200 transform transition-transform active:scale-95"><ShoppingCart size={28} /></button>
                    {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-white animate-in zoom-in">{cartCount}</span>}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Carrinho atual</p>
                    <p className="font-black text-2xl text-gray-800">{formatCurrency(total)}</p>
                </div>
                <button onClick={() => setView('cart')} disabled={cart.length === 0} className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-tight text-sm">Ver Carrinho</button>
            </div>
        )}
    </div>
  );
};

export default CustomerOrder;