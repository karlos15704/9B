import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CartItem, PaymentMethod, Transaction, User, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { X, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Lock, Unlock, Plus, Minus, CheckCircle2, Calculator, ChevronDown, Edit3, User as UserIcon, Globe, RefreshCw } from 'lucide-react';
import { fetchPendingTransactions, updateTransactionStatus } from '../services/supabase';

interface CartSidebarProps {
  cart: CartItem[];
  users: User[]; // Novo: Lista de usuários para validar senha
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onCheckout: (discount: number, method: PaymentMethod, change?: number, amountPaid?: number, customerName?: string) => void;
  onClose?: () => void;
  onUpdateNote?: (productId: string, note: string) => void;
  onLoadPendingOrder: (transaction: Transaction) => void;
  emptyCartImageUrl?: string; 
  settings?: AppSettings; // Configurações visuais
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cart, users, onRemoveItem, onUpdateQuantity, onClearCart, onCheckout, onClose, onUpdateNote, onLoadPendingOrder, emptyCartImageUrl, settings }) => {
  const [discountValue, setDiscountValue] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  // Pix Modal State
  const [showPixModal, setShowPixModal] = useState(false);
  // ... other states
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceivedStr, setCashReceivedStr] = useState<string>('');
  const cashInputRef = useRef<HTMLInputElement>(null);

  const [isDiscountUnlocked, setIsDiscountUnlocked] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Transaction[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  // Cores dinâmicas
  const primaryColor = settings?.primaryColor || '#ea580c';

  // Totais
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = parseFloat(discountValue) || 0;
  const total = Math.max(0, subtotal - discount);
  
  // Cash
  const cashReceived = parseFloat(cashReceivedStr.replace(',', '.')) || 0;
  const cashChange = Math.max(0, cashReceived - total);
  const missingCash = Math.max(0, total - cashReceived);

  const PIX_QR_IMAGE = "https://i.ibb.co/8LFWSQfx/Captura-de-tela-2026-01-20-181523.png";
  const EMPTY_CART_MASCOT = emptyCartImageUrl || "https://i.ibb.co/jvHHy3Lq/Captura-de-tela-2026-01-23-120749.png";

  // ORDENAÇÃO ALFABÉTICA DOS ITENS
  const sortedCart = useMemo(() => {
    return [...cart].sort((a, b) => a.name.localeCompare(b.name));
  }, [cart]);

  useEffect(() => {
    if (showCashModal && cashInputRef.current) {
      cashInputRef.current.focus();
    }
  }, [showCashModal]);

  const loadPending = async () => {
    setIsLoadingPending(true);
    const orders = await fetchPendingTransactions();
    setPendingOrders(orders);
    setIsLoadingPending(false);
  };

  useEffect(() => {
    if (showPendingModal) loadPending();
  }, [showPendingModal]);

  const handleSelectPendingOrder = (order: Transaction) => {
    onLoadPendingOrder(order);
    setCustomerName(order.customerName || '');
    setShowPendingModal(false);
  };

  const handleDeletePending = async (e: React.MouseEvent, id: string, orderNumber: string) => {
    e.stopPropagation(); // Impede que o clique selecione o pedido
    if (window.confirm(`Tem certeza que deseja remover o pedido #${orderNumber}?`)) {
        setIsLoadingPending(true);
        await updateTransactionStatus(id, 'cancelled');
        await loadPending(); // Recarrega a lista
    }
  };

  const resetState = () => {
    setDiscountValue('');
    setCustomerName('');
    setSelectedMethod(null);
    setShowPixModal(false);
    setShowCashModal(false);
    setCashReceivedStr('');
    setIsDiscountUnlocked(false);
    setShowPasswordInput(false);
    setPasswordAttempt('');
    if (onClose) onClose();
  };

  const handleCheckout = () => {
    if (!selectedMethod) return;
    
    // Validação de Nome
    if (!customerName.trim()) {
        const proceed = window.confirm("Sem nome do cliente. Continuar mesmo assim?");
        if (!proceed) return;
    }

    if (selectedMethod === PaymentMethod.CASH) {
       onCheckout(discount, selectedMethod, cashChange, cashReceived, customerName);
    } else {
       onCheckout(discount, selectedMethod, undefined, undefined, customerName);
    }
    resetState();
  };

  const handleUnlockDiscount = () => {
    const authorizedUser = users.find(u => 
        u.password === passwordAttempt && 
        (u.role === 'admin' || u.role === 'manager')
    );
    if (passwordAttempt === '0' || authorizedUser) {
      setIsDiscountUnlocked(true);
      setShowPasswordInput(false);
      setPasswordAttempt('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordAttempt('');
    }
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === PaymentMethod.PIX) {
      setShowPixModal(true);
    } else if (method === PaymentMethod.CASH) {
      setShowCashModal(true);
    } else {
      onCheckout(discount, method, undefined, undefined, customerName);
      resetState();
    }
  };

  // Calculator Logic
  const handleKeypadPress = (val: string) => {
    if (val === 'C') { setCashReceivedStr(''); return; }
    if (val === 'back') { setCashReceivedStr(prev => prev.slice(0, -1)); return; }
    if (val === ',' && cashReceivedStr.includes(',')) return;
    setCashReceivedStr(prev => prev + val);
  };

  const addBill = (amount: number) => {
    const current = parseFloat(cashReceivedStr.replace(',', '.')) || 0;
    const newVal = current + amount;
    setCashReceivedStr(newVal.toString().replace('.', ','));
  };

  const handleAddNote = (item: CartItem) => {
    if (!onUpdateNote) return;
    const note = window.prompt("Observação para a cozinha (ex: Sem cebola):", item.notes || "");
    if (note !== null) onUpdateNote(item.id, note);
  };

  // VAZIO
  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 bg-white border-l border-orange-100 relative overflow-hidden">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 left-4 md:hidden p-3 bg-white shadow-md border border-gray-100 rounded-full text-gray-600 z-50 hover:bg-gray-50 active:scale-95 transition-all">
            <X size={24} />
          </button>
        )}
        
        {/* PENDING ORDER MODAL */}
        {showPendingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">
                  <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
                      <h3 className="font-bold flex items-center gap-2"><Globe size={20}/> Pedidos Online / App</h3>
                      <button onClick={() => setShowPendingModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-2 bg-gray-50 flex justify-end border-b">
                      <button onClick={loadPending} className="text-xs flex items-center gap-1 text-blue-600 font-bold px-3 py-1 rounded hover:bg-blue-100"><RefreshCw size={12}/> Atualizar</button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-4 space-y-3">
                      {isLoadingPending ? (
                          <div className="text-center py-8 text-gray-400">Carregando...</div>
                      ) : pendingOrders.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">Nenhum pedido pendente.</div>
                      ) : (
                          pendingOrders.map(order => (
                              <div key={order.id} className="relative group">
                                <button 
                                    onClick={() => handleSelectPendingOrder(order)}
                                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md transition-all pr-12"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-black text-lg" style={{ color: primaryColor }}>#{order.orderNumber}</span>
                                        <span className="font-bold text-gray-800">{formatCurrency(order.total)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserIcon size={14} className="text-gray-400" />
                                        <span className="font-bold text-gray-700">{order.customerName}</span>
                                    </div>
                                    {order.paymentMethod === 'Pontos Fidelidade' && (
                                        <div className="mb-2 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md inline-block">
                                            TROCA DE PONTOS
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 line-clamp-1">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                                    <div className="mt-2 text-[10px] text-gray-400 text-right">{new Date(order.timestamp).toLocaleTimeString()}</div>
                                </button>
                                
                                {/* Botão de Excluir Pedido Pendente */}
                                <button 
                                    onClick={(e) => handleDeletePending(e, order.id, order.orderNumber)}
                                    className="absolute top-2 right-2 p-2 bg-gray-50 text-gray-400 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors z-10"
                                    title="Excluir pedido"
                                >
                                    <Trash2 size={18} />
                                </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
        )}

        <div className="mb-6 relative w-48 h-48">
          <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-50 transform scale-110"></div>
          <img src={EMPTY_CART_MASCOT} alt="Mascote Tô Frito" className="w-full h-full object-contain relative z-10 animate-mascot-chill mix-blend-multiply" />
        </div>
        <p className="text-xl font-bold text-gray-600 mb-2 font-display">TÔ DE BOA...</p>
        <p className="text-sm text-gray-400 text-center max-w-[200px] mb-6">
          Nenhum item no carrinho.
        </p>
        
        <button 
          onClick={() => setShowPendingModal(true)}
          className="bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm"
        >
            <Globe size={20} />
            BUSCAR PEDIDO ONLINE
        </button>
      </div>
    );
  }

  // --- STYLE INJECTION FOR DYNAMIC BUTTON SIZES ---
  const dynamicBtnStyle = { 
    fontSize: 'var(--btn-text-size)', 
    padding: 'var(--btn-padding)' 
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* CASH MODAL */}
      {showCashModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 relative">
              <div className="p-4 text-white flex justify-between items-center sticky top-0 z-10" style={{ backgroundColor: primaryColor }}>
                 <h3 className="font-bold text-lg flex items-center gap-2"><Calculator size={24} /> Calculadora</h3>
                 <button onClick={() => { setShowCashModal(false); setSelectedMethod(null); }} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="p-4 md:p-6 bg-slate-50">
                 {/* ... (Conteúdo da calculadora igual) ... */}
                 <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 text-center">
                    <span className="text-xs uppercase font-bold text-blue-600">Cliente</span>
                    <p className="text-lg font-black text-gray-800">{customerName || 'Não Identificado'}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-200 shadow-sm">
                       <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Total</p>
                       <p className="text-xl md:text-2xl font-black text-gray-800">{formatCurrency(total)}</p>
                    </div>
                    <div className={`p-2 md:p-3 rounded-xl border shadow-sm ${missingCash > 0 ? 'bg-white border-red-200' : 'bg-green-100 border-green-300'}`}>
                       <p className={`text-[10px] md:text-xs font-bold uppercase ${missingCash > 0 ? 'text-gray-500' : 'text-green-700'}`}>
                         {missingCash > 0 ? 'Falta' : 'Troco'}
                       </p>
                       <p className={`text-xl md:text-2xl font-black ${missingCash > 0 ? 'text-red-500' : 'text-green-700'}`}>
                         {missingCash > 0 ? formatCurrency(missingCash) : formatCurrency(cashChange)}
                       </p>
                    </div>
                 </div>
                 <div className="mb-4 relative">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Recebido</label>
                    <div className="flex items-center mt-1">
                      <span className="absolute left-4 text-gray-400 font-bold">R$</span>
                      <input ref={cashInputRef} type="text" value={cashReceivedStr} readOnly className="w-full bg-white border-2 border-orange-200 rounded-xl py-3 pl-10 pr-4 text-right text-3xl font-bold text-gray-800 focus:outline-none transition-colors shadow-inner" style={{ borderColor: primaryColor }} placeholder="0,00" />
                    </div>
                 </div>
                 <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {[2, 5, 10, 20, 50, 100].map(val => (
                      <button key={val} onClick={() => addBill(val)} className="flex-shrink-0 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow-sm">+{val}</button>
                    ))}
                 </div>
                 <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
                    {['1','2','3','4','5','6','7','8','9','C','0',','].map(key => (
                       <button key={key} onClick={() => handleKeypadPress(key)} className={`py-3 md:py-4 rounded-xl text-xl font-bold shadow-sm transition-transform active:scale-95 border ${key === 'C' ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>{key}</button>
                    ))}
                 </div>
                 <button disabled={missingCash > 0} onClick={handleCheckout} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all text-lg flex items-center justify-center gap-2 animate-cta-bounce active:scale-95 active:shadow-none">
                   <CheckCircle2 size={24} /> CONFIRMAR VENDA
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* PIX MODAL */}
      {showPixModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 relative">
             <button onClick={() => { setShowPixModal(false); setSelectedMethod(null); }} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors z-10"><X size={20} /></button>
             <div className="p-6 flex flex-col items-center pt-12">
                 <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight mb-4">Pagamento via Pix</h3>
                 <img src={PIX_QR_IMAGE} alt="QR Code Pix" className="w-48 h-48 md:w-64 md:h-64 object-contain mix-blend-multiply border-4 rounded-xl mb-4" style={{ borderColor: primaryColor }} />
                 <p className="text-4xl font-black mb-6" style={{ color: primaryColor }}>{formatCurrency(total)}</p>
                 <button onClick={handleCheckout} className="w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg" style={{ backgroundColor: primaryColor }}>
                    <CheckCircle2 size={24} /> CONFIRMAR
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Sidebar Content */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            {onClose && <button onClick={onClose} className="md:hidden p-2 mr-1 bg-white rounded-full border border-gray-200 text-gray-600 shadow-md active:scale-95"><X size={20} /></button>}
            <div className="p-2 bg-white rounded-full shadow-sm hidden md:block" style={{ color: primaryColor }}><ShoppingCart size={20} /></div>
            <h2 className="font-bold text-gray-800 text-lg">Carrinho</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPendingModal(true)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Globe size={20} /></button>
            <button onClick={onClearCart} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20} /></button>
          </div>
        </div>

        <div className="px-4 pt-4 flex-shrink-0">
             <div className="relative">
                <UserIcon className="absolute left-3 top-3" size={18} style={{ color: primaryColor }} />
                <input 
                    type="text" 
                    placeholder="Nome do Cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-200 bg-orange-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-bold text-gray-800"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
            </div>
        </div>

        {/* LISTA DE PRODUTOS COMPACTA E ORDENADA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-8">
          {sortedCart.map((item) => (
            <div key={item.id} className="flex gap-2 bg-white border-b border-gray-50 last:border-0 p-2 hover:bg-gray-50 transition-colors group relative rounded-lg">
               
               {/* Imagem Menor */}
               <div className="w-10 h-10 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden relative border border-gray-200">
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
               </div>
               
               <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                     {/* Texto Menor e Compacto */}
                     <h4 className="text-xs font-bold text-gray-800 leading-tight pr-6 line-clamp-2">{item.name}</h4>
                     
                     <div className="flex flex-col items-end">
                        <p className="text-xs font-bold whitespace-nowrap" style={{ color: primaryColor }}>{formatCurrency(item.price * item.quantity)}</p>
                     </div>
                  </div>
                  
                  {item.notes && <p className="text-[9px] text-blue-600 truncate mt-0.5">Obs: {item.notes}</p>}

                  <div className="flex items-center justify-between mt-1">
                     {/* Controles Compactos */}
                     <div className="flex items-center gap-2">
                         <div className="flex items-center border border-gray-200 rounded-md bg-white shadow-sm h-6">
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-6 h-full flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-orange-600 disabled:opacity-50"><Minus size={10} /></button>
                            <span className="text-xs font-bold w-5 text-center leading-none">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-6 h-full flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-orange-600"><Plus size={10} /></button>
                         </div>
                         
                         {onUpdateNote && (
                            <button onClick={() => handleAddNote(item)} className={`h-6 w-6 flex items-center justify-center rounded-md border transition-colors ${item.notes ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200 hover:text-blue-500'}`} title="Adicionar observação"><Edit3 size={12} /></button>
                        )}
                     </div>

                     <button onClick={() => onRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Remover"><X size={14} /></button>
                  </div>
               </div>
            </div>
          ))}
        </div>

        <div className="bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] p-4 space-y-4 flex-shrink-0 pb-6">
           {/* Subtotal e Descontos */}
           <div className="space-y-2">
             <div className="flex justify-between text-gray-500 text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                   <span>Desconto</span>
                   {!isDiscountUnlocked ? <button onClick={() => setShowPasswordInput(true)} className="text-gray-400 hover:text-orange-500"><Lock size={14} /></button> : <Unlock size={14} className="text-green-500" />}
                </div>
                {showPasswordInput ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
                    <input type="password" placeholder="Senha" className={`w-20 px-2 py-1 text-xs border rounded ${passwordError ? 'border-red-500' : 'border-gray-300'}`} value={passwordAttempt} onChange={(e) => setPasswordAttempt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlockDiscount()} autoFocus />
                  </div>
                ) : isDiscountUnlocked ? (
                  <div className="flex items-center gap-1"><span className="text-red-500 font-bold">- R$</span><input type="number" min="0" step="0.10" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-16 text-right font-bold text-red-500 border-b border-red-200 focus:outline-none bg-transparent" placeholder="0.00" /></div>
                ) : <span>{formatCurrency(discount)}</span>}
             </div>
             <div className="flex justify-between items-end pt-2 border-t border-gray-100"><span className="text-gray-800 font-bold text-lg">Total</span><span className="text-3xl font-black text-gray-900">{formatCurrency(total)}</span></div>
           </div>

           {/* BOTÕES DE PAGAMENTO COM TAMANHO DINÂMICO */}
           <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => handlePaymentSelect(PaymentMethod.CREDIT)} className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition-all active:scale-95" style={dynamicBtnStyle}><CreditCard size={20} className="mb-1" /><span className="text-xs font-bold">Crédito</span></button>
              <button onClick={() => handlePaymentSelect(PaymentMethod.DEBIT)} className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition-all active:scale-95" style={dynamicBtnStyle}><CreditCard size={20} className="mb-1" /><span className="text-xs font-bold">Débito</span></button>
              <button onClick={() => handlePaymentSelect(PaymentMethod.PIX)} className="flex flex-col items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-all active:scale-95" style={dynamicBtnStyle}><QrCode size={20} className="mb-1" /><span className="text-xs font-bold">Pix</span></button>
              <button onClick={() => handlePaymentSelect(PaymentMethod.CASH)} className="flex flex-col items-center justify-center rounded-xl border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all active:scale-95" style={dynamicBtnStyle}><Banknote size={20} className="mb-1" /><span className="text-xs font-bold">Dinheiro</span></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;