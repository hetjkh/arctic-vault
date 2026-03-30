import { DBData, FounderBalance } from '../types';

/** Round to 2 decimal places to avoid floating-point drift */
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcFounderBalance(userId: number, data: DBData): FounderBalance {
  const user = data.users.find((u) => u.id === userId);

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => r(sum + t.amount), 0);

  const totalSharedExpenses = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => r(sum + t.amount), 0);

  const totalPersonalWithdrawals = data.transactions
    .filter((t) => t.type === 'personal' && t.userId === userId)
    .reduce((sum, t) => r(sum + t.amount), 0);

  const settlementsReceived = data.settlements
    .filter((s) => s.toUserId === userId)
    .reduce((sum, s) => r(sum + s.amount), 0);

  const settlementsPaid = data.settlements
    .filter((s) => s.fromUserId === userId)
    .reduce((sum, s) => r(sum + s.amount), 0);

  const incomeShare = r(totalIncome / 2);
  const expenseShare = r(totalSharedExpenses / 2);

  const balance = r(
    incomeShare -
    expenseShare -
    totalPersonalWithdrawals +
    settlementsReceived -
    settlementsPaid
  );

  return {
    userId,
    name: user?.name ?? user?.fullName ?? 'Unknown User',
    totalIncome,
    totalSharedExpenses,
    totalPersonalWithdrawals,
    settlementsReceived,
    settlementsPaid,
    balance,
  };
}

export function calcNetProfit(data: DBData): number {
  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => r(sum + t.amount), 0);
  const totalExpenses = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => r(sum + t.amount), 0);
  return r(totalIncome - totalExpenses);
}

export function calcTotalRevenue(data: DBData): number {
  return data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => r(sum + t.amount), 0);
}

export function calcTotalExpenses(data: DBData): number {
  return data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => r(sum + t.amount), 0);
}

export interface SettlementSuggestion {
  fromName: string;
  toName: string;
  fromUserId: number;
  toUserId: number;
  amount: number;
}

export function calcSettlementSuggestion(
  balances: FounderBalance[]
): SettlementSuggestion | null {
  if (balances.length < 2) return null;

  const payer = balances.reduce((max, b) => (b.balance > max.balance ? b : max), balances[0]);
  const receiver = balances.reduce((min, b) => (b.balance < min.balance ? b : min), balances[0]);

  const diff = r(Math.abs(payer.balance - receiver.balance));
  if (diff < 1) return null;

  const payAmount = r(diff / 2);

  return {
    fromName: payer.name,
    toName: receiver.name,
    fromUserId: payer.userId,
    toUserId: receiver.userId,
    amount: payAmount,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  return formatCurrency(amount);
}

// Global Singleton Math Engine guaranteeing 100% parity across ALL tabs
export function useAppAnalytics(data: any, user?: any) {
  if (!data) return null;
  const tx = data.transactions || [];
  const users = data.users || [];
  
  const txSorted = [...tx].sort((a: any, b: any) => {
    const timeA = new Date(a.date).getTime() + (a.createdAt ? new Date(a.createdAt).getTime() % 86400000 : 0);
    const timeB = new Date(b.date).getTime() + (b.createdAt ? new Date(b.createdAt).getTime() % 86400000 : 0);
    return timeB - timeA;
  });

  const income = txSorted.filter((t: any) => t.type === 'income');
  const expenses = txSorted.filter((t: any) => t.type === 'expense');
  const personal = txSorted.filter((t: any) => t.type === 'personal');

  const totalEarned = income.reduce((s:number,t:any) => s + t.amount, 0);
  const sharedExpenses = expenses.filter((t:any) => !t.splitType || t.splitType === 'shared').reduce((s:number,t:any) => s + t.amount, 0);
  const personalWithdrawals = personal.reduce((s:number,t:any) => s + t.amount, 0);
  
  // Real Physical Money
  const currentBankBalance = totalEarned - (sharedExpenses + personalWithdrawals);
  const totalBusinessSpent = sharedExpenses;

  // 50k Pool Logic
  const netBusinessProfit = totalEarned - sharedExpenses; 
  const usablePool = Math.max(0, netBusinessProfit - 50000);
  const baseAllowance = usablePool / 2;

  // Founder Mapping
  const backendIds: any = {};
  users.forEach((u:any, i:number) => { backendIds[u.id] = i + 1; });
  const ronit = users.find((u:any) => u.fullName?.toLowerCase().includes('ronit') || u.username?.toLowerCase().includes('ronit'));
  const het = users.find((u:any) => u.fullName?.toLowerCase().includes('het') || u.username?.toLowerCase().includes('het'));

  const ronitId = ronit ? backendIds[ronit.id] : -1;
  const hetId = het ? backendIds[het.id] : -2;

  const ronitWithdrawn = personal.filter((t:any) => String(backendIds[t.userId] || t.userId) === String(ronitId)).reduce((s:number, t:any) => s + t.amount, 0);
  const hetWithdrawn = personal.filter((t:any) => String(backendIds[t.userId] || t.userId) === String(hetId)).reduce((s:number, t:any) => s + t.amount, 0);

  const ronitAllowance = baseAllowance - ronitWithdrawn;
  const hetAllowance = baseAllowance - hetWithdrawn;

  // Category Math
  const catMap: Record<string, number> = {};
  expenses.forEach((t:any) => {
      if (!t.splitType || t.splitType === 'shared') catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  
  const colors = ['#A3FF3D', '#C084FC', '#60A5FA', '#F472B6', '#FBBF24', '#9CA3AF'];
  const sortedCats = Object.keys(catMap).sort((a,b) => catMap[b] - catMap[a]).map((k, i) => ({
    name: k, amount: catMap[k], color: colors[i % colors.length], percent: catMap[k] / (sharedExpenses || 1)
  }));

  // Activity Overview
  const now = new Date();
  let currentMonthTxs = 0; let lastMonthTxs = 0;
  tx.forEach((t: any) => {
    const d = new Date(t.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) currentMonthTxs++; 
    else if (d.getMonth() === now.getMonth() - 1 || (now.getMonth() === 0 && d.getMonth() === 11)) lastMonthTxs++;
  });

  const burnRate = sharedExpenses / (Math.max(1, new Set(expenses.filter((t:any) => !t.splitType || t.splitType === 'shared').map((t:any) => new Date(t.date).getMonth())).size));
  const runway = burnRate > 0 ? currentBankBalance / burnRate : 0;

  return { totalEarned, totalBusinessSpent, currentBankBalance, netBusinessProfit, ronitAllowance, hetAllowance, ronitWithdrawn, hetWithdrawn, sortedCats, currentMonthTxs, lastMonthTxs, burnRate, runway, income, expenses: expenses.filter((t:any) => !t.splitType || t.splitType === 'shared'), personal };
}
