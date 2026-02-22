import React, { useState, useEffect } from 'react';
import { User, Product, Customer, Transaction } from '../types';
import { Search, Gift, PlusCircle, Save, User as UserIcon, Trophy, History, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { getCustomerByPhone, createCustomer, addPoints, redeemPoints } from '../services/loyaltyService';
import { createTransaction, fetchNextOrderNumber } from '../services/supabase';
import { formatCurrency, generateId } from '../utils';

interface LoyaltyManagementProps {
  currentUser: User;
  products: Product[];
  onClose?: () => void;
}

const LoyaltyManagement: React.FC<LoyaltyManagementProps> = ({ currentUser, products, onClose }) => {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'search' | 'details' | 'redeem'>('search');
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setIsLoading(true);
    const cust = await getCustomerByPhone(phone);
    if (cust) {
      setCustomer(cust);
      setView('details');
    } else {
      if (confirm('Cliente não encontrado. Deseja cadastrar um novo?')) {
        const name = prompt('Nome do Cliente:');
        if (name) {
            const newCust = await createCustomer(phone, name);
            if (newCust) {
                setCustomer(newCust);
                setView('details');
            }
        }
      }
    }
    setIsLoading(false);
  };

  const handleAddPoints = async () => {
      if (!customer) return;
      const pointsStr = prompt('Quantos pontos adicionar?');
      if (!pointsStr) return;
      const points = parseInt(pointsStr);
      if (isNaN(points)) return;

      setIsLoading(true);
      await addPoints(customer.id, points);
      setCustomer(prev => prev ? ({...prev, points: prev.points + points}) : null);
      alert(`${points} pontos adicionados!`);
      setIsLoading(false);
  };

  const addToRedeemCart = (product: Product) => {
      if (!product.pointsPrice) return;
      setCart(prev => {
          const existing = prev.find(i => i.product.id === product.id);
          if (existing) {
              return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i);
          }
          return [...prev, { product, quantity: 1 }];
      });
  };

  const removeFromRedeemCart = (productId: string) => {
      setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const totalPointsCost = cart.reduce((acc, item) => acc + ((item.product.pointsPrice || 0) * item.quantity), 0);

  const handleFinishRedemption = async () => {
      if (!customer || cart.length === 0) return;
      
      if (customer.points < totalPointsCost) {
          alert(`Saldo insuficiente. Necessário: ${totalPointsCost}, Saldo: ${customer.points}`);
          return;
      }

      if (!confirm(`Confirmar resgate de ${cart.reduce((a,b) => a + b.quantity, 0)} itens por ${totalPointsCost} pontos?`)) return;

      setIsLoading(true);
      
      // 1. Deduct Points
      const successRedeem = await redeemPoints(customer.id, totalPointsCost);
      
      if (successRedeem) {
          // 2. Create Transaction
          const orderNumber = await fetchNextOrderNumber();
          const transactionId = generateId();
          
          const itemsForTrans = cart.map(i => ({ ...i.product, quantity: i.quantity }));

          const newTransaction: Transaction = {
            id: transactionId, 
            orderNumber: orderNumber || '0', 
            customerName: customer.name, 
            timestamp: Date.now(), 
            items: itemsForTrans, 
            subtotal: 0, 
            discount: 0, 
            total: 0, 
            paymentMethod: 'Pontos Fidelidade', 
            status: 'completed', 
            kitchenStatus: 'pending',
            customerId: customer.id,
            pointsRedeemed: totalPointsCost,
            sellerName: currentUser.name
          };

          const successTrans = await createTransaction(newTransaction);
          
          if (successTrans) {
              setCustomer(prev => prev ? ({...prev, points: prev.points - totalPointsCost}) : null);
              setCart([]);
              setView('details');
              alert("Resgate realizado com sucesso!");
          } else {
              alert("Erro ao registrar transação. Pontos foram deduzidos (contate suporte).");
          }
      } else {
          alert("Erro ao deduzir pontos.");
      }
      setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <Trophy className="text-purple-600" />
              Gestão de Fidelidade
          </h2>
      </div>

      {view === 'search' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
              <div className="bg-white p-8 rounded-3xl shadow-xl w-full">
                  <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Buscar Cliente</label>
                  <div className="flex gap-2">
                      <input 
                          type="tel" 
                          placeholder="Telefone (WhatsApp)" 
                          className="flex-1 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-lg focus:border-purple-500 focus:outline-none"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      />
                      <button 
                          onClick={handleSearch}
                          disabled={isLoading || !phone}
                          className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                          <Search />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {view === 'details' && customer && (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                  <div className="relative z-10 flex justify-between items-center">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <div className="bg-white/20 p-2 rounded-full"><UserIcon size={24} /></div>
                              <h3 className="text-2xl font-black">{customer.name}</h3>
                          </div>
                          <p className="opacity-80 font-mono">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-bold uppercase opacity-80">Saldo Atual</p>
                          <p className="text-5xl font-black">{customer.points}</p>
                      </div>
                  </div>
                  <div className="mt-8 flex gap-3 relative z-10">
                      <button onClick={() => setView('redeem')} className="bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg">
                          <Gift size={20} /> RESGATAR PONTOS
                      </button>
                      <button onClick={handleAddPoints} className="bg-purple-800/50 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors flex items-center gap-2 border border-white/20">
                          <PlusCircle size={20} /> Adicionar Manualmente
                      </button>
                      <button onClick={() => { setCustomer(null); setPhone(''); setView('search'); }} className="ml-auto text-white/70 hover:text-white font-bold text-sm underline">
                          Buscar Outro
                      </button>
                  </div>
                  <Trophy className="absolute -right-10 -bottom-10 text-white/10 w-64 h-64 rotate-12" />
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><History size={20} /> Histórico Recente</h3>
                  <p className="text-gray-400 text-sm italic">Histórico detalhado em desenvolvimento...</p>
              </div>
          </div>
      )}

      {view === 'redeem' && customer && (
          <div className="flex-1 flex flex-col md:flex-row gap-6 h-full overflow-hidden">
              {/* Product Grid */}
              <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Produtos para Resgate</h3>
                      <button onClick={() => setView('details')} className="text-gray-400 hover:text-gray-600 text-sm font-bold">Cancelar</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {products.filter(p => p.pointsPrice && p.pointsPrice > 0).map(product => (
                          <div key={product.id} className="border border-gray-100 rounded-xl p-3 flex flex-col hover:border-purple-200 transition-colors group">
                              <img src={product.imageUrl} className="w-full h-24 object-contain mb-2" alt={product.name} />
                              <h4 className="font-bold text-sm text-gray-800 line-clamp-2 mb-1">{product.name}</h4>
                              <div className="mt-auto flex justify-between items-end">
                                  <span className="text-purple-600 font-black">{product.pointsPrice} pts</span>
                                  <button 
                                    onClick={() => addToRedeemCart(product)}
                                    disabled={customer.points < (product.pointsPrice || 0)}
                                    className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      <PlusCircle size={18} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Cart */}
              <div className="w-full md:w-96 bg-white rounded-3xl shadow-xl border border-purple-100 flex flex-col overflow-hidden">
                  <div className="p-4 bg-purple-50 border-b border-purple-100">
                      <h3 className="font-black text-purple-900 flex items-center gap-2"><ShoppingCart size={20} /> Carrinho de Resgate</h3>
                      <p className="text-xs text-purple-700">Saldo: <strong>{customer.points}</strong> pts</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {cart.length === 0 ? (
                          <div className="text-center text-gray-400 py-10">Carrinho vazio</div>
                      ) : (
                          cart.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-500">{item.quantity}x</div>
                                  <div className="flex-1">
                                      <p className="font-bold text-sm text-gray-800">{item.product.name}</p>
                                      <p className="text-xs text-purple-600 font-bold">{(item.product.pointsPrice || 0) * item.quantity} pts</p>
                                  </div>
                                  <button onClick={() => removeFromRedeemCart(item.product.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                              </div>
                          ))
                      )}
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-500 font-bold">Total Pontos</span>
                          <span className={`text-2xl font-black ${totalPointsCost > customer.points ? 'text-red-500' : 'text-purple-600'}`}>{totalPointsCost}</span>
                      </div>
                      <button 
                          onClick={handleFinishRedemption}
                          disabled={cart.length === 0 || totalPointsCost > customer.points || isLoading}
                          className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                          {isLoading ? 'Processando...' : <><CheckCircle2 /> CONFIRMAR TROCA</>}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LoyaltyManagement;
