import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, APP_NAME, MASCOT_URL, STAFF_USERS as DEFAULT_STAFF, SCHOOL_LOGO_URL, SCHOOL_CLASS } from './constants';
import { Product, CartItem, Transaction, PaymentMethod, User } from './types';
import { generateId, formatCurrency } from './utils';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import Reports from './components/Reports';
import KitchenDisplay from './components/KitchenDisplay';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import ProductManagement from './components/ProductManagement'; 
import PublicDisplay from './components/PublicDisplay'; 
import CustomerOrder from './components/CustomerOrder';
import { 
  supabase, 
  fetchTransactions, 
  createTransaction, 
  updateTransactionStatus, 
  updateKitchenStatus, 
  subscribeToTransactions,
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  confirmTransactionPayment,
  fetchProducts,
  createProduct,
  updateProduct as updateProductSupabase,
  deleteProduct as deleteProductSupabase
} from './services/supabase';
import { LayoutGrid, BarChart3, Flame, CheckCircle2, ChefHat, WifiOff, LogOut, UserCircle2, Users as UsersIcon, UploadCloud, ShoppingCart, Printer, PackageSearch } from 'lucide-react';

const App: React.FC = () => {
  // Login & Users State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Transition State
  const [transitionState, setTransitionState] = useState<'idle' | 'logging-in' | 'logging-out'>('idle');

  // View State
  const [currentView, setCurrentView] = useState<'pos' | 'reports' | 'kitchen' | 'users' | 'display' | 'products' | 'customer'>('pos');
  
  // Mobile UI States
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // PENDING ORDER STATE (For Cashier to edit/pay pending online orders)
  const [currentPendingOrderId, setCurrentPendingOrderId] = useState<string | null>(null);
  
  // PRODUCTS STATE (Sync with Supabase)
  const [products, setProducts] = useState<Product[]>([]);

  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Order Success Modal
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{transaction: Transaction} | null>(null);

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  // --- CARREGAMENTO DE DADOS BLINDADO ---
  const loadData = async () => {
    // 0. Check for Active Session
    const savedSession = localStorage.getItem('active_user');
    if (savedSession && !currentUser) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
      
      if (user.role === 'kitchen') {
        setCurrentView('kitchen');
      } else if (user.role === 'display') {
        setCurrentView('display');
      } else if (user.role === 'staff') {
        setCurrentView('pos');
      }
    }

    // --- CARREGAR PRODUTOS ---
    try {
        if (!supabase) {
             const saved = localStorage.getItem('app_products');
             if (saved) setProducts(JSON.parse(saved));
             else setProducts(MOCK_PRODUCTS);
        } else {
            const dbProducts = await fetchProducts();
            if (dbProducts !== null) {
                // Se a tabela estiver vazia, podemos opcionalmente semear com dados mock (apenas uma vez)
                // Para simplificar: se o banco retornar vazio, mas estivermos conectados, usamos vazio ou semeamos
                if (dbProducts.length === 0 && !localStorage.getItem('db_seeded')) {
                    // Semeia o banco com produtos padrão se estiver vazio na primeira vez
                     MOCK_PRODUCTS.forEach(p => createProduct(p));
                     localStorage.setItem('db_seeded', 'true');
                     setProducts(MOCK_PRODUCTS);
                } else {
                    // Usa dados do banco
                    setProducts(dbProducts);
                    localStorage.setItem('app_products', JSON.stringify(dbProducts));
                    if (dbProducts.length > 0) localStorage.setItem('db_seeded', 'true');
                }
            } else {
                 // Erro no banco, fallback local
                 const saved = localStorage.getItem('app_products');
                 if (saved) setProducts(JSON.parse(saved));
                 else setProducts(MOCK_PRODUCTS);
            }
        }
    } catch(e) {
        console.error("Erro carregando produtos", e);
        // Fallback
        setProducts(MOCK_PRODUCTS);
    }

    // --- CARREGAR USUÁRIOS ---
    try {
      const dbUsers = await fetchUsers();
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
        localStorage.setItem('app_users', JSON.stringify(dbUsers));
      } else if (dbUsers && dbUsers.length === 0) {
        setUsers(DEFAULT_STAFF);
        DEFAULT_STAFF.forEach(u => createUser(u));
      } else {
        const savedUsers = localStorage.getItem('app_users');
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        } else {
          setUsers(DEFAULT_STAFF);
        }
      }
    } catch (e) {
      setUsers(DEFAULT_STAFF);
    }

    // --- CARREGAR VENDAS ---
    if (!supabase) {
      setIsConnected(false);
      setIsLoading(false);
      const saved = localStorage.getItem('pos_transactions');
      if (saved) setTransactions(JSON.parse(saved));
      return;
    }

    try {
      const data = await fetchTransactions();
      
      if (data === null) {
        setIsConnected(false);
        const saved = localStorage.getItem('pos_transactions');
        if (saved) {
           const local = JSON.parse(saved);
           setTransactions(prev => prev.length > local.length ? prev : local);
        }
      } else {
        setIsConnected(true);
        const localDataString = localStorage.getItem('pos_transactions');
        const localData: Transaction[] = localDataString ? JSON.parse(localDataString) : [];

        if (data.length === 0 && localData.length > 0) {
           setTransactions(localData);
           setIsSyncing(true);
           Promise.all(localData.map(t => createTransaction(t)))
             .then(() => setIsSyncing(false))
             .catch(() => setIsSyncing(false));
        } else {
           setTransactions(data);
           localStorage.setItem('pos_transactions', JSON.stringify(data));
        }
        
        const currentData = data.length > 0 ? data : localData;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        // Filtrar apenas pedidos completados ou pendentes (para nao gerar numero repetido)
        const todaysOrders = currentData.filter(t => t.timestamp >= startOfDay.getTime());
        const maxOrder = todaysOrders.length > 0 
          ? Math.max(...todaysOrders.map(t => parseInt(t.orderNumber) || 0))
          : 0;
        setNextOrderNumber(maxOrder + 1);
      }
    } catch (error) {
      console.error("Erro fatal no loadData:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const subscription = subscribeToTransactions(() => loadData());
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (currentView === 'users') return; // Removido 'products' da exceção para atualizar listagem se alguém editar
    const intervalId = setInterval(() => loadData(), 2000); 
    return () => clearInterval(intervalId);
  }, [currentView]);

  // --- PRODUCT MANAGEMENT ACTIONS ---
  const handleAddProduct = async (newProduct: Product) => {
    const updated = [...products, newProduct];
    setProducts(updated);
    localStorage.setItem('app_products', JSON.stringify(updated));
    if (isConnected) await createProduct(newProduct);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    localStorage.setItem('app_products', JSON.stringify(updated));
    if (isConnected) await updateProductSupabase(updatedProduct);
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('app_products', JSON.stringify(updated));
    if (isConnected) await deleteProductSupabase(id);
  };

  const handleBurn = () => {
    if (isBurning) return;
    setIsBurning(true);
    setTimeout(() => setIsBurning(false), 3000);
  };

  const handleLogin = (user: User) => {
    setTransitionState('logging-in');
    setTimeout(() => {
      setCurrentUser(user);
      localStorage.setItem('active_user', JSON.stringify(user));
      
      if (user.role === 'kitchen') setCurrentView('kitchen');
      else if (user.role === 'display') setCurrentView('display');
      else setCurrentView('pos');

      setTimeout(() => setTransitionState('idle'), 1000);
    }, 100); 
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    setTransitionState('logging-out');
    setTimeout(() => {
      setCurrentUser(null);
      setCart([]);
      setCurrentView('pos');
      setCurrentPendingOrderId(null);
      localStorage.removeItem('active_user');
      setTimeout(() => setTransitionState('idle'), 500);
    }, 1200);
  };

  const handleAddUser = async (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    if (isConnected) await createUser(newUser);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('active_user', JSON.stringify(updatedUser));
    }
    if (isConnected) await updateUser(updatedUser);
  };

  const handleDeleteUser = async (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    if (isConnected) await deleteUser(userId);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const updateCartNote = (productId: string, note: string) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, notes: note } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCurrentPendingOrderId(null); // Limpa o ID pendente ao limpar o carrinho
  };

  // Carregar um pedido pendente no caixa
  const handleLoadPendingOrder = (transaction: Transaction) => {
    setCart(transaction.items);
    setCurrentPendingOrderId(transaction.id);
    setIsMobileCartOpen(true); // Abre o carrinho mobile se estiver lá
  };

  const handleCheckout = async (discount: number, method: PaymentMethod, change?: number, amountPaid?: number, customerName?: string) => {
    try {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const total = Math.max(0, subtotal - discount);
      
      let transactionToSave: Transaction;

      // Se estamos finalizando um pedido pendente (App/Online)
      if (currentPendingOrderId) {
         // Encontrar o pedido original para manter o número e ID
         const original = transactions.find(t => t.id === currentPendingOrderId) || { orderNumber: (nextOrderNumber || 1).toString(), timestamp: Date.now() };

         transactionToSave = {
            id: currentPendingOrderId,
            orderNumber: original.orderNumber || (nextOrderNumber || 1).toString(),
            customerName: customerName || '',
            timestamp: original.timestamp, // Mantém a hora original do pedido ou atualiza? Geralmente mantém.
            items: [...cart],
            subtotal,
            discount,
            total,
            paymentMethod: method,
            amountPaid,
            change,
            sellerName: currentUser?.name || 'Caixa',
            status: 'completed',
            kitchenStatus: 'pending'
         };

         if (isConnected) {
            await confirmTransactionPayment(transactionToSave);
         }
         
         // Atualiza o estado local removendo o pendente antigo e adicionando o completado
         setTransactions(prev => [...prev.filter(t => t.id !== currentPendingOrderId), transactionToSave]);

      } else {
         // Nova venda balcão
         const safeOrderNumber = (nextOrderNumber || 1).toString();
         const id = generateId();
   
         transactionToSave = {
           id,
           orderNumber: safeOrderNumber,
           customerName: customerName || '',
           timestamp: Date.now(),
           items: [...cart],
           subtotal,
           discount,
           total,
           paymentMethod: method,
           amountPaid,
           change,
           sellerName: currentUser?.name || 'Caixa',
           status: 'completed',
           kitchenStatus: 'pending'
         };
   
         const updatedTransactions = [...transactions, transactionToSave];
         setTransactions(updatedTransactions);
         localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));
         
         if (isConnected) {
           const success = await createTransaction(transactionToSave);
           if (!success) setIsConnected(false); 
         }
         
         setNextOrderNumber(prev => (prev || 1) + 1);
      }

      setLastCompletedOrder({ transaction: transactionToSave });
      clearCart(); // Reseta carrinho e ID pendente
      setIsMobileCartOpen(false);

    } catch (error) {
      console.error("Erro crítico no checkout:", error);
      alert("Erro ao processar venda. Tente novamente.");
    }
  };

  const handleCancelTransaction = async (transactionId: string) => {
    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'cancelled' as const } : t));
    if (isConnected) await updateTransactionStatus(transactionId, 'cancelled');
  };

  const handleUpdateKitchenStatus = async (transactionId: string, status: 'pending' | 'done') => {
    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, kitchenStatus: status } : t));
    if (isConnected) await updateKitchenStatus(transactionId, status);
  };

  const handleResetSystem = async () => {
    setTransactions([]);
    setNextOrderNumber(1);
    localStorage.removeItem('pos_transactions');
    alert("Para limpar o banco de dados online, utilize o painel do Supabase.");
  };

  // --- PRINT RECEIPT FUNCTION ---
  const printReceipt = (t: Transaction) => {
      const printWindow = window.open('', '', 'width=300,height=600');
      if (!printWindow) return;

      const dateStr = new Date(t.timestamp).toLocaleDateString('pt-BR');
      const timeStr = new Date(t.timestamp).toLocaleTimeString('pt-BR');

      const itemsHtml = t.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
           <span>${item.quantity}x ${item.name}</span>
           <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
        ${item.notes ? `<div style="font-size: 10px; font-style: italic; margin-top: -3px; margin-bottom: 5px;">Obs: ${item.notes}</div>` : ''}
      `).join('');

      const html = `
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; margin: 0; width: 80mm; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .large { font-size: 16px; }
                .huge { font-size: 32px; font-weight: black; }
            </style>
        </head>
        <body>
            <div class="center bold large">${APP_NAME}</div>
            <div class="center">Feira Cultural - ${SCHOOL_CLASS}</div>
            <div class="center">${dateStr} - ${timeStr}</div>
            <div class="divider"></div>
            
            <div class="center bold huge">SENHA: #${t.orderNumber}</div>
            ${t.customerName ? `<div class="center bold" style="margin-top: 5px; font-size: 14px;">CLIENTE: ${t.customerName}</div>` : ''}
            
            <div class="divider"></div>
            ${itemsHtml}
            <div class="divider"></div>
            
            <div style="display: flex; justify-content: space-between;">
                <span>Total</span>
                <span class="bold">${formatCurrency(t.total)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Pagamento</span>
                <span>${t.paymentMethod}</span>
            </div>
            ${t.change ? `
            <div style="display: flex; justify-content: space-between;">
                <span>Troco</span>
                <span>${formatCurrency(t.change)}</span>
            </div>` : ''}
            
            <div class="divider"></div>
            <div class="center">Obrigado pela preferência!</div>
            <div class="center">Bom apetite!</div>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
        <p className="text-gray-600 font-bold animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  // --- MODO CLIENTE (AUTOATENDIMENTO) ---
  if (currentView === 'customer') {
      return (
          <CustomerOrder 
            products={products} 
            onExit={() => setCurrentView('pos')} // Volta pra tela de login tecnicamente (porem login reseta o state)
            nextOrderNumber={nextOrderNumber}
          />
      );
  }

  if (currentUser?.role === 'display') {
    return (
      <div className="relative">
         <button onClick={() => setShowLogoutModal(true)} className="fixed bottom-4 right-4 z-50 p-2 text-white/10 hover:text-white/50 transition-colors"><LogOut size={24} /></button>
         <PublicDisplay transactions={transactions} />
         {showLogoutModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><LogOut className="text-red-500" size={24} /> Sair do Modo Telão?</h3>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 text-gray-400 hover:bg-gray-800 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">SAIR</button>
                </div>
              </div>
            </div>
         )}
      </div>
    );
  }

  return (
    <div className={`h-screen w-full flex flex-col md:flex-row overflow-hidden bg-orange-50 relative ${transitionState === 'logging-out' ? 'animate-shake-screen' : ''}`}>
      
      {(transitionState === 'logging-out' || transitionState === 'logging-in') && (
        <div className={`fire-curtain ${transitionState === 'logging-out' ? 'animate-curtain-rise' : 'animate-curtain-split'}`}>
           <div className="absolute inset-0 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300"></div>
           <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="text-center animate-spin-in">
                  <Flame size={80} className="text-yellow-100 mx-auto drop-shadow-lg mb-2" />
                  <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">TÔ FRITO!</h1>
                </div>
           </div>
        </div>
      )}

      {!currentUser ? (
        <LoginScreen 
            availableUsers={users} 
            onLogin={handleLogin} 
            onCustomerStart={() => {
                setTransitionState('logging-in');
                setTimeout(() => {
                    setCurrentView('customer');
                    setTransitionState('idle');
                }, 800);
            }} 
        />
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full z-50 flex justify-center pointer-events-none">
            {!isConnected && <div className="bg-red-600 text-white text-xs py-1 px-4 rounded-b-lg shadow-md flex items-center gap-2 pointer-events-auto"><WifiOff size={14} /><span>OFFLINE</span></div>}
            {isConnected && isSyncing && <div className="bg-blue-600 text-white text-xs py-1 px-4 rounded-b-lg shadow-md flex items-center gap-2 pointer-events-auto animate-pulse"><UploadCloud size={14} /><span>Sincronizando...</span></div>}
          </div>

          {showLogoutModal && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><LogOut className="text-red-500" size={24} /> Sair do Sistema?</h3>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">SAIR</button>
                </div>
              </div>
            </div>
          )}

          {lastCompletedOrder && currentUser.role !== 'kitchen' && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200 relative">
                <button 
                    onClick={() => printReceipt(lastCompletedOrder.transaction)}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    title="Imprimir Recibo"
                >
                    <Printer size={20} className="text-gray-600" />
                </button>

                <div className="mb-6 flex justify-center">
                  <div className="bg-green-100 p-4 rounded-full"><CheckCircle2 size={48} className="text-green-600" /></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido Confirmado!</h2>
                
                {lastCompletedOrder.transaction.customerName && (
                    <div className="mb-4 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold inline-block border border-blue-100">
                        Cliente: {lastCompletedOrder.transaction.customerName}
                    </div>
                )}

                <div className="bg-orange-100 border-2 border-orange-200 border-dashed rounded-xl p-6 mb-8">
                  <span className="text-sm text-orange-600 font-bold uppercase tracking-wider block mb-1">SENHA</span>
                  <span className="text-6xl font-black text-orange-600 tracking-tighter">{lastCompletedOrder.transaction.orderNumber}</span>
                </div>

                {lastCompletedOrder.transaction.change !== undefined && lastCompletedOrder.transaction.change > 0 && (
                  <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl">
                    <span className="text-xs text-green-700 font-bold uppercase block">Troco a Devolver</span>
                    <span className="text-3xl font-black text-green-700">{formatCurrency(lastCompletedOrder.transaction.change)}</span>
                  </div>
                )}

                <div className="flex gap-2">
                    <button onClick={() => printReceipt(lastCompletedOrder.transaction)} className="flex-1 bg-gray-200 text-gray-800 font-bold py-4 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                        <Printer size={20} /> Imprimir
                    </button>
                    <button onClick={() => setLastCompletedOrder(null)} className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors duration-300 animate-cta-bounce active:scale-95 active:animate-none">
                        Nova Venda
                    </button>
                </div>
              </div>
            </div>
          )}

          <nav className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-4 gap-6 z-30 shadow-xl border-r border-gray-800 pt-6">
            <div className="mb-2 p-2 bg-orange-900/30 rounded-full"><Flame className="text-orange-500 animate-pulse" size={24} /></div>
            
            {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
              <button onClick={() => setCurrentView('pos')} className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'pos' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`} title="Caixa">
                <LayoutGrid size={24} />
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'kitchen') && (
              <button onClick={() => setCurrentView('kitchen')} className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'kitchen' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`} title="Cozinha">
                <ChefHat size={24} />
              </button>
            )}

            {/* CARDÁPIO (Professor / Admin) */}
            {(currentUser.id === '0' || currentUser.role === 'admin') && (
              <button onClick={() => setCurrentView('products')} className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'products' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`} title="Cardápio">
                <PackageSearch size={24} />
              </button>
            )}

            {/* RELATÓRIOS (Professor / Admin) */}
            {(currentUser.id === '0' || currentUser.role === 'admin') && (
              <button onClick={() => setCurrentView('reports')} className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'reports' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`} title="Relatórios">
                <BarChart3 size={24} />
              </button>
            )}

            <button onClick={() => setCurrentView('users')} className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'users' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`} title="Equipe">
              <UsersIcon size={24} />
            </button>

            <div className="flex-1"></div>
            <button onClick={handleBurn} className={`relative flex flex-col items-center gap-1 transition-all cursor-pointer mb-4 select-none group ${isBurning ? 'scale-110' : 'opacity-80 hover:opacity-100'}`}>
              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center p-2 border shadow-inner transition-colors duration-200 z-10 ${isBurning ? 'bg-orange-900 border-orange-500 shadow-orange-500/50' : 'bg-white/10 border-white/10'}`}>
                <img src={SCHOOL_LOGO_URL} alt="Escola" className="w-full h-full object-contain relative z-20" />
                {isBurning && <div className="fire-container"><div className="flame-base"></div><div className="flame-body"></div><div className="flame-core"></div></div>}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors z-10 relative ${isBurning ? 'text-fire scale-110' : 'text-gray-500'}`}>{SCHOOL_CLASS}</span>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="p-3 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 mb-4 hover:scale-110 active:scale-95"><LogOut size={24} /></button>
          </nav>

          <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
            <div className="md:absolute md:top-4 md:right-6 z-40 bg-white/90 backdrop-blur border-b md:border border-orange-200 px-4 py-3 md:py-1.5 md:rounded-full shadow-sm flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                  <UserCircle2 size={16} className="text-orange-600"/>
                  <span className="text-xs font-bold text-gray-700 uppercase">{currentUser.name}</span>
                  {currentUser.role === 'kitchen' && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold">COZINHA</span>}
              </div>
              <button onClick={() => setShowLogoutModal(true)} className="md:hidden text-gray-400"><LogOut size={18} /></button>
            </div>

            {currentView === 'pos' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                <div className="flex-1 flex flex-col min-w-0">
                  <header className="px-6 py-2 md:py-4 bg-white border-b border-orange-100 shadow-sm z-10 relative flex items-center justify-center min-h-[70px] md:min-h-[90px]">
                    <div className="flex items-center gap-3 md:gap-5 transition-transform hover:scale-105 duration-300">
                      <img src={MASCOT_URL} className="w-12 h-12 md:w-20 md:h-20 object-contain mix-blend-multiply animate-mascot-slow drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]" alt="Mascote" />
                      <h1 className="text-3xl md:text-5xl font-black text-fire uppercase tracking-tighter transform -skew-x-6 drop-shadow-sm" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>{APP_NAME}</h1>
                    </div>
                  </header>
                  <div className="flex-1 overflow-hidden relative">
                    <ProductGrid products={products} cart={cart} onAddToCart={addToCart} onRemoveFromCart={removeFromCart}/>
                  </div>
                </div>
                <div className={`fixed inset-y-0 right-0 z-50 w-full md:relative md:w-96 transform transition-transform duration-300 ease-in-out md:transform-none shadow-2xl md:shadow-none ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <CartSidebar 
                    cart={cart} 
                    onRemoveItem={removeFromCart} 
                    onUpdateQuantity={updateCartQuantity} 
                    onUpdateNote={updateCartNote} 
                    onClearCart={clearCart} 
                    onCheckout={handleCheckout} 
                    onClose={() => setIsMobileCartOpen(false)}
                    onLoadPendingOrder={handleLoadPendingOrder}
                  />
                </div>
              </div>
            )}

            {currentView === 'reports' && <Reports transactions={transactions} onCancelTransaction={handleCancelTransaction} onResetSystem={handleResetSystem}/>}
            {currentView === 'kitchen' && <KitchenDisplay transactions={transactions} onUpdateStatus={handleUpdateKitchenStatus} />}
            {currentView === 'users' && <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} currentUser={currentUser}/>}
            {currentView === 'products' && <ProductManagement products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct}/>}

            {currentView === 'pos' && !isMobileCartOpen && (
              <button onClick={() => setIsMobileCartOpen(true)} className="md:hidden fixed bottom-20 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg shadow-orange-600/40 z-50 animate-bounce">
                <div className="relative"><ShoppingCart size={24} />{cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-orange-100">{cartItemCount}</span>}</div>
              </button>
            )}

            {/* --- MOBILE BOTTOM NAVIGATION (ATUALIZADO) --- */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-orange-100 z-40 flex justify-between items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-pb px-1">
              {/* 1. VENDAS (POS) */}
              {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                <button onClick={() => setCurrentView('pos')} className={`flex-1 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'pos' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                  <LayoutGrid size={20} className={currentView === 'pos' ? 'fill-current' : ''} />
                  <span className="text-[9px] font-bold uppercase leading-none">Vendas</span>
                </button>
              )}

              {/* 2. COZINHA */}
              {(currentUser.role === 'admin' || currentUser.role === 'kitchen') && (
                <button onClick={() => setCurrentView('kitchen')} className={`flex-1 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'kitchen' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                  <ChefHat size={20} className={currentView === 'kitchen' ? 'fill-current' : ''} />
                  <span className="text-[9px] font-bold uppercase leading-none">Cozinha</span>
                </button>
              )}

              {/* 3. CARDÁPIO (Professor / Admin) */}
              {(currentUser.id === '0' || currentUser.role === 'admin') && (
                  <button onClick={() => setCurrentView('products')} className={`flex-1 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'products' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                    <PackageSearch size={20} />
                    <span className="text-[9px] font-bold uppercase leading-none">Cardápio</span>
                  </button>
              )}

              {/* 4. GESTÃO (Professor / Admin) */}
              {(currentUser.id === '0' || currentUser.role === 'admin') && (
                  <button onClick={() => setCurrentView('reports')} className={`flex-1 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'reports' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                    <BarChart3 size={20} />
                    <span className="text-[9px] font-bold uppercase leading-none">Gestão</span>
                  </button>
              )}

              {/* 5. EQUIPE (Disponível para todos, ou pelo menos Admin/Staff) */}
              <button onClick={() => setCurrentView('users')} className={`flex-1 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'users' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                <UsersIcon size={20} />
                <span className="text-[9px] font-bold uppercase leading-none">Equipe</span>
              </button>
            </div>

          </main>
        </>
      )}
    </div>
  );
};

export default App;