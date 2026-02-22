import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, CartItem, Transaction, AppSettings, LayoutBlock, Customer } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Search, ShoppingCart, Plus, Minus, X, ArrowLeft, Send, CheckCircle2, User, UtensilsCrossed, AlertTriangle, Clock, RefreshCw, ChefHat, PackageCheck, Banknote, BellRing, Ban, AlertOctagon, Gift, Trophy, Star, Dices } from 'lucide-react';
import { createTransaction, fetchNextOrderNumber, fetchTransactionsByIds, subscribeToTransactions } from '../services/supabase';
import { getCustomerByPhone, createCustomer, addPoints, redeemPoints } from '../services/loyaltyService';

interface CustomerOrderProps {
  products: Product[];
  onExit: () => void;
  nextOrderNumber: number;
  settings: AppSettings;
}

// Sons para notificação
const SOUND_PAYMENT_CONFIRMED = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/glass_ting.mp3";
const SOUND_ORDER_READY = "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3";
const SOUND_WIN = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/reward.mp3";

const CustomerOrder: React.FC<CustomerOrderProps> = ({ products, onExit, nextOrderNumber, settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [view, setView] = useState<'menu' | 'cart' | 'success' | 'orders' | 'loyalty_login' | 'mini_game'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [lastOrderInfo, setLastOrderInfo] = useState<{number: string, name: string} | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [myOrders, setMyOrders] = useState<Transaction[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [readyOrderModal, setReadyOrderModal] = useState<Transaction | null>(null);
  const prevOrdersRef = useRef<Transaction[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mini Game State (Moved to top)
  const [gameSpinning, setGameSpinning] = useState(false);
  const [gameResult, setGameResult] = useState<number | null>(null);
  
  // --- MINI GAME: PLATFORMER (MARIO STYLE) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mascotImgRef = useRef<HTMLImageElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won_level' | 'game_over' | 'completed'>('start');
  const [gameLevel, setGameLevel] = useState(1);
  const [gameScore, setGameScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  
  // Game Constants
  const GRAVITY = 0.6;
  const JUMP_FORCE = -15; // Higher jump for full screen
  const SPEED_BASE = 6;
  
  // Game Refs (Mutable state for loop)
  const gameRef = useRef({
      player: { x: 50, y: 200, width: 60, height: 60, dy: 0, grounded: false, color: '#f97316' },
      obstacles: [] as { x: number, y: number, width: number, height: number, type: 'block' | 'coin' }[],
      frame: 0,
      speed: SPEED_BASE,
      animationId: 0,
      levelDistance: 0,
      maxDistance: 2000, // Distance to win level
      currentLevelScore: 0,
      currentLevel: 1
  });

  const initLevel = (level: number) => {
      const speed = SPEED_BASE + (level * 1.5);
      const distance = 2000 + (level * 1000);
      
      // Reset player position based on screen height if possible, otherwise default
      const startY = window.innerHeight ? window.innerHeight - 150 : 200;

      gameRef.current = {
          player: { x: 50, y: startY, width: 60, height: 60, dy: 0, grounded: false, color: '#f97316' },
          obstacles: [],
          frame: 0,
          speed: speed,
          animationId: 0,
          levelDistance: 0,
          maxDistance: distance,
          currentLevelScore: 0,
          currentLevel: level
      };
      setGameState('start');
      setLevelScore(0);
      setGameLevel(level);
  };

  const startGame = () => {
      setGameState('playing');
      gameLoop();
  };

  const jump = () => {
      if (gameRef.current.player.grounded) {
          gameRef.current.player.dy = JUMP_FORCE;
          gameRef.current.player.grounded = false;
      }
  };

  const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const groundY = height - 50;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background (Sky)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f172a'); // Slate 900
      gradient.addColorStop(1, '#334155'); // Slate 700
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Ground
      ctx.fillStyle = '#1e293b'; // Slate 800
      ctx.fillRect(0, groundY, width, 50);
      ctx.fillStyle = '#475569'; // Slate 600 (Top border)
      ctx.fillRect(0, groundY, width, 5);

      // Player Physics
      state.player.dy += GRAVITY;
      state.player.y += state.player.dy;

      // Ground Collision
      if (state.player.y + state.player.height > groundY) {
          state.player.y = groundY - state.player.height;
          state.player.dy = 0;
          state.player.grounded = true;
      }

      // Draw Player (Mascot)
      if (mascotImgRef.current) {
          ctx.drawImage(mascotImgRef.current, state.player.x, state.player.y, state.player.width, state.player.height);
      } else {
          ctx.fillStyle = state.player.color;
          ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      }

      // Spawn Obstacles & Coins
      state.frame++;
      state.levelDistance += state.speed;

      // Spawn Logic
      if (state.frame % Math.floor(1200 / state.speed) === 0) {
          const type = Math.random() > 0.6 ? 'coin' : 'block';
          if (type === 'block') {
              // Obstacle (Fryer/Fire)
              state.obstacles.push({ x: width, y: groundY - 60, width: 40, height: 60, type: 'block' });
          } else {
              // Coin
              state.obstacles.push({ x: width, y: groundY - 100 - (Math.random() * 80), width: 30, height: 30, type: 'coin' });
          }
      }

      // Update Obstacles
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;

          // Draw
          if (obs.type === 'block') {
              ctx.fillStyle = '#ef4444'; // Red
              ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
              // Fire detail
              ctx.fillStyle = '#fca5a5';
              ctx.beginPath();
              ctx.moveTo(obs.x, obs.y + obs.height);
              ctx.lineTo(obs.x + obs.width/2, obs.y);
              ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
              ctx.fill();
          } else {
              ctx.fillStyle = '#fbbf24'; // Gold
              ctx.beginPath();
              ctx.arc(obs.x + 15, obs.y + 15, 15, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#d97706';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.fillStyle = '#d97706';
              ctx.font = 'bold 16px sans-serif';
              ctx.fillText('$', obs.x + 10, obs.y + 20);
          }

          // Collision
          if (
              state.player.x < obs.x + obs.width &&
              state.player.x + state.player.width > obs.x &&
              state.player.y < obs.y + obs.height &&
              state.player.y + state.player.height > obs.y
          ) {
              if (obs.type === 'block') {
                  // Game Over
                  setGameState('game_over');
                  cancelAnimationFrame(state.animationId);
                  return;
              } else if (obs.type === 'coin') {
                  // Collect Coin
                  state.currentLevelScore += 10;
                  setLevelScore(state.currentLevelScore); // Update UI
                  state.obstacles.splice(i, 1);
                  // Sound effect could go here
              }
          }

          // Remove off-screen
          if (obs.x + obs.width < 0) {
              state.obstacles.splice(i, 1);
          }
      }

      // Progress Bar
      const progress = Math.min(1, state.levelDistance / state.maxDistance);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, width * progress, 8);

      // Win Condition
      if (state.levelDistance >= state.maxDistance) {
          setGameState('won_level');
          cancelAnimationFrame(state.animationId);
          return;
      }

      state.animationId = requestAnimationFrame(gameLoop);
  };

  const handleLevelComplete = async () => {
      const state = gameRef.current;
      const totalLevelPoints = state.currentLevelScore + (state.currentLevel * 50); // Bonus for completing
      const newTotalScore = gameScore + totalLevelPoints;
      setGameScore(newTotalScore);
      
      if (state.currentLevel < 3) {
          initLevel(state.currentLevel + 1);
      } else {
          setGameState('completed');
          // Points are added to transaction in App.tsx upon payment, 
          // but for the game bonus, we might want to add them now or attach to transaction.
          // Since we can't easily attach to the already created transaction without an update call,
          // we'll just add them to the customer account immediately as a "gift".
          if (customer) {
               await addPoints(customer.id, newTotalScore);
               setCustomer(prev => prev ? ({...prev, points: prev.points + newTotalScore}) : null);
          }
      }
  };

  const handleRetryLevel = () => {
      initLevel(gameLevel);
      startGame();
  };

  // Initialize game when view changes
  useEffect(() => {
      if (view === 'mini_game') {
          // Load Mascot Image
          const img = new Image();
          img.src = settings.mascotUrl;
          img.onload = () => {
              mascotImgRef.current = img;
          };

          // Adjust canvas size to window
          if (canvasRef.current) {
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = window.innerHeight;
          }

          initLevel(1);
      }
      return () => cancelAnimationFrame(gameRef.current.animationId);
  }, [view]);

  // Layout Fixo: Ignora layouts antigos salvos para garantir que a imagem nova apareça
  const displayLayout: LayoutBlock[] = [
      { 
          id: 'h1', 
          type: 'hero', 
          title: settings.customerWelcomeTitle || 'Bem-vindo', 
          // Prioriza a configuração, mas se não houver, usa a imagem solicitada
          imageUrl: settings.customerHeroUrl || 'https://i.ibb.co/xt5zh5bR/logoo-Edited.png', 
          style: { height: 'medium', alignment: 'center' } 
      },
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

  // --- LÓGICA DE CÁLCULO DE ESTOQUE (INCLUINDO COMBOS) ---
  const calculateMaxStock = (product: Product): number => {
    // 1. Se estiver indisponível manualmente
    if (product.isAvailable === false) return 0;

    // 2. Se for Combo
    if (product.comboItems && product.comboItems.length > 0) {
        let minCombos = 999999;
        let hasIngredients = false;

        for (const item of product.comboItems) {
            const ingredient = products.find(p => p.id === item.productId);
            
            // Ingrediente não existe ou indisponível => Combo Esgotado
            if (!ingredient || ingredient.isAvailable === false) return 0;
            
            hasIngredients = true;

            // Ingrediente com estoque controlado
            if (ingredient.stock !== undefined && ingredient.stock !== null) {
                const possible = Math.floor(ingredient.stock / item.quantity);
                if (possible < minCombos) minCombos = possible;
            }
        }
        // Se calculou e deu um número válido, retorna. Se não teve limitação, retorna "infinito"
        return minCombos === 999999 ? 999999 : minCombos; 
    }

    // 3. Produto Simples com Estoque
    if (product.stock !== undefined && product.stock !== null) {
        return product.stock;
    }

    // 4. Sem limite
    return 999999;
  };

  const addToCart = (product: Product) => {
    const maxStock = calculateMaxStock(product);
    if (maxStock === 0) return; // Esgotado

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
    // --- VALIDAÇÃO DE ESTOQUE (Apenas ao aumentar) ---
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

  // --- FIDELIDADE ---
  const handleLoginLoyalty = async () => {
      if (!customerPhone.trim() || customerPhone.length < 8) {
          alert("Digite um telefone válido.");
          return;
      }
      
      let cust = await getCustomerByPhone(customerPhone);
      if (!cust) {
          // Cria novo cliente se não existir
          cust = await createCustomer(customerPhone, customerName || 'Cliente');
      }
      
      if (cust) {
          setCustomer(cust);
          setCustomerName(cust.name || customerName);
          setView('cart'); // Volta para o carrinho
      } else {
          alert("Erro ao acessar sistema de fidelidade.");
      }
  };

  const handleFinishOrder = async () => {
    if (!customerName.trim()) { alert("Por favor, digite seu nome."); return; }
    
    // Se não estiver logado na fidelidade, pede login antes de finalizar (opcional, mas bom para pontuar)
    if (!customer) {
        if (confirm("Quer ganhar pontos com essa compra? Clique em OK para se identificar ou Cancelar para continuar sem pontos.")) {
            setView('loyalty_login');
            return;
        }
    }

    setIsSending(true);
    let orderNumber = nextOrderNumber.toString();
    const freshNumber = await fetchNextOrderNumber();
    if (freshNumber) orderNumber = freshNumber;
    const transactionId = generateId();
    
    // Calcula pontos ganhos (R$ 1 = 100 pontos)
    const pointsEarned = Math.floor(total * 100);

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
        customerId: customer?.id,
        pointsEarned: customer ? pointsEarned : 0
    };

    const success = await createTransaction(newTransaction);
    
    if (success) {
        // Points will be added upon payment confirmation in App.tsx
        // if (customer) {
        //    setCustomer(prev => prev ? ({...prev, points: prev.points + pointsEarned}) : null);
        // }

        setIsSending(false);
        saveOrderId(transactionId); 
        setLastOrderInfo({ number: orderNumber, name: customerName }); 
        setCart([]); 
        requestNotificationPermission(); 
        loadMyOrders();
        
        // Se tiver cliente, vai para o Mini Game, senão vai para sucesso direto
        if (customer) {
            setView('mini_game');
        } else {
            setView('success');
        }
    } else {
        setIsSending(false);
        alert("❌ ERRO AO ENVIAR PEDIDO!\n\nTente novamente ou chame um atendente.");
    }
  };

  const handleRedeemPoints = async (product: Product) => {
      if (!customer) return;
      if (!product.pointsPrice) return;
      
      if (customer.points < product.pointsPrice) {
          alert(`Você precisa de ${product.pointsPrice} pontos. Seu saldo: ${customer.points}`);
          return;
      }

      if (!confirm(`Trocar ${product.pointsPrice} pontos por ${product.name}?`)) return;

      setIsSending(true);
      
      // Deduz pontos
      const successRedeem = await redeemPoints(customer.id, product.pointsPrice);
      
      if (successRedeem) {
          // Cria transação de resgate
          let orderNumber = nextOrderNumber.toString();
          const freshNumber = await fetchNextOrderNumber();
          if (freshNumber) orderNumber = freshNumber;
          const transactionId = generateId();

          const newTransaction: Transaction = {
            id: transactionId, 
            orderNumber, 
            customerName, 
            timestamp: Date.now(), 
            items: [{...product, quantity: 1}], 
            subtotal: 0, 
            discount: 0, 
            total: 0, 
            paymentMethod: 'Pontos Fidelidade', // Identifica como troca
            status: 'completed', // Já nasce pago/completado pois é troca
            kitchenStatus: 'pending',
            customerId: customer.id,
            pointsRedeemed: product.pointsPrice
          };

          const successTrans = await createTransaction(newTransaction);
          
          if (successTrans) {
              // Atualiza saldo local
              setCustomer(prev => prev ? ({...prev, points: prev.points - (product.pointsPrice || 0)}) : null);
              alert(`Resgate realizado com sucesso! Sua senha é #${orderNumber}`);
              saveOrderId(transactionId);
              loadMyOrders();
              setView('orders');
          } else {
              alert("Erro ao criar pedido de troca.");
              // Idealmente faria rollback dos pontos aqui, mas simplificando...
          }
      } else {
          alert("Erro ao deduzir pontos.");
      }
      setIsSending(false);
  };

  const playMiniGame = async () => {
      if (gameSpinning || !customer) return;
      setGameSpinning(true);
      
      // Simula roleta
      setTimeout(async () => {
          const bonusPoints = [10, 50, 100, 200][Math.floor(Math.random() * 4)];
          setGameResult(bonusPoints);
          setGameSpinning(false);
          
          // Adiciona pontos bônus
          await addPoints(customer.id, bonusPoints);
          setCustomer(prev => prev ? ({...prev, points: prev.points + bonusPoints}) : null);
          
          // Toca som
          const audio = new Audio(SOUND_WIN);
          audio.play().catch(() => {});

      }, 3000);
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

  // --- COMPONENTE: PRODUTOS (NOVO DESIGN) ---
  const renderProductGrid = () => (
    <div className="p-4 md:p-6 pb-32">
        
        {/* HERO SECTION INTEGRADA */}
        <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-8 shadow-xl group bg-gray-900">
            
            {/* Background Desfocado para preencher o espaço */}
            <div 
                className="absolute inset-0 opacity-40 blur-2xl scale-110 transition-opacity duration-700"
                style={{ 
                    backgroundImage: `url(${settings.customerHeroUrl || 'https://i.ibb.co/xt5zh5bR/logoo-Edited.png'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            ></div>

            {/* Gradiente para garantir leitura do texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>
            
            {/* Imagem Principal (Sem cortar) */}
            <img 
                src={settings.customerHeroUrl || 'https://i.ibb.co/xt5zh5bR/logoo-Edited.png'} 
                className="relative z-10 w-full h-full object-contain p-2 md:p-4 origin-right md:origin-center transform group-hover:scale-105 transition-transform duration-700" 
                alt="Hero" 
            />
            
            <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 max-w-lg">
                <h2 className="text-white font-black text-3xl md:text-5xl drop-shadow-lg mb-2 leading-tight">{settings.customerWelcomeTitle || 'Bem-vindo'}</h2>
                <p className="text-white/90 font-medium text-sm md:text-lg drop-shadow-md">Escolha o que você quer comer e receba rapidinho!</p>
            </div>
        </div>

        {/* BARRA DE FIDELIDADE (NOVO) */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 mb-6 shadow-lg text-white flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
                {customer ? (
                    <div>
                        <p className="text-xs font-bold opacity-80 uppercase">Olá, {customer.name}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black">{customer.points}</span>
                            <span className="text-sm font-bold">pontos</span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="font-black text-lg">Ganhe Pontos!</p>
                        <p className="text-xs opacity-90">R$ 1,00 = 100 pontos</p>
                    </div>
                )}
            </div>
            <div className="relative z-10">
                {customer ? (
                    <button onClick={() => setView('loyalty_login')} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                        Trocar Conta
                    </button>
                ) : (
                    <button onClick={() => setView('loyalty_login')} className="bg-white text-purple-600 px-6 py-2 rounded-xl font-black shadow-lg hover:scale-105 transition-transform">
                        ENTRAR
                    </button>
                )}
            </div>
            {/* Decor */}
            <Star className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12" />
        </div>

        {/* BUSCA E FILTROS */}
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 py-4 -mx-4 px-4 md:mx-0 md:px-0 mb-6 space-y-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="O que você quer comer hoje?" 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-orange-200 focus:ring-4 focus:ring-orange-100 transition-all font-bold text-gray-700 shadow-sm group-hover:shadow-md" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
             </div>
             
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`snap-start flex-shrink-0 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all transform hover:scale-105 active:scale-95 ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        {cat}
                    </button>
                ))}
             </div>
        </div>

        {/* GRID DE PRODUTOS */}
        {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in zoom-in duration-500">
                <div className="bg-gray-200 p-6 rounded-full mb-4">
                    <UtensilsCrossed size={48} className="opacity-50" />
                </div>
                <p className="font-bold text-lg">Nenhum produto encontrado.</p>
                <p className="text-sm">Tente buscar por outra coisa.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.id === product.id);
                    const maxStock = calculateMaxStock(product);
                    const isSoldOut = maxStock === 0;
                    const canRedeem = customer && product.pointsPrice && customer.points >= product.pointsPrice;

                    return (
                        <div key={product.id} className={`group bg-white rounded-2xl md:rounded-3xl p-2 md:p-4 shadow-sm hover:shadow-xl border-2 border-transparent hover:border-orange-100 transition-all duration-300 flex flex-col relative overflow-hidden ${isSoldOut ? 'opacity-60 grayscale' : ''}`}>
                                
                                {/* Imagem com Zoom no Hover */}
                                <div className="h-28 md:h-48 bg-gray-50 rounded-xl md:rounded-2xl mb-2 md:mb-4 relative overflow-hidden">
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain p-2 md:p-4 transform group-hover:scale-110 transition-transform duration-500" 
                                    />
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                            <span className="bg-red-600 text-white font-black uppercase px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-sm rounded-lg transform -rotate-6 shadow-lg border-2 border-white">Esgotado</span>
                                        </div>
                                    )}
                                    {/* Badge de Quantidade no Card */}
                                    {inCart && !isSoldOut && (
                                        <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-orange-600 text-white w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full font-black text-xs md:text-base shadow-lg animate-in zoom-in">
                                            {inCart.quantity}
                                        </div>
                                    )}
                                    {/* Preço em Pontos */}
                                    {product.pointsPrice && (
                                        <div className="absolute bottom-1 left-1 bg-purple-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-md">
                                            {product.pointsPrice} pts
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <div className="mb-2 md:mb-4">
                                        <h3 className="font-black text-gray-800 text-xs md:text-lg leading-tight mb-1 group-hover:text-orange-600 transition-colors line-clamp-2">{product.name}</h3>
                                        <p className="text-[10px] md:text-sm text-gray-400 line-clamp-2 font-medium hidden md:block">{product.description || product.category}</p>
                                    </div>
                                    
                                    <div className="mt-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                                        <span className="text-sm md:text-2xl font-black text-gray-900">{formatCurrency(product.price)}</span>
                                        
                                        {isSoldOut ? (
                                            <button disabled className="w-full md:w-auto bg-gray-100 text-gray-400 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider cursor-not-allowed">Esgotado</button>
                                        ) : inCart ? (
                                            <div className="w-full md:w-auto flex items-center justify-between bg-gray-900 text-white rounded-lg md:rounded-xl p-1 shadow-lg">
                                                <button onClick={() => updateQuantity(product.id, -1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/20 rounded-md md:rounded-lg transition-colors"><Minus size={14} className="md:w-5 md:h-5"/></button>
                                                <span className="font-black w-6 md:w-8 text-center text-sm md:text-base">{inCart.quantity}</span>
                                                <button onClick={() => updateQuantity(product.id, 1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/20 rounded-md md:rounded-lg transition-colors"><Plus size={14} className="md:w-5 md:h-5"/></button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 w-full md:w-auto">
                                                {canRedeem && (
                                                    <button 
                                                        onClick={() => handleRedeemPoints(product)}
                                                        className="flex-1 md:w-12 h-8 md:h-12 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm"
                                                        title="Trocar por Pontos"
                                                    >
                                                        <Gift size={16} className="md:w-6 md:h-6" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => addToCart(product)} 
                                                    className="flex-1 md:w-12 h-8 md:h-12 bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-orange-300 hover:shadow-lg active:scale-90"
                                                >
                                                    <span className="md:hidden text-[10px] font-black uppercase mr-1">Adicionar</span>
                                                    <Plus size={16} className="md:w-6 md:h-6" strokeWidth={3} />
                                                </button>
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
  );

  // --- RENDERIZADOR DE BLOCOS (SIMPLIFICADO PARA O NOVO DESIGN) ---
  const renderLayout = () => {
     // Ignora o layout configurado e usa o fixo com o novo design
     return renderProductGrid();
  };

  if (view === 'loyalty_login') {
      return (
          <div className="h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
              
              <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
                  <div className="mb-6 flex justify-center">
                      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full shadow-lg shadow-purple-500/50">
                          <Trophy size={48} className="text-white" />
                      </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-2">Clube de Fidelidade</h2>
                  <p className="text-purple-200 mb-8 text-sm">Identifique-se para ganhar pontos e trocar por prêmios incríveis!</p>
                  
                  <div className="space-y-4">
                      <div className="text-left">
                          <label className="text-xs font-bold text-purple-300 uppercase ml-1">Seu Telefone (WhatsApp)</label>
                          <input 
                              type="tel" 
                              placeholder="(00) 00000-0000" 
                              className="w-full mt-1 p-4 rounded-xl bg-white/5 border border-purple-500/30 text-white font-bold text-lg focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all placeholder:text-white/20"
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                          />
                      </div>
                      
                      {!customer && (
                          <div className="text-left animate-in fade-in slide-in-from-top-2">
                              <label className="text-xs font-bold text-purple-300 uppercase ml-1">Seu Nome (Opcional)</label>
                              <input 
                                  type="text" 
                                  placeholder="Como quer ser chamado?" 
                                  className="w-full mt-1 p-4 rounded-xl bg-white/5 border border-purple-500/30 text-white font-bold text-lg focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all placeholder:text-white/20"
                                  value={customerName}
                                  onChange={e => setCustomerName(e.target.value)}
                              />
                          </div>
                      )}

                      <button 
                          onClick={handleLoginLoyalty}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl shadow-lg shadow-purple-900/50 transform active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                          <Star size={20} fill="currentColor" />
                          ACESSAR CLUBE
                      </button>
                      
                      <button 
                          onClick={() => setView('menu')}
                          className="w-full text-purple-300 text-sm font-bold hover:text-white transition-colors py-2"
                      >
                          Voltar ao Cardápio
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'mini_game') {
      return (
          <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
              {/* HUD */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 text-white pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                      <Trophy className="text-yellow-400" />
                      <span className="font-black text-xl">Nível {gameLevel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-yellow-400 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                          <Star size={16} fill="currentColor" />
                          <span className="font-bold">{levelScore}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-400 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                          <span className="text-xs uppercase font-bold mr-1">Total:</span>
                          <span className="font-bold">{gameScore}</span>
                      </div>
                  </div>
              </div>

              <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={jump}
                  onTouchStart={jump}
              />
              
              {gameState === 'start' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 animate-in fade-in">
                      <img src={settings.mascotUrl} className="w-32 h-32 object-contain mb-4 animate-bounce" alt="Mascote" />
                      <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Fuga da Fritadeira!</h3>
                      <p className="text-gray-300 mb-8 text-lg max-w-md text-center">Ajude o mascote a fugir e coletar moedas! Toque na tela para pular.</p>
                      <button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-12 rounded-2xl shadow-lg shadow-green-500/30 transform hover:scale-105 transition-all text-xl">JOGAR AGORA</button>
                  </div>
              )}

              {gameState === 'game_over' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-20 animate-in zoom-in">
                      <h3 className="text-5xl font-black text-red-500 mb-2 uppercase">VISH, FRITOU!</h3>
                      <p className="text-gray-300 mb-8 text-xl">Não desista! Tente novamente.</p>
                      <button onClick={handleRetryLevel} className="bg-white text-slate-900 font-black py-4 px-10 rounded-2xl shadow-lg transform hover:scale-105 transition-all text-lg">TENTAR DE NOVO</button>
                  </div>
              )}

              {gameState === 'won_level' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/95 backdrop-blur-md z-20 animate-in zoom-in">
                      <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
                      <h3 className="text-4xl font-black text-white mb-2 uppercase">Nível Concluído!</h3>
                      <p className="text-green-200 mb-8 font-bold text-xl">Você ganhou +{levelScore + (gameLevel * 50)} pontos!</p>
                      <button onClick={handleLevelComplete} className="bg-yellow-400 text-yellow-900 font-black py-4 px-12 rounded-2xl shadow-lg shadow-yellow-400/30 transform hover:scale-105 transition-all flex items-center gap-2 text-xl">
                          {gameLevel < 3 ? 'PRÓXIMO NÍVEL' : 'RESGATAR PRÊMIO'} <ArrowRight size={24} />
                      </button>
                  </div>
              )}

              {gameState === 'completed' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-900/95 backdrop-blur-md z-20 animate-in zoom-in">
                      <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-xl border border-white/20 text-center max-w-md w-full mx-4">
                          <h3 className="text-4xl font-black text-white mb-2">PARABÉNS!</h3>
                          <p className="text-purple-200 mb-6 text-lg">Você completou o desafio e ganhou um total de:</p>
                          <div className="text-6xl font-black text-yellow-400 mb-8 drop-shadow-lg">{gameScore} pts</div>
                          <button onClick={() => setView('success')} className="w-full bg-white text-purple-900 font-black py-4 rounded-xl shadow-lg hover:bg-gray-100 transition-all text-xl">FINALIZAR PEDIDO</button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (view === 'success') {
      return (
        <div className="h-full bg-orange-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
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
        <div className="h-full bg-slate-50 flex flex-col relative overflow-hidden">
            {renderReadyModal()}
            <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between shadow-sm flex-shrink-0">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={24} /></button>
                <h2 className="font-bold text-lg text-gray-800">Meus Pedidos</h2>
                <button onClick={loadMyOrders} className={`p-2 text-blue-600 hover:bg-blue-50 rounded-full ${isLoadingOrders ? 'animate-spin' : ''}`}><RefreshCw size={24} /></button>
            </div>
            <div className="bg-blue-50 px-4 py-2 text-xs text-blue-700 flex items-center justify-center gap-2 border-b border-blue-100 flex-shrink-0"><BellRing size={14} className="animate-pulse" /><span>Nós te avisaremos aqui quando estiver pronto!</span></div>
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
        <div className="h-full bg-white flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            {renderReadyModal()}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10 flex-shrink-0"><button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} className="text-gray-700" /></button><h2 className="text-xl font-bold text-gray-800">Seu Carrinho</h2></div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Seu Nome</label><div className="relative mt-1"><User className="absolute left-3 top-3 text-orange-500" size={20} /><input type="text" placeholder="Digite seu nome..." className="w-full pl-10 pr-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-bold text-gray-800" value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus /></div></div>
                {cart.length === 0 ? <div className="text-center py-10 text-gray-400"><ShoppingCart size={48} className="mx-auto mb-2 opacity-50" /><p>Seu carrinho está vazio.</p></div> : <div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex gap-3 items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm"><img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain rounded-lg bg-gray-50" /><div className="flex-1"><h3 className="font-bold text-gray-800 text-sm">{item.name}</h3><p className="text-orange-600 font-bold">{formatCurrency(item.price * item.quantity)}</p></div><div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-orange-600"><Minus size={16} /></button><span className="font-bold text-sm w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-orange-600"><Plus size={16} /></button></div></div>))}</div>}
            </div>
            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex-shrink-0"><div className="flex justify-between items-center mb-4"><span className="text-gray-500">Total</span><span className="text-2xl font-black text-gray-900">{formatCurrency(total)}</span></div><button onClick={handleFinishOrder} disabled={cart.length === 0 || !customerName.trim() || isSending} className="w-full bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all">{isSending ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <><Send size={20} /> ENVIAR PEDIDO</>}</button></div>
        </div>
    );
  }

  // --- MENU VIEW (AGORA BASEADA EM LAYOUT DINÂMICO) ---
  return (
    <div className="h-full bg-slate-50 flex flex-col relative overflow-hidden">
      {renderReadyModal()}
      
      {/* Static App Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-20 flex justify-between items-center flex-shrink-0">
         <div className="flex items-center gap-2">
             <img src={settings.mascotUrl} alt="Logo" className="w-8 h-8 object-contain" />
             <h1 className="font-black text-gray-800 tracking-tight">{settings.appName}</h1>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={() => setView('orders')} className="flex flex-col items-center justify-center text-gray-500 hover:text-orange-600 transition-colors"><Clock size={20} /><span className="text-[10px] font-bold">Meus Pedidos</span></button>
             <button onClick={onExit} className="text-xs text-gray-400 underline ml-2">Sair</button>
         </div>
      </div>

      {/* RENDER LAYOUT DINÂMICO - Alterado para usar h-full e flex-1 */}
      <div className="flex-1 overflow-y-auto pb-24 safe-area-scroll">
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