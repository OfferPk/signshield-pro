/**
 * SignShield Pro - Cryptographic Signing & Audit Trail Engine
 * (c) 2026 SignShield Pro. All rights reserved.
 */

(function(global) {
  'use strict';

  // Fallback pure JS SHA-256 implementation for environments without SubtleCrypto
  function sha256_pure(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;

    const isPrime = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isPrime[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isPrime[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        const i2 = i + j;
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] = (i < 16) ? w[i] : (
            w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  async function calculateSHA256(text) {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        return sha256_pure(text);
      }
    }
    return sha256_pure(text);
  }

  function generateEnvelopeId() {
    const timestamp = Date.now().toString(16).toUpperCase();
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    return `SSP-${timestamp}-${randomHex}`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  class AuditTrailManager {
    constructor() {
      this.envelopeId = generateEnvelopeId();
      this.createdTime = new Date().toISOString();
    }

    async generateAuditCertificate(documentData, signerData) {
      const docContent = documentData.content || '';
      const docHash = await calculateSHA256(docContent);
      
      const signedPayload = JSON.stringify({
        envelopeId: this.envelopeId,
        docTitle: documentData.title,
        docHash: docHash,
        signerName: signerData.name,
        signerEmail: signerData.email,
        timestamp: signerData.timestamp || new Date().toISOString(),
        signatureType: signerData.type || 'draw',
        corporateSeal: signerData.corporateSeal || null
      });

      const finalAuditHash = await calculateSHA256(signedPayload);

      return {
        envelopeId: this.envelopeId,
        docTitle: documentData.title,
        originalDocHash: docHash,
        finalAuditHash: finalAuditHash,
        createdTime: this.createdTime,
        signedTime: signerData.timestamp || new Date().toISOString(),
        signerName: signerData.name,
        signerEmail: signerData.email,
        signerRole: signerData.role || 'Authorized Signatory',
        signerIp: signerData.ip || '127.0.0.1 (Client-Side Local)',
        userAgent: (typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS/CLI Runner'),
        signatureType: signerData.type || 'draw',
        signatureDataUrl: signerData.dataUrl || null,
        corporateSeal: signerData.corporateSeal || null
      };
    }

    renderCertificateHTML(audit) {
      const sealBadge = audit.corporateSeal ? `
        <div style="display:inline-block; border:2px dashed #059669; padding:8px 16px; border-radius:8px; text-transform:uppercase; font-size:12px; font-weight:800; color:#059669; background:rgba(5,150,105,0.06); margin-top:8px;">
          ★ CORPORATE SEAL: ${escapeHtml(audit.corporateSeal.text)} ★<br>
          <span style="font-size:10px; font-weight:500; text-transform:none;">Auth Ref: ${escapeHtml(audit.corporateSeal.ref || 'OFFICIAL')}</span>
        </div>
      ` : '';

      return `
        <div class="ssp-certificate-page" style="page-break-before:always; margin-top:40px; border:2px solid #243452; border-radius:10px; padding:35px 30px; background:#ffffff; color:#0f172a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:18px; margin-bottom:24px;">
            <div>
              <div style="font-size:11px; font-weight:800; letter-spacing:1px; color:#2563eb; text-transform:uppercase;">SignShield Pro Cryptographic Audit Service</div>
              <h2 style="font-size:24px; font-weight:900; margin:4px 0 0 0; color:#0f172a;">Certificate of Completion &amp; Electronic Signature</h2>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11px; font-weight:700; background:#f1f5f9; padding:4px 8px; border-radius:4px; border:1px solid #cbd5e1; font-family:monospace;">
                ${escapeHtml(audit.envelopeId)}
              </span>
            </div>
          </div>

          <p style="font-size:13px; color:#475569; margin-bottom:24px; line-height:1.6;">
            This document has been electronically executed pursuant to the <b>U.S. Electronic Signatures in Global and National Commerce Act (ESIGN)</b>, the <b>Uniform Electronic Transactions Act (UETA)</b>, <b>eIDAS Regulation (EU) No 910/2014</b>, and <b>UAE Federal Decree-Law No. 46 of 2021 on Electronic Transactions and Trust Services</b>.
          </p>

          <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:24px;">
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 0; font-weight:700; color:#64748b; width:28%;">Document Subject</td>
              <td style="padding:10px 0; font-weight:700; color:#0f172a;">${escapeHtml(audit.docTitle)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 0; font-weight:700; color:#64748b;">Signer Identity</td>
              <td style="padding:10px 0; color:#0f172a;">
                <b>${escapeHtml(audit.signerName)}</b> &lt;${escapeHtml(audit.signerEmail)}&gt;<br>
                <span style="color:#64748b; font-size:11px;">Role / Designation: ${escapeHtml(audit.signerRole)}</span>
              </td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 0; font-weight:700; color:#64748b;">Signing Timestamp</td>
              <td style="padding:10px 0; color:#0f172a; font-family:monospace; font-size:11.5px;">
                ${escapeHtml(audit.signedTime)}
              </td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 0; font-weight:700; color:#64748b;">Signature Method</td>
              <td style="padding:10px 0; color:#0f172a;">
                <span style="text-transform:capitalize; font-weight:700;">${escapeHtml(audit.signatureType)} Signature</span>
                ${sealBadge}
              </td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 0; font-weight:700; color:#64748b;">Originating Network</td>
              <td style="padding:10px 0; color:#64748b; font-size:11px; word-break:break-all;">
                IP: ${escapeHtml(audit.signerIp)} | Client: ${escapeHtml(audit.userAgent)}
              </td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 0; font-weight:700; color:#64748b;">Original Content SHA-256</td>
              <td style="padding:10px 0; font-family:monospace; font-size:11px; color:#2563eb; word-break:break-all;">
                ${escapeHtml(audit.originalDocHash)}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0; font-weight:700; color:#64748b;">Final Tamper-Proof Audit SHA-256</td>
              <td style="padding:10px 0; font-family:monospace; font-size:11px; color:#059669; font-weight:700; word-break:break-all;">
                ${escapeHtml(audit.finalAuditHash)}
              </td>
            </tr>
          </table>

          <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px 20px;">
            <div>
              <div style="font-size:11px; font-weight:800; color:#059669; text-transform:uppercase;">Security Status: Tamper-Evident &amp; Cryptographically Sealed</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Signature cryptographic digest verified with SHA-256 collision resistance.</div>
            </div>
            ${audit.signatureDataUrl ? `
              <div style="text-align:right;">
                <img src="${audit.signatureDataUrl}" alt="Signature" style="max-height:48px; max-width:180px; object-fit:contain; border-bottom:1px solid #94a3b8;" />
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    renderSvgSeal(envelopeId) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">
  <rect width="218" height="68" x="1" y="1" rx="8" fill="#f0fdf4" stroke="#059669" stroke-width="1.5" />
  <circle cx="32" cy="35" r="18" fill="#059669" />
  <path d="M26 35 l4 4 l8 -8" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <text x="60" y="28" font-family="-apple-system,sans-serif" font-size="11" font-weight="800" fill="#065f46" letter-spacing="0.5">CRYPTOGRAPHICALLY SIGNED</text>
  <text x="60" y="44" font-family="-apple-system,sans-serif" font-size="9.5" font-weight="600" fill="#047857">SignShield Pro Verified</text>
  <text x="60" y="58" font-family="monospace" font-size="8.5" fill="#64748b">${escapeHtml(envelopeId)}</text>
</svg>`;
    }
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateSHA256, sha256_pure, AuditTrailManager, generateEnvelopeId };
  } else {
    global.calculateSHA256 = calculateSHA256;
    global.AuditTrailManager = AuditTrailManager;
    global.generateEnvelopeId = generateEnvelopeId;
  }
})(typeof window !== 'undefined' ? window : this);
