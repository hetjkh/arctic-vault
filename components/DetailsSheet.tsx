import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';

export interface SheetConfig {
  visible: boolean;
  title: string;
  subtitle?: string;
  items: { label: string; value: any; subtext?: string }[];
}

export function DetailsSheet({ config, onClose }: { config: SheetConfig, onClose: () => void }) {
  if (!config.visible) return null;

  return (
    <Modal visible={config.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeInDown.duration(200)} className="flex-1 justify-end bg-black/70">
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
        
        <Animated.View entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))} exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))} className="bg-[#151515] rounded-t-[30px] p-6 max-h-[80%] border-t border-white/10">
          
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-[24px] font-black text-white tracking-tight">{config.title}</Text>
              {config.subtitle && <Text className="text-[14px] text-white/50 tracking-wide mt-1">{config.subtitle}</Text>}
            </View>
            <TouchableOpacity activeOpacity={0.6} onPress={onClose} className="bg-white/10 p-2.5 rounded-full">
              <X size={20} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
             {config.items.length === 0 ? (
               <Text className="text-white/40 text-center py-6 font-medium">No records found.</Text>
             ) : (
               config.items.map((item, idx) => (
                 <View key={idx} className="flex-row justify-between items-center py-4 border-b border-white/5">
                   <View className="flex-1 mr-4">
                     <Text className="text-[16px] font-bold text-white/90 tracking-tight">{item.label}</Text>
                     {item.subtext && <Text className="text-[12px] font-medium text-white/40 mt-1">{item.subtext}</Text>}
                   </View>
                   <Text className="text-[17px] font-black text-white">{item.value}</Text>
                 </View>
               ))
             )}
          </ScrollView>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
