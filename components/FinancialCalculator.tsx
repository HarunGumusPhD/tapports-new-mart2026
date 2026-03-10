import React, { useState, useMemo, useEffect } from 'react';
import { OrderStatus, Order, CommissionRate, ProcessStatus } from '../types';
import { calculateOrderValues } from '../utils/financial';
import { Calculator, Save, DollarSign, Hash, Store, RotateCcw, Calendar, FileClock, Upload, Image as ImageIcon, X, Loader2, ZoomIn } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onOrderComplete: (order: Order) => void;
  initialData: Order | null;
  isCalculatorMode?: boolean;
}

const FinancialCalculator: React.FC<Props> = ({ onOrderComplete, initialData, isCalculatorMode = false }) => {
  const [isManualProfit, setIsManualProfit] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Varsayılan form durumu
  const initialFormState = {
    customerName: '',
    supplier: '',
    productModel: '',
    quantity: 1,
    invoiceNo: '',
    buyPrice: 0 as number | string, // String girişine izin ver (0.1 gibi değerler için)
    logisticsCost: 0 as number | string,
    localShipping: 0 as number | string,
    deposit: 0 as number | string,
    profitMargin: 0.3,
    commissionRate: 0.07 as CommissionRate,
    status: OrderStatus.CHINA_WAREHOUSE,
    processStatus: ProcessStatus.ORDER, 
    description: '',
    date: new Date().toISOString().split('T')[0],
    estimatedDeliveryDate: new Date().toISOString().split('T')[0] // Varsayılan tarih bugün
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: initialData.customerName,
        supplier: initialData.supplier || '',
        productModel: initialData.productModel,
        quantity: initialData.quantity,
        invoiceNo: initialData.invoiceNo,
        buyPrice: initialData.buyPrice,
        logisticsCost: initialData.logisticsCost,
        localShipping: initialData.localShipping,
        deposit: initialData.deposit,
        profitMargin: initialData.profitMargin,
        commissionRate: initialData.commissionRate,
        status: initialData.status,
        processStatus: initialData.processStatus || ProcessStatus.ORDER,
        description: initialData.description || '',
        date: initialData.date,
        estimatedDeliveryDate: initialData.estimatedDeliveryDate || new Date().toISOString().split('T')[0]
      });
      setImages(initialData.images || []);
      
      const standardMargins = [0.2, 0.3, 0.5, 0.6];
      if (!standardMargins.includes(initialData.profitMargin)) {
        setIsManualProfit(true);
      } else {
        setIsManualProfit(false);
      }
    } else if (isCalculatorMode) {
      setFormData(initialFormState);
      setImages([]);
    }
  }, [initialData, isCalculatorMode]);

  const calculations = useMemo(() => {
    // String değerleri sayıya çevirerek hesapla
    return calculateOrderValues(
      Number(formData.buyPrice) || 0,
      formData.quantity,
      Number(formData.logisticsCost) || 0,
      Number(formData.localShipping) || 0,
      formData.profitMargin,
      Number(formData.deposit) || 0,
      formData.commissionRate
    );
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCalculatorMode) return;

    if (!formData.customerName || !formData.productModel || !formData.supplier) {
      alert('Lütfen zorunlu alanları (Müşteri, Tedarikçi, Ürün) doldurun.');
      return;
    }

    const orderData: Order = {
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      ...formData,
      // Kaydederken sayısal değerlerin kesinlikle number olduğundan emin ol
      buyPrice: Number(formData.buyPrice) || 0,
      logisticsCost: Number(formData.logisticsCost) || 0,
      localShipping: Number(formData.localShipping) || 0,
      deposit: Number(formData.deposit) || 0,
      images: images,
      calculatedValues: calculations
    };

    onOrderComplete(orderData);
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setImages([]);
    setIsManualProfit(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfitChange = (val: string) => {
    if (val === "manual") {
      setIsManualProfit(true);
    } else {
      setIsManualProfit(false);
      updateField('profitMargin', Number(val));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (images.length + files.length > 5) {
          alert("En fazla 5 adet resim yükleyebilirsiniz.");
          return;
      }

      setUploading(true);
      try {
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file.size > 5 * 1024 * 1024) {
                  alert(`"${file.name}" 5MB'dan büyük.`);
                  continue;
              }
              const url = await api.uploadImage(file);
              setImages(prev => [...prev, url]);
          }
      } catch (error: any) {
          alert("Resim yükleme hatası: " + error.message);
      } finally {
          setUploading(false);
          // Input'u temizle
          e.target.value = ''; 
      }
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      
      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxImage(null)}
          >
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                  <X className="w-8 h-8" />
              </button>
              <img 
                src={lightboxImage} 
                alt="Full size" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Resme tıklayınca kapanmasın
              />
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCalculatorMode ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {isCalculatorMode 
                  ? 'Maliyet Simülatörü' 
                  : (initialData ? 'Siparişi Düzenle' : 'Yeni Sipariş')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCalculatorMode ? 'Sadece hesaplama yapar, veritabanına kaydetmez.' : 'Sipariş detaylarını giriniz.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isCalculatorMode && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mb-4">
                     <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase flex items-center gap-2 mb-2">
                         <FileClock className="w-4 h-4" />
                         Sipariş Süreç Durumu
                     </label>
                     <div className="grid grid-cols-3 gap-2">
                         {[ProcessStatus.QUOTE, ProcessStatus.APPROVAL, ProcessStatus.ORDER].map((status) => (
                             <button
                                type="button"
                                key={status}
                                onClick={() => updateField('processStatus', status)}
                                className={`text-xs py-2 px-1 rounded-lg font-semibold transition-all ${
                                    formData.processStatus === status 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                }`}
                             >
                                 {status}
                             </button>
                         ))}
                     </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Müşteri Adı{isCalculatorMode ? '' : '*'}</label>
                <input 
                  type="text" 
                  required={!isCalculatorMode}
                  placeholder={isCalculatorMode ? "Opsiyonel" : ""}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all dark:text-white"
                  value={formData.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tedarikçi{isCalculatorMode ? '' : '*'}</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required={!isCalculatorMode}
                    placeholder={isCalculatorMode ? "Opsiyonel (Örn: Alibaba)" : "Örn: Alibaba"}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all dark:text-white"
                    value={formData.supplier}
                    onChange={(e) => updateField('supplier', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ürün Modeli{isCalculatorMode ? '' : '*'}</label>
                <input 
                  type="text" 
                  required={!isCalculatorMode}
                  placeholder={isCalculatorMode ? "Opsiyonel" : ""}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all dark:text-white"
                  value={formData.productModel}
                  onChange={(e) => updateField('productModel', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fatura No{isCalculatorMode ? '' : '*'}</label>
                <input 
                  type="text" 
                  required={!isCalculatorMode}
                  placeholder={isCalculatorMode ? "Opsiyonel" : ""}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all dark:text-white"
                  value={formData.invoiceNo}
                  onChange={(e) => updateField('invoiceNo', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ürün Açıklaması</label>
              <textarea 
                placeholder="Ürün detayları, notlar..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all min-h-[80px] resize-none dark:text-white"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 col-span-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Adet</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" min="1"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all dark:text-white"
                    value={formData.quantity}
                    onChange={(e) => updateField('quantity', Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Kâr Marjı</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all appearance-none dark:text-white"
                  value={isManualProfit ? "manual" : formData.profitMargin}
                  onChange={(e) => handleProfitChange(e.target.value)}
                >
                  <option value={0.2}>%20 Kâr</option>
                  <option value={0.3}>%30 Kâr</option>
                  <option value={0.5}>%50 Kâr</option>
                  <option value={0.6}>%60 Kâr</option>
                  <option value="manual">Elle Gir</option>
                </select>
              </div>
            </div>

            {isManualProfit && (
              <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Özel Oran (%)</label>
                <input 
                  type="number"
                  placeholder="Örn: 45"
                  className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all font-bold dark:text-white"
                  value={formData.profitMargin * 100}
                  onChange={(e) => updateField('profitMargin', Number(e.target.value) / 100)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  Birim Alış (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all font-mono dark:text-white"
                    value={formData.buyPrice}
                    onChange={(e) => updateField('buyPrice', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Komisyon Bedeli</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all appearance-none dark:text-white"
                  value={formData.commissionRate}
                  onChange={(e) => updateField('commissionRate', Number(e.target.value))}
                >
                  <option value={0.07}>%7 Komisyon</option>
                  <option value={0}>%0 Komisyon (Hariç)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Toplam Lojistik</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all font-mono dark:text-white"
                  value={formData.logisticsCost}
                  onChange={(e) => updateField('logisticsCost', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Yurtiçi Kargo</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all font-mono dark:text-white"
                  value={formData.localShipping}
                  onChange={(e) => updateField('localShipping', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-blue-600 dark:text-blue-400">Alınan Kapora (USD)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all font-bold text-blue-700 dark:text-blue-400"
                  value={formData.deposit}
                  onChange={(e) => updateField('deposit', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-slate-700 dark:text-slate-200">Tahmini Teslim Tarihi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all text-sm dark:text-white"
                    value={formData.estimatedDeliveryDate}
                    onChange={(e) => updateField('estimatedDeliveryDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isCalculatorMode ? (
              <button 
                type="button"
                onClick={handleReset}
                className="w-full py-4 mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 dark:shadow-none flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Formu Temizle (Yeni Hesap)
              </button>
            ) : (
              <button 
                type="submit"
                className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {initialData ? 'Değişiklikleri Kaydet' : 'Siparişi Kaydet'}
              </button>
            )}
          </form>
        </div>

        <div className="flex flex-col gap-6 h-full">
            {/* CANLI USD MALİYET İZLEME (ARTIK ÜSTTE) */}
            <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-800 flex-1">
                <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Canlı USD Maliyet İzleme</span>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Ürün Bedeli ({formData.quantity} Adet)</span>
                        <span className="font-mono text-lg font-medium text-slate-200">${(Number(formData.buyPrice) * formData.quantity).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                        <span className="text-slate-400 text-sm">Toplam Komisyon</span>
                        <span className="font-mono text-lg font-medium text-slate-200">+${calculations.commissionAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="bg-blue-600/10 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-500/20 dark:border-blue-800/30">
                        <div className="flex justify-between items-end">
                        <div>
                            <p className="text-blue-400 text-[10px] font-bold uppercase mb-1">Toplam Satış (USD)</p>
                            <p className="text-3xl font-bold">${calculations.totalSalePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Net Kâr</p>
                            <p className="text-xl font-bold text-emerald-400">+${calculations.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Tahsilat Durumu</span>
                        <span className="text-blue-400 font-bold">%{calculations.paymentProgress.toFixed(0)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(calculations.paymentProgress, 100)}%` }}
                        />
                        </div>
                        {calculations.balanceDue > 0 ? (
                        <p className="text-center text-xs text-orange-400 font-medium">
                            Kalan Alacak: ${calculations.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        ) : (
                            <p className="text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" />
                                Ödeme Tamamlandı
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* RESİM YÜKLEME ALANI (ARTIK ALTTA) */}
            {!isCalculatorMode && (
                <div className="bg-slate-800 dark:bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-700 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-500/20 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-400">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-400 uppercase tracking-widest">Sipariş Görselleri</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-900 dark:bg-slate-950 px-2 py-1 rounded-full">{images.length}/5</span>
                    </div>

                    <div className="space-y-3">
                        {/* İLK RESİM BÜYÜK */}
                        {images.length > 0 && (
                            <div className="relative group w-full h-[350px] bg-slate-900 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 dark:border-slate-800">
                                <img 
                                    src={images[0]} 
                                    alt="Main" 
                                    className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                                    onClick={() => setLightboxImage(images[0])}
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setLightboxImage(images[0])}
                                        className="p-2 bg-slate-900/50 hover:bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                        title="Büyüt"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => removeImage(0)}
                                        className="p-2 bg-red-600/80 dark:bg-red-900/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                        title="Sil"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DİĞER RESİMLER (KÜÇÜK GRID) */}
                        <div className="grid grid-cols-4 gap-3">
                            {images.slice(1).map((url, i) => {
                                const realIndex = i + 1;
                                return (
                                    <div key={realIndex} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-600 dark:border-slate-700 bg-slate-900 dark:bg-slate-950">
                                        <img 
                                            src={url} 
                                            alt={`Upload ${realIndex}`} 
                                            className="w-full h-full object-cover cursor-zoom-in" 
                                            onClick={() => setLightboxImage(url)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(realIndex)}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                            
                            {/* YÜKLEME BUTONU (EN SONA VEYA BOŞSA İLKE) */}
                            {images.length < 5 && (
                                 <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 dark:border-slate-700 hover:border-purple-400 hover:bg-purple-500/10 cursor-pointer transition-all group ${images.length === 0 ? 'h-[350px] w-full' : 'aspect-square'}`}>
                                    {uploading ? (
                                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className={`text-slate-500 dark:text-slate-600 group-hover:text-purple-400 mb-2 ${images.length === 0 ? 'w-12 h-12' : 'w-6 h-6'}`} />
                                            <span className="text-[10px] text-slate-500 dark:text-slate-600 group-hover:text-purple-300 font-bold">
                                                {images.length === 0 ? 'İlk Görseli Yükle' : 'Yükle'}
                                            </span>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                 </label>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 dark:text-slate-600 text-center mt-3">Max 5MB • JPG, PNG, WEBP</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export default FinancialCalculator;