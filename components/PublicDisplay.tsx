import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction, AppSettings } from '../types';
import { ChefHat, CheckCircle2, AlertTriangle, Heart, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';

interface PublicDisplayProps {
  transactions: Transaction[];
  settings: AppSettings; // Recebe configurações dinâmicas
}

// Som de Campainha de Atendimento (Fonte estável: Google Demo Assets - Glass Ting)
const BELL_SOUND_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/glass_ting.mp3";
const DONATION_SOUND_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/reward.mp3";

const PublicDisplay: React.FC<PublicDisplayProps> = ({ transactions, settings }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estado para controlar a animação de celebração (Pedido Atualmente na Tela)
  const [celebratingOrder, setCelebratingOrder] = useState<Transaction | null>(null);
  const [celebratingDonation, setCelebratingDonation] = useState<Transaction | null>(null);
  
  // FILA DE CELEBRAÇÃO: Armazena pedidos que precisam ser mostrados
  const [celebrationQueue, setCelebrationQueue] = useState<Transaction[]>([]);
  const [donationQueue, setDonationQueue] = useState<Transaction[]>([]);
  
  // Histórico de IDs processados para não repetir o mesmo pedido
  const processedOrderIdsRef = useRef<Set<string>>(new Set());
  const processedDonationIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  // Alternar tela cheia nativa para TVs / Monitores
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn(err));
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Atalho de teclado 'F' ou 'F11' para tela cheia na TV
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Helper para identificar doações puras (sem itens de comida/bebida)
  const isPureDonation = (t: Transaction) => {
      return t.items.length > 0 && t.items.every(i => i.category === 'Doação');
  };

  // Pedidos em Preparo (Apenas pedidos com pagamento confirmado/concluído)
  const preparingOrders = useMemo(() => {
    return transactions
      .filter(t => 
        t.kitchenStatus === 'pending' && 
        (t.status === 'completed' || (t.status as string) === 'paid') && 
        t.timestamp >= startOfDay.getTime() &&
        !isPureDonation(t)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Pedidos Prontos (Limitado aos últimos 5 para ficarem GRANDES na TV)
  // Apenas pedidos com pagamento confirmado/concluído
  const readyOrders = useMemo(() => {
    return transactions
      .filter(t => 
        t.kitchenStatus === 'done' && 
        (t.status === 'completed' || (t.status as string) === 'paid') && 
        t.timestamp >= startOfDay.getTime() &&
        !isPureDonation(t)
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5); // Reduzido para 5 para caber melhor na safe zone
  }, [transactions]);

  // Doações Confirmadas
  const completedDonations = useMemo(() => {
      return transactions
        .filter(t => 
            (t.status === 'completed' || t.status === 'paid') && 
            t.items.some(i => i.category === 'Doação') &&
            t.timestamp >= startOfDay.getTime()
        )
        .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // --- FUNÇÃO DE ÁUDIO MELHORADA ---
  const playAudio = (type: 'order' | 'donation', textToSpeak?: string) => {
    // Criação do objeto de áudio com tratamento de erro
    const audio = new Audio(type === 'donation' ? DONATION_SOUND_URL : BELL_SOUND_URL);
    audio.volume = 0.8; // Volume confortável
    
    // Tenta tocar o som
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Autoplay bloqueado ou erro no áudio:", error);
      });
    }

    setTimeout(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            // Texto curto e direto para soar menos robótico
            const text = textToSpeak || `Senha .`;
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.lang = 'pt-BR';
            utterance.volume = 1.0; 
            utterance.rate = 0.9; // Levemente mais lento para clareza
            utterance.pitch = 1.0; // Tom natural
            
            const voices = window.speechSynthesis.getVoices();
            // Tenta priorizar vozes de alta qualidade (Google ou Microsoft)
            const bestVoice = voices.find(v => 
                (v.name.includes('Google') && v.lang.includes('pt-BR')) ||
                (v.name.includes('Luciana') && v.lang.includes('pt-BR')) || // iOS
                (v.name.includes('Microsoft') && v.lang.includes('pt-BR')) || // Windows
                v.lang === 'pt-BR'
            );

            if (bestVoice) {
                utterance.voice = bestVoice;
            }
            window.speechSynthesis.speak(utterance);
        }
    }, 1000); // Delay de 1s para o "Ding" tocar limpo antes da voz
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
  }, []);

  // === LÓGICA DE DETECÇÃO DE NOVOS PEDIDOS E DOAÇÕES ===
  useEffect(() => {
    if (isFirstLoadRef.current) {
        if (readyOrders.length > 0) {
            readyOrders.forEach(t => processedOrderIdsRef.current.add(t.id));
        }
        if (completedDonations.length > 0) {
            completedDonations.forEach(t => processedDonationIdsRef.current.add(t.id));
        }
        isFirstLoadRef.current = false;
        return;
    }

    // Detectar novos pedidos prontos
    const currentReadyIds = new Set(readyOrders.map(t => t.id));
    processedOrderIdsRef.current.forEach(id => {
        if (!currentReadyIds.has(id)) {
            processedOrderIdsRef.current.delete(id);
        }
    });

    const newItems = readyOrders.filter(t => !processedOrderIdsRef.current.has(t.id));
    
    if (newItems.length > 0) {
        newItems.forEach(t => processedOrderIdsRef.current.add(t.id));
        const sortedNewItems = [...newItems].sort((a, b) => a.timestamp - b.timestamp);
        setCelebrationQueue(prevQueue => [...prevQueue, ...sortedNewItems]);
    }

    // Detectar novas doações
    const newDonations = completedDonations.filter(t => !processedDonationIdsRef.current.has(t.id));
    if (newDonations.length > 0) {
        newDonations.forEach(t => processedDonationIdsRef.current.add(t.id));
        setDonationQueue(prev => [...prev, ...newDonations]);
    }

  }, [readyOrders, completedDonations]);

  // === LÓGICA DE PROCESSAMENTO DA FILA ===
  useEffect(() => {
    // Prioridade para doações
    if (!celebratingDonation && !celebratingOrder && donationQueue.length > 0) {
        const nextDonation = donationQueue[0];
        setCelebratingDonation(nextDonation);
        const donorName = nextDonation.customerName || 'Amigo';
        playAudio('donation', `${donorName}, muito obrigado por ajudar com a nossa formatura!`);
        setDonationQueue(prev => prev.slice(1));
        return;
    }

    if (!celebratingOrder && !celebratingDonation && celebrationQueue.length > 0) {
        const nextOrder = celebrationQueue[0];
        setCelebratingOrder(nextOrder);
        
        const name = nextOrder.customerName;
        const text = name ? `${name}, senha ${nextOrder.orderNumber}, tá frito!` : `Senha ${nextOrder.orderNumber}, tá frito!`;
        
        playAudio('order', text);
        setCelebrationQueue(prev => prev.slice(1));
    }
  }, [celebratingOrder, celebratingDonation, celebrationQueue, donationQueue]);

  useEffect(() => {
    if (celebratingOrder) {
      const timer = setTimeout(() => {
        setCelebratingOrder(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [celebratingOrder]);

  useEffect(() => {
    if (celebratingDonation) {
      const timer = setTimeout(() => {
        setCelebratingDonation(null);
      }, 10000); // Doação fica um pouco mais de tempo (10s)
      return () => clearTimeout(timer);
    }
  }, [celebratingDonation]);

  // --- MODO COMERCIAL / CHAMARIS (DESCANSO) ---
  const [displayMode, setDisplayMode] = useState<'status' | 'commercial'>('status');
  const [commercialPhase, setCommercialPhase] = useState<'video' | 'showcase'>('video');
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const PROMO_VIDEO_URL = "/assets/aistudio/Video_Project_6d65d52d.mp4";

  // Função para retornar imediatamente ao status dos pedidos
  const returnToStatus = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setDisplayMode('status');
    setCommercialPhase('video');
  };

  // Se houver nova celebração (pedido pronto ou doação), interrompe imediatamente o comercial
  useEffect(() => {
    if (celebratingOrder || celebratingDonation || celebrationQueue.length > 0 || donationQueue.length > 0) {
      if (displayMode === 'commercial') {
        returnToStatus();
      }
    }
  }, [celebratingOrder, celebratingDonation, celebrationQueue, donationQueue, displayMode]);

  // Ciclo automático entre STATUS (pedidos) e COMERCIAL (chamaris)
  useEffect(() => {
    if (displayMode === 'status') {
      // Se há pedidos sendo celebrados no momento, não conta tempo para comercial
      if (celebratingOrder || celebratingDonation) return;

      // Fica 45 segundos exibindo o status dos pedidos
      const statusTimer = setTimeout(() => {
        if (!celebratingOrder && !celebratingDonation) {
          setDisplayMode('commercial');
          setCommercialPhase('video');
        }
      }, 45000);

      return () => clearTimeout(statusTimer);
    }
  }, [displayMode, celebratingOrder, celebratingDonation]);

  // Controle de reprodução e transição das etapas do comercial
  useEffect(() => {
    if (displayMode === 'commercial') {
      if (commercialPhase === 'video') {
        const video = videoRef.current;
        if (video) {
          video.currentTime = 0;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Autoplay com áudio bloqueado pelo navegador, tentando mudo:", err);
              video.muted = true;
              setIsMuted(true);
              video.play().catch(e => console.error("Falha ao reproduzir vídeo:", e));
            });
          }
        }

        // Fallback de segurança se onEnded não disparar (o vídeo dura ~7.5s)
        const fallbackTimer = setTimeout(() => {
          setCommercialPhase('showcase');
        }, 9000);

        return () => clearTimeout(fallbackTimer);
      } else if (commercialPhase === 'showcase') {
        // Exibe os lanches por 10 segundos e depois VOLTA AO STATUS DOS PEDIDOS
        const showcaseTimer = setTimeout(() => {
          returnToStatus();
        }, 10000);

        return () => clearTimeout(showcaseTimer);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [displayMode, commercialPhase]);

  // --- TEXTO DO RODAPÉ (PERSONALIZADO) ---
  const marqueeContent = useMemo(() => {
      if (settings.marqueeText) {
          return `${settings.marqueeText} • ${settings.marqueeText} • ${settings.marqueeText}`; 
      }
      return `RETIRE SEU PEDIDO IMEDIATAMENTE • BOM APETITE! • ${settings.appName} • EVITE FILAS • RETIRE SEU PEDIDO IMEDIATAMENTE • BOM APETITE!`;
  }, [settings.marqueeText, settings.appName]);

  // --- COMPONENTE DE COMERCIAL / CHAMARIS ---
  const renderCommercial = () => {
    const snacks = [
        { name: 'Combo Tô Frito!', desc: 'Clássico + Batata + Refri', img: '/images/combo-classico.png', price: 'R$ 30,00', tag: 'CAMPEÃO DE VENDAS' },
        { name: 'Tô Frito! Clássico', desc: '150g Frango Crocante', img: '/images/frito-classico.png', price: 'R$ 15,00', tag: 'MAIS PEDIDO' },
        { name: 'Batata Frita', desc: 'Dourada e Sequinha', img: '/images/batata.png', price: 'R$ 10,00', tag: 'CROCANTE' },
        { name: 'Refrigerante Gelado', desc: 'Coca, Fanta, Guaraná, Soda', img: '/images/refrigerante.png', price: 'R$ 7,00', tag: 'SUPER GELADO' }
    ];

    return (
        <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-between animate-in fade-in duration-700 overflow-hidden p-[clamp(0.5rem,1.5vmin,1.5rem)]">
            {/* Fundo com efeito de chamas */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="fire-container scale-[3] origin-bottom opacity-30">
                    <div className="flame-base"></div>
                    <div className="flame-body"></div>
                </div>
            </div>

            {/* BARRA SUPERIOR DO COMERCIAL */}
            <div className="relative z-20 w-full flex items-center justify-between px-4 py-1.5 md:py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <img src={settings.mascotUrl} className="h-8 w-8 md:h-10 md:w-10 object-contain drop-shadow" alt="Logo" />
                    <div>
                        <span className="font-black text-white text-xs md:text-base tracking-tight uppercase flex items-center gap-2">
                            {settings.appName}
                            <span className="bg-orange-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Comercial</span>
                        </span>
                        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{settings.schoolClass} • Feira Cultural</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Botão de Som para o Vídeo */}
                    {commercialPhase === 'video' && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (videoRef.current) {
                                    videoRef.current.muted = !videoRef.current.muted;
                                    setIsMuted(videoRef.current.muted);
                                }
                            }}
                            className="bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/20 transition-all text-xs font-bold"
                            title="Alternar áudio"
                        >
                            <span>{isMuted ? '🔇 Ativar Som' : '🔊 Som Ativo'}</span>
                        </button>
                    )}

                    {/* Botão de Pular para os Pedidos */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            returnToStatus();
                        }}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-3 md:px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <span>Ver Pedidos</span>
                        <span>➔</span>
                    </button>
                </div>
            </div>

            {/* CONTEÚDO PRINCIPAL: VÍDEO OU SHOWCASE DE LANCHES */}
            <div className="relative z-10 flex-1 w-full flex items-center justify-center my-1 md:my-2 min-h-0 overflow-hidden">
                {commercialPhase === 'video' ? (
                    /* ETAPA 1: O VÍDEO CHAMARIS */
                    <div className="flex flex-col items-center justify-center w-full h-full max-w-5xl animate-in zoom-in-95 duration-500">
                        <div className="relative w-full max-h-[min(65vh,calc(100vh-130px))] aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(234,88,12,0.6)] border-2 md:border-4 border-yellow-400 ring-2 md:ring-4 ring-orange-500/50 bg-black flex items-center justify-center">
                            <video 
                                ref={videoRef}
                                src={PROMO_VIDEO_URL}
                                playsInline
                                autoPlay
                                muted={isMuted}
                                preload="auto"
                                onEnded={() => setCommercialPhase('showcase')}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="mt-2 md:mt-3 flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 px-4 md:px-8 py-1.5 md:py-2.5 rounded-full shadow-lg border-2 border-yellow-300 animate-pulse flex-shrink-0">
                            <span className="text-xs sm:text-base md:text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">
                                🔥 CORRA PRO BALCÃO OU PEÇA PELO TOTEM! 🔥
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ETAPA 2: SHOWCASE DE LANCHES E COMBOS */
                    <div className="flex flex-col items-center justify-center text-center w-full max-w-6xl animate-in fade-in zoom-in-95 duration-700 h-full">
                        <div className="mb-2 md:mb-3 flex-shrink-0">
                            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-none tracking-tighter uppercase drop-shadow-lg">
                                BATEU AQUELA <span className="text-orange-500">FOME?</span>
                            </h2>
                            <p className="text-xs sm:text-sm md:text-base font-bold text-gray-300 uppercase tracking-widest mt-1">
                                Experimente nossos lanches quentinhos e crocantes feitos na hora!
                            </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full px-2 sm:px-4 flex-1 min-h-0 items-center">
                            {snacks.map((snack, idx) => (
                                <div 
                                    key={idx} 
                                    className="h-full max-h-[38vh] bg-white/5 border-2 border-white/10 hover:border-orange-500/50 p-2 sm:p-3 md:p-4 rounded-2xl md:rounded-3xl flex flex-col items-center justify-between transform hover:scale-105 transition-all duration-300 shadow-xl relative overflow-hidden group"
                                >
                                    <span className="absolute top-2 left-2 bg-orange-600/90 text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {snack.tag}
                                    </span>

                                    <div className="flex-1 w-full relative flex items-center justify-center min-h-0 my-1">
                                        <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                                        <img src={snack.img} alt={snack.name} className="w-full h-full max-h-24 sm:max-h-32 md:max-h-40 object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" />
                                    </div>

                                    <div className="w-full flex flex-col items-center flex-shrink-0">
                                        <h3 className="text-xs sm:text-sm md:text-base font-black text-white uppercase mb-0.5 line-clamp-1">{snack.name}</h3>
                                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-1.5 sm:mb-2 line-clamp-1">{snack.desc}</p>
                                        
                                        <span className="bg-orange-600 text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-xl font-black text-sm sm:text-lg md:text-xl shadow-md border border-orange-400">
                                            {snack.price}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-2 md:mt-4 bg-gradient-to-r from-orange-600 to-red-600 px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-full shadow-[0_0_40px_rgba(234,88,12,0.5)] border-2 border-yellow-400 animate-bounce flex-shrink-0">
                            <span className="text-xs sm:text-base md:text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">
                                Peça já! Vem pro TÔ FRITO! 🍟🔥
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* RODAPÉ DO COMERCIAL COM INDICAÇÃO DE RETORNO AOS PEDIDOS */}
            <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-6 py-1.5 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] sm:text-xs flex-shrink-0">
                <div className="flex items-center gap-2 text-orange-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                    <span>{commercialPhase === 'video' ? 'Exibindo Vídeo Chamaris' : 'Exibindo Cardápio em Destaque'}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">Retornando aos pedidos em instantes</span>
                </div>

                {readyOrders.length > 0 && (
                    <div className="flex items-center gap-2 bg-green-500/20 px-2.5 py-0.5 rounded-lg border border-green-500/40 text-green-300 font-mono font-bold text-[10px] sm:text-xs">
                        <span>PRONTOS NO BALCÃO:</span>
                        <span className="font-black text-green-400">#{readyOrders.map(o => o.orderNumber).slice(0, 4).join(', #')}</span>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#0a0500] flex items-center justify-center overflow-hidden relative font-sans text-white p-[clamp(0.25rem,1.2vmin,1rem)] select-none">
      
      {/* === BACKGROUND FIRE ATMOSPHERE === */}
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/40 via-[#0a0500] to-black pointer-events-none"></div>
      
      {/* Ember Particles (Static Visuals) */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-orange-500 rounded-full blur-[2px] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-red-500 rounded-full blur-[4px] animate-bounce"></div>
      <div className="absolute top-1/2 left-5 w-1 h-1 bg-yellow-500 rounded-full blur-[1px]"></div>

      {/* === MOLDURA PRINCIPAL (SAFE ZONE ADAPTÁVEL PARA QUALQUER TV) === */}
      <div className="relative w-full h-full bg-black/85 rounded-[clamp(0.75rem,2vmin,1.5rem)] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(234,88,12,0.4)] border-[clamp(2px,0.4vmin,5px)] border-orange-900/60 ring-2 ring-orange-500/20 backdrop-blur-sm z-10">
        
        {/* Fire Border Animation Overlay */}
        <div className="absolute inset-0 rounded-2xl border-2 border-orange-500/30 pointer-events-none animate-pulse z-20"></div>

        {/* === MODO COMERCIAL === */}
        {displayMode === 'commercial' && !celebratingOrder && !celebratingDonation && renderCommercial()}

        {/* === OVERLAY DE DOAÇÃO (PRIORIDADE MÁXIMA) === */}
        {celebratingDonation && (
            <div className="absolute inset-0 z-[250] flex flex-col items-center justify-center bg-pink-900/95 backdrop-blur-xl animate-in zoom-in-90 duration-500 p-4">
                 {/* Background Effects */}
                 <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/30 via-transparent to-transparent animate-pulse"></div>
                    {[...Array(20)].map((_, i) => (
                        <Heart 
                            key={i}
                            className="absolute text-pink-400/30 animate-bounce"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                width: `${Math.random() * 80 + 30}px`,
                                height: `${Math.random() * 80 + 30}px`,
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                animationDelay: `${Math.random()}s`
                            }}
                            fill="currentColor"
                        />
                    ))}
                 </div>

                 <div className="relative z-10 flex flex-col items-center text-center p-4 max-w-4xl">
                    <div className="w-[clamp(4.5rem,10vw,7.5rem)] h-[clamp(4.5rem,10vw,7.5rem)] bg-white rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_60px_rgba(236,72,153,0.6)] animate-bounce">
                        <Heart className="w-[clamp(2.5rem,5vw,4rem)] h-[clamp(2.5rem,5vw,4rem)] text-pink-600 fill-current" />
                    </div>
                    
                    <h1 className="text-[clamp(1.75rem,4.5vw,4.5rem)] leading-none font-black text-white mb-3 md:mb-5 drop-shadow-lg uppercase tracking-tight">
                        NOVA DOAÇÃO!
                    </h1>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl transform rotate-1">
                        <p className="text-[clamp(1.5rem,3.8vw,3.5rem)] font-black text-pink-200 uppercase leading-tight mb-2">
                            {celebratingDonation.customerName || 'AMIGO'}
                        </p>
                        <p className="text-[clamp(0.9rem,2.2vw,2rem)] font-bold text-white uppercase leading-tight">
                            MUITO OBRIGADO POR AJUDAR COM A NOSSA FORMATURA!
                        </p>
                    </div>
                    
                    <div className="mt-6 md:mt-8 flex items-center gap-3 bg-pink-600/50 px-6 py-2.5 rounded-full border border-pink-400/30">
                        <span className="text-sm md:text-xl font-bold text-white uppercase tracking-widest">TURMA 2026 AGRADECE ❤️</span>
                    </div>
                 </div>
            </div>
        )}

        {/* === OVERLAY DE CELEBRAÇÃO GIGANTE PARA TV === */}
        {celebratingOrder && !celebratingDonation && (
            <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in zoom-in-90 duration-300 p-4">
            
            {/* Fundo de Fogo */}
            <div className="absolute inset-0 opacity-60 overflow-hidden pointer-events-none">
                <div className="fire-container scale-[2] origin-bottom">
                    <div className="flame-base"></div>
                    <div className="flame-body"></div>
                    <div className="flame-core"></div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-4 w-full">
                <h1 className="text-[clamp(2rem,5.5vw,5rem)] leading-none font-black text-white mb-4 md:mb-6 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] uppercase tracking-tighter animate-pulse">
                    TÁ FRITOOOOO!!!!
                </h1>

                {/* Box da Senha */}
                <div className="bg-gradient-to-br from-orange-600 to-red-600 px-[clamp(2.5rem,6vw,5.5rem)] py-[clamp(1.2rem,3vw,2.5rem)] rounded-[clamp(1.5rem,4vmin,3rem)] shadow-[0_0_100px_rgba(234,88,12,0.8)] border-[clamp(3px,0.5vmin,6px)] border-yellow-400 animate-cta-bounce transform rotate-[-2deg]">
                    <span className="block text-[clamp(1rem,2.2vw,2rem)] text-yellow-200 font-bold uppercase tracking-[0.4em] mb-1">SENHA</span>
                    <span className="block text-[clamp(4.5rem,12vw,10.5rem)] leading-none font-black text-white drop-shadow-xl">
                        #{celebratingOrder.orderNumber}
                    </span>
                </div>

                <div className="mt-6 md:mt-10 flex items-center gap-3 animate-in slide-in-from-bottom-20 duration-1000">
                    <img src={settings.mascotUrl} className="h-[clamp(3rem,7vw,6.5rem)] w-[clamp(3rem,7vw,6.5rem)] object-contain animate-bounce" alt="Mascote" />
                    <p className="text-base sm:text-2xl md:text-3xl text-white font-bold bg-white/10 px-5 py-2.5 rounded-full border border-white/20">
                        Retire no balcão agora!
                    </p>
                </div>
            </div>
            </div>
        )}

        {/* HEADER - RESPONSIVO E ADAPTÁVEL */}
        <header className="h-[clamp(3.5rem,8.5vh,5.75rem)] bg-gradient-to-b from-gray-900 via-gray-950 to-black border-b border-gray-800 flex items-center justify-between px-[clamp(0.75rem,2vw,2rem)] z-10 relative shadow-xl flex-shrink-0">
            
            {/* GRUPO ESQUERDA/CENTRO (Logo + Título) */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0">
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 animate-pulse"></div>
                    <img src={settings.mascotUrl} alt="Logo" className="h-[clamp(2.5rem,6vh,4.25rem)] w-[clamp(2.5rem,6vh,4.25rem)] object-contain relative z-10 drop-shadow" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                    <h1 className="text-[clamp(1.25rem,3.2vh,2.5rem)] font-black tracking-tighter text-white uppercase drop-shadow-md leading-none truncate" style={{ textShadow: '2px 2px 0 #ea580c' }}>
                        {settings.appName}
                    </h1>
                    <p className="text-gray-400 text-[clamp(0.65rem,1.4vh,0.95rem)] font-bold tracking-[0.15em] uppercase flex items-center gap-1.5 mt-0.5 truncate">
                        <ChefHat className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                        <span>Feira Cultural • {settings.schoolClass}</span>
                    </p>
                </div>
            </div>

            {/* GRUPO DIREITA (Relógio + Botão Tela Cheia TV) */}
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
                <div className="text-[clamp(1.4rem,3.5vh,2.75rem)] font-mono font-black text-white leading-none tracking-wider tabular-nums drop-shadow">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>

                <button
                    onClick={toggleFullscreen}
                    className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all shadow active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                    title={isFullscreen ? 'Sair da Tela Cheia (F)' : 'Tela Cheia TV (F)'}
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    <span className="hidden sm:inline text-[11px] uppercase tracking-wider">{isFullscreen ? 'Janela' : 'Tela Cheia'}</span>
                </button>
            </div>
        </header>

        {/* MAIN CONTENT - SPLIT 50/50 COM DISTRIBUIÇÃO VERTICAL INTELIGENTE */}
        <div className="flex-1 flex w-full relative min-h-0">
            
            {/* ESQUERDA: PREPARANDO (GRID FLUIDO) */}
            <div className="w-1/2 bg-[#1a1a1a] border-r border-gray-800 flex flex-col relative overflow-hidden">
                <div className="p-[clamp(0.4rem,1.4vh,0.9rem)] px-[clamp(0.75rem,2vw,1.5rem)] bg-gradient-to-r from-yellow-900/40 to-transparent border-b border-yellow-600/30 flex items-center gap-3 flex-shrink-0">
                    <ChefHat className="w-[clamp(1.25rem,3vh,2rem)] h-[clamp(1.25rem,3vh,2rem)] text-yellow-500 flex-shrink-0" />
                    <h2 className="text-[clamp(1rem,2.4vh,1.6rem)] font-black text-yellow-500 tracking-wider uppercase">PREPARANDO</h2>
                </div>
            
                <div className="flex-1 p-[clamp(0.5rem,1.5vmin,1.25rem)] overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-[clamp(0.4rem,1.2vmin,0.9rem)] content-start">
                        {preparingOrders.map(order => (
                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl aspect-[16/10] flex items-center justify-center shadow-inner animate-in fade-in duration-500">
                            <span className="text-[clamp(1.8rem,5.5vh,4rem)] font-black text-yellow-400/90 tracking-tighter">
                            #{order.orderNumber}
                            </span>
                        </div>
                        ))}
                        
                        {preparingOrders.length === 0 && (
                        <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 md:py-20 opacity-20">
                            <ChefHat className="w-12 h-12 md:w-16 md:h-16 text-white mb-3" />
                            <p className="text-base md:text-xl font-bold uppercase tracking-wider">Cozinha Livre</p>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DIREITA: PRONTO (LISTA INTELIGENTE QUE SE AJUSTA À ALTURA) */}
            <div className="w-1/2 bg-black flex flex-col relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="p-[clamp(0.4rem,1.4vh,0.9rem)] px-[clamp(0.75rem,2vw,1.5rem)] bg-gradient-to-r from-green-900/60 to-transparent border-b border-green-600/30 flex items-center gap-3 relative z-10 flex-shrink-0">
                    <CheckCircle2 className="w-[clamp(1.25rem,3vh,2rem)] h-[clamp(1.25rem,3vh,2rem)] text-green-400 flex-shrink-0" />
                    <h2 className="text-[clamp(1rem,2.4vh,1.6rem)] font-black text-green-400 tracking-wider uppercase">PRONTO</h2>
                </div>

                <div className="flex-1 p-[clamp(0.5rem,1.5vmin,1.25rem)] overflow-hidden relative z-10 flex flex-col gap-[clamp(0.3rem,0.9vh,0.75rem)]">
                    {readyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                            <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-white mb-4" />
                            <p className="text-lg md:text-2xl font-bold uppercase tracking-wider">Aguardando...</p>
                        </div>
                    ) : (
                        readyOrders.map((order, index) => {
                            const isFirst = index === 0;
                            
                            return (
                                <div 
                                    key={order.id}
                                    className={`flex-1 min-h-0 flex items-center justify-between rounded-xl shadow-lg transition-all duration-500 px-[clamp(0.75rem,2vw,1.5rem)]
                                    ${isFirst 
                                        ? 'bg-gradient-to-r from-green-700 to-green-600 border-2 border-white transform scale-[1.01] shadow-[0_0_30px_rgba(34,197,94,0.4)] z-10 flex-[1.25]' 
                                        : 'bg-gray-800/90 border border-gray-700 opacity-80'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 w-full justify-between">
                                        <span className={`font-bold uppercase tracking-widest ${isFirst ? 'text-green-100 text-[clamp(0.85rem,1.8vh,1.25rem)]' : 'text-gray-400 text-[clamp(0.7rem,1.5vh,1rem)]'}`}>
                                            SENHA
                                        </span>
                                        <div className="flex items-center gap-3">
                                            {isFirst && (
                                                <div className="animate-pulse bg-white text-green-700 text-[clamp(0.6rem,1.2vh,0.8rem)] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow">
                                                    Saiu Agora
                                                </div>
                                            )}
                                            <span className={`font-black leading-none tracking-tighter ${isFirst ? 'text-[clamp(2.2rem,7vh,4.75rem)] text-white drop-shadow' : 'text-[clamp(1.6rem,4.8vh,3.25rem)] text-green-400'}`}>
                                                #{order.orderNumber}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </div>
        
        {/* MARQUEE FOOTER (Dinâmico e Proporcional) */}
        <div className="bg-orange-600 h-[clamp(2.1rem,4.5vh,2.75rem)] flex items-center overflow-hidden relative border-t-2 md:border-t-4 border-orange-400 z-20 flex-shrink-0">
            <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] text-white font-black text-[clamp(0.75rem,1.8vh,1.1rem)] uppercase tracking-widest drop-shadow-md flex items-center gap-8">
               <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> {marqueeContent}</span>
            </div>
        </div>

      </div>

    </div>
  );
};

export default PublicDisplay;