
export enum OrderStatus {
  CHINA_WAREHOUSE = 'Çin Depo',
  AIR_TRANSIT = 'Uçak',
  TR_CUSTOMS = 'TR Gümrük',
  LOCAL_CARGO = 'Yurtiçi Kargo',
  DELIVERED = 'Teslim Edildi'
}

// YENİ: Süreç Durumları
export enum ProcessStatus {
  QUOTE = 'Teklif Verilecek',
  APPROVAL = 'Onay Bekleniyor',
  ORDER = 'Siparişleşti'
}

export type CommissionRate = 0 | 0.07;

export interface Order {
  id: string;
  date: string;
  estimatedDeliveryDate?: string;
  processStatus: ProcessStatus; // YENİ
  customerName: string;
  supplier: string;
  productModel: string;
  quantity: number;
  invoiceNo: string;
  buyPrice: number; // USD (Birim)
  logisticsCost: number; // USD (Toplam)
  localShipping: number; // USD (Toplam)
  deposit: number; // USD (Toplam)
  status: OrderStatus;
  profitMargin: number; // Ondalık oran (örn: 0.3)
  commissionRate: CommissionRate;
  images?: string[]; // YENİ: Resim URL listesi
  description?: string; // YENİ: Ürün açıklaması
  calculatedValues: CalculatedValues;
  isDeleted?: boolean; // YENİ: Silinme durumu
}

export interface CalculatedValues {
  commissionAmount: number;
  unitCost: number; // Toplam maliyet
  totalSalePrice: number;
  profit: number;
  balanceDue: number;
  paymentProgress: number;
}