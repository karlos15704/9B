import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, Save, X, Key, Crown, ChefHat, Store, Lock, MonitorPlay } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Verifica se quem está logado é Admin (Gerente) ou Master (Professor)
  const isAdminOrMaster = currentUser.role === 'admin' || currentUser.id === '0';

  // Filtra quais usuários serão exibidos
  const displayedUsers = useMemo(() => {
    if (isAdminOrMaster) {
      return users;
    }
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser, isAdminOrMaster]);

  // Form State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'kitchen' | 'display'>('staff');

  const resetForm = () => {
    setName('');
    setPassword('');
    setRole('staff');
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setPassword(user.password);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name,
        password,
        role
      });
    } else {
      const newUser: User = {
        id: generateId(),
        name,
        password,
        role
      };
      onAddUser(newUser);
    }
    resetForm();
  };

  // Regras de Edição do Formulário (Modal)
  const canEditName = !editingUser || currentUser.id === '0';
  
  // Regra de Senha:
  // 1. Professor pode editar qualquer senha.
  // 2. Se for novo usuário, pode editar.
  // 3. Se for editar usuário existente:
  //    - Se o alvo for outro Admin e eu não for o Professor, NÃO pode.
  const isTargetAnotherAdmin = editingUser?.role === 'admin' && editingUser?.id !== currentUser.id;
  const canEditPassword = currentUser.id === '0' || !editingUser || !isTargetAnotherAdmin;

  return (
    <div className="p-6 h-full overflow-y-auto bg-orange-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-orange-600" />
            {isAdminOrMaster ? 'Gerenciamento de Equipe' : 'Meu Perfil'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isAdminOrMaster 
              ? 'Adicione ou remova acesso ao sistema.' 
              : 'Gerencie sua senha de acesso.'}
          </p>
        </div>
        
        {isAdminOrMaster && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            NOVO USUÁRIO
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedUsers.map(user => {
          const isProfessor = user.id === '0';
          const isCurrentUserMaster = currentUser.id === '0';
          const isTargetAdmin = user.role === 'admin';
          const isSelf = user.id === currentUser.id;

          // LOGICA DE VISIBILIDADE DOS BOTÕES
          // 1. Botão Editar:
          //    - Visível se EU sou o Professor.
          //    - OU se EU sou o próprio usuário (editar meu perfil).
          //    - OU se o ALVO NÃO for Admin/Professor (eu sou gerente editando caixa/cozinha).
          const showEditButton = isCurrentUserMaster || isSelf || (!isTargetAdmin && !isProfessor);

          // 2. Botão Excluir:
          //    - Visível se EU sou Admin/Master.
          //    - E o alvo NÃO sou eu mesmo.
          //    - E (EU sou Master OU o alvo NÃO é Admin/Professor).
          const showDeleteButton = isAdminOrMaster && !isSelf && (isCurrentUserMaster || (!isTargetAdmin && !isProfessor));

          let RoleIcon = UserIcon;
          let roleColorClass = 'bg-gray-100 text-gray-500';
          let roleLabel = 'Caixa'; 

          if (user.role === 'admin') {
            RoleIcon = isProfessor ? Crown : Shield;
            roleColorClass = isProfessor ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600';
            roleLabel = isProfessor ? 'Super Admin' : 'Gerente / Admin';
          } else if (user.role === 'kitchen') {
            RoleIcon = ChefHat;
            roleColorClass = 'bg-blue-100 text-blue-600';
            roleLabel = 'Cozinha / Expedição';
          } else if (user.role === 'display') {
            RoleIcon = MonitorPlay;
            roleColorClass = 'bg-purple-100 text-purple-600';
            roleLabel = 'Telão / Display';
          } else {
            RoleIcon = Store;
            roleColorClass = 'bg-green-100 text-green-600';
            roleLabel = 'Caixa';
          }

          return (
            <div key={user.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col relative group hover:shadow-md transition-shadow ${isProfessor ? 'bg-orange-50 border-orange-200' : 'bg-white border-orange-100'}`}>
              
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full ${roleColorClass}`}>
                    <RoleIcon size={24} />
                </div>
                <div className="flex gap-1">
                  {showEditButton && (
                    <button 
                      onClick={() => openEdit(user)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}

                  {showDeleteButton && (
                    <button 
                        onClick={() => {
                          if(window.confirm(`Tem certeza que deseja remover ${user.name}?`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {user.name}
                {isProfessor && <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">MASTER</span>}
              </h3>
              <span className={`text-xs font-bold uppercase tracking-wider mb-4 
                ${user.role === 'admin' ? 'text-orange-500' : 
                  user.role === 'kitchen' ? 'text-blue-500' : 
                  user.role === 'display' ? 'text-purple-600' :
                  'text-green-600'}`}>
                {roleLabel}
              </span>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-gray-400 text-sm">
                <Key size={14} />
                <span>Senha: ••••</span>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {editingUser ? <Edit2 size={20}/> : <Plus size={20}/>}
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={resetForm} className="hover:bg-gray-700 p-1 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-1">
                  Nome do Funcionário
                  {!canEditName && <Lock size={12} className="text-orange-500" />}
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={!canEditName}
                  className={`w-full border-2 rounded-xl p-3 focus:outline-none font-bold text-gray-700 
                    ${canEditName 
                      ? 'border-gray-200 focus:border-orange-500 bg-white' 
                      : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  placeholder="Ex: Telão"
                  required
                />
                {!canEditName && (
                  <p className="text-[10px] text-orange-500 mt-1">Apenas o Professor pode alterar nomes existentes.</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-1">
                    Senha de Acesso (Numérica)
                    {!canEditPassword && <Lock size={12} className="text-orange-500" />}
                </label>
                <input 
                  type="text" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={!canEditPassword}
                  className={`w-full border-2 rounded-xl p-3 focus:outline-none font-bold text-gray-700 tracking-widest
                    ${canEditPassword 
                      ? 'border-gray-200 focus:border-orange-500 bg-white' 
                      : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  placeholder="Ex: 0"
                  required
                />
                {!canEditPassword && (
                  <p className="text-[10px] text-orange-500 mt-1">Gerentes não podem alterar senhas de outros gerentes.</p>
                )}
              </div>

              {editingUser?.id !== '0' && isAdminOrMaster && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Função / Cargo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('staff')}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'staff' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <Store size={20} />
                      Caixa
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('kitchen')}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'kitchen' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <ChefHat size={20} />
                      Cozinha
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('display')}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'display' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <MonitorPlay size={20} />
                      Telão
                    </button>
                    
                    {/* Apenas o Professor (ID 0) pode criar novos Gerentes */}
                    {currentUser.id === '0' && (
                        <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'admin' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                        <Shield size={20} />
                        Gerente
                        </button>
                    )}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-4"
              >
                <Save size={20} />
                SALVAR DADOS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;