import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DispenserView } from './components/DispenserView';
import { TopUpView } from './components/TopUpView';
import { KeysListView } from './components/KeysListView';
import { HistoryView } from './components/HistoryView';
import { ApiBotView } from './components/ApiBotView';
import { SettingsView } from './components/SettingsView';
import { AdminBackofficeView } from './components/AdminBackofficeView';
import { UsersManagementView } from './components/UsersManagementView';
import { ProductsManagementView } from './components/ProductsManagementView';
import { LoginView } from './components/LoginView';
import { PinVerifyModal } from './components/PinVerifyModal';
import { DispenseModal } from './components/DispenseModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { sendDiscordNotification } from './utils/discordNotifier';
import { 
  INITIAL_USERS,
  INITIAL_PRODUCTS, 
  INITIAL_KEYS, 
  INITIAL_ORDERS, 
  INITIAL_TRANSACTIONS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_PAYMENT_CONFIG
} from './data/initialData';
import { 
  UserAccount,
  UserRole,
  ResellerProfile, 
  ProductTier, 
  LicenseKey, 
  OrderRecord, 
  TopUpTransaction,
  BankAccountConfig,
  SystemPaymentConfig
} from './types';
import { 
  generateOrderId, 
  getCurrentTimestamp, 
  generateHex, 
  playSuccessSound,
  playErrorSound
} from './utils/helpers';

export default function App() {
  // 1. Users state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('proj3ctx_users_v2');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('proj3ctx_current_user_id_v2');
    return saved || INITIAL_USERS[0].id; // PROJ3CTX Super Admin by default
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('proj3ctx_logged_in');
    return saved !== 'false';
  });

  // Security confirmation PIN verification state after logging in
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('proj3ctx_pin_unlocked');
    return saved === 'true';
  });

  // Current active user
  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || INITIAL_USERS[0];

  // Map currentUser to ResellerProfile format for existing sub-components
  const profile: ResellerProfile = {
    username: currentUser.username,
    sellerKey: currentUser.sellerKey,
    isVerified: currentUser.isVerified,
    status: currentUser.status,
    balanceThb: currentUser.balanceThb,
    totalDepositedThb: currentUser.totalDepositedThb,
    totalSpentThb: currentUser.totalSpentThb,
    keysCreatedCount: currentUser.keysCreatedCount,
    secretToken: currentUser.secretToken,
    pinConfigured: true,
    twoFactorEnabled: false,
  };

  // 2. Database records
  const [products, setProducts] = useState<ProductTier[]>(() => {
    const saved = localStorage.getItem('proj3ctx_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [keys, setKeys] = useState<LicenseKey[]>(() => {
    const saved = localStorage.getItem('proj3ctx_keys');
    return saved ? JSON.parse(saved) : INITIAL_KEYS;
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem('proj3ctx_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [transactions, setTransactions] = useState<TopUpTransaction[]>(() => {
    const saved = localStorage.getItem('proj3ctx_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccountConfig[]>(() => {
    const saved = localStorage.getItem('proj3ctx_bank_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [paymentConfig, setPaymentConfig] = useState<SystemPaymentConfig>(() => {
    const saved = localStorage.getItem('proj3ctx_payment_config');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_CONFIG;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('proj3ctx_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_current_user_id_v2', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    sessionStorage.setItem('proj3ctx_pin_unlocked', isPinVerified ? 'true' : 'false');
  }, [isPinVerified]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_keys', JSON.stringify(keys));
  }, [keys]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('proj3ctx_payment_config', JSON.stringify(paymentConfig));
  }, [paymentConfig]);

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState<boolean>(false);
  const [dispenseInitialProductId, setDispenseInitialProductId] = useState<string | undefined>();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderRecord | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
    setIsPinVerified(false); // Force 6-digit confirmation pin verification
    showToast(`เข้าสู่ระบบสำเร็จ! กรุณายืนยันรหัส PIN 6 หลักเพื่อเริ่มใช้งาน`);
  };

  const handleQuickRegister = (username: string, pass: string, pin: string) => {
    const newUser: UserAccount = {
      id: 'user-' + Date.now(),
      username,
      passwordHash: pass,
      securityPin: pin || '123456',
      displayName: username,
      role: 'RESELLER',
      sellerKey: 'RES-' + generateHex(8).toUpperCase(),
      balanceThb: 0,
      totalDepositedThb: 0,
      totalSpentThb: 0,
      keysCreatedCount: 0,
      isVerified: true,
      status: 'ACTIVE',
      secretToken: 'sec_live_' + generateHex(32).toLowerCase(),
      createdAt: getCurrentTimestamp(),
      lastLoginAt: getCurrentTimestamp(),
      avatarColor: 'from-blue-500 to-indigo-600',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsLoggedIn(true);
    setIsPinVerified(true);
    playSuccessSound();
    showToast(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${username}`);

    // Trigger Discord Notification for New Registration
    sendDiscordNotification({
      event: 'NEW_USER',
      data: {
        username: newUser.username,
        role: newUser.role,
        sellerKey: newUser.sellerKey,
      },
      stats: {
        totalUsersCount: users.length + 1,
        totalKeysCount: keys.length,
        totalRevenueThb: transactions.filter(t => t.status === 'สำเร็จ').reduce((acc, t) => acc + t.amountThb, 0),
        recentTransactions: transactions,
      },
    }, paymentConfig).catch(() => {});
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsPinVerified(false);
    sessionStorage.removeItem('proj3ctx_pin_unlocked');
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  const handlePinVerifySuccess = () => {
    setIsPinVerified(true);
    showToast(`ยืนยันรหัส PIN สำเร็จ ปลดล็อคระบบ PROJ3CTX`);
  };

  // User Management Handlers
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      showToast('ไม่สามารถลบบัญชีผู้ใช้ที่กำลังเข้าสู่ระบบอยู่ได้');
      playErrorSound();
      return;
    }
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    playSuccessSound();
    showToast(`ลบผู้ใช้งาน ${target?.username || userId} ออกจากระบบเรียบร้อย`);
  };

  const handleAdjustUserBalance = (userId: string, newBalance: number, note: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const diff = newBalance - u.balanceThb;
          return {
            ...u,
            balanceThb: newBalance,
            totalDepositedThb: diff > 0 ? u.totalDepositedThb + diff : u.totalDepositedThb,
          };
        }
        return u;
      })
    );

    const target = users.find((u) => u.id === userId);
    if (target) {
      const adjustmentTx: TopUpTransaction = {
        id: 'tx-' + Date.now(),
        userId: target.id,
        username: target.username,
        method: 'admin_adjustment',
        amountThb: newBalance,
        reference: 'ADJ-' + Date.now().toString().slice(-6),
        status: 'สำเร็จ',
        createdAt: getCurrentTimestamp(),
        senderName: `แอดมิน (${currentUser.username})`,
        details: note || 'ปรับยอดเงินโดยผู้ดูแลระบบ',
      };
      setTransactions((prev) => [adjustmentTx, ...prev]);
    }
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleCreateUser = (newUserPartial: Partial<UserAccount>) => {
    const fullUser: UserAccount = {
      id: 'user-' + Date.now(),
      username: newUserPartial.username || 'User_' + generateHex(4),
      passwordHash: newUserPartial.passwordHash || '123456',
      securityPin: newUserPartial.securityPin || '888888',
      displayName: newUserPartial.displayName || newUserPartial.username || 'User',
      role: newUserPartial.role || 'RESELLER',
      sellerKey: 'RES-' + generateHex(8).toUpperCase(),
      balanceThb: newUserPartial.balanceThb || 0,
      totalDepositedThb: newUserPartial.balanceThb || 0,
      totalSpentThb: 0,
      keysCreatedCount: 0,
      isVerified: true,
      status: 'ACTIVE',
      secretToken: 'sec_live_' + generateHex(32).toLowerCase(),
      createdAt: getCurrentTimestamp(),
      lastLoginAt: 'ยังไม่เคยเข้าสู่ระบบ',
      avatarColor: 'from-indigo-500 to-purple-600',
    };

    setUsers((prev) => [...prev, fullUser]);
    showToast(`สร้างบัญชีผู้ใช้ ${fullUser.username} สำเร็จ`);
    playSuccessSound();

    sendDiscordNotification({
      event: 'NEW_USER',
      data: {
        username: fullUser.username,
        role: fullUser.role,
        sellerKey: fullUser.sellerKey,
      },
      stats: {
        totalUsersCount: users.length + 1,
        totalKeysCount: keys.length,
        totalRevenueThb: transactions.filter(t => t.status === 'สำเร็จ').reduce((acc, t) => acc + t.amountThb, 0),
        recentTransactions: transactions,
      },
    }, paymentConfig).catch(() => {});
  };

  // Dispense & Topup Operations
  const handleOpenDispense = (productId?: string) => {
    setDispenseInitialProductId(productId);
    setIsDispenseModalOpen(true);
  };

  const handleDispenseSuccess = (product: ProductTier, quantity: number, generatedKeys: string[]) => {
    const totalCost = product.priceThb * quantity;
    const now = getCurrentTimestamp();
    const orderNo = generateOrderId();

    // 1. Deduct balance & update current user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              balanceThb: Math.max(0, u.balanceThb - totalCost),
              totalSpentThb: u.totalSpentThb + totalCost,
              keysCreatedCount: u.keysCreatedCount + quantity,
            }
          : u
      )
    );

    // 2. Reduce product stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
      )
    );

    // 3. Add order record with user attribution
    const newOrder: OrderRecord = {
      id: 'ord-' + Date.now(),
      orderNo,
      productName: product.name,
      quantity,
      totalPriceThb: totalCost,
      keys: generatedKeys,
      status: 'สำเร็จ',
      createdAt: now,
      userId: currentUser.id,
      username: currentUser.username,
    };
    setOrders((prev) => [newOrder, ...prev]);

    // 4. Add keys with user attribution
    const newKeys: LicenseKey[] = generatedKeys.map((k, i) => ({
      id: 'key-' + Date.now() + '-' + i,
      key: k,
      planName: product.name,
      durationLabel: product.duration,
      status: 'ACTIVE',
      createdAt: now,
      expiresAt: now,
      hwid: 'NOT-BOUND-' + generateHex(4),
      hwidResetCount: 0,
      lastIp: '127.0.0.1',
      orderId: newOrder.id,
      dispensedByUserId: currentUser.id,
      dispensedByUsername: currentUser.username,
    }));
    setKeys((prev) => [...newKeys, ...prev]);

    showToast(`เบิกสำเร็จ ${quantity} คีย์ (${product.name})`);

    // Trigger Discord notification for key dispensed
    sendDiscordNotification({
      event: 'KEY_DISPENSED',
      data: {
        productName: product.name,
        quantity,
        totalPriceThb: totalCost,
        username: currentUser.username,
        keys: generatedKeys,
      },
      stats: {
        totalUsersCount: users.length,
        totalKeysCount: keys.length + quantity,
        totalRevenueThb: transactions.filter(t => t.status === 'สำเร็จ').reduce((acc, t) => acc + t.amountThb, 0),
        recentTransactions: transactions,
      },
    }, paymentConfig).catch(() => {});
  };

  const handleAddCredit = (
    amount: number,
    method: 'truemoney' | 'promptpay_slip' | 'bank_transfer',
    ref: string,
    senderName?: string
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              balanceThb: u.balanceThb + amount,
              totalDepositedThb: u.totalDepositedThb + amount,
            }
          : u
      )
    );

    const newTx: TopUpTransaction = {
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      method,
      amountThb: amount,
      reference: ref,
      status: 'สำเร็จ',
      createdAt: getCurrentTimestamp(),
      senderName,
      details: method === 'truemoney' ? 'TrueMoney Voucher Auto-Claim' : 'Slip Verification Bot Verified',
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(`เติมเครดิตเข้าบัญชี ${currentUser.username} +฿${amount.toFixed(2)} สำเร็จ!`);
  };

  const handleResetHwid = (keyId: string) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === keyId ? { ...k, hwid: 'CLEARED-' + generateHex(4), hwidResetCount: k.hwidResetCount + 1 } : k
      )
    );
    playSuccessSound();
    showToast('รีเซ็ต HWID ปลดล็อคเครื่องสำเร็จเรียบร้อย!');
  };

  const handleToggleBan = (keyId: string) => {
    setKeys((prev) =>
      prev.map((k) => {
        if (k.id === keyId) {
          const nextStatus = k.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
          showToast(`เปลี่ยนสถานะคีย์เป็น: ${nextStatus}`);
          return { ...k, status: nextStatus };
        }
        return k;
      })
    );
  };

  const handleRegenerateToken = () => {
    const newToken = 'sec_live_' + generateHex(32).toLowerCase();
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, secretToken: newToken } : u))
    );
    playSuccessSound();
    showToast('สร้างโทเค็นตัวแทนใหม่ (Regenerate Token) เรียบร้อยแล้ว');
  };

  const handleUpdatePassword = (_newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, passwordHash: _newPass } : u))
    );
    showToast('อัปเดตรหัสผ่านสำเร็จ!');
  };

  const handleUpdatePin = (newPin: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, securityPin: newPin } : u))
    );
    showToast('บันทึกรหัส PIN ยืนยันความปลอดภัย 6 หลักใหม่เรียบร้อยแล้ว');
  };

  // Header content depending on active tab
  const getHeaderProps = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Reseller Dashboard',
          subtitle: `ยินดีต้อนรับ ${currentUser.username} (${currentUser.role}) | Overview of credits & key generation`,
          primaryLabel: 'Generate Key',
        };
      case 'dispenser':
        return {
          title: 'License Key Dispenser',
          subtitle: 'Direct local stock dispenser for 1D, 7D, 15D & 30D licenses with zero delay',
          primaryLabel: 'Dispense Key',
        };
      case 'topup':
        return {
          title: 'ระบบเติมเงินเครดิตตัวแทน',
          subtitle: 'เติมเงินผ่านซอง TrueMoney และบอทเช็คสลิปอัตโนมัติ 24 ชม.',
          primaryLabel: 'Generate Key',
        };
      case 'keys':
        return {
          title: 'Created Keys & Lifecycle Suite',
          subtitle: 'ระบบจัดการ License Key, เช็คคีย์ของยูสเซอร์อื่น, รีเซ็ต HWID และระงับคีย์',
          primaryLabel: 'Generate Key',
        };
      case 'history':
        return {
          title: 'ประวัติการสั่งซื้อ License Key',
          subtitle: 'รายการคำสั่งซื้อสินค้าและประวัติ License Key แยกตามผู้ใช้งาน',
          primaryLabel: 'Generate Key',
        };
      case 'api-bot':
        return {
          title: 'REST API & Bot Webhooks',
          subtitle: 'Integrate automated high-speed stock dispensing directly into Discord & Telegram bots',
          primaryLabel: 'Generate Key',
        };
      case 'settings':
        return {
          title: 'Reseller Settings & Security',
          subtitle: 'Manage account credentials, partner key, 6-Digit PIN security and system preferences',
          primaryLabel: 'Generate Key',
        };
      case 'products_management':
        return {
          title: 'ระบบจัดการสต็อก & สินค้า (Stock & Products)',
          subtitle: 'เติมสต็อกคีย์, เพิ่มสินค้าใหม่, ใส่รูปภาพ และแก้ไขรายละเอียดสินค้าเชื่อมต่อกับหน้าร้านค้า 100%',
          primaryLabel: 'Dispense Key',
        };
      case 'users_management':
        return {
          title: 'ระบบจัดการผู้ใช้งาน & ยศ (User Management)',
          subtitle: 'ปรับยอดยูสเซอร์, แต่งตั้งยศ Super Admin / Admin / Reseller, แบนหรือปลดแบนผู้ใช้, ลบผู้ใช้',
          primaryLabel: 'Generate Key',
        };
      case 'backoffice':
        return {
          title: 'ระบบจัดการหลังบ้าน (Backoffice & Admin Panel)',
          subtitle: 'แก้ไขเลขที่บัญชีธนาคาร, เบอร์พร้อมเพย์, บอทตรวจสลิป และราคาสต็อกสินค้า',
          primaryLabel: 'Generate Key',
        };
      default:
        return {
          title: 'PROJ3CTX Reseller Dashboard',
          subtitle: 'License Key Management & Automated Payment Bots',
          primaryLabel: 'Generate Key',
        };
    }
  };

  // If not logged in, show Login Screen
  if (!isLoggedIn) {
    return (
      <LoginView
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onQuickRegister={handleQuickRegister}
      />
    );
  }

  const headerConfig = getHeaderProps();

  return (
    <div className="flex min-h-screen bg-[#0b0c16] text-slate-100 cyber-grid">
      {/* Security Confirmation PIN Modal (Shown after login or switch user until verified) */}
      {!isPinVerified && (
        <PinVerifyModal
          user={currentUser}
          onVerifySuccess={handlePinVerifySuccess}
          onCancel={() => {
            setIsLoggedIn(false);
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        totalKeysCount={keys.length}
        totalOrdersCount={orders.length}
        onCopySellerKey={() => showToast(`คัดลอก Partner Seller Key: ${currentUser.sellerKey}`)}
        onLogout={handleLogout}
        onSwitchUser={() => {
          setIsPinVerified(false);
        }}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerConfig.title}
          subtitle={headerConfig.subtitle}
          primaryActionLabel={headerConfig.primaryLabel}
          onOpenDispense={() => handleOpenDispense()}
          onRefresh={() => showToast('ซิงค์ข้อมูลล่าสุดกับเซิร์ฟเวอร์เรียบร้อย')}
        />

        <main className="flex-1 pb-16 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              products={products}
              recentOrders={orders}
              transactions={transactions}
              onOpenDispense={handleOpenDispense}
              onNavigateToApi={() => setCurrentTab('api-bot')}
              onNavigateToTopup={() => setCurrentTab('topup')}
              onNavigateToKeys={() => setCurrentTab('keys')}
            />
          )}

          {currentTab === 'dispenser' && (
            <DispenserView
              products={products}
              profile={profile}
              onSelectProduct={(p) => handleOpenDispense(p.id)}
              onOpenQuickDispense={() => handleOpenDispense()}
            />
          )}

          {currentTab === 'topup' && (
            <TopUpView
              profile={profile}
              onAddCredit={handleAddCredit}
              transactions={transactions}
              bankAccounts={bankAccounts}
              paymentConfig={paymentConfig}
              onNavigateToBackoffice={() => setCurrentTab('backoffice')}
              onUpdatePaymentConfig={(newCfg) => setPaymentConfig(newCfg)}
            />
          )}

          {currentTab === 'keys' && (
            <KeysListView
              keys={keys}
              onResetHwid={handleResetHwid}
              onToggleBan={handleToggleBan}
              onOpenDispense={() => handleOpenDispense()}
              currentUser={currentUser}
              users={users}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              orders={orders}
              onNavigateToKeys={() => setCurrentTab('keys')}
              onViewOrderDetails={(o) => setSelectedOrderDetails(o)}
              currentUser={currentUser}
              users={users}
            />
          )}

          {currentTab === 'api-bot' && (
            <ApiBotView
              profile={profile}
              products={products}
              onRegenerateToken={handleRegenerateToken}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onOpenDispense={handleOpenDispense}
              onNavigateToApi={() => setCurrentTab('api-bot')}
              onUpdatePassword={handleUpdatePassword}
              onToggle2FA={() => showToast('อัปเดตสถานะ 2-Factor Authentication เรียบร้อย')}
              onSetPin={handleUpdatePin}
            />
          )}

          {currentTab === 'products_management' && (
            <ProductsManagementView
              products={products}
              paymentConfig={paymentConfig}
              onUpdateProducts={setProducts}
              onShowToast={showToast}
              onNavigateToShop={() => setCurrentTab('dispenser')}
            />
          )}

          {currentTab === 'users_management' && (
            <UsersManagementView
              currentUser={currentUser}
              users={users}
              onUpdateUserRole={handleUpdateUserRole}
              onAdjustUserBalance={handleAdjustUserBalance}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              onCreateUser={handleCreateUser}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'backoffice' && (
            <AdminBackofficeView
              bankAccounts={bankAccounts}
              onUpdateBankAccounts={setBankAccounts}
              paymentConfig={paymentConfig}
              onUpdatePaymentConfig={setPaymentConfig}
              products={products}
              onUpdateProducts={setProducts}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Dispense Modal */}
      {isDispenseModalOpen && (
        <DispenseModal
          products={products}
          profile={profile}
          initialProductId={dispenseInitialProductId}
          onClose={() => setIsDispenseModalOpen(false)}
          onDispenseSuccess={handleDispenseSuccess}
          onNavigateToTopup={() => {
            setIsDispenseModalOpen(false);
            setCurrentTab('topup');
          }}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <OrderDetailsModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
        />
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a35] border border-indigo-500/60 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
