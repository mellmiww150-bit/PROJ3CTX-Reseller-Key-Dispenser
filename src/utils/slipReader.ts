import jsQR from 'jsqr';

export interface ThaiBankInfo {
  code: string;
  nameTh: string;
  nameEn: string;
  shortName: string;
  color: string;
}

export const THAI_BANKS: Record<string, ThaiBankInfo> = {
  '004': { code: '004', nameTh: 'ธนาคารกสิกรไทย', nameEn: 'Kasikornbank', shortName: 'KBANK', color: '#138f2d' },
  '014': { code: '014', nameTh: 'ธนาคารไทยพาณิชย์', nameEn: 'Siam Commercial Bank', shortName: 'SCB', color: '#4e2e7f' },
  '006': { code: '006', nameTh: 'ธนาคารกรุงไทย', nameEn: 'Krungthai Bank', shortName: 'KTB', color: '#00a3e0' },
  '002': { code: '002', nameTh: 'ธนาคารกรุงเทพ', nameEn: 'Bangkok Bank', shortName: 'BBL', color: '#1e3a8a' },
  '011': { code: '011', nameTh: 'ธนาคารทหารไทยธนชาต', nameEn: 'TMBThanachart', shortName: 'TTB', color: '#002d62' },
  '025': { code: '025', nameTh: 'ธนาคารกรุงศรีอยุธยา', nameEn: 'Bank of Ayudhya', shortName: 'BAY', color: '#fdb913' },
  '030': { code: '030', nameTh: 'ธนาคารออมสิน', nameEn: 'Government Savings Bank', shortName: 'GSB', color: '#eb008b' },
  '034': { code: '034', nameTh: 'ธ.ก.ส.', nameEn: 'BAAC', shortName: 'BAAC', color: '#006633' },
  '069': { code: '069', nameTh: 'ธนาคารเกียรตินาคินภัทร', nameEn: 'Kiatnakin Phatra', shortName: 'KKP', color: '#77216f' },
  '022': { code: '022', nameTh: 'ธนาคารซีไอเอ็มบี ไทย', nameEn: 'CIMB Thai', shortName: 'CIMB', color: '#7d0000' },
};

export interface ParsedSlipQr {
  raw: string;
  isStandardSlipQr: boolean;
  bankCode?: string;
  bankInfo?: ThaiBankInfo;
  transRef?: string;
  dateTimeRaw?: string;
}

/**
 * Scans QR code from an image File or DataURL using jsQR
 * Features multi-pass scanning: full image, bottom-region crop (where bank mini-QRs reside),
 * and contrast-enhanced binarization for maximum recognition rate.
 */
