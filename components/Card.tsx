import React from 'react';
import { View, Text, ViewProps } from 'react-native';

export type CardVariant = 'default' | 'solid' | 'neonGreen' | 'neonRed' | 'hollow' | 'hollowGreen';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-[#111111] border border-white/5",
  solid: "bg-[#111111] border border-white/10",
  neonGreen: "bg-[#00ff41]/10 border border-[#00ff41]/20",
  neonRed: "bg-[#ff0033]/10 border border-[#ff0033]/20",
  hollow: "bg-transparent border border-white/10",
  hollowGreen: "bg-transparent border border-[#00ff41]/20",
};

export function Card({ variant = 'default', className = '', style, children, ...props }: CardProps) {
  return (
    <View
      className={`rounded-3xl p-5 ${variantStyles[variant]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
