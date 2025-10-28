import { useState, useEffect } from "react";
import turHaberleri from "./turHaberleri";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type StockSymbol = "STK1" | "STK2" | "STK3" | "STK4";

type StockMap = {
  [key in StockSymbol]: number;
};

interface YatirimPlanlamaProps {
  iterations: number;
  quantities: StockMap;
  handleQuantityChange: (symbol: StockSymbol, value: string) => void;
  handlePlanlamaKaydet: () => void;
  prices: StockMap;
  balance: number;
  stocks: StockMap;
  setQuantities: React.Dispatch<React.SetStateAction<StockMap>>;
  setInputErrors: React.Dispatch<React.SetStateAction<Partial<Record<StockSymbol, string>>>>;
  inputErrors: Partial<Record<StockSymbol, string>>;
  setPlannedQuantities: React.Dispatch<React.SetStateAction<StockMap>>;
   priceHistory: StockMap[]; //grafik için eklendi
}

export default function YatirimPlanlama({
  iterations,
  quantities,
  handleQuantityChange,
  handlePlanlamaKaydet,
  prices,
  balance,
  stocks,
  setQuantities,
  setInputErrors,
  inputErrors,
  setPlannedQuantities,
  priceHistory //grafik ekle
}: YatirimPlanlamaProps) {
  const currentNews = turHaberleri.filter(haber => haber.tur === iterations + 1);

  const [previewHoldings, setPreviewHoldings] = useState<StockMap>(stocks);
  const [previewBalance, setPreviewBalance] = useState<number>(balance);
const [showChart, setShowChart] = useState(false); //grafik için eklendi

  const samplePriceHistory = priceHistory
  .slice(0, iterations + 1)  // Örn: tur 3'teyse ilk 3 tur alınır
  .map((item, index) => ({
    tur: index + 1,
    ...item
  }));

  useEffect(() => {
    setPreviewHoldings(stocks);
    setPreviewBalance(balance);
  }, [iterations]);

  useEffect(() => {
    setPlannedQuantities(previewHoldings);
  }, [previewHoldings]);

  const handleFakeBuy = (symbol: StockSymbol) => {
    const adet = quantities[symbol];
    const maliyet = prices[symbol] * adet;
    if (adet <= 0) return;

    if (maliyet > previewBalance) {
      setInputErrors(prev => ({ ...prev, [symbol]: "Yetersiz bakiye (planlama)" }));
      return;
    }

    setPreviewHoldings(prev => ({ ...prev, [symbol]: prev[symbol] + adet }));
    setPreviewBalance(prev => prev - maliyet);
    setInputErrors(prev => ({ ...prev, [symbol]: undefined }));
  };

  const handleFakeSell = (symbol: StockSymbol) => {
    const adet = quantities[symbol];
    if (adet <= 0) return;

    if (adet > previewHoldings[symbol]) {
      setInputErrors(prev => ({ ...prev, [symbol]: "Satılacak hisse adedi yetersiz (planlama)" }));
      return;
    }

    const kazanc = prices[symbol] * adet;
    setPreviewHoldings(prev => ({ ...prev, [symbol]: prev[symbol] - adet }));
    setPreviewBalance(prev => prev + kazanc);
    setInputErrors(prev => ({ ...prev, [symbol]: undefined }));
  };

/*Alt satıra inme*/
  const withBreaks = (s: string) =>
  s.replace(/\r?\n/g, "<br/>").replace(/\s*<br\/>\s*/g, "<br/>");


  return (
    <div className="p-4 space-y-6">
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{iterations + 1}. Tur İçin Öne Çıkan Başlıklar</h2>

        
  {currentNews.map((haber, index) => (
    <div
      key={index}
      className="text-base mb-2 leading-snug"
      dangerouslySetInnerHTML={{ __html: withBreaks(haber.haber) }}
    />
          
        ))}

 <button
    onClick={() => setShowChart(prev => !prev)}
    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
  >
    {showChart ? "Grafiği Gizle" : "Hisse Fiyat Grafiğini Göster"}
  </button>

      </div>

      <div className="bg-white shadow rounded p-4">
        
        <h2 className="text-xl font-bold mb-4 text-gray-800">Yatırım Planlama</h2>

        <p className="text-base mb-2 leading-snug">
          Haber başlıklarına göre aşağıdaki kutucuklara her hisse için satın almak istediğiniz adetleri giriniz.
          Planlamanızı tamamladıktan sonra “Yatırıma Başla” butonuna basarak bu tur için hisse alım/satım işlemlerini gerçekleştirebilirsiniz.
        </p>



        <div className="text-base text-gray-700 font-semibold mb-4">
          Kullanılabilir Bakiye: {previewBalance.toFixed(2)} ₺
        </div>

        {showChart && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2">Hisse Fiyatları Grafiği</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={samplePriceHistory}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="tur" label={{ value: 'Tur', position: 'insideBottomRight', offset: -5 }} />
        <YAxis label={{ value: 'Fiyat (₺)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="STK1" stroke="#8884d8" />
        <Line type="monotone" dataKey="STK2" stroke="#82ca9d" />
        <Line type="monotone" dataKey="STK3" stroke="#ffc658" />
        <Line type="monotone" dataKey="STK4" stroke="#ff7300" />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}

        {Object.keys(quantities).map((symbol) => {
          const typedSymbol = symbol as StockSymbol;
          return (
            <div key={symbol} className="flex items-center gap-3 mb-3">
              <span className="w-16 font-semibold text-base">{symbol}</span>
              <input
                type="number"
                min="0"
                value={quantities[typedSymbol]}
                onChange={(e) => handleQuantityChange(typedSymbol, e.target.value)}
                onFocus={(e) => e.target.select()}
                className="border rounded p-2 w-24"
              />
              <span className="text-sm text-gray-500">adet</span>
              <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={() => handleFakeBuy(typedSymbol)}>Al</button>
              <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleFakeSell(typedSymbol)}>Sat</button>
              <span className="text-sm text-blue-600">Hisse Adedi: {previewHoldings[typedSymbol]} </span>
              {inputErrors[typedSymbol] && (
                <div className="text-sm text-red-600 ml-2">{inputErrors[typedSymbol]}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
