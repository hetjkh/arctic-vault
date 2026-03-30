import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import type { InvoiceDocument } from '../../types';
import { deleteInvoice, getInvoice, updateInvoice } from '../../lib/api';
import InvoiceA4Preview from '../../components/InvoiceA4Preview';
import { downloadInvoicePdf } from '../../lib/invoicePdf';

function formatMoney(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safe.toFixed(2)}`;
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = String(params.id || '');

  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<InvoiceDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getInvoice(id);
      setInv(data);
    } catch (e: any) {
      Alert.alert('Failed to load invoice', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const totals = useMemo(() => {
    if (!inv) return null;
    return {
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
    };
  }, [inv]);

  const setStatus = useCallback(
    async (status: InvoiceDocument['status']) => {
      if (!inv) return;
      try {
        setSaving(true);
        const updated = await updateInvoice(inv.id, { status });
        setInv(updated);
      } catch (e: any) {
        Alert.alert('Update failed', e?.message || 'Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [inv]
  );

  const onDelete = useCallback(() => {
    if (!inv) return;
    Alert.alert('Delete invoice?', `Invoice #${inv.invoiceNumber} will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInvoice(inv.id);
            router.replace('/(tabs)/invoices');
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message || 'Please try again.');
          }
        },
      },
    ]);
  }, [inv, router]);

  const onDownload = useCallback(async () => {
    if (!inv) return;
    try {
      setDownloading(true);
      await downloadInvoicePdf(inv);
    } catch (e: any) {
      Alert.alert('PDF download failed', e?.message || 'Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [inv]);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#A3FF3D" />
      </View>
    );
  }

  if (!inv || !totals) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-6">
        <Text className="text-white font-black text-[18px]">Invoice not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-white/10 px-5 py-3 rounded-full">
          <Text className="text-white font-black">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingTop: 70, paddingBottom: 40 }} className="px-5">
        <View className="flex-row items-start justify-between mb-6">
          <View className="flex-1 pr-3">
            <Text className="text-[26px] font-black text-white tracking-tight">Invoice #{inv.invoiceNumber}</Text>
            <Text className="text-white/50 font-medium text-[13px] mt-1">
              {inv.billing?.name || 'Client'} · {formatMoney(inv.total, inv.currency || 'AED')}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} className="px-4 py-2.5 rounded-full bg-white/10 active:opacity-80">
            <Text className="text-white font-black">Close</Text>
          </Pressable>
        </View>

        {/* A4 Invoice UI (same structure as your Next.js template) */}
        <View className="mb-4">
          <InvoiceA4Preview invoice={inv} />
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-4">
          <Text className="text-white font-black text-[16px] mb-3">Status</Text>
          <View className="flex-row gap-3">
            <Pressable
              disabled={saving}
              onPress={() => setStatus('draft')}
              className={`flex-1 p-3 rounded-[18px] border ${inv.status === 'draft' ? 'bg-white/10 border-white/20' : 'bg-[#0d0d0d] border-white/10'} active:opacity-80`}
            >
              <Text className="text-white font-black text-center">Draft</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => setStatus('sent')}
              className={`flex-1 p-3 rounded-[18px] border ${inv.status === 'sent' ? 'bg-[#60A5FA1a] border-[#60A5FA40]' : 'bg-[#0d0d0d] border-white/10'} active:opacity-80`}
            >
              <Text className="text-white font-black text-center">Sent</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => setStatus('paid')}
              className={`flex-1 p-3 rounded-[18px] border ${inv.status === 'paid' ? 'bg-[#A3FF3D1a] border-[#A3FF3D40]' : 'bg-[#0d0d0d] border-white/10'} active:opacity-80`}
            >
              <Text className="text-white font-black text-center">Paid</Text>
            </Pressable>
          </View>
          <Text className="text-white/40 font-medium text-[12px] mt-3">
            Marking “Paid” will auto-create an income transaction in your backend.
          </Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/invoice/${inv.id}/edit`)}
            className="flex-1 bg-white/10 px-5 py-4 rounded-[22px] items-center active:opacity-80"
          >
            <Text className="text-white font-black tracking-wide">Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDownload}
            disabled={downloading}
            className="flex-1 bg-[#A3FF3D] px-5 py-4 rounded-[22px] items-center active:opacity-80"
          >
            {downloading ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black tracking-wide">PDF</Text>}
          </Pressable>
          <Pressable
            onPress={onDelete}
            className="flex-1 bg-red-500/15 px-5 py-4 rounded-[22px] items-center border border-red-500/25 active:opacity-80"
          >
            <Text className="text-red-300 font-black tracking-wide">Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

