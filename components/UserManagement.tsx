import React, { useState, useMemo, useEffect } from 'react';
import { User, AppModules } from '../types';
import { generateId } from '../utils';
import { MODULE_LABELS, DEFAULT_ROLE_PERMISSIONS } from '../services/constants';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, Save, X, Key, Crown, ChefHat, Store, Lock, MonitorPlay, Briefcase, CheckSquare, Square } from 'lucide-react';

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

  // Níveis de Permissão
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const canManageUsers = isAdmin || isManager;

  // Filtra quais usuários serão exibidos
  const displayedUsers = useMemo(() => {
    if (canManageUsers) {
      return users;
    }
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser, canManageUsers]);

  // Form State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('staff');
  const [permissions, setPermissions] = useState<Partial<AppModules>>({});

  const resetForm = () => {
    setName('');
    setPassword('');
    setRole('staff');
    setPermissions(DEFAULT_ROLE_PERMISSIONS['staff']);
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const openEdit = (user: User) => {
    // Gerente não pode editar Admins ou outros Gerentes (exceto ele mesmo se a lógica permitisse, mas vamos restringir)
    if (isManager && (user.role === 'admin' || (user.role === 'manager' && user.id !== currentUser.id))) {
        alert("Gerentes não podem editar Professores ou outros Gerentes.");
        return;
    }

    setEditingUser(user);
    setName(user.name);
    setPassword(user.password);
    setRole(user.role);
    // Se o usuário já tem permissões salvas, usa elas. Se não, usa o padrão do cargo.
    setPermissions(user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role]);
    setIsModalOpen(true);
  };

  // Atualiza permissões padrão quando troca o cargo (apenas se for novo usuário ou se quiser resetar)
  const handleRoleChange = (newRole: User['role']) => {
    setRole(newRole);
    // Opcional: Resetar permissões ao mudar cargo? 
    // Vamos manter as permissões atuais se já foram editadas, ou carregar o default se for "novo"
    // Mas para simplificar, vamos carregar o default do novo cargo para facilitar
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole]);
  };

  const togglePermission = (module: keyof AppModules) => {
    setPermissions(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name,
        password,
        role,
        permissions
      });
    } else {
      const newUser: User = {
        id: generateId(),
        name,
        password,
        role,
        permissions
      };
      onAddUser(newUser);
    }
    resetForm();
  };

  // Regras de Edição do Formulário (Modal)
  // REGRA 1: Nomes só podem ser editados pelo Admin. 
  // Se for um NOVO usuário (!editingUser), o Gerente pode escrever o nome. 
  // Se for EDIÇÃO, o Gerente só mexe na senha/role.
  const canEditName = !editingUser || isAdmin;
  
  // REGRA 2: Senha pode ser editada por quem tem permissão de gerir
  const canEditPassword = canManageUsers || !editingUser;

  return (
    <div className="p-6 h-full overflow-y-auto bg-orange-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-orange-600" />
            {canManageUsers ? 'Gerenciamento de Equipe' : 'Meu Perfil'}
          </h2>
          <p className="text-gray-500 text-sm">
            {canManageUsers 
              ? 'Adicione ou remova acesso ao sistema.' 
              : 'Gerencie sua senha de acesso.'}
          </p>
        </div>
        
        {canManageUsers && (
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
          const isProfessorId = user.id === '0'; 
          const isAdminRole = user.role === 'admin';
          const isManagerRole = user.role === 'manager';
          const isSelf = user.id === currentUser.id;

          // Permissões de Botão (Lista)
          const isTargetSuperior = user.role === 'admin' || (user.role === 'manager' && isManager);
          
          // Editar: Admin edita todos. Gerente edita subordinados e a si mesmo.
          const showEditButton = isAdmin || (isManager && (!isTargetSuperior || isSelf));

          // Excluir: Admin exclui todos (exceto si/Master). Gerente exclui subordinados.
          const showDeleteButton = !isSelf && !isProfessorId && (isAdmin || (isManager && !isTargetSuperior));

          let RoleIcon = UserIcon;
          let roleColorClass = 'bg-gray-100 text-gray-500';
          let roleLabel = 'Caixa'; 

          if (user.role === 'admin') {
            RoleIcon = Crown;
            roleColorClass = 'bg-orange-600 text-white';
            roleLabel = 'Professor / Admin';
          } else if (user.role === 'manager') {
            RoleIcon = Briefcase;
            roleColorClass = 'bg-indigo-100 text-indigo-600';
            roleLabel = 'Gerente';
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
            <div key={user.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col relative group hover:shadow-md transition-shadow ${isAdminRole ? 'bg-orange-50 border-orange-200' : isManagerRole ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-orange-100'}`}>
              
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
                {isProfessorId && <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">MASTER</span>}
              </h3>
              <span className={`text-xs font-bold uppercase tracking-wider mb-4 
                ${user.role === 'admin' ? 'text-orange-600' : 
                  user.role === 'manager' ? 'text-indigo-600' :
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
                  placeholder="Ex: João Silva"
                  required
                />
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
                  placeholder="Ex: 1234"
                  required
                />
              </div>

              {/* Seletor de Cargo */}
              {editingUser?.id !== '0' && canManageUsers && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Função / Cargo</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('staff')}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'staff' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <Store size={20} />
                      Caixa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('kitchen')}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'kitchen' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <ChefHat size={20} />
                      Cozinha
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('display')}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'display' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <MonitorPlay size={20} />
                      Telão
                    </button>
                    
                    {/* Apenas Admin pode criar Admin ou Gerente */}
                    {isAdmin && (
                        <>
                            <button
                            type="button"
                            onClick={() => handleRoleChange('manager')}
                            className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'manager' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                            >
                            <Briefcase size={20} />
                            Gerente
                            </button>

                            <button
                            type="button"
                            onClick={() => handleRoleChange('admin')}
                            className={`p-2 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-colors ${role === 'admin' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                            >
                            <Shield size={20} />
                            Professor
                            </button>
                        </>
                    )}
                  </div>

                  {/* PERMISSÕES GRANULARES */}
                  {isAdmin && (
                    <div className="border-t border-gray-100 pt-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Permissões de Acesso</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(MODULE_LABELS) as Array<keyof AppModules>).map((moduleKey) => (
                          <button
                            key={moduleKey}
                            type="button"
                            onClick={() => togglePermission(moduleKey)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all
                              ${permissions[moduleKey] 
                                ? 'bg-orange-50 border-orange-200 text-orange-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                              }`}
                          >
                            {permissions[moduleKey] ? <CheckSquare size={16} className="text-orange-500" /> : <Square size={16} />}
                            {MODULE_LABELS[moduleKey]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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