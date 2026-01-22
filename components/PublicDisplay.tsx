import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { ChefHat, CheckCircle2, Flame, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { MASCOT_URL, APP_NAME, SCHOOL_CLASS } from '../constants';

interface PublicDisplayProps {
  transactions: Transaction[];
}

// Som de Campainha de Atendimento (Fonte estável: Google Demo Assets - Glass Ting)
const BELL_SOUND_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/glass_ting.mp3";

const PublicDisplay: React.FC<PublicDisplayProps> = ({ transactions }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado para controlar a animação de celebração (Pedido Atualmente na Tela)
  const [celebratingOrder, setCelebratingOrder] = useState<Transaction | null>(null);
  
  // FILA DE CELEBRAÇÃO: Armazena pedidos que precisam ser mostrados
  const [celebrationQueue, setCelebrationQueue] = useState<Transaction[]>([]);
  
  // Histórico de IDs processados para não repetir o mesmo pedido
  const processedOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Pedidos em Preparo
  const preparingOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'pending' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Pedidos Prontos (Limitado aos últimos 5 para ficarem GRANDES na TV)
  const readyOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'done' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5); // Reduzido para 5 para caber melhor na safe zone
  }, [transactions]);

  // --- FUNÇÃO DE ÁUDIO MELHORADA ---
  const playAudio = (orderNumber: string) => {
    // Criação do objeto de áudio com tratamento de erro
    const audio = new Audio(BELL_SOUND_URL);
    audio.volume = 0.7; // Volume confortável
    
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
            const text = `Senha ${orderNumber}.`;
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

  // === LÓGICA DE DETECÇÃO DE NOVOS PEDIDOS ===
  useEffect(() => {
    if (isFirstLoadRef.current) {
        if (readyOrders.length > 0) {
            readyOrders.forEach(t => processedOrderIdsRef.current.add(t.id));
        }
        isFirstLoadRef.current = false;
        return;
    }

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
  }, [readyOrders]);

  // === LÓGICA DE PROCESSAMENTO DA FILA ===
  useEffect(() => {
    if (!celebratingOrder && celebrationQueue.length > 0) {
        const nextOrder = celebrationQueue[0];
        setCelebratingOrder(nextOrder);
        playAudio(nextOrder.orderNumber);
        setCelebrationQueue(prev => prev.slice(1));
    }
  }, [celebratingOrder, celebrationQueue]);

  useEffect(() => {
    if (celebratingOrder) {
      const timer = setTimeout(() => {
        setCelebratingOrder(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [celebratingOrder]);

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

        {/* === OVERLAY DE CELEBRAÇÃO GIGANTE PARA TV === */}
        {celebratingOrder && (
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
                    <img src={MASCOT_URL} className="h-32 w-32 object-contain animate-bounce" alt="Mascote" />
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
                    <img src={MASCOT_URL} alt="Logo" className="h-20 w-20 object-contain relative z-10" />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase drop-shadow-md leading-none" style={{ textShadow: '2px 2px 0 #ea580c' }}>
                        {APP_NAME}
                    </h1>
                    <p className="text-gray-400 text-base font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 mt-1">
                        <ChefHat size={16} className="text-orange-500" />
                        Feira Cultural • {SCHOOL_CLASS}
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
        
        {/* MARQUEE FOOTER */}
        <div className="bg-orange-600 h-12 flex items-center overflow-hidden relative border-t-4 border-orange-400 z-20 flex-shrink-0">
            <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] text-white font-black text-lg uppercase tracking-widest drop-shadow-md flex items-center gap-8">
               <span className="flex items-center gap-2"><AlertTriangle size={20}/> RETIRE SEU PEDIDO IMEDIATAMENTE</span>
               <span>•</span>
               <span>BOM APETITE!</span>
               <span>•</span>
               <span>{APP_NAME}</span>
               <span>•</span>
               <span>EVITE FILAS, PEÇA COM ANTECEDÊNCIA</span>
               <span>•</span>
               <span className="flex items-center gap-2"><AlertTriangle size={20}/> RETIRE SEU PEDIDO IMEDIATAMENTE</span>
               <span>•</span>
               <span>BOM APETITE!</span>
            </div>
        </div>

      </div>

    </div>
  );
};

export default PublicDisplay;