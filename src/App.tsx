// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Wallet, TrendingUp, TrendingDown, Trash2, 
  Coffee, Car, Home, Zap, ShoppingBag, DollarSign, Briefcase,
  X, PieChart, ChevronLeft, ChevronRight, CalendarDays, BarChart3,
  Gamepad2, HeartPulse, GraduationCap, PiggyBank, Plane, Cat,
  Moon, Sun, Download, Search, CheckCircle2, Circle, Repeat, Target,
  ArrowUpRight, ArrowDownRight, Minus, Receipt, UploadCloud, Loader2,
  Bell, CreditCard, Sparkles, RefreshCw, Banknote, Landmark, AlertTriangle, Bot
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// ⚠️ ATENÇÃO: Cole a sua NOVA chave do Google AI Studio (Gemini) aqui!
const apiKey = "AIzaSyCsJng6N_F08x8CN2TDZrA339sDdzigN6g"; 

const DADOS_INICIAIS = [
  { id: '1', description: 'Salário', amount: 4500.00, type: 'income', category: 'Trabalho', date: '2026-03-01', status: 'paid', wallet: 'Conta Corrente', isSubscription: false },
  { id: '2', description: 'Aluguel', amount: 1200.00, type: 'expense', category: 'Moradia', date: '2026-03-05', status: 'paid', wallet: 'Conta Corrente', isSubscription: true },
  { id: '3', description: 'Mercado', amount: 450.50, type: 'expense', category: 'Alimentação', date: '2026-03-10', status: 'paid', wallet: 'Cartão de Crédito', isSubscription: false },
  { id: '4', description: 'Uber', amount: 45.00, type: 'expense', category: 'Transporte', date: '2026-03-12', status: 'paid', wallet: 'Cartão de Crédito', isSubscription: false },
  { id: '5', description: 'Freelance', amount: 800.00, type: 'income', category: 'Trabalho', date: '2026-03-15', status: 'pending', wallet: 'Conta Corrente', isSubscription: false },
  { id: '6', description: 'Netflix', amount: 45.90, type: 'expense', category: 'Lazer', date: '2026-03-25', status: 'pending', wallet: 'Cartão de Crédito', isSubscription: true }
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
        if (savedTx) setTransactions(JSON.parse(savedTx));
        else setTransactions(DADOS_INICIAIS);
        if (savedBg) setBudgets(JSON.parse(savedBg));
        return;
    }
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
             // Tenta usar o token do ambiente (pode falhar com configurações personalizadas do Firebase)
             await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
             console.warn("Token incompatível detetado (normal ao usar o seu próprio Firebase). A mudar para login anónimo...");
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

    return () => { unsubTx(); unsubBg(); };
  }, [user]);

  useEffect(() => { 
    if (!db) {
        localStorage.setItem('financas_app_data', JSON.stringify(transactions));
        localStorage.setItem('financas_app_budgets', JSON.stringify(budgets));
    }
    localStorage.setItem('financas_app_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode, transactions, budgets]);

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

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('paid');
  const [wallet, setWallet] = useState('Conta Corrente');
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [installments, setInstallments] = useState(2);

  const [isReceiptImportOpen, setIsReceiptImportOpen] = useState(false);
  const [isReceiptImporting, setIsReceiptImporting] = useState(false);
  const [receiptImportMessage, setReceiptImportMessage] = useState({ type: '', text: '' });

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

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(`${dateString}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatPeriodLabel = () => {
    if (viewMode === 'annual') return currentDate.getFullYear().toString();
    const label = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const formatComparePeriodLabel = () => {
    if (viewMode === 'annual') return compareDate.getFullYear().toString();
    const label = compareDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const changePeriod = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'annual') newDate.setFullYear(prev.getFullYear() + direction);
      else newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
    setAdvisorAdvice(''); 
  };

  const WalletIcon = ({ type, size = 14, className = "" }) => {
    if (type === 'Cartão de Crédito') return <CreditCard size={size} className={className} />;
    if (type === 'Dinheiro') return <Banknote size={size} className={className} />;
    return <Landmark size={size} className={className} />; 
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTrans = [];
    let currentTransDate = new Date(`${date}T12:00:00`);

    if (recurrenceType === 'subscription') {
        newTrans.push({
          id: crypto.randomUUID(), description, amount: parseFloat(amount), type,
          category: type === 'income' && category === 'Alimentação' ? 'Trabalho' : category,
          date: currentTransDate.toISOString().split('T')[0], status, wallet, isSubscription: true
        });
    } else {
        const totalInstallments = recurrenceType === 'installments' ? installments : 1;
        for (let i = 0; i < totalInstallments; i++) {
          newTrans.push({
            id: crypto.randomUUID(),
            description: totalInstallments > 1 ? `${description} (${i + 1}/${totalInstallments})` : description,
            amount: parseFloat(amount), type, category: type === 'income' && category === 'Alimentação' ? 'Trabalho' : category,
            date: currentTransDate.toISOString().split('T')[0], status: i === 0 ? status : 'pending', wallet, isSubscription: false
          });
          currentTransDate.setMonth(currentTransDate.getMonth() + 1);
        }
    }

    if (db && user) {
        for (const tx of newTrans) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', tx.id), tx);
        }
    } else {
        setTransactions([...newTrans, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
    setIsModalOpen(false); resetForm();
  };

  const resetForm = () => {
    setDescription(''); setAmount(''); setType('expense'); setCategory('Alimentação'); 
    setDate(new Date().toISOString().split('T')[0]); setStatus('paid'); setWallet('Conta Corrente');
    setRecurrenceType('none'); setInstallments(2);
  };

  const toggleStatus = async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const isMovingToPaid = tx.status === 'pending';
    const updatedTx = { ...tx, status: isMovingToPaid ? 'paid' : 'pending' };

    if (db && user) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', tx.id), updatedTx);
        if (isMovingToPaid && tx.isSubscription) {
            const currentTxDate = new Date(`${tx.date}T12:00:00`);
            currentTxDate.setMonth(currentTxDate.getMonth() + 1);
            const nextDateString = currentTxDate.toISOString().split('T')[0];
            const alreadyExists = transactions.some(t => t.description === tx.description && t.date === nextDateString && t.isSubscription);
            if (!alreadyExists) {
                const newTx = { ...tx, id: crypto.randomUUID(), date: nextDateString, status: 'pending' };
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', newTx.id), newTx);
            }
        }
    } else {
        let newTransactions = transactions.map(t => t.id === id ? updatedTx : t);
        if (isMovingToPaid && tx.isSubscription) {
            const currentTxDate = new Date(`${tx.date}T12:00:00`);
            currentTxDate.setMonth(currentTxDate.getMonth() + 1);
            const nextDateString = currentTxDate.toISOString().split('T')[0];
            const alreadyExists = newTransactions.some(t => t.description === tx.description && t.date === nextDateString && t.isSubscription);
            if (!alreadyExists) {
                newTransactions.push({ ...tx, id: crypto.randomUUID(), date: nextDateString, status: 'pending' });
            }
        }
        setTransactions(newTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const handleDelete = async (id) => {
      if (db && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
      else setTransactions(transactions.filter(t => t.id !== id));
  };

  const exportCSV = () => {
    const headers = "Data,Descrição,Categoria,Tipo,Valor,Conta,Status\n";
    const rows = transactions.map(t => `${t.date},${t.description},${t.category},${t.type === 'income' ? 'Receita' : 'Despesa'},${t.amount},${t.wallet || 'N/A'},${t.status === 'paid' ? 'Pago' : 'Pendente'}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `financas_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const updateBudget = async (cat) => {
    const newBudget = prompt(`Defina o limite mensal para ${cat} (R$):`, budgets[cat] || 0);
    if (newBudget !== null && !isNaN(newBudget)) {
        const amount = parseFloat(newBudget);
        if (db && user) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', cat), { amount });
        } else {
            setBudgets({ ...budgets, [cat]: amount });
        }
    }
  };

  const handleGetAdvisorAdvice = async () => {
      setIsAdvisorLoading(true);
      try {
          if (!apiKey) throw new Error("Chave da API não encontrada.");
          const topCategories = categoryStats.slice(0,3).map(c => `${c.category} (${formatCurrency(c.amount)})`).join(', ');
          const systemInstruction = `Você é um Conselheiro Financeiro amigável e super inteligente.
          Analise o resumo do mês deste usuário. O foco deve ser dar 1 dica ou insight construtivo, rápido e motivador (máximo 3 frases curtas).
          Seja direto, como se fosse um SMS. Não use negritos excessivos.`;
          
          const payload = {
            contents: [{ role: "user", parts: [
              { text: `Resumo do Mês:\nReceitas Previstas: ${summary.expectedIncome}\nDespesas Previstas: ${summary.expectedExpense}\nSaldo Previsto: ${summary.expectedBalance}\nMaiores Gastos: ${topCategories || 'Nenhum ainda'}` }
            ]}],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          };

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error?.message || "Erro de comunicação com a IA.");
          }
          const responseData = await res.json();
          setAdvisorAdvice(responseData.candidates[0].content.parts[0].text);
      } catch(e) { setAdvisorAdvice(`Ops! Falhou: ${e.message}`); } finally { setIsAdvisorLoading(false); }
  };

  const handleReceiptImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsReceiptImporting(true); setReceiptImportMessage({ type: '', text: '' });

    try {
      if (!apiKey) throw new Error("A chave da API (apiKey) está vazia no código.");

      let mimeType = file.type;
      let base64Data = "";

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

      const systemInstruction = `Você é um assistente financeiro inteligente. Analise este comprovante.
      Retorne JSON estrito: 'description': Nome curto., 'amount': Valor exato (ex: 150.50)., 'type': 'expense' ou 'income'., 'category': Categoria padrão., 'date': YYYY-MM-DD.`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: "Extraia dados." }, { inlineData: { mimeType, data: base64Data } }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { description: { type: "STRING" }, amount: { type: "NUMBER" }, type: { type: "STRING" }, category: { type: "STRING" }, date: { type: "STRING" } }, required: ["description", "amount", "type", "date"] } }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Servidor da IA recusou a imagem.");
      }

      const responseData = await res.json();
      const extracted = JSON.parse(responseData.candidates[0].content.parts[0].text);
      const matchIndex = transactions.findIndex(t => t.status === 'pending' && t.type === extracted.type && Math.abs(t.amount - extracted.amount) <= 2.0);

      if (matchIndex >= 0) {
          const updatedTx = { ...transactions[matchIndex], status: 'paid', date: extracted.date && extracted.date.match(/^\d{4}-\d{2}-\d{2}$/) ? extracted.date : transactions[matchIndex].date };
          if (db && user) {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', updatedTx.id), updatedTx);
              if (updatedTx.isSubscription) {
                   const nextDate = new Date(`${updatedTx.date}T12:00:00`); nextDate.setMonth(nextDate.getMonth() + 1);
                   const newTx = { ...updatedTx, id: crypto.randomUUID(), date: nextDate.toISOString().split('T')[0], status: 'pending' };
                   await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', newTx.id), newTx);
              }
          } else {
              let updatedTransactions = [...transactions]; updatedTransactions[matchIndex] = updatedTx;
              if (updatedTx.isSubscription) {
                   const nextDate = new Date(`${updatedTx.date}T12:00:00`); nextDate.setMonth(nextDate.getMonth() + 1);
                   updatedTransactions.push({ ...updatedTx, id: crypto.randomUUID(), date: nextDate.toISOString().split('T')[0], status: 'pending' });
              }
              setTransactions(updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
          }
          setReceiptImportMessage({ type: 'success', text: `Comprovante associado a "${updatedTx.description}" ✅` });
      } else {
          const newTx = {
            id: crypto.randomUUID(), description: extracted.description || 'Comprovante', amount: parseFloat(extracted.amount) || 0, type: extracted.type === 'income' ? 'income' : 'expense',
            category: extracted.category || 'Outros', date: extracted.date && extracted.date.match(/^\d{4}-\d{2}-\d{2}$/) ? extracted.date : new Date().toISOString().split('T')[0],
            status: 'paid', wallet: 'Conta Corrente', isSubscription: false
          };
          if (db && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', newTx.id), newTx);
          else setTransactions([...transactions, newTx].sort((a, b) => new Date(b.date) - new Date(a.date)));
          setReceiptImportMessage({ type: 'success', text: `Novo comprovante registado como Pago ✅` });
      }
      setTimeout(() => setIsReceiptImportOpen(false), 4500);
    } catch (err) { setReceiptImportMessage({ type: 'error', text: `Falhou: ${err.message}` }); } finally { setIsReceiptImporting(false); e.target.value = ''; }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const paidTransactions = filteredTransactions.filter(t => t.status === 'paid');
  const pendingTransactions = filteredTransactions.filter(t => t.status === 'pending');

  if (isCloudLoading) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 text-white">
            <Loader2 className="animate-spin w-12 h-12 mb-4" />
            <p className="text-lg font-medium text-indigo-100">A ligar ao Cofre na Nuvem...</p>
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
                              <button onClick={() => {toggleStatus(b.id); setIsNotificationsOpen(false);}} className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded mt-1 hover:bg-emerald-200">Pagar</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Sun size={20} className="hidden dark:block"/><Moon size={20} className="dark:hidden" /></button>
              <button onClick={exportCSV} className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block"><Download size={20} /></button>
              <button onClick={() => { setReceiptImportMessage({type: '', text: ''}); setIsReceiptImportOpen(true); }} className="bg-teal-500 hover:bg-teal-400 dark:bg-teal-700 dark:hover:bg-teal-600 px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-white">
                <Receipt size={20} /> <span className="hidden lg:inline">Comprovante</span>
              </button>
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-700 dark:hover:bg-indigo-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={20} /> <span className="hidden sm:inline">Nova</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="bg-indigo-700/50 dark:bg-indigo-950/50 p-1 rounded-lg inline-flex w-full md:w-auto overflow-x-auto">
              {['monthly', 'annual', 'charts'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${viewMode === mode ? 'bg-indigo-500 text-white shadow-sm' : 'text-indigo-200 hover:text-white'}`}>
                  {mode === 'monthly' ? 'Visão Mensal' : mode === 'annual' ? 'Visão Anual' : 'Gráficos e IA'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 bg-indigo-700/30 dark:bg-indigo-950/30 px-2 py-1.5 rounded-lg border border-indigo-500/30">
              <button onClick={() => changePeriod(-1)} className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors text-indigo-100 hover:text-white"><ChevronLeft size={20}/></button>
              <div className="flex items-center gap-2 font-semibold min-w-[160px] justify-center text-lg">
                <CalendarDays size={18} className="text-indigo-300" /><span>{formatPeriodLabel()}</span>
              </div>
              <button onClick={() => changePeriod(1)} className="p-1.5 hover:bg-indigo-500 rounded-md transition-colors text-indigo-100 hover:text-white"><ChevronRight size={20}/></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        {viewMode !== 'charts' ? (
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
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-500" /> Realizadas
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
                          <th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Descrição</th><th className="px-4 py-3 font-semibold">Categoria</th><th className="px-4 py-3 font-semibold text-right">Valor</th><th className="px-4 py-3 font-semibold text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {paidTransactions.map((t) => {
                          const CatIcon = CATEGORIAS[t.category]?.icon || CATEGORIAS['Outros'].icon;
                          const catColors = CATEGORIAS[t.category] || CATEGORIAS['Outros'];
                          return (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                              <td className="px-4 py-3"><button onClick={() => toggleStatus(t.id)}><CheckCircle2 size={20} className="text-emerald-500" /></button></td>
                              <td className="px-4 py-3 flex flex-col">
                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">{t.description} {t.isSubscription && <RefreshCw size={12} className="text-indigo-400" />}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><WalletIcon type={t.wallet} size={10} /> <span className="truncate max-w-[60px]">{t.wallet || 'Conta'}</span></span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${catColors.bg} ${darkMode ? catColors.darkBg : ''} ${catColors.color}`}><CatIcon size={12} /> <span>{t.category}</span></div>
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </td>
                              <td className="px-4 py-3 text-center"><button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-rose-500 p-1"><Trash2 size={16} /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <Circle size={20} className="text-amber-500" /> Pendentes
                  </h2>
                  <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 py-0.5 px-2.5 rounded-full text-xs font-bold">{pendingTransactions.length}</span>
                </div>
                {pendingTransactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 flex-1 flex flex-col justify-center">
                    <Target size={40} className="mx-auto mb-3 opacity-30 text-amber-500" />
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
                              <td className="px-4 py-3"><button onClick={() => toggleStatus(t.id)}><Circle size={22} className="text-amber-500 hover:text-emerald-500" /></button></td>
                              <td className="px-4 py-3 flex flex-col">
                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">{t.description} {t.isSubscription && <RefreshCw size={12} className="text-amber-500" />}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs ${isOverdue ? 'text-rose-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{formatDate(t.date)}</span>
                                  {isOverdue ? <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-[9px] uppercase px-1.5 rounded font-bold flex items-center gap-1"><AlertTriangle size={10}/> Atrasada</span> : <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><WalletIcon type={t.wallet} size={10} /></span>}
                                </div>
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(t.amount)}
                              </td>
                              <td className="px-4 py-3 text-center"><button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-rose-500 p-1"><Trash2 size={16} /></button></td>
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
        ) : (
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

      {/* MODAL DE NOVA TRANSAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button type="button" onClick={() => { setType('expense'); setCategory('Alimentação'); }} className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-600 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-gray-300'}`}>Saída</button>
                <button type="button" onClick={() => { setType('income'); setCategory('Trabalho'); }} className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-300'}`}>Entrada</button>
              </div>

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {type === 'expense' ? (
                      <><option value="Alimentação">Alimentação</option><option value="Transporte">Transporte</option><option value="Moradia">Moradia</option><option value="Contas">Contas</option><option value="Compras">Compras</option><option value="Lazer">Lazer</option><option value="Saúde">Saúde</option><option value="Educação">Educação</option><option value="Viagens">Viagens</option><option value="Pets">Pets</option><option value="Outros">Outros</option></>
                    ) : (
                      <><option value="Trabalho">Trabalho</option><option value="Investimentos">Investimentos</option><option value="Outros">Outros</option></>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="paid">✅ Já Pago</option>
                    <option value="pending">⏳ Pendente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><CreditCard size={14}/> Carteira</label>
                  <select value={wallet} onChange={(e) => setWallet(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="Conta Corrente">🏦 Conta Corrente</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                    <option value="Dinheiro">💵 Dinheiro Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Repeat size={14}/> Repetição</label>
                  <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="none">Não repete</option>
                    <option value="installments">Parcelado</option>
                    <option value="subscription">♾️ Assinatura Contínua</option>
                  </select>
                </div>
              </div>

              {recurrenceType === 'installments' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Parcelas</label>
                  <input type="number" min="2" max="48" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value) || 2)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              )}

              {recurrenceType === 'subscription' && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <strong className="flex items-center gap-1"><RefreshCw size={12}/> Assinatura Inteligente.</strong>
                  Quando der "Baixa" nesta conta, o aplicativo criará automaticamente a fatura do mês seguinte!
                </p>
              )}

              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex justify-center items-center gap-2">
                  <Plus size={18} /> Salvar {recurrenceType === 'installments' && installments > 1 ? `${installments} Transações` : 'Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE COMPROVANTE (IA) */}
      {isReceiptImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-teal-50 dark:bg-teal-900/20">
              <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-2"><Receipt size={22} /> Leitor de Comprovante</h3>
              <button onClick={() => !isReceiptImporting && setIsReceiptImportOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" disabled={isReceiptImporting}><X size={24} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">Envie o <strong className="text-teal-600 dark:text-teal-400">PDF ou Print</strong> do comprovante para registar automaticamente.</p>
              {receiptImportMessage.text && <div className={`mb-4 p-3 text-sm rounded-lg border ${receiptImportMessage.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'}`}>{receiptImportMessage.text}</div>}
              <div className="relative">
                <input type="file" accept="image/*,application/pdf" onChange={handleReceiptImport} disabled={isReceiptImporting || receiptImportMessage.type === 'success'} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${isReceiptImporting ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-900/20' : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50 dark:border-gray-600 dark:hover:border-teal-500 dark:hover:bg-gray-700'}`}>
                  {isReceiptImporting ? <><Loader2 size={40} className="text-teal-500 animate-spin mb-3" /><p className="text-teal-700 dark:text-teal-400 font-medium text-center">A ler...<br/><span className="text-sm opacity-80">Cerca de 5s</span></p></> : <><UploadCloud size={40} className="text-gray-400 mb-3" /><p className="text-gray-700 dark:text-gray-300 font-medium text-center">Toque para enviar Comprovante</p><p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Imagens (PNG/JPG) e PDF</p></>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
