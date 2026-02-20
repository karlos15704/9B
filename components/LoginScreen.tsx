import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { UserCircle2, Lock, ArrowRight, Smartphone, ChefHat, ArrowLeft, Store, Utensils } from 'lucide-react';

interface LoginScreenProps {
  availableUsers: User[];
  onLogin: (user: User) => void;
  onCustomerStart: () => void;
  settings: AppSettings;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ availableUsers, onLogin, onCustomerStart, settings }) => {
  const [isLoginView, setIsLoginView] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = availableUsers.find(u => u.id === selectedUserId);
    
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError(true);
      setPassword('');
    }
  };

  // --- TELA DE BOAS-VINDAS (CLIENTE) - NOVO LAYOUT FULL SCREEN ---
  if (!isLoginView) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col md:flex-row overflow-hidden bg-white">
        
        {/* LADO ESQUERDO (DESKTOP) / TOPO (MOBILE) - VISUAL IMPACTANTE */}
        <div className="relative w-full md:w-1/2 h-[45%] md:h-full bg-yellow-400 flex items-center justify-center overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-black">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ 
                backgroundImage: 'radial-gradient(#ea580c 2px, transparent 2px)', 
                backgroundSize: '24px 24px' 
            }}></div>

            {/* Sunburst Animation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-[200vmax] h-[200vmax] bg-[conic-gradient(from_0deg,transparent_0_15deg,#ea580c_15deg_30deg,transparent_30deg_45deg,#ea580c_45deg_60deg,transparent_60deg_75deg,#ea580c_75deg_90deg,transparent_90deg_105deg,#ea580c_105deg_120deg,transparent_120deg_135deg,#ea580c_135deg_150deg,transparent_150deg_165deg,#ea580c_165deg_180deg,transparent_180deg_195deg,#ea580c_195deg_210deg,transparent_210deg_225deg,#ea580c_225deg_240deg,transparent_240deg_255deg,#ea580c_255deg_270deg,transparent_270deg_285deg,#ea580c_285deg_300deg,transparent_300deg_315deg,#ea580c_315deg_330deg,transparent_330deg_345deg,#ea580c_345deg_360deg)] animate-[spin_60s_linear_infinite]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-6 animate-in zoom-in duration-500">
                {/* Mascote */}
                <div className="relative w-40 h-40 md:w-80 md:h-80 mb-4 md:mb-8 transition-transform hover:scale-105 duration-300">
                    <div className="absolute inset-0 bg-white rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-0"></div>
                    <img 
                        src={settings.mascotUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain relative z-10 p-4 drop-shadow-lg"
                    />
                    {/* Balão "Fome?!" */}
                    <div className="absolute -top-4 -right-8 md:top-0 md:-right-12 bg-white border-4 border-black px-3 py-1 md:px-5 md:py-2 rounded-2xl rounded-bl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce z-20 transform rotate-12">
                        <span className="font-black text-lg md:text-3xl text-black uppercase">Fome?!</span>
                    </div>
                </div>

                {/* Título */}
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] stroke-black leading-none" style={{ WebkitTextStroke: '1.5px black' }}>
                    {settings.appName}
                </h1>
            </div>
        </div>

        {/* LADO DIREITO (DESKTOP) / BAIXO (MOBILE) - AÇÕES */}
        <div className="w-full md:w-1/2 h-[55%] md:h-full bg-white flex flex-col items-center justify-center p-6 md:p-12 relative">
            
            <div className="w-full max-w-md flex flex-col gap-6 md:gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-black text-black mb-2 tracking-tight">Bora comer?</h2>
                    <p className="text-gray-500 font-bold text-lg md:text-xl">Faça seu pedido agora mesmo!</p>
                </div>

                {/* BOTÃO CLIENTE GIGANTE */}
                <button 
                    onClick={onCustomerStart}
                    className="w-full bg-red-500 text-white p-6 md:p-10 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all group relative overflow-hidden flex items-center justify-between"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-2xl md:text-4xl font-black uppercase tracking-wide leading-none mb-1">Sou Cliente</span>
                        <span className="text-xs md:text-sm font-bold text-yellow-200 uppercase tracking-wider bg-black/20 px-2 py-1 rounded">Toque para pedir</span>
                    </div>
                    <div className="bg-white/20 p-3 md:p-4 rounded-full border-2 border-white/30 group-hover:scale-110 transition-transform">
                        <Utensils size={32} md:size={48} className="text-white" strokeWidth={3} />
                    </div>
                </button>

                {/* DIVISOR */}
                <div className="flex items-center gap-4 w-full opacity-50">
                    <div className="h-1 bg-gray-200 flex-1 rounded-full"></div>
                    <span className="text-xs font-black text-gray-400 uppercase">OU</span>
                    <div className="h-1 bg-gray-200 flex-1 rounded-full"></div>
                </div>

                {/* BOTÃO EQUIPE */}
                <button 
                    onClick={() => setIsLoginView(true)}
                    className="w-full bg-gray-100 text-gray-800 p-4 rounded-2xl border-2 border-gray-300 hover:border-black hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 group"
                >
                    <Store size={20} className="text-gray-500 group-hover:text-black transition-colors" />
                    <span className="font-black uppercase tracking-wider text-sm">Acesso da Equipe</span>
                </button>

            </div>

            {/* RODAPÉ */}
            <div className="absolute bottom-6 left-0 w-full text-center opacity-60">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{settings.schoolClass} • Feira Cultural</p>
            </div>

        </div>

      </div>
    );
  }

  // --- TELA DE LOGIN (EQUIPE) - ESTILO COFRE/SECRETO ---
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="bg-white rounded-3xl border-4 border-black shadow-[10px_10px_0px_0px_#ea580c] p-8 w-full max-w-sm relative overflow-hidden">
        
        {/* Faixa de "Perigo" */}
        <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400 border-b-4 border-black" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>

        <button 
            onClick={() => setIsLoginView(false)}
            className="absolute top-6 left-4 p-2 text-black hover:bg-yellow-300 border-2 border-transparent hover:border-black rounded-lg transition-all"
            title="Voltar"
        >
            <ArrowLeft size={24} strokeWidth={3} />
        </button>

        <div className="flex flex-col items-center mb-6 mt-6">
            <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-3 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-3">
                <ChefHat size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Área Restrita</h2>
            <p className="text-xs text-white bg-black px-2 py-1 font-bold uppercase tracking-wider transform rotate-2">Somente Funcionários</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-black uppercase ml-1 tracking-wider">Quem é você?</label>
            <div className="relative group">
              <UserCircle2 className="absolute left-3 top-3.5 text-black z-10" size={20} strokeWidth={2.5} />
              <select 
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError(false);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-4 border-black bg-gray-50 focus:bg-yellow-50 focus:outline-none appearance-none text-black font-bold text-sm transition-all cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                required
              >
                <option value="" disabled>Selecione seu usuário</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-black text-black uppercase ml-1 tracking-wider">Senha Secreta</label>
             <div className="relative group">
               <Lock className="absolute left-3 top-3.5 text-black z-10" size={20} strokeWidth={2.5} />
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => {
                   setPassword(e.target.value);
                   setError(false);
                 }}
                 className={`w-full pl-10 pr-4 py-3 rounded-xl border-4 bg-gray-50 focus:bg-yellow-50 focus:outline-none transition-all font-bold text-black tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]
                   ${error ? 'border-red-500 bg-red-50' : 'border-black'}`}
                 placeholder="••••"
               />
             </div>
             {error && (
               <div className="flex items-center gap-1.5 text-white bg-red-600 px-2 py-1 rounded border-2 border-black text-[10px] font-bold ml-1 animate-bounce inline-block transform rotate-1">
                 <ArrowRight size={10} className="rotate-180" />
                 SENHA ERRADA!
               </div>
             )}
          </div>

          <button 
            type="submit"
            disabled={!selectedUserId || !password}
            className="w-full bg-black text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_#ea580c] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[2px] active:translate-y-[2px] active:shadow-none border-2 border-transparent hover:border-orange-500"
          >
            ENTRAR
            <ArrowRight size={20} strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;