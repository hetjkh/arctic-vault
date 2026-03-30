import React from 'react';
import { Text, TextInput, View } from 'react-native';

export type InvoiceTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  keyboardType?: any;
};

export default function InvoiceTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: InvoiceTextFieldProps) {
  return (
    <View className="mb-3">
      <Text className="text-white/50 font-bold text-[12px] uppercase tracking-widest mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        keyboardType={keyboardType}
        className="bg-[#0d0d0d] text-white px-4 py-3 rounded-[18px] border border-white/10"
      />
    </View>
  );
}

