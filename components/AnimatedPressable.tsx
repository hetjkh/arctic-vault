import React, { ReactNode } from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  activeScale?: number;
  activeOpacity?: number;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  disabled?: boolean;
}

export function AnimatedPressable({
  children,
  activeScale = 0.95,
  activeOpacity = 0.8,
  style,
  className,
  disabled = false,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableComponent
      {...rest}
      disabled={disabled}
      className={className}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withTiming(activeScale, { duration: 150 });
          opacity.value = withTiming(activeOpacity, { duration: 150 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!disabled) {
          scale.value = withTiming(1, { duration: 150 });
          opacity.value = withTiming(1, { duration: 150 });
        }
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
