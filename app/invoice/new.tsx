import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import type { InvoiceCreateInput, InvoiceLineItem } from '../../types';
import { createInvoice, suggestInvoiceNumber } from '../../lib/api';
import InvoiceA4Preview from '../../components/InvoiceA4Preview';
import { downloadInvoicePdf } from '../../lib/invoicePdf';
import InvoiceTextField from '../../components/InvoiceTextField';
import InvoiceLineItemRow, { DraftInvoiceLineItem, toInvoiceLineItem } from '../../components/InvoiceLineItemRow';

function parseMoney(s: string) {
  const v = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : 0;
}

export default function NewInvoiceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [tax, setTax] = useState('0');

  const [fromName, setFromName] = useState('ArcticBase');
  const [fromAddress1, setFromAddress1] = useState('17 ,guru govind bag society,');
  const [fromAddress2, setFromAddress2] = useState('khokrah gayatri dairy ,');
  const [fromAddress3, setFromAddress3] = useState('Ahemdabad , Gujarat');
  const [fromPhone, setFromPhone] = useState('+91 90167 43347');
  const [fromEmail, setFromEmail] = useState('arcticbase.org@gmail.com');
  const [fromGst, setFromGst] = useState('24DAKPGJ8980DIZG');

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

  const [paymentHolder, setPaymentHolder] = useState('');
  const [paymentAccountNumber, setPaymentAccountNumber] = useState('');
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentIfsc, setPaymentIfsc] = useState('');
  const [paymentSwift, setPaymentSwift] = useState('');
  const [paymentMobile, setPaymentMobile] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await suggestInvoiceNumber();
        setInvoiceNumber(res.invoiceNumber);
      } catch (e) {
        // ok, user can type manually
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items: InvoiceLineItem[] = useMemo(() => draftItems.map((d) => toInvoiceLineItem(d)), [draftItems]);

  const hasValidLineItem = useMemo(() => items.some((it) => it.quantity > 0 && it.price > 0), [items]);

  const computed = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
    const taxNum = parseMoney(tax);
    return {
      subtotal,
      tax: taxNum,
      total: subtotal + taxNum,
    };
  }, [items, tax]);

  const draftInvoiceForPreview = useMemo(() => {
    // This object matches the fields used by `InvoiceA4Preview` and `downloadInvoicePdf`.
    return {
      invoiceNumber: String(invoiceNumber).trim(),
      title: String(title || ''),
      from: {
        name: String(fromName).trim(),
        addressLines: [fromAddress1, fromAddress2, fromAddress3].map((s) => String(s || '').trim()).filter(Boolean),
        phone: String(fromPhone || ''),
        email: String(fromEmail || ''),
        gst: String(fromGst || ''),
      },
      billing: {
        name: String(billingName || ''),
        address: String(billingAddress || ''),
        tradeLicense: String(billingTradeLicense || ''),
        phone: String(billingPhone || ''),
      },
      items,
      payment: {
        holder: String(paymentHolder || ''),
        accountNumber: String(paymentAccountNumber || ''),
        bank: String(paymentBank || ''),
        ifsc: String(paymentIfsc || ''),
        swift: String(paymentSwift || ''),
        mobile: String(paymentMobile || ''),
      },
      subtotal: computed.subtotal,
      tax: computed.tax,
      total: computed.total,
      currency: String(currency || 'AED'),
      status: 'draft' as const,
    };
  }, [
    billingAddress,
    billingName,
    billingPhone,
    billingTradeLicense,
    computed.subtotal,
    computed.tax,
    computed.total,
    currency,
    fromAddress1,
    fromAddress2,
    fromAddress3,
    fromEmail,
    fromGst,
    fromName,
    fromPhone,
    invoiceNumber,
    items,
    paymentAccountNumber,
    paymentBank,
    paymentHolder,
    paymentIfsc,
    paymentMobile,
    paymentSwift,
    title,
  ]);

  const onDownload = async () => {
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
  };

  const save = async () => {
    if (!billingName.trim()) {
      Alert.alert('Missing billing name', 'Please enter Billing To name.');
      return;
    }
    if (!hasValidLineItem) {
      Alert.alert('Missing line item', 'Add quantity and price for at least one line item.');
      return;
    }

    const payload: InvoiceCreateInput = {
      invoiceNumber: String(invoiceNumber).trim(),
      title: String(title || ''),
      from: {
        name: String(fromName).trim(),
        addressLines: [fromAddress1, fromAddress2, fromAddress3].map((s) => String(s || '').trim()).filter(Boolean),
        phone: String(fromPhone || ''),
        email: String(fromEmail || ''),
        gst: String(fromGst || ''),
      },
      billing: {
        name: String(billingName).trim(),
        address: String(billingAddress || ''),
        tradeLicense: String(billingTradeLicense || ''),
        phone: String(billingPhone || ''),
      },
      items,
      payment: {
        holder: String(paymentHolder || ''),
        accountNumber: String(paymentAccountNumber || ''),
        bank: String(paymentBank || ''),
        ifsc: String(paymentIfsc || ''),
        swift: String(paymentSwift || ''),
        mobile: String(paymentMobile || ''),
      },
      subtotal: computed.subtotal,
      tax: computed.tax,
      total: computed.total,
      currency: String(currency || 'AED'),
      type: 'official',
    };

    try {
      setSaving(true);
      const created = await createInvoice(payload);
      router.replace(`/invoice/${created.id}`);
    } catch (e: any) {
      Alert.alert('Create failed', e?.message || 'Please try again.');
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

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        contentContainerStyle={{ paddingTop: 70, paddingBottom: 40 }}
        className="px-5"
      >
        <View className="flex-row items-end justify-between mb-6">
          <View>
            <Text className="text-[28px] font-black text-white tracking-tight">New Invoice</Text>
            <Text className="text-[14px] font-medium text-white/50 tracking-wide mt-1">
              Create and save to your backend
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
              <InvoiceA4Preview invoice={draftInvoiceForPreview as any} />
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
                  {saving ? 'Saving…' : 'Create invoice'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-5">
          <Text className="text-white font-black text-[16px] mb-4">Invoice</Text>
          <InvoiceTextField label="Invoice number" value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="00001" />
          <InvoiceTextField label="Title (optional)" value={title} onChangeText={setTitle} placeholder="Website assets buy" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <InvoiceTextField label="Currency" value={currency} onChangeText={setCurrency} placeholder="AED" />
            </View>
            <View className="flex-1">
              <InvoiceTextField label="Tax" value={tax} onChangeText={setTax} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
          <Text className="text-white/60 font-medium text-[13px] mt-2">
            Total: <Text className="text-white font-black">{currency} {computed.total.toFixed(2)}</Text>
          </Text>
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-5">
          <Text className="text-white font-black text-[16px] mb-4">BILLING TO</Text>
          <InvoiceTextField label="Name" value={billingName} onChangeText={setBillingName} placeholder="Client name" />
          <InvoiceTextField label="Address" value={billingAddress} onChangeText={setBillingAddress} placeholder="Dubai, UAE" />
          <InvoiceTextField label="Trade license (optional)" value={billingTradeLicense} onChangeText={setBillingTradeLicense} />
          <InvoiceTextField label="Phone (optional)" value={billingPhone} onChangeText={setBillingPhone} keyboardType="phone-pad" />
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-5">
          <Text className="text-white font-black text-[16px] mb-4">FROM</Text>
          <InvoiceTextField label="Name" value={fromName} onChangeText={setFromName} />
          <InvoiceTextField label="Address line 1" value={fromAddress1} onChangeText={setFromAddress1} />
          <InvoiceTextField label="Address line 2" value={fromAddress2} onChangeText={setFromAddress2} />
          <InvoiceTextField label="Address line 3" value={fromAddress3} onChangeText={setFromAddress3} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <InvoiceTextField label="Phone" value={fromPhone} onChangeText={setFromPhone} keyboardType="phone-pad" />
            </View>
            <View className="flex-1">
              <InvoiceTextField label="Email" value={fromEmail} onChangeText={setFromEmail} keyboardType="email-address" />
            </View>
          </View>
          <InvoiceTextField label="GST no" value={fromGst} onChangeText={setFromGst} />
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-5">
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
            Subtotal: <Text className="text-white font-black">{currency} {computed.subtotal.toFixed(2)}</Text>
          </Text>
        </View>

        <View className="bg-[#111] p-5 rounded-[24px] border border-white/5 mb-6">
          <Text className="text-white font-black text-[16px] mb-4">PAYMENT DETAILS (optional)</Text>
          <InvoiceTextField label="Account holder" value={paymentHolder} onChangeText={setPaymentHolder} />
          <InvoiceTextField label="Account number" value={paymentAccountNumber} onChangeText={setPaymentAccountNumber} />
          <InvoiceTextField label="Bank" value={paymentBank} onChangeText={setPaymentBank} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <InvoiceTextField label="IFSC" value={paymentIfsc} onChangeText={setPaymentIfsc} />
            </View>
            <View className="flex-1">
              <InvoiceTextField label="SWIFT" value={paymentSwift} onChangeText={setPaymentSwift} />
            </View>
          </View>
          <InvoiceTextField label="Mobile" value={paymentMobile} onChangeText={setPaymentMobile} keyboardType="phone-pad" />
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
              {saving ? 'Saving…' : 'Create invoice'}
            </Text>
          </Pressable>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

