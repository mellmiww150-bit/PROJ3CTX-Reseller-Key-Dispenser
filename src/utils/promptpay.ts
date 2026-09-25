/**
 * PromptPay EMVCo QR Code Payload Generator & Validator
 * Compliant with Bank of Thailand (BOT) Thai QR Payment Standard
 * Generates genuine scannable PromptPay QR for all Thai Banking Apps
 */

/**
 * Calculates CRC16-CCITT (Polynomial 0x1021, Initial value 0xFFFF)
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats EMVCo TLV (Tag-Length-Value)
 */
function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Sanitizes phone number or National ID for PromptPay standard
 * Mobile: 10 digits starting with 0 -> 0066 + 9 digits (13 chars)
 * National ID: 13 digits (13 chars)
 * E-Wallet ID: 15 digits
 */
export function sanitizePromptPayTarget(target: string): {
  type: 'MOBILE' | 'NATIONAL_ID' | 'EWALLET';
  formatted: string;
} {
  const clean = target.replace(/[^0-9]/g, '');

  if (clean.length === 10 && clean.startsWith('0')) {
    // Thai Mobile: 0812345678 -> 0066812345678
    return {
      type: 'MOBILE',
      formatted: `0066${clean.substring(1)}`,
    };
  } else if (clean.length === 13) {
    // National ID or Tax ID: 13 digits
    return {
      type: 'NATIONAL_ID',
      formatted: clean,
    };
  } else if (clean.length === 15) {
    // E-Wallet ID
    return {
      type: 'EWALLET',
      formatted: clean,
    };
  }

  // Fallback: If 9-10 digits, assume mobile
  if (clean.length <= 10) {
    const mob = clean.startsWith('0') ? clean.substring(1) : clean;
    return {
      type: 'MOBILE',
      formatted: `0066${mob.padStart(9, '0')}`,
    };
  }

  return {
    type: 'NATIONAL_ID',
    formatted: clean.slice(0, 13),
  };
}

export interface PromptPayGenerateOptions {
  promptPayId: string;
  amount?: number;
}

/**
 * Generates genuine EMVCo PromptPay raw payload string
 */
export function generatePromptPayPayload(options: PromptPayGenerateOptions): string {
  const { promptPayId, amount } = options;
  const target = sanitizePromptPayTarget(promptPayId);

  // Merchant Account Info - PromptPay Sub-Tags
  // Tag 00: Application ID (AID) = A000000677010111
  const subTag00 = tlv('00', 'A000000677010111');

  // Tag 01: Mobile Number (0066xxxxxxxx) or Tag 02: National ID (13 digits)
  let subTagTarget = '';
  if (target.type === 'MOBILE') {
    subTagTarget = tlv('01', target.formatted);
  } else if (target.type === 'NATIONAL_ID') {
    subTagTarget = tlv('02', target.formatted);
  } else {
    subTagTarget = tlv('03', target.formatted);
  }

  const promptPayData = `${subTag00}${subTagTarget}`;

  // Build root tags
  // Tag 00: Payload Format Indicator = "01"
  const tag00 = tlv('00', '01');

  // Tag 01: Point of Initiation Method: "11" (Static) or "12" (Dynamic if amount specified)
  const tag01 = tlv('01', amount && amount > 0 ? '12' : '11');

  // Tag 29: Merchant Account Information - PromptPay
  const tag29 = tlv('29', promptPayData);

  // Tag 53: Transaction Currency = "764" (THB)
  const tag53 = tlv('53', '764');

  // Tag 54: Transaction Amount (optional, 2 decimal places)
  let tag54 = '';
  if (amount && amount > 0) {
    tag54 = tlv('54', amount.toFixed(2));
  }

  // Tag 58: Country Code = "TH"
  const tag58 = tlv('58', 'TH');

  // Combine before CRC calculation (Tag 63 length is 04)
  const partial = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(partial);

  return `${partial}${checksum}`;
}
