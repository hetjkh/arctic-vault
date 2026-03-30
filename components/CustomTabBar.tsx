import React from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, ArrowLeftRight, Plus, PieChart } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View
      className="absolute self-center rounded-[38px] flex-row items-center justify-between px-6 py-4"
      style={{
        width: screenWidth - 40,
        bottom: Platform.OS === 'ios' ? insets.bottom + 16 : 24,
        backgroundColor: '#0A0A0A',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const IconComponent = (() => {
          switch (route.name) {
            case 'index': return Home;
            case 'transactions': return ArrowLeftRight;
            case 'add': return Plus;
            case 'analytics': return PieChart;
            default: return Home;
          }
        })();

        const isAdd = route.name === 'add';

        if (isAdd) {
          return (
            <AnimatedPressable
              key={route.key}
              onPress={onPress}
              activeScale={0.88}
              className="w-[54px] h-[54px] rounded-full mx-1 items-center justify-center bg-[#A3FF3D]"
              style={{ shadowColor: '#A3FF3D', shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 }}
            >
              <IconComponent size={26} color="#000" strokeWidth={3.5} />
            </AnimatedPressable>
          );
        }

        return (
          <AnimatedPressable
            key={route.key}
            onPress={onPress}
            activeScale={0.85}
            className="w-[48px] h-[48px] rounded-full items-center justify-center bg-[#151515]"
          >
            <IconComponent
              size={22}
              color={isFocused ? '#ffffff' : 'rgba(255,255,255,0.4)'}
              strokeWidth={isFocused ? 2.5 : 2}
            />
          </AnimatedPressable>
        );
      })}
    </View>
  );
}
