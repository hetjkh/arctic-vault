import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import type { InvoiceDocument, InvoiceLineItem } from '../types';

type InvoicePdfInput = Pick<
  InvoiceDocument,
  | 'invoiceNumber'
  | 'title'
  | 'from'
  | 'createdAt'
  | 'billing'
  | 'items'
  | 'payment'
  | 'subtotal'
  | 'tax'
  | 'total'
  | 'currency'
>;

const LOGO = require('../assets/images/Arctic_Base_logo_Black.png');
const SIGNATURE = require('../assets/images/Ronit_signature.png');

function escapeHtml(str: string) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  // Keep the same look as your sample: integer-ish for subtotal/total, but tax uses 2 decimals.
  return `${currency} ${safe}`;
}

const dataUriCache = new Map<string, string>();

function cacheKeyForModule(mod: any) {
  if (typeof mod === 'number') return `n:${mod}`;
  if (typeof mod === 'string') return `s:${mod}`;
  // Metro can return objects on some platforms (eg web). Use a stable-ish key.
  try {
    return `o:${JSON.stringify(mod)}`;
  } catch {
    return `o:${String(mod)}`;
  }
}

async function assetToDataUri(mod: any, mime: string) {
  const key = cacheKeyForModule(mod);
  const cached = dataUriCache.get(key);
  if (cached) return cached;

  const asset = Asset.fromModule(mod);
  // Ensure the underlying file exists locally so FileSystem can read it.
  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  let uri = asset.localUri || asset.uri;
  if (!uri) {
    throw new Error('Failed to resolve invoice image asset URI');
  }

  // On some platforms `asset.uri` can be remote even after download; ensure we have a local file URI.
  if (/^https?:\/\//i.test(uri)) {
    const target = `${LegacyFileSystem.cacheDirectory || ''}${encodeURIComponent(key)}.png`;
    const dl = await LegacyFileSystem.downloadAsync(uri, target);
    uri = dl.uri;
  }

  // Use literal "base64" string to avoid runtime differences where EncodingType is undefined.
  const base64 = await LegacyFileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
  const dataUri = `data:${mime};base64,${base64}`;
  dataUriCache.set(key, dataUri);
  return dataUri;
}

