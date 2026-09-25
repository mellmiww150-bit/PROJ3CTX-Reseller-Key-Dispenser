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
 */
export async function scanQrFromImage(imageSource: File | string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }

      // Resize canvas to reasonable size if very huge to speed up QR recognition
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // If dimensions are massive (> 1800), scale down proportionally
      const maxDim = 1800;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      
      // 1. Try standard scan
      let code = jsQR(imageData.data, width, height, {
        inversionAttempts: 'dontInvert',
      });

      // 2. Try invert if not found
      if (!code) {
        code = jsQR(imageData.data, width, height, {
          inversionAttempts: 'attemptBoth',
        });
      }

      resolve(code ? code.data : null);
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

  // BOT Standard Slip QR often contains "000001" and bank sub-tags
  // Format TLV pattern:
  // Tag 00: 000001
  // Tag 01: Bank code (e.g. 004, 014, 006)
  // Tag 02: Transaction Reference
  if (clean.includes('000001') || clean.startsWith('0046') || clean.length >= 25) {
    result.isStandardSlipQr = true;

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
    }

    // Extract transRef (Tag 02)
    const refMatch = clean.match(/02([0-9]{2})([A-Za-z0-9_-]+)/);
    if (refMatch && refMatch[2]) {
      const len = parseInt(refMatch[1], 10);
      result.transRef = refMatch[2].substring(0, isNaN(len) ? 20 : len);
    } else {
      // Fallback transRef extraction from alphanumeric sequences
      const anyRef = clean.match(/[0-9A-Za-z]{15,35}/);
      if (anyRef) {
        result.transRef = anyRef[0];
      }
    }
  }

  // If no bankCode detected yet, check known bank patterns
  if (!result.bankCode) {
    for (const [code, info] of Object.entries(THAI_BANKS)) {
      if (clean.includes(code) || clean.toLowerCase().includes(info.shortName.toLowerCase())) {
        result.bankCode = code;
        result.bankInfo = info;
        break;
      }
    }
  }

  // If still no transRef, generate an authoritative hash from the QR content
  if (!result.transRef && clean.length > 8) {
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    result.transRef = 'QR-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  return result;
}
