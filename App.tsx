import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, APP_NAME as DEFAULT_APP_NAME, MASCOT_URL as DEFAULT_MASCOT, STAFF_USERS as DEFAULT_STAFF, SCHOOL_LOGO_URL as DEFAULT_LOGO, SCHOOL_CLASS as DEFAULT_CLASS } from './constants';
import { Product, CartItem, Transaction, PaymentMethod, User, AppSettings, AppModules } from './types';
import { generateId, formatCurrency } from './utils';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import Reports from './components/Reports';
import KitchenDisplay from './components/KitchenDisplay';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import ProductManagement from './components/ProductManagement';
import SettingsManagement from './components/SettingsManagement';
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
  deleteProduct as deleteProductSupabase,
  resetDatabase,
  fetchSettings,
  saveSettings
} from './services/supabase';
import { LayoutGrid, BarChart3, Flame, CheckCircle2, ChefHat, WifiOff, LogOut, UserCircle2, Users as UsersIcon, UploadCloud, ShoppingCart, Printer, PackageSearch, Settings } from 'lucide-react';

const App: React.FC = () => {
  // Login & Users State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Default Modules Configuration
  const defaultModules: AppModules = {
    pos: true,
    kitchen: true,
    products: true,
    reports: true,
    users: true,
    customer: true
  };

  // Settings State (Global App Config)
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: DEFAULT_APP_NAME,
    schoolClass: DEFAULT_CLASS,
    mascotUrl: DEFAULT_MASCOT,
    schoolLogoUrl: DEFAULT_LOGO,
    emptyCartImageUrl: "https://i.ibb.co/jvHHy3Lq/Captura-de-tela-2026-01-23-120749.png",
    primaryColor: '#ea580c', // Default Orange
    buttonSize: 'medium',
    modules: defaultModules
  });

  // Transition State
  const [transitionState, setTransitionState] = useState<'idle' | 'logging-in' | 'logging-out'>('idle');

  // View State
  const [currentView, setCurrentView] = useState<'pos' | 'reports' | 'kitchen' | 'users' | 'display' | 'products' | 'settings' | 'customer'>('pos');
  
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

  // --- APLICAR TEMA DINÂMICO ---
  // Injeta variáveis CSS na raiz para que todo o app obedeça à cor escolhida
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', appSettings.primaryColor || '#ea580c');
    
    // Define escala baseada no tamanho do botão
    let scale = '1rem';
    let padding = '0.75rem 1rem';
    
    if (appSettings.buttonSize === 'small') { scale = '0.875rem'; padding = '0.5rem 0.75rem'; }
    if (appSettings.buttonSize === 'large') { scale = '1.125rem'; padding = '1rem 1.5rem'; }
    if (appSettings.buttonSize === 'xl') { scale = '1.25rem'; padding = '1.25rem 2rem'; }

    root.style.setProperty('--btn-text-size', scale);
    root.style.setProperty('--btn-padding', padding);
  }, [appSettings]);


  // --- CARREGAMENTO DE DADOS BLINDADO ---
  const loadData = async () => {
    // --- CARREGAR CONFIGURAÇÕES GERAIS PRIMEIRO ---
    try {
        const remoteSettings = await fetchSettings();
        if (remoteSettings) {
            // Merge cuidadoso para garantir que 'modules' exista
            setAppSettings(prev => ({ 
                ...prev, 
                ...remoteSettings,
                modules: remoteSettings.modules || defaultModules // Fallback se modules for null no banco antigo
            }));
            localStorage.setItem('app_settings', JSON.stringify(remoteSettings));
        } else {
            const localSettings = localStorage.getItem('app_settings');
            if (localSettings) {
                const parsed = JSON.parse(localSettings);
                setAppSettings(prev => ({ ...prev, ...parsed, modules: parsed.modules || defaultModules }));
            }
        }
    } catch (e) { console.error("Erro loading settings", e); }

    // Check for Active Session only once on load
    if (!currentUser) {
        const savedSession = localStorage.getItem('active_user');
        if (savedSession) {
            const user = JSON.parse(savedSession);
            setCurrentUser(user);
            // Redirecionamento inicial baseado em Role, mas respeitando views
            if (user.role === 'kitchen') setCurrentView('kitchen');
            else if (user.role === 'display') setCurrentView('display');
            else setCurrentView('pos');
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
                if (dbProducts.length === 0 && !localStorage.getItem('db_seeded')) {
                     MOCK_PRODUCTS.forEach(p => createProduct(p));
                     localStorage.setItem('db_seeded', 'true');
                     setProducts(MOCK_PRODUCTS);
                } else {
                    setProducts(dbProducts);
                    localStorage.setItem('app_products', JSON.stringify(dbProducts));
                    if (dbProducts.length > 0) localStorage.setItem('db_seeded', 'true');
                }
            } else {
                 const saved = localStorage.getItem('app_products');
                 if (saved) setProducts(JSON.parse(saved));
                 else setProducts(MOCK_PRODUCTS);
            }
        }
    } catch(e) {
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
    // Importante: subscribeToTransactions agora vai chamar loadData quando a tabela settings mudar
    const subscription = subscribeToTransactions(() => loadData());
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (currentView === 'users' || currentView === 'settings') return; 
    const intervalId = setInterval(() => loadData(), 2000); 
    return () => clearInterval(intervalId);
  }, [currentView]);

  // --- ACTIONS ---

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
    // Salva no Supabase para sincronizar com todos
    if (isConnected) await saveSettings(newSettings);
  };

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
    setCurrentPendingOrderId(null);
  };

  const handleLoadPendingOrder = (transaction: Transaction) => {
    setCart(transaction.items);
    setCurrentPendingOrderId(transaction.id);
    setIsMobileCartOpen(true);
  };

  const handleCheckout = async (discount: number, method: PaymentMethod, change?: number, amountPaid?: number, customerName?: string) => {
    try {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const total = Math.max(0, subtotal - discount);
      
      let transactionToSave: Transaction;

      if (currentPendingOrderId) {
         const original = transactions.find(t => t.id === currentPendingOrderId) || { orderNumber: (nextOrderNumber || 1).toString(), timestamp: Date.now() };

         transactionToSave = {
            id: currentPendingOrderId,
            orderNumber: original.orderNumber || (nextOrderNumber || 1).toString(),
            customerName: customerName || '',
            timestamp: original.timestamp,
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

         if (isConnected) await confirmTransactionPayment(transactionToSave);
         setTransactions(prev => [...prev.filter(t => t.id !== currentPendingOrderId), transactionToSave]);

      } else {
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
      clearCart();
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
    if (currentUser?.id !== '0') {
        alert("Ação não autorizada.");
        return;
    }

    if (isConnected) {
        const success = await resetDatabase();
        if (success) {
            alert("Banco de dados reiniciado com sucesso.");
            window.location.reload(); 
        } else {
            alert("Erro ao limpar banco de dados.");
        }
    } else {
        localStorage.removeItem('pos_transactions');
        setTransactions([]);
        setNextOrderNumber(1);
        alert("Dados locais limpos.");
    }
  };

  const printReceipt = (t: Transaction) => {
      const printWindow = window.open('', '', 'width=300,height=600');
      if (!printWindow) return;
      // ... (Print Logic permanece igual)
      // ...
      printWindow.print();
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 mb-4" style={{ borderColor: appSettings.primaryColor }}></div>
        <p className="text-gray-600 font-bold animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  // --- MODO CLIENTE (AUTOATENDIMENTO) ---
  if (currentView === 'customer') {
      return (
          <CustomerOrder 
            products={products} 
            onExit={() => setCurrentView('pos')} 
            nextOrderNumber={nextOrderNumber}
            settings={appSettings} 
          />
      );
  }

  if (currentUser?.role === 'display') {
    return (
      <div className="relative">
         <button onClick={() => setShowLogoutModal(true)} className="fixed bottom-4 right-4 z-50 p-2 text-white/10 hover:text-white/50 transition-colors"><LogOut size={24} /></button>
         <PublicDisplay transactions={transactions} settings={appSettings} />
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

  // DEFINIÇÃO DA BARRA DE NAVEGAÇÃO DINÂMICA
  const navItems = [
    { view: 'pos', icon: LayoutGrid, roles: ['admin', 'manager', 'staff'], title: 'Caixa', enabled: appSettings.modules?.pos ?? true },
    { view: 'kitchen', icon: ChefHat, roles: ['admin', 'manager', 'kitchen'], title: 'Cozinha', enabled: appSettings.modules?.kitchen ?? true },
    { view: 'products', icon: PackageSearch, roles: ['0', 'admin'], title: 'Cardápio', enabled: appSettings.modules?.products ?? true },
    { view: 'reports', icon: BarChart3, roles: ['0', 'admin'], title: 'Relatórios', enabled: appSettings.modules?.reports ?? true },
    { view: 'users', icon: UsersIcon, roles: ['0', 'admin', 'manager'], title: 'Equipe', enabled: appSettings.modules?.users ?? true },
    { view: 'settings', icon: Settings, roles: ['0', 'admin'], title: 'Configurações', enabled: true }, // Config sempre ativa para Admin
  ];

  return (
    <div className={`h-screen w-full flex flex-col md:flex-row overflow-hidden bg-orange-50 relative ${transitionState === 'logging-out' ? 'animate-shake-screen' : ''}`}>
      
      {(transitionState === 'logging-out' || transitionState === 'logging-in') && (
        <div className={`fire-curtain ${transitionState === 'logging-out' ? 'animate-curtain-rise' : 'animate-curtain-split'}`}>
           <div className="absolute inset-0 bg-gradient-to-t from-red-600 via-[var(--primary-color)] to-yellow-300"></div>
           <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="text-center animate-spin-in">
                  <Flame size={80} className="text-yellow-100 mx-auto drop-shadow-lg mb-2" />
                  <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">{appSettings.appName}</h1>
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
            settings={appSettings} 
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
                 <div className="bg-orange-100 border-2 border-dashed rounded-xl p-6 mb-8" style={{ borderColor: appSettings.primaryColor }}>
                  <span className="text-sm font-bold uppercase tracking-wider block mb-1" style={{ color: appSettings.primaryColor }}>SENHA</span>
                  <span className="text-6xl font-black tracking-tighter" style={{ color: appSettings.primaryColor }}>{lastCompletedOrder.transaction.orderNumber}</span>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => setLastCompletedOrder(null)} className="flex-1 text-white font-bold py-4 rounded-xl transition-colors duration-300 animate-cta-bounce active:scale-95 active:animate-none" style={{ backgroundColor: appSettings.primaryColor }}>
                        Nova Venda
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN NAV (DESKTOP) */}
          <nav className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-4 gap-6 z-30 shadow-xl border-r border-gray-800 pt-6">
            <div className="mb-2 p-2 rounded-full" style={{ backgroundColor: `${appSettings.primaryColor}30` }}><Flame style={{ color: appSettings.primaryColor }} className="animate-pulse" size={24} /></div>
            
            {navItems.map(item => {
                // Check Role Visibility AND Module Status
                if (!item.enabled) return null;
                if (!item.roles.includes(currentUser.id) && !item.roles.includes(currentUser.role)) return null;
                
                const isActive = currentView === item.view;
                return (
                    <button 
                        key={item.view}
                        onClick={() => setCurrentView(item.view as any)} 
                        className={`p-3 rounded-2xl transition-all duration-300 group relative ${isActive ? 'text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`} 
                        title={item.title}
                        style={isActive ? { backgroundColor: appSettings.primaryColor, boxShadow: `0 10px 15px -3px ${appSettings.primaryColor}50` } : {}}
                    >
                        <item.icon size={24} />
                    </button>
                )
            })}

            <div className="flex-1"></div>
            <button onClick={handleBurn} className={`relative flex flex-col items-center gap-1 transition-all cursor-pointer mb-4 select-none group ${isBurning ? 'scale-110' : 'opacity-80 hover:opacity-100'}`}>
              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center p-2 border shadow-inner transition-colors duration-200 z-10 ${isBurning ? 'bg-orange-900 border-orange-500 shadow-orange-500/50' : 'bg-white/10 border-white/10'}`}>
                <img src={appSettings.schoolLogoUrl} alt="Escola" className="w-full h-full object-contain relative z-20" />
                {isBurning && <div className="fire-container"><div className="flame-base"></div><div className="flame-body"></div><div className="flame-core"></div></div>}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors z-10 relative ${isBurning ? 'text-fire scale-110' : 'text-gray-500'}`}>{appSettings.schoolClass}</span>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="p-3 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 mb-4 hover:scale-110 active:scale-95"><LogOut size={24} /></button>
          </nav>

          <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
            {/* HEADER MOBILE/DESKTOP */}
            <div className="md:absolute md:top-4 md:right-6 z-40 bg-white/90 backdrop-blur border-b md:border border-orange-200 px-4 py-3 md:py-1.5 md:rounded-full shadow-sm flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                  <UserCircle2 size={16} style={{ color: appSettings.primaryColor }}/>
                  <span className="text-xs font-bold text-gray-700 uppercase">{currentUser.name}</span>
              </div>
              <button onClick={() => setShowLogoutModal(true)} className="md:hidden text-gray-400"><LogOut size={18} /></button>
            </div>

            {currentView === 'pos' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                <div className="flex-1 flex flex-col min-w-0">
                  <header className="px-6 py-2 md:py-4 bg-white border-b border-orange-100 shadow-sm z-10 relative flex items-center justify-center min-h-[70px] md:min-h-[90px]">
                    <div className="flex items-center gap-3 md:gap-5 transition-transform hover:scale-105 duration-300">
                      <img src={appSettings.mascotUrl} className="w-12 h-12 md:w-20 md:h-20 object-contain mix-blend-multiply animate-mascot-slow drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]" alt="Mascote" />
                      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter transform -skew-x-6 drop-shadow-sm" style={{ color: appSettings.primaryColor, textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>{appSettings.appName}</h1>
                    </div>
                  </header>
                  <div className="flex-1 overflow-hidden relative">
                    <ProductGrid 
                        products={products} 
                        cart={cart} 
                        onAddToCart={addToCart} 
                        onRemoveFromCart={removeFromCart}
                        settings={appSettings} 
                    />
                  </div>
                </div>
                <div className={`fixed inset-y-0 right-0 z-50 w-full md:relative md:w-96 transform transition-transform duration-300 ease-in-out md:transform-none shadow-2xl md:shadow-none ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <CartSidebar 
                    cart={cart} 
                    users={users} 
                    onRemoveItem={removeFromCart} 
                    onUpdateQuantity={updateCartQuantity} 
                    onUpdateNote={updateCartNote} 
                    onClearCart={clearCart} 
                    onCheckout={handleCheckout} 
                    onClose={() => setIsMobileCartOpen(false)}
                    onLoadPendingOrder={handleLoadPendingOrder}
                    emptyCartImageUrl={appSettings.emptyCartImageUrl}
                    settings={appSettings}
                  />
                </div>
              </div>
            )}

            {currentView === 'reports' && <Reports transactions={transactions} onCancelTransaction={handleCancelTransaction} onResetSystem={handleResetSystem} currentUser={currentUser} />}
            {currentView === 'kitchen' && <KitchenDisplay transactions={transactions} onUpdateStatus={handleUpdateKitchenStatus} />}
            {currentView === 'users' && <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} currentUser={currentUser}/>}
            {currentView === 'products' && <ProductManagement products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct}/>}
            {currentView === 'settings' && <SettingsManagement settings={appSettings} onSave={handleUpdateSettings}/>}

            {currentView === 'pos' && !isMobileCartOpen && (
              <button 
                onClick={() => setIsMobileCartOpen(true)} 
                className="md:hidden fixed bottom-20 right-6 text-white p-4 rounded-full shadow-lg z-50 animate-bounce"
                style={{ backgroundColor: appSettings.primaryColor }}
              >
                <div className="relative"><ShoppingCart size={24} />{cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-orange-100">{cartItemCount}</span>}</div>
              </button>
            )}

            {/* --- MOBILE BOTTOM NAVIGATION (DINÂMICA) --- */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-orange-100 z-40 flex justify-between items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-pb px-1">
              {navItems.map(item => {
                 if (!item.enabled) return null;
                 if (item.view === 'settings' && currentUser.role !== 'admin' && currentUser.id !== '0') return null;
                 // Outras regras de role para mobile
                 if (item.view !== 'settings' && !item.roles.includes(currentUser.id) && !item.roles.includes(currentUser.role)) return null;

                 const isActive = currentView === item.view;
                 return (
                    <button 
                        key={item.view}
                        onClick={() => setCurrentView(item.view as any)} 
                        className={`flex-1 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}
                        style={isActive ? { color: appSettings.primaryColor } : {}}
                    >
                        <item.icon size={20} className={isActive ? 'fill-current' : ''} />
                        <span className="text-[9px] font-bold uppercase leading-none">{item.title}</span>
                    </button>
                 )
              })}
            </div>

          </main>
        </>
      )}
    </div>
  );
};

export default App;