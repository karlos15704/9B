import React, { useState } from 'react';
import { User } from '../types';
import { X, Save, Lock, UserCircle2 } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => Promise<void>;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onUpdateUser }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
        setError('Digite uma nova senha.');
        return;
    }

    if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    if (newPassword.length < 4) {
        setError('A senha deve ter pelo menos 4 caracteres.');
        return;
    }

    setIsSaving(true);
    try {
        await onUpdateUser({ ...user, password: newPassword });
        alert('Senha alterada com sucesso!');
        onClose();
    } catch (err) {
        setError('Erro ao atualizar senha.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
                <UserCircle2 size={28} className="text-orange-500" />
                <div>
                    <h2 className="text-xl font-black uppercase tracking-wide">Meu Perfil</h2>
                    <p className="text-xs text-gray-400 font-bold">{user.name}</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start gap-3">
                <Lock className="text-orange-500 mt-1" size={20} />
                <div>
                    <h3 className="font-bold text-orange-800 text-sm mb-1">Alterar Senha</h3>
                    <p className="text-xs text-orange-700 leading-relaxed">
                        Defina uma nova senha para acessar sua conta. Mantenha-a segura!
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg p-3 font-bold text-gray-800 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="••••"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg p-3 font-bold text-gray-800 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="••••"
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Salvar Senha
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

// Ícone de loading que esqueci de importar no botão
function RefreshCw({ className, size }: { className?: string, size?: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size || 24} 
            height={size || 24} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
        </svg>
    )
}

export default UserProfileModal;
