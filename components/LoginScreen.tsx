import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { UserCircle2, Lock, ArrowRight, Smartphone, ChefHat, ArrowLeft, Store, Utensils, X } from 'lucide-react';

interface LoginScreenProps {
  availableUsers: User[];
  onLogin: (user: User) => void;
  onCustomerStart: () => void;
  settings: AppSettings;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ availableUsers, onLogin, onCustomerStart, settings }) => {
  const [isLoginView, setIsLoginView] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-blue-600 font-sans custom-scrollbar">
        
        {/* BACKGROUND ANIMADO (Pixel Art / Game) */}
        <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
        }}></div>
        
        {/* Círculos flutuantes */}
        <div className="fixed top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-hard-light filter blur-xl opacity-60 animate-bounce delay-700 pointer-events-none"></div>
        <div className="fixed bottom-20 right-20 w-48 h-48 bg-pink-500 rounded-full mix-blend-hard-light filter blur-xl opacity-60 animate-bounce pointer-events-none"></div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4 w-full max-w-4xl mx-auto text-center">
            
            {/* TURMA EM DESTAQUE (Topo) */}
            <div className="mb-8 animate-in slide-in-from-top duration-700">
                <div className="bg-white text-blue-600 px-8 py-2 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
                    <span className="text-2xl md:text-4xl font-black uppercase tracking-widest">{settings.schoolClass || '9ºB'}</span>
                </div>
            </div>

            {/* LOGO E TÍTULO */}
            <div className="relative mb-8 md:mb-12 group cursor-pointer" onClick={onCustomerStart}>
                <div className="absolute inset-0 bg-white rounded-full scale-110 blur-md opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                <img 
                    src={settings.mascotUrl} 
                    alt="Mascote" 
                    className="w-40 h-40 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300"
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

            {/* BOTÕES SECUNDÁRIOS */}
            <div className="flex flex-col md:flex-row gap-4 items-center pb-8">
                <button 
                    onClick={() => setIsGalleryOpen(true)}
                    className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 bg-pink-500 px-6 py-3 rounded-full hover:bg-pink-600 transition-all border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none"
                >
                    <Utensils size={18} />
                    Galeria da Turma
                </button>

                <button 
                    onClick={() => setIsLoginView(true)}
                    className="text-white/80 hover:text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 bg-black/20 px-6 py-3 rounded-full hover:bg-black/40 transition-all border border-white/10"
                >
                    <Store size={16} />
                    Área Restrita
                </button>
            </div>

        </div>

        {/* MODAL DA GALERIA */}
        {isGalleryOpen && (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
                <div className="p-4 flex justify-between items-center bg-black/50 border-b border-white/10 z-50">
                    <h2 className="text-white font-black text-xl uppercase tracking-widest flex items-center gap-2">
                        <Utensils className="text-pink-500" /> Galeria {settings.schoolClass}
                    </h2>
                    <button onClick={() => setIsGalleryOpen(false)} className="text-white hover:text-pink-500 transition-colors bg-white/10 p-2 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {(!settings.galleryImages || settings.galleryImages.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/50">
                            <Utensils size={64} className="mb-4 opacity-20" />
                            <p className="font-bold text-xl">Ainda não temos fotos!</p>
                            <p className="text-sm">Peça para o professor adicionar algumas.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
                            {settings.galleryImages.map((img, idx) => (
                                <div 
                                    key={img.id} 
                                    onClick={() => setSelectedImage(img.url)}
                                    className="group relative aspect-square bg-gray-800 rounded-2xl overflow-hidden border-4 border-white shadow-2xl transform hover:scale-105 transition-transform duration-300 rotate-1 hover:rotate-0 cursor-pointer"
                                >
                                    <img src={img.url} className="w-full h-full object-cover" alt="Galeria" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <span className="text-white font-bold text-sm">Ver Foto</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MODAL DE IMAGEM GRANDE (LIGHTBOX TEMA TÔ FRITO) */}
                {selectedImage && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in zoom-in duration-300" onClick={() => setSelectedImage(null)}>
                        <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            
                            {/* MOLDURA TEMA TÔ FRITO */}
                            <div className="relative bg-orange-500 p-2 md:p-4 rounded-3xl shadow-[0_0_50px_rgba(234,88,12,0.5)] border-4 border-yellow-400 transform rotate-1">
                                {/* Detalhes da Moldura (Cantos) */}
                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-400 rounded-full border-4 border-black z-20"></div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full border-4 border-black z-20"></div>
                                <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-yellow-400 rounded-full border-4 border-black z-20"></div>
                                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full border-4 border-black z-20"></div>

                                {/* Container da Imagem */}
                                <div className="bg-black rounded-2xl overflow-hidden border-4 border-black relative">
                                    <img src={selectedImage} className="max-h-[80vh] w-auto object-contain" alt="Zoom" />
                                </div>

                                {/* Logo/Mascote na Moldura */}
                                <div className="absolute -bottom-8 right-8 w-20 h-20 md:w-32 md:h-32 transform rotate-12 drop-shadow-2xl z-30 pointer-events-none">
                                    <img src={settings.mascotUrl} className="w-full h-full object-contain" alt="Mascote" />
                                </div>

                                {/* Botão Fechar */}
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-6 -right-6 bg-red-600 text-white p-3 rounded-full border-4 border-black hover:scale-110 transition-transform shadow-lg z-40"
                                >
                                    <X size={24} strokeWidth={3} />
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        )}

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