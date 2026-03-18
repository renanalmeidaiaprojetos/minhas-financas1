import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Trash2,
  Coffee,
  Car,
  Home,
  Zap,
  ShoppingBag,
  DollarSign,
  Briefcase,
  X,
  PieChart,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart3,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  PiggyBank,
  Plane,
  Cat,
} from 'lucide-react';

const DADOS_INICIAIS = [
  {
    id: '1',
    description: 'Salário',
    amount: 4500.0,
    type: 'income',
    category: 'Trabalho',
    date: '2026-03-01',
  },
  {
    id: '2',
    description: 'Aluguel',
    amount: 1200.0,
    type: 'expense',
    category: 'Moradia',
    date: '2026-03-05',
  },
  {
    id: '3',
    description: 'Mercado',
    amount: 450.5,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-03-10',
  },
  {
    id: '4',
    description: 'Uber',
    amount: 45.0,
    type: 'expense',
    category: 'Transporte',
    date: '2026-03-12',
  },
  {
    id: '5',
    description: 'Freelance',
    amount: 800.0,
    type: 'income',
    category: 'Trabalho',
    date: '2026-03-15',
  },
];

const CATEGORIAS = {
  Alimentação: {
    icon: Coffee,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    barColor: 'bg-orange-500',
  },
  Transporte: {
    icon: Car,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    barColor: 'bg-blue-500',
  },
  Moradia: {
    icon: Home,
    color: 'text-indigo-500',
    bg: 'bg-indigo-100',
    barColor: 'bg-indigo-500',
  },
  Contas: {
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100',
    barColor: 'bg-yellow-500',
  },
  Compras: {
    icon: ShoppingBag,
    color: 'text-pink-500',
    bg: 'bg-pink-100',
    barColor: 'bg-pink-500',
  },
  Trabalho: {
    icon: Briefcase,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
    barColor: 'bg-emerald-500',
  },
  Lazer: {
    icon: Gamepad2,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    barColor: 'bg-purple-500',
  },
  Saúde: {
    icon: HeartPulse,
    color: 'text-red-500',
    bg: 'bg-red-100',
    barColor: 'bg-red-500',
  },
  Educação: {
    icon: GraduationCap,
    color: 'text-cyan-500',
    bg: 'bg-cyan-100',
    barColor: 'bg-cyan-500',
  },
  Investimentos: {
    icon: PiggyBank,
    color: 'text-teal-500',
    bg: 'bg-teal-100',
    barColor: 'bg-teal-500',
  },
  Viagens: {
    icon: Plane,
    color: 'text-sky-500',
    bg: 'bg-sky-100',
    barColor: 'bg-sky-500',
  },
  Pets: {
    icon: Cat,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    barColor: 'bg-amber-500',
  },
  Outros: {
    icon: DollarSign,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    barColor: 'bg-gray-500',
  },
};

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const savedData = localStorage.getItem('minhas_financas_app');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return DADOS_INICIAIS;
  });

  useEffect(() => {
    localStorage.setItem('minhas_financas_app', JSON.stringify(transactions));
  }, [transactions]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTransactions = useMemo(() => {
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth();

    return transactions.filter((t) => {
      const [tYear, tMonth] = t.date.split('-');
      if (viewMode === 'annual') {
        return parseInt(tYear) === viewYear;
      } else {
        return (
          parseInt(tYear) === viewYear && parseInt(tMonth) - 1 === viewMonth
        );
      }
    });
  }, [transactions, currentDate, viewMode]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') {
          acc.income += curr.amount;
          acc.balance += curr.amount;
        } else {
          acc.expense += curr.amount;
          acc.balance -= curr.amount;
        }
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [filteredTransactions]);

  const categoryStats = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
      'pt-BR',
      options
    );
  };

  const formatPeriodLabel = () => {
    if (viewMode === 'annual') return currentDate.getFullYear().toString();
    const options = { month: 'long', year: 'numeric' };
    const label = currentDate.toLocaleDateString('pt-BR', options);
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const nextPeriod = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === 'annual') newDate.setFullYear(prev.getFullYear() + 1);
      else newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const prevPeriod = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === 'annual') newDate.setFullYear(prev.getFullYear() - 1);
      else newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleOpenModal = () => {
    if (viewMode === 'monthly') {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const today = new Date();
      const day =
        today.getFullYear() === year &&
        today.getMonth() === currentDate.getMonth()
          ? String(today.getDate()).padStart(2, '0')
          : '01';
      setDate(`${year}-${month}-${day}`);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTransaction = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      type,
      category:
        type === 'income' && category === 'Alimentação' ? 'Trabalho' : category,
      date,
    };

    setTransactions(
      [newTransaction, ...transactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )
    );
    setIsModalOpen(false);
    setDescription('');
    setAmount('');
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const StatCard = ({ title, amount, icon: Icon, trend, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>
          {formatCurrency(amount)}
        </h3>
      </div>
      <div
        className={`p-4 rounded-full ${
          trend === 'up'
            ? 'bg-emerald-100 text-emerald-600'
            : trend === 'down'
            ? 'bg-rose-100 text-rose-600'
            : 'bg-blue-100 text-blue-600'
        }`}
      >
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
      <header className="bg-indigo-600 text-white pt-8 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet size={32} className="text-indigo-200" />
              <h1 className="text-2xl font-bold tracking-tight">
                Finanças<span className="text-indigo-200">App</span>
              </h1>
            </div>
            <button
              onClick={handleOpenModal}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nova Transação</span>
            </button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="bg-indigo-700/50 p-1 rounded-lg flex inline-flex">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Visão Mensal
              </button>
              <button
                onClick={() => setViewMode('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'annual'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Visão Anual
              </button>
            </div>

            <div className="flex items-center gap-4 bg-indigo-700/30 px-2 py-1.5 rounded-lg border border-indigo-500/30">
              <button
                onClick={prevPeriod}
                className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors text-indigo-100 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2 font-semibold min-w-[160px] justify-center text-lg">
                <CalendarDays size={18} className="text-indigo-300" />
                <span>{formatPeriodLabel()}</span>
              </div>
              <button
                onClick={nextPeriod}
                className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors text-indigo-100 hover:text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatCard
            title="Balanço do Período"
            amount={summary.balance}
            icon={DollarSign}
            trend="neutral"
            colorClass="text-gray-900"
          />
          <StatCard
            title="Receitas"
            amount={summary.income}
            icon={TrendingUp}
            trend="up"
            colorClass="text-emerald-600"
          />
          <StatCard
            title="Despesas"
            amount={summary.expense}
            icon={TrendingDown}
            trend="down"
            colorClass="text-rose-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" /> Despesas por
                Categoria
              </h2>

              {categoryStats.length === 0 ? (
                <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                  <PieChart size={40} className="mb-3 opacity-50" />
                  <p className="text-sm">
                    Nenhuma despesa para exibir neste período.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {categoryStats.map((stat) => {
                    const CatIcon =
                      CATEGORIAS[stat.category]?.icon ||
                      CATEGORIAS['Outros'].icon;
                    return (
                      <div key={stat.category}>
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-md ${
                                CATEGORIAS[stat.category]?.bg || 'bg-gray-100'
                              } ${
                                CATEGORIAS[stat.category]?.color ||
                                'text-gray-500'
                              }`}
                            >
                              <CatIcon size={16} />
                            </div>
                            <span className="font-medium text-gray-700 text-sm">
                              {stat.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-semibold text-gray-800">
                              {formatCurrency(stat.amount)}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {stat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              CATEGORIAS[stat.category]?.barColor ||
                              'bg-gray-500'
                            }`}
                            style={{ width: `${stat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-800">
                  {viewMode === 'monthly'
                    ? 'Transações do Mês'
                    : 'Transações do Ano'}
                </h2>
                <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  {filteredTransactions.length} registros
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-16 text-center text-gray-400">
                  <Wallet size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-gray-500">
                    Nenhuma transação encontrada
                  </p>
                  <p className="text-sm mt-1">
                    Adicione sua primeira transação para este período.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-4 font-semibold">Descrição</th>
                        <th className="px-6 py-4 font-semibold">Categoria</th>
                        <th className="px-6 py-4 font-semibold">Data</th>
                        <th className="px-6 py-4 font-semibold text-right">
                          Valor
                        </th>
                        <th className="px-6 py-4 font-semibold text-center">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredTransactions.map((t) => {
                        const CatIcon =
                          CATEGORIAS[t.category]?.icon ||
                          CATEGORIAS['Outros'].icon;
                        const catColors =
                          CATEGORIAS[t.category] || CATEGORIAS['Outros'];

                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-800">
                                {t.description}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${catColors.bg} ${catColors.color}`}
                              >
                                <CatIcon size={14} />
                                {t.category}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(t.date)}
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-medium ${
                                t.type === 'income'
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {t.type === 'income' ? '+' : '-'}
                              {formatCurrency(t.amount)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="text-gray-300 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Nova Transação
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCategory('Alimentação');
                  }}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    type === 'expense'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory('Trabalho');
                  }}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    type === 'income'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Entrada
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Conta de Luz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    {type === 'expense' ? (
                      <>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Transporte">Transporte</option>
                        <option value="Moradia">Moradia</option>
                        <option value="Contas">Contas</option>
                        <option value="Compras">Compras</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Educação">Educação</option>
                        <option value="Viagens">Viagens</option>
                        <option value="Pets">Pets</option>
                        <option value="Outros">Outros</option>
                      </>
                    ) : (
                      <>
                        <option value="Trabalho">Trabalho</option>
                        <option value="Investimentos">Investimentos</option>
                        <option value="Outros">Outros</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                  <Plus size={18} /> Salvar Transação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
