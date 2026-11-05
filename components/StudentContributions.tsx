import React, { useState, useMemo } from 'react';
import { Contribution, User } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Plus, Trash2, Search, Calendar, User as UserIcon, DollarSign, HandCoins, CheckCircle2, Edit3, X } from 'lucide-react';
import { createContribution, deleteContribution, updateContribution } from '../services/supabase';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface StudentContributionsProps {
  contributions: Contribution[];
  currentUser: User | null;
}

const StudentContributions: React.FC<StudentContributionsProps> = ({ contributions, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContrib, setEditingContrib] = useState<Contribution | null>(null);
  
  const isProfessor = currentUser?.id === '0' || currentUser?.role === 'admin';

  // Form State
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [monthReference, setMonthReference] = useState(MONTHS[new Date().getMonth()]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !amount) return;

    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
        alert("Valor inválido");
        return;
    }

    const dateParts = paymentDate.split('-');
    const timestamp = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0).getTime();

    const newContrib: Contribution = {
        id: generateId(),
        studentName,
        amount: val,
        monthReference,
        paymentDate: timestamp,
        registeredBy: 'Professor'
    };

    const success = await createContribution(newContrib);
    if (success) {
        setStudentName('');
        setAmount('');
        // A atualização local acontece via subscription no App.tsx
        alert("Contribuição registrada!");
    } else {
        alert("Erro ao salvar contribuição.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrib) return;

    const success = await updateContribution(editingContrib);
    if (success) {
        setEditingContrib(null);
        // A atualização local acontece via subscription no App.tsx
        alert("Registro atualizado!");
    } else {
        alert("Erro ao atualizar registro.");
    }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir este registro?")) {
          const success = await deleteContribution(id);
          if (success) {
              // A atualização local acontece via subscription no App.tsx
          }
      }
  };

  const aggregatedContributions = useMemo(() => {
      // Agrupar por nome (case insensitive e trim)
      const groups = contributions.reduce((acc: { [key: string]: Contribution }, c) => {
          const nameKey = c.studentName.toLowerCase().trim();
          if (!acc[nameKey]) {
              acc[nameKey] = { 
                ...c, 
                studentName: c.studentName.trim(), 
                amount: c.amount,
                paymentDate: c.paymentDate
              };
          } else {
              acc[nameKey].amount += c.amount;
              if (c.paymentDate > acc[nameKey].paymentDate) {
                  acc[nameKey].paymentDate = c.paymentDate;
              }
          }
          return acc;
      }, {});
      
      const aggregated = Object.values(groups) as Contribution[];
      
      return aggregated
        .sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt', { sensitivity: 'base' }))
        .filter(c => c.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [contributions, searchTerm]);

  const totalCollected = useMemo(() => {
      return contributions.reduce((acc, c) => acc + c.amount, 0);
  }, [contributions]);

  return (
    <div className="h-full bg-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <HandCoins className="text-emerald-600" />
                    CONTRIBUIÇÕES DOS ALUNOS
                </h2>
                <p className="text-gray-500 text-sm">Controle de caixa da Feira Cultural</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider">Total Arrecadado</span>
                <span className="text-xl leading-none">{formatCurrency(totalCollected)}</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Formuário */}
                {isProfessor && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                        <Plus size={20} className="text-emerald-500"/> Registrar Pagamento
                    </h3>
                    <form onSubmit={handleAddContribution} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome Completo do Aluno</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    value={studentName} 
                                    onChange={e => setStudentName(e.target.value)} 
                                    placeholder="Ex: Maria Eduarda Silva" 
                                    className="w-full pl-10 border-2 border-gray-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-emerald-500" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        placeholder="0.00" 
                                        className="w-full pl-10 border-2 border-gray-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-emerald-500" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mês Referência</label>
                                <select 
                                    value={monthReference} 
                                    onChange={e => setMonthReference(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                                >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data do Pagamento</label>
                            <input 
                                type="date" 
                                value={paymentDate} 
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                            />
                        </div>

                        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                            <CheckCircle2 size={20} /> CONFIRMAR PAGAMENTO
                        </button>
                    </form>
                </div>
                )}

                {/* Lista */}
                <div className={`flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 ${isProfessor ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Resumo por Aluno (Ordem Alfabética)</h3>
                        <div className="relative w-48">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Buscar aluno..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-7 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Aluno</th>
                                    <th className="px-4 py-3 font-bold">Último Pagto</th>
                                    <th className="px-4 py-3 font-bold text-right">Total Acumulado</th>
                                    {isProfessor && <th className="px-4 py-3 font-bold text-center">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contributions.length === 0 ? (
                                    <tr><td colSpan={isProfessor ? 4 : 3} className="p-8 text-center text-gray-400">Nenhuma contribuição encontrada.</td></tr>
                                ) : (
                                    aggregatedContributions.map(contrib => (
                                        <tr key={contrib.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-bold text-gray-700">{contrib.studentName}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {new Date(contrib.paymentDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-emerald-600">
                                                {formatCurrency(contrib.amount)}
                                            </td>
                                            {isProfessor && (
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => setEditingContrib(contrib)} className="text-gray-300 hover:text-blue-500 transition-colors p-1 mr-2" title="Editar este registro">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(contrib.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Excluir este registro">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingContrib && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative">
                            <button onClick={() => setEditingContrib(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                            <h3 className="font-bold text-gray-800 mb-6 text-lg">Editar Contribuição</h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Aluno</label>
                                    <input type="text" value={editingContrib.studentName} onChange={e => setEditingContrib({...editingContrib, studentName: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Valor (R$)</label>
                                    <input type="number" step="0.01" value={editingContrib.amount} onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        setEditingContrib({...editingContrib, amount: isNaN(val) ? 0 : val});
                                    }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Data do Pagamento</label>
                                    <input type="date" value={new Date(editingContrib.paymentDate).toISOString().split('T')[0]} onChange={e => {
                                        const dateParts = e.target.value.split('-');
                                        const ts = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0).getTime();
                                        setEditingContrib({...editingContrib, paymentDate: ts});
                                    }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setEditingContrib(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">Salvar Alterações</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default StudentContributions;