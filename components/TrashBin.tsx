import React, { useState } from 'react';
import { Order, ProcessStatus } from '../types';
import { Search, RotateCcw, Trash2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Props {
  orders: Order[];
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
}

const TrashBin: React.FC<Props> = ({ orders, onRestore, onHardDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.productModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProcessStatusBadge = (status: ProcessStatus) => {
    switch (status) {
        case ProcessStatus.QUOTE:
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">TEKLİF</span>;
        case ProcessStatus.APPROVAL:
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">ONAY BEKLENİYOR</span>;
        default:
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">SİPARİŞLEŞTİ</span>;
    }
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onHardDelete(id);
    setConfirmDeleteId(null);
  };

  const showConfirmBubble = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-6 rounded-3xl flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center shrink-0">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-red-900 dark:text-red-200">Geri Dönüşüm Kutusu</h2>
          <p className="text-red-700 dark:text-red-400 text-sm mt-1">
            Buradaki siparişler silinmiş olarak işaretlenmiştir. İhtiyaç duyarsanız geri yükleyebilir veya veritabanından tamamen silebilirsiniz.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input 
          type="text" 
          placeholder="Silinenler içinde ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 outline-none transition-all text-sm dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Müşteri / Ürün</th>
                <th className="px-6 py-4">Süreç</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Fatura No</th>
                <th className="px-6 py-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                    <Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <span className="font-medium">Geri dönüşüm kutusu boş.</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 opacity-60 grayscale dark:grayscale-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <p className="font-bold text-slate-800 dark:text-white">{order.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.productModel} (x{order.quantity})</p>
                    </td>
                    <td className="px-6 py-4 opacity-60">
                        {getProcessStatusBadge(order.processStatus)}
                    </td>
                    <td className="px-6 py-4 opacity-60">
                        <p className="font-mono font-medium dark:text-slate-200">${order.calculatedValues?.totalSalePrice.toLocaleString('en-US')}</p>
                    </td>
                    <td className="px-6 py-4 opacity-60">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded dark:text-slate-300">{order.invoiceNo || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button 
                            onClick={() => onRestore(order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Geri Yükle
                        </button>
                        
                        <div className="relative">
                            <button 
                                onClick={(e) => showConfirmBubble(e, order.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold transition-colors"
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Kalıcı Sil
                            </button>

                            {confirmDeleteId === order.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => setConfirmDeleteId(null)} />
                                <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 shadow-2xl rounded-xl p-3 z-50 animate-in fade-in zoom-in-95">
                                  <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex items-start gap-2 text-red-600 dark:text-red-400 font-bold mb-1">
                                        <AlertOctagon className="w-4 h-4 shrink-0" />
                                        <span>Bu işlem geri alınamaz!</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={(e) => handleConfirmDelete(e, order.id)} className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">Evet, Sil</button>
                                      <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold">İptal</button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrashBin;