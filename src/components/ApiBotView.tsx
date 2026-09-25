import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Copy, 
  Check, 
  RotateCw, 
  Eye, 
  EyeOff, 
  Play, 
  Send, 
  CheckCircle2, 
  Zap, 
  Bot, 
  MessageSquare,
  Sparkles,
  Terminal
} from 'lucide-react';
import { ResellerProfile, ProductTier } from '../types';
import { formatThb, formatUsd, generateHex, playSuccessSound } from '../utils/helpers';

interface ApiBotViewProps {
  profile: ResellerProfile;
  products: ProductTier[];
  onRegenerateToken: () => void;
}

export const ApiBotView: React.FC<ApiBotViewProps> = ({
  profile,
  products,
  onRegenerateToken,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeEndpointTab, setActiveEndpointTab] = useState<number>(1);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [testResponseJson, setTestResponseJson] = useState<string | null>(null);

  // Bot Simulator State
  const [botChatMessages, setBotChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: '🤖 สวัสดีครับ! บอท PROJ3CTX พร้อมให้บริการเช็คสลิปและเบิกคีย์อัตโนมัติ 24 ชม. พิมพ์คำสั่ง /help หรือส่งรูปสลิป / ลิงก์ซองวอเล็ทได้เลยครับ',
      time: '12:30',
    },
  ]);
  const [botInputText, setBotInputText] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    playSuccessSound();
    setTimeout(() => setCopiedField(null), 1500);
  };

  const endpoints = [
    {
      id: 1,
      name: '1. List Products (/products.php)',
      method: 'GET',
      url: 'https://proj3ctx.store/api/v1/products.php',
      desc: 'Retrieves all supported license duration plans with live inventory counts and prices.',
      sampleResponse: {
        success: true,
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          duration: p.duration,
          price_thb: p.priceThb,
          stock: p.stock,
        })),
      },
    },
    {
      id: 2,
      name: '2. Dispense Key (/generate_key.php)',
      method: 'POST',
      url: 'https://proj3ctx.store/api/v1/generate_key.php',
      desc: 'Dispenses a fresh license key and automatically deducts balance.',
      sampleResponse: {
        success: true,
        order_id: 'ORD-20260924-' + generateHex(6),
        product: 'Phantom Universal (PHANTOM 1 DAY)',
        license_key: 'PHTM-' + generateHex(4) + '-' + generateHex(4) + '-' + generateHex(4),
        expires_at: '2026-09-25 18:00:00',
        remaining_balance_thb: profile.balanceThb - 15,
      },
    },
    {
      id: 3,
      name: '3. Check Balance (/balance.php)',
      method: 'GET',
      url: 'https://proj3ctx.store/api/v1/balance.php',
      desc: 'Fetches real-time dollar & baht balance for reseller account.',
      sampleResponse: {
        success: true,
        reseller: profile.username,
        balance_thb: profile.balanceThb,
        balance_usd: Number((profile.balanceThb / 32.5).toFixed(2)),
        status: profile.status,
      },
    },
    {
      id: 4,
      name: '4. Reset HWID (/reset_key.php)',
      method: 'POST',
      url: 'https://proj3ctx.store/api/v1/reset_key.php',
      desc: 'Resets hardware ID binding for a customer key.',
      sampleResponse: {
        success: true,
        license_key: 'PHTM-A59E-1405-788B',
        message: 'HWID cleared successfully. Key can now be bound to a new machine.',
        reset_count: 1,
      },
    },
    {
      id: 5,
      name: '5. Slip Checker Bot (/slip_verify.php)',
      method: 'POST',
      url: 'https://proj3ctx.store/api/v1/slip_verify.php',
      desc: 'Automated bank slip verification webhook for Discord/Telegram bots with anti-fraud duplicate detection.',
      sampleResponse: {
        success: true,
        verified: true,
        trans_ref: 'SLIP-KBANK-202609248819',
        bank: 'Kasikornbank',
        amount: 100.0,
        sender: 'นาย ชานนท์ พ.',
        credited_to: profile.username,
        message: 'Slip valid and approved. Balance updated.',
      },
    },
    {
      id: 6,
      name: '6. TrueMoney Voucher Bot (/truemoney_redeem.php)',
      method: 'POST',
      url: 'https://proj3ctx.store/api/v1/truemoney_redeem.php',
      desc: 'TrueMoney Angpao voucher auto-claim webhook for bot automation.',
      sampleResponse: {
        success: true,
        voucher_hash: 'tmv_0199182a8b',
        amount_claimed: 150.0,
        mobile_receiver: '089-xxx-8899',
        credited_to: profile.username,
      },
    },
    {
      id: 7,
      name: '7. Export Bot Payload (/bot_webhook)',
      method: 'JSON',
      url: 'https://proj3ctx.store/api/v1/bot_webhook.json',
      desc: 'Ready-to-use JSON config for Discord / Telegram Bot Webhooks.',
      sampleResponse: {
        bot_name: 'PROJ3CTX Reseller Bot v2.4',
        provider: 'Pure Database Core',
        auth_header: `Bearer ${profile.sellerKey}`,
        supported_commands: ['/checkslip', '/redeem_voucher', '/stock', '/buy_key'],
        webhook_status: 'ACTIVE',
      },
    },
  ];

  const currentEndpoint = endpoints.find((e) => e.id === activeEndpointTab) || endpoints[0];

  const handleTestEndpoint = () => {
    setIsTestingEndpoint(true);
    setTestResponseJson(null);

    setTimeout(() => {
      setIsTestingEndpoint(false);
      setTestResponseJson(JSON.stringify(currentEndpoint.sampleResponse, null, 2));
      playSuccessSound();
    }, 450);
  };

  // Bot Simulator Chat
  const handleSendBotMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!botInputText.trim()) return;

    const userMsg = botInputText.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBotChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time }]);
    setBotInputText('');

    setTimeout(() => {
      let reply = '🤖 ได้รับคำสั่งแล้วครับ กรุณารอสักครู่...';

      if (userMsg.includes('help') || userMsg.includes('คำสั่ง')) {
        reply = `📌 คำสั่งที่รองรับ:
1. /balance - เช็คยอดเครดิตคงเหลือ
2. /stock - เช็คสต็อกคีย์ทั้งหมด
3. /checkslip [อ้างอิงสลิป] - ตรวจสอบสลิปธนาคาร
4. วางลิงก์ซองของขวัญ TrueMoney - เติมเงินอัตโนมัติ`;
      } else if (userMsg.includes('balance') || userMsg.includes('ยอด')) {
        reply = `💰 เครดิตบัญชี ${profile.username} ปัจจุบัน: ${formatThb(profile.balanceThb)}`;
      } else if (userMsg.includes('stock') || userMsg.includes('สต็อก')) {
        reply = `📦 สต็อกคีย์ปัจจุบัน:
- Phantom 12 HR: 61 คีย์ (฿11)
- Phantom 1 Day: 28 คีย์ (฿15)
- Phantom 3 Day: 4 คีย์ (฿40)
- WeTv Mods: 120 คีย์ (฿10)`;
      } else if (userMsg.includes('slip') || userMsg.includes('สลิป')) {
        reply = `✅ ตรวจสอบสลิปสำเร็จ!
- ธนาคาร: กสิกรไทย (KBank)
- ยอดเงิน: ฿100.00
- สถานะ: ผ่านการตรวจสอบ เรียบร้อย`;
      } else if (userMsg.includes('gift.truemoney.com') || userMsg.includes('ซอง')) {
        reply = `🎉 รับซองของขวัญ TrueMoney สำเร็จ!
- ได้รับเงิน: +฿50.00
- บันทึกเข้าเครดิตตัวแทนเรียบร้อยครับ`;
      }

      setBotChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <span>REST API & Bot Webhooks</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Integrate automated high-speed stock dispensing directly into Discord & Telegram bots
        </p>
      </div>

      {/* Top Cards: Token info + Live Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Token Card matching Screenshot 6 */}
        <div className="lg:col-span-8 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b203c]">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Your Reseller API Token</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Connected</span>
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Pass this token in HTTP Headers:{' '}
            <span className="text-indigo-300 font-bold">Authorization: Bearer {profile.sellerKey}</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                API BASE ENDPOINT
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242a54] font-mono text-xs text-white">
                <span className="truncate">https://proj3ctx.store/api/v1</span>
                <button
                  onClick={() => handleCopy('https://proj3ctx.store/api/v1', 'base-url')}
                  className="text-slate-400 hover:text-white ml-2"
                  title="Copy Base URL"
                >
                  {copiedField === 'base-url' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                SECRET SELLER TOKEN
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242a54] font-mono text-xs text-white">
                  <span className="truncate">
                    {showSecret ? profile.secretToken : '••••••••••••••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400 hover:text-white ml-2"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(profile.secretToken, 'secret-token')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === 'secret-token' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#1b203c]">
            <span className="text-[11px] text-slate-400">
              Need a fresh key? Previous tokens will expire immediately.
            </span>
            <button
              onClick={onRegenerateToken}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#171c3a] hover:bg-[#202750] border border-[#2a3366] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3 text-indigo-400" />
              <span>Regenerate Token</span>
            </button>
          </div>
        </div>

        {/* Live Balance Card matching Screenshot 6 */}
        <div className="lg:col-span-4 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              LIVE DOLLAR / THB BALANCE
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
              {formatThb(profile.balanceThb)}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              ({formatUsd(profile.balanceThb / 32.5)})
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              All API order dispensations will automatically deduct from this balance in real-time.
            </p>
          </div>

          <div className="space-y-1.5 text-xs border-t border-[#1b203c] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Seller Account:</span>
              <span className="font-bold text-white">{profile.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Speed:</span>
              <span className="font-bold text-emerald-400">Zero Delay (&lt;50ms)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rate Limit:</span>
              <span className="font-bold text-indigo-300">Unlimited / Core</span>
            </div>
          </div>

          <button
            onClick={() => alert('สต็อกในระบบ Webhook เชื่อมต่อกับฐานข้อมูลหลักแบบเรียลไทม์')}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Webhook Stock Refill</span>
          </button>
        </div>
      </div>

      {/* API Endpoints & Integration Playground matching Screenshot 6 */}
      <div className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">API Endpoints & Integration Playground</h3>
        </div>

        {/* Tab Pills for Endpoints */}
        <div className="flex flex-wrap gap-1.5 bg-[#0b0d1a] p-1.5 rounded-xl border border-[#1e2448]">
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => {
                setActiveEndpointTab(ep.id);
                setTestResponseJson(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeEndpointTab === ep.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#151934]'
              }`}
            >
              <span className="font-mono text-[10px] mr-1.5 px-1 py-0.2 rounded bg-black/40">
                {ep.method}
              </span>
              <span>{ep.name}</span>
            </button>
          ))}
        </div>

        {/* Playground Execution Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Left: Endpoint URL & Description */}
          <div className="lg:col-span-6 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                ENDPOINT URL:
              </div>
              <div className="p-3 rounded-xl bg-[#0b0d1a] border border-[#232953] flex items-center gap-2 font-mono text-xs text-white">
                <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold text-[10px]">
                  {currentEndpoint.method}
                </span>
                <span className="truncate">{currentEndpoint.url}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {currentEndpoint.desc}
            </p>

            <button
              onClick={handleTestEndpoint}
              disabled={isTestingEndpoint}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isTestingEndpoint ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>Test Live Endpoint</span>
            </button>
          </div>

          {/* Right: Example JSON Response */}
          <div className="lg:col-span-6 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              EXAMPLE JSON RESPONSE:
            </div>
            <pre className="p-4 rounded-xl bg-[#0b0d1a] border border-[#232953] text-indigo-300 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed">
              {testResponseJson || JSON.stringify(currentEndpoint.sampleResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Bot Simulator for Discord & Telegram */}
      <div className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b203c]">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Discord & Telegram Bot Simulator</h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Bot Engine Online</span>
          </span>
        </div>

        <p className="text-xs text-slate-400">
          จำลองการคุยและส่งสลิป / ซองวอเล็ทให้กับบอทอัตโนมัติ ทดสอบส่งคำสั่ง <span className="text-indigo-300 font-mono">/help</span>, <span className="text-indigo-300 font-mono">/stock</span>, หรือส่งข้อความสลิป
        </p>

        {/* Chat box */}
        <div className="bg-[#0b0d1a] border border-[#20254b] rounded-xl p-4 h-64 overflow-y-auto space-y-3">
          {botChatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-md px-3.5 py-2 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-[#181d3d] text-slate-200 border border-[#2b3366] rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSendBotMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={botInputText}
            onChange={(e) => setBotInputText(e.target.value)}
            placeholder="พิมพ์คำสั่ง เช่น /stock, /checkslip หรือวางลิงก์ซองของขวัญ..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#252b52] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
