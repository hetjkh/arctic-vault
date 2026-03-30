import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import type { InvoiceDocument, InvoiceLineItem, InvoiceUpdateInput } from '../../../types';
import { getInvoice, updateInvoice } from '../../../lib/api';
import InvoiceA4Preview from '../../../components/InvoiceA4Preview';
import { downloadInvoicePdf } from '../../../lib/invoicePdf';
import InvoiceTextField from '../../../components/InvoiceTextField';
import InvoiceLineItemRow, { DraftInvoiceLineItem, toInvoiceLineItem } from '../../../components/InvoiceLineItemRow';

function parseMoney(s: string) {
  const v = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : 0;
}

export default function EditInvoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = String(params.id || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [inv, setInv] = useState<InvoiceDocument | null>(null);

  const [title, setTitle] = useState('');
  const [tax, setTax] = useState('0');
  const [billingName, setBillingName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingTradeLicense, setBillingTradeLicense] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const createBlankDraftItem = (): DraftInvoiceLineItem => ({
    localId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    product: 'Services',
    description: '',
    quantityText: '1',
    priceText: '',
  });

  const [draftItems, setDraftItems] = useState<DraftInvoiceLineItem[]>(() => [createBlankDraftItem()]);

  const load = useCallback(async () => {
    try {
      const data = await getInvoice(id);
      setInv(data);
      setTitle(data.title || '');
      setTax(String(data.tax ?? 0));
      setBillingName(data.billing?.name || '');
      setBillingAddress(data.billing?.address || '');
      setBillingTradeLicense(data.billing?.tradeLicense || '');
      setBillingPhone(data.billing?.phone || '');

      const fromApi = (data.items || []).map((it) => ({
        localId: `${it.product}_${Math.random().toString(16).slice(2)}`,
        product: it.product || 'Services',
        description: it.description || '',
        quantityText: String(it.quantity ?? 0),
        priceText: String(it.price ?? 0),
      }));
      setDraftItems(fromApi.length > 0 ? fromApi : [createBlankDraftItem()]);
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

  const items: InvoiceLineItem[] = useMemo(() => draftItems.map((d) => toInvoiceLineItem(d)), [draftItems]);

  const hasValidLineItem = useMemo(
    () => items.some((it) => it.quantity > 0 && it.price > 0),
    [items]
  );

  const computed = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
    const taxNum = parseMoney(tax);
    return { subtotal, tax: taxNum, total: subtotal + taxNum };
  }, [items, tax]);

  const draftInvoiceForPreview = useMemo(() => {
    if (!inv) return null;
    return {
      invoiceNumber: inv.invoiceNumber,
      title: String(title || ''),
      from: inv.from,
      billing: {
        name: String(billingName || ''),
        address: String(billingAddress || ''),
        tradeLicense: String(billingTradeLicense || ''),
        phone: String(billingPhone || ''),
      },
      items,
      payment: inv.payment,
      subtotal: computed.subtotal,
      tax: computed.tax,
      total: computed.total,
      currency: inv.currency,
      status: inv.status,
    } as const;
  }, [
    billingAddress,
    billingName,
    billingPhone,
    billingTradeLicense,
    computed.subtotal,
    computed.tax,
    computed.total,
    inv,
    items,
    title,
  ]);

  const onDownload = useCallback(async () => {
    if (!draftInvoiceForPreview) return;
    if (!hasValidLineItem) {
      Alert.alert('Missing line items', 'Please enter at least one item with quantity and price.');
      return;
    }
    try {
      setDownloading(true);
      await downloadInvoicePdf(draftInvoiceForPreview);
    } catch (e: any) {
      Alert.alert('PDF download failed', e?.message || 'Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [draftInvoiceForPreview, hasValidLineItem]);

  const save = async () => {
    if (!inv) return;
    if (!billingName.trim()) {
      Alert.alert('Missing billing name', 'Please enter Billing To name.');
      return;
    }
    if (!hasValidLineItem) {
      Alert.alert('Missing line item', 'Add quantity and price for at least one line item.');
      return;
    }

    const payload: InvoiceUpdateInput = {
      title: String(title || ''),
      billing: {
        name: String(billingName).trim(),
        address: String(billingAddress || ''),
        tradeLicense: String(billingTradeLicense || ''),
        phone: String(billingPhone || ''),
      },
      items,
      subtotal: computed.subtotal,
      tax: computed.tax,
      total: computed.total,
    };

    try {
      setSaving(true);
      const updated = await updateInvoice(inv.id, payload);
      router.replace(`/invoice/${updated.id}`);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#A3FF3D" />
      </View>
    );
  }

  if (!inv) {
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        contentContainerStyle={{ paddingTop: 70, paddingBottom: 40 }}
        className="px-5"
      >
        <View className="flex-row items-start justify-between mb-6">
          <View className="flex-1 pr-3">
            <Text className="text-[26px] font-black text-white tracking-tight">Edit Invoice #{inv.invoiceNumber}</Text>
            <Text className="text-white/50 font-medium text-[13px] mt-1">
              Total: <Text className="text-white font-black">{inv.currency} {computed.total.toFixed(2)}</Text>
            </Text>
          </View>
          <Pressable onPress={() => router.back()} className="px-4 py-2.5 rounded-full bg-white/10 active:opacity-80">
            <Text className="text-white font-black">Close</Text>
          </Pressable>
        </View>

        <View className="flex-row bg-white/5 border border-white/10 rounded-full p-1 mb-5">
          <Pressable
            onPress={() => setMode('edit')}
            className={`flex-1 px-4 py-2.5 rounded-full ${mode === 'edit' ? 'bg-white/15' : ''}`}
          >
            <Text className="text-white font-black text-center">Edit</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('preview')}
            className={`flex-1 px-4 py-2.5 rounded-full ${mode === 'preview' ? 'bg-white/15' : ''}`}
          >
            <Text className="text-white font-black text-center">Preview</Text>
          </Pressable>
        </View>

        {mode === 'preview' ? (
          <View>
            <View className="mb-5">
              {draftInvoiceForPreview ? <InvoiceA4Preview invoice={draftInvoiceForPreview as any} /> : null}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                disabled={downloading}
                onPress={onDownload}
                className="flex-1 bg-white/10 px-5 py-4 rounded-[22px] items-center active:opacity-80"
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-black tracking-wide">Download PDF</Text>
                )}
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={save}
                className={`flex-1 px-5 py-4 rounded-[22px] items-center ${saving ? 'bg-white/10' : 'bg-[#A3FF3D]'} active:opacity-80`}
              >
                <Text className={`${saving ? 'text-white' : 'text-black'} font-black tracking-wide`}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-5">
          <Text className="text-white font-black text-[16px] mb-4">Invoice</Text>
          <InvoiceTextField label="Title (optional)" value={title} onChangeText={setTitle} />
          <InvoiceTextField label="Tax" value={tax} onChangeText={setTax} keyboardType="numeric" />
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-5">
          <Text className="text-white font-black text-[16px] mb-4">BILLING TO</Text>
          <InvoiceTextField label="Name" value={billingName} onChangeText={setBillingName} />
          <InvoiceTextField label="Address" value={billingAddress} onChangeText={setBillingAddress} />
          <InvoiceTextField label="Trade license (optional)" value={billingTradeLicense} onChangeText={setBillingTradeLicense} />
          <InvoiceTextField label="Phone (optional)" value={billingPhone} onChangeText={setBillingPhone} keyboardType="phone-pad" />
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-black text-[16px]">LINE ITEM</Text>
            <Pressable
              onPress={() => setDraftItems((prev) => [...prev, createBlankDraftItem()])}
              className="bg-white/10 px-4 py-2.5 rounded-full active:opacity-80 flex-row items-center"
            >
              <Plus size={16} color="#A3FF3D" strokeWidth={3} />
              <View className="w-2" />
              <Text className="text-white font-black tracking-wide">Add</Text>
            </Pressable>
          </View>

          {draftItems.map((it, idx) => (
            <InvoiceLineItemRow
              key={it.localId}
              item={it}
              index={idx}
              onChange={(next) =>
                setDraftItems((prev) => prev.map((p) => (p.localId === it.localId ? next : p)))
              }
              onRemove={() =>
                setDraftItems((prev) => {
                  if (prev.length <= 1) {
                    Alert.alert('At least one item required', 'Please keep one line item in the invoice.');
                    return prev;
                  }
                  return prev.filter((p) => p.localId !== it.localId);
                })
              }
            />
          ))}

          <Text className="text-white/60 font-medium text-[13px] mt-2">
            Subtotal: <Text className="text-white font-black">{inv.currency} {computed.subtotal.toFixed(2)}</Text>
          </Text>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            disabled={downloading}
            onPress={onDownload}
            className="flex-1 bg-white/10 px-5 py-4 rounded-[22px] items-center active:opacity-80"
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-black tracking-wide">Download PDF</Text>
            )}
          </Pressable>
          <Pressable
            disabled={saving}
            onPress={save}
            className={`flex-1 px-5 py-4 rounded-[22px] items-center ${saving ? 'bg-white/10' : 'bg-[#A3FF3D]'} active:opacity-80`}
          >
            <Text className={`${saving ? 'text-white' : 'text-black'} font-black tracking-wide`}>
              {saving ? 'Saving…' : 'Save changes'}
            </Text>
          </Pressable>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

