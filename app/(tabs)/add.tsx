import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch, getStoredUser } from '../../lib/api';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withTiming, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { UserRoundMinus, ConciergeBell, Plus, CalendarDays, Plane, Briefcase, Layers, HelpCircle } from 'lucide-react-native';

const MAIN_CATEGORIES = [
  { name: 'Ronit', icon: UserRoundMinus, color: '#C084FC', textColor: '#000' },
  { name: 'Het', icon: UserRoundMinus, color: '#C084FC', textColor: '#000' },
  { name: 'Food', icon: ConciergeBell, color: '#A3FF3D', textColor: '#000' },
];

const MORE_CATEGORIES = [
  { name: 'Travel', icon: Plane, color: '#60A5FA', textColor: '#000' },
  { name: 'Salary', icon: Briefcase, color: '#34D399', textColor: '#000' },
  { name: 'Bank fees', icon: Layers, color: '#F87171', textColor: '#000' },
  { name: 'Other', icon: HelpCircle, color: '#9CA3AF', textColor: '#000' },
];

let DateTimePicker: any = null;
try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch (e) { }

export default function AddTransactionScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [mode, setMode] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setCategory] = useState('Ronit');
  const [showMore, setShowMore] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const u = await getStoredUser();
      setUser(u);
      const res = await apiFetch('/api/users');
      setUsersList(res.map((r: any, idx: number) => ({ id: String(idx + 1), backendId: String(r.id), name: r.fullName || r.username })));
    }
    loadData();
  }, []);

  const creditStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(mode === 'credit' ? '#A3FF3D' : '#111', { duration: 250 }),
    borderColor: withTiming(mode === 'credit' ? 'rgba(163, 255, 61, 0.4)' : 'rgba(255,255,255,0.05)', { duration: 250 }),
  }));

  const debitStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(mode === 'debit' ? '#FF2C55' : '#111', { duration: 250 }),
    borderColor: withTiming(mode === 'debit' ? 'rgba(255, 44, 85, 0.4)' : 'rgba(255,255,255,0.05)', { duration: 250 }),
  }));

  const handleAmountInput = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setAmount(numeric);
  };

  const handleSubmit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) return Alert.alert('Invalid amount', 'Please enter a valid sum.');

    if (mode === 'credit' && !projectName.trim()) return Alert.alert('Required', 'Please enter a project name.');
    if (mode === 'debit' && !selectedCategory) return Alert.alert('Required', 'Please select a category.');

    setIsSubmitting(true);
    try {
      let payload: any = { amount: numericAmount, date: date.toISOString(), note, description: projectName || selectedCategory };

      if (mode === 'credit') {
        payload.type = 'income';
        payload.category = 'Advance';
      } else {
        payload.type = 'expense';
        payload.category = selectedCategory;

        if (selectedCategory === 'Ronit' || selectedCategory === 'Het') {
          payload.type = 'personal';
          const match = usersList.find(u => u.name.toLowerCase().includes(selectedCategory.toLowerCase()));
          if (match) {
            payload.userId = match.backendId || match.id;
          } else {
             Alert.alert('Error', 'User mapping failed. Re-syncing...');
             return setIsSubmitting(false);
          }
        } else {
          payload.splitType = 'shared';
          payload.splitDetails = { ronit: numericAmount / 2, het: numericAmount / 2 };
        }
      }

      await apiFetch('/api/transactions', { method: 'POST', body: JSON.stringify(payload) });
      router.replace('/(tabs)/transactions');
    } catch (e) {
      Alert.alert('Submission Failed', 'Failed to map transaction configuration.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0} className="flex-1 bg-black">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* HEADER */}
          <View className="flex-row justify-between items-center mb-8 w-full">
            <Text className="text-[34px] font-black text-white tracking-tight w-[200px] leading-10">Add transactions</Text>
            <View className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#A3FF3D] items-center justify-center overflow-hidden" style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.8, shadowRadius: 15, elevation: 12 }}>
              <Image source={{ uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} className="w-full h-full" />
            </View>
          </View>

          {/* TOGGLE */}
          <Animated.View entering={FadeInDown.delay(50).springify().damping(12)} layout={LinearTransition.springify()} className="flex-row items-center w-full mb-8 h-[54px]">
            <AnimatedPressable onPress={() => { Haptics.selectionAsync(); setMode('credit'); }} activeScale={0.93} className="flex-1 h-full mr-3">
              <Animated.View style={creditStyle} className="h-full rounded-full justify-center items-center border">
                <Text className={`font-bold ${mode === 'credit' ? 'text-black' : 'text-white/40'}`}>Credit</Text>
              </Animated.View>
            </AnimatedPressable>
            
            <AnimatedPressable onPress={() => { Haptics.selectionAsync(); setMode('debit'); }} activeScale={0.93} className="flex-1 h-full">
              <Animated.View style={debitStyle} className="h-full rounded-full justify-center items-center border">
                <Text className={`font-bold ${mode === 'debit' ? 'text-white' : 'text-white/40'}`}>Debit</Text>
              </Animated.View>
            </AnimatedPressable>
          </Animated.View>

          {/* DASHED AMOUNT INPUT */}
          <Animated.View entering={FadeInDown.delay(100).springify().damping(14)} layout={LinearTransition.springify()} className="w-full bg-[#050505] rounded-[24px] border border-white/5 p-8 items-center justify-center relative overflow-hidden mb-6 h-[160px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20 }}>
            <View className="absolute inset-4 rounded-[16px] border border-white/10" style={{ borderStyle: 'dashed' }} />
            <TextInput
              value={amount ? `₹${Number(amount).toLocaleString('en-IN')}` : ''}
              onChangeText={handleAmountInput}
              keyboardType="number-pad"
              placeholder="₹0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              className="text-[44px] font-black text-white tracking-tight w-full text-center"
              maxLength={12}
            />
          </Animated.View>

          {/* DYNAMIC FORM SEGMENTS */}
          {mode === 'credit' ? (
             <Animated.View entering={FadeInDown.springify().damping(14)} layout={LinearTransition.springify()} className="mb-6 px-6 py-6 bg-[#0A0A0A] rounded-[24px] border border-white/5">
                <Text className="text-[22px] font-black text-white/50 mb-3 tracking-tight">Project Name</Text>
                <TextInput
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="Enter invoice or incoming source"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  className="text-[17px] font-bold text-white tracking-wide mt-2"
                />
             </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.springify().damping(14)} layout={LinearTransition.springify()} className="mb-6 p-5 bg-[#0A0A0A] rounded-[24px] border border-white/5">
              <Text className="text-[24px] font-black text-white/50 mb-5 tracking-tight ml-1">Category</Text>
              
              {/* PRIMARY ROW */}
              <View className="flex-row gap-3">
                {MAIN_CATEGORIES.map((cat, idx) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <AnimatedPressable key={idx} onPress={() => { Haptics.selectionAsync(); setCategory(cat.name); }} activeScale={0.9} className="flex-1 items-center justify-center py-[18px] rounded-[16px]" style={{ backgroundColor: isActive ? cat.color : 'transparent', borderWidth: 1, borderColor: isActive ? cat.color : 'rgba(255,255,255,0.06)' }}>
                       <cat.icon color={isActive ? cat.textColor : 'rgba(255,255,255,0.3)'} size={28} strokeWidth={1.5} />
                       <Text className="font-bold text-[13px] mt-2 tracking-wide" style={{ color: isActive ? cat.textColor : 'rgba(255,255,255,0.3)' }}>{cat.name}</Text>
                    </AnimatedPressable>
                  );
                })}

                {/* MORE TOGGLE */}
                <AnimatedPressable onPress={() => { Haptics.selectionAsync(); setShowMore(!showMore); }} activeScale={0.9} className="flex-1 items-center justify-center py-[18px] rounded-[16px]" style={{ backgroundColor: showMore ? '#FFF' : 'transparent', borderWidth: 1, borderColor: showMore ? '#FFF' : 'rgba(255,255,255,0.06)' }}>
                   <Plus color={showMore ? '#000' : 'rgba(255,255,255,0.3)'} size={28} strokeWidth={1.5} />
                   <Text className="font-bold text-[13px] mt-2 tracking-wide" style={{ color: showMore ? '#000' : 'rgba(255,255,255,0.3)' }}>More</Text>
                </AnimatedPressable>
              </View>

              {/* SECONDARY ROW (EXPANDED) */}
              {showMore && (
                <View className="flex-row gap-3 mt-3">
                  {MORE_CATEGORIES.map((cat, idx) => {
                    const isActive = selectedCategory === cat.name;
                    return (
                      <AnimatedPressable key={'more_'+idx} onPress={() => { Haptics.selectionAsync(); setCategory(cat.name); }} activeScale={0.9} className="flex-1 items-center justify-center py-[18px] rounded-[16px]" style={{ backgroundColor: isActive ? cat.color : 'transparent', borderWidth: 1, borderColor: isActive ? cat.color : 'rgba(255,255,255,0.06)' }}>
                         <cat.icon color={isActive ? cat.textColor : 'rgba(255,255,255,0.3)'} size={28} strokeWidth={1.5} />
                         <Text className="font-bold text-[13px] mt-1 tracking-wide text-center" style={{ color: isActive ? cat.textColor : 'rgba(255,255,255,0.3)' }}>{cat.name}</Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              )}

            </Animated.View>
          )}

          {/* DATE SECTION */}
          <Animated.View entering={FadeInDown.delay(150).springify().damping(14)} layout={LinearTransition.springify()} className="mb-6 px-6 py-6 bg-[#0A0A0A] rounded-[24px] border border-white/5 flex-row justify-between items-center">
            <View>
              <Text className="text-[24px] font-black text-white/50 mb-2 tracking-tight">Date</Text>
              <Text className="text-[15px] font-bold text-white tracking-wide">{date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
            <AnimatedPressable activeScale={0.85} onPress={() => {
              if (DateTimePicker) setShowPicker(true);
              else Alert.alert('Native Module Required', 'Please run `npx expo install @react-native-community/datetimepicker` in your terminal and then `npx expo run:ios --device` to compile the Date module!');
            }}>
              <CalendarDays size={32} color="#C084FC" strokeWidth={1.5} />
            </AnimatedPressable>

            {/* iOS INLINE ACCORDION DATE PICKER (Bypasses Modal/Keyboard-touch Swallow bugs) */}
            {Platform.OS === 'ios' && showPicker && DateTimePicker && (
              <Animated.View entering={FadeInDown.duration(300).springify().damping(16)} className="w-full bg-[#111111] rounded-[24px] mt-6 pt-4 pb-2 border border-white/5 overflow-hidden">
                <View className="flex-row justify-between items-center px-6 mb-2">
                  <Text className="text-white/40 font-bold tracking-tight">Scroll to select</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)} activeOpacity={0.6} className="bg-[#A3FF3D]/20 px-4 py-2 rounded-full">
                    <Text className="text-[#A3FF3D] font-bold text-[14px]">Confirm</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  themeVariant="dark"
                  onChange={(e: any, d: any) => { if (d) setDate(d); }}
                  style={{ width: '100%', height: 200 }}
                />
              </Animated.View>
            )}

            {/* ANDROID NATIVE DAEMON */}
            {Platform.OS !== 'ios' && showPicker && DateTimePicker && (
              <DateTimePicker
                value={date} mode="date" display="default"
                onChange={(e: any, d: any) => { setShowPicker(false); if (d) setDate(d); }}
              />
            )}
          </Animated.View>

          {/* NOTES */}
          <Animated.View entering={FadeInDown.delay(200).springify().damping(14)} layout={LinearTransition.springify()} className="mb-6 p-6 bg-[#0A0A0A] rounded-[24px] border border-white/5 min-h-[140px]">
            <Text className="text-[24px] font-black text-white/50 mb-3 tracking-tight">Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="This is just for testing, This is just for testing..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              className="text-[13px] font-medium text-white/80 tracking-wide leading-5 mt-2"
              textAlignVertical="top"
            />
          </Animated.View>

          {/* SUBMIT BUTTON */}
          <Animated.View entering={FadeInDown.delay(250).springify().damping(14)} layout={LinearTransition.springify()}>
            <AnimatedPressable onPress={handleSubmit} disabled={isSubmitting} activeScale={0.93} className="w-full bg-[#A3FF3D] rounded-[24px] py-[20px] items-center justify-center mb-10" style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.5, shadowRadius: 20, elevation: 15, opacity: isSubmitting ? 0.7 : 1 }}>
              <Text className="text-[24px] font-black text-black tracking-tight">{isSubmitting ? 'Saving...' : 'Submit'}</Text>
            </AnimatedPressable>
          </Animated.View>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
