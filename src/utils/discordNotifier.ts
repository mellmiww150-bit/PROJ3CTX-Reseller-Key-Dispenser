import { TopUpTransaction, UserAccount, LicenseKey, SystemPaymentConfig } from '../types';

export interface DiscordStatsPayload {
  totalUsersCount: number;
  totalKeysCount: number;
  totalRevenueThb: number;
  recentTransactions: TopUpTransaction[];
}

export interface DiscordNotifyOptions {
  webhookUrl?: string;
  event: 'TOPUP_SUCCESS' | 'KEY_DISPENSED' | 'NEW_USER' | 'SUMMARY_REPORT';
  data?: any;
  stats?: DiscordStatsPayload;
}

/**
 * Sends real-time embed notification to Discord Webhook
 * Reports:
 * 1. มีคนสมัครกี่คน (totalUsersCount)
 * 2. คีย์ออกกี่คีย์ (totalKeysCount)
 * 3. จำนวนเงินที่ได้ (totalRevenueThb)
 * 4. ประวัติการเติมเงิน (recentTransactions)
 */
export async function sendDiscordNotification(
  options: DiscordNotifyOptions,
  config?: SystemPaymentConfig
): Promise<{ success: boolean; message: string }> {
  const targetUrl = options.webhookUrl || config?.discordWebhookUrl;
  if (!targetUrl || !targetUrl.trim() || !targetUrl.startsWith('http')) {
    return { success: false, message: 'ไม่ได้ตั้งค่า Discord Webhook URL' };
  }

  // Check event toggles from config
  if (config) {
    if (options.event === 'NEW_USER' && config.discordNotifyNewUser === false) {
      return { success: false, message: 'ปิดการแจ้งเตือนสมาชิกใหม่ไว้ในระบบ' };
    }
    if (options.event === 'KEY_DISPENSED' && config.discordNotifyKeyDispense === false) {
      return { success: false, message: 'ปิดการแจ้งเตือนคีย์ออกไว้ในระบบ' };
    }
    if (options.event === 'TOPUP_SUCCESS' && config.discordNotifyTopup === false) {
      return { success: false, message: 'ปิดการแจ้งเตือนเงินเข้าไว้ในระบบ' };
    }
  }

  try {
    const res = await fetch('/api/webhook/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: targetUrl.trim(),
        event: options.event,
        data: options.data,
        stats: options.stats,
      }),
    });

    const resJson = await res.json();
    return {
      success: !!resJson.success,
      message: resJson.message || (resJson.success ? 'ส่งแจ้งเตือนเข้า Discord สำเร็จ' : resJson.error || 'เกิดข้อผิดพลาด'),
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'ไม่สามารถติดต่อ Webhook API ได้: ' + (err.message || String(err)),
    };
  }
}
