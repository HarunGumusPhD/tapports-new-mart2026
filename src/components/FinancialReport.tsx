
import React, { useState, useMemo } from 'react';
import { Order, ProcessStatus } from '../types';
import { 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieChartIcon,
  Activity,
  Hourglass,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Props {
  orders: Order[];
}

type TimeRange = 'week' | 'month' | 'year';

const FinancialReport: React.FC<Props> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Filtreleme Mantığı
  const { confirmedOrders, pipelineOrders } = useMemo(() => {
    const now = new Date();
    
    // Hafta Başlangıcı Pazartesi Ayarı
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); // Pazar: 0, Pzt: 1...
    // Pazartesi'ye gitmek için: Eğer bugün Pazarsa (0) 6 gün geri, değilse (day-1) gün geri.
    const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.date);
      if (timeRange === 'week') return orderDate >= startOfWeek;
      if (timeRange === 'month') return orderDate >= startOfMonth;
      if (timeRange === 'year') return orderDate >= startOfYear;
      return true;
    });

    const confirmed = filtered.filter(o => !o.processStatus || o.processStatus === ProcessStatus.ORDER);
    const pipeline = filtered.filter(o => o.processStatus === ProcessStatus.QUOTE || o.processStatus === ProcessStatus.APPROVAL);

    return { confirmedOrders: confirmed, pipelineOrders: pipeline };
  }, [orders, timeRange]);

  // Özet İstatistikler
  const stats = useMemo(() => {
    return confirmedOrders.reduce((acc, order) => ({
      revenue: acc.revenue + (order.calculatedValues?.totalSalePrice || 0),
      profit: acc.profit + (order.calculatedValues?.profit || 0),
      cost: acc.cost + (order.calculatedValues?.unitCost || 0),
      collected: acc.collected + (order.deposit || 0),
      balanceDue: acc.balanceDue + (order.calculatedValues?.balanceDue || 0),
      count: acc.count + 1
    }), { revenue: 0, profit: 0, cost: 0, collected: 0, balanceDue: 0, count: 0 });
  }, [confirmedOrders]);

  const pipelineStats = useMemo(() => {
      return pipelineOrders.reduce((acc, order) => ({
          potentialRevenue: acc.potentialRevenue + (order.calculatedValues?.totalSalePrice || 0),
          count: acc.count + 1,
          quoteCount: acc.quoteCount + (order.processStatus === ProcessStatus.QUOTE ? 1 : 0),
          approvalCount: acc.approvalCount + (order.processStatus === ProcessStatus.APPROVAL ? 1 : 0)
      }), { potentialRevenue: 0, count: 0, quoteCount: 0, approvalCount: 0 });
  }, [pipelineOrders]);

  const chartData = useMemo(() => {
    const grouped: any = {};
    confirmedOrders.forEach(order => {
      const date = order.date;
      if (!grouped[date]) {
        grouped[date] = { date, ciro: 0, kar: 0, maliyet: 0 };
      }
      grouped[date].ciro += order.calculatedValues?.totalSalePrice || 0;
      grouped[date].kar += order.calculatedValues?.profit || 0;
      grouped[date].maliyet += order.calculatedValues?.unitCost || 0;
    });
    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [confirmedOrders]);

  const pieData = useMemo(() => {
    const totalLogistics = confirmedOrders.reduce((sum, o) => sum + (o.logisticsCost || 0) + (o.localShipping || 0), 0);
    const totalProduct = confirmedOrders.reduce((sum, o) => sum + ((o.buyPrice * o.quantity) || 0), 0);
    const totalCommission = confirmedOrders.reduce((sum, o) => sum + (o.calculatedValues?.commissionAmount || 0), 0);
    
    return [
      { name: 'Ürün Maliyeti', value: totalProduct, color: '#3b82f6' },
      { name: 'Lojistik', value: totalLogistics, color: '#f59e0b' },
      { name: 'Komisyon', value: totalCommission, color: '#ec4899' },
    ].filter(i => i.value > 0);
  }, [confirmedOrders]);

  const exportReport = () => {
    let title = "";
    switch(timeRange) {
      case 'week': title = "HAFTALIK"; break;
      case 'month': title = "AYLIK"; break;
      case 'year': title = "YILLIK"; break;
    }

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #1e293b; color: white; border: 1px solid #333; padding: 10px; }
          td { border: 1px solid #ccc; padding: 8px; }
          .header { font-size: 18px; font-weight: bold; background-color: #f1f5f9; }
          .total-row { background-color: #cbd5e1; font-weight: bold; }
          .num { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="9" class="header" align="center">ROL SCM - ${title} FİNANSAL RAPOR</td></tr>
          <tr><td colspan="9" align="center">Rapor Tarihi: ${new Date().toLocaleDateString()}</td></tr>
          <tr></tr>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Fatura No</th>
              <th>Müşteri</th>
              <th>Satış Fiyatı (USD)</th>
              <th>Tahsil Edilen (USD)</th>
              <th>Kalan Alacak (USD)</th>
              <th>Toplam Maliyet (USD)</th>
              <th>Net Kâr (USD)</th>
              <th>Kâr Marjı (%)</th>
              <th>Lojistik (USD)</th>
              <th>Ürün Durumu</th>
            </tr>
          </thead>
          <tbody>
    `;

    confirmedOrders.forEach(o => {
      const vals = o.calculatedValues;
      // Mark-up oranı (Kâr / Maliyet)
      const markup = vals.unitCost > 0 ? (vals.profit / vals.unitCost) * 100 : 0;
      
      tableHtml += `
        <tr>
          <td>${o.date}</td>
          <td>${o.invoiceNo}</td>
          <td>${o.customerName}</td>
          <td class="num">${vals.totalSalePrice}</td>
          <td class="num">${o.deposit}</td>
          <td class="num">${vals.balanceDue}</td>
          <td class="num">${vals.unitCost}</td>
          <td class="num">${vals.profit}</td>
          <td class="num">%${markup.toFixed(2)}</td>
          <td class="num">${(o.logisticsCost + o.localShipping)}</td>
          <td>${o.status}</td>
        </tr>
      `;
    });

    tableHtml += `
        <tr class="total-row">
          <td colspan="3" align="right">GENEL TOPLAM</td>
          <td class="num">${stats.revenue}</td>
          <td class="num">${stats.collected}</td>
          <td class="num">${stats.balanceDue}</td>
          <td class="num">${stats.cost}</td>
          <td class="num">${stats.profit}</td>
          <td>-</td>
          <td colspan="2"></td>
        </tr>
      </tbody></table></body></html>
    `;

    const blob = new Blob(['\ufeff', tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ROL_SCM_${title}_RAPOR_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                timeRange === range 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {range === 'week' && 'Bu Hafta'}
              {range === 'month' && 'Bu Ay'}
              {range === 'year' && 'Bu Yıl'}
            </button>
          ))}
        </div>
        
        <button 
          onClick={exportReport}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Excel Raporu İndir
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-100 dark:shadow-none">
          <div className="flex justify-between items-start mb-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-blue-100 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">CİRO</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-1">${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <p className="text-blue-100 text-[10px] opacity-80">{stats.count} Onaylı Sipariş</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-3xl text-white shadow-lg shadow-emerald-100 dark:shadow-none">
          <div className="flex justify-between items-start mb-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-emerald-100 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">NET KÂR</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-1">+${stats.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <p className="text-emerald-100 text-[10px] opacity-80">Ort. %{stats.cost > 0 ? ((stats.profit / stats.cost) * 100).toFixed(1) : 0} Marj</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-100 dark:shadow-none">
          <div className="flex justify-between items-start mb-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-indigo-100 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">TAHSİL EDİLEN</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-1">${stats.collected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <p className="text-indigo-100 text-[10px] opacity-80">Toplam Ödemeler</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-3xl text-white shadow-lg shadow-orange-100 dark:shadow-none">
          <div className="flex justify-between items-start mb-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-orange-100 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">KALAN ALACAK</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-1">${stats.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <p className="text-orange-100 text-[10px] opacity-80">Bekleyen Tahsilat</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-8 -mt-8 z-0"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Hourglass className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Pipeline</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">Teklif</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{pipelineStats.quoteCount}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">Onay</p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-500">{pipelineStats.approvalCount}</p>
                    </div>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 relative z-10">
                 <div className="flex justify-between items-center">
                     <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">Potansiyel</span>
                     <span className="text-xs font-bold text-slate-800 dark:text-white">${pipelineStats.potentialRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                 </div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Finansal Hareket Trendi (Siparişleşen)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="ciro" stackId="1" stroke="#3b82f6" fill="url(#colorCiro)" strokeWidth={3} name="Ciro" />
                <Area type="monotone" dataKey="kar" stackId="2" stroke="#10b981" fill="url(#colorKar)" strokeWidth={3} name="Net Kâr" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            Maliyet Dağılımı
          </h3>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                 <p className="text-xs text-slate-400 dark:text-slate-500">Toplam Gider</p>
                 <p className="text-lg font-bold text-slate-800 dark:text-white">${stats.cost.toLocaleString('en-US', {compactDisplay: "short", notation: "compact"})}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Table */}
      {pipelineOrders.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <Hourglass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Bekleyen İşlemler (Teklif & Onay Süreci)
                </h3>
                <span className="text-xs font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {pipelineOrders.length} Kayıt
                </span>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left">
                     <thead>
                         <tr className="bg-indigo-100/50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                             <th className="px-6 py-3">Tarih</th>
                             <th className="px-6 py-3">Müşteri</th>
                             <th className="px-6 py-3">Ürün</th>
                             <th className="px-6 py-3">Potansiyel Ciro</th>
                             <th className="px-6 py-3">Durum</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-indigo-100 dark:divide-indigo-900/30 text-sm">
                         {pipelineOrders.map(order => (
                             <tr key={order.id} className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                                 <td className="px-6 py-3 text-indigo-900/70 dark:text-indigo-300/70">{order.date}</td>
                                 <td className="px-6 py-3 font-medium text-indigo-900 dark:text-indigo-200">{order.customerName}</td>
                                 <td className="px-6 py-3 text-indigo-900/80 dark:text-indigo-300/80">{order.productModel} (x{order.quantity})</td>
                                 <td className="px-6 py-3 font-bold text-indigo-700 dark:text-indigo-400">${order.calculatedValues.totalSalePrice.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                                 <td className="px-6 py-3">
                                     {order.processStatus === ProcessStatus.QUOTE ? (
                                         <span className="px-2 py-1 rounded text-[10px] font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800 uppercase">TEKLİF</span>
                                     ) : (
                                         <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase">ONAY BEKLENİYOR</span>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Siparişleşen İşler Detayı
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Sipariş / Fatura</th>
                <th className="px-6 py-4">Ciro</th>
                <th className="px-6 py-4">Tahsil Edilen</th>
                <th className="px-6 py-4">Kalan Alacak</th>
                <th className="px-6 py-4">Net Kâr</th>
                <th className="px-6 py-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {confirmedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Bu dönem için kesinleşmiş sipariş bulunamadı.</td>
                </tr>
              ) : (
                confirmedOrders.map((order) => {
                   return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{order.date}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{order.customerName}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">#{order.invoiceNo}</div>
                      </td>
                      <td className="px-6 py-4 font-medium dark:text-slate-200">${order.calculatedValues.totalSalePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">${order.deposit.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400">${order.calculatedValues.balanceDue.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-500">+${order.calculatedValues.profit.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                   );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
