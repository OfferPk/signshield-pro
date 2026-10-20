/**
 * SignShield Pro - Application Controller & State Manager
 * (c) 2026 SignShield Pro. All rights reserved.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let state = {
    docTitle: 'Master Software Engineering & Design Services Agreement',
    jurisdiction: 'State of Delaware, United States',
    docDate: '2026-09-29',
    partyA: {
      name: 'Apex Digital Labs LLC',
      role: 'Service Provider',
      address: '1209 Orange Street, Wilmington, DE 19801'
    },
    partyB: {
      name: 'VenturePeak Holdings Inc.',
      role: 'Client',
      address: '500 Howard Street, San Francisco, CA 94105'
    },
    content: "This Master Services Agreement ('Agreement') is entered into as of September 29, 2026, by and between Apex Digital Labs LLC ('Contractor') and VenturePeak Holdings Inc. ('Client').\n\n1. SCOPE OF SERVICES: Contractor agrees to perform custom cloud architecture, full-stack application development, and user interface design according to the deliverables specified in active Statements of Work.\n\n2. COMPENSATION & PAYMENT: Client agrees to remit payment within 14 calendar days of invoice presentation. Milestone deliverables will be reviewed within 5 business days of submission.\n\n3. INTELLECTUAL PROPERTY ASSIGNMENT: Upon full and final settlement of all invoiced fees, Contractor irrevocably assigns and transfers to Client all right, title, and interest in and to the custom work product created under this Agreement.\n\n4. CONFIDENTIALITY: Both parties acknowledge that during the engagement, confidential business and technical information may be disclosed. Each party agrees to protect such confidential information with reasonable care for a period of two (2) years.\n\n5. GOVERNING LAW: This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware without regard to its conflict of law principles.",
    signer: {
      name: 'Marcus Vance',
      email: 'm.vance@venturepeak.io',
      role: 'Chief Technology Officer',
      type: 'draw',
      sealType: 'approved',
      sealCustomText: 'APPROVED & EXECUTED',
      sealRef: 'LEGAL-EXEC-2026'
    }
  };

  const auditManager = new AuditTrailManager();

  // Canvas & Signature Pad
  const canvas = document.getElementById('sigCanvas');
  let sigPad = null;
  if (canvas) {
    canvas.width = canvas.parentElement.clientWidth || 380;
    canvas.height = 130;
    sigPad = new SignaturePad(canvas, { color: '#0f172a', lineWidth: 2.5 });
  }

  // DOM Elements
  const elPresetSelect = document.getElementById('presetSelect');
  const elDocTitle = document.getElementById('docTitle');
  const elJurisdiction = document.getElementById('jurisdiction');
  const elDocDate = document.getElementById('docDate');
  const elPartyAName = document.getElementById('partyAName');
  const elPartyARole = document.getElementById('partyARole');
  const elPartyBName = document.getElementById('partyBName');
  const elPartyBRole = document.getElementById('partyBRole');
  const elDocContent = document.getElementById('docContent');

  const elSignerName = document.getElementById('signerName');
  const elSignerEmail = document.getElementById('signerEmail');
  const elSignerRole = document.getElementById('signerRole');
  const elSigMode = document.getElementById('sigMode');
  const elTypeSigControls = document.getElementById('typeSigControls');
  const elDrawSigControls = document.getElementById('drawSigControls');
  const elTypedInput = document.getElementById('typedInput');
  const elFontSelect = document.getElementById('fontSelect');
  const elSealSelect = document.getElementById('sealSelect');
  const elSealCustomText = document.getElementById('sealCustomText');
  const elBtnClearSig = document.getElementById('btnClearSig');

  // Preview elements
  const prevDocTitle = document.getElementById('prevDocTitle');
  const prevDocJurisdiction = document.getElementById('prevDocJurisdiction');
  const prevPartyAInfo = document.getElementById('prevPartyAInfo');
  const prevPartyBInfo = document.getElementById('prevPartyBInfo');
  const prevDocContent = document.getElementById('prevDocContent');
  const prevSigImage = document.getElementById('prevSigImage');
  const prevSignerMeta = document.getElementById('prevSignerMeta');
  const prevSealContainer = document.getElementById('prevSealContainer');
  const prevCertificateContainer = document.getElementById('prevCertificateContainer');

  function syncForm() {
    elDocTitle.value = state.docTitle;
    elJurisdiction.value = state.jurisdiction;
    elDocDate.value = state.docDate;
    elPartyAName.value = state.partyA.name;
    elPartyARole.value = state.partyA.role;
    elPartyBName.value = state.partyB.name;
    elPartyBRole.value = state.partyB.role;
    elDocContent.value = state.content;

    elSignerName.value = state.signer.name;
    elSignerEmail.value = state.signer.email;
    elSignerRole.value = state.signer.role;
    elTypedInput.value = state.signer.name;
    elSealSelect.value = state.signer.sealType;
    elSealCustomText.value = state.signer.sealCustomText;

    if (state.signer.type === 'type') {
      elSigMode.value = 'type';
      elTypeSigControls.style.display = 'block';
      elDrawSigControls.style.display = 'none';
      if (sigPad) sigPad.renderTypedSignature(state.signer.name, elFontSelect.value);
    } else {
      elSigMode.value = 'draw';
      elTypeSigControls.style.display = 'none';
      elDrawSigControls.style.display = 'block';
    }

    updatePreview();
  }

  async function updatePreview() {
    prevDocTitle.textContent = state.docTitle;
    prevDocJurisdiction.textContent = `Governing Jurisdiction: ${state.jurisdiction} • Executed: ${state.docDate}`;
    
    prevPartyAInfo.innerHTML = `<b>${escapeHtml(state.partyA.name)}</b><span>Role: ${escapeHtml(state.partyA.role)}</span><span style="font-size:11px; color:#64748b; display:block;">${escapeHtml(state.partyA.address)}</span>`;
    prevPartyBInfo.innerHTML = `<b>${escapeHtml(state.partyB.name)}</b><span>Role: ${escapeHtml(state.partyB.role)}</span><span style="font-size:11px; color:#64748b; display:block;">${escapeHtml(state.partyB.address)}</span>`;
    
    prevDocContent.textContent = state.content;

    // Render signature
    if (sigPad && !sigPad.isEmpty()) {
      prevSigImage.src = sigPad.toDataURL();
      prevSigImage.style.display = 'block';
    } else {
      prevSigImage.style.display = 'none';
    }

    prevSignerMeta.innerHTML = `
      <b>${escapeHtml(state.signer.name)}</b><br>
      <span>${escapeHtml(state.signer.role)}</span> &bull; <span>${escapeHtml(state.signer.email)}</span>
    `;

    // Render Corporate Seal
    if (state.signer.sealType !== 'none') {
      const sealData = generateSealData(state.signer.sealType, state.signer.sealCustomText, state.signer.sealRef);
      prevSealContainer.innerHTML = `
        <div class="seal-stamp-badge" style="border-color:${sealData.color}; color:${sealData.color};">
          ${sealData.icon} ${escapeHtml(sealData.text)} &bull; ${escapeHtml(sealData.ref)}
        </div>
      `;
    } else {
      prevSealContainer.innerHTML = '';
    }

    // Generate Audit Certificate
    const sealData = state.signer.sealType !== 'none' ? 
      generateSealData(state.signer.sealType, state.signer.sealCustomText, state.signer.sealRef) : null;

    const audit = await auditManager.generateAuditCertificate(
      { title: state.docTitle, content: state.content },
      {
        name: state.signer.name,
        email: state.signer.email,
        role: state.signer.role,
        type: state.signer.type,
        dataUrl: (sigPad && !sigPad.isEmpty()) ? sigPad.toDataURL() : null,
        corporateSeal: sealData
      }
    );

    prevCertificateContainer.innerHTML = auditManager.renderCertificateHTML(audit);

    try {
      localStorage.setItem('signshield_state', JSON.stringify(state));
    } catch (e) {}
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

  // Event Listeners for form inputs
  elDocTitle.addEventListener('input', e => { state.docTitle = e.target.value; updatePreview(); });
  elJurisdiction.addEventListener('input', e => { state.jurisdiction = e.target.value; updatePreview(); });
  elDocDate.addEventListener('input', e => { state.docDate = e.target.value; updatePreview(); });
  elPartyAName.addEventListener('input', e => { state.partyA.name = e.target.value; updatePreview(); });
  elPartyARole.addEventListener('input', e => { state.partyA.role = e.target.value; updatePreview(); });
  elPartyBName.addEventListener('input', e => { state.partyB.name = e.target.value; updatePreview(); });
  elPartyBRole.addEventListener('input', e => { state.partyB.role = e.target.value; updatePreview(); });
  elDocContent.addEventListener('input', e => { state.content = e.target.value; updatePreview(); });

  elSignerName.addEventListener('input', e => {
    state.signer.name = e.target.value;
    elTypedInput.value = e.target.value;
    if (state.signer.type === 'type' && sigPad) {
      sigPad.renderTypedSignature(e.target.value, elFontSelect.value);
    }
    updatePreview();
  });

  elSignerEmail.addEventListener('input', e => { state.signer.email = e.target.value; updatePreview(); });
  elSignerRole.addEventListener('input', e => { state.signer.role = e.target.value; updatePreview(); });

  elSigMode.addEventListener('change', e => {
    state.signer.type = e.target.value;
    if (e.target.value === 'type') {
      elTypeSigControls.style.display = 'block';
      elDrawSigControls.style.display = 'none';
      if (sigPad) sigPad.renderTypedSignature(state.signer.name, elFontSelect.value);
    } else {
      elTypeSigControls.style.display = 'none';
      elDrawSigControls.style.display = 'block';
      if (sigPad) sigPad.clear();
    }
    updatePreview();
  });

  elTypedInput.addEventListener('input', e => {
    if (sigPad) sigPad.renderTypedSignature(e.target.value, elFontSelect.value);
    updatePreview();
  });

  elFontSelect.addEventListener('change', e => {
    if (sigPad) sigPad.renderTypedSignature(elTypedInput.value, e.target.value);
    updatePreview();
  });

  elSealSelect.addEventListener('change', e => {
    state.signer.sealType = e.target.value;
    updatePreview();
  });

  elSealCustomText.addEventListener('input', e => {
    state.signer.sealCustomText = e.target.value;
    updatePreview();
  });

  elBtnClearSig.addEventListener('click', () => {
    if (sigPad) sigPad.clear();
    updatePreview();
  });

  if (canvas) {
    canvas.addEventListener('mouseup', () => updatePreview());
    canvas.addEventListener('touchend', () => updatePreview());
  }

  // Template Loader
  elPresetSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (!val) return;
    try {
      const res = await fetch(`templates/${val}.json`);
      if (res.ok) {
        const tmpl = await res.json();
        state.docTitle = tmpl.title;
        state.jurisdiction = tmpl.jurisdiction;
        state.docDate = tmpl.documentDate || '2026-09-29';
        state.partyA = tmpl.parties.partyA;
        state.partyB = tmpl.parties.partyB;
        state.content = tmpl.content;
        syncForm();
      }
    } catch (err) {
      console.warn('Preset load error', err);
    }
  });

  // Action: Print / PDF Export
  document.getElementById('btnPrintDoc').addEventListener('click', () => {
    window.print();
  });

  // Action: Export Audit Certificate JSON
  document.getElementById('btnExportJson').addEventListener('click', async () => {
    const sealData = state.signer.sealType !== 'none' ? 
      generateSealData(state.signer.sealType, state.signer.sealCustomText, state.signer.sealRef) : null;

    const audit = await auditManager.generateAuditCertificate(
      { title: state.docTitle, content: state.content },
      {
        name: state.signer.name,
        email: state.signer.email,
        role: state.signer.role,
        type: state.signer.type,
        dataUrl: (sigPad && !sigPad.isEmpty()) ? sigPad.toDataURL() : null,
        corporateSeal: sealData
      }
    );

    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audit.envelopeId}-audit-trail.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Action: Export SVG Seal Badge
  document.getElementById('btnExportSealSvg').addEventListener('click', () => {
    const svgContent = auditManager.renderSvgSeal(auditManager.envelopeId);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signshield-verified-seal.svg`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Initialize
  try {
    const cached = localStorage.getItem('signshield_state');
    if (cached) state = JSON.parse(cached);
  } catch (e) {}

  syncForm();
});
