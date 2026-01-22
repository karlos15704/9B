import React, { useMemo, useState } from 'react';
import { Transaction, PaymentMethod } from '../types';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Trash2, AlertTriangle, FileText, XCircle, Ban, Users } from 'lucide-react';
import { APP_NAME } from '../constants';

interface ReportsProps {
  transactions: Transaction[];
  onCancelTransaction: (transactionId: string) => void;
  onResetSystem: () => void;
}

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74']; // Orange scale

const Reports: React.FC<ReportsProps> = ({ transactions, onCancelTransaction, onResetSystem }) => {
  // Reset System State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  // Cancel Transaction State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<{id: string, number: string} | null>(null);
  const [cancelPassword, setCancelPassword] = useState('');

  // Filter for today's transactions
  const todayTransactions = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return transactions.filter(t => t.timestamp >= startOfDay.getTime());
  }, [transactions]);

  // Separate Active (Completed) vs Cancelled for calculations
  const activeTransactions = useMemo(() => 
    todayTransactions.filter(t => t.status !== 'cancelled'), 
  [todayTransactions]);

  const cancelledTransactions = useMemo(() => 
    todayTransactions.filter(t => t.status === 'cancelled'), 
  [todayTransactions]);

  const stats = useMemo(() => {
    // Only calculate stats based on Active transactions to ensure correct revenue
    const totalSales = activeTransactions.reduce((acc, t) => acc + t.total, 0);
    const totalDiscount = activeTransactions.reduce((acc, t) => acc + (t.discount || 0), 0);
    const averageTicket = activeTransactions.length > 0 ? totalSales / activeTransactions.length : 0;
    
    // By Payment Method
    const byMethod = activeTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
      return acc;
    }, {} as Record<string, number>);

    // By Seller (Vendedor)
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

    return { totalSales, totalDiscount, averageTicket, chartData, byMethod, bySeller, productSales };
  }, [activeTransactions]);

  const handleSystemReset = () => {
    if (resetPassword === '0') {
      onResetSystem();
      setShowResetModal(false);
      setResetPassword('');
      alert('Sistema zerado com sucesso.');
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

    // Added explicit type casting for Object.entries to fix 'unknown' type errors
    const productRows = (Object.entries(stats.productSales) as [string, { quantity: number; total: number }][])
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .map(([name, data]) => `
        <tr>
          <td style="padding: 4px 0; border-bottom: 1px solid #eee;">${name}</td>
          <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: center;">${data.quantity}</td>
          <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(data.total)}</td>
        </tr>
      `).join('');

    // Added explicit type casting for Object.entries to fix 'unknown' type errors
    const sellerRows = (Object.entries(stats.bySeller) as [string, { count: number; total: number }][])
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([name, data]) => `
        <tr>
          <td style="padding: 4px 0; border-bottom: 1px solid #eee;">${name}</td>
          <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: center;">${data.count}</td>
          <td style="padding: 4px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(data.total)}</td>
        </tr>
      `).join('');

    // Added explicit type casting for Object.entries to fix 'unknown' type errors
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
          <title>Relatório de Fechamento - ${APP_NAME}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 80mm; margin: 0 auto; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 5px; text-transform: uppercase; }
            h2 { font-size: 14px; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase; }
            p { font-size: 12px; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 2px dashed #000; padding-top: 10px; }
            .center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${APP_NAME}</h1>
          <p class="center">RELATÓRIO DE FECHAMENTO</p>
          <p class="center">${dateStr}</p>
          <br/>
          
          <h2>Resumo Financeiro</h2>
          <p>Vendas Ativas: <strong>${activeTransactions.length}</strong></p>
          <p>Cancelamentos: <strong>${cancelledTransactions.length}</strong></p>
          <p>Ticket Médio: <strong>${formatCurrency(stats.averageTicket)}</strong></p>
          <div class="total">FATURAMENTO LIQ: ${formatCurrency(stats.totalSales)}</div>

          <h2>Vendas por Vendedor</h2>
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

          <h2>Pagamentos</h2>
          <table>
            ${paymentRows}
          </table>

          <h2>Vendas Canceladas</h2>
          <table>
            <thead>
               <tr>
                 <th align="left" width="15%">Ficha</th>
                 <th align="left" width="15%">Hora</th>
                 <th align="left" width="50%">Itens</th>
                 <th align="right" width="20%">Valor</th>
               </tr>
            </thead>
            <tbody>
              ${cancelledRows}
            </tbody>
          </table>

          <h2>Resumo de Produtos</h2>
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

          <div class="footer">
            <p>Impresso em ${new Date().toLocaleTimeString()}</p>
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

  // Dashboard Render
  return (
    <div className="p-6 overflow-y-auto h-full space-y-6 relative">
      
      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={24} />
              ZERAR TUDO?
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Isso apagará <strong>TODAS</strong> as vendas e reiniciará a contagem de senhas para o número 1. Esta ação é irreversível.
            </p>
            <div className="mb-4">
               <label className="text-xs font-bold text-gray-500 uppercase">Senha Administrativa</label>
               <input 
                type="password" 
                className="w-full border-2 border-red-100 bg-red-50 p-2 rounded-lg mt-1 focus:outline-none focus:border-red-500" 
                placeholder="Digite a senha..."
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowResetModal(false)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSystemReset} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Transaction Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <XCircle className="text-red-600" size={24} />
              Estornar Venda #{transactionToCancel?.number}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta ação removerá o pedido dos registros financeiros. É necessária autorização.
            </p>
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
              <button 
                onClick={() => {
                  setShowCancelModal(false);
                  setTransactionToCancel(null);
                  setCancelPassword('');
                }} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCancel} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                ESTORNAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">Fechamento de Caixa</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={generatePrintWindow}
            className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm flex items-center gap-2"
          >
            <FileText size={14} />
            RELATÓRIO
          </button>
          
          <button 
            onClick={() => setShowResetModal(true)}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-100 flex items-center gap-2"
          >
            <Trash2 size={14} />
            ZERAR VENDAS
          </button>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Faturamento Hoje</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pedidos Ativos</p>
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
        {/* Payment Methods Chart */}
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
                  Sem vendas hoje
                </div>
             )}
          </div>
        </div>

        {/* Sellers Chart/List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-orange-500" />
            Ranking Vendedores
          </h3>
          <div className="overflow-y-auto max-h-64 space-y-3">
             {Object.entries(stats.bySeller).length > 0 ? (
                // Added explicit type casting for Object.entries to fix 'unknown' type errors
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
        <div className="p-4 border-b border-orange-100">
          <h3 className="font-semibold text-gray-800">Todos os Pedidos (Inclui Cancelados)</h3>
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
              {todayTransactions.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                     Nenhum pedido registrado hoje.
                   </td>
                 </tr>
              ) : (
                [...todayTransactions].reverse().map((t) => {
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
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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