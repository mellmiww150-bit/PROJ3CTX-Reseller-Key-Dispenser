// Sound effects via Web Audio API (zero external assets)
export const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // Pleasant double harmonic chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6

    osc2.frequency.setValueAtTime(261.63, now);
    osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // AudioContext blocked or not supported
  }
};

export const playErrorSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Ignored
  }
};

export const generateHex = (length: number): string => {
  const chars = '0123456789ABCDEF';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
};

export const generateLicenseKey = (prefix: string = 'PHTM'): string => {
  return `${prefix}-${generateHex(4)}-${generateHex(4)}-${generateHex(4)}`;
};

export const generateOrderId = (): string => {
  const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const suffix = generateHex(6);
  return `ORD-${dateStr}-${suffix}`;
};

export const formatThb = (amount: number): string => {
  return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatUsd = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getCurrentTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Voice notification in Thai using Web Speech API: "เงินเข้าแล้วค่ะ ยอดเงิน ... บาท"
 */
export const speakThaiPaymentNotification = (amount: number, _methodTitle: string = 'เงินเข้าแล้ว'): void => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const roundedAmount = Math.round(amount);
      const text = `เงินเข้าแล้วค่ะ ได้รับเงินจำนวน ${roundedAmount} บาท เข้าสู่ระบบเรียบร้อยแล้วค่ะ`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;

      // Select Thai voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find((v) => v.lang.toLowerCase().startsWith('th'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Speech synthesis notification skipped:', e);
  }
};

/**
 * Reads an image file from OS folder or mobile gallery and converts to optimized DataURL
 * Automatically scales down large photos (e.g. from phone camera) to ensure fast rendering & storage
 */
export const processImageFileToDataUrl = (file: File, maxDimension = 900, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
