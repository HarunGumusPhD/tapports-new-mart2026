
import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, Info } from 'lucide-react';

const ExcelIntegration: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const vbaCode = `Sub SiparisHesapla()
    ' ROL SCM Akıllı Hesaplama Makrosu (KDV Yok)
    Dim sonSatir As Long
    Dim i As Long
    
    sonSatir = Cells(Rows.Count, 1).End(xlUp).Row
    
    For i = 2 To sonSatir
        ' Maliyet Hesaplama: (Alış * 1.07) + Lojistik + Kargo
        Cells(i, 12).Value = (Cells(i, 7).Value * 1.07) + Cells(i, 9).Value + Cells(i, 10).Value
        
        ' Toplam Satış Fiyatı (Maliyet + Kâr)
        ' Kâr Marjı (Kullanıcı tarafından girilen sütun 13)
        Cells(i, 15).Value = Cells(i, 12).Value + (Cells(i, 12).Value * Cells(i, 13).Value)
    Next i
    
    MsgBox "Tüm hesaplamalar güncellendi!", vbInformation, "ROL SCM"
End Sub`;

  const handleCopy = () => {
    navigator.clipboard.writeText(vbaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 dark:shadow-none">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FileCode className="w-8 h-8" />
          Excel Makro ve Dashboard Entegrasyonu
        </h2>
        <p className="text-blue-100 opacity-90 leading-relaxed">
          Bu bölüm, web uygulaması ile Excel dosyanızı senkronize etmeniz için gereken tüm araçları içerir. 
          Aşağıdaki kodu kopyalayıp Excel'inizdeki VBA Editörüne (ALT+F11) yapıştırarak web uygulamasındaki tüm zekayı Excel'e taşıyabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
            <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Excel'de Nasıl Kullanılır?
          </div>
          <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-3 list-decimal pl-4">
            <li>Excel dosyanızı <span className="font-bold text-slate-800 dark:text-slate-200">"Makro İçerebilen Excel Çalışma Kitabı (.xlsm)"</span> olarak kaydedin.</li>
            <li>Excel verilerini "Tablo" olarak biçimlendirin.</li>
            <li><span className="font-bold text-slate-800 dark:text-slate-200">ALT + F11</span> tuşlarına basarak VBA Editörünü açın.</li>
            <li><span className="font-bold text-slate-800 dark:text-slate-200">Insert &gt; Module</span> diyerek yeni bir modül ekleyin.</li>
            <li>Yandaki kodu yapıştırın ve <span className="font-bold text-slate-800 dark:text-slate-200">SiparisHesapla</span> makrosunu çalıştırın.</li>
          </ol>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl relative group shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">VBA Otomasyon Kodu</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-all active:scale-95"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Kopyalandı' : 'Kodu Kopyala'}
            </button>
          </div>
          <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto h-48 custom-scrollbar">
            {vbaCode}
          </pre>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100 dark:shadow-none">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-emerald-900 dark:text-emerald-200 font-bold mb-1">Akıllı Excel Şablonu Hazırlığı</h3>
          <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-4 leading-relaxed">
            "Sipariş Yönetimi" sekmesindeki <b>"Excel Aktar"</b> butonu artık verilerinizi Pivot Tablo oluşturmaya en uygun formatta indirir. 
            Bu format, Excel'de dashboard grafiklerinizi tek tıkla güncellemenizi sağlar.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
              Uyumlu Tabloyu Şimdi İndir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelIntegration;
