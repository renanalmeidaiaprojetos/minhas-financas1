// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Wallet, TrendingUp, TrendingDown, Trash2, 
  Coffee, Car, Home, Zap, ShoppingBag, DollarSign, Briefcase,
  X, PieChart, ChevronLeft, ChevronRight, CalendarDays, BarChart3,
  Gamepad2, HeartPulse, GraduationCap, PiggyBank, Plane, Cat,
  Moon, Sun, Download, Search, CheckCircle2, Circle, Repeat, Target,
  ArrowUpRight, ArrowDownRight, Minus, Receipt, UploadCloud, Loader2,
  Bell, CreditCard, Sparkles, RefreshCw, Banknote, Landmark, AlertTriangle, Bot,
  Database, Check, User, Users, Building, Edit2, Pin, TrendingUp as TrendUpIcon
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// ⚠️ ATENÇÃO: Cole a sua NOVA chave do Google AI Studio (Gemini) aqui!
const apiKey = "AIzaSyCGm-S66h_JRcw7_5hfql6fclXHILDuuVA"; 

const DADOS_INICIAIS = [
  { id: '1', description: 'Salário', amount: 4500.00, type: 'income', expenseCategory: '', category: 'Trabalho', date: '2026-03-01', status: 'paid', wallet: 'Nubank Renan', isSubscription: false, payer: 'Renan' },
  { id: '2', description: 'Aluguel', amount: 1200.00, type: 'expense', expenseCategory: 'Fixa', category: 'Moradia', date: '2026-03-05', status: 'paid', wallet: 'Nubank Esposa', isSubscription: true, payer: 'Esposa' }
];

const CONTAS_INICIAIS = [
  { id: '1', name: 'Nubank Renan', type: 'Conta', initialBalance: 0 },
  { id: '2', name: 'Nubank Esposa', type: 'Conta', initialBalance: 0 },
  { id: '3', name: 'Conta Corrente', type: 'Conta', initialBalance: 0 },
  { id: '4', name: 'Cartão de Crédito', type: 'Cartão', initialBalance: 0 },
  { id: '5', name: 'Dinheiro Físico', type: 'Dinheiro', initialBalance: 0 }
];

const CATEGORIAS = {
  'Alimentação': { icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', barColor: 'bg-orange-500' },
  'Transporte': { icon: Car, color: 'text-blue-500', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', barColor: 'bg-blue-500' },
  'Moradia': { icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', barColor: 'bg-indigo-500' },
  'Contas': { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30', barColor: 'bg-yellow-500' },
  'Compras': { icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-100', darkBg: 'dark:bg-pink-900/30', barColor: 'bg-pink-500' },
  'Trabalho': { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/30', barColor: 'bg-emerald-500' },
  'Lazer': { icon: Gamepad2, color: 'text-purple-500', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', barColor: 'bg-purple-500' },
  'Saúde': { icon: HeartPulse, color: 'text-red-500', bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', barColor: 'bg-red-500' },
  'Educação': { icon: GraduationCap, color: 'text-cyan-500', bg: 'bg-cyan-100', darkBg: 'dark:bg-cyan-900/30', barColor: 'bg-cyan-500' },
  'Investimentos': { icon: PiggyBank, color: 'text-teal-500', bg: 'bg-teal-100', darkBg: 'dark:bg-teal-900/30', barColor: 'bg-teal-500' },
  'Viagens': { icon: Plane, color: 'text-sky-500', bg: 'bg-sky-100', darkBg: 'dark:bg-sky-900/30', barColor: 'bg-sky-500' },
  'Pets': { icon: Cat, color: 'text-amber-500', bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', barColor: 'bg-amber-500' },
  'Outros': { icon: DollarSign, color: 'text-gray-500', bg: 'bg-gray-100', darkBg: 'dark:bg-gray-800', barColor: 'bg-gray-500' },
};

const ORCAMENTOS_PADRAO = { 'Alimentação': 1000, 'Transporte': 500, 'Moradia': 2000, 'Contas': 800, 'Lazer': 400 };

// --- LEITURA FEITA PELA IA DA SUA PLANILHA ANTIGA ---
const RAW_PLANILHA = [
  { day: 1, desc: 'CARTÃO WASHINGTON', type: 'expense', expenseCategory: 'Variável', cat: 'Compras', payer: 'Conjunto', wallet: 'Cartão de Crédito', values: [200, 200, 716.68, 716.68, 716.68, 550, 350, 350] },
  { day: 10, desc: 'CLARO RESIDENCIAL', type: 'expense', expenseCategory: 'Fixa', cat: 'Contas', payer: 'Conjunto', wallet: 'Conta Corrente', values: [314.91, 321.84, 320, 320, 320, 320, 320, 320, 320, 320, 320, 320] },
  { day: 10, desc: 'CARTÃO LENA', type: 'expense', expenseCategory: 'Variável', cat: 'Compras', payer: 'Conjunto', wallet: 'Cartão de Crédito', values: [100, 139, 0, 1007] },
  { day: 13, desc: 'CONTA DE GÁS', type: 'expense', expenseCategory: 'Variável', cat: 'Contas', payer: 'Conjunto', wallet: 'Conta Corrente', values: [161.79, 185, 188.03, 280, 280, 280, 280, 280, 280, 280, 280, 280] },
  { day: 14, desc: 'ACORDO NUBANK AMANDA', type: 'expense', expenseCategory: 'Fixa', cat: 'Contas', payer: 'Esposa', wallet: 'Nubank Esposa', values: [84.20, 84.20, 84.20, 84.20, 84.20, 84.20] },
  { day: 14, desc: 'ACORDO INTER', type: 'expense', expenseCategory: 'Fixa', cat: 'Contas', payer: 'Renan', wallet: 'Conta Corrente', values: [130.67, 130.67, 130.67, 130.67, 130.67] },
  { day: 15, desc: 'MENSALIDADE ESCOLA', type: 'expense', expenseCategory: 'Fixa', cat: 'Educação', payer: 'Conjunto', wallet: 'Nubank Renan', values: [862.51, 750, 729, 750, 750, 750, 750, 750, 750, 750, 750, 750] },
  { day: 20, desc: 'CONVÊNIO', type: 'expense', expenseCategory: 'Fixa', cat: 'Saúde', payer: 'Conjunto', wallet: 'Conta Corrente', values: [723.96, 735, 723.96, 723.96, 723.96, 723.96, 723.96, 723.96, 723.96, 723.96, 723.96, 723.96] },
  { day: 20, desc: 'CONTA DE ÁGUA', type: 'expense', expenseCategory: 'Variável', cat: 'Contas', payer: 'Conjunto', wallet: 'Conta Corrente', values: [172.94, 144.10, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150] },
  { day: 20, desc: 'SELECIONADOS FUTSAL', type: 'expense', expenseCategory: 'Fixa', cat: 'Lazer', payer: 'Conjunto', wallet: 'Conta Corrente', values: [160, 160, 160, 160, 160, 160, 160, 160, 160, 160, 160, 160] },
  { day: 20, desc: 'CONTA DE LUZ', type: 'expense', expenseCategory: 'Variável', cat: 'Contas', payer: 'Conjunto', wallet: 'Conta Corrente', values: [197.87, 240.22, 172.32, 180, 180, 180, 180, 180, 180, 180, 180, 180] },
  { day: 20, desc: 'ALUGUEL', type: 'expense', expenseCategory: 'Fixa', cat: 'Moradia', payer: 'Conjunto', wallet: 'Conta Corrente', values: [2093, 2114, 2060.09, 2093, 2093, 2093, 2093, 2093, 2093, 2093, 2093, 2093] },
  { day: 22, desc: 'CARTÃO DE CRÉDITO SANTANDER', type: 'expense', expenseCategory: 'Variável', cat: 'Compras', payer: 'Conjunto', wallet: 'Cartão de Crédito', values: [2572.59, 1894.92, 2164.88, 619.34, 351.15, 351.15, 351.15] },
  { day: 25, desc: 'PERUA ESCOLAR', type: 'expense', expenseCategory: 'Fixa', cat: 'Transporte', payer: 'Conjunto', wallet: 'Conta Corrente', values: [190, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200] },
  { day: 28, desc: 'CARTÃO NUBANK', type: 'expense', expenseCategory: 'Variável', cat: 'Compras', payer: 'Esposa', wallet: 'Nubank Esposa', values: [74.99, 275, 265] },
  { day: 28, desc: 'BERNARDO', type: 'expense', expenseCategory: 'Variável', cat: 'Outros', payer: 'Conjunto', wallet: 'Conta Corrente', values: [0, 300] }
];

// --- CONFIGURAÇÃO DA NUVEM (FIREBASE) ---
const firebaseConfig = {
  apiKey: "AIzaSyA_Es59NlEqDnOe_dhjcpHSrGVdrUgeLjQ",
  authDomain: "financas-familia-ff3e9.firebaseapp.com",
  projectId: "financas-familia-ff3e9",
  storageBucket: "financas-familia-ff3e9.firebasestorage.app",
  messagingSenderId: "595446987229",
  appId: "1:595446987229:web:827cc2dac148c8ab05de34"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "cofre-da-familia"; 

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(ORCAMENTOS_PADRAO);
  const [goals, setGoals] = useState([]); 
  const [accounts, setAccounts] = useState(CONTAS_INICIAIS);
  const [user, setUser] = useState(null);
  const [isCloudLoading, setIsCloudLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('financas_app_theme') === 'dark';
  });

  // Ligar à Nuvem
  useEffect(() => {
    if (!auth) {
        setIsCloudLoading(false);
        const savedTx = localStorage.getItem('financas_app_data');
        const savedBg = localStorage.getItem('financas_app_budgets');
        const savedGoals = localStorage.getItem('financas_app_goals');
        const savedAccounts = localStorage.getItem('financas_app_accounts');
        if (savedTx) setTransactions(JSON.parse(savedTx));
        else setTransactions(DADOS_INICIAIS);
        if (savedBg) setBudgets(JSON.parse(savedBg));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
        return;
    }
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
             await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
             await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch(e) { console.error("Erro auth:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Escutar a Nuvem
  useEffect(() => {
    if (!user || !db) return;
    setIsCloudLoading(true);

    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsubTx = onSnapshot(txRef, (snapshot) => {
       const loadedTxs = [];
       snapshot.forEach(d => loadedTxs.push({ ...d.data(), id: d.id }));
       setTransactions(loadedTxs.sort((a, b) => new Date(b.date) - new Date(a.date)));
       setIsCloudLoading(false);
    }, (err) => { console.error(err); setIsCloudLoading(false); });

    const bgRef = collection(db, 'artifacts', appId, 'public', 'data', 'budgets');
    const unsubBg = onSnapshot(bgRef, (snapshot) => {
       let loadedBg = { ...ORCAMENTOS_PADRAO };
       snapshot.forEach(d => { loadedBg[d.id] = d.data().amount; });
       setBudgets(loadedBg);
    }, (err) => console.error(err));

    const goalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'goals');
    const unsubGoals = onSnapshot(goalsRef, (snapshot) => {
       const loadedGoals = [];
       snapshot.forEach(d => loadedGoals.push({ ...d.data(), id: d.id }));
       setGoals(loadedGoals);
    }, (err) => console.error(err));

    const accountsRef = collection(db, 'artifacts', appId, 'public', 'data', 'accounts');
    const unsubAccounts = onSnapshot(accountsRef, (snapshot) => {
       const loadedAccounts = [];
       snapshot.forEach(d => loadedAccounts.push({ ...d.data(), id: d.id }));
       if (loadedAccounts.length > 0) setAccounts(loadedAccounts);
    }, (err) => console.error(err));

    return () => { unsubTx(); unsubBg(); unsubGoals(); unsubAccounts(); };
  }, [user]);

  useEffect(() => { 
    if (!db) {
        localStorage.setItem('financas_app_data', JSON.stringify(transactions));
        localStorage.setItem('financas_app_budgets', JSON.stringify(budgets));
        localStorage.setItem('financas_app_goals', JSON.stringify(goals));
        localStorage.setItem('financas_app_accounts', JSON.stringify(accounts));
    }
    localStorage.setItem('financas_app_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode, transactions, budgets, goals, accounts]);

  // Modais e Estados da Interface
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [compareDate, setCompareDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [advisorAdvice, setAdvisorAdvice] = useState('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  // NOVO: Estados da Modal de Venda/Recebimento Rápido
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickPayer, setQuickPayer] = useState('Conjunto');

  // Estados do Formulário de Transação e Edição
  const [editingTxId, setEditingTxId] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [expenseCategory, setExpenseCategory] = useState('Fixa');
  const [category, setCategory] = useState('Alimentação'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('pending'); 
  const [wallet, setWallet] = useState(''); 
  const [payer, setPayer] = useState('Conjunto'); 
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [installments, setInstallments] = useState(2);

  // Estados para Pagamento de Pendentes
  const [payingTx, setPayingTx] = useState(null); 
  const [payWallet, setPayWallet] = useState(''); 

  // Estados das Contas Bancárias e Ajuste
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('Conta');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [adjustingAccount, setAdjustingAccount] = useState(null);
  const [adjustBalanceInput, setAdjustBalanceInput] = useState('');

  // Outros estados
  const [deleteConfig, setDeleteConfig] = useState(null);
  const [isPlanilhaModalOpen, setIsPlanilhaModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('idle');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [fundsAmount, setFundsAmount] = useState('');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  // Estados dos Comprovantes
  const [isReceiptImportOpen, setIsReceiptImportOpen] = useState(false);
  const [isReceiptImporting, setIsReceiptImporting] = useState(false);
  const [receiptImportMessage, setReceiptImportMessage] = useState({ type: '', text: '' });

  // Filtros e Cálculos
  const upcomingBills = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const limitDate = new Date(today); limitDate.setDate(today.getDate() + 5);
    const limitStr = limitDate.toISOString().split('T')[0];
    return transactions.filter(t => t.status === 'pending' && t.type === 'expense' && t.date <= limitStr).sort((a,b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth();
    return transactions.filter(t => {
      let tYear = viewYear; let tMonth = viewMonth + 1;
      if (t.date && typeof t.date === 'string') {
         const parts = t.date.split('-');
         if (parts.length >= 2) { tYear = parseInt(parts[0]); tMonth = parseInt(parts[1]); }
      }
      const matchPeriod = viewMode === 'annual' ? tYear === viewYear : (tYear === viewYear && (tMonth - 1) === viewMonth);
      const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPeriod && matchSearch;
    });
  }, [transactions, currentDate, viewMode, searchQuery]);

  const comparisonTransactions = useMemo(() => {
    const compYear = compareDate.getFullYear();
    const compMonth = compareDate.getMonth();
    return transactions.filter(t => {
      let tYear = compYear; let tMonth = compMonth + 1;
      if (t.date && typeof t.date === 'string') {
         const parts = t.date.split('-');
         if (parts.length >= 2) { tYear = parseInt(parts[0]); tMonth = parseInt(parts[1]); }
      }
      return viewMode === 'annual' ? tYear === compYear : (tYear === compYear && (tMonth - 1) === compMonth);
    });
  }, [transactions, compareDate, viewMode]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
        if (curr.type === 'income') {
          acc.expectedIncome += curr.amount; acc.expectedBalance += curr.amount;
          if (curr.status === 'paid') { acc.realIncome += curr.amount; acc.realBalance += curr.amount; }
        } else {
          acc.expectedExpense += curr.amount; acc.expectedBalance -= curr.amount;
          if (curr.status === 'paid') { acc.realExpense += curr.amount; acc.realBalance -= curr.amount; }
        }
        return acc;
      }, { realIncome: 0, realExpense: 0, realBalance: 0, expectedIncome: 0, expectedExpense: 0, expectedBalance: 0 });
  }, [filteredTransactions]);

  const categoryStats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc;
    }, {});
    return Object.entries(grouped).map(([cat, amt]) => ({
        category: cat, amount: amt, percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0, budget: budgets[cat] || 0
      })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, budgets]);

  const comparisonStats = useMemo(() => {
    const currentExpenses = filteredTransactions.filter(t => t.type === 'expense');
    const previousExpenses = comparisonTransactions.filter(t => t.type === 'expense');
    const currentGrouped = currentExpenses.reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
    const previousGrouped = previousExpenses.reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
    const allCategories = new Set([...Object.keys(currentGrouped), ...Object.keys(previousGrouped)]);
    return Array.from(allCategories).map(cat => {
      const current = currentGrouped[cat] || 0; const previous = previousGrouped[cat] || 0;
      return { category: cat, current, previous, diff: current - previous };
    }).sort((a, b) => b.current - a.current);
  }, [filteredTransactions, comparisonTransactions]);

  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach(a => balances[a.name] = a.initialBalance || 0);
    
    transactions.forEach(t => {
      if (t.status === 'paid' && t.wallet && balances[t.wallet] !== undefined) {
        if (t.type === 'income') balances[t.wallet] += t.amount;
        else balances[t.wallet] -= t.amount;
      }
    });
    return balances;
  }, [transactions, accounts]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(`${dateString}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatPeriodLabel = () => {
    if (viewMode === 'annual') return currentDate.getFullYear().toString();
    const label = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const changePeriod = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'annual') newDate.setFullYear(prev.getFullYear() + direction);
      else newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
    setAdvisorAdvice(''); setSelectedCalendarDay(null);
  };

  const WalletIcon = ({ walletName, size = 14, className = "" }) => {
    const acc = accounts.find(a => a.name === walletName);
    const type = acc ? acc.type : 'Conta';
    if (type === 'Cartão') return <CreditCard size={size} className={className} />;
    if (type === 'Dinheiro') return <Banknote size={size} className={className} />;
    return <Landmark size={size} className={className} />; 
  };

  const PayerIcon = ({ payer, size = 14, className = "" }) => {
    if (payer === 'Renan') return <User size={size} className={`text-blue-500 ${className}`} title="Recebido/Pago por Renan" />;
    if (payer === 'Esposa') return <User size={size} className={`text-pink-500 ${className}`} title="Recebido/Pago por Esposa" />;
    return <Users size={size} className={`text-indigo-500 ${className}`} title="Conjunto" />;
  };

  // Funções de Gestão de Contas
  const handleAddAccount = async (e) => {
      e.preventDefault();
      if (!newAccountName) return;
      const newAcc = { id: crypto.randomUUID(), name: newAccountName, type: newAccountType, initialBalance: parseFloat(newAccountBalance) || 0 };
      if (db && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'accounts', newAcc.id), newAcc);
      else setAccounts([...accounts, newAcc]);
      setIsAccountModalOpen(false); setNewAccountName(''); setNewAccountType('Conta'); setNewAccountBalance('');
  };

  const confirmAdjustBalance = async (e) => {
      e.preventDefault();
      if (!adjustingAccount || adjustBalanceInput === '') return;
      
      const newTarget = parseFloat(adjustBalanceInput);
      const currentCalculated = accountBalances[adjustingAccount.name] || 0;
      const diff = newTarget - currentCalculated;
      const updatedAcc = { ...adjustingAccount, initialBalance: (adjustingAccount.initialBalance || 0) + diff };
      
      if (db && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'accounts', updatedAcc.id), updatedAcc);
      else setAccounts(accounts.map(a => a.id === updatedAcc.id ? updatedAcc : a));
      
      setAdjustingAccount(null); setAdjustBalanceInput('');
  };

  // Funções das Caixinhas (Metas)
  const handleAddGoal = async (e) => {
      e.preventDefault();
      if (!goalName || !goalTarget) return;
      const newGoal = { id: crypto.randomUUID(), name: goalName, targetAmount: parseFloat(goalTarget), currentAmount: 0 };
      if (db && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goals', newGoal.id), newGoal);
      else setGoals([...goals, newGoal]);
      setIsGoalModalOpen(false); setGoalName(''); setGoalTarget('');
  };

  const handleAddFunds = async (e) => {
      e.preventDefault();
      if (!fundsAmount || !selectedGoal) return;
      const updatedGoal = { ...selectedGoal, currentAmount: selectedGoal.currentAmount + parseFloat(fundsAmount) };
      if (db && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goals', updatedGoal.id), updatedGoal);
      else setGoals(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
      setIsAddFundsModalOpen(false); setFundsAmount(''); setSelectedGoal(null);
  };

  const handleDeleteGoal = async (id) => {
      if (confirm("Deseja mesmo excluir esta caixinha de meta?")) {
          if (db && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goals', id));
          else setGoals(goals.filter(g => g.id !== id));
      }
  };

  const applyQuickAdd = (typeObj) => {
      if (typeObj === 'Padaria') { setDescription('Padaria'); setCategory('Alimentação'); setType('expense'); setExpenseCategory('Variável'); }
      if (typeObj === 'Uber') { setDescription('Uber'); setCategory('Transporte'); setType('expense'); setExpenseCategory('Variável'); }
      if (typeObj === 'Mercado') { setDescription('Mercado'); setCategory('Alimentação'); setType('expense'); setExpenseCategory('Variável'); }
      if (typeObj === 'Luz') { setDescription('Conta de Luz'); setCategory('Contas'); setType('expense'); setExpenseCategory('Variável'); }
  };

  const handleEditClick = (tx) => {
      setEditingTxId(tx.id);
      setDescription(tx.description);
      setAmount(tx.amount.toString());
      setType(tx.type);
      setExpenseCategory(tx.expenseCategory || 'Fixa');
      setCategory(tx.category);
      setDate(tx.date);
      setStatus(tx.status);
      setWallet(tx.wallet || (accounts.length > 0 ? accounts[0].name : 'Conta Corrente'));
      setPayer(tx.payer || 'Conjunto');
      setRecurrenceType('none'); 
      setIsModalOpen(true);
  };

  // --- FUNÇÃO DO BOTÃO FLUTUANTE (RECEITA RÁPIDA) ---
  const handleQuickAddIncome = async (e) => {
      e.preventDefault();
      if (!quickAmount) return;
      
      const newTx = {
          id: crypto.randomUUID(), 
          description: 'Recebimento Rápido', 
          amount: parseFloat(quickAmount), 
          type: 'income',
          expenseCategory: '',
          category: 'Trabalho', 
          date: new Date().toISOString().split('T')[0], 
          status: 'paid', 
          wallet: accounts.length > 0 ? accounts[0].name : 'Conta Corrente', 
          payer: quickPayer, 
          isSubscription: false
      };

      if (db && user) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', newTx.id), newTx);
      } else {
          setTransactions([newTx, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
      
      setIsQuickAddModalOpen(false); 
      setQuickAmount(''); 
      setQuickPayer('Conjunto');
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    let currentTransDate = new Date(`${date}T12:00:00`);
    const finalWallet = status === 'paid' ? wallet : '';

    if (editingTxId) {
        const originalTx = transactions.find(t => t.id === editingTxId);
        const updatedTx = {
            id: editingTxId,
            description,
            amount: parseFloat(amount),
            type,
            expenseCategory: type === 'expense' ? expenseCategory : '',
            category: type === 'income' && category === 'Alimentação' ? 'Trabalho' : category,
            date: currentTransDate.toISOString().split('T')[0],
            status,
            wallet: finalWallet,
            payer,
            isSubscription: originalTx ? originalTx.isSubscription : false
        };

        if (db && user) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', editingTxId), updatedTx);
        } else {
            setTransactions(transactions.map(t => t.id === editingTxId ? updatedTx : t).sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    } else {
        const newTrans = [];
        if (recurrenceType === 'subscription') {
            newTrans.push({
              id: crypto.randomUUID(), description, amount: parseFloat(amount), type,
              expenseCategory: type === 'expense' ? expenseCategory : '',
              category: type === 'income' && category === 'Alimentação' ? 'Trabalho' : category,
              date: currentTransDate.toISOString().split('T')[0], status, wallet: finalWallet, payer, isSubscription: true
            });
        } else {
            const totalInstallments = recurrenceType === 'installments' ? installments : 1;
            for (let i = 0; i < totalInstallments; i++) {
              newTrans.push({
                id: crypto.randomUUID(),
                description: totalInstallments > 1 ? `${description} (${i + 1}/${totalInstallments})` : description,
                amount: parseFloat(amount), type, 
                expenseCategory: type === 'expense' ? expenseCategory : '',
                category: type === 'income' && category === 'Alimentação' ? 'Trabalho' : category,
                date: currentTransDate.toISOString().split('T')[0], status: i === 0 ? status : 'pending', wallet: i === 0 ? finalWallet : '', payer, isSubscription: false
              });
              currentTransDate.setMonth(currentTransDate.getMonth() + 1);
            }
        }

        if (db && user) {
            for (const tx of newTrans) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', tx.id), tx);
        } else {
            setTransactions([...newTrans, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    }
    
    setIsModalOpen(false); resetForm();
  };

  const resetForm = () => {
    setEditingTxId(null);
    setDescription(''); setAmount(''); setType('expense'); setExpenseCategory('Fixa'); setCategory('Alimentação'); 
    setDate(new Date().toISOString().split('T')[0]); setStatus('pending'); 
    setWallet(accounts.length > 0 ? accounts[0].name : 'Conta Corrente');
    setPayer('Conjunto'); setRecurrenceType('none'); setInstallments(2);
  };

  const handleToggleClick = (t) => {
      if (t.status === 'pending') {
          setPayWallet(accounts.length > 0 ? accounts[0].name : 'Conta Corrente');
          setPayingTx(t);
      } else {
          updateTransactionStatus(t, 'pending', '');
      }
  };

  const confirmPayment = async (e) => {
      e.preventDefault();
      if (!payingTx || !payWallet) return;
      await updateTransactionStatus(payingTx, 'paid', payWallet);
      setPayingTx(null);
  };

  const updateTransactionStatus = async (tx, newStatus, newWallet) => {
      const updatedTx = { ...tx, status: newStatus, wallet: newWallet };
      
      if (db && user) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', tx.id), updatedTx);
          if (newStatus === 'paid' && tx.isSubscription) {
              const currentTxDate = new Date(`${tx.date}T12:00:00`); currentTxDate.setMonth(currentTxDate.getMonth() + 1);
              const nextDateString = currentTxDate.toISOString().split('T')[0];
              const alreadyExists = transactions.some(t => t.description === tx.description && t.date === nextDateString && t.isSubscription);
              if (!alreadyExists) {
                  const newTx = { ...tx, id: crypto.randomUUID(), date: nextDateString, status: 'pending', wallet: '' };
                  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', newTx.id), newTx);
              }
          }
      } else {
          let newTransactions = transactions.map(t => t.id === tx.id ? updatedTx : t);
          if (newStatus === 'paid' && tx.isSubscription) {
              const currentTxDate = new Date(`${tx.date}T12:00:00`); currentTxDate.setMonth(currentTxDate.getMonth() + 1);
              const nextDateString = currentTxDate.toISOString().split('T')[0];
              const alreadyExists = newTransactions.some(t => t.description === tx.description && t.date === nextDateString && t.isSubscription);
              if (!alreadyExists) {
                  newTransactions.push({ ...tx, id: crypto.randomUUID(), date: nextDateString, status: 'pending', wallet: '' });
              }
          }
          setTransactions(newTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
  };

  const confirmDelete = async (ids) => {
      if (db && user) {
          for (const id of ids) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
      } else {
          setTransactions(transactions.filter(t => !ids.includes(t.id)));
      }
      setDeleteConfig(null);
  };

  const exportCSV = () => {
    const headers = "Data,Descrição,Categoria,Tipo,Valor,Conta,Pagador,Status\n";
    const rows = transactions.map(t => `${t.date},${t.description},${t.category},${t.type === 'income' ? 'Receita' : 'Despesa'},${t.amount},${t.wallet || 'N/A'},${t.payer || 'Conjunto'},${t.status === 'paid' ? 'Pago' : 'Pendente'}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `financas_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const updateBudget = async (cat) => {
    const newBudget = prompt(`Defina o limite mensal para ${cat} (R$):`, budgets[cat] || 0);
    if (newBudget !== null && !isNaN(newBudget)) {
        const amount = parseFloat(newBudget);
        if (db && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', cat), { amount });
        else setBudgets({ ...budgets, [cat]: amount });
    }
  };

  const handleImportPlanilha = async () => {
      setImportStatus('importing');
      try {
          let toImport = [];
          const todayStr = new Date().toISOString().split('T')[0];

          RAW_PLANILHA.forEach(row => {
              row.values.forEach((val, index) => {
                  if (val > 0) {
                      const monthStr = String(index + 1).padStart(2, '0');
                      const dayStr = String(row.day).padStart(2, '0');
                      const dateStr = `2026-${monthStr}-${dayStr}`;
                      const isPast = dateStr <= todayStr;
                      
                      toImport.push({
                          id: crypto.randomUUID(), description: row.desc, amount: val, type: row.type,
                          expenseCategory: row.expenseCategory || '',
                          category: row.cat, date: dateStr, status: isPast ? 'paid' : 'pending',
                          wallet: isPast ? row.wallet : '', payer: row.payer || 'Conjunto', isSubscription: false
                      });
                  }
              });
          });

          if (db && user) {
              for (const tx of toImport) {
                  const exists = transactions.some(t => t.description === tx.description && t.date === tx.date);
                  if (!exists) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', tx.id), tx);
              }
          }
          setImportStatus('success');
          setTimeout(() => { setIsPlanilhaModalOpen(false); setImportStatus('idle'); }, 3000);
      } catch (error) { console.error(error); setImportStatus('idle'); }
  };

  const callGeminiAPI = async (payload) => {
      if (!apiKey) throw new Error("Chave da API não encontrada. Cole-a no código.");
      const model = 'gemini-1.5-flash';
      try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (!res.ok) { const errData = await res.json(); throw new Error(errData.error?.message || "Erro na API do Google."); }
          return await res.json();
      } catch (e) { throw e; }
  };

  const handleGetAdvisorAdvice = async () => {
      setIsAdvisorLoading(true);
      try {
          const topCategories = categoryStats.slice(0,3).map(c => `${c.category} (${formatCurrency(c.amount)})`).join(', ');
          const systemInstruction = `Você é um Conselheiro Financeiro amigável e super inteligente.
          Analise o resumo do mês deste usuário. O foco deve ser dar 1 dica ou insight construtivo, rápido e motivador (máximo 3 frases curtas).
          Seja direto, como se fosse um SMS.`;
          
          const payload = {
            contents: [{ role: "user", parts: [
              { text: `Resumo do Mês:\nReceitas Previstas: ${summary.expectedIncome}\nDespesas Previstas: ${summary.expectedExpense}\nSaldo Previsto: ${summary.expectedBalance}\nMaiores Gastos: ${topCategories || 'Nenhum ainda'}` }
            ]}],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          };

          const responseData = await callGeminiAPI(payload);
          setAdvisorAdvice(responseData.candidates[0].content.parts[0].text);
      } catch(e) { setAdvisorAdvice(`Ops! Falhou: ${e.message}`); } finally { setIsAdvisorLoading(false); }
  };

  // --- NOVA IA: PREPARADA PARA LER ARRAYS (MÚLTIPLOS RECEBIMENTOS) ---
  const handleReceiptImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsReceiptImporting(true); setReceiptImportMessage({ type: '', text: '' });
    try {
      let mimeType = file.type; let base64Data = "";
      if (file.type.startsWith('image/')) {
          base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height; const maxSize = 800; 
                if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; } 
                else if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]); 
              };
              img.onerror = () => reject(new Error("Falha ao processar a imagem da câmara."));
              img.src = reader.result;
            };
            reader.onerror = () => reject(new Error("Falha ao ler o ficheiro no telemóvel."));
            reader.readAsDataURL(file);
          });
          mimeType = 'image/jpeg';
      } else {
          base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.onerror = () => reject(new Error("Falha ao ler o ficheiro PDF."));
              reader.readAsDataURL(file);
          });
      }

      // O Cérebro foi adaptado para retornar um Array!
      const systemInstruction = `Você é um assistente financeiro inteligente. Analise a imagem (pode ser um único comprovante ou um print de extrato com vários recebimentos/pagamentos).
      Retorne APENAS um ARRAY de objetos JSON. Cada objeto deve ter:
      'description' (Nome curto do cliente ou loja),
      'amount' (Valor exato em número),
      'type' (Use 'income' para dinheiro recebido/PIX, ou 'expense' para pagamentos efetuados),
      'category' (Categoria padrão, ex: Trabalho, Alimentação),
      'date' (YYYY-MM-DD. Se não tiver data, use a data de hoje).
      Se for apenas 1 comprovante, retorne um array de 1 item. NÃO adicione texto extra.`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: "Extraia os dados num Array de JSON." }, { inlineData: { mimeType, data: base64Data } }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { responseMimeType: "application/json" }
      };

      const responseData = await callGeminiAPI(payload);
      let rawText = responseData.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let extractedArray = JSON.parse(rawText);
      if (!Array.isArray(extractedArray)) extractedArray = [extractedArray];

      let newRecordsCount = 0;
      let offlineTransactions = [...transactions];

      for (const extracted of extractedArray) {
          const matchIndex = offlineTransactions.findIndex(t => t.status === 'pending' && t.type === extracted.type && Math.abs(t.amount - extracted.amount) <= 2.0);

          if (matchIndex >= 0) {
              const updatedTx = { ...offlineTransactions[matchIndex], status: 'paid', date: extracted.date && extracted.date.match(/^\d{4}-\d{2}-\d{2}$/) ? extracted.date : offlineTransactions[matchIndex].date };
              if (db && user) {
                  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', updatedTx.id), updatedTx);
                  // Lógica de assinatura simplificada
              } else {
                  offlineTransactions[matchIndex] = updatedTx;
              }
              newRecordsCount++;
          } else {
              const newTx = {
                id: crypto.randomUUID(), description: extracted.description || 'Lançamento IA', amount: parseFloat(extracted.amount) || 0, type: extracted.type === 'income' ? 'income' : 'expense',
                category: extracted.category || 'Outros', date: extracted.date && extracted.date.match(/^\d{4}-\d{2}-\d{2}$/) ? extracted.date : new Date().toISOString().split('T')[0],
                status: 'paid', wallet: accounts.length > 0 ? accounts[0].name : 'Conta Corrente', payer: 'Conjunto', expenseCategory: '', isSubscription: false
              };
              if (db && user) {
                  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', newTx.id), newTx);
              } else {
                  offlineTransactions.push(newTx);
              }
              newRecordsCount++;
          }
      }
      
      if (!db || !user) {
          setTransactions(offlineTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

      setReceiptImportMessage({ type: 'success', text: `${newRecordsCount} lançamento(s) registado(s) com Sucesso ✅` });
      setTimeout(() => setIsReceiptImportOpen(false), 4500);
    } catch (err) { setReceiptImportMessage({ type: 'error', text: `Falhou: ${err.message}` }); } finally { setIsReceiptImporting(false); if(e.target) e.target.value = ''; }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const paidTransactions = filteredTransactions.filter(t => t.status === 'paid');
  const pendingTransactions = filteredTransactions.filter(t => t.status === 'pending');

  if (isCloudLoading) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 text-white">
            <Loader2 className="animate-spin w-12 h-12 mb-4" />
            <p className="text-lg font-medium text-indigo-100">A carregar o seu Cofre...</p>
        </div>
     );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} font-sans pb-12`}>
      <header className="bg-indigo-600 dark:bg-indigo-900 text-white pt-6 pb-32 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Wallet size={32} className="text-indigo-200" />
              <h1 className="text-2xl font-bold tracking-tight">Finanças<span className="text-indigo-200">App</span></h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full hover:bg-white/10 transition-colors relative" title="Notificações">
                  <Bell size={20} />
                  {upcomingBills.length > 0 && <span className="absolute top-1 right-1 bg-rose-500 border border-white dark:border-gray-900 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center animate-pulse">{upcomingBills.length}</span>}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Contas Próximas</h4>
                      <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {upcomingBills.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-500">Nenhuma conta para os próximos 5 dias.</p>
                      ) : (
                        upcomingBills.map(b => (
                          <div key={b.id} className={`p-3 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 ${b.date < todayStr ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate w-32">{b.description}</p>
                              <p className={`text-xs ${b.date < todayStr ? 'text-rose-500 font-bold' : 'text-gray-500'}`}>{formatDate(b.date)} {b.date < todayStr && '(Atrasada)'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(b.amount)}</p>
                              <button onClick={() => {handleToggleClick(b); setIsNotificationsOpen(false);}} className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded mt-1 hover:bg-emerald-200">Pagar</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Sun size={20} className="hidden dark:block"/><Moon size={20} className="dark:hidden" /></button>
              
              <button onClick={() => setIsPlanilhaModalOpen(true)} className="bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-950 dark:hover:bg-indigo-900 px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-white" title="Importar Planilha Antiga">
                <Database size={20} /> <span className="hidden xl:inline">Planilha</span>
              </button>
              <button onClick={() => { setReceiptImportMessage({type: '', text: ''}); setIsReceiptImportOpen(true); }} className="bg-teal-500 hover:bg-teal-400 dark:bg-teal-700 dark:hover:bg-teal-600 px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-white" title="Ler Comprovante (IA)">
                <Receipt size={20} /> <span className="hidden lg:inline">Extrato / IA</span>
              </button>
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-700 dark:hover:bg-indigo-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={20} /> <span className="hidden sm:inline">Nova Despesa</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto pb-2">
            <div className="bg-indigo-700/50 dark:bg-indigo-950/50 p-1 rounded-lg inline-flex w-full md:w-auto overflow-x-auto min-w-max">
              {['monthly', 'calendar', 'accounts', 'goals', 'charts'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${viewMode === mode ? 'bg-indigo-500 text-white shadow-sm' : 'text-indigo-200 hover:text-white'}`}>
                  {mode === 'monthly' ? 'Visão Mensal' : mode === 'calendar' ? 'Calendário' : mode === 'accounts' ? 'Contas' : mode === 'goals' ? 'Metas' : 'Gráficos e IA'}
                </button>
              ))}
            </div>
            {(viewMode === 'monthly' || viewMode === 'charts' || viewMode === 'calendar') && (
              <div className="flex items-center gap-4 bg-indigo-700/30 dark:bg-indigo-950/30 px-2 py-1.5 rounded-lg border border-indigo-500/30 min-w-max">
                <button onClick={() => changePeriod(-1)} className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors text-indigo-100 hover:text-white"><ChevronLeft size={20}/></button>
                <div className="flex items-center gap-2 font-semibold min-w-[160px] justify-center text-lg">
                  <CalendarDays size={18} className="text-indigo-300" /><span>{formatPeriodLabel()}</span>
                </div>
                <button onClick={() => changePeriod(1)} className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors text-indigo-100 hover:text-white"><ChevronRight size={20}/></button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        
        {/* VISAO MENSAL (LISTAS) */}
        {viewMode === 'monthly' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo Atual <span className="text-xs text-gray-400">(Pago)</span></p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.realBalance)}</h3>
                  <p className="text-xs text-gray-400 mt-1">Previsto: {formatCurrency(summary.expectedBalance)}</p>
                </div>
                <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><DollarSign size={24} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Receitas</p>
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.expectedIncome)}</h3>
                </div>
                <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><TrendingUp size={24} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Despesas</p>
                  <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(summary.expectedExpense)}</h3>
                </div>
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"><TrendingDown size={24} /></div>
              </div>
            </div>

            <div className="mb-6 flex justify-end">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Pesquisar transações..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <Circle size={20} className="text-amber-500" /> Pendentes
                  </h2>
                  <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 py-0.5 px-2.5 rounded-full text-xs font-bold">{pendingTransactions.length}</span>
                </div>
                {pendingTransactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 flex-1 flex flex-col justify-center">
                    <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Tudo em dia! Nenhuma conta pendente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white dark:bg-gray-800 text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                          <th className="px-4 py-3 font-semibold">Pagar</th><th className="px-4 py-3 font-semibold">Descrição / Data</th><th className="px-4 py-3 font-semibold text-right">Valor</th><th className="px-4 py-3 font-semibold text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {pendingTransactions.map((t) => {
                          const isOverdue = t.date < todayStr;
                          return (
                            <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${isOverdue ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                              <td className="px-4 py-3"><button onClick={() => handleToggleClick(t)}><Circle size={22} className="text-amber-500 hover:text-emerald-500 hover:fill-emerald-100 transition-all" /></button></td>
                              <td className="px-4 py-3 flex flex-col">
                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                                    {t.description} 
                                    {t.expenseCategory === 'Fixa' && <Pin size={12} className="text-gray-400" title="Despesa Fixa" />}
                                    {t.expenseCategory === 'Variável' && <TrendUpIcon size={12} className="text-gray-400" title="Despesa Variável" />}
                                    {t.isSubscription && <RefreshCw size={12} className="text-amber-500" title="Repete todo o mês" />}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs ${isOverdue ? 'text-rose-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{formatDate(t.date)}</span>
                                  {isOverdue ? <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-[9px] uppercase px-1.5 rounded font-bold flex items-center gap-1"><AlertTriangle size={10}/> Atrasada</span> : null}
                                  {t.payer && t.payer !== 'Conjunto' && <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600"><PayerIcon payer={t.payer} size={10} /> {t.payer}</span>}
                                </div>
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(t.amount)}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <button onClick={() => handleEditClick(t)} className="text-gray-300 hover:text-indigo-500 p-1 mr-1" title="Editar"><Edit2 size={16} /></button>
                                  <button onClick={() => setDeleteConfig(t)} className="text-gray-300 hover:text-rose-500 p-1" title="Excluir"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-500" /> Realizadas / Pagas
                  </h2>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2.5 rounded-full text-xs font-bold">{paidTransactions.length}</span>
                </div>
                {paidTransactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 flex-1 flex flex-col justify-center">
                    <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Nenhuma transação concluída</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white dark:bg-gray-800 text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                          <th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Descrição</th><th className="px-4 py-3 font-semibold">Subcategoria</th><th className="px-4 py-3 font-semibold text-right">Valor</th><th className="px-4 py-3 font-semibold text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {paidTransactions.map((t) => {
                          const CatIcon = CATEGORIAS[t.category]?.icon || CATEGORIAS['Outros'].icon;
                          const catColors = CATEGORIAS[t.category] || CATEGORIAS['Outros'];
                          return (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                              <td className="px-4 py-3"><button onClick={() => handleToggleClick(t)}><CheckCircle2 size={20} className="text-emerald-500" /></button></td>
                              <td className="px-4 py-3 flex flex-col">
                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                                    {t.description}
                                    {t.expenseCategory === 'Fixa' && <Pin size={12} className="text-gray-400" title="Despesa Fixa" />}
                                    {t.expenseCategory === 'Variável' && <TrendUpIcon size={12} className="text-gray-400" title="Despesa Variável" />}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600" title={`Carteira: ${t.wallet}`}><WalletIcon walletName={t.wallet} size={10} /> <span className="truncate max-w-[60px]">{t.wallet || 'S/ Conta'}</span></span>
                                  {t.payer && t.payer !== 'Conjunto' && <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600" title={`Pago por: ${t.payer}`}><PayerIcon payer={t.payer} size={10} /> {t.payer}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${catColors.bg} ${darkMode ? catColors.darkBg : ''} ${catColors.color}`}><CatIcon size={12} /> <span>{t.category}</span></div>
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <button onClick={() => handleEditClick(t)} className="text-gray-300 hover:text-indigo-500 p-1 mr-1" title="Editar"><Edit2 size={16} /></button>
                                  <button onClick={() => setDeleteConfig(t)} className="text-gray-300 hover:text-rose-500 p-1" title="Excluir"><Trash2 size={16} /></button>
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
          </>
        )}

        {/* VISAO DE CONTAS (BANCOS) */}
        {viewMode === 'accounts' && (
          <div className="mb-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Landmark size={24} className="text-indigo-500"/> Minhas Contas / Bancos</h2>
                <button onClick={() => setIsAccountModalOpen(true)} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-4 py-2 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors flex items-center gap-2 shadow-sm"><Plus size={18}/> <span className="hidden sm:inline">Nova Conta</span></button>
             </div>
             
             {/* Saldo Total */}
             <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-sm p-6 text-white mb-6 flex items-center justify-between">
                <div>
                   <p className="text-teal-100 text-sm font-medium mb-1">Saldo Geral (Soma de Todas as Contas)</p>
                   <h3 className="text-3xl font-bold">{formatCurrency(Object.values(accountBalances).reduce((a,b)=>a+b, 0))}</h3>
                </div>
                <div className="p-4 bg-white/20 rounded-full"><Wallet size={32} /></div>
             </div>

             {accounts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center flex flex-col items-center transition-colors">
                   <Landmark size={48} className="text-indigo-200 dark:text-indigo-800 mb-4" />
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Nenhuma conta encontrada</h3>
                   <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">Adicione as suas contas bancárias e carteiras para acompanhar os saldos em tempo real.</p>
                   <button onClick={() => setIsAccountModalOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Adicionar Primeira Conta</button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {accounts.map(acc => (
                      <div key={acc.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors hover:shadow-md flex flex-col justify-between h-full relative group">
                         <button onClick={() => setAdjustingAccount(acc)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-all opacity-0 group-hover:opacity-100" title="Ajustar Saldo Manualmente"><Edit2 size={16} /></button>
                         <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl ${acc.type === 'Cartão' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : acc.type === 'Dinheiro' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                               <WalletIcon walletName={acc.name} size={24} />
                            </div>
                            <div>
                               <p className="font-bold text-gray-800 dark:text-gray-100">{acc.name}</p>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{acc.type}</p>
                            </div>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Saldo em Caixa (Real)</p>
                            <p className={`font-bold text-2xl ${accountBalances[acc.name] >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(accountBalances[acc.name] || 0)}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {/* VISAO DE CALENDÁRIO */}
        {viewMode === 'calendar' && (() => {
           const year = currentDate.getFullYear();
           const month = currentDate.getMonth();
           const daysInMonth = new Date(year, month + 1, 0).getDate();
           const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Domingo
           
           const blanks = Array(firstDayOfMonth).fill(null);
           const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

           return (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-8 transition-colors">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><CalendarDays size={20} className="text-indigo-500" /> Calendário Mensal</h2>
                
                <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                           {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="text-xs font-bold text-gray-400 uppercase">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                           {blanks.map((_, i) => <div key={`blank-${i}`} className="p-2"></div>)}
                           {days.map(d => {
                              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                              const dayTxs = transactions.filter(t => t.date === dateStr);
                              const hasIncome = dayTxs.some(t => t.type === 'income');
                              const hasExpense = dayTxs.some(t => t.type === 'expense');
                              const isSelected = selectedCalendarDay === dateStr;
                              const isToday = dateStr === new Date().toISOString().split('T')[0];

                              return (
                                 <div key={d} onClick={() => setSelectedCalendarDay(dateStr)} className={`p-2 sm:p-4 rounded-xl border cursor-pointer transition-all min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-between hover:-translate-y-1 ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500/20' : isToday ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                    <div className={`text-sm sm:text-lg font-semibold ${isToday ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}>{d}</div>
                                    <div className="flex justify-center gap-1.5 mt-1">
                                       {hasIncome && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>}
                                       {hasExpense && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 shadow-sm"></div>}
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                    </div>
                </div>

                {/* Detalhes do Dia Selecionado */}
                {selectedCalendarDay && (() => {
                    const dayTransactions = transactions.filter(t => t.date === selectedCalendarDay);
                    return (
                       <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">Transações de {formatDate(selectedCalendarDay)}</h3>
                             <button onClick={() => setSelectedCalendarDay(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                          </div>
                          
                          {dayTransactions.length === 0 ? (
                             <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">Sem transações neste dia.</p>
                          ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {dayTransactions.map(t => {
                                   const CatIcon = CATEGORIAS[t.category]?.icon || CATEGORIAS['Outros'].icon;
                                   const isIncome = t.type === 'income';
                                   return (
                                      <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                                         <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                               <CatIcon size={16} />
                                            </div>
                                            <div>
                                               <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.description}</p>
                                               <p className="text-xs text-gray-500">{t.status === 'paid' ? '✅ Pago' : '⏳ Pendente'} • {t.payer}</p>
                                            </div>
                                         </div>
                                         <div className={`font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                                         </div>
                                      </div>
                                   )
                                })}
                             </div>
                          )}
                       </div>
                    );
                })()}
              </div>
           );
        })()}

        {/* VISAO DE METAS (CAIXINHAS) */}
        {viewMode === 'goals' && (
          <div className="mb-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Target size={24} className="text-indigo-500"/> Caixinhas de Metas</h2>
                <button onClick={() => setIsGoalModalOpen(true)} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-4 py-2 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors flex items-center gap-2 shadow-sm"><Plus size={18}/> <span className="hidden sm:inline">Nova Meta</span></button>
             </div>
             
             {goals.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center flex flex-col items-center transition-colors">
                   <PiggyBank size={48} className="text-indigo-200 dark:text-indigo-800 mb-4" />
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Ainda não tem caixinhas</h3>
                   <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">Crie metas para as vossas férias, para comprar um carro novo ou para o fundo de emergência.</p>
                   <button onClick={() => setIsGoalModalOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Criar a Primeira Meta</button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {goals.map(g => {
                       const percentage = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                       const isComplete = percentage >= 100;
                       return (
                           <div key={g.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors hover:shadow-md flex flex-col">
                               <div className="flex justify-between items-start mb-4">
                                   <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{g.name}</h3>
                                   <button onClick={() => handleDeleteGoal(g.id)} className="text-gray-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                               </div>
                               
                               <div className="mb-2 flex justify-between text-sm items-end">
                                   <span className={`font-bold text-xl ${isComplete ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{formatCurrency(g.currentAmount)}</span>
                                   <span className="text-gray-500 dark:text-gray-400 mb-1">de {formatCurrency(g.targetAmount)}</span>
                               </div>
                               
                               <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden flex-shrink-0">
                                   <div className={`h-3 rounded-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }}></div>
                               </div>
                               <p className="text-right text-xs text-gray-400 font-medium mb-6">{percentage.toFixed(0)}% concluído</p>
                               
                               <div className="mt-auto">
                                   <button onClick={() => { setSelectedGoal(g); setIsAddFundsModalOpen(true); }} disabled={isComplete} className="w-full py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                       {isComplete ? <><CheckCircle2 size={18} className="text-emerald-500"/> Meta Alcançada!</> : <><PiggyBank size={18}/> Guardar Dinheiro</>}
                                   </button>
                               </div>
                           </div>
                       );
                   })}
                </div>
             )}
          </div>
        )}

        {/* VISAO DE GRAFICOS E IA */}
        {viewMode === 'charts' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles size={120} /></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                   <div className="flex-shrink-0 bg-white/20 p-4 rounded-full backdrop-blur-sm"><Bot size={40} className="text-white" /></div>
                   <div className="flex-1 text-center md:text-left">
                      <h2 className="text-xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">Conselheiro Financeiro IA</h2>
                      {advisorAdvice ? <p className="text-purple-100 italic leading-relaxed">"{advisorAdvice}"</p> : <p className="text-purple-200">A IA pode analisar os seus gastos deste mês e dar-lhe uma dica preciosa.</p>}
                   </div>
                   <div className="flex-shrink-0">
                      <button onClick={handleGetAdvisorAdvice} disabled={isAdvisorLoading} className="bg-white text-purple-700 hover:bg-purple-50 px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2">
                          {isAdvisorLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                          {advisorAdvice ? 'Pedir novo conselho' : 'Analisar meu Mês'}
                      </button>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><Target size={20} className="text-indigo-500" /> Orçamentos e Gastos Atuais</h2>
                <div className="space-y-5">
                  {categoryStats.filter(c => c.amount > 0 || c.budget > 0).map(stat => {
                    const CatIcon = CATEGORIAS[stat.category]?.icon || CATEGORIAS['Outros'].icon;
                    const percentOfBudget = stat.budget > 0 ? Math.min((stat.amount / stat.budget) * 100, 100) : 0;
                    const isOverBudget = stat.budget > 0 && stat.amount > stat.budget;
                    return (
                      <div key={stat.category}>
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => updateBudget(stat.category)}>
                            <div className={`p-1.5 rounded-md ${CATEGORIAS[stat.category]?.bg} ${darkMode ? CATEGORIAS[stat.category]?.darkBg : ''} ${CATEGORIAS[stat.category]?.color}`}><CatIcon size={16} /></div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm group-hover:underline">{stat.category}</span>
                          </div>
                          <div className="text-right">
                            <span className={`block text-sm font-semibold ${isOverBudget ? 'text-rose-500' : 'text-gray-800 dark:text-gray-200'}`}>{formatCurrency(stat.amount)}</span>
                            <span className="block text-xs text-gray-500">{stat.budget > 0 ? `Limite: ${formatCurrency(stat.budget)}` : 'Sem limite'}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : (CATEGORIAS[stat.category]?.barColor || 'bg-gray-500')}`} style={{ width: `${stat.budget > 0 ? percentOfBudget : stat.percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><PieChart size={20} className="text-indigo-500" /> Distribuição</h2>
                <div className="flex-1 flex flex-col justify-center">
                  {categoryStats.length > 0 && categoryStats[0].amount > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-48 mb-8">
                        <div className="absolute inset-0 rounded-full border-[16px] border-gray-100 dark:border-gray-700"></div>
                        {categoryStats.map((stat, index) => {
                          if(stat.percentage === 0) return null;
                          let previousTotal = categoryStats.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0);
                          let colorHex = ['#f97316','#3b82f6','#6366f1','#eab308','#ec4899','#10b981','#a855f7','#ef4444','#06b6d4'][index % 9];
                          return (
                            <svg key={stat.category} className="absolute inset-0 w-full h-full transform -rotate-90">
                              <circle cx="96" cy="96" r="80" fill="transparent" stroke={colorHex} strokeWidth="16" strokeDasharray={`${stat.percentage * 5.02} 502`} strokeDashoffset={-(previousTotal * 5.02)} />
                            </svg>
                          );
                        })}
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm text-gray-500">Total</span><span className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(summary.expectedExpense)}</span></div>
                      </div>
                      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {categoryStats.filter(c => c.percentage > 0).slice(0, 6).map((stat, i) => (
                          <div key={stat.category} className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#f97316','#3b82f6','#6366f1','#eab308','#ec4899','#10b981','#a855f7'][i] }}></div><span className="text-gray-600 dark:text-gray-300 truncate w-20">{stat.category}</span></div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{stat.percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (<p className="text-center text-gray-400">Sem dados suficientes.</p>)}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><TrendingDown size={20} className="text-indigo-500" /> Comparativo de Despesas</h2>
                  <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                    <input type="month" value={`${compareDate.getFullYear()}-${String(compareDate.getMonth() + 1).padStart(2, '0')}`} onChange={(e) => { if(e.target.value) { const [y, m] = e.target.value.split('-'); setCompareDate(new Date(parseInt(y), parseInt(m) - 1, 15)); } }} className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded outline-none" />
                    <span>vs</span>
                    <input type="month" value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`} onChange={(e) => { if(e.target.value) { const [y, m] = e.target.value.split('-'); setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 15)); } }} className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded outline-none" />
                  </div>
                </div>

                {comparisonStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400"><PieChart size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhum dado para comparar nestes períodos.</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                          <th className="pb-3 font-medium px-4">Categoria</th><th className="pb-3 font-medium text-right px-4">{formatComparePeriodLabel()}</th><th className="pb-3 font-medium text-right px-4">{formatPeriodLabel()}</th><th className="pb-3 font-medium text-right px-4">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {comparisonStats.map((stat) => {
                          const CatIcon = CATEGORIAS[stat.category]?.icon || CATEGORIAS['Outros'].icon;
                          const isMore = stat.diff > 0; const isLess = stat.diff < 0; const isSame = stat.diff === 0;
                          return (
                            <tr key={stat.category} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="py-4 px-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-md ${CATEGORIAS[stat.category]?.bg} ${darkMode ? CATEGORIAS[stat.category]?.darkBg : ''} ${CATEGORIAS[stat.category]?.color}`}><CatIcon size={18} /></div><span className="font-medium text-gray-700 dark:text-gray-200">{stat.category}</span></div></td>
                              <td className="py-4 px-4 text-right text-gray-500">{formatCurrency(stat.previous)}</td><td className="py-4 px-4 text-right font-medium text-gray-800 dark:text-gray-200">{formatCurrency(stat.current)}</td>
                              <td className="py-4 px-4 text-right">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isMore ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : isLess ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                  {isMore ? <ArrowUpRight size={14} /> : isLess ? <ArrowDownRight size={14} /> : <Minus size={14} />}{isSame ? 'Manteve' : `${isMore ? 'Mais ' : 'Menos '}${formatCurrency(Math.abs(stat.diff))}`}
                                </div>
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
        )}
      </main>

      {/* NOVA MODAL: CONFIRMAR PAGAMENTO (ESCOLHER CONTA) */}
      {payingTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 size={22} /> Pagar Conta</h3>
              <button onClick={() => setPayingTx(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            <form onSubmit={confirmPayment} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-2">Dar baixa em <strong className="text-gray-800 dark:text-gray-100">{payingTx.description}</strong> ({formatCurrency(payingTx.amount)})</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Building size={14}/> De onde saiu o dinheiro?</label>
                <select value={payWallet} onChange={(e) => setPayWallet(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {accounts.map(acc => (
                     <option key={acc.id} value={acc.name}>{acc.type === 'Cartão' ? '💳' : acc.type === 'Dinheiro' ? '💵' : '🏦'} {acc.name}</option>
                  ))}
                  {accounts.length === 0 && <option value="Conta Corrente">🏦 Conta Corrente</option>}
                </select>
              </div>
              <button type="submit" className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-colors">Confirmar Pagamento</button>
            </form>
          </div>
        </div>
      )}

      {/* NOVA MODAL: AJUSTAR SALDO DA CONTA */}
      {adjustingAccount && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2"><Edit2 size={22} /> Ajustar Saldo</h3>
              <button onClick={() => setAdjustingAccount(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            <form onSubmit={confirmAdjustBalance} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-2">Conta: <strong className="text-gray-800 dark:text-gray-100">{adjustingAccount.name}</strong><br/>Saldo atual: {formatCurrency(accountBalances[adjustingAccount.name] || 0)}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qual é o saldo REAL no banco agora? (R$)</label>
                <input type="number" required step="0.01" value={adjustBalanceInput} onChange={(e) => setAdjustBalanceInput(e.target.value)} placeholder="0,00" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-lg" />
              </div>
              <p className="text-[10px] text-gray-400 text-center">O sistema irá criar um ajuste invisível para o valor bater certo com o seu banco sem estragar o histórico.</p>
              <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors">Salvar Novo Saldo</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA TRANSAÇÃO OU EDITAR (CRIAR/EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editingTxId ? 'Editar Transação' : 'Nova Transação'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              {/* LANÇAMENTO RÁPIDO: Oculto durante a edição */}
              {!editingTxId && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Lançamento Rápido ⚡</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                       <button type="button" onClick={() => applyQuickAdd('Padaria')} className="whitespace-nowrap px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg text-xs font-medium transition-colors hover:bg-orange-200">☕ Padaria</button>
                       <button type="button" onClick={() => applyQuickAdd('Uber')} className="whitespace-nowrap px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-medium transition-colors hover:bg-blue-200">🚗 Uber</button>
                       <button type="button" onClick={() => applyQuickAdd('Mercado')} className="whitespace-nowrap px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-medium transition-colors hover:bg-emerald-200">🛒 Mercado</button>
                       <button type="button" onClick={() => applyQuickAdd('Luz')} className="whitespace-nowrap px-3 py-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg text-xs font-medium transition-colors hover:bg-yellow-200">💡 Luz</button>
                    </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
                <button type="button" onClick={() => setType('expense')} className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-600 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-gray-300'}`}>Saída (Despesa)</button>
                <button type="button" onClick={() => setType('income')} className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-300'}`}>Entrada (Receita)</button>
              </div>

              {type === 'expense' && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2">
                  <button type="button" onClick={() => setExpenseCategory('Fixa')} className={`py-1.5 text-xs font-medium rounded-md transition-all ${expenseCategory === 'Fixa' ? 'bg-indigo-500 text-white shadow-sm' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`}>📌 Despesa Fixa</button>
                  <button type="button" onClick={() => setExpenseCategory('Variável')} className={`py-1.5 text-xs font-medium rounded-md transition-all ${expenseCategory === 'Variável' ? 'bg-indigo-500 text-white shadow-sm' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`}>📈 Despesa Variável</button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Conta de Luz, Uber, Netflix" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input type="number" required min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoria</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {type === 'expense' ? (
                      <><option value="Alimentação">Alimentação</option><option value="Transporte">Transporte</option><option value="Moradia">Moradia</option><option value="Contas">Contas</option><option value="Compras">Compras</option><option value="Lazer">Lazer</option><option value="Saúde">Saúde</option><option value="Educação">Educação</option><option value="Viagens">Viagens</option><option value="Pets">Pets</option><option value="Outros">Outros</option></>
                    ) : (
                      <><option value="Trabalho">Trabalho</option><option value="Investimentos">Investimentos</option><option value="Outros">Outros</option></>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20">
                    <option value="pending">⏳ Pendente</option>
                    <option value="paid">✅ Já Pago</option>
                  </select>
                </div>
              </div>

              {status === 'paid' && (
                  <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                    <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1"><Building size={14}/> Dinheiro saiu de onde?</label>
                    <select value={wallet} onChange={(e) => setWallet(e.target.value)} className="w-full px-4 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                      {accounts.map(acc => (
                         <option key={acc.id} value={acc.name}>{acc.type === 'Cartão' ? '💳' : acc.type === 'Dinheiro' ? '💵' : '🏦'} {acc.name}</option>
                      ))}
                      {accounts.length === 0 && <option value="Conta Corrente">🏦 Conta Corrente</option>}
                    </select>
                  </div>
              )}

              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Users size={14}/> Quem Pagou/Vai Pagar?</label>
                 <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setPayer('Renan')} className={`py-1.5 text-xs font-medium rounded-md transition-all border ${payer === 'Renan' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>Renan</button>
                    <button type="button" onClick={() => setPayer('Esposa')} className={`py-1.5 text-xs font-medium rounded-md transition-all border ${payer === 'Esposa' ? 'bg-pink-50 border-pink-500 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>Esposa</button>
                    <button type="button" onClick={() => setPayer('Conjunto')} className={`py-1.5 text-xs font-medium rounded-md transition-all border ${payer === 'Conjunto' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>Conjunto</button>
                 </div>
              </div>

              {/* OPÇÕES DE REPETIÇÃO - Apenas visível ao criar nova transação */}
              {!editingTxId && (
                  <>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Repeat size={14}/> Repetição</label>
                          <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="none">Não repete</option>
                            <option value="installments">Parcelado</option>
                            <option value="subscription">♾️ Assinatura Contínua</option>
                          </select>
                      </div>

                      {recurrenceType === 'installments' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Parcelas</label>
                          <input type="number" min="2" max="48" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value) || 2)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                      )}
                  </>
              )}

              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex justify-center items-center gap-2">
                  {editingTxId ? <Edit2 size={18} /> : <Plus size={18} />} 
                  {editingTxId ? 'Guardar Alterações' : (recurrenceType === 'installments' && installments > 1 ? `Salvar ${installments} Transações` : 'Salvar Transação')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DO BOTÃO FLUTUANTE DE VENDA RÁPIDA (NOVO) */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-500 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign size={24} /> Novo Recebimento</h3>
              <button onClick={() => setIsQuickAddModalOpen(false)} className="text-emerald-100 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleQuickAddIncome} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Qual foi o valor recebido?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">R$</span>
                  <input type="number" required min="0.01" step="0.01" value={quickAmount} onChange={(e) => setQuickAmount(e.target.value)} placeholder="0,00" autoFocus className="w-full pl-14 pr-4 py-4 border-2 border-emerald-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-0 outline-none text-3xl font-bold text-center" />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Para a conta de quem?</label>
                 <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setQuickPayer('Renan')} className={`py-3 text-sm font-bold rounded-xl transition-all border-2 ${quickPayer === 'Renan' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>Renan</button>
                    <button type="button" onClick={() => setQuickPayer('Esposa')} className={`py-3 text-sm font-bold rounded-xl transition-all border-2 ${quickPayer === 'Esposa' ? 'bg-pink-50 border-pink-500 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>Esposa</button>
                    <button type="button" onClick={() => setQuickPayer('Conjunto')} className={`py-3 text-sm font-bold rounded-xl transition-all border-2 ${quickPayer === 'Conjunto' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>Conjunta</button>
                 </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-transform hover:scale-[1.02] shadow-lg text-lg flex items-center justify-center gap-2">
                <CheckCircle2 size={24} /> Guardar Receita
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR NOVA CONTA (BANCO) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2"><Landmark size={22} /> Nova Conta / Banco</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Banco ou Carteira</label>
                <input type="text" required value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Ex: C6 Bank, Caixa..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="Conta">🏦 Conta</option>
                        <option value="Cartão">💳 Cartão</option>
                        <option value="Dinheiro">💵 Físico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo Atual (R$)</label>
                    <input type="number" step="0.01" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} placeholder="0,00" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
              </div>
              <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors">Adicionar Conta</button>
            </form>
          </div>
        </div>
      )}

      {/* OUTRAS MODAIS: APAGAR E COMPROVANTE (IA) */}
      {deleteConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Excluir Transação</h3>
            {(() => {
              const match = deleteConfig.description.match(/^(.*?) \((\d+)\/(\d+)\)$/);
              if (match) {
                return (
                  <>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                      Esta é a parcela <strong>{match[2]} de {match[3]}</strong> de <strong>"{match[1]}"</strong>.<br/>O que deseja excluir?
                    </p>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => confirmDelete([deleteConfig.id])} className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors">Apenas esta parcela</button>
                      <button onClick={() => {
                          const baseName = match[1]; const current = parseInt(match[2]); const total = parseInt(match[3]);
                          const idsToDelete = transactions.filter(t => {
                              const m = t.description.match(/^(.*?) \((\d+)\/(\d+)\)$/);
                              return m && m[1] === baseName && parseInt(m[3]) === total && parseInt(m[2]) >= current;
                          }).map(t => t.id);
                          confirmDelete(idsToDelete);
                      }} className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-medium transition-colors">Esta e as próximas parcelas</button>
                      <button onClick={() => setDeleteConfig(null)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors mt-2">Cancelar</button>
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">Tem a certeza que deseja excluir <strong>"{deleteConfig.description}"</strong>?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setDeleteConfig(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors">Cancelar</button>
                      <button onClick={() => confirmDelete([deleteConfig.id])} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors">Excluir</button>
                    </div>
                  </>
                );
              }
            })()}
          </div>
        </div>
      )}

      {isPlanilhaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95 duration-200">
             {importStatus === 'success' ? (
                 <>
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={40} /></div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sucesso!</h3>
                    <p className="text-gray-600 dark:text-gray-300">A sua planilha de 2026 foi importada e guardada no cofre.</p>
                 </>
             ) : (
                 <>
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><Database size={40} /></div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Importar Planilha</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">A Inteligência Artificial leu a sua imagem e extraiu <strong>118 lançamentos</strong> (de Janeiro a Dezembro de 2026).<br/><br/>Deseja guardar tudo na sua nuvem agora?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setIsPlanilhaModalOpen(false)} disabled={importStatus === 'importing'} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50">Cancelar</button>
                        <button onClick={handleImportPlanilha} disabled={importStatus === 'importing'} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {importStatus === 'importing' ? <Loader2 size={20} className="animate-spin"/> : 'Importar Tudo'}
                        </button>
                    </div>
                 </>
             )}
          </div>
        </div>
      )}

      {isReceiptImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-teal-50 dark:bg-teal-900/20">
              <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-2"><Receipt size={22} /> Leitor de Receitas / Comprovantes</h3>
              <button onClick={() => !isReceiptImporting && setIsReceiptImportOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" disabled={isReceiptImporting}><X size={24} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">Envie o <strong className="text-teal-600 dark:text-teal-400">PDF ou Print</strong> (pode ser um print com vários PIX recebidos) para registar tudo automaticamente.</p>
              {receiptImportMessage.text && <div className={`mb-4 p-3 text-sm rounded-lg border ${receiptImportMessage.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'}`}>{receiptImportMessage.text}</div>}
              <div className="relative">
                <input type="file" accept="image/*,application/pdf" onChange={handleReceiptImport} disabled={isReceiptImporting || receiptImportMessage.type === 'success'} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${isReceiptImporting ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-900/20' : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50 dark:border-gray-600 dark:hover:border-teal-500 dark:hover:bg-gray-700'}`}>
                  {isReceiptImporting ? <><Loader2 size={40} className="text-teal-500 animate-spin mb-3" /><p className="text-teal-700 dark:text-teal-400 font-medium text-center">A ler...<br/><span className="text-sm opacity-80">A analisar a imagem</span></p></> : <><UploadCloud size={40} className="text-gray-400 mb-3" /><p className="text-gray-700 dark:text-gray-300 font-medium text-center">Toque para enviar Imagem</p><p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Imagens (PNG/JPG) e PDF</p></>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE GLOBAL PARA NOVA RECEITA */}
      <button
        onClick={() => setIsQuickAddModalOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-40 flex items-center justify-center group"
        title="Novo Recebimento Rápido"
      >
        <DollarSign size={28} />
        <span className="absolute right-16 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold shadow-lg pointer-events-none">Recebimento Rápido</span>
      </button>
    </div>
  );
}
