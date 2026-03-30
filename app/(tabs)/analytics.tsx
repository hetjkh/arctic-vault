import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { apiFetch } from '../../lib/api';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useAppAnalytics, formatCurrency } from '../../lib/calculations';
import { AlertCircle, TrendingUp, TrendingDown, Flame, CheckCircle2, Zap } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const [data, setData] = useState<{ users: any[], transactions: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [u, tx] = await Promise.all([apiFetch('/api/users'), apiFetch('/api/transactions')]);
      setData({ users: u, transactions: tx });
    } catch(e) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  const globalDerived = useAppAnalytics(data);

  const derived = useMemo(() => {
    if (!globalDerived || !data) return null;
    
    const { income, sortedCats, totalEarned, currentBankBalance, totalBusinessSpent, netBusinessProfit, ronitAllowance, hetAllowance } = globalDerived;

    // Generative AI Insights
    const insights: any[] = [];
    if (ronitAllowance < 0 && hetAllowance < 0) insights.push({ type: 'danger', icon: AlertCircle, color: '#EF4444', text: "Both Founders have overspent their allowances and are currently negative." });
    else if (ronitAllowance < 0) insights.push({ type: 'warning', icon: AlertCircle, color: '#F59E0B', text: "Ronit has exhausted his allowance and is currently holding a negative balance." });
    else if (hetAllowance < 0) insights.push({ type: 'warning', icon: AlertCircle, color: '#F59E0B', text: "Het has exhausted his allowance and is currently holding a negative balance." });
    
    if (sortedCats.length > 0) insights.push({ type: 'info', icon: Flame, color: '#C084FC', text: `Your heaviest financial drain is currently ${sortedCats[0].name}, making up ${(sortedCats[0].percent * 100).toFixed(0)}% of overhead.` });
    
    const biggestIncome = [...income].sort((a,b) => b.amount - a.amount)[0];
    if (biggestIncome) insights.push({ type: 'success', icon: TrendingUp, color: '#A3FF3D', text: `Largest capital injection was ${biggestIncome.description || biggestIncome.category} worth ₹${formatCurrency(biggestIncome.amount).replace('₹','')}.` });

    if (totalEarned < totalBusinessSpent) insights.push({ type: 'danger', icon: TrendingDown, color: '#EF4444', text: "Warning: Total burn rate is currently exceeding total capital generation." });
    else if (insights.length < 4) insights.push({ type: 'good', icon: CheckCircle2, color: '#3B82F6', text: "Financial velocity is optimal to current trajectories." });

    return { 
      totalEarned, 
      totalSpent: totalBusinessSpent, 
      currentBalance: currentBankBalance, 
      netProfit: netBusinessProfit, 
      sortedCats, 
      ronitFinal: ronitAllowance, 
      hetFinal: hetAllowance, 
      insights,
      currentMonthTxs: globalDerived.currentMonthTxs,
      lastMonthTxs: globalDerived.lastMonthTxs
    };
  }, [globalDerived, data]);

  if (loading || !derived) {
    return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator size="large" color="#A3FF3D" /></View>;
  }

  const mask = (val: number) => `₹${formatCurrency(val).replace('₹', '')}`;

  return (
    <View className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingTop: 70, paddingBottom: 150 }} className="z-10" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#A3FF3D" />}>
        
        <View className="px-5 mb-8">
          <Text className="text-[34px] font-black text-white tracking-tight leading-10 mb-1">Analytics</Text>
          <Text className="text-[15px] font-medium text-white/50 tracking-wide">Financial intelligence overview</Text>
        </View>

        {/* 1. QUICK SUMMARY */}
        <View className="px-5 mb-8">
          <View className="flex-row gap-3 mb-3">
             <View className="flex-1 bg-[#111] p-5 rounded-[24px] border border-white/5">
                <Text className="text-[13px] font-bold text-white/40 mb-2 uppercase tracking-widest">Earned</Text>
                <Text className="text-[22px] font-black text-[#A3FF3D] tracking-tight">{mask(derived.totalEarned)}</Text>
             </View>
             <View className="flex-1 bg-[#111] p-5 rounded-[24px] border border-white/5">
                <Text className="text-[13px] font-bold text-white/40 mb-2 uppercase tracking-widest">Spent</Text>
                <Text className="text-[22px] font-black text-[#F87171] tracking-tight">{mask(derived.totalSpent)}</Text>
             </View>
          </View>
          <View className="flex-row gap-3">
             <View className="flex-1 bg-[#111] p-5 rounded-[24px] border border-white/5">
                <Text className="text-[13px] font-bold text-white/40 mb-2 uppercase tracking-widest">Net Profit</Text>
                <Text className="text-[22px] font-black text-[#60A5FA] tracking-tight">{mask(derived.netProfit)}</Text>
             </View>
             <View className="flex-1 bg-[#111] p-5 rounded-[24px] border border-[1.5px] border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <Text className="text-[13px] font-bold text-white/60 mb-2 uppercase tracking-widest">Balance</Text>
                <Text className="text-[22px] font-black text-white tracking-tight">{mask(derived.currentBalance)}</Text>
             </View>
          </View>
        </View>

        {/* 2. VISUAL CHARTS (Category Breakdown - UI Proportional Storage Bar) */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="px-5 mb-8">
          <Text className="text-[20px] font-bold text-white tracking-tight mb-4">Capital Allocation</Text>
          <View className="bg-[#111] rounded-[24px] p-6 border border-white/5">
            
            {/* iOS Storage Bar Metric */}
            <View className="w-full h-[18px] rounded-full flex-row overflow-hidden mb-5 bg-[#222]">
               {derived.sortedCats.map((cat, i) => (
                 <View key={i} style={{ flex: cat.percent > 0 ? cat.percent : 1, backgroundColor: cat.color }} />
               ))}
               {derived.sortedCats.length === 0 && <View className="flex-1 bg-[#333]" />}
            </View>

            {/* Sub-Legend */}
            <View className="flex-row flex-wrap">
               {derived.sortedCats.map((cat, i) => (
                 <View key={i} className="w-[50%] flex-row items-center mb-3">
                   <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                   <View>
                     <Text className="text-white font-bold text-[14px]">{cat.name}</Text>
                     <Text className="text-white/40 font-medium text-[11px] mt-0.5">{mask(cat.amount)} ({(cat.percent * 100).toFixed(0)}%)</Text>
                   </View>
                 </View>
               ))}
            </View>
          </View>
        </Animated.View>

        {/* 3. GENERATIVE INSIGHTS SECTION (The "Wow" Action Matrix) */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="px-5 mb-8">
           <Text className="text-[20px] font-bold text-white tracking-tight mb-4 flex-row items-center">Agent Insights</Text>
           <View className="gap-3">
             {derived.insights.map((insight, idx) => {
               const IconCmp = insight.icon;
               return (
                 <View key={idx} className="flex-row items-center bg-[#0d0d0d] rounded-[20px] p-5 border border-white/5">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${insight.color}15` }}>
                       <IconCmp size={20} color={insight.color} />
                    </View>
                    <Text className="text-white/80 font-medium text-[14px] leading-[20px] flex-1 tracking-wide">{insight.text}</Text>
                 </View>
               );
             })}
           </View>
        </Animated.View>

        {/* 4. FOUNDER SNAPSHOT */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="px-5 mb-8">
          <Text className="text-[20px] font-bold text-white tracking-tight mb-4">Founder Parity</Text>
          <View className="flex-row gap-4">
             <View className={`flex-1 p-5 rounded-[24px] border ${derived.ronitFinal < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-[#111] border-white/5'}`}>
                <Text className="text-[13px] font-bold text-white/40 mb-2 uppercase tracking-widest">Ronit</Text>
                <Text className={`text-[20px] font-black tracking-tight ${derived.ronitFinal < 0 ? 'text-red-400' : 'text-white'}`}>{mask(derived.ronitFinal)}</Text>
             </View>
             <View className={`flex-1 p-5 rounded-[24px] border ${derived.hetFinal < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-[#111] border-white/5'}`}>
                <Text className="text-[13px] font-bold text-white/40 mb-2 uppercase tracking-widest">Het</Text>
                <Text className={`text-[20px] font-black tracking-tight ${derived.hetFinal < 0 ? 'text-red-400' : 'text-white'}`}>{mask(derived.hetFinal)}</Text>
             </View>
          </View>
        </Animated.View>

        {/* 5. ACTIVITY OVERVIEW */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="px-5 mb-8">
           <View className="bg-[#111] rounded-[24px] p-6 border border-white/5 flex-row justify-between items-center">
              <View>
                 <Text className="text-white font-bold text-[28px] tracking-tight">{derived.currentMonthTxs}</Text>
                 <Text className="text-white/40 font-medium text-[13px] mt-1">Actions executed</Text>
              </View>
              <View className="items-end">
                 <View className="flex-row items-center mb-1 bg-[#1A1A1A] px-3 py-1.5 rounded-full">
                    <Zap size={14} color={derived.currentMonthTxs >= derived.lastMonthTxs ? "#A3FF3D" : "#EF4444"} />
                    <Text className="text-white font-bold text-[13px] ml-1.5" style={{ color: derived.currentMonthTxs >= derived.lastMonthTxs ? "#A3FF3D" : "#EF4444" }}>
                      {Math.abs(derived.currentMonthTxs - derived.lastMonthTxs)} difference
                    </Text>
                 </View>
                 <Text className="text-white/40 font-medium text-[12px] mt-0.5">Vs previous cycle</Text>
              </View>
           </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