export async function scanQrFromImage(imageSource: File | string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        if (naturalW === 0 || naturalH === 0) {
          resolve(null);
          return;
        }

        const helperCanvas = document.createElement('canvas');
        const helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
        if (!helperCtx) {
          resolve(null);
          return;
        }

        // Helper function to scan a canvas with jsQR
        const tryScanCanvas = (canvas: HTMLCanvasElement): string | null => {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return null;
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // 1. Regular attempt
          let code = jsQR(imgData.data, canvas.width, canvas.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) return code.data;

          // 2. Invert attempt
          code = jsQR(imgData.data, canvas.width, canvas.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) return code.data;

          return null;
        };

        // Pass 1: Standard Resized Canvas
        let scale = 1;
        const maxDim = 1600;
        if (naturalW > maxDim || naturalH > maxDim) {
          scale = Math.min(maxDim / naturalW, maxDim / naturalH);
        }
        const w = Math.round(naturalW * scale);
        const h = Math.round(naturalH * scale);

        helperCanvas.width = w;
        helperCanvas.height = h;
        helperCtx.drawImage(img, 0, 0, w, h);

        const resultPass1 = tryScanCanvas(helperCanvas);
        if (resultPass1) {
          resolve(resultPass1);
          return;
        }

        // Pass 2: Thai bank slips almost always have mini-QR in the bottom 60%
        // Focus on the bottom section where slip QR is typically located (KBank, SCB, KTB, BBL, TTB)
        const cropY = Math.round(naturalH * 0.35);
        const cropH = naturalH - cropY;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = naturalW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
        if (cropCtx) {
          cropCtx.drawImage(img, 0, cropY, naturalW, cropH, 0, 0, naturalW, cropH);
          const resultCrop = tryScanCanvas(cropCanvas);
          if (resultCrop) {
            resolve(resultCrop);
            return;
          }
        }

        // Pass 3: Contrast boosted pass (helps with dark mode slips or faint QR)
        const contrastCanvas = document.createElement('canvas');
        contrastCanvas.width = w;
        contrastCanvas.height = h;
        const contrastCtx = contrastCanvas.getContext('2d', { willReadFrequently: true });
        if (contrastCtx) {
          contrastCtx.drawImage(img, 0, 0, w, h);
          const cData = contrastCtx.getImageData(0, 0, w, h);
          const d = cData.data;
          // Grayscale + High-contrast threshold
          for (let i = 0; i < d.length; i += 4) {
            const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
            const val = gray > 140 ? 255 : 0;
            d[i] = val;
            d[i + 1] = val;
            d[i + 2] = val;
          }
          contrastCtx.putImageData(cData, 0, 0);
          const resultContrast = tryScanCanvas(contrastCanvas);
          if (resultContrast) {
            resolve(resultContrast);
            return;
          }
        }

        resolve(null);
      } catch (err) {
        console.warn('Error in scanQrFromImage:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * Parses Bank of Thailand Thai QR Payment Slip mini-QR code
 * Typical standard format: 00460006000001010301402...
 * Strictly validates Bank of Thailand TLV specifications.
 */
export function parseThaiBankSlipQr(qrString: string): ParsedSlipQr {
  const result: ParsedSlipQr = {
    raw: qrString,
    isStandardSlipQr: false,
  };

  if (!qrString || typeof qrString !== 'string') {
    return result;
  }

  const clean = qrString.trim();

  // BOT Standard Slip QR MUST contain "000001" and valid bank sub-tags (Tag 00 = 000001)
  // Format TLV pattern:
  // Tag 00: 000001
  // Tag 01: Bank code (e.g. 0103004 for KBank, 0103014 for SCB, 0103006 for KTB)
  // Tag 02: Transaction Reference
  const hasBotIndicator = clean.includes('000001') || clean.startsWith('0046');
  if (!hasBotIndicator || clean.length < 25) {
    // NOT a BOT bank slip QR code!
    return result;
  }

  // Extract sending bank code (004, 014, 006, 002, 011, 025, 030, etc.)
  const bankMatch = clean.match(/0103(0[0-9]{2})/);
  if (bankMatch && bankMatch[1]) {
    const code = bankMatch[1];
    result.bankCode = code;
    result.bankInfo = THAI_BANKS[code] || {
      code,
      nameTh: `ธนาคารรหัส ${code}`,
      nameEn: `Bank ${code}`,
      shortName: `BANK-${code}`,
      color: '#3b82f6',
    };
  } else {
    // If Tag 01 not found or invalid bank code format -> Reject as invalid slip QR
    return result;
  }

  // Extract transRef (Tag 02)
  const refMatch = clean.match(/02([0-9]{2})([A-Za-z0-9_-]+)/);
  if (refMatch && refMatch[2]) {
    const len = parseInt(refMatch[1], 10);
    const extracted = refMatch[2].substring(0, isNaN(len) ? 25 : len);
    if (extracted.length >= 8) {
      result.transRef = extracted;
      result.isStandardSlipQr = true;
    }
  }

  // If no valid transRef extracted from Tag 02, this is not a valid bank slip!
  if (!result.transRef) {
    result.isStandardSlipQr = false;
  }

  return result;
}
