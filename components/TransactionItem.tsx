import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { Drumstick, Fuel, UserRoundMinus, Landmark, Info, Trash2, Pencil } from 'lucide-react-native';

interface TransactionItemProps {
  transaction: Transaction;
  userName?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  compact?: boolean;
  currentUserId?: number | string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString('en-IN', { month: 'short' });
  return `${d.getDate()} ${month}, ${d.getFullYear()}`;
}

const formatCompact = (num: number, limitPlaces: boolean = false) => {
  const absNum = Math.abs(num);
  if (absNum >= 100000) return `₹${(absNum / 100000).toFixed(limitPlaces ? 1 : 2)}L`;
  if (absNum >= 1000) return `₹${Math.floor(absNum / 1000)}k`;
  return `₹${Math.floor(absNum)}`;
};

export function TransactionItem({
  transaction,
  userName,
  onDelete,
  onEdit,
}: TransactionItemProps) {
  
  // Icon and Color Matrix based on exact instruction details
  const getIconConfig = () => {
    const isPersonal = transaction.type === 'personal';
    const isIncome = transaction.type === 'income';
    const isExpense = transaction.type === 'expense';
    
    // Explicit color mapping
    if (isPersonal) {
      return { Icon: UserRoundMinus, color: '#ff0033', colorClass: 'text-white' };
    }
    
    if (isIncome) {
      // Prompt literally dictates: "Income (credit): Green color, Format: -₹25k (as per design style)"
      return { Icon: Landmark, color: '#A3FF3D', colorClass: 'text-[#A3FF3D]' };
    }
    
    if (isExpense) {
      if (transaction.category === 'Food') return { Icon: Drumstick, color: '#ff0033', colorClass: 'text-[#ff0033]' };
      if (transaction.category === 'Travel') return { Icon: Fuel, color: '#ff0033', colorClass: 'text-[#ff0033]' };
      return { Icon: Info, color: '#ff0033', colorClass: 'text-[#ff0033]' };
    }
    
    return { Icon: Info, color: '#ff0033', colorClass: 'text-white' };
  };

  const { Icon, color, colorClass } = getIconConfig();
  
  // Generate Exact Display Title
  let displayTitle = transaction.description || transaction.category;
  if (transaction.type === 'personal') {
     // Based on prompt examples: "Ronit's Withdrawal", "Het's Withdrawal"
     displayTitle = userName ? `${userName}'s Withdrawal` : displayTitle;
  } else if (transaction.type === 'income') {
     // e.g., "4MG Advance" from prompt
     if (!displayTitle.includes('Advance')) displayTitle = `${displayTitle} Advance`;
  }

  // Exact UI representation logic including minus signs exclusively
  const amountString = `-${formatCompact(transaction.amount)}`;

  return (
    <View className="mb-3 rounded-[20px] bg-[#0A0A0A] border border-white/5 p-3 flex-row items-center w-full">
      {/* LEFT ICON BOX */}
      <View className="w-[52px] h-[52px] rounded-[16px] bg-[#000] border border-white/5 items-center justify-center mr-[14px]">
        <Icon color={color} size={24} strokeWidth={2} />
      </View>

      {/* CENTER CONTENT */}
      <View className="flex-1 justify-center py-1">
        <Text className="text-[15px] font-bold text-white mb-1 tracking-tight" numberOfLines={1}>
          {displayTitle}
        </Text>
        <Text className="text-[11px] font-medium text-white/40">
          {formatDate(transaction.date)}
        </Text>
      </View>

      {/* RIGHT AMOUNT */}
      <Text className={`text-[20px] font-black tracking-tight ${colorClass}`}>
        {amountString}
      </Text>

      {/* ACTION BLOCK FOR EDITING */}
      {(onDelete || onEdit) && (
        <View className="flex-col justify-between items-center ml-3 h-full gap-2">
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(transaction.id)}>
              <Trash2 size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(transaction.id)}>
              <Pencil size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
