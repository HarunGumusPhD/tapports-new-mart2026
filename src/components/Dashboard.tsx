
import React, { useMemo } from 'react';
import { Order, ProcessStatus, OrderStatus } from '../types';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Package, 
  Hourglass, 
  FileSearch, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  orders: Order[];
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<Props> = ({ orders, onNavigate }) => {
  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { 
        confirmedRevenue: 0, 
        confirmedProfit: 0, 
        activeShipments: 0,
        quoteCount: 0,
        approvalCount: 0,
        potentialRevenue: 0
      };
    }

    // Siparişleşmiş (Kesin) Veriler
    const confirmed = orders.filter(o => !o.processStatus || o.processStatus === ProcessStatus.ORDER);
    const confirmedRevenue = confirmed.reduce((sum, o) => sum + (o?.calculatedValues?.totalSalePrice || 0), 0);
    const confirmedProfit = confirmed.reduce((sum, o) => sum + (o?.calculatedValues?.profit || 0), 0);
    const confirmedCollected = confirmed.reduce((sum, o) => sum + (o?.deposit || 0), 0);
    const confirmedBalance = confirmed.reduce((sum, o) => sum + (o?.calculatedValues?.balanceDue || 0), 0);
    
    // Aktif Sevkiyat Sayısı (Siparişleşmiş ve Teslim Edilmemiş)
    const activeShipments = confirmed.filter(o => o.status !== OrderStatus.DELIVERED).length;

    // Hazırlık Süreci (Pipeline) Verileri
    const pipeline = orders.filter(o => o.processStatus === ProcessStatus.QUOTE || o.processStatus === ProcessStatus.APPROVAL);
    const quoteCount = orders.filter(o => o.processStatus === ProcessStatus.QUOTE).length;
    const approvalCount = orders.filter(o => o.processStatus === ProcessStatus.APPROVAL).length;
    const potentialRevenue = pipeline.reduce((sum, o) => sum + (o?.calculatedValues?.totalSalePrice || 0), 0);

    return {
      confirmedRevenue,
      confirmedProfit,
      confirmedCollected,
      confirmedBalance,
      activeShipments,
      quoteCount,
      approvalCount,
      potentialRevenue
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const statusGroups = [
      { name: 'Satın Alınacak', count: 0 },
      { name: 'Satın Alındı', count: 0 },
      { name: 'Gönderildi', count: 0 },
      { name: 'Yurtiçi Kargo', count: 0 },
      { name: 'Teslim Edildi', count: 0 },
      { name: 'İptal', count: 0 },
    ];

    // Sadece siparişleşmiş olanların lojistik dağılımını göster
    orders.filter(o => !o.processStatus || o.processStatus === ProcessStatus.ORDER).forEach(o => {
      if (o && o.status) {
        const g = statusGroups.find(sg => sg.name === o.status);
        if (g) g.count++;
      }
    });

    return statusGroups;
  }, [orders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Ana Finansal KPI'lar (Kesinleşmiş) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard 
          title="GERÇEKLEŞEN CİRO" 
          value={`$${stats.confirmedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={Wallet} 
          color="blue"
          subtitle="Siparişleşmiş Toplam Satış"
        />
        <StatCard 
          title="NET KÂR" 
          value={`$${stats.confirmedProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          color="emerald"
          subtitle="Kesinleşmiş Net Kazanç"
        />
        <StatCard 
          title="TAHSİL EDİLEN" 
          value={`$${(stats.confirmedCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={CheckCircle2} 
          color="indigo"
          subtitle="Toplam Alınan Ödemeler"
        />
        <StatCard 
          title="KALAN ALACAK" 
          value={`$${(stats.confirmedBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          color="orange"
          subtitle="Bekleyen Toplam Tahsilat"
        />
        <StatCard 
          title="AKTİF SEVKİYAT" 
          value={stats.activeShipments.toString()} 
          icon={Package} 
          color="slate"
          subtitle="Yoldaki Toplam Siparişler"
        />
      </div>

      {/* Hazırlık Süreci (Pipeline) Bölümü */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800/30 rounded-bl-full -mr-20 -mt-20 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Hazırlık Süreci (Pipeline)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Teklif ve Onay Aşamasındaki Potansiyel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teklif Aşamasında</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.quoteCount}</span>
                <span className="text-xs text-slate-400 font-bold">ADET</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-pink-600 font-bold">
                <FileSearch className="w-3 h-3" />
                DÖNÜŞÜM BEKLİYOR
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onay Bekleyen</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-500">{stats.approvalCount}</span>
                <span className="text-xs text-slate-400 font-bold">ADET</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                MÜŞTERİ ONAYI
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">POTANSİYEL CİRO HACMİ</p>
               <div className="flex items-center justify-between">
                 <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                    <span className="text-xs font-bold">$</span>
                    <span className="text-4xl font-black">{stats.potentialRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                 </div>
                 <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm">
                    <DollarSign className="w-6 h-6 text-indigo-500" />
                 </div>
               </div>
               <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 italic font-medium">* Teklif ve Onay süreci toplamı</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Grafikler ve Özet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ürün Durumu Dağılımı (Siparişleşen İşler)</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Gerçek Veri</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b', fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                   itemStyle={{ color: '#1e293b' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#f59e0b', '#f97316', '#10b981'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-900/50 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-6">Sistem Notları</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Maliyet Modeli</p>
                <p className="text-sm font-medium">Kâr, (Ürün + Lojistik + Kargo) toplam maliyeti üzerinden hesaplanır.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Döviz Birimi</p>
                <p className="text-sm font-medium">Tüm finansal veriler USD cinsindendir.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate && onNavigate('reports')}
            className="w-full py-4 mt-8 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Detaylı Finans Raporu
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
    slate: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800',
  };

  const iconColors: any = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    indigo: 'bg-indigo-600',
    orange: 'bg-orange-600',
    slate: 'bg-slate-600',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${colors[color]}`}>
          GERÇEK VERİ
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

export default Dashboard;