async function buildInvoiceHtml(inv: InvoicePdfInput) {
  const billing = inv.billing || ({} as any);
  const from = inv.from || ({} as any);
  const payment = inv.payment || ({} as any);
  const items: InvoiceLineItem[] = inv.items || [];

  const [logoDataUri, signatureDataUri] = await Promise.all([
    assetToDataUri(LOGO, 'image/png'),
    assetToDataUri(SIGNATURE, 'image/png'),
  ]);

  const rows = items
    .map((it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      const total = qty * price;
      return `
        <tr>
          <td style="padding: 16px 0;">
            <div style="font-weight: 700;">${escapeHtml(it.product || 'Item')}</div>
            <div style="color:#6B7280; margin-top: 2px;">${escapeHtml(it.description || '')}</div>
          </td>
          <td style="text-align:center; padding: 16px 0;">${qty}</td>
          <td style="text-align:center; padding: 16px 0;">${escapeHtml(String(inv.currency || 'AED'))} ${price}</td>
          <td style="text-align:center; padding: 16px 0;">${escapeHtml(String(inv.currency || 'AED'))} ${total}</td>
        </tr>
      `;
    })
    .join('');

  const subtotal = Number(inv.subtotal) || 0;
  const tax = Number(inv.tax) || 0;
  const total = Number(inv.total) || 0;
  const fromLines: string[] = Array.isArray(from.addressLines) ? from.addressLines : [];
  const dateObj = inv.createdAt ? new Date(inv.createdAt) : new Date();
  const dateText =
    Number.isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      @page { size: A4; margin: 0; }
      body {
        margin: 0;
        padding: 0;
        background: #f3f4f6;
        font-family: Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      .page {
        width: 21cm;
        min-height: 29.7cm;
        margin: 0 auto;
        background: #ffffff;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        color: #111827;
        position: relative;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 0 48px 32px;
      }
      .invoice-strip {
        background: #eac5ff5e;
        padding: 20px 20px;
        font-weight: 700;
        font-size: 44px;
        letter-spacing: -0.8px;
      }
      .header-right {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-end;
      }
      .logo-placeholder {
        width: 90px;
        height: 90px;
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 14px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size: 10px;
        font-weight: 700;
      }
      .logo-img {
        width: 260px;
        height: 96px;
        object-fit: contain;
      }
      .title-row {
        display:flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
      }
      .title {
        font-size: 24px;
        color: #000;
        font-weight: 500;
      }
      .inv-num {
        font-size: 24px;
        color: #6B7280;
        font-weight: 600;
      }
      .inv-meta {
        display:flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .inv-date {
        font-size: 14px;
        color: #6B7280;
        font-weight: 500;
      }
      .section {
        padding: 0 48px;
      }
      .section h3 {
        font-size: 20px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .billing p {
        margin: 2px 0;
      }
      .billing .bold { font-weight: 700; }
      .two-col {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .col {
        width: 49%;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }
      thead th {
        border-bottom: 2px solid #F3F4F6;
        padding-bottom: 12px;
        font-size: 20px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #111827;
      }
      tbody td { border-bottom: 1px solid #D1D5DB; }
      tbody tr:last-child td { border-bottom: none; }
      .totals {
        display: flex;
        justify-content: flex-end;
        padding: 0 48px;
        margin-top: 24px;
      }
      .totals table { width: 45%; }
      .totals td {
        padding: 10px 0;
        border-bottom: 1px solid #D1D5DB;
        font-size: 12px;
      }
      .totals tr:last-child td { border-bottom: none; }
      .footer {
        margin-top: 14px;
        padding: 0 48px 24px;
      }
      .footer-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
      }
      .payment {
        width: 50%;
        padding-right: 10px;
      }
      .payment h4 {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .payment .details { font-size: 11px; line-height: 1.6; }
      .signature {
        width: 50%;
        display:flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .signature-img {
        width: 170px;
        height: 70px;
        object-fit: contain;
      }
      .thankyou {
        background: #eac5ff5e;
        padding: 18px 48px;
        margin: 14px -48px 0;
        font-weight: 700;
      }
      .thankyou p {
        font-weight: 500;
        font-size: 12px;
        line-height: 1.4;
        margin-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div style="width:100%;">
          <div style="display:flex; justify-content: space-between; align-items: center;">
            <div class="invoice-strip">INVOICE</div>
            <img class="logo-img" src="${logoDataUri}" alt="logo" />
          </div>
          <div class="title-row" style="margin-top: 18px;">
            <div class="title">${escapeHtml(inv.title || '')}</div>
            <div class="inv-meta">
              <div class="inv-num"><span style="font-weight:700;">INVOICE</span> ${escapeHtml(inv.invoiceNumber || '')}</div>
              ${dateText ? `<div class="inv-date">Date: ${escapeHtml(dateText)}</div>` : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="section billing">
        <div class="two-col">
          <div class="col">
            <h3>BILLING TO:</h3>
            <p class="bold">${escapeHtml(billing.name || '')}</p>
            <p>${escapeHtml(billing.address || '')}</p>
            <p>Trade license no: ${escapeHtml(billing.tradeLicense || '')}</p>
            <p>Phone: ${escapeHtml(billing.phone || '')}</p>
          </div>
          <div class="col">
            <h3>FROM:</h3>
            <p class="bold">${escapeHtml(from.name || 'ArcticBase')}</p>
            ${fromLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}
            <p>Phone: ${escapeHtml(from.phone || '')}</p>
            <p>Email: ${escapeHtml(from.email || '')}</p>
            <p>GST NO: ${escapeHtml(from.gst || '')}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">PRODUCT</th>
              <th style="text-align:center; width:14%;">QTY</th>
              <th style="text-align:center; width:18%;">PRICE</th>
              <th style="text-align:center; width:18%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${rows || ''}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <table>
          <tbody>
            <tr>
              <td style="width:55%; padding-right: 12px; border-bottom: 1px solid #D1D5DB;">SUB TOTAL</td>
              <td style="text-align:right; border-bottom: 1px solid #D1D5DB; font-weight: 700;">${escapeHtml(money(subtotal, inv.currency || 'AED'))}</td>
            </tr>
            <tr>
              <td style="width:55%; padding-right: 12px; border-bottom: 1px solid #D1D5DB;">TAX (0.00%)</td>
              <td style="text-align:right; border-bottom: 1px solid #D1D5DB; font-weight: 700;">${escapeHtml(
                money(tax, inv.currency || 'AED')
              )}</td>
            </tr>
            <tr>
              <td style="padding-right: 12px; font-weight: 700; font-size: 16px;">TOTAL</td>
              <td style="text-align:right; font-weight: 900; font-size: 12px;">${escapeHtml(money(total, inv.currency || 'AED'))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div class="footer-top">
          <div class="payment">
            <h4>PAYMENT DETAILS:</h4>
            <div class="details">
              <div><span style="font-weight:700;">Account Holder Name:</span> ${escapeHtml(payment.holder || '')}</div>
              <div><span style="font-weight:700;">Account Number:</span> ${escapeHtml(payment.accountNumber || '')}</div>
              <div><span style="font-weight:700;">Bank Name:</span> ${escapeHtml(payment.bank || '')}</div>
              <div><span style="font-weight:700;">IFSC Code:</span> ${escapeHtml(payment.ifsc || '')}</div>
              <div><span style="font-weight:700;">SWIFT/BIC Code:</span> ${escapeHtml(payment.swift || '')}</div>
              <div><span style="font-weight:700;">Mobile Number:</span> ${escapeHtml(payment.mobile || '')}</div>
            </div>
          </div>
          <div class="signature">
            <img class="signature-img" src="${signatureDataUri}" alt="signature" />
            <div style="margin-top: 10px; font-weight: 700; font-size: 12px;">Authorised Signatory</div>
          </div>
        </div>

        <div class="thankyou">
          <div style="font-size: 14px; text-align: left;">Thank you for your trust and support!</div>
          <p style="margin: 0; text-align: left;">
            We truly appreciate the opportunity to work with you. If you have any questions regarding this invoice or future projects, please
            feel free to reach out anytime.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function downloadInvoicePdf(inv: InvoicePdfInput) {
  const html = await buildInvoiceHtml(inv);
  const { uri } = await Print.printToFileAsync({ html });

  // This opens the native share/save flow; on phones this is the closest UX to “download”.
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Invoice PDF',
  });
}

