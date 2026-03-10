import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, DollarSign, X, AlertCircle } from 'lucide-react';
import { Order } from '../types';

interface Props {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isFullPayment: boolean, amount?: number) => void;
}

const DeliveryConfirmationModal: React.FC<Props> = ({ order, isOpen, onClose, onConfirm }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState<string>(order.deposit.toString());

  const balance = order.calculatedValues?.balanceDue || 0;
  const totalSale = order.calculatedValues?.totalSalePrice || 0;

  const handleYes = () => {
    onConfirm(true);
  };

  const handleNo = () => {
    setStep(2);
  };

  const handleSaveAmount = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!isNaN(parsedAmount)) {
      onConfirm(false, parsedAmount);
    } else {
      alert("Lütfen geçerli bir tutar giriniz.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Teslimat Onayı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{order.customerName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    Sipariş 'Teslim Edildi' olarak işaretleniyor.
                  </p>
                  <div className="py-4 px-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 inline-block">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-bold">
                      Bakiyenin TAMAMI tahsil edildi mi?
                    </p>
                    <p className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400 mt-1">
                      ${balance.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    onClick={handleYes}
                    className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all transform active:scale-95 flex flex-col items-center justify-center gap-1"
                  >
                    <span>Evet</span>
                    <span className="text-[10px] opacity-80 font-normal">Tamamı Tahsil Edildi</span>
                  </button>
                  <button 
                    onClick={handleNo}
                    className="py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all transform active:scale-95 flex flex-col items-center justify-center gap-1"
                  >
                    <span>Hayır</span>
                    <span className="text-[10px] opacity-80 font-normal">Kısmi Tahsilat / Değişmedi</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">Tahsilat Güncelleme</p>
                    <p>Şu ana kadar yapılan toplam tahsilat tutarını giriniz.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Toplam Satış</p>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300">${totalSale.toLocaleString('en-US')}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Kalan Bakiye</p>
                      <p className="font-mono font-bold text-red-600 dark:text-red-400">${balance.toLocaleString('en-US')}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <input 
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono text-lg font-bold dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Geri
                  </button>
                  <button 
                    onClick={handleSaveAmount}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-95"
                  >
                    Kaydet ve Teslim Et
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeliveryConfirmationModal;
