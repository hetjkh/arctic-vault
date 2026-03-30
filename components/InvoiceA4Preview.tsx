import React, { useMemo } from 'react';
import { Dimensions, Image, Text, View } from 'react-native';
import type { InvoiceDocument, InvoiceLineItem } from '../types';

type InvoicePreviewInput = Pick<
  InvoiceDocument,
  | 'invoiceNumber'
  | 'title'
  | 'from'
  | 'billing'
  | 'items'
  | 'payment'
  | 'subtotal'
  | 'tax'
  | 'total'
  | 'currency'
  | 'status'
>;

const LOGO = require('../assets/images/Arctic_Base_logo_Black.png');
const SIGNATURE = require('../assets/images/Ronit_signature.png');

export default function InvoiceA4Preview({ invoice }: { invoice: InvoicePreviewInput }) {
  const { frameW, frameH, scale, baseW, baseH } = useMemo(() => {
    // Render at a fixed "A4-like" canvas size, then scale it to fit the phone screen.
    // This prevents clipping caused by fixed height + overflow hidden.
    const screenWidth = Dimensions.get('window').width;
    const horizontalPadding = 40; // page container padding (screen)

    const w = 840; // base canvas width (px-ish)
    const h = Math.round(w * (297 / 210)); // A4 ratio

    const maxW = Math.max(280, screenWidth - horizontalPadding);
    const s = Math.min(1, maxW / w);
    return { frameW: Math.round(w * s), frameH: Math.round(h * s), scale: s, baseW: w, baseH: h };
  }, []);

  const billingAddress = invoice.billing?.address || '';
  const tradeLicense = invoice.billing?.tradeLicense || '';
  const phone = invoice.billing?.phone || '';
  const fromLines = Array.isArray(invoice.from?.addressLines) ? invoice.from.addressLines : [];
  const fromPhone = invoice.from?.phone || '';
  const fromEmail = invoice.from?.email || '';
  const fromGst = invoice.from?.gst || '';

  const items: InvoiceLineItem[] = invoice.items || [];

  return (
    <View className="bg-[#f3f4f6] rounded-[18px] p-3 items-center">
      {/* Frame controls the *layout size*; the inner canvas is scaled to fit. */}
      <View style={{ width: frameW, height: frameH }}>
        <View
          style={{
            width: baseW,
            height: baseH,
            backgroundColor: '#ffffff',
            padding: 0,
            overflow: 'hidden',
            borderRadius: 10,
            transform: [{ scale }],
            transformOrigin: 'top left' as any,
          }}
        >
          <View style={{ paddingHorizontal: 48, paddingTop: 24, paddingBottom: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View
                style={{
                  backgroundColor: '#eac5ff5e',
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                }}
              >
                <Text style={{ fontSize: 44, fontWeight: '800', color: '#111', letterSpacing: -0.8 }}>
                  INVOICE
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                <Text style={{ fontSize: 24, color: '#000', fontWeight: '500' }}>
                  {invoice.title || ''}
                </Text>
                <Text style={{ fontSize: 24, color: '#6B7280', fontWeight: '600' }}>
                  <Text style={{ fontWeight: '800', color: '#374151' }}>INVOICE </Text>
                  {invoice.invoiceNumber}
                </Text>
              </View>
            </View>

            <Image
              source={LOGO}
              resizeMode="contain"
              style={{
                width: 220,
                height: 90,
                marginTop: 10,
              }}
            />
          </View>

          {/* Billing + From (same row) */}
          <View style={{ marginTop: 28, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 20, color: '#000', fontWeight: '800', letterSpacing: 1 }}>
                BILLING TO:
              </Text>
              <Text style={{ marginTop: 10, fontSize: 16, fontWeight: '800', color: '#111' }}>
                {invoice.billing?.name || ''}
              </Text>
              {billingAddress ? <Text style={{ marginTop: 6, fontSize: 14, color: '#111' }}>{billingAddress}</Text> : null}
              {tradeLicense ? (
                <Text style={{ marginTop: 6, fontSize: 14, color: '#111' }}>Trade license no: {tradeLicense}</Text>
              ) : null}
              {phone ? <Text style={{ marginTop: 6, fontSize: 14, color: '#111' }}>Phone: {phone}</Text> : null}
            </View>

            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 20, color: '#000', fontWeight: '800', letterSpacing: 1 }}>
                FROM:
              </Text>
              <Text style={{ marginTop: 10, fontSize: 16, fontWeight: '800', color: '#111' }}>
                {invoice.from?.name || 'ArcticBase'}
              </Text>
              {fromLines.map((line, idx) => (
                <Text key={idx} style={{ marginTop: 6, fontSize: 14, color: '#111' }}>
                  {line}
                </Text>
              ))}
              {fromPhone ? <Text style={{ marginTop: 6, fontSize: 14, color: '#111' }}>Phone: {fromPhone}</Text> : null}
              {fromEmail ? <Text style={{ marginTop: 6, fontSize: 14, color: '#111' }}>Email: {fromEmail}</Text> : null}
              {fromGst ? <Text style={{ marginTop: 6, fontSize: 14, color: '#111' }}>GST NO: {fromGst}</Text> : null}
            </View>
          </View>

          {/* Items Table */}
          <View style={{ marginTop: 28 }}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 2,
                borderBottomColor: '#F3F4F6',
                paddingBottom: 12,
              }}
            >
              <Text style={{ flex: 2.3, fontSize: 20, fontWeight: '800', color: '#000' }}>PRODUCT</Text>
              <Text style={{ flex: 0.8, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#000' }}>
                QTY
              </Text>
              <Text style={{ flex: 1.1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#000' }}>
                PRICE
              </Text>
              <Text style={{ flex: 1.1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#000' }}>
                TOTAL
              </Text>
            </View>

            {items.map((it, idx) => {
              const total = (Number(it.quantity) || 0) * (Number(it.price) || 0);
              return (
                <View
                  key={`${it.product}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: '#D1D5DB',
                    paddingVertical: 16,
                  }}
                >
                  <View style={{ flex: 2.3 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111' }}>{it.product}</Text>
                    {it.description ? <Text style={{ marginTop: 4, fontSize: 13, color: '#6B7280' }}>{it.description}</Text> : null}
                  </View>
                  <Text style={{ flex: 0.8, textAlign: 'center', fontSize: 15, color: '#111' }}>
                    {it.quantity}
                  </Text>
                  <Text style={{ flex: 1.1, textAlign: 'center', fontSize: 15, color: '#111' }}>
                    {invoice.currency} {Number(it.price) || 0}
                  </Text>
                  <Text style={{ flex: 1.1, textAlign: 'center', fontSize: 15, color: '#111' }}>
                    {invoice.currency} {total}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Totals */}
          <View style={{ flex: 1 }} />
          <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
            <View style={{ width: '45%' }}>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingVertical: 12 }}>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#111' }}>SUB TOTAL</Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700', color: '#111' }}>
                  {invoice.currency} {invoice.subtotal}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingVertical: 12 }}>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#111' }}>
                  TAX (0.00%)
                </Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700', color: '#111' }}>
                  {invoice.currency} {invoice.tax.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', paddingVertical: 12 }}>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '900', color: '#111' }}>TOTAL</Text>
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#111' }}>
                  {invoice.currency} {invoice.total}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#111', letterSpacing: 0.7, textTransform: 'uppercase' }}>
                  PAYMENT DETAILS:
                </Text>
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 11, color: '#111', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '900' }}>Account Holder Name:</Text> {invoice.payment?.holder || ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#111', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '900' }}>Account Number:</Text> {invoice.payment?.accountNumber || ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#111', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '900' }}>Bank Name:</Text> {invoice.payment?.bank || ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#111', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '900' }}>IFSC Code:</Text> {invoice.payment?.ifsc || ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#111', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '900' }}>SWIFT/BIC Code:</Text> {invoice.payment?.swift || ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#111' }}>
                    <Text style={{ fontWeight: '900' }}>Mobile Number:</Text> {invoice.payment?.mobile || ''}
                  </Text>
                </View>
              </View>

              <View style={{ width: '48%', alignItems: 'flex-end' }}>
                <Image
                  source={SIGNATURE}
                  resizeMode="contain"
                  style={{
                    width: 180,
                    height: 70,
                    marginTop: 2,
                  }}
                />
                <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '900', color: '#111' }}>
                  Authorised Signatory
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 16,
                backgroundColor: '#eac5ff5e',
                paddingHorizontal: 24,
                paddingVertical: 16,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111' }}>
                Thank you for your trust and support!
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: '#111', lineHeight: 16 }}>
                We truly appreciate the opportunity to work with you. If you have any questions regarding this invoice or future projects,
                please feel free to reach out anytime.
              </Text>
            </View>
          </View>
          </View>
        </View>
      </View>
    </View>
  );
}

