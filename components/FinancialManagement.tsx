import React, { useState, useEffect, useMemo } from 'react';
import { Product, Expense, Transaction } from '../types';
import { generateId, formatCurrency } from '../utils';
import { 
  DollarSign, TrendingDown, TrendingUp, Package, Barcode, 
  Search, Plus, Save, Trash2, Calendar, Wallet, ShoppingBag, 
  ArrowRight, Filter, AlertCircle, Upload, FileText, Image as ImageIcon, Loader2, Layers, Minus
} from 'lucide-react';
import { createExpense, deleteExpense, fetchExpenses, uploadReceiptImage } from '../services/supabase';

interface FinancialManagementProps {
  products: Product[];
  transactions: Transaction[]; // Para calcular o faturamento total
  onUpdateProduct: (product: Product) => void;
}

type Tab = 'cashflow' | 'inventory';

const FinancialManagement: React.FC<FinancialManagementProps> = ({ products, transactions, onUpdateProduct }) => {
  const [activeTab, setActiveTab] = useState<Tab>('cashflow');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- STATES DE ESTOQUE ---
  const [stockSearch, setStockSearch] = useState('');

  // --- STATES DE DESPESAS ---
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'compra' | 'retirada' | 'pagamento' | 'outros'>('compra');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Carregar despesas ao montar
  useEffect(() => {
    const loadExpenses = async () => {
      setIsLoading(true);
      const data = await fetchExpenses();
      setExpenses(data);
      setIsLoading(false);
    };
    loadExpenses();
  }, []);

  // --- CÁLCULOS FINANCEIROS ---
  const financialSummary = useMemo(() => {
    // Apenas transações concluídas e não canceladas contam como entrada
    const totalSales = transactions
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + t.total, 0);

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const balance = totalSales - totalExpenses;

    return { totalSales, totalExpenses, balance };
  }, [transactions, expenses]);

  // --- HANDLERS FINANCEIROS ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
        alert("Valor inválido");
        return;
    }

    setIsUploading(true);
    let receiptUrl = undefined;

    // Upload da Nota Fiscal se houver
    if (receiptFile) {
        const url = await uploadReceiptImage(receiptFile);
        if (url) {
            receiptUrl = url;
        } else {
            alert("Erro ao fazer upload da imagem. A despesa será salva sem a foto.");
        }
    }

    const newExpense: Expense = {
      id: generateId(),
      description: desc,
      amount: val,
      category,
      timestamp: Date.now(),
      registeredBy: 'Professor',
      receiptUrl: receiptUrl
    };

    const success = await createExpense(newExpense);
    setIsUploading(false);

    if (success) {
      setExpenses([newExpense, ...expenses]);
      setDesc('');
      setAmount('');
      setReceiptFile(null); // Limpa o arquivo
      alert("Despesa registrada com sucesso!");
    } else {
      alert("Erro ao salvar despesa.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      const success = await deleteExpense(id);
      if (success) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    }
  };

  // --- HANDLERS ESTOQUE ---
  const handleUpdateStock = (product: Product, newStock: number) => {
    if (product.comboItems && product.comboItems.length > 0) {
        alert("O estoque de combos é calculado automaticamente baseado nos ingredientes.");
        return;
    }

    const stockVal = Math.max(0, newStock);
    // CORREÇÃO: Se o estoque for maior que 0, força a disponibilidade para TRUE.
    // Se for 0, força para FALSE (Esgotado).
    onUpdateProduct({ 
        ...product, 
        stock: stockVal,
        isAvailable: stockVal > 0 
    });
  };
  
  const handleUpdateBarcode = (product: Product, code: string) => {
    onUpdateProduct({ ...product, barcode: code });
  };

  // Helper para calcular estoque virtual de combo
  const getDisplayStock = (product: Product) => {
    if (product.comboItems && product.comboItems.length > 0) {
        let minStock = 999999;
        product.comboItems.forEach(item => {
            const ingredient = products.find(p => p.id === item.productId);
            if (ingredient && typeof ingredient.stock === 'number') {
                const possibleCombos = Math.floor(ingredient.stock / item.quantity);
                if (possibleCombos < minStock) minStock = possibleCombos;
            } else {
                minStock = 0;
            }
        });
        return minStock === 999999 ? 0 : minStock;
    }
    return product.stock || 0;
  };

  // --- ORDENAÇÃO ESTÁVEL PARA EVITAR PULO ---
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => 
        p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(stockSearch))
      )
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordena por nome SEMPRE
  }, [products, stockSearch]);

  return (
    <div className="h-full bg-slate-100 flex flex-col overflow-hidden">
      
      {/* HEADER TABS */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
         <div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <Wallet className="text-emerald-600" />
                CENTRAL FINANCEIRA
            </h2>
            <p className="text-gray-500 text-sm">Controle de entradas, saídas e estoque.</p>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('cashflow')}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'cashflow' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <DollarSign size={16}/> Fluxo de Caixa
            </button>
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Package size={16}/> Estoque
            </button>
         </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* --- ABA FLUXO DE CAIXA --- */}
        {activeTab === 'cashflow' && (
            <div className="space-y-6">
                {/* Resumo Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase">Entradas (Vendas)</p>
                            <h3 className="text-3xl font-black text-emerald-600">{formatCurrency(financialSummary.totalSales)}</h3>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><TrendingUp size={24}/></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase">Saídas (Despesas)</p>
                            <h3 className="text-3xl font-black text-red-500">-{formatCurrency(financialSummary.totalExpenses)}</h3>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full text-red-500"><TrendingDown size={24}/></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase">Saldo em Caixa</p>
                            <h3 className={`text-3xl font-black ${financialSummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(financialSummary.balance)}</h3>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Wallet size={24}/></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form de Nova Despesa */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                            <TrendingDown size={20} className="text-red-500"/> Registrar Saída / Compra
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição do Gasto</label>
                                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Compra de Gelo" className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-red-500" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-red-500" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                                <select value={category} onChange={(e: any) => setCategory(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-red-500">
                                    <option value="compra">Compra de Insumos</option>
                                    <option value="retirada">Retirada / Sangria</option>
                                    <option value="pagamento">Pagamento de Serviço</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>
                            
                            {/* Input de Nota Fiscal */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Foto da Nota Fiscal</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        id="receipt-upload"
                                        className="hidden"
                                        onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                                    />
                                    <label 
                                        htmlFor="receipt-upload" 
                                        className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors ${receiptFile ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-blue-400 text-gray-500'}`}
                                    >
                                        {receiptFile ? (
                                            <>
                                                <ImageIcon size={18} />
                                                <span className="text-xs font-bold truncate max-w-[200px]">{receiptFile.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                <span className="text-xs font-bold">Enviar Foto (Opcional)</span>
                                            </>
                                        )}
                                    </label>
                                    {receiptFile && (
                                        <button 
                                            type="button" 
                                            onClick={() => setReceiptFile(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isUploading} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'REGISTRAR SAÍDA'}
                            </button>
                        </form>
                    </div>

                    {/* Lista de Movimentações */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Histórico de Saídas</h3>
                            <button onClick={() => {}} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"><Filter size={12}/> Filtrar</button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[500px]">
                            {expenses.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                    <ShoppingBag size={48} className="mb-2 opacity-20"/>
                                    <p>Nenhuma despesa registrada.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 font-bold">Descrição</th>
                                            <th className="px-4 py-3 font-bold">Categoria</th>
                                            <th className="px-4 py-3 font-bold">Nota</th>
                                            <th className="px-4 py-3 font-bold">Data</th>
                                            <th className="px-4 py-3 font-bold text-right">Valor</th>
                                            <th className="px-4 py-3 font-bold text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {expenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-gray-50 group">
                                                <td className="px-4 py-3 font-bold text-gray-700">{exp.description}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">{exp.category}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {exp.receiptUrl ? (
                                                        <a 
                                                            href={exp.receiptUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded w-fit"
                                                            title="Ver Nota Fiscal"
                                                        >
                                                            <FileText size={14} />
                                                            <span className="text-xs font-bold">Ver</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(exp.timestamp).toLocaleDateString()} {new Date(exp.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                                <td className="px-4 py-3 text-right font-black text-red-500">-{formatCurrency(exp.amount)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ABA ESTOQUE --- */}
        {activeTab === 'inventory' && (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar produto ou código de barras..." 
                            value={stockSearch}
                            onChange={e => setStockSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                        />
                     </div>
                     <div className="text-sm text-gray-500 font-medium">
                        Exibindo {filteredProducts.length} produtos
                     </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Produto</th>
                                <th className="px-6 py-4 font-bold">Código de Barras</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-center">Editar Estoque</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(product => {
                                const isCombo = !!(product.comboItems && product.comboItems.length > 0);
                                const displayStock = getDisplayStock(product);
                                
                                return (
                                <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 relative">
                                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                {isCombo && (
                                                    <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-0.5 border border-white">
                                                        <Layers size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 flex items-center gap-1">
                                                    {product.name}
                                                    {isCombo && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded uppercase">Combo</span>}
                                                </p>
                                                <p className="text-xs text-gray-500">{product.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 w-fit">
                                            <Barcode size={14} className="text-gray-400"/>
                                            <input 
                                                type="text" 
                                                placeholder="Sem código"
                                                value={product.barcode || ''}
                                                onChange={(e) => handleUpdateBarcode(product, e.target.value)}
                                                className="bg-transparent text-xs font-mono font-bold text-gray-700 w-32 outline-none"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex flex-col items-center justify-center px-4 py-1 rounded-lg border ${displayStock > 10 ? 'bg-green-50 border-green-100 text-green-700' : displayStock > 0 ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                            <span className="text-lg font-black">{displayStock}</span>
                                            <span className="text-[9px] font-bold uppercase">{isCombo ? 'Calculado' : 'Unidades'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!isCombo ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleUpdateStock(product, (product.stock || 0) - 1)} className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"><Minus size={16}/></button>
                                                
                                                {/* INPUT DIRETO DE ESTOQUE */}
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={product.stock || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) handleUpdateStock(product, val);
                                                    }}
                                                    className="w-16 h-8 text-center font-black text-gray-800 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                                />

                                                <button onClick={() => handleUpdateStock(product, (product.stock || 0) + 1)} className="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"><Plus size={16}/></button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Automático</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="p-10 text-center text-gray-400">
                            Nenhum produto encontrado.
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default FinancialManagement;