import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import InvoiceTextField from './InvoiceTextField';
import type { InvoiceLineItem } from '../types';

export type DraftInvoiceLineItem = {
  localId: string;
  product: string;
  description: string;
  quantityText: string;
  priceText: string;
};

export function toInvoiceLineItem(d: DraftInvoiceLineItem): InvoiceLineItem {
  const quantity = Math.max(0, Number(d.quantityText) || 0);
  const price = Math.max(0, Number(d.priceText) || 0);
  return {
    product: String(d.product || '').trim() || 'Item',
    description: String(d.description || '').trim(),
    quantity,
    price,
  };
}

export default function InvoiceLineItemRow({
  item,
  onChange,
  onRemove,
  index,
}: {
  item: DraftInvoiceLineItem;
  onChange: (next: DraftInvoiceLineItem) => void;
  onRemove: () => void;
  index: number;
}) {
  const set = useCallback(
    (patch: Partial<DraftInvoiceLineItem>) => {
      onChange({ ...item, ...patch });
    },
    [item, onChange]
  );

  return (
    <View className="bg-[#0d0d0d] p-4 rounded-[18px] border border-white/10 mb-3">
      <View className="flex-row justify-between items-center mb-2">
        <View>
          {/* Header area (kept intentionally minimal) */}
        </View>
        <Pressable onPress={onRemove} className="p-2 rounded-full bg-white/5 active:opacity-80">
          <Trash2 size={18} color="#EF4444" strokeWidth={2.2} />
        </Pressable>
      </View>

      <InvoiceTextField label={`Product #${index + 1}`} value={item.product} onChangeText={(v) => set({ product: v })} placeholder="Services" />
      <InvoiceTextField
        label="Description (optional)"
        value={item.description}
        onChangeText={(v) => set({ description: v })}
        placeholder="Domain Registration for 2 years"
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <InvoiceTextField
            label="Quantity"
            value={item.quantityText}
            onChangeText={(v) => set({ quantityText: v })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <InvoiceTextField
            label="Price"
            value={item.priceText}
            onChangeText={(v) => set({ priceText: v })}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );
}

