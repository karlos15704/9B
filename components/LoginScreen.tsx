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

  // --- TELA DE BOAS-VINDAS (CLIENTE) - ESTILO CARTOON / POP ART ---
  if (!isLoginView) {
    return (
      <div className="fixed inset-0 bg-yellow-400 z-50 flex flex-col items-center justify-center overflow-hidden relative">
        
        {/* Background Pattern (Bolinhas Pop Art) */}
        <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'radial-gradient(#ea580c 2px, transparent 2px)', 
            backgroundSize: '20px 20px' 
        }}></div>

        {/* Raios de Sol Girando (Animação Lenta) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
             <div className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,transparent_0_15deg,#ea580c_15deg_30deg,transparent_30deg_45deg,#ea580c_45deg_60deg,transparent_60deg_75deg,#ea580c_75deg_90deg,transparent_90deg_105deg,#ea580c_105deg_120deg,transparent_120deg_135deg,#ea580c_135deg_150deg,transparent_150deg_165deg,#ea580c_165deg_180deg,transparent_180deg_195deg,#ea580c_195deg_210deg,transparent_210deg_225deg,#ea580c_225deg_240deg,transparent_240deg_255deg,#ea580c_255deg_270deg,transparent_270deg_285deg,#ea580c_285deg_300deg,transparent_300deg_315deg,#ea580c_315deg_330deg,transparent_330deg_345deg,#ea580c_345deg_360deg)] animate-[spin_60s_linear_infinite]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6 text-center">
            
            {/* Logo / Mascote Grande com Borda Grossa */}
            <div className="relative w-56 h-56 mb-4 animate-bounce hover:scale-110 transition-transform duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-white rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-0"></div>
                <img 
                    src={settings.mascotUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain relative z-10 p-4 drop-shadow-lg"
                />
                {/* Balão de Fala */}
                <div className="absolute -top-6 -right-10 bg-white border-4 border-black px-4 py-2 rounded-2xl rounded-bl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse z-20 transform rotate-6">
                    <span className="font-black text-xl text-black uppercase">Fome?!</span>
                </div>
            </div>

            {/* Título Estilo Gibi */}
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>
                {settings.appName}
            </h1>
            <p className="text-xl text-black font-black bg-white px-4 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2 mb-10 transform hover:rotate-0 transition-transform">
                O LANCHE MAIS TOP DA FEIRA!
            </p>

            {/* BOTÃO PRINCIPAL (CLIENTE) - Estilo Botão de Arcade */}
            <button 
                onClick={onCustomerStart}
                className="w-full bg-red-500 text-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all group relative overflow-hidden mb-8"
            >
                <div className="flex items-center justify-center gap-4 relative z-10">
                    <Utensils size={40} className="text-yellow-300 animate-wiggle" strokeWidth={3} />
                    <div className="flex flex-col items-start">
                        <span className="text-3xl font-black uppercase tracking-wide leading-none drop-shadow-md">QUERO COMER!</span>
                        <span className="text-sm font-bold text-yellow-200 uppercase tracking-wider">Clique para pedir agora</span>
                    </div>
                </div>
            </button>

            {/* Botão Discreto da Equipe - Estilo "Selo" */}
            <button 
                onClick={() => setIsLoginView(true)}
                className="text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 hover:scale-105 transition-all"
            >
                <Store size={14} strokeWidth={3} />
                Área da Equipe
            </button>

            {/* Rodapé Escola */}
            <div className="mt-8 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="bg-black text-white px-2 py-1 font-black text-[10px] uppercase rounded">Projeto</div>
                <span className="text-xs font-black text-black uppercase">{settings.schoolClass} • Feira Cultural</span>
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