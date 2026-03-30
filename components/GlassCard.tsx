import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { cssInterop } from 'nativewind';

// NativeWind v4 requires explicit interop for third-party components
cssInterop(BlurView, { className: 'style' });

interface GlassCardProps extends ViewProps {
  intensity?: number;
  strong?: boolean;
}

export function GlassCard({ intensity = 50, strong = false, style, className, children, ...props }: GlassCardProps) {
  return (
    <View style={[styles.wrapper, style]} {...props}>
      <BlurView 
        intensity={intensity} 
        tint="dark" 
        className={`absolute inset-0 ${className || ''}`}
        style={styles.blur} 
      />
      <View 
        className={`bg-white/5 border border-white/10 ${strong ? 'bg-white/10 border-white/20' : ''}`}
        style={[StyleSheet.absoluteFill, styles.overlay]} 
      />
      
      {/* Content wrapper */}
      <View className="relative z-10 w-full h-full p-[2px]">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    borderRadius: 24,
  }
});
