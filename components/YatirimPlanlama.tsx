
import { useState } from "react";
import turHaberleri from "./turHaberleri";

type StockSymbol = "STK1" | "STK2" | "STK3" | "STK4";

type StockMap = {
  [key in StockSymbol]: number;
};

interface YatirimPlanlamaProps {
  iterations: number;
  quantities: StockMap;
  handleQuantityChange: (symbol: StockSymbol, value: string) => void;
  handlePlanlamaKaydet: () => void;  // Bunu da eklemeliyiz
}




export default function YatirimPlanlama({ iterations, quantities, handleQuantityChange, handlePlanlamaKaydet}: YatirimPlanlamaProps) {
  const currentNews = turHaberleri.filter(haber => haber.tur === iterations + 1);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">  {iterations + 1} . Tur İçin Öne Çıkan Başlıklar</h2>
        {currentNews.map((haber, index) => (
          <div key={index} className="text-base mb-2 leading-snug">
          {haber.haber}
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800"> Yatırım Planlama</h2>

    <p className="text-base mb-2 leading-snug">
     Haber başlıklarına göre aşağıdaki kutucuklara her hisse için satın almak istediğiniz adetleri giriniz. 
     Planlamanızı tamamlamanızın ardından “Yatırıma Başla” butonuna basarak bu tur için hisse alım/ satım işlemlerini gerçekleştirebilirsiniz.
      </p>


        {quantities && Object.keys(quantities).map((symbol) => {
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
              <span className="text-base mb-2 leading-snug">adet</span>
            </div>
          );
        })}
      </div>





    </div>
  );
}
