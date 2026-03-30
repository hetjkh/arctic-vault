import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import type { InvoiceDocument } from '../../types';
import { deleteInvoice, listInvoices } from '../../lib/api';

function formatMoney(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safe.toFixed(2)}`;
}

function statusColor(status: InvoiceDocument['status']) {
  if (status === 'paid') return 'bg-[#A3FF3D1a] border-[#A3FF3D40] text-[#A3FF3D]';
  if (status === 'sent') return 'bg-[#60A5FA1a] border-[#60A5FA40] text-[#60A5FA]';
  return 'bg-white/5 border-white/10 text-white/80';
}

export default function InvoicesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InvoiceDocument[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listInvoices();
      setItems(data);
    } catch (e: any) {
      Alert.alert('Failed to load invoices', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const list = items || [];
    return [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [items]);

  const onDelete = useCallback((inv: InvoiceDocument) => {
    Alert.alert(
      'Delete invoice?',
      `Invoice #${inv.invoiceNumber} will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvoice(inv.id);
              setItems((prev) => (prev ? prev.filter((x) => x.id !== inv.id) : prev));
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#A3FF3D" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingTop: 70, paddingBottom: 150 }}
        className="z-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#A3FF3D"
          />
        }
      >
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[34px] font-black text-white tracking-tight leading-10 mb-1">Invoices</Text>
            </View>
            <Pressable
              onPress={() => router.push('/invoice/new')}
              className="bg-[#A3FF3D] px-5 py-3 rounded-full active:opacity-80 flex-row items-center"
            >
              <Plus size={18} color="#000" strokeWidth={3.5} />
              <View className="w-2" />
              <Text className="text-black font-black tracking-wide">New</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5 gap-3">
          {sorted.length === 0 ? (
            <View className="bg-[#111] p-6 rounded-[24px] border border-white/5">
              <Text className="text-white font-bold text-[16px]">No invoices yet</Text>
              <Text className="text-white/50 font-medium text-[13px] mt-1">
                Tap “New” to create your first invoice.
              </Text>
            </View>
          ) : (
            sorted.map((inv) => (
              <View key={inv.id} className="bg-[#111] rounded-[24px] border border-white/5 overflow-hidden">
                <Pressable
                  onPress={() => router.push(`/invoice/${inv.id}`)}
                  className="p-5 active:opacity-80"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-black text-[18px] tracking-tight">
                        #{inv.invoiceNumber}{inv.title ? ` · ${inv.title}` : ''}
                      </Text>
                      <Text className="text-white/50 font-medium text-[13px] mt-1">
                        {inv.billing?.name || 'Client'} · {formatMoney(inv.total, inv.currency || 'AED')}
                      </Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-full border ${statusColor(inv.status)}`}>
                      <Text className="font-black text-[12px] uppercase tracking-widest">{inv.status}</Text>
                    </View>
                  </View>
                </Pressable>

                <View className="flex-row border-t border-white/5">
                  <Pressable
                    onPress={() => router.push(`/invoice/${inv.id}`)}
                    className="flex-1 p-4 items-center active:opacity-80"
                  >
                    <Text className="text-white font-black tracking-wide">View</Text>
                  </Pressable>
                  <View className="w-px bg-white/5" />
                  <Pressable
                    onPress={() => router.push(`/invoice/${inv.id}/edit`)}
                    className="flex-1 p-4 items-center active:opacity-80"
                  >
                    <Text className="text-white font-black tracking-wide">Edit</Text>
                  </Pressable>
                  <View className="w-px bg-white/5" />
                  <Pressable
                    onPress={() => onDelete(inv)}
                    className="flex-1 p-4 items-center active:opacity-80"
                  >
                    <Text className="text-red-400 font-black tracking-wide">Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
