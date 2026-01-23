import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, PaymentMethod, User } from '../types';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Trash2, AlertTriangle, FileText, XCircle, Ban, Users, Calendar, CalendarDays, CalendarRange, Filter, ArrowRight } from 'lucide-react';
import { APP_NAME } from '../constants';

interface ReportsProps {
  transactions: Transaction[];
  onCancelTransaction: (transactionId: string) => void;
  onResetSystem: () => void;
  currentUser: User | null;
}

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74']; // Orange scale
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type DateRangeType = 'day' | 'week' | 'month' | 'year' | 'custom';

const Reports: React.FC<ReportsProps> = ({ transactions, onCancelTransaction, onResetSystem, currentUser }) => {
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

  // --- HELPER: CALCULAR SEMANAS DO MÊS ---
  // Retorna array de { label, start, end }
  const weeksInMonth = useMemo(() => {
    const weeks = [];
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    
    let currentStart = new Date(firstDayOfMonth);
    let weekCount = 1;

    while (currentStart <= lastDayOfMonth) {
      // Fim da semana é o próximo Sábado ou o último dia do mês
      const dayOfWeek = currentStart.getDay(); // 0 (Dom) - 6 (Sab)
      const daysToSaturday = 6 - dayOfWeek;
      
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + daysToSaturday);
      
      // Se passar do fim do mês, corta no último dia
      if (currentEnd > lastDayOfMonth) {
        currentEnd = new Date(lastDayOfMonth);
      }
      
      // Ajuste para fim do dia
      const start = new Date(currentStart);
      start.setHours(0,0,0,0);
      
      const end = new Date(currentEnd);
      end.setHours(23,59,59,999);

      weeks.push({
        label: `${weekCount}ª Semana (${start.getDate()}/${selectedMonth + 1} - ${end.getDate()}/${selectedMonth + 1})`,
        start,
        end
      });

      // Avança para o próximo Domingo (dia seguinte ao currentEnd)
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      weekCount++;
    }
    return weeks;
  }, [selectedYear, selectedMonth]);

  // Resetar índice da semana se mudar mês/ano
  useEffect(() => {
    setSelectedWeekIndex(0);
  }, [selectedYear, selectedMonth]);


  // --- LÓGICA DE FILTRAGEM ---
  const { filteredTransactions, periodLabel } = useMemo(() => {
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
        // Fallback
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

    const filtered = transactions.filter(t => t.timestamp >= start.getTime() && t.timestamp <= end.getTime());
    return { filteredTransactions: filtered, periodLabel: label };
  }, [transactions, dateRangeType, selectedDay, selectedYear, selectedMonth, selectedWeekIndex, weeksInMonth, customStartDate, customEndDate]);


  // --- ESTATÍSTICAS ---
  const activeTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.status !== 'cancelled'), 
  [filteredTransactions]);

  const cancelledTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.status === 'cancelled'), 
  [filteredTransactions]);

  const stats = useMemo(() => {
    const totalSales = activeTransactions.reduce((acc, t) => acc + t.total, 0);
    const averageTicket = activeTransactions.length > 0 ? totalSales / activeTransactions.length : 0;
    
    // By Payment Method
    const byMethod = activeTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
      return acc;
    }, {} as Record<string, number>);

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

    return { totalSales, averageTicket, chartData, byMethod, bySeller, productSales };
  }, [activeTransactions]);

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
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
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
      
    const cancelledRows = cancelledTransactions.length > 0 
      ? cancelledTransactions.map(t => {
          const itemsList = t.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
          
          return `
          <tr style="color: #ef4444; font-style: italic;">
            <td style="padding: 4px 0; border-bottom: 1px solid #fee2e2; vertical-align: top;">#${t.orderNumber}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #fee2e2; vertical-align: top;">${new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #fee2e2; font-size: 10px; line-height: 1.2;">${itemsList}</td>
            <td style="padding: 4px 0; border-bottom: 1px solid #fee2e2; text-align: right; vertical-align: top;">${formatCurrency(t.total)}</td>
          </tr>
        `}).join('')
      : '<tr><td colspan="4" style="padding: 10px 0; text-align: center; color: #9ca3af;">Nenhum cancelamento.</td></tr>';

    const htmlContent = `
      <html>
        <head>
          <title>Relatório - ${APP_NAME}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 80mm; margin: 0 auto; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 5px; text-transform: uppercase; }
            h2 { font-size: 14px; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase; }
            p { font-size: 12px; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 2px dashed #000; padding-top: 10px; }
            .center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
            .period-box { background: #eee; padding: 5px; border: 1px solid #000; text-align: center; margin: 10px 0; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>${APP_NAME}</h1>
          <p class="center">RELATÓRIO FINANCEIRO</p>
          
          <div class="period-box">
             ${periodLabel}
          </div>
          
          <p class="center" style="font-size: 10px;">Gerado em: ${dateStr}</p>
          <br/>
          
          <h2>Resumo Geral</h2>
          <p>Vendas Ativas: <strong>${activeTransactions.length}</strong></p>
          <p>Cancelamentos: <strong>${cancelledTransactions.length}</strong></p>
          <p>Ticket Médio: <strong>${formatCurrency(stats.averageTicket)}</strong></p>
          <div class="total">FATURAMENTO LIQ: ${formatCurrency(stats.totalSales)}</div>

          <h2>Ranking Vendedores</h2>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th align="left">Nome</th>
                <th align="center">Qtd</th>
                <th align="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sellerRows}
            </tbody>
          </table>

          <h2>Formas de Pagamento</h2>
          <table>
            ${paymentRows}
          </table>

          <h2>Produtos Vendidos</h2>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item</th>
                <th style="text-align: center;">Qtd</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          
          ${cancelledTransactions.length > 0 ? `
              <h2>Cancelamentos</h2>
              <table>
                <thead>
                   <tr>
                     <th align="left">#</th>
                     <th align="left">Hora</th>
                     <th align="left">Itens</th>
                     <th align="right">R$</th>
                   </tr>
                </thead>
                <tbody>
                  ${cancelledRows}
                </tbody>
              </table>
          ` : ''}

          <div class="footer">
            <p>Sistema Escolar: ${APP_NAME}</p>
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
    <div className="p-6 overflow-y-auto h-full space-y-6 relative">
      
      {/* MODAL RESET (PROFESSOR) */}
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
               <input 
                type="password" 
                className="w-full border-2 border-red-100 bg-red-50 p-2 rounded-lg mt-1 focus:outline-none focus:border-red-500" 
                placeholder="Senha Master"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleSystemReset} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">APAGAR TUDO</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAMENTO */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <XCircle className="text-red-600" size={24} />
              Estornar Venda #{transactionToCancel?.number}
            </h3>
            <div className="mb-4">
               <label className="text-xs font-bold text-gray-500 uppercase">Senha Administrativa</label>
               <input 
                type="password" 
                className="w-full border-2 border-red-100 bg-red-50 p-2 rounded-lg mt-1 focus:outline-none focus:border-red-500" 
                placeholder="Senha de Autorização"
                value={cancelPassword}
                onChange={e => setCancelPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowCancelModal(false); setTransactionToCancel(null); setCancelPassword(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleConfirmCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">ESTORNAR</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CABEÇALHO E FILTROS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-2">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Fechamento de Caixa</h2>
            <p className="text-sm text-gray-500">Relatórios Financeiros</p>
        </div>
        
        {/* TIPO DE FILTRO */}
        <div className="flex flex-wrap items-center bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button onClick={() => setDateRangeType('day')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${dateRangeType === 'day' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <CalendarDays size={14} /> Dia
            </button>
            <button onClick={() => setDateRangeType('week')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${dateRangeType === 'week' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <CalendarRange size={14} /> Semana
            </button>
            <button onClick={() => setDateRangeType('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${dateRangeType === 'month' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Calendar size={14} /> Mês
            </button>
            <button onClick={() => setDateRangeType('year')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${dateRangeType === 'year' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Calendar size={14} /> Ano
            </button>
            <button onClick={() => setDateRangeType('custom')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${dateRangeType === 'custom' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <CalendarRange size={14} /> Período
            </button>
        </div>
      </div>

      {/* --- BARRA DE SELEÇÃO ESPECÍFICA (A MÁGICA ACONTECE AQUI) --- */}
      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-2">
          <Filter size={18} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-700 uppercase mr-2">Filtrar Por:</span>

          {/* SELEÇÃO DE ANO (Sempre visível exceto 'day' e 'custom') */}
          {dateRangeType !== 'day' && dateRangeType !== 'custom' && (
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               className="bg-white border border-orange-200 text-gray-700 text-sm rounded-lg p-2 font-bold focus:ring-orange-500 focus:border-orange-500 outline-none"
             >
                {[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
             </select>
          )}

          {/* SELEÇÃO DE MÊS (Visível para 'week' e 'month') */}
          {(dateRangeType === 'month' || dateRangeType === 'week') && (
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
               className="bg-white border border-orange-200 text-gray-700 text-sm rounded-lg p-2 font-bold focus:ring-orange-500 focus:border-orange-500 outline-none"
             >
                {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                ))}
             </select>
          )}

          {/* SELEÇÃO DE SEMANA (Apenas para 'week') */}
          {dateRangeType === 'week' && (
             <select 
               value={selectedWeekIndex} 
               onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))}
               className="bg-white border border-orange-200 text-gray-700 text-sm rounded-lg p-2 font-bold focus:ring-orange-500 focus:border-orange-500 outline-none min-w-[200px]"
             >
                {weeksInMonth.map((w, idx) => (
                    <option key={idx} value={idx}>{w.label}</option>
                ))}
             </select>
          )}

          {/* SELEÇÃO DE DIA (Apenas para 'day') */}
          {dateRangeType === 'day' && (
             <input 
               type="date"
               value={selectedDay}
               onChange={(e) => setSelectedDay(e.target.value)}
               className="bg-white border border-orange-200 text-gray-700 text-sm rounded-lg p-2 font-bold focus:ring-orange-500 focus:border-orange-500 outline-none"
             />
          )}

          {/* SELEÇÃO DE PERÍODO PERSONALIZADO (CUSTOM) */}
          {dateRangeType === 'custom' && (
             <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase">De:</span>
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-orange-200 text-gray-700 text-sm rounded-lg p-2 font-bold focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <ArrowRight size={16} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase">Até:</span>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-orange-200 text-gray-700 text-sm rounded-lg p-2 font-bold focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
             </div>
          )}

          <div className="flex-1"></div>

          {/* AÇÕES */}
          <div className="flex gap-2">
            <button onClick={generatePrintWindow} className="px-4 py-2 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center gap-2">
                <FileText size={16} /> IMPRIMIR
            </button>
            {isProfessor && (
                <button onClick={() => setShowResetModal(true)} className="px-4 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 border border-red-200 flex items-center gap-2">
                    <Trash2 size={16} /> ZERAR TUDO
                </button>
            )}
          </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Faturamento Total</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Vendas Realizadas</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeTransactions.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ticket Médio</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageTicket)}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-orange-500" />
            Métodos de Pagamento
          </h3>
          <div className="h-64">
             {stats.chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={stats.chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {stats.chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value: number) => formatCurrency(value)} />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Sem vendas no período
                </div>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-orange-500" />
            Ranking Vendedores
          </h3>
          <div className="overflow-y-auto max-h-64 space-y-3">
             {Object.entries(stats.bySeller).length > 0 ? (
                (Object.entries(stats.bySeller) as [string, { count: number; total: number }][])
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([name, data], idx) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{name}</p>
                          <p className="text-xs text-gray-500">{data.count} vendas</p>
                        </div>
                     </div>
                     <span className="font-bold text-gray-800">{formatCurrency(data.total)}</span>
                  </div>
                ))
             ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhuma venda registrada.</div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="p-4 border-b border-orange-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Extrato de Pedidos ({filteredTransactions.length})</h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold">{periodLabel}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Pedido</th>
                <th className="px-6 py-3 font-medium">Vendedor</th>
                <th className="px-6 py-3 font-medium">Horário</th>
                <th className="px-6 py-3 font-medium">Itens</th>
                <th className="px-6 py-3 font-medium">Pagamento</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                     Nenhum pedido encontrado neste período.
                   </td>
                 </tr>
              ) : (
                [...filteredTransactions].reverse().map((t) => {
                  const isCancelled = t.status === 'cancelled';
                  return (
                    <tr key={t.id} className={`${isCancelled ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-orange-50/50'} transition-colors`}>
                      <td className={`px-6 py-4 font-bold ${isCancelled ? 'text-red-500 line-through' : 'text-orange-600'}`}>
                        #{t.orderNumber}
                      </td>
                      <td className={`px-6 py-4 font-medium ${isCancelled ? 'text-red-400' : 'text-gray-700'}`}>
                        {t.sellerName || '-'}
                      </td>
                      <td className={`px-6 py-4 ${isCancelled ? 'text-red-400' : 'text-gray-600'}`}>
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span className="text-[10px] text-gray-400 block">{new Date(t.timestamp).toLocaleDateString()}</span>
                      </td>
                      <td className={`px-6 py-4 font-medium ${isCancelled ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                        {t.items.length} itens <span className={`text-xs ${isCancelled ? 'text-red-300' : 'text-gray-400'}`}>({t.items.map(i => i.name).slice(0, 1).join(', ')}{t.items.length > 1 ? '...' : ''})</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${isCancelled ? 'bg-red-200 text-red-800' : 
                            t.paymentMethod === PaymentMethod.PIX ? 'bg-teal-100 text-teal-800' : 
                            t.paymentMethod === PaymentMethod.CASH ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {isCancelled ? 'CANCELADO' : t.paymentMethod}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${isCancelled ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                        {formatCurrency(t.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!isCancelled ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransactionToCancel({ id: t.id, number: t.orderNumber });
                              setShowCancelModal(true);
                            }}
                            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm border border-red-100 hover:border-red-500"
                            title="Estornar/Cancelar Venda"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="text-red-400 flex justify-center" title="Pedido Cancelado">
                            <Ban size={20} />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;