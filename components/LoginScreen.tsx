import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { UserCircle2, Lock, ArrowRight, Smartphone } from 'lucide-react';

interface LoginScreenProps {
  availableUsers: User[];
  onLogin: (user: User) => void;
  onCustomerStart: () => void;
  settings: AppSettings; // Recebe configurações dinâmicas
}

const LoginScreen: React.FC<LoginScreenProps> = ({ availableUsers, onLogin, onCustomerStart, settings }) => {
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

  return (
    <div className="fixed inset-0 bg-orange-50 z-50 flex items-center justify-center overflow-hidden p-4">
      
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-200/40 via-transparent to-transparent pointer-events-none"></div>

      {/* Card Principal */}
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.15)] p-6 md:p-8 w-full max-w-sm border border-orange-100 flex flex-col items-center animate-in zoom-in-95 duration-300 relative z-10 max-h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
        
        {/* Decorative Fire Background Glow behind mascot */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-100/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Mascote (Tamanho Reduzido) */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 mb-1 flex-shrink-0">
          <div className="absolute inset-0 bg-orange-200 rounded-full blur-2xl opacity-40 scale-125 animate-pulse"></div>
          <img 
            src={settings.mascotUrl} // Dinâmico
            alt="Mascote" 
            className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-[0_5px_5px_rgba(0,0,0,0.2)] animate-mascot-slow"
          />
        </div>

        {/* Burning Title */}
        <h2 className="text-3xl md:text-4xl font-black mb-0.5 tracking-tighter text-fire text-center flex-shrink-0">
          {settings.appName} {/* Dinâmico */}
        </h2>
        
        {/* --- BOTÃO DE AUTOATENDIMENTO (CLIENTE) --- */}
        <div className="w-full mt-4 mb-6">
            <button 
                onClick={onCustomerStart}
                className="w-full bg-orange-600 text-white p-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-white/20 to-orange-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex flex-col items-center justify-center relative z-10">
                    <span className="flex items-center gap-2 font-black uppercase text-sm tracking-wider mb-1">
                        <Smartphone size={18} /> Sou Cliente
                    </span>
                    <span className="text-xs font-medium opacity-90">Toque aqui para fazer seu pedido</span>
                </div>
            </button>
            <div className="flex items-center gap-2 my-4 w-full">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Área Restrita</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-3 relative z-10 flex-shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-wider">Perfil</label>
            <div className="relative group">
              <UserCircle2 className="absolute left-3 top-3 text-orange-400 group-focus-within:text-orange-600 transition-colors" size={18} />
              <select 
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError(false);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-orange-100 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none appearance-none text-gray-700 font-bold text-sm transition-all cursor-pointer shadow-sm hover:border-orange-200"
                required
              >
                <option value="" disabled>Quem é você?</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-wider">Senha</label>
             <div className="relative group">
               <Lock className="absolute left-3 top-3 text-orange-400 group-focus-within:text-orange-600 transition-colors" size={18} />
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => {
                   setPassword(e.target.value);
                   setError(false);
                 }}
                 className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 bg-white focus:outline-none transition-all font-bold text-gray-700 tracking-widest text-sm
                   ${error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : 'border-orange-100 focus:border-orange-500 focus:ring-orange-500/10 hover:border-orange-200 shadow-sm'}`}
                 placeholder="••••"
               />
             </div>
             {error && (
               <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold ml-1 animate-in slide-in-from-top-1 duration-200">
                 <ArrowRight size={10} className="rotate-180" />
                 Senha incorreta.
               </div>
             )}
          </div>

          <button 
            type="submit"
            disabled={!selectedUserId || !password}
            className="w-full bg-gray-900 text-white font-black py-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-gray-200 hover:shadow-orange-300/50 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 overflow-hidden relative text-sm"
          >
            <span className="relative z-10 flex items-center gap-2">
              ACESSAR SISTEMA
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </span>
          </button>
        </form>
        
        {/* RODAPÉ DA ESCOLA */}
        <div className="mt-4 pt-3 border-t border-orange-100 w-full flex flex-col items-center gap-2 flex-shrink-0">
           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Projeto Feira Cultural</p>
           
           <div className="relative group cursor-help select-none mt-1"> 
             <div className="flex items-center gap-2 bg-gray-900 py-1.5 px-3 rounded-full shadow-md transform group-hover:scale-105 transition-all border border-gray-800 relative z-10 group-hover:border-orange-500/50">
                <div className="relative h-6 w-6 flex items-center justify-center origin-bottom">
                   <img src={settings.schoolLogoUrl} alt="Escola" className="w-full h-full object-contain relative z-20" /> {/* Dinâmico */}
                   <div className="absolute inset-0 bg-yellow-400 blur-md opacity-0 group-hover:opacity-40 z-10 rounded-full"></div>
                </div>
                <div className="h-3 w-px bg-gray-700 group-hover:bg-red-500 transition-colors"></div>
                <span className="text-yellow-400 font-black text-xs tracking-tighter group-hover:text-fire transition-all">
                  {settings.schoolClass} {/* Dinâmico */}
                </span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;