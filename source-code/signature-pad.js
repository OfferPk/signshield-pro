/**
 * SignShield Pro - Interactive Signature Pad & Corporate Seal Generator
 * (c) 2026 SignShield Pro. All rights reserved.
 */

(function(global) {
  'use strict';

  class SignaturePad {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.ctx = this.canvas.getContext('2d');
      this.color = options.color || '#0f172a';
      this.lineWidth = options.lineWidth || 2.5;
      this.isDrawing = false;
      this.points = [];
      this.history = [];
      this.initEvents();
    }

    initEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      };

      const start = (e) => {
        e.preventDefault();
        this.isDrawing = true;
        this.points = [getPos(e)];
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        this.points.push(pos);

        if (this.points.length > 2) {
          const lastPoint = this.points[this.points.length - 2];
          const currPoint = this.points[this.points.length - 1];
          const midPoint = {
            x: (lastPoint.x + currPoint.x) / 2,
            y: (lastPoint.y + currPoint.y) / 2
          };

          this.ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
          this.ctx.stroke();
        }
      };

      const stop = (e) => {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', stop);
    }

    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.points = [];
      this.history = [];
    }

    renderTypedSignature(name, font = 'cursive') {
      this.clear();
      if (!name) return;

      this.ctx.save();
      this.ctx.font = `italic 38px ${font}, 'Brush Script MT', 'Great Vibes', 'Segoe Script', cursive`;
      this.ctx.fillStyle = this.color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(name, this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.restore();
      this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    isEmpty() {
      const pixelBuffer = new Uint32Array(
        this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data.buffer
      );
      return !pixelBuffer.some(color => color !== 0);
    }

    toDataURL(type = 'image/png') {
      return this.canvas.toDataURL(type);
    }
  }

  const CorporateSealPresets = {
    approved: {
      id: 'approved',
      name: 'Approved & Executed',
      color: '#059669',
      borderStyle: 'dashed',
      title: 'APPROVED & EXECUTED',
      subtitle: 'LEGAL BINDING EFFECT',
      icon: '★'
    },
    confidential: {
      id: 'confidential',
      name: 'Confidential / Under NDA',
      color: '#dc2626',
      borderStyle: 'solid',
      title: 'CONFIDENTIAL & PRIVILEGED',
      subtitle: 'NON-DISCLOSURE ENFORCED',
      icon: '🔒'
    },
    uae_corporate: {
      id: 'uae_corporate',
      name: 'UAE Corporate Stamp',
      color: '#b45309',
      borderStyle: 'double',
      title: 'COMMERCIAL REGISTRATION SEAL',
      subtitle: 'DUBAI - UNITED ARAB EMIRATES',
      icon: '🏛'
    }
  };

  function generateSealData(presetKey, customText, refNumber) {
    const preset = CorporateSealPresets[presetKey] || CorporateSealPresets.approved;
    return {
      type: preset.id,
      text: customText || preset.title,
      subtext: preset.subtitle,
      ref: refNumber || 'OFFICIAL-SEAL',
      color: preset.color,
      icon: preset.icon
    };
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SignaturePad, CorporateSealPresets, generateSealData };
  } else {
    global.SignaturePad = SignaturePad;
    global.CorporateSealPresets = CorporateSealPresets;
    global.generateSealData = generateSealData;
  }
})(typeof window !== 'undefined' ? window : this);
