import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction, AppSettings } from '../types';
import { ChefHat, CheckCircle2, AlertTriangle, Heart } from 'lucide-react';

interface PublicDisplayProps {
  transactions: Transaction[];
  settings: AppSettings; // Recebe configurações dinâmicas
}

// Som de Campainha de Atendimento (Fonte estável: Google Demo Assets - Glass Ting)
const BELL_SOUND_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/glass_ting.mp3";
const DONATION_SOUND_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/reward.mp3";

const PublicDisplay: React.FC<PublicDisplayProps> = ({ transactions, settings }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
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

  // Pedidos em Preparo (Exclui doações puras)
  const preparingOrders = useMemo(() => {
    return transactions
      .filter(t => 
        t.kitchenStatus === 'pending' && 
        t.status !== 'cancelled' && 
        t.timestamp >= startOfDay.getTime() &&
        !isPureDonation(t)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Pedidos Prontos (Limitado aos últimos 5 para ficarem GRANDES na TV)
  // Exclui doações puras para não aparecerem como "Senha Pronta"
  const readyOrders = useMemo(() => {
    return transactions
      .filter(t => 
        t.kitchenStatus === 'done' && 
        t.status !== 'cancelled' && 
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
        <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-between animate-in fade-in duration-700 overflow-hidden p-6 md:p-8">
            {/* Fundo com efeito de chamas */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="fire-container scale-[3] origin-bottom opacity-30">
                    <div className="flame-base"></div>
                    <div className="flame-body"></div>
                </div>
            </div>

            {/* BARRA SUPERIOR DO COMERCIAL */}
            <div className="relative z-20 w-full flex items-center justify-between px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                    <img src={settings.mascotUrl} className="h-10 w-10 object-contain drop-shadow" alt="Logo" />
                    <div>
                        <span className="font-black text-white text-base tracking-tight uppercase flex items-center gap-2">
                            {settings.appName}
                            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Comercial</span>
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{settings.schoolClass} • Feira Cultural</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
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
                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <span>Ver Pedidos</span>
                        <span>➔</span>
                    </button>
                </div>
            </div>

            {/* CONTEÚDO PRINCIPAL: VÍDEO OU SHOWCASE DE LANCHES */}
            <div className="relative z-10 flex-1 w-full flex items-center justify-center my-3">
                {commercialPhase === 'video' ? (
                    /* ETAPA 1: O VÍDEO CHAMARIS */
                    <div className="flex flex-col items-center justify-center w-full h-full max-w-5xl animate-in zoom-in-95 duration-500">
                        <div className="relative w-full max-h-[66vh] aspect-video rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(234,88,12,0.6)] border-4 border-yellow-400 ring-4 ring-orange-500/50 bg-black flex items-center justify-center">
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

                        <div className="mt-4 flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 px-8 py-2.5 rounded-full shadow-lg border-2 border-yellow-300 animate-pulse">
                            <span className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                                🔥 CORRA PRO BALCÃO OU PEÇA PELO TOTEM! 🔥
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ETAPA 2: SHOWCASE DE LANCHES E COMBOS */
                    <div className="flex flex-col items-center justify-center text-center w-full max-w-6xl animate-in fade-in zoom-in-95 duration-700">
                        <div className="mb-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter uppercase drop-shadow-lg">
                                BATEU AQUELA <span className="text-orange-500">FOME?</span>
                            </h2>
                            <p className="text-sm md:text-lg font-bold text-gray-300 uppercase tracking-widest mt-1">
                                Experimente nossos lanches quentinhos e crocantes feitos na hora!
                            </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">
                            {snacks.map((snack, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white/5 border-2 border-white/10 hover:border-orange-500/50 p-4 rounded-3xl flex flex-col items-center transform hover:scale-105 transition-all duration-300 shadow-xl relative overflow-hidden group"
                                >
                                    <span className="absolute top-2 left-2 bg-orange-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {snack.tag}
                                    </span>

                                    <div className="h-32 md:h-40 w-full mb-3 relative flex items-center justify-center">
                                        <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                                        <img src={snack.img} alt={snack.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" />
                                    </div>

                                    <h3 className="text-base font-black text-white uppercase mb-0.5 line-clamp-1">{snack.name}</h3>
                                    <p className="text-xs text-gray-400 font-medium mb-3 line-clamp-1">{snack.desc}</p>
                                    
                                    <span className="bg-orange-600 text-white px-4 py-1 rounded-xl font-black text-xl shadow-md border border-orange-400">
                                        {snack.price}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 bg-gradient-to-r from-orange-600 to-red-600 px-8 py-3 rounded-full shadow-[0_0_40px_rgba(234,88,12,0.5)] border-2 border-yellow-400 animate-bounce">
                            <span className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                                Peça já! Vem pro TÔ FRITO! 🍟🔥
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* RODAPÉ DO COMERCIAL COM INDICAÇÃO DE RETORNO AOS PEDIDOS */}
            <div className="relative z-20 w-full flex items-center justify-between px-6 py-2 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
                <div className="flex items-center gap-2 text-orange-300 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                    <span>{commercialPhase === 'video' ? 'Exibindo Vídeo Chamaris' : 'Exibindo Cardápio em Destaque'}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">Retornando aos pedidos em instantes</span>
                </div>

                {readyOrders.length > 0 && (
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg border border-green-500/40 text-green-300 font-mono font-bold text-xs">
                        <span>PRONTOS NO BALCÃO:</span>
                        <span className="font-black text-green-400">#{readyOrders.map(o => o.orderNumber).slice(0, 4).join(', #')}</span>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#0a0500] flex items-center justify-center overflow-hidden relative font-sans text-white p-6 md:p-8 lg:p-12">
      
      {/* === BACKGROUND FIRE ATMOSPHERE === */}
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/40 via-[#0a0500] to-black pointer-events-none"></div>
      
      {/* Ember Particles (Static Visuals) */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-orange-500 rounded-full blur-[2px] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-red-500 rounded-full blur-[4px] animate-bounce"></div>
      <div className="absolute top-1/2 left-5 w-1 h-1 bg-yellow-500 rounded-full blur-[1px]"></div>


      {/* === MOLDURA PRINCIPAL (SAFE ZONE) === */}
      {/* Container reduzido e centralizado com Borda de Fogo */}
      <div className="relative w-full h-full max-w-[1800px] max-h-[1000px] bg-black/80 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(234,88,12,0.4)] border-[6px] border-orange-900/50 ring-4 ring-orange-500/20 backdrop-blur-sm z-10">
        
        {/* Fire Border Animation Overlay */}
        <div className="absolute inset-0 rounded-2xl border-2 border-orange-500/30 pointer-events-none animate-pulse z-20"></div>

        {/* === MODO COMERCIAL === */}
        {displayMode === 'commercial' && !celebratingOrder && !celebratingDonation && renderCommercial()}

        {/* === OVERLAY DE DOAÇÃO (PRIORIDADE MÁXIMA) === */}
        {celebratingDonation && (
            <div className="absolute inset-0 z-[250] flex flex-col items-center justify-center bg-pink-900/95 backdrop-blur-xl animate-in zoom-in-90 duration-500">
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
                                width: `${Math.random() * 100 + 50}px`,
                                height: `${Math.random() * 100 + 50}px`,
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                animationDelay: `${Math.random()}s`
                            }}
                            fill="currentColor"
                        />
                    ))}
                 </div>

                 <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-5xl">
                    <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(236,72,153,0.6)] animate-bounce">
                        <Heart size={80} className="text-pink-600 fill-current" />
                    </div>
                    
                    <h1 className="text-[5vw] leading-none font-black text-white mb-6 drop-shadow-lg uppercase tracking-tight">
                        NOVA DOAÇÃO!
                    </h1>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl transform rotate-1">
                        <p className="text-[4vw] font-black text-pink-200 uppercase leading-tight mb-4">
                            {celebratingDonation.customerName || 'AMIGO'}
                        </p>
                        <p className="text-[2.5vw] font-bold text-white uppercase leading-tight">
                            MUITO OBRIGADO POR AJUDAR COM A NOSSA FORMATURA!
                        </p>
                    </div>
                    
                    <div className="mt-12 flex items-center gap-4 bg-pink-600/50 px-8 py-4 rounded-full border border-pink-400/30">
                        <span className="text-2xl font-bold text-white uppercase tracking-widest">TURMA 2026 AGRADECE ❤️</span>
                    </div>
                 </div>
            </div>
        )}

        {/* === OVERLAY DE CELEBRAÇÃO GIGANTE PARA TV === */}
        {celebratingOrder && !celebratingDonation && (
            <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in zoom-in-90 duration-300">
            
            {/* Fundo de Fogo */}
            <div className="absolute inset-0 opacity-60 overflow-hidden pointer-events-none">
                <div className="fire-container scale-[2] origin-bottom">
                    <div className="flame-base"></div>
                    <div className="flame-body"></div>
                    <div className="flame-core"></div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-4 w-full">
                <h1 className="text-[6vw] leading-none font-black text-white mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] uppercase tracking-tighter animate-pulse">
                    TÁ FRITOOOOO!!!!
                </h1>

                {/* Box da Senha */}
                <div className="bg-gradient-to-br from-orange-600 to-red-600 px-20 py-8 rounded-[3rem] shadow-[0_0_100px_rgba(234,88,12,0.8)] border-[6px] border-yellow-400 animate-cta-bounce transform rotate-[-2deg]">
                    <span className="block text-4xl text-yellow-200 font-bold uppercase tracking-[0.5em] mb-2">SENHA</span>
                    <span className="block text-[12vw] leading-none font-black text-white drop-shadow-xl">
                        #{celebratingOrder.orderNumber}
                    </span>
                </div>

                <div className="mt-12 flex items-center gap-4 animate-in slide-in-from-bottom-20 duration-1000">
                    <img src={settings.mascotUrl} className="h-32 w-32 object-contain animate-bounce" alt="Mascote" />
                    <p className="text-4xl text-white font-bold bg-white/10 px-6 py-3 rounded-full border border-white/20">
                        Retire no balcão agora!
                    </p>
                </div>
            </div>
            </div>
        )}

        {/* HEADER - CENTRALIZADO */}
        <header className="h-28 bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 flex items-center justify-center px-8 z-10 relative shadow-xl flex-shrink-0">
            
            {/* GRUPO CENTRAL (Logo + Título) */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 animate-pulse"></div>
                    <img src={settings.mascotUrl} alt="Logo" className="h-20 w-20 object-contain relative z-10" />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase drop-shadow-md leading-none" style={{ textShadow: '2px 2px 0 #ea580c' }}>
                        {settings.appName}
                    </h1>
                    <p className="text-gray-400 text-base font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 mt-1">
                        <ChefHat size={16} className="text-orange-500" />
                        Feira Cultural • {settings.schoolClass}
                    </p>
                </div>
            </div>

            {/* RELÓGIO (Posicionado Absolutamente à Direita) */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-right hidden lg:block">
                <div className="text-5xl font-mono font-black text-white leading-none tracking-wider tabular-nums">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </header>

        {/* MAIN CONTENT - SPLIT 50/50 */}
        <div className="flex-1 flex w-full relative min-h-0">
            
            {/* ESQUERDA: PREPARANDO (GRID) */}
            <div className="w-1/2 bg-[#1a1a1a] border-r border-gray-800 flex flex-col relative overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-yellow-900/40 to-transparent border-b border-yellow-600/30 flex items-center gap-4">
                    <ChefHat size={40} className="text-yellow-500" />
                    <h2 className="text-3xl font-black text-yellow-500 tracking-wider uppercase">PREPARANDO</h2>
                </div>
            
                <div className="flex-1 p-6 overflow-hidden">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                        {preparingOrders.map(order => (
                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl aspect-[16/9] flex items-center justify-center animate-in fade-in duration-500">
                            <span className="text-5xl xl:text-7xl font-black text-yellow-400/90 tracking-tighter">
                            #{order.orderNumber}
                            </span>
                        </div>
                        ))}
                        
                        {preparingOrders.length === 0 && (
                        <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 opacity-20">
                            <ChefHat size={80} className="text-white mb-4" />
                            <p className="text-2xl font-bold uppercase">Cozinha Livre</p>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DIREITA: PRONTO (LISTA) */}
            <div className="w-1/2 bg-black flex flex-col relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="p-5 bg-gradient-to-r from-green-900/60 to-transparent border-b border-green-600/30 flex items-center gap-4 relative z-10">
                    <CheckCircle2 size={40} className="text-green-400" />
                    <h2 className="text-3xl font-black text-green-400 tracking-wider uppercase">PRONTO</h2>
                </div>

                <div className="flex-1 p-6 overflow-hidden relative z-10 flex flex-col gap-3">
                    {readyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                            <CheckCircle2 size={100} className="text-white mb-6" />
                            <p className="text-3xl font-bold uppercase">Aguardando...</p>
                        </div>
                    ) : (
                        readyOrders.map((order, index) => {
                            const isFirst = index === 0;
                            
                            return (
                                <div 
                                    key={order.id}
                                    className={`flex items-center justify-between rounded-xl shadow-lg transition-all duration-500 px-6
                                    ${isFirst 
                                        ? 'bg-gradient-to-r from-green-700 to-green-600 border-2 border-white py-4 transform scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.4)] z-10' 
                                        : 'bg-gray-800 border border-gray-700 py-3 opacity-70'
                                    }`}
                                >
                                    <div className="flex items-baseline gap-4 w-full justify-between">
                                        <span className={`font-bold uppercase tracking-widest ${isFirst ? 'text-green-100 text-xl' : 'text-gray-500 text-lg'}`}>
                                            SENHA
                                        </span>
                                        <div className="flex items-center gap-4">
                                            {isFirst && <div className="animate-pulse bg-white text-green-700 text-xs font-black px-2 py-1 rounded uppercase">Saiu Agora</div>}
                                            <span className={`font-black leading-none tracking-tighter ${isFirst ? 'text-7xl text-white' : 'text-5xl text-green-500'}`}>
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
        
        {/* MARQUEE FOOTER (Dinâmico) */}
        <div className="bg-orange-600 h-12 flex items-center overflow-hidden relative border-t-4 border-orange-400 z-20 flex-shrink-0">
            <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] text-white font-black text-lg uppercase tracking-widest drop-shadow-md flex items-center gap-8">
               <span className="flex items-center gap-2"><AlertTriangle size={20}/> {marqueeContent}</span>
            </div>
        </div>

      </div>

    </div>
  );
};

export default PublicDisplay;