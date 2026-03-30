import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiFetch, setStoredUser } from '../../lib/api';
import { TrendingUp } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';

type LoginUser = {
  id: string;
  username: string;
  fullName: string;
  name: string;
  initial: string;
  neon: boolean;
};

const NUMPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function LoginScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [selected, setSelected] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const shakeValue = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        const list = await apiFetch('/api/users');
        if (!mounted) return;

        const mapped = list.map((u: any, idx: number) => {
          const displayName = u.fullName?.trim() || u.username.trim();
          const firstName = displayName.split(' ')[0] || displayName;
          return {
            id: u.id,
            username: u.username,
            fullName: displayName,
            name: firstName,
            initial: (displayName[0] || 'U').toUpperCase(),
            neon: idx % 2 === 0,
          };
        });
        setUsers(mapped);
      } catch (err) {
        setError('Could not load users from backend.');
      } finally {
        if (mounted) setUsersLoading(false);
      }
    };

    loadUsers();
    return () => { mounted = false; };
  }, []);

  const triggerShake = () => {
    shakeValue.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 50 }), 4, true),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedShakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeValue.value }],
    };
  });

  const handleSelectUser = (u: LoginUser) => {
    setSelected(u);
    setPin('');
    setError('');
  };

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (key === '') return;
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      submitPin(next);
    }
  };

  const submitPin = async (enteredPin: string) => {
    if (!selected) return;
    setLoading(true);
    try {
      const user = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selected.username, pin: enteredPin }),
      });

      const normalizedSession = {
        id: selected.id,
        name: selected.name,
        fullName: user.fullName || selected.fullName,
        username: selected.username,
        backendUserId: user.id || selected.id,
      };

      await setStoredUser(normalizedSession);
      router.replace('/(tabs)');
    } catch (e: any) {
      triggerShake();
      setError('Wrong PIN. Try again.');
      setPin('');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black items-center px-6">
      <View className="items-center pt-10 mb-12">
        <View
          className="w-[60px] h-[60px] rounded-[18px] bg-[#111] border border-white/10 items-center justify-center mb-4"
          style={{ shadowColor: '#00ff41', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 }}
        >
          <TrendingUp size={28} color="#00ff41" />
        </View>
        <Text className="text-[26px] font-extrabold text-white tracking-tight mb-1">Arctic Vault</Text>
        <Text className="text-[14px] text-white/35">Finance made simple.</Text>
      </View>

      {!selected ? (
        <View className="w-full max-w-[360px] items-center">
          <Text className="text-[13px] font-semibold text-white/30 tracking-widest mb-5">WHO ARE YOU?</Text>
          <View className="flex-row flex-wrap justify-between w-full">
            {users.map((u) => (
              <TouchableOpacity
                key={u.username}
                className={`w-[48%] bg-[#111] border rounded-[24px] py-7 px-4 items-center mb-3.5 ${u.neon ? 'border-[#00ff41]' : 'border-white'}`}
                onPress={() => handleSelectUser(u)}
                activeOpacity={0.8}
              >
                <View
                  className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${u.neon ? 'bg-[#00ff41]' : 'bg-white'}`}
                  style={{ shadowColor: u.neon ? '#00ff41' : '#fff', shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 }}
                >
                  <Text className="text-[24px] font-extrabold text-black">{u.initial}</Text>
                </View>
                <View className="items-center mb-3">
                  <Text className="text-[16px] font-bold text-white mb-0.5">{u.name}</Text>
                  <Text className="text-[11px] text-white/30">{u.fullName}</Text>
                </View>
                <View className={`border rounded-full py-1 px-3 ${u.neon ? 'border-[#00ff41] bg-[#00ff41]/10' : 'border-white bg-white/10'}`}>
                  <Text className={`text-[11px] font-bold tracking-wider ${u.neon ? 'text-[#00ff41]' : 'text-white'}`}>SIGN IN →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {usersLoading && <ActivityIndicator className="mt-6" color="#00ff41" />}
          {!usersLoading && users.length === 0 && (
            <Text className="text-[12px] text-[#ff0033] mt-3.5">No users found.</Text>
          )}
        </View>
      ) : (
        <Animated.View className="w-full max-w-[340px] items-center" style={animatedShakeStyle}>
          <View className="flex-row items-center w-full mb-8">
            <TouchableOpacity
              onPress={() => { setSelected(null); setPin(''); setError(''); }}
              className="w-9 h-9 rounded-full bg-[#111] border border-white/10 items-center justify-center mr-3"
            >
              <Text className="text-white/60 text-[18px]">←</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-2.5">
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${selected.neon ? 'bg-[#00ff41]' : 'bg-white'}`}
                style={{ shadowColor: selected.neon ? '#00ff41' : '#fff', shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 }}
              >
                <Text className="text-[13px] font-extrabold text-black">{selected.initial}</Text>
              </View>
              <View>
                <Text className="text-[15px] font-bold text-white">{selected.fullName}</Text>
                <Text className="text-[11px] text-white/35">Enter your 4-digit PIN</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-4 mb-3">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={`w-[14px] h-[14px] rounded-full ${pin.length > i ? (selected.neon ? 'bg-[#00ff41]' : 'bg-white') : 'bg-white/15'}`}
                style={pin.length > i ? { shadowColor: selected.neon ? 'rgba(0,255,65,0.4)' : 'rgba(255,255,255,0.25)', shadowOpacity: 0.5, shadowRadius: 5 } : {}}
              />
            ))}
          </View>

          <Text className="text-[12px] text-[#ff0033] h-5 mb-5">{error}</Text>

          <View className="flex-row flex-wrap justify-between w-full">
            {NUMPAD.flat().map((key, i) => {
              const isEmpty = key === '';
              const isBack = key === '⌫';
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => !loading && !isEmpty && handleKey(key)}
                  disabled={loading || isEmpty}
                  className={`w-[30%] h-[70px] rounded-[20px] items-center justify-center mb-3 ${isEmpty ? 'bg-transparent' : 'bg-[#111] border border-white/10'} ${isBack ? 'bg-[#ff0033]/10 border-[#ff0033]/20' : ''}`}
                >
                  {loading && key === '0' ? (
                    <ActivityIndicator color="#00ff41" />
                  ) : (
                    <Text className={`text-[22px] font-semibold ${isBack ? 'text-[#ff0033]' : 'text-white'}`}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}

      <Text className="mt-auto mb-5 text-[11px] text-white/15">Users load dynamically from backend API</Text>
    </SafeAreaView>
  );
}
