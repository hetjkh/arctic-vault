import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Transaction, SessionUser } from '../../types';
import { apiFetch, getStoredUser } from '../../lib/api';
import { TransactionItem } from '../../components/TransactionItem';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Banknote, ArrowDownToLine, X, Plus } from 'lucide-react-native';

import { useAppAnalytics, formatCurrency, formatCompact } from '../../lib/calculations';
import { DetailsSheet, SheetConfig } from '../../components/DetailsSheet';

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string; backendId?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [globalData, setGlobalData] = useState<any>(null);
  const [sheet, setSheet] = useState<SheetConfig>({ visible: false, title: '', items: [] });
  const derived = useMemo(() => useAppAnalytics(globalData), [globalData]);

  const screenWidth = Dimensions.get('window').width;

  const loadBaseData = async () => {
    try {
      const session = await getStoredUser();
      if (!session) { router.replace('/(auth)/login'); return; }
      setUser(session);

      const usersData = await apiFetch('/api/users');
      const nextUsersMap: Record<string, string> = {};
      const nextUsersList = usersData.map((u: any, idx: number) => ({
        id: String(idx + 1), backendId: String(u.id),
        name: (u.fullName || u.username).split(' ')[0] || (u.fullName || u.username),
      }));
      usersData.forEach((u: any, idx: number) => { nextUsersMap[String(idx + 1)] = u.fullName || u.username; });
      setUsersMap(nextUsersMap);
      setUsersList(nextUsersList);

      // We load arbitrary unpaginated transaction history linking the unified useAppAnalytics Engine natively globally avoiding fragmented bounds.
      const balRes = await apiFetch('/api/transactions?limit=1000');
      setGlobalData({ users: usersData, transactions: balRes.items });
    } catch (e) {
      console.error('Failed to load base components for transactions', e);
    }
  };

  const loadTransactionsList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      params.set('sort', 'newest');
      params.set('type', 'all');

      const res = await apiFetch(`/api/transactions?${params.toString()}`);

      const mappedTx = res.items.map((t: any) => {
        const matchedLocalUser = usersList.find((u) => u.backendId === t.userId);
        return {
          id: t.id, type: t.type, category: t.category, amount: t.amount, description: t.description || '',
          userId: t.type === 'personal' && matchedLocalUser ? matchedLocalUser.id : undefined,
          date: new Date(t.date).toISOString(),
          createdAt: t.createdAt
        };
      });

      const finalSorted = [...mappedTx].sort((a: any, b: any) => {
        const timeA = new Date(a.date).getTime() + (a.createdAt ? new Date(a.createdAt).getTime() % 86400000 : 0);
        const timeB = new Date(b.date).getTime() + (b.createdAt ? new Date(b.createdAt).getTime() % 86400000 : 0);
        return timeB - timeA;
      });

      if (page === 1) setTransactions(finalSorted);
      else setTransactions((prev) => [...prev, ...finalSorted].sort((a: any, b: any) => {
        const timeA = new Date(a.date).getTime() + (a.createdAt ? new Date(a.createdAt).getTime() % 86400000 : 0);
        const timeB = new Date(b.date).getTime() + (b.createdAt ? new Date(b.createdAt).getTime() % 86400000 : 0);
        return timeB - timeA;
      }));
    } catch (e) { console.error('Transactions load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadBaseData(); }, []);
  useEffect(() => { if (usersList.length > 0) loadTransactionsList(); }, [usersList, page]);

  return (
    <View className="flex-1 bg-black">
      {/* 2. HEADER SECTION */}
      <View className="px-5 pt-16 flex-row justify-between items-start mb-6 z-10 w-full">
        <View>
          <Text className="text-[14px] text-white/50 tracking-wide mb-0.5">Good morning,</Text>
          <Text className="text-[28px] font-black text-white tracking-tight">{user?.fullName || 'Loading...'}</Text>
        </View>
        <View className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#A3FF3D] items-center justify-center overflow-hidden" style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.8, shadowRadius: 15, elevation: 12 }}>
          <Image source={{ uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} className="w-full h-full" />
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item, idx) => item.id + idx.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* 3. TOTAL BALANCE CARD */}
            <AnimatedPressable onPress={() => { if(derived) setSheet({ visible: true, title: 'Bank Ledger', subtitle: 'Reconciliation of physical bank accounting', items: [{ label: 'Total Business Earned', value: formatCurrency(derived.totalEarned) }, { label: 'Total Business Spent', value: formatCurrency(derived.totalBusinessSpent) }, { label: 'Total Founder Withdrawals', value: formatCurrency(derived.ronitWithdrawn + derived.hetWithdrawn) }] }) }} activeScale={0.97} className="w-full bg-[#050505] rounded-[24px] border border-white/5 p-8 items-center justify-center relative overflow-hidden mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20 }}>
              <View className="absolute inset-4 rounded-[16px] border border-white/10" style={{ borderStyle: 'dashed' }} />
              <Text className="text-[17px] font-bold text-white/40 tracking-wide mb-1">Physical Bank Balance</Text>
              <Text className="text-[40px] font-black text-white tracking-tight">₹{derived ? formatCurrency(derived.currentBankBalance).replace('₹','') : '0'}</Text>
            </AnimatedPressable>

            {/* 4. ACTION BUTTONS (CREDIT / DEBIT) */}
            <View className="flex-row gap-4 mb-10">
              {/* LEFT CARD: Credit */}
              <AnimatedPressable onPress={() => router.push('/(tabs)/add')} activeScale={0.96} className="flex-1 bg-[#0A0A0A] rounded-[24px] border border-white/5 p-5 relative min-h-[160px] overflow-hidden">
                <Text className="text-[15px] font-bold text-white mb-1">Credit money</Text>
                <Text className="text-[10px] font-medium text-white/30 tracking-wide">Add credit transaction</Text>
                <View className="absolute bottom-5 left-5 justify-center items-center" style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.5, shadowRadius: 25 }}>
                   <Banknote size={44} color="#D9F99D" strokeWidth={1.5} />
                   <View className="absolute bg-[#0A0A0A] rounded-full p-[1px] bottom-[-2px] right-[-2px]">
                     <ArrowDownToLine size={16} color="#D9F99D" strokeWidth={3} />
                   </View>
                </View>
                <View className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-black border border-white/10 items-center justify-center">
                   <Plus size={16} color="white" />
                </View>
              </AnimatedPressable>

              {/* RIGHT CARD: Debit */}
              <AnimatedPressable onPress={() => router.push('/(tabs)/add')} activeScale={0.96} className="flex-1 bg-[#0A0A0A] rounded-[24px] border border-white/5 p-5 relative min-h-[160px] overflow-hidden">
                <Text className="text-[15px] font-bold text-white mb-1">Debit money</Text>
                <Text className="text-[10px] font-medium text-white/30 tracking-wide">Add debit transaction</Text>
                <View className="absolute bottom-5 left-5 justify-center items-center" style={{ shadowColor: '#ff0033', shadowOpacity: 0.5, shadowRadius: 25 }}>
                   <Banknote size={44} color="#ff4d4d" strokeWidth={1.5} />
                   <View className="absolute bg-[#0A0A0A] rounded-full p-[2px] bottom-[-4px] right-[-4px]">
                     <X size={16} color="#ff4d4d" strokeWidth={3} />
                   </View>
                </View>
                <View className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-black border border-white/10 items-center justify-center">
                   <Plus size={16} color="white" />
                </View>
              </AnimatedPressable>
            </View>

            {/* 5. TRANSACTIONS SECTION TITLE */}
            <Text className="text-[34px] font-black text-white/90 tracking-tight mb-5">Transactions</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AnimatedPressable activeScale={0.96}>
            <TransactionItem
              transaction={item}
              userName={item.userId ? usersMap[String(item.userId)] : undefined}
            />
          </AnimatedPressable>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(1); loadBaseData(); loadTransactionsList(); }} tintColor="#A3FF3D" />}
        onEndReached={() => { setPage((prev) => prev + 1); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && page > 1 ? <ActivityIndicator className="mt-5" color="#A3FF3D" /> : null}
      />
      <DetailsSheet config={sheet} onClose={() => setSheet({ ...sheet, visible: false })} />
    </View>
  );
}