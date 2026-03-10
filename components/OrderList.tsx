import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, ProcessStatus } from '../types';
import { Search, Filter, FileSpreadsheet, Trash2, Edit2, AlertCircle, Store, CheckCircle, Clock, X, Calendar, DollarSign, Users, Truck } from 'lucide-react';

interface Props {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onCompleteOrder: (order: Order) => void;
}

interface FilterState {
    searchTerm: string;
    startDate: string;
    endDate: string;
    minPrice: string;
    maxPrice: string;
    status: string;
    processStatus: string;
    showFilters: boolean;
}

const OrderList: React.FC<Props> = ({ orders, onUpdateStatus, onEditOrder, onDeleteOrder, onCompleteOrder }) => {
  // Filtre durumunu LocalStorage'dan başlat
  const [filters, setFilters] = useState<FilterState>(() => {
      const saved = localStorage.getItem('rol_scm_filters');
      return saved ? JSON.parse(saved) : {
          searchTerm: '',
          startDate: '',
          endDate: '',
          minPrice: '',
          maxPrice: '',
          status: '',
          processStatus: '',
          showFilters: false
      };
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtreler değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
      localStorage.setItem('rol_scm_filters', JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
      const resetState = {
          searchTerm: '',
          startDate: '',
          endDate: '',
          minPrice: '',
          maxPrice: '',
          status: '',
          processStatus: '',
          showFilters: true // Filtre paneli açık kalsın
      };
      setFilters(resetState);
  };

  // FİLTRELEME MANTIĞI
  const filteredOrders = useMemo(() => {
      return orders.filter(o => {
          if (!o || !o.customerName) return false;

          // 1. Metin Arama (Müşteri, Tedarikçi, Model, Fatura)
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesText = 
            filters.searchTerm === '' ||
            o.customerName.toLowerCase().includes(searchLower) ||
            o.productModel.toLowerCase().includes(searchLower) ||
            o.invoiceNo.toLowerCase().includes(searchLower) ||
            (o.supplier && o.supplier.toLowerCase().includes(searchLower));

          // 2. Tarih Aralığı
          let matchesDate = true;
          if (filters.startDate) matchesDate = matchesDate && new Date(o.date) >= new Date(filters.startDate);
          if (filters.endDate) matchesDate = matchesDate && new Date(o.date) <= new Date(filters.endDate);

          // 3. Finansal Aralık (Satış Fiyatı)
          let matchesPrice = true;
          const price = o.calculatedValues?.totalSalePrice || 0;
          if (filters.minPrice) matchesPrice = matchesPrice && price >= Number(filters.minPrice);
          if (filters.maxPrice) matchesPrice = matchesPrice && price <= Number(filters.maxPrice);

          // 4. Durum Filtresi
          let matchesStatus = true;
          if (filters.status) matchesStatus = o.status === filters.status;

          // 5. Süreç Durumu Filtresi
          let matchesProcess = true;
          if (filters.processStatus) matchesProcess = o.processStatus === filters.processStatus;

          return matchesText && matchesDate && matchesPrice && matchesStatus && matchesProcess;
      });
  }, [orders, filters]);

  const getRowStyle = (status: string) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return 'bg-emerald-50/70 hover:bg-emerald-100/80 border-l-4 border-l-emerald-500';
      case OrderStatus.AIR_TRANSIT:
      case OrderStatus.TR_CUSTOMS:
        return 'bg-blue-50/70 hover:bg-blue-100/80 border-l-4 border-l-blue-500';
      case OrderStatus.LOCAL_CARGO:
        return 'bg-orange-50/70 hover:bg-orange-100/80 border-l-4 border-l-orange-500';
      default:
        return 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent';
    }
  };

  const getProcessStatusBadge = (status: ProcessStatus) => {
      switch (status) {
          case ProcessStatus.QUOTE:
              return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200 uppercase tracking-wide">TEKLİF</span>;
          case ProcessStatus.APPROVAL:
              return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">ONAY BEKLENİYOR</span>;
          default:
              return null;
      }
  };

  const exportToExcel = () => {
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px; text-align: center; }
          td { border: 1px solid #000000; padding: 8px; }
          .num-format { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
          .pct-format { mso-number-format:"0%"; }
          .text-format { mso-number-format:"\\@"; }
          .date-format { mso-number-format:"dd\\.mm\\.yyyy"; }
        </style>
      </head>
      <body>
        <h3>ROL SCM MASTER DATA EXPORT</h3>
        <table>
          <thead>
            <tr>
              <th>TARIH</th>
              <th>TAHMINI_TESLIM</th>
              <th>SUREC_DURUMU</th>
              <th>MUSTERI</th>
              <th>TEDARIKCI</th>
              <th>URUN_MODELI</th>
              <th>ADET</th>
              <th>FATURA_NO</th>
              <th>BIRIM_ALIS_USD</th>
              <th>KOMISYON_ORANI</th>
              <th>LOJISTIK_USD</th>
              <th>KARGO_USD</th>
              <th>KAR_MARJI (MARKUP)</th>
              <th>TAHSIL_EDILEN_USD</th>
              <th>TOPLAM_MALIYET_USD</th>
              <th>SATIS_FIYATI_USD</th>
              <th>NET_KAR_USD</th>
              <th>LOJISTIK_DURUMU</th>
              <th>KALAN_ALACAK_USD</th>
              <th>ACIKLAMA</th>
              <th>RESIM_URLLERI</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredOrders.forEach(o => {
      const imagesString = o.images && o.images.length > 0 ? o.images.join(', ') : '';

      tableHtml += `
        <tr>
          <td class="date-format">${o.date}</td>
          <td class="date-format">${o.estimatedDeliveryDate || '-'}</td>
          <td class="text-format">${o.processStatus || 'Siparişleşti'}</td>
          <td class="text-format">${o.customerName}</td>
          <td class="text-format">${o.supplier || '-'}</td>
          <td class="text-format">${o.productModel}</td>
          <td class="text-format">${o.quantity || 1}</td>
          <td class="text-format">${o.invoiceNo}</td>
          <td class="num-format">${o.buyPrice}</td>
          <td class="pct-format">${o.commissionRate}</td>
          <td class="num-format">${o.logisticsCost}</td>
          <td class="num-format">${o.localShipping}</td>
          <td class="pct-format">${o.profitMargin}</td>
          <td class="num-format">${o.deposit}</td>
          <td class="num-format">${(o.calculatedValues?.unitCost || 0)}</td>
          <td class="num-format">${(o.calculatedValues?.totalSalePrice || 0)}</td>
          <td class="num-format">${(o.calculatedValues?.profit || 0)}</td>
          <td class="text-format">${o.status}</td>
          <td class="num-format">${(o.calculatedValues?.balanceDue || 0)}</td>
          <td class="text-format">${o.description || '-'}</td>
          <td class="text-format">${imagesString}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table></body></html>`;

    const blob = new Blob(['\ufeff', tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ROL_SCM_Excel_Master_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteOrder(id);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const showConfirmBubble = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleCompleteClick = (e: React.MouseEvent, order: Order) => {
      e.stopPropagation();
      const balance = order.calculatedValues?.balanceDue || 0;
      let message = "Siparişi kapatmak ve 'Teslim Edildi' olarak işaretlemek istiyor musunuz?";
      if (balance > 0) {
          message = `Siparişin henüz tahsil edilmemiş $${balance.toLocaleString('en-US')} bakiyesi bulunuyor.\n\n"Tamam" derseniz bu tutarın tahsil edildiği varsayılacak ve sipariş kapatılacaktır.`;
      }
      if (window.confirm(message)) {
          onCompleteOrder(order);
      }
  };

  return (
    <div className="space-y-6">
      {/* ÜST BAR VE ARAMA */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Müşteri, Tedarikçi, Ürün veya Fatura No ara..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all text-sm font-medium shadow-sm dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => updateFilter('showFilters', !filters.showFilters)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border shadow-sm ${
                filters.showFilters 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filters.showFilters ? 'Filtreleri Gizle' : 'Gelişmiş Filtre'}
          </button>
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Aktar
          </button>
        </div>
      </div>

      {/* DETAYLI FİLTRE PANELİ */}
      {filters.showFilters && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-500" />
                      Filtreleme Seçenekleri
                  </h3>
                  <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Temizle
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tarih Filtresi */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Tarih Aralığı
                      </label>
                      <div className="flex items-center gap-2">
                          <input 
                              type="date" 
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none dark:text-white"
                              value={filters.startDate}
                              onChange={(e) => updateFilter('startDate', e.target.value)}
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                              type="date" 
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none dark:text-white"
                              value={filters.endDate}
                              onChange={(e) => updateFilter('endDate', e.target.value)}
                          />
                      </div>
                  </div>

                  {/* Tutar Filtresi */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Satış Tutarı (USD)
                      </label>
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              placeholder="Min"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none dark:text-white"
                              value={filters.minPrice}
                              onChange={(e) => updateFilter('minPrice', e.target.value)}
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                              type="number" 
                              placeholder="Max"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none dark:text-white"
                              value={filters.maxPrice}
                              onChange={(e) => updateFilter('maxPrice', e.target.value)}
                          />
                      </div>
                  </div>

                  {/* Durum Filtresi */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Lojistik Durumu
                      </label>
                      <select 
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none dark:text-white"
                          value={filters.status}
                          onChange={(e) => updateFilter('status', e.target.value)}
                      >
                          <option value="">Tümü</option>
                          {Object.values(OrderStatus).map(status => (
                              <option key={status} value={status}>{status}</option>
                          ))}
                      </select>
                  </div>

                  {/* Süreç Durumu Filtresi */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Süreç Durumu
                      </label>
                      <select 
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none dark:text-white"
                          value={filters.processStatus}
                          onChange={(e) => updateFilter('processStatus', e.target.value)}
                      >
                          <option value="">Tümü</option>
                          <option value={ProcessStatus.APPROVAL}>Onay Bekleyenler</option>
                          <option value={ProcessStatus.QUOTE}>Teklifler</option>
                          <option value={ProcessStatus.ORDER}>Onaylananlar (Siparişler)</option>
                      </select>
                  </div>
              </div>
          </div>
      )}

      {/* SİPARİŞ LİSTESİ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-24">Görsel</th>
                <th className="px-6 py-4">Müşteri / Ürün (Adet)</th>
                <th className="px-6 py-4">Tarihler</th>
                <th className="px-6 py-4">Finansal (USD)</th>
                <th className="px-6 py-4">Lojistik Durumu</th>
                <th className="px-6 py-4">Tahsilat</th>
                <th className="px-6 py-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-slate-300" />
                          <p>Kriterlere uygun kayıt bulunamadı.</p>
                      </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isOrderActive = !order.processStatus || order.processStatus === ProcessStatus.ORDER;
                  
                  // GÖRSEL SEÇİM MANTIĞI
                  const hasImage = order.images && order.images.length > 0;
                  const displayImage = hasImage 
                    ? order.images![0] 
                    : 'https://tapports.com/wp-content/uploads/2019/10/azazaz.png';

                  return (
                    <tr key={order.id} className={`transition-colors group border-b border-slate-100 dark:border-slate-800 last:border-0 ${getRowStyle(order.status)}`}>
                      <td className="px-6 py-4">
                        <div 
                            onClick={(e) => { e.stopPropagation(); onEditOrder(order); }}
                            className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center justify-center"
                            title="Düzenlemek için tıklayın"
                        >
                            <img 
                                src={displayImage} 
                                alt="Order" 
                                className={`w-full h-full ${hasImage ? 'object-cover' : 'object-contain p-2'}`}
                            />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 dark:text-white">{order.customerName}</p>
                            {getProcessStatusBadge(order.processStatus)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Store className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">{order.supplier || 'Bilinmiyor'}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{order.productModel} <span className="font-bold text-blue-600 dark:text-blue-400">(x{order.quantity || 1})</span></p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">#{order.invoiceNo}</p>
                        <p className="text-xs text-slate-400 mt-1">{order.date}</p>
                        {order.estimatedDeliveryDate && order.status !== OrderStatus.DELIVERED && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md w-fit">
                                <Clock className="w-3 h-3" />
                                Tah: {order.estimatedDeliveryDate}
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900 dark:text-white font-bold">${(order.calculatedValues?.totalSalePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Kâr: +${(order.calculatedValues?.profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                           <select 
                            disabled={!isOrderActive}
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-400 appearance-none 
                                ${!isOrderActive 
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60' 
                                    : order.status === OrderStatus.DELIVERED ? 'bg-white/80 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900/50 cursor-pointer' : 'bg-white/80 dark:bg-slate-800/80 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-900/50 cursor-pointer'
                                }`}
                            title={!isOrderActive ? "Lojistik durumu değiştirmek için sürecin 'Siparişleşti' olması gerekir." : "Durumu Güncelle"}
                          >
                            {Object.values(OrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
                          </select>
                          {!isOrderActive && (
                              <div className="text-[9px] text-slate-400 mt-1 font-medium">Siparişleşme Bekleniyor</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[140px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">%{ (order.calculatedValues?.paymentProgress || 0).toFixed(0) }</span>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">${ (order.calculatedValues?.balanceDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${order.calculatedValues?.balanceDue === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(order.calculatedValues?.paymentProgress || 0, 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 relative">
                          {order.status !== OrderStatus.DELIVERED && isOrderActive && (
                              <button onClick={(e) => handleCompleteClick(e, order)} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-sm" title="Tamamla"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); onEditOrder(order); }} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg shadow-sm" title="Düzenle"><Edit2 className="w-4 h-4" /></button>
                          <div className="relative">
                            <button onClick={(e) => showConfirmBubble(e, order.id)} className={`p-2 rounded-lg ${confirmDeleteId === order.id ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800'}`} title="Sil"><Trash2 className="w-4 h-4" /></button>
                            {confirmDeleteId === order.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={handleCancelDelete} />
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                                  <div className="flex flex-col gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                    <span>Emin misiniz?</span>
                                    <div className="flex gap-2">
                                      <button onClick={(e) => handleConfirmDelete(e, order.id)} className="flex-1 py-1.5 bg-red-600 text-white rounded-lg">Sil</button>
                                      <button onClick={handleCancelDelete} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">Hayır</button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
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

export default OrderList;