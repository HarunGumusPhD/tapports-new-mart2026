
import { CalculatedValues, CommissionRate } from '../types';

export const calculateOrderValues = (
  buyPrice: number,
  quantity: number,
  logisticsCost: number,
  localShipping: number,
  profitMargin: number,
  deposit: number,
  commissionRate: CommissionRate
): CalculatedValues => {
  const q = quantity || 1;

  // 1. Komisyon Bedeli (Birim alış üzerinden toplam)
  const commissionAmount = (buyPrice * commissionRate) * q;
  
  // 2. Toplam Ürün Alış Maliyeti (Ürün + Komisyon)
  const totalBaseProductCost = (buyPrice * q) + commissionAmount;
  
  // 3. Toplam Sipariş Maliyeti (Ürün + Komisyon + Lojistik + Yurtiçi Kargo)
  // Formül: (adet * birim alış) * 1.07 + toplam lojistik + yurtiçi kargo
  const totalCost = totalBaseProductCost + logisticsCost + localShipping;

  // 4. Toplam Kâr (TÜM Maliyet üzerinden hesaplanır)
  // Formül: Toplam Maliyet * Seçilen Kâr Oranı (örn: 0.30)
  const profit = totalCost * profitMargin;
  
  // 5. Toplam Satış Fiyatı (Maliyet + Kâr)
  // Formül: Toplam Maliyet * (1 + Kâr Oranı)
  const totalSalePrice = totalCost + profit;
  
  // 6. Tahsilat ve İlerleme
  const balanceDue = Number((totalSalePrice - deposit).toFixed(2));
  const paymentProgress = totalSalePrice > 0 ? (deposit / totalSalePrice) * 100 : 0;

  return {
    commissionAmount: Number(commissionAmount.toFixed(2)),
    unitCost: Number(totalCost.toFixed(2)),
    totalSalePrice: Number(totalSalePrice.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    balanceDue,
    paymentProgress
  };
};
