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

  // --- TELA DE BOAS-VINDAS (CLIENTE) - ESTILO GAME START ---
  if (!isLoginView) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-blue-600 font-sans">
        
        {/* BACKGROUND ANIMADO (Pixel Art / Game) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
        }}></div>
        
        {/* Círculos flutuantes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-hard-light filter blur-xl opacity-60 animate-bounce delay-700"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-500 rounded-full mix-blend-hard-light filter blur-xl opacity-60 animate-bounce"></div>

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl px-4">
            
            {/* TURMA EM DESTAQUE (Topo) */}
            <div className="mb-8 animate-in slide-in-from-top duration-700">
                <div className="bg-white text-blue-600 px-8 py-2 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
                    <span className="text-2xl md:text-4xl font-black uppercase tracking-widest">{settings.schoolClass || '9ºB'}</span>
                </div>
            </div>

            {/* LOGO E TÍTULO */}
            <div className="relative mb-12 group cursor-pointer" onClick={onCustomerStart}>
                <div className="absolute inset-0 bg-white rounded-full scale-110 blur-md opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                <img 
                    src={settings.mascotUrl} 
                    alt="Mascote" 
                    className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap z-20">
                    <span className="font-black text-xs uppercase">Estou com fome!</span>
                </div>
            </div>

            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] stroke-black leading-none transform hover:scale-105 transition-transform" style={{ WebkitTextStroke: '3px black' }}>
                {settings.appName}
            </h1>

            {/* BOTÃO START (Gigante) */}
            <button 
                onClick={onCustomerStart}
                className="group relative inline-flex items-center justify-center gap-4 bg-green-500 text-white px-12 py-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all mb-12"
            >
                <Smartphone size={40} className="animate-wiggle" strokeWidth={2.5} />
                <div className="flex flex-col items-start">
                    <span className="text-3xl md:text-5xl font-black uppercase tracking-wide leading-none">START</span>
                    <span className="text-xs md:text-sm font-bold text-green-900 uppercase tracking-widest bg-green-400 px-2 rounded">Toque para começar</span>
                </div>
                <ArrowRight size={40} className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </button>

            {/* ACESSO EQUIPE (Rodapé) */}
            <button 
                onClick={() => setIsLoginView(true)}
                className="text-white/80 hover:text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 bg-black/20 px-6 py-3 rounded-full hover:bg-black/40 transition-all border border-white/10"
            >
                <Store size={16} />
                Área Restrita (Equipe)
            </button>

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