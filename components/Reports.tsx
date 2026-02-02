import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, PaymentMethod, User, Expense, Contribution } from '../types';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Trash2, AlertTriangle, FileText, XCircle, Ban, Users, Calendar, CalendarDays, CalendarRange, Filter, ArrowRight, ArrowDownCircle, ArrowUpCircle, Receipt, LayoutDashboard, ListPlus, HandCoins } from 'lucide-react';
import { APP_NAME } from '../services/constants';
import { fetchExpenses, fetchContributions } from '../services/supabase';

interface ReportsProps {
  transactions: Transaction[];
  onCancelTransaction: (transactionId: string) => void;
  onResetSystem: () => void;
  currentUser: User | null;
}

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74']; // Orange scale
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type DateRangeType = 'day' | 'week' | 'month' | 'year' | 'custom';
type ViewType = 'dashboard' | 'ledger';

const Reports: React.FC<ReportsProps> = ({ transactions, onCancelTransaction, onResetSystem, currentUser }) => {
  // --- ESTADOS DE DADOS ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // --- ESTADOS DE FILTRO ---
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('day');
  
  // Datas atuais para inicialização
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState(now.toISOString().split('T')[0]); // YYYY-MM-DD
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); // Índice da semana no array de semanas

  // Estados para Período Personalizado
  const [customStartDate, setCustomStartDate] = useState(now.toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(now.toISOString().split('T')[0]);

  // Reset System State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  // Cancel Transaction State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<{id: string, number: string} | null>(null);
  const [cancelPassword, setCancelPassword] = useState('');

  const isProfessor = currentUser?.id === '0';

  // CARREGAR DADOS FINANCEIROS ADICIONAIS
  useEffect(() => {
    fetchExpenses().then(data => setExpenses(data || []));
    fetchContributions().then(data => setContributions(data || []));
  }, []);

  // --- HELPER: CALCULAR SEMANAS DO MÊS ---
  const weeksInMonth = useMemo(() => {
    const weeks = [];
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    
    let currentStart = new Date(firstDayOfMonth);
    let weekCount = 1;

    while (currentStart <= lastDayOfMonth) {
      const dayOfWeek = currentStart.getDay();
      const daysToSaturday = 6 - dayOfWeek;
      
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + daysToSaturday);
      
      if (currentEnd > lastDayOfMonth) {
        currentEnd = new Date(lastDayOfMonth);
      }
      
      const start = new Date(currentStart);
      start.setHours(0,0,0,0);
      
      const end = new Date(currentEnd);
      end.setHours(23,59,59,999);

      weeks.push({
        label: `${weekCount}ª Semana (${start.getDate()}/${selectedMonth + 1} - ${end.getDate()}/${selectedMonth + 1})`,
        start,
        end
      });

      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      weekCount++;
    }
    return weeks;
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    setSelectedWeekIndex(0);
  }, [selectedYear, selectedMonth]);


  // --- LÓGICA DE FILTRAGEM UNIFICADA (VENDAS + DESPESAS + CONTRIBUIÇÕES) ---
  const { filteredTransactions, filteredExpenses, filteredContributions, periodLabel } = useMemo(() => {
    let start: Date, end: Date;
    let label = "";

    if (dateRangeType === 'day') {
      const dateParts = selectedDay.split('-'); // YYYY-MM-DD
      start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 0, 0, 0, 0);
      end = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 23, 59, 59, 999);
      label = `DIA ${start.toLocaleDateString('pt-BR')}`;
    } 
    else if (dateRangeType === 'week') {
      const weekData = weeksInMonth[selectedWeekIndex];
      if (weekData) {
        start = weekData.start;
        end = weekData.end;
        label = `${weekData.label.toUpperCase()} DE ${MONTHS[selectedMonth].toUpperCase()}/${selectedYear}`;
      } else {
        start = new Date(); end = new Date();
      }
    } 
    else if (dateRangeType === 'month') {
      start = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      label = `MÊS DE ${MONTHS[selectedMonth].toUpperCase()}/${selectedYear}`;
    } 
    else if (dateRangeType === 'year') { 
      start = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      label = `ANO DE ${selectedYear}`;
    }
    else { // custom
      const startParts = customStartDate.split('-');
      const endParts = customEndDate.split('-');
      start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0, 0);
      end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59, 999);
      label = `PERÍODO: ${start.toLocaleDateString('pt-BR')} ATÉ ${end.toLocaleDateString('pt-BR')}`;
    }

    const fTransactions = transactions.filter(t => t.timestamp >= start.getTime() && t.timestamp <= end.getTime());
    const fExpenses = expenses.filter(e => e.timestamp >= start.getTime() && e.timestamp <= end.getTime());
    const fContributions = contributions.filter(c => c.paymentDate >= start.getTime() && c.paymentDate <= end.getTime());

    return { filteredTransactions: fTransactions, filteredExpenses: fExpenses, filteredContributions: fContributions, periodLabel: label };
  }, [transactions, expenses, contributions, dateRangeType, selectedDay, selectedYear, selectedMonth, selectedWeekIndex, weeksInMonth, customStartDate, customEndDate]);


  // --- UNIFICAÇÃO PARA EXTRATO (LEDGER) ---
  const unifiedLedger = useMemo(() => {
    const entries = [
      ...filteredTransactions.map(t => ({
        type: 'IN' as const,
        date: t.timestamp,
        id: t.id,
        description: `Venda #${t.orderNumber}`,
        details: t.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        amount: t.total,
        category: t.paymentMethod,
        isCancelled: t.status === 'cancelled',
        originalRef: t
      })),
      ...filteredExpenses.map(e => ({
        type: 'OUT' as const,
        date: e.timestamp,
        id: e.id,
        description: e.description,
        details: e.category.toUpperCase(),
        amount: e.amount,
        category: 'Despesa',
        isCancelled: false,
        originalRef: e
      })),
      ...filteredContributions.map(c => ({
        type: 'IN' as const,
        date: c.paymentDate,
        id: c.id,
        description: `Contribuição - ${c.studentName}`,
        details: `Ref: ${c.monthReference}`,
        amount: c.amount,
        category: 'Contribuição Escolar',
        isCancelled: false,
        originalRef: c
      }))
    ];
    return entries.sort((a, b) => b.date - a.date); // Mais recente primeiro
  }, [filteredTransactions, filteredExpenses, filteredContributions]);

  // --- ESTATÍSTICAS ---
  const stats = useMemo(() => {
    const activeTransactions = filteredTransactions.filter(t => t.status !== 'cancelled');
    
    const salesIncome = activeTransactions.reduce((acc, t) => acc + t.total, 0);
    const contributionsIncome = filteredContributions.reduce((acc, c) => acc + c.amount, 0);
    const totalIncome = salesIncome + contributionsIncome;

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    const averageTicket = activeTransactions.length > 0 ? salesIncome / activeTransactions.length : 0;
    
    // By Payment Method
    const byMethod = activeTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
      return acc;
    }, {} as Record<string, number>);

    // Add Contributions to method breakdown (conceptually)
    if (contributionsIncome > 0) {
        byMethod['Contribuições'] = contributionsIncome;
    }

    // By Seller
    const bySeller = activeTransactions.reduce((acc, t) => {
      const seller = t.sellerName || 'N/A';
      if (!acc[seller]) acc[seller] = { count: 0, total: 0 };
      acc[seller].count += 1;
      acc[seller].total += t.total;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Aggregate Products
    const productSales: Record<string, { quantity: number; total: number }> = {};
    activeTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { quantity: 0, total: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].total += item.price * item.quantity;
      });
    });

    const chartData = Object.keys(byMethod).map(method => ({
      name: method,
      value: byMethod[method]
    }));

    return { totalIncome, totalExpenses, balance, averageTicket, chartData, byMethod, bySeller, productSales, contributionsIncome };
  }, [filteredTransactions, filteredExpenses, filteredContributions]);

  // --- ACTIONS ---
  const handleSystemReset = () => {
    if (resetPassword === '0') {
      onResetSystem();
      setShowResetModal(false);
      setResetPassword('');
    } else {
      alert('Senha incorreta.');
    }
  };

  const handleConfirmCancel = () => {
    if (cancelPassword === '0') {
      if (transactionToCancel) {
        onCancelTransaction(transactionToCancel.id);
        setShowCancelModal(false);
        setTransactionToCancel(null);
        setCancelPassword('');
      }
    } else {
      alert('Senha Administrativa Incorreta.');
    }
  };

  const generatePrintWindow = () => {
    const printWindow = window.open('', '', 'width=850,height=600');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let content = '';

    // --- MODO EXTRATO DETALHADO (LIVRO CAIXA) ---
    if (currentView === 'ledger') {
        const rows = unifiedLedger.map(entry => {
            const color = entry.isCancelled ? '#999' : entry.type === 'IN' ? '#000' : '#d00';
            const sign = entry.isCancelled ? '' : entry.type === 'IN' ? '+' : '-';
            const decoration = entry.isCancelled ? 'text-decoration: line-through;' : '';
            
            return `
            <tr style="color: ${color}; ${decoration}">
                <td style="padding: 6px 0; border-bottom: 1px solid #eee;">${new Date(entry.date).toLocaleDateString()} ${new Date(entry.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #eee;">
                    <strong>${entry.description}</strong><br/>
                    <span style="font-size: 10px; color: #666;">${entry.details}</span>
                </td>
                <td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: center;">${entry.category}</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                    ${sign} ${formatCurrency(entry.amount)}
                </td>
            </tr>
            `;
        }).join('');

        content = `
          <h2>LIVRO CAIXA - EXTRATO DETALHADO</h2>
          <div class="summary-box">
             <p>ENTRADAS: <span style="color: green;">${formatCurrency(stats.totalIncome)}</span></p>
             <p>SAÍDAS: <span style="color: red;">-${formatCurrency(stats.totalExpenses)}</span></p>
             <p class="total">SALDO: ${formatCurrency(stats.balance)}</p>
          </div>
          <table>
            <thead>
              <tr style="border-bottom: 2px solid #000;">
                <th width="15%" align="left">Data/Hora</th>
                <th width="50%" align="left">Descrição / Produtos</th>
                <th width="15%" align="center">Tipo</th>
                <th width="20%" align="right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `;
    } 
    // --- MODO DASHBOARD (RESUMO GERENCIAL) ---
    else {
        // (Código de impressão do dashboard anterior...)
        const productRows = (Object.entries(stats.productSales) as [string, { quantity: number; total: number }][])
        .sort(([, a], [, b]) => b.quantity - a.quantity)
        .map(([name, data]) => `
            <tr>
            <td style="padding: 4px 0; border-bottom: 1px solid #eee;">${name}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: center;">${data.quantity}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(data.total)}</td>
            </tr>
        `).join('');

        const sellerRows = (Object.entries(stats.bySeller) as [string, { count: number; total: number }][])
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([name, data]) => `
            <tr>
            <td style="padding: 4px 0; border-bottom: 1px solid #eee;">${name}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: center;">${data.count}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(data.total)}</td>
            </tr>
        `).join('');

        const paymentRows = (Object.entries(stats.byMethod) as [string, number][])
        .map(([method, value]) => `
            <tr>
            <td style="padding: 4px 0;">${method}</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold;">${formatCurrency(value)}</td>
            </tr>
        `).join('');

        content = `
            <h2>RELATÓRIO GERENCIAL</h2>
            <div class="summary-box">
                <p>FATURAMENTO BRUTO: <strong>${formatCurrency(stats.totalIncome)}</strong></p>
                <p>GASTOS TOTAIS: <span style="color: red;">-${formatCurrency(stats.totalExpenses)}</span></p>
                <p class="total">LUCRO LÍQUIDO: ${formatCurrency(stats.balance)}</p>
            </div>

            <p style="font-size:11px;">* Inclui ${formatCurrency(stats.contributionsIncome)} em contribuições escolares.</p>

            <h3>Ranking Vendedores</h3>
            <table><thead><tr style="border-bottom: 1px solid #000;"><th align="left">Nome</th><th align="center">Qtd</th><th align="right">Total</th></tr></thead><tbody>${sellerRows}</tbody></table>
            
            <h3>Entradas por Tipo</h3>
            <table>${paymentRows}</table>

            <h3>Produtos Vendidos</h3>
            <table><thead><tr style="border-bottom: 1px solid #000;"><th style="text-align: left;">Item</th><th style="text-align: center;">Qtd</th><th style="text-align: right;">Total</th></tr></thead><tbody>${productRows}</tbody></table>
        `;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Relatório - ${APP_NAME}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 100%; margin: 0 auto; color: #000; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 5px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h2 { font-size: 16px; text-align: center; margin-top: 5px; text-transform: uppercase; background: #eee; padding: 5px; }
            h3 { font-size: 14px; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase; }
            p { font-size: 12px; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            .summary-box { border: 1px solid #000; padding: 10px; margin: 15px 0; display: flex; justify-content: space-between; font-size: 14px; }
            .total { font-weight: bold; border-left: 1px solid #ccc; padding-left: 15px; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
            .period-box { text-align: center; margin: 10px 0; font-weight: bold; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${APP_NAME}</h1>
          <div class="period-box">${periodLabel}</div>
          <p style="text-align: center; font-size: 10px;">Gerado em: ${dateStr}</p>
          
          ${content}

          <div class="footer">
            <p>Sistema Escolar: ${APP_NAME} - Relatório Oficial</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6 relative bg-gray-50/50">
      
      {/* MODAIS (RESET E CANCELAMENTO) PERMANECEM IGUAIS */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={24} />
              ZERAR BANCO DE DADOS?
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed bg-red-50 p-3 rounded-lg border border-red-100">
              Isso apagará <strong>TODAS AS VENDAS</strong> do banco de dados online. Esta ação é irreversível.
            </p>
            <div className="mb-4">
               <label className="text-xs font-bold text-gray-500 uppercase">Senha do Professor</label>
               <input type="password" className="w-full border-2 border-red-100 bg-red-50 p-2 rounded-lg mt-1 focus:outline-none focus:border-red-500" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleSystemReset} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">APAGAR TUDO</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <XCircle className="text-red-600" size={24} />
              Estornar Venda #{transactionToCancel?.number}
            </h3>
            <div className="mb-4">
               <label className="text-xs font-bold text-gray-500 uppercase">Senha Administrativa</label>
               <input type="password" className="w-full border-2 border-red-100 bg-red-50 p-2 rounded-lg mt-1 focus:outline-none focus:border-red-500" value={cancelPassword} onChange={e => setCancelPassword(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowCancelModal(false); setTransactionToCancel(null); setCancelPassword(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleConfirmCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">ESTORNAR</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CABEÇALHO SUPERIOR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-2">
        <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Relatórios & Extratos</h2>
            <p className="text-sm text-gray-500">Acompanhamento financeiro completo</p>
        </div>
        
        {/* VIEW SWITCHER TABS */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
            <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${currentView === 'dashboard' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <LayoutDashboard size={16}/> Dashboard
            </button>
            <button 
                onClick={() => setCurrentView('ledger')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${currentView === 'ledger' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <ListPlus size={16}/> Extrato Detalhado
            </button>
        </div>
      </div>

      {/* --- BARRA DE FILTROS DE DATA (IGUAL PARA AMBAS AS VISÕES) --- */}
      <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase mr-2 flex items-center gap-1"><Filter size={12}/> Período:</span>
            {['day', 'week', 'month', 'year', 'custom'].map((type) => (
                <button 
                    key={type}
                    onClick={() => setDateRangeType(type as DateRangeType)} 
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${dateRangeType === type ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    {type === 'day' ? 'Dia' : type === 'week' ? 'Semana' : type === 'month' ? 'Mês' : type === 'year' ? 'Ano' : 'Personalizado'}
                </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {dateRangeType !== 'day' && dateRangeType !== 'custom' && (
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none">
                    {[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            )}
            {(dateRangeType === 'month' || dateRangeType === 'week') && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none">
                    {MONTHS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                </select>
            )}
            {dateRangeType === 'week' && (
                <select value={selectedWeekIndex} onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none min-w-[200px]">
                    {weeksInMonth.map((w, idx) => <option key={idx} value={idx}>{w.label}</option>)}
                </select>
            )}
            {dateRangeType === 'day' && (
                <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none" />
            )}
            {dateRangeType === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none" />
                    <ArrowRight size={16} className="text-gray-400" />
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none" />
                </div>
            )}
            
            <div className="flex-1"></div>
            
            <button onClick={generatePrintWindow} className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 shadow-md shadow-orange-200 flex items-center gap-2">
                <FileText size={16} /> IMPRIMIR {currentView === 'ledger' ? 'EXTRATO' : 'RELATÓRIO'}
            </button>
            {isProfessor && (
                <button onClick={() => setShowResetModal(true)} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 border border-red-200 flex items-center gap-2">
                    <Trash2 size={16} /> ZERAR TUDO
                </button>
            )}
          </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      
      {/* 1. DASHBOARD VIEW (Gráficos) */}
      {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full text-green-600"><DollarSign size={24} /></div>
                <div><p className="text-xs font-bold uppercase text-gray-400">Entradas (Vendas + Contrib.)</p><h3 className="text-2xl font-black text-gray-900">{formatCurrency(stats.totalIncome)}</h3></div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600"><TrendingUp size={24} className="transform rotate-180" /></div>
                <div><p className="text-xs font-bold uppercase text-gray-400">Saídas (Despesas)</p><h3 className="text-2xl font-black text-red-600">-{formatCurrency(stats.totalExpenses)}</h3></div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}><ShoppingBag size={24} /></div>
                <div><p className="text-xs font-bold uppercase text-gray-400">Saldo Líquido</p><h3 className={`text-2xl font-black ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(stats.balance)}</h3></div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-orange-500" />Origem das Receitas</h3>
                <div className="h-64">
                    {stats.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">Sem vendas no período</div>
                    )}
                </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={18} className="text-orange-500" />Ranking Vendedores</h3>
                <div className="overflow-y-auto max-h-64 space-y-3">
                    {Object.entries(stats.bySeller).length > 0 ? (
                        (Object.entries(stats.bySeller) as [string, { count: number; total: number }][]).sort(([, a], [, b]) => b.total - a.total).map(([name, data], idx) => (
                        <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3"><span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span><div><p className="font-bold text-gray-800 text-sm">{name}</p><p className="text-xs text-gray-500">{data.count} vendas</p></div></div>
                            <span className="font-bold text-gray-800">{formatCurrency(data.total)}</span>
                        </div>
                        ))
                    ) : <div className="text-center py-8 text-gray-400 text-sm">Nenhuma venda registrada.</div>}
                </div>
                </div>
            </div>
          </div>
      )}

      {/* 2. LEDGER VIEW (Extrato Detalhado) */}
      {currentView === 'ledger' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
              
              {/* Summary Strip */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-6 items-center justify-around text-center">
                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Total Entradas</span>
                      <span className="text-xl font-black text-green-600 flex items-center gap-1"><ArrowUpCircle size={16}/> {formatCurrency(stats.totalIncome)}</span>
                  </div>
                  <div className="w-px h-10 bg-gray-100 hidden md:block"></div>
                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Total Saídas</span>
                      <span className="text-xl font-black text-red-500 flex items-center gap-1"><ArrowDownCircle size={16}/> {formatCurrency(stats.totalExpenses)}</span>
                  </div>
                  <div className="w-px h-10 bg-gray-100 hidden md:block"></div>
                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Saldo do Período</span>
                      <span className={`text-2xl font-black ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(stats.balance)}</span>
                  </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Receipt size={18}/> Extrato Unificado</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">{periodLabel}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-bold uppercase text-xs">Data/Hora</th>
                            <th className="px-6 py-3 font-bold uppercase text-xs">Descrição / Produtos</th>
                            <th className="px-6 py-3 font-bold uppercase text-xs text-center">Tipo</th>
                            <th className="px-6 py-3 font-bold uppercase text-xs text-right">Valor</th>
                            <th className="px-6 py-3 font-bold uppercase text-xs text-center">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {unifiedLedger.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum registro encontrado neste período.</td></tr>
                        ) : (
                            unifiedLedger.map((entry) => (
                                <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${entry.isCancelled ? 'bg-red-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-700">{new Date(entry.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-400">{new Date(entry.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold ${entry.isCancelled ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                                            {entry.description}
                                        </div>
                                        {/* Products Detail */}
                                        <div className={`text-xs mt-1 ${entry.isCancelled ? 'text-red-300' : 'text-gray-500'}`}>
                                            {entry.details}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase border
                                            ${entry.isCancelled ? 'bg-red-100 text-red-700 border-red-200' : 
                                              entry.type === 'IN' ? 'bg-green-50 text-green-700 border-green-200' : 
                                              'bg-red-50 text-red-700 border-red-200'}`}>
                                            {entry.isCancelled ? 'Cancelado' : entry.category}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold text-base
                                        ${entry.isCancelled ? 'text-gray-400 line-through decoration-red-500' : 
                                          entry.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.isCancelled ? '' : entry.type === 'IN' ? '+' : '-'} {formatCurrency(entry.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {/* Botão de Cancelar Apenas para Vendas (IN) não canceladas */}
                                        {entry.type === 'IN' && !entry.isCancelled && entry.category !== 'Contribuição Escolar' ? (
                                            <button 
                                                onClick={() => {
                                                    setTransactionToCancel({ id: entry.id, number: (entry.originalRef as Transaction).orderNumber });
                                                    setShowCancelModal(true);
                                                }}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Cancelar Venda"
                                            >
                                                <Ban size={16} />
                                            </button>
                                        ) : entry.type === 'IN' && entry.isCancelled ? (
                                            <Ban size={16} className="text-gray-300 mx-auto"/>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Reports;