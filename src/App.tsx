import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Calculator as CalcIcon, 
  PlusCircle, 
  Menu, 
  X,
  PieChart,
  Database,
  WifiOff,
  AlertTriangle,
  Lock,
  LogOut,
  User,
  ShieldCheck,
  Key,
  Trash2,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { Order, OrderStatus } from './types';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import FinancialCalculator from './components/FinancialCalculator';
import FinancialReport from './components/FinancialReport';
import TrashBin from './components/TrashBin';
import AdminUzman from './components/AdminUzman';
import { calculateOrderValues } from './utils/financial';
import { api, setTenantOverride } from './services/api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'calc' | 'reports' | 'trash' | 'users'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('rol_dark_mode');
    return saved === 'true';
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState<string | null>(null);
  
  // AUTH STATES
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // ROUTING LOGIC
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/AdminUzman' && user?.role === 'super_admin') {
      setActiveTab('users');
    }
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rol_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  // OTURUM KONTROLÜ (Sayfa Yenilendiğinde)
  useEffect(() => {
    const initApp = async () => {
        // DB Bilgisini çek
        try {
            const info = await api.getDbInfo();
            setDbInfo(info);
        } catch (e) {
            console.error("DB Info fetch failed");
        }

        const storedUser = localStorage.getItem('rol_user_session');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Stale session fix: silverciva must always be super_admin and tenantId 9999
                const lowerName = parsedUser.username?.toLowerCase();
                if (lowerName === 'silverciva' || parsedUser.username === 'SİLVERCİVA') {
                    parsedUser.role = 'super_admin';
                    parsedUser.tenantId = 9999;
                    localStorage.setItem('rol_user_session', JSON.stringify(parsedUser));
                }
                console.log('App Init User:', parsedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
                setShowLogin(false);
                if (parsedUser.role === 'super_admin') {
                    setActiveTab('users');
                }
            } catch (e) {
                localStorage.removeItem('rol_user_session');
            }
        }
    };
    initApp();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setTenantOverride(selectedTenantId);
      const data = await api.getOrders();
      const enrichedOrders = data.map((order: Order) => ({
        ...order,
        calculatedValues: calculateOrderValues(
          order.buyPrice, order.quantity, order.logisticsCost,
          order.localShipping, order.profitMargin, order.deposit, order.commissionRate
        )
      }));
      setOrders(enrichedOrders);
      setDbStatus('connected');
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        setIsAuthenticated(false);
        setShowLogin(true);
        localStorage.removeItem('rol_user_session');
      }
      setDbStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated, fetchOrders, selectedTenantId]);

  const handleViewTenant = (tenantId: number, fullName: string) => {
    setSelectedTenantId(tenantId);
    setSelectedTenantName(fullName);
    setActiveTab('dashboard');
  };

  const handleExitView = () => {
    setSelectedTenantId(null);
    setSelectedTenantName(null);
    setTenantOverride(null);
  };

  // SİLİNMİŞ VE AKTİF SİPARİŞLERİ AYIR
  const activeOrders = useMemo(() => orders.filter(o => !o.isDeleted), [orders]);
  const deletedOrders = useMemo(() => orders.filter(o => o.isDeleted), [orders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.login(loginData.username, loginData.password);
      if (res.success) {
        console.log('Login Success Response:', res.user);
        // Stale session fix: silverciva must always be super_admin and tenantId 9999
        const lowerName = res.user.username?.toLowerCase();
        if (lowerName === 'silverciva' || res.user.username === 'SİLVERCİVA') {
            res.user.role = 'super_admin';
            res.user.tenantId = 9999;
        }
        setUser(res.user);
        setIsAuthenticated(true);
        setShowLogin(false);
        if (res.user.role === 'super_admin') {
            setActiveTab('users');
        }
        // Oturumu Kaydet
        localStorage.setItem('rol_user_session', JSON.stringify(res.user));
        
        if (res.user.mustChangePassword) {
          setShowPasswordModal(true);
        }
      }
    } catch (error: any) {
      const msg = error.details ? `${error.message} (${error.details})` : error.message;
      setLoginError(msg);
    }
  };

  const handleUpdatePassword = async () => {
      if (newPassword.length < 5) return alert("Şifre en az 5 karakter olmalıdır.");
      try {
          await api.updatePassword(newPassword, user.id);
          setShowPasswordModal(false);
          setNewPassword('');
          alert("Şifreniz başarıyla güncellendi.");
      } catch (e) {
          alert("Bir hata oluştu.");
      }
  };

  const handleLogout = async () => {
      await api.logout();
      localStorage.removeItem('rol_user_session');
      setIsAuthenticated(false);
      setShowLogin(true);
      setUser(null);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsCalculatorMode(false);
    setActiveTab('calc');
  };

  const handleSaveOrder = async (order: Order) => {
    try {
      setLoading(true);
      if (editingOrder) {
        await api.updateOrder(order);
      } else {
        await api.createOrder(order);
      }
      setEditingOrder(null);
      await fetchOrders();
      setActiveTab('orders');
    } catch (e) {
      console.error(e);
      alert('İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    try {
      await api.updateStatus(id, status);
      await fetchOrders(); 
    } catch (error) {
      console.error("Status update failed", error);
      alert("Durum güncellenemedi.");
    }
  };

  const handleCompleteOrder = async (order: Order, markAsPaid: boolean = false, customDeposit?: number) => {
    try {
      setLoading(true);
      const updatedOrder = { ...order };
      updatedOrder.status = OrderStatus.DELIVERED;
      
      if (markAsPaid) {
        updatedOrder.deposit = order.calculatedValues.totalSalePrice;
      } else if (customDeposit !== undefined) {
        updatedOrder.deposit = customDeposit;
      }

      await api.updateOrder(updatedOrder);
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert('Sipariş tamamlanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
        await api.deleteOrder(id);
        await fetchOrders();
    } catch (e) {
        alert("Silme işlemi başarısız.");
    }
  };

  const handleRestoreOrder = async (id: string) => {
    try {
        await api.restoreOrder(id);
        await fetchOrders();
    } catch (e) {
        alert("Geri yükleme başarısız.");
    }
  };

  const handleHardDeleteOrder = async (id: string) => {
      try {
          await api.hardDeleteOrder(id);
          await fetchOrders();
      } catch (e) {
          alert("Kalıcı silme başarısız.");
      }
  };

  if (showLogin) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-900'}`}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in-95 duration-500 border border-transparent dark:border-slate-800">
          <div className="text-center">
            <div className="w-full flex justify-center mb-6 relative">
                <img 
                    src="https://tapports.com/wp-content/uploads/2019/10/azazaz.png" 
                    alt="Tapports Logo" 
                    className={`h-20 object-contain ${isDarkMode ? 'brightness-110' : ''}`}
                />
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="absolute right-0 top-0 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:scale-110 transition-all"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">TAPPORTS</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Güvenli Ticaret Köprüsü</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all font-medium dark:text-white"
                  placeholder="admin"
                  value={loginData.username}
                  onChange={e => setLoginData({...loginData, username: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all font-medium dark:text-white"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                />
              </div>
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 dark:border-red-900/30 animate-bounce">
                <AlertTriangle className="w-4 h-4" />
                {loginError}
              </div>
            )}

            <div className="flex justify-center">
                <button 
                    type="button"
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/test-connection');
                            const data = await res.json();
                            alert('API Durumu: ' + (data.success ? '✅ ÇALIŞIYOR' : '❌ HATA') + '\nMesaj: ' + data.message);
                        } catch (e) {
                            alert('API Bağlantı Hatası: Sunucuya ulaşılamıyor. (Hostinger ayarlarını kontrol edin)');
                        }
                    }}
                    className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors uppercase font-bold tracking-widest"
                >
                    API Bağlantısını Test Et
                </button>
            </div>

            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-95">
              Sisteme Giriş Yap
            </button>
          </form>

          {dbInfo && (
            <div className="flex items-center justify-center gap-2 py-2">
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${dbStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {dbStatus === 'connected' ? 'Bağlantı Aktif' : 'Bağlantı Yok'}
                </span>
            </div>
          )}
          
          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
             <p className="text-[11px] text-slate-400">
                2025 © Tasarım ve Kodlama&nbsp;
                <a href="https://uzmandizayn.com.tr/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 font-bold transition-colors">
                    Uzman Dizayn Dijital Ajans
                </a>
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Şifre Değiştirme Modalı */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl space-y-6 relative border border-transparent dark:border-slate-800">
                  <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                      <X className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Şifre Güncelleme</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Hesap güvenliğiniz için yeni bir şifre belirleyin.</p>
                  </div>
                  <input 
                    type="password"
                    placeholder="Yeni Güçlü Şifre"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button onClick={handleUpdatePassword} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-colors">
                    Şifreyi Güncelle
                  </button>
              </div>
          </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <img 
                src="https://tapports.com/wp-content/uploads/2019/10/azazaz.png" 
                alt="Logo" 
                className={`w-10 h-10 object-contain ${isDarkMode ? 'brightness-110' : ''}`}
              />
              <div>
                <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">TAPPORTS</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Siparişler', icon: Package },
              { id: 'calc', label: 'Hesap Motoru', icon: CalcIcon },
              { id: 'reports', label: 'Raporlar', icon: PieChart },
              { id: 'trash', label: 'Geri Dönüşüm', icon: Trash2 },
              ...(user?.role === 'super_admin' ? [{ id: 'users', label: 'Kullanıcı Yönetimi', icon: ShieldCheck }] : []),
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-100 dark:shadow-none' 
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.id === 'trash' && deletedOrders.length > 0 && (
                    <span className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{deletedOrders.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-6 mt-auto space-y-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                       {user?.username?.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-1 min-w-0">
                       <p className="text-xs font-black text-slate-800 dark:text-white truncate">{user?.fullName || 'Yönetici'}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">@{user?.username}</p>
                   </div>
                   <div className="flex flex-col gap-1">
                       <button 
                           onClick={() => setShowPasswordModal(true)} 
                           className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                           title="Şifre Değiştir"
                       >
                           <Key className="w-4 h-4" />
                       </button>
                       <button 
                           onClick={handleLogout} 
                           className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                           title="Çıkış Yap"
                       >
                           <LogOut className="w-4 h-4" />
                       </button>
                   </div>
                </div>
             </div>
             
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
             >
                <div className="flex items-center gap-2">
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
                    <span>{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-0.5' : 'left-0.5'}`} />
                </div>
             </button>

             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase ${
                 dbStatus === 'connected' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
             }`}>
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                {dbStatus === 'connected' ? 'Bağlantı Aktif' : 'Bağlantı Yok'}
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500 dark:text-slate-400" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
            <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{activeTab}</h1>
                {selectedTenantName && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <ShieldCheck className="w-3 h-3" />
                        Görüntülenen: {selectedTenantName}
                        <button onClick={handleExitView} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
          </div>
          <button 
            onClick={() => { setEditingOrder(null); setIsCalculatorMode(false); setActiveTab('calc'); }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Hızlı Kayıt
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
           <div className="flex-1">
               {activeTab === 'dashboard' && <Dashboard orders={activeOrders} onNavigate={(tab: string) => setActiveTab(tab as any)} />}
               {activeTab === 'orders' && (
                 <OrderList 
                   orders={activeOrders} 
                   onUpdateStatus={handleStatusUpdate} 
                   onEditOrder={handleEditOrder} 
                   onDeleteOrder={handleDeleteOrder} 
                   onCompleteOrder={handleCompleteOrder} 
                 />
               )}
               {activeTab === 'calc' && (
                 <FinancialCalculator 
                   onOrderComplete={handleSaveOrder} 
                   initialData={editingOrder} 
                   isCalculatorMode={isCalculatorMode} 
                 />
               )}
               {activeTab === 'reports' && <FinancialReport orders={activeOrders} />}
               {activeTab === 'trash' && (
                   <TrashBin 
                     orders={deletedOrders} 
                     onRestore={handleRestoreOrder} 
                     onHardDelete={handleHardDeleteOrder} 
                   />
               )}
               {activeTab === 'users' && user?.role === 'super_admin' && (
                 <AdminUzman onViewTenant={handleViewTenant} />
               )}
           </div>
           
           <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    2025 © Tasarım ve Kodlama&nbsp;
                    <a href="https://uzmandizayn.com.tr/" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors">
                        Uzman Dizayn Dijital Ajans
                    </a>
                </p>
           </footer>
        </div>
      </main>
    </div>
  );
};

export default App;