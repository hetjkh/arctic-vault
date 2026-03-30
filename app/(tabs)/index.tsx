import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Activity, Eye, EyeOff, PieChart, Plus, Wallet } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageBackground, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeInDown, LinearTransition, SlideInUp, SlideOutDown, useSharedValue, useAnimatedStyle, interpolate, Extrapolate, interpolateColor } from 'react-native-reanimated';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { DetailsSheet, SheetConfig } from '../../components/DetailsSheet';
import { apiFetch, getStoredUser } from '../../lib/api';
import { formatCompact, formatCurrency, calcAppAnalytics } from '../../lib/calculations';
import { DBData, SessionUser } from '../../types';

// Safely mount native video player at module level
let VideoView: any = null;
let useVideoPlayer: any = null;
try {
  const expoVideo = require('expo-video');
  VideoView = expoVideo.VideoView;
  useVideoPlayer = expoVideo.useVideoPlayer;
} catch (e) { }

const useSafeVideoPlayer = useVideoPlayer || function () { return null; };
const videoSource = require('../../assets/video/video.mp4');
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DBData | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sheet, setSheet] = useState<SheetConfig>({ visible: false, title: '', items: [] });
  const scrollY = useSharedValue(0);

  const headerBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      scrollY.value,
      [0, 80],
      ['#000000', '#ffffff']
    );
    return { color };
  });

  const animatedSubTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      scrollY.value,
      [0, 80],
      ['rgba(0,0,0,0.6)', 'rgba(255,255,255,0.6)']
    );
    return { color };
  });

  const player = useSafeVideoPlayer(videoSource, (p: any) => {
    p.loop = true; p.muted = true; p.play();
  });

  const loadData = async () => {
    try {
      const session = await getStoredUser();
      if (!session) { router.replace('/(auth)/login'); return; }
      setUser(session);

      const [usersRes, txRes, setRes] = await Promise.all([
        apiFetch('/api/users'), apiFetch('/api/transactions'), apiFetch('/api/settlements')
      ]);

      setData({ users: usersRes, transactions: txRes, invoices: [], settlements: setRes });
    } catch (e) { console.error('Failed to dump data', e) } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, [router]);

  const derived = useMemo(() => calcAppAnalytics(data, user), [data, user]);

  if (loading || !data || !user || !derived) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#00ff41" />
      </View>
    );
  }

  const mask = (val: string) => (hidden ? '••••••' : val);
  const { height: screenHeight } = Dimensions.get('window');

  return (
    <View className="flex-1 bg-black">

      {/* ABSOLUTE FULLSCREEN VIDEO BACKGROUND */}
      <View className="absolute -top-[200px] left-0 right-0 bottom-0 z-0">

        {VideoView && player ? (
          <VideoView player={player} style={{ width: '100%', height: '100%', opacity: 1 }} nativeControls={false} contentFit="cover" />
        ) : (
          <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=2787&auto=format&fit=crop' }} className="w-full h-full" imageStyle={{ opacity: 0.6 }} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)', '#000000']} locations={[0, 0.5, 0.75, 1]} className="absolute w-full h-full" pointerEvents="none" />
        <View className="absolute bg-black bottom-0 w-full h-[100px] z-10">

        </View>
      </View>

      {/* DYNAMIC STICKY HERO HEADER */}
      <View className="absolute top-0 left-0 right-0 z-40 h-[180px] overflow-hidden pointer-events-none">
        <Animated.View style={[headerBgStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
          <LinearGradient
            colors={['black', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
            locations={[0, 0.3, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 180,
            }}
          />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(100).duration(400).easing(Easing.out(Easing.ease))} className="absolute top-0 left-0 w-full px-5 pt-14 flex-row justify-between items-start pointer-events-auto">
          <View>
            <AnimatedText style={animatedSubTextStyle} className="text-[14px] tracking-wide mb-0.5 font-bold">Good morning,</AnimatedText>
            <AnimatedText style={[animatedTextStyle, { textTransform: 'capitalize' }]} className="text-[28px] font-black tracking-tight w-auto min-w-[200px]">{user.fullName || user.username || 'Founder'}</AnimatedText>
          </View>
          <View className="w-[52px] h-[52px] rounded-full border-[2.5px] border-white/20 items-center justify-center overflow-hidden" style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.5, shadowRadius: 10, elevation: 12 }}>
            <Image source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBcmfL2liSkvMLJ7KJE925MM7kSlBjx6sPRg&s' }} className="w-full h-full" />
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#fff" />}
        bounces={false}
        className="z-10"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: screenHeight * 0.55 }} />

        {/* 3. FLOATING MASSIVE STACKED BALANCE CARD */}
        <Animated.View entering={FadeInDown.delay(250).duration(800).easing(Easing.bezier(0.33, 1, 0.68, 1))} className="px-5 items-center w-full z-20 mb-[-25px]">
          <BlurView tint="dark" intensity={60} className="w-full rounded-[34px] p-[10px] bg-[#050505]/60 overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.9, shadowRadius: 40, elevation: 20 }}>

            {!hidden && (
              <Animated.View exiting={SlideOutDown.duration(800).easing(Easing.bezier(0.5, 0, 0.75, 0))} entering={SlideInUp.duration(800).easing(Easing.bezier(0.33, 1, 0.68, 1))}>

                {/* 1. Purple Card (Ronit) */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => setSheet({ visible: true, title: 'Ronit Balance', subtitle: 'Personal spending vs Fractional Pool Bounds', items: [{ label: 'Personal Overhead Withdrawn', value: `₹${formatCurrency(derived.ronitWithdrawn).replace('₹', '')}` }, { label: 'Remaining Fractional Share', value: `₹${formatCurrency(derived.ronitAllowance).replace('₹', '')}` }] })} className="z-0 rounded-t-[24px] overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 10 }, shadowRadius: 10 }}>
                  <LinearGradient colors={['#eaf0ff', '#e0c3fc']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="rounded-[22px] px-5 py-[16px] flex flex-row justify-between border-2 border-red-500 items-center bg-white">
                    <View className="flex flex-row justify-between items-center pt-3 pb-10 px-4 rounded-t-[24px] border border-black/25">
                      <Text className="text-[17px] font-bold text-black tracking-tight">Ronit allowance</Text>
                      <Text className="text-[19px] font-black text-black">₹{formatCurrency(derived.ronitAllowance).replace('₹', '')}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 2. Green Card (Het) */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => setSheet({ visible: true, title: 'Het Balance', subtitle: 'Personal spending vs Fractional Pool Bounds', items: [{ label: 'Personal Overhead Withdrawn', value: `₹${formatCurrency(derived.hetWithdrawn).replace('₹', '')}` }, { label: 'Remaining Fractional Share', value: `₹${formatCurrency(derived.hetAllowance).replace('₹', '')}` }] })} className="z-10 mt-[-20px] rounded-t-[24px] overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 10 }, shadowRadius: 10 }}>
                  <LinearGradient colors={['#e2f8b5', '#cbfcf5']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="rounded-[22px] px-5 pt-[30px] pb-[26px] flex-row justify-between items-center bg-white" >
                    <View className="flex flex-row justify-between items-center pt-3 pb-10 px-4 rounded-t-[25px] border border-black/25">
                      <Text className="text-[17px] font-bold text-black tracking-tight">Het allowance</Text>
                      <Text className="text-[19px] font-black text-black">₹{formatCurrency(derived.hetAllowance).replace('₹', '')}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 3. White Card (Minimum Balance) */}
                <View className="z-20 mt-[-20px] rounded-t-[24px] overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10 }}>
                  <LinearGradient colors={['#f8f8f8', '#e8e8e8']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="rounded-[22px] px-5 pt-[30px] pb-[16px] flex-row justify-between items-center bg-white">
                    <View className="flex flex-row justify-between items-center pt-3 pb-10 px-4 rounded-t-[25px] border border-black/25">
                      <Text className="text-[17px] font-bold text-black tracking-tight">Minimum protected</Text>
                      <Text className="text-[19px] font-black text-black">₹50,000</Text>
                    </View>
                  </LinearGradient>
                </View>

              </Animated.View>
            )}

            {/* TOTAL BALANCE WALLET */}
            <Animated.View layout={LinearTransition.duration(800).easing(Easing.bezier(0.33, 1, 0.68, 1))} className="z-10 bg-[#000] rounded-[24px] border-[1.5px] border-dashed border-white/20 px-5 overflow-hidden" style={{ marginTop: hidden ? 0 : -20, paddingTop: hidden ? 20 : 34, paddingBottom: 20 }}>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-[18px] font-bold text-white/50 tracking-tight">Bank Balance</Text>
                <Text className="text-[24px] font-black text-white tracking-tighter">{hidden ? '••••••' : `₹${formatCurrency(derived.currentBankBalance).replace('₹', '')}`}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.5} onPress={() => setHidden(!hidden)} className="items-center mt-6 py-2">
                {hidden ? <EyeOff size={26} color="rgba(255,255,255,0.7)" /> : <Eye size={26} color="rgba(255,255,255,0.7)" />}
              </TouchableOpacity>
            </Animated.View>

          </BlurView>
        </Animated.View>


        {/* 4. SOLID BLACK BACKGROUND BARRIER */}
        <View className="w-full h-[50px] z-10 -mt-20">
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', 'black']}
            locations={[0, 0.7, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 100,
            }}
          />
        </View>
        <View className="bg-[#000] shadow w-[100vw] pt-[50px] px-5 z-10 pb-[150px]">

          <Animated.View entering={FadeInDown.delay(350).duration(400).easing(Easing.out(Easing.ease))} className="flex-row gap-4 mb-8">
            <AnimatedPressable onPress={() => router.push('/(tabs)/analytics')} activeScale={0.97} className="flex-1 bg-[#111] overflow-hidden rounded-[24px]">
              <BlurView tint="dark" intensity={50} className="p-5 border border-white/10 min-h-[160px] relative">
                <Text className="text-[15px] font-bold text-white mb-1">Analytics</Text>
                <Text className="text-[11px] font-medium text-white/40">Visualized Intelligence</Text>
                <View className="absolute bottom-5 left-5" style={{ shadowColor: '#60A5FA', shadowOpacity: 0.8, shadowRadius: 25 }}>
                  <PieChart size={44} color="#93C5FD" strokeWidth={1.5} />
                </View>
                <View className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-black/50 border border-white/20 items-center justify-center">
                  <Activity size={16} color="white" />
                </View>
              </BlurView>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => router.push('/(tabs)/add')} activeScale={0.97} className="flex-1 bg-[#111] overflow-hidden rounded-[24px]">
              <BlurView tint="dark" intensity={50} className="p-5 border border-white/10 min-h-[160px] relative">
                <Text className="text-[15px] font-bold text-white mb-1">Add Transaction</Text>
                <Text className="text-[11px] font-medium text-white/40">Secure transfer entry</Text>
                <View className="absolute bottom-5 left-5" style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.8, shadowRadius: 25 }}>
                  <Wallet size={44} color="#D9F99D" strokeWidth={1.5} />
                </View>
                <View className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-black/50 border border-white/20 items-center justify-center">
                  <Plus size={16} color="white" />
                </View>
              </BlurView>
            </AnimatedPressable>
          </Animated.View>

          {/* 5. QUICK STATS */}
          <Text className="text-[32px] font-black text-white/90 tracking-tight mb-5 mt-2">Business stats</Text>
          <Animated.View entering={FadeInDown.delay(400).duration(400).easing(Easing.out(Easing.ease))} className="flex-row gap-4 mb-4">
            <AnimatedPressable onPress={() => setSheet({ visible: true, title: 'Total Earned', subtitle: 'Gross structural revenue', items: derived.income.map((t: any) => ({ label: t.description || t.category, value: formatCurrency(t.amount), subtext: new Date(t.date).toLocaleDateString() })) })} activeScale={0.97} className="flex-1">
              <BlurView tint="dark" intensity={30} className="border border-white/5 rounded-[24px] p-6 min-h-[160px] justify-between overflow-hidden bg-[#0A0A0A]">
                <View>
                  <Text className="text-[16px] font-bold text-white/80 tracking-tight mb-1">Total Earned</Text>
                  <Text className="text-[10px] text-white/40 leading-[14px]">Total money injected</Text>
                </View>
                <Text className="text-[32px] font-black text-[#A3FF3D] tracking-tighter" adjustsFontSizeToFit numberOfLines={1}>{mask(formatCompact(derived.totalEarned))}</Text>
              </BlurView>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => setSheet({ visible: true, title: 'Business Overhead', subtitle: 'Gross structured expenses', items: derived.expenses.map((t: any) => ({ label: t.description || t.category, value: formatCurrency(t.amount), subtext: new Date(t.date).toLocaleDateString() })) })} activeScale={0.97} className="flex-1">
              <BlurView tint="dark" intensity={30} className="border border-white/5 rounded-[24px] p-6 min-h-[160px] justify-between overflow-hidden bg-[#0A0A0A]">
                <View>
                  <Text className="text-[16px] font-bold text-white/80 tracking-tight mb-1">Total Expenses</Text>
                  <Text className="text-[10px] text-white/40 leading-[14px]">Money spent running operations</Text>
                </View>
                <Text className="text-[32px] font-black text-[#F87171] tracking-tighter" adjustsFontSizeToFit numberOfLines={1}>{mask(formatCompact(derived.totalBusinessSpent))}</Text>
              </BlurView>
            </AnimatedPressable>
          </Animated.View>

          {/* 6. EXPENSES BREAKDOWN */}
          <Animated.View entering={FadeInDown.delay(450).duration(400).easing(Easing.out(Easing.ease))}>
            <AnimatedPressable onPress={() => setSheet({ visible: true, title: 'Network Allocation', subtitle: 'Category proportional distribution', items: derived.sortedCats.map((c: any) => ({ label: c.name, value: formatCurrency(c.amount), subtext: `${(c.percent * 100).toFixed(1)}% density` })) })} activeScale={0.97}>
              <BlurView tint="dark" intensity={30} className="border border-white/5 rounded-[24px] p-6 mb-4 mt-2 overflow-hidden bg-[#0A0A0A]">
                <View className="flex-row justify-between items-start mb-8">
                  <Text className="text-[16px] font-bold text-white/80 tracking-tight w-[100px] leading-5">Category breakdown</Text>
                  <Text className="text-[28px] font-black text-white tracking-tighter">{mask(formatCompact(derived.totalBusinessSpent))}</Text>
                </View>

                <View className="w-full h-2 rounded-full overflow-hidden flex-row bg-[#1A1A1A] mb-4">
                  {derived.sortedCats.map((cat: any, i: number) => (
                    <View key={cat.name} style={{ flex: cat.percent > 0 ? cat.percent : 1, backgroundColor: cat.color, borderRightWidth: i !== derived.sortedCats.length - 1 ? 2 : 0, borderColor: '#0A0A0A' }} />
                  ))}
                  {derived.sortedCats.length === 0 && <View className="flex-1 bg-[#333]" />}
                </View>

                <View className="flex-row justify-between px-1">
                  {derived.sortedCats.slice(0, 4).map((cat: any) => (
                    <View key={cat.name} className="items-start flex-1 mr-2">
                      <Text className="text-[10px] font-bold mb-1" style={{ color: cat.color }} numberOfLines={1}>{cat.name}</Text>
                      <Text className="text-[11px] text-white/60 font-medium">{formatCompact(cat.amount)}</Text>
                    </View>
                  ))}
                </View>
              </BlurView>
            </AnimatedPressable>
          </Animated.View>

          {/* 7. BURN RATE & RUNWAY */}
          <Animated.View entering={FadeInDown.delay(500).duration(400).easing(Easing.out(Easing.ease))} className="flex-row gap-4 mb-4 mt-2">
            <AnimatedPressable onPress={() => setSheet({ visible: true, title: 'Burn Logic', subtitle: 'Analysis on standard consumption limits', items: [{ label: 'Operational Avg. Spend', value: formatCurrency(derived.burnRate) }, { label: 'Trajectory Safety Net', value: `${derived.runway.toFixed(1)} Months` }] })} activeScale={0.97} className="flex-1">
              <BlurView tint="dark" intensity={30} className="border border-white/5 rounded-[24px] p-6 min-h-[160px] justify-between overflow-hidden bg-[#0A0A0A]">
                <View>
                  <Text className="text-[16px] font-bold text-white/80 tracking-tight mb-1">Burn Rate</Text>
                  <Text className="text-[10px] text-white/40 leading-[14px]">Avg. operational consumption per month</Text>
                </View>
                <Text className="text-[32px] font-black text-white tracking-tighter" adjustsFontSizeToFit numberOfLines={1}>{mask(formatCompact(derived.burnRate))}</Text>
              </BlurView>
            </AnimatedPressable>

            <AnimatedPressable activeScale={0.97} className="flex-1">
              <BlurView tint="dark" intensity={30} className="border border-white/5 rounded-[24px] p-6 min-h-[160px] justify-between overflow-hidden bg-[#0A0A0A]">
                <View>
                  <Text className="text-[16px] font-bold text-white/80 tracking-tight mb-1">Runway</Text>
                  <Text className="text-[10px] text-white/40 leading-[14px]">How many months trajectory survives empty</Text>
                </View>
                <Text className="text-[32px] font-black text-white tracking-tighter" adjustsFontSizeToFit numberOfLines={1}>
                  {hidden ? '•••' : (derived.runway > 0 ? `${derived.runway.toFixed(1)}mo` : '0mo')}
                </Text>
              </BlurView>
            </AnimatedPressable>
          </Animated.View>

        </View>
      </Animated.ScrollView>
      <DetailsSheet config={sheet} onClose={() => setSheet({ ...sheet, visible: false })} />
    </View>
  );
}
