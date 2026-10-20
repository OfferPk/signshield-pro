# SignShield Pro — User Guide & Electronic Signature Manual

Welcome to **SignShield Pro**, your private, client-side electronic document signing studio and cryptographic audit trail generator.

---

## 1\. Quick Start

### 1.1 Running the Visual Studio

1. Open `source-code/index.html` in any web browser (Chrome, Safari, Firefox, Edge). No web server or node installation is needed.  
2. Select a pre-configured legal agreement from the dropdown, or enter your own custom document title and clauses.  
3. Configure the contracting parties (Party A and Party B).  
4. Enter the signatory credentials (Legal Name, Email, Official Title).  
5. Choose your signature method:  
   - **Draw Signature**: Smooth freehand capture using your mouse, touchpad, or stylus on touchscreens.  
   - **Type Signature**: Instant rendering with stylized executive calligraphy and cursive fonts.  
6. Select an optional **Corporate Seal** (e.g., *Approved & Executed*, *Confidential & Privileged*, or *UAE Commercial Registration Seal*).  
7. Click **Print / Save Signed PDF** to print or export a PDF with the automated Certificate of Completion attached at the end.

---

## 2\. Using the Python Verification & Stamping CLI

SignShield Pro includes a standalone command-line tool (`build/signshield-cli.py`) for automated contract processing and offline hash verification:

\# Validate contract JSON schema

python3 build/signshield-cli.py \--input source-code/templates/freelance-services-agreement.json \--validate

\# Electronically sign and generate standalone HTML with audit certificate

python3 build/signshield-cli.py \\

  \--input source-code/templates/freelance-services-agreement.json \\

  \--signer-name "Marcus Vance" \\

  \--signer-email "m.vance@venturepeak.io" \\

  \--signer-role "CTO" \\

  \--output-html contract-signed.html \\

  \--output-json audit-envelope.json \\

  \--output-badge verified-seal.svg

---

## 3\. Statutory Legal Compliance Guidelines

Electronic signatures executed using SignShield Pro meet the foundational requirements for legal enforceability across major global jurisdictions:

- **Intent to Sign**: Expressed when the user draws or types their signature and executes the contract.  
- **Consent to Do Business Electronically**: SignShield Pro displays the standard ESIGN/eIDAS electronic transaction notice.  
- **Cryptographic Association**: The SHA-256 fingerprint binds the signature to the exact text of the contract. Any tampering invalidates the verification hash.