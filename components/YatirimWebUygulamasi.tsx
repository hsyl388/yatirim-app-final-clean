import { useState, useEffect } from "react";
//import { AI_RECOMMENDATIONS } from "./ai_yorumlar";
import YatirimPlanlama from "./YatirimPlanlama";
import { AI_RECOMMENDATIONS_FORSTK1 } from "./STK1";
import { AI_RECOMMENDATIONS_FORSTK2 } from "./STK2";
import { AI_RECOMMENDATIONS_FORSTK3 } from "./STK3";
import { AI_RECOMMENDATIONS_FORSTK4 } from "./STK4";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useRef } from "react";



//EXCELE ÇIKTI VERSİN DİYE KÜTÜPHANE IMPORT EDİYORUZ
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const stockList = ["STK1", "STK2", "STK3", "STK4"];
const roboAvatar = "/roboadviser.png";
const grafikGorselURL = "/İlk4hisse.png";


//EXCELE ÇIKTI VER
const exportToExcel = (log: string[], csvRows: string[]) => {
  const sheet1Data = [["Zaman", "İşlem"], ...log.map(entry => [new Date().toLocaleString(), entry])];
  const sheet2Data = [["Tur", "Hisse", "Adet", "Fiyat", "Toplam Değer", "Önceki Değer", "Kar/Zarar"], ...csvRows.map(row => row.split(","))];

  const wb = XLSX.utils.book_new();
  const sheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  const sheet2 = XLSX.utils.aoa_to_sheet(sheet2Data);

  XLSX.utils.book_append_sheet(wb, sheet1, "Kullanici Gunlugu");
  XLSX.utils.book_append_sheet(wb, sheet2, "KarZarar Raporu");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "yatirim_raporu.xlsx");
};



type StockSymbol = "STK1" | "STK2" | "STK3" | "STK4";

type StockMap = {
  [key in StockSymbol]: number;
};


const staticPrices: StockMap[] = [
  { STK1: 60.65, STK2: 15.51, STK3: 23.95, STK4: 493.5 },
  { STK1: 63.3, STK2: 16.2, STK3: 27.5, STK4: 553.9 },
  { STK1: 56.75, STK2: 13.9, STK3: 25.05, STK4: 557.5 },
  { STK1: 57.5, STK2: 13.59, STK3: 24.02, STK4: 547.5 },
  { STK1: 61.15, STK2: 12.66, STK3: 25.08, STK4: 481 },
  { STK1: 65.15, STK2: 10.99, STK3: 23.88, STK4: 460 },
  { STK1: 71, STK2: 13.95, STK3: 25.92, STK4: 511 },
  { STK1: 75.5, STK2: 14.14, STK3: 24.72, STK4: 531 },
  { STK1: 86.2, STK2: 13.74, STK3: 21.7, STK4: 539.5 },
  { STK1: 105.4, STK2: 15.99, STK3: 23.74, STK4: 542.5 },
  { STK1: 117.4, STK2: 12.02, STK3: 21.6, STK4: 437.5 },
  { STK1: 129.8, STK2: 10.18, STK3: 24.04, STK4: 474 },
  { STK1: 139.5, STK2: 11.42 , STK3: 23.54, STK4: 521.5 },
];


const OPTIMIZED_QUANTITIES: Record<number, StockMap> = {
  1: { STK1: 36, STK2: 49, STK3: 23, STK4: 11 },
  2: { STK1: 5, STK2: 25, STK3: 40, STK4: 38 },
  3: { STK1: 8, STK2: 48, STK3: 10, STK4: 50 },
  4: { STK1: 8, STK2: 38, STK3: 17, STK4: 2 },
  5: { STK1: 15, STK2: 12, STK3: 50, STK4: 15 },
  6: { STK1: 11, STK2: 16, STK3: 32, STK4: 42 },
  7: { STK1: 2, STK2: 20, STK3: 52, STK4: 50 },
  8: { STK1: 36, STK2: 36, STK3: 13, STK4: 54 },
  9: { STK1: 5, STK2: 17, STK3: 9, STK4: 44 },
 10: { STK1: 34, STK2: 31, STK3: 16, STK4: 55 },
 11: { STK1: 14, STK2: 53, STK3: 35, STK4: 3 },
 12: { STK1: 4, STK2: 21, STK3: 37, STK4: 56 },
};


export default function YatirimWebUygulamasi() {
  const [userName, setUserName] = useState<string | null>(null);
  const [balance, setBalance] = useState(100000);
  const [stocks, setStocks] = useState<StockMap>({ STK1: 0, STK2: 0, STK3: 0, STK4: 0 });
  const [prices, setPrices] = useState<StockMap>(staticPrices[0]);
  const [iterations, setIterations] = useState(0);

const [introStep, setIntroStep] = useState<0 | 1 | 2 | 3 >(0);

const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot'; text: string }[]>([{
    sender: 'bot',
    text: 'Merhaba, hoş geldin! Ben FinZa ✨12 tur boyunca yatırım sürecinde sana destek olmak için buradayım. Senin de ismini öğrenebilir miyim? 😊'
  }]);
  const [inputMessage, setInputMessage] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<StockMap>({ STK1: 1, STK2: 1, STK3: 1, STK4: 1 });
  const [error, setError] = useState("");
  const maxIterations = 12;
//  const [currentTab, setCurrentTab] = useState<'chatbot' | 'stocks' | 'graph' | 'planlama'>('chatbot');

 const [tavsiyeIstendiLogu, setTavsiyeIstendiLogu] = useState<number[]>(Array(maxIterations).fill(0));
 

  const [currentTab, setCurrentTab] = useState<'chatbot' | 'stocks' | 'graph' | 'planlama' | 'chatstocks'>('chatbot');

  const [step, setStep] = useState<'intro' | 'plan' | 'execute'>('intro');


  const [log, setLog] = useState<string[]>([]);
  const [hasActionsThisStep, setHasActionsThisStep] = useState(false);

  const [previousProfit, setPreviousProfit] = useState(0); //kar-zarar

 const [inputErrors, setInputErrors] = useState<Partial<Record<StockSymbol, string>>>({});


  const [plannedQuantities, setPlannedQuantities] = useState<StockMap>({ STK1: 0, STK2: 0, STK3: 0, STK4: 0 });

  
const { width, height } = useWindowSize();

/*
  function getTurMesaji(tur: number): string {
  const mesajlar = [
    `Tur ${tur} başladı! Yeni tur, yeni fırsatlar demek. İstersen sana özel yatırım önerilerimi paylaşabilirim. Merak ediyor musun? 😊`,
    `Merhaba! Şu an ${tur}. turdayız. Piyasaya göre sana önerilerimi duymak ister misin?`,
    `${tur}. turdayız ve fırsatlar kapıda. Hangi hisse senedi öne çıkıyor, birlikte inceleyebiliriz. Yatırım önerisi ister misin?`
  ];
  return mesajlar[Math.floor(Math.random() * mesajlar.length)];
}

*/

function getTurMesaji(tur: number): string {
  if (tur === 12) {
    return 'Son turdayız ve hala kazancını arttırma şansın var. Tavsiyelerimi paylaşmamı ister misin?';
  }

  if ([3, 7, 10].includes(tur)) {
    return `${tur}. turdayız ve fırsatlar kapıda. Hangi hisse senedi öne çıkıyor, birlikte inceleyebiliriz. Yatırım önerisi ister misin?`;
  }

  // Varsayılan: 1. tur dahil diğer tüm turlar
  return `Merhaba! Şu an ${tur}. turdayız. Piyasaya göre sana önerilerimi duymak ister misin?`;
}




//Burada ilk chatbot arayüzündeki konuşmalar var
const handleIntroSubmit = () => {
  const trimmed = inputMessage.trim();
  if (trimmed === "") return;

  const userMsg = { sender: 'user', text: trimmed };
  let botMsg;

  if (introStep === 0) {
    setUserName(trimmed);
    botMsg = { sender: 'bot', text: `Memnun oldum ${trimmed}! Nasılsın bugün?` };
    setIntroStep(1);
  } else if (introStep === 1) {
      if (trimmed.toLowerCase().includes("iyiyim") || trimmed.toLowerCase().includes("iyi")  || trimmed.toLowerCase().includes("güzel")  || trimmed.toLowerCase().includes("fena değil") )
    {
    botMsg = { sender: 'bot', text: `Bunu duyduğuma sevindim! Uygulama sürecinde her tur yatırım planlaman ve hisse alım/ satım işlemleri gerçekleştirmen gerekiyor. Yatırım esnasında ihtiyaç duyduğunda her zaman sana yatırım önerisi sunabilirim. Hazırsan başlayalım mı?` };
    } else {
      botMsg = { sender: 'bot', text: `Bunu duyduğuma üzüldüm ☹ Biraz özgüven tazelemeye ne dersin? Haydi, yatırım uygulamasına başlayalım ve biraz para kazanalım` };
    }   
    setIntroStep(2);
  } else if (introStep === 2) {
    if (trimmed.toLowerCase().includes("evet") || trimmed.toLowerCase().includes("olur") || trimmed.toLowerCase().includes("başlayalım")) {
      botMsg = { sender: 'bot', text: `Harika! O zaman hemen Simülasyon ekranına geçiyoruz.` };
      setIntroStep(3);
      setStep("plan");
    } else {
      botMsg = { sender: 'bot', text: `Tamam, ne zaman istersen başlayabiliriz.` };
    }
  }


  setChatHistory(prev => [...prev, userMsg, botMsg]);
  setInputMessage("");
};




//EXCELE ÇIKTI VER
const [csvRows, setCsvRows] = useState<string[]>([]);
  //DETAYLI EXCEL TUTULSUN
  const [stockLog, setStockLog] = useState<StockMap[]>([]);
  const [planlamaLog, setPlanlamaLog] = useState<StockMap[]>([]);


 /* useEffect(() => {
    if (iterations === maxIterations && log.length > 0) {
      const csvContent = ["Zaman,İşlem"].concat(log.map(entry => `${new Date().toLocaleString()},${entry}`)).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "kullanici_gunlugu.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [iterations, log]);  */

//GÜNCEL USE EFFECT FONKSİYONU
  useEffect(() => {
    if (iterations === maxIterations && (csvRows.length > 0 || log.length > 0)) {
    //  exportToExcel(log, csvRows);
    }
  }, [iterations]);
  

  useEffect(() => {
  if (step === 'intro' && chatHistory.length === 0) {
    setChatHistory([{ sender: 'bot', text: 'Merhaba! Ben FinZa. Önce adını öğrenebilir miyim?' }]);
  }
}, [step]);


useEffect(() => {
  if (chatEndRef.current) {
    chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [chatHistory]);

   

  const handleChat = () => {
    
    if (!userName) {
      setUserName(inputMessage.trim());
      setChatHistory(prev => [...prev, { sender: 'user', text: inputMessage }, { sender: 'bot', text: `Tanıştığıma çok memnun oldum ${inputMessage}🙂! Bugün ne yapmak istersin? Mesela biraz hisse almaya ne dersin?` }]);

      setLog(prev => [...prev, `KULLANICI: ${inputMessage}`, `ROBO: Memnun oldum ${inputMessage} 🙂! Bugün ne yapmak istersin?`]);
      setInputMessage("");
      return;
    }

    if (inputMessage.trim() === "") return;

    const lower = inputMessage.toLowerCase();


    
  // TAVSİYE İSTENDİ Mİ LOG
  const tavsiyeIsteniyorMu = [
    "evet",
    "merak et",
    "merak ed",
    "anlat",
    "ne önerirsin",
    "düşünü",
    "yatırım",
    "yatır",
    "hangi hisse",
    "FinZa",
    "öner",
    "tavsiye"
  ].some(keyword => lower.includes(keyword));

  if (tavsiyeIsteniyorMu && tavsiyeIstendiLogu[iterations] === 0) {
  setTavsiyeIstendiLogu(prev => {
    const updated = [...prev];
    updated[iterations] = 1;
    return updated;
  });
}
    let botResponse = "Üzgünüm, isteğinizi anlamayamadım. Lütfen ne talep ettiğinizi detaylı belirtin.";

    if (lower.includes("selam") || lower.includes("merhaba")) {
      botResponse = "Merhaba 😊 Sana nasıl yardımcı olabilirim?";
    }


    else if (lower.includes("adım") || lower.includes("ismim")) {
      botResponse = "Memnun oldum 😊 Sana nasıl yardımcı olabilirim?";
    }


     else if (lower.includes("yatırım") || lower.includes("tavsiye")) {
      botResponse = "Tabii 😊 Nasıl bir tavsiye istersin? Hisse senedi bazlı mı? Genel mi?";
     }

     
    else if (lower.includes("FinZa") || lower.includes("sen") || lower.includes("bakabilir")) {
      botResponse = "Buyur 😊 Desteğe mi ihtiyaç duyuyorsun?";
     }

    else if (lower.includes("hisse") && lower.includes("bazlı")) {
      botResponse = "Hangi hisse özelinde tavsiye istiyorsun?";
     }

    else if (lower.includes("evet") || lower.includes("merak et") || lower.includes("merak ed" ) || lower.includes("anlat" )) {
      botResponse = "Hangi hisse özelinde tavsiye istiyorsun? Genel bir öneri mi istiyorsun?";
     const currentPlan = OPTIMIZED_QUANTITIES[iterations + 1];
      botResponse = `İşte Tur ${iterations + 1} için sana özel önerim:\n` +
      `STK1: ${currentPlan.STK1} adet\n` +
      `STK2: ${currentPlan.STK2} adet\n` +
      `STK3: ${currentPlan.STK3} adet\n` +
      ` STK4: ${currentPlan.STK4} adet\n\n`;

     }

      else if (lower.includes("nasıl") ) {
      botResponse = "Sorunu tam anlayamadım ☹ Biraz daha açıklayabilir misin? Hangi hisseye ne kadar yatırman gerektiği konusunda mı bir yardıma ihtiyacın var? Yoksa neden ve nasıl bu öngörüde bulunduğumu mu sormak istedin?";
     }

    else if (lower.includes("hisse") || lower.includes("hayır")) {
      botResponse = "Peki, ne zaman istersen buradayım! Her zaman öneri isteyebilirsin.";
     }

     else if (lower.includes("kimsin") || lower.includes("adın") || lower.includes("ismin") ) {
      botResponse = "Adım FinZa. Tekrar memnun oldum 🙂. Yardımcı olabileceğim bir konu var mı?";
     }


    else if (lower.includes("neden") || lower.includes("neye dayanarak") || (lower.includes("nasıl") && (lower.includes("öngörüde")))) {
      botResponse = "Bu turdaki haber başlıklarını dikkate alarak öngörüde bulunabiliyorum.";
     }

     else if (lower.includes("yanlış") || lower.includes("hata")) {
      botResponse = "Özür dilerim. Tekrar olmaması için öğreniyorum 🙂";
     }

else if (lower.includes("ne önerirsin") || lower.includes("yatırım") || lower.includes("hangi hisse") || lower.includes("yatır") ||  lower.includes("tavsiye") || lower.includes("öner") || lower.includes ("düşünü")) {
  const currentPlan = OPTIMIZED_QUANTITIES[iterations + 1];
  if (currentPlan) {
    botResponse = `Tur ${iterations + 1} için önerim:\n` +
      `STK1: ${currentPlan.STK1} adet\n` +
      `STK2: ${currentPlan.STK2} adet\n` +
      `STK3: ${currentPlan.STK3} adet\n` +
      ` STK4: ${currentPlan.STK4} adet\n\n`;
  } else {
    botResponse = "Şu an için öneri bulunmamaktadır 🙁";
  }
}


    //Sonradan eklenenler
    else if (lower.includes("yardım") || lower.includes("destek")) {
      botResponse =  "Hangi konuda yardımcı olabilirim? 🙂";
    }

    else if (lower.includes("hisse senedi") || lower.includes("senet") || lower.includes("senedi") ) {
      botResponse =  "Hangi hisse senedi hakkında bilgi almak istersin?";
    }

    else if (lower.includes("karar veremedim")) {
      botResponse =  "Biraz daha yönlendirme yapmamı ister misin?";
    }

    //Hesaplama

      else if (lower.includes("TL")) {
      botResponse =  "Biraz daha yönlendirme yapmamı ister misin?";
    }

      else if (lower.includes("kaç adet") || lower.includes("kaçar") || lower.includes("ne kadar"))    
     {
      botResponse = AI_RECOMMENDATIONS_FORSTK1[iterations] || "Üzgünüm şu an öneri sunamıyorum 🙁 Farklı bir konuda öneri ister misin?";
    }

    //STK'lara göre
    else if (lower.includes("stk1")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK1[iterations] || "Üzgünüm şu an öneri sunamıyorum 🙁 Farklı bir konuda öneri ister misin?";
    }

    else if (lower.includes("stk2")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK2[iterations] || "Üzgünüm şu an öneri sunamıyorum 🙁 Farklı bir konuda öneri ister misin?";
    }

    else if (lower.includes("stk3")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK3[iterations] || "Üzgünüm şu an öneri sunamıyorum 🙁Farklı bir konuda öneri ister misin?";
    }

    else if (lower.includes("stk4")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK4[iterations] || "Üzgünüm şu an öneri sunamıyorum 🙁 Farklı bir konuda öneri ister misin?";
    }



    setChatHistory(prev => [...prev, { sender: 'user', text: inputMessage }, { sender: 'bot', text: botResponse }]);
    setLog(prev => [...prev, `KULLANICI: ${inputMessage}`, `ROBO: ${botResponse}`]);
    setInputMessage("");
  };

  const handleQuantityChange = (symbol: StockSymbol, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      setQuantities(prev => ({ ...prev, [symbol]: num }));
    }
  };


  function buyStock(symbol: StockSymbol) {
    const quantity = quantities[symbol];
    const totalCost = prices[symbol] * quantity;
    if (iterations >= maxIterations || quantity <= 0) return;
    if (balance >= totalCost) {
      setBalance((prev) => Math.max(0, prev - totalCost));
      setStocks((prev) => ({ ...prev, [symbol]: prev[symbol] + quantity }));
      setHistory((prev) => [...prev,`Tur ${iterations + 1}:  ${symbol} hissesi alındı (${quantity} adet, toplam ${totalCost.toFixed(2)} ₺)`]);

      setHasActionsThisStep(true);

       setInputErrors(prev => ({ ...prev, [symbol]: undefined }));
    } else {
      setInputErrors(prev => ({ ...prev, [symbol]: "Yetersiz bakiye" }));
    }
  }

  const calculateTotalProfit = () => {
    let totalStockValue = 0;
    for (const symbol of stockList) {
      totalStockValue += stocks[symbol] * prices[symbol];
    }
    return balance + totalStockValue - 100000; //kar zarar
  };
  
  const sellStock = (symbol: StockSymbol) => {
    const quantity = quantities[symbol];
    const totalGain = prices[symbol] * quantity;
    if (iterations >= maxIterations || quantity <= 0) return;
    if (stocks[symbol] >= quantity) {
      setBalance((prev) => prev + totalGain);
      setStocks((prev) => ({ ...prev, [symbol]: prev[symbol] - quantity }));
      setHistory((prev) => [...prev, `Tur ${iterations + 1}:  ${symbol} hissesi satıldı (${quantity} adet, toplam ${totalGain.toFixed(2)} ₺)`]);
      setHasActionsThisStep(true);

      setInputErrors(prev => ({ ...prev, [symbol]: undefined }));
    } else {
       setInputErrors(prev => ({ ...prev, [symbol]: "Satılacak hisse adedi yetersiz" }));
    }
  };

const handleNextStep = () => {
const next = iterations + 1;

  if (iterations >= maxIterations) {
    console.log("Artık işlem yapılmayacak, çünkü iteration >= max.");
    return;
  }

  setStockLog(prev => [...prev, { ...stocks }]);

  const rowEntries: string[] = [];
  stockList.forEach(symbol => {
    const adet = stocks[symbol];
    const fiyat = prices[symbol];
    const toplam = adet * fiyat;
    rowEntries.push(`${iterations + 1},${symbol},${adet},${fiyat.toFixed(2)},${toplam.toFixed(2)},-,0`);
  });
  setCsvRows(prev => [...prev, ...rowEntries]);

  setPreviousProfit(calculateTotalProfit());
  // önce iteration güncelle
  setIterations(next);

  // sonra sadece gerekiyorsa step değiştir
  if (next < maxIterations) {
    setPrices(staticPrices[next]);
    setStep("plan");

  }   else {
    setIterations(next); // sadece ilerlet, step değişmesin
  }

};

//YENİ TURDA BİR ÖNCEKİ TURUN HİSSE ADEDİNİ GÖSTERMESİN
  useEffect(() => {
    if (step === 'plan') {
      setQuantities({ STK1: 0, STK2: 0, STK3: 0, STK4: 0 });
    }
  }, [step]);

useEffect(() => {
  if (step === 'execute' && iterations < maxIterations) {
    const mesaj = getTurMesaji(iterations + 1);
    setChatHistory(prev => [...prev, { sender: 'bot', text: mesaj }]);
  }
}, [step, iterations]);

  /*
  const handlePlanlamaKaydet = () => {
    setQuantities({ ...stocks }); // execute aşamasına geçmeden önce quantities = stocks
    setStep("execute");
  };
*/

const handlePlanlamaKaydet = () => {
  setPlanlamaLog(prev => {
    const updated = [...prev];
    updated[iterations] = { ...quantities }; // her tur için index'e göre güncelle
    return updated;
  });
  setQuantities({ STK1: 0, STK2: 0, STK3: 0, STK4: 0 }); // sıfırla
  setStep("execute");
};

//EXCELE ÇIKTI VER
  const exportToExcel = () => {
    const tarihSaat = new Date().toLocaleString();
  const workbook = XLSX.utils.book_new();




  //  Sayfa 1: Sohbet Geçmişi
  const chatData = chatHistory.map((entry, index) => ({
    Sıra: index + 1,
    Gönderen: entry.sender === 'user' ? 'Kullanıcı' : 'FinZa',
    Mesaj: entry.text
  }));
  const chatSheet = XLSX.utils.json_to_sheet(chatData);
  XLSX.utils.book_append_sheet(workbook, chatSheet, "Sohbet");

  //  Sayfa 2: İşlem Geçmişi
  const actionData = history.map((entry, index) => ({
    Sıra: index + 1,
    İşlem: entry
  }));
  const actionSheet = XLSX.utils.json_to_sheet(actionData);
  XLSX.utils.book_append_sheet(workbook, actionSheet, "İşlemler");

  //  Sayfa 3: Hisse Bilgileri
  const hisseData = stockList.map((symbol) => ({
    Hisse: symbol,
    Adet: stocks[symbol],
    Fiyat: prices[symbol],
    ToplamDeğer: (stocks[symbol] * prices[symbol]).toFixed(2)
  }));
  const hisseSheet = XLSX.utils.json_to_sheet(hisseData);
  XLSX.utils.book_append_sheet(workbook, hisseSheet, "Hisseler");

  // Sayfa 4: Özet
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Tarih", tarihSaat],
    ["Bakiye", `${balance.toFixed(2)} ₺`],
    ["Toplam Kar/Zarar", `${(calculateTotalProfit()).toFixed(2)} ₺`]
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Özet");

  // Sayfa 5: Hisse Adetleri (Tur Bazlı)
const stockLogSheetData = stockLog.map((entry, index) => ({
  Tur: index + 1,
  STK1: entry.STK1,
  STK2: entry.STK2,
  STK3: entry.STK3,
  STK4: entry.STK4
}));
const stockLogSheet = XLSX.utils.json_to_sheet(stockLogSheetData);
XLSX.utils.book_append_sheet(workbook, stockLogSheet, "Hisse Adetleri");

// Sayfa 6: Yatırım Planlama (Planlanan Hisse Adetleri)
const planlamaSheetData = planlamaLog.map((entry, index) => ({
  Tur: index + 1,
  STK1: entry.STK1,
  STK2: entry.STK2,
  STK3: entry.STK3,
  STK4: entry.STK4,
}));
const planlamaSheet = XLSX.utils.json_to_sheet(planlamaSheetData);
XLSX.utils.book_append_sheet(workbook, planlamaSheet, "Yatırım Planlama");

// Sayfa 7: Planlama vs Gerçekleşen
const comparisonSheetData: any[] = [["Tur", "Hisse", "Planlanan Adet", "Gerçekleşen Adet","Tavsiye İstendi"]];

planlamaLog.forEach((plan, index) => {
  const gercek = stockLog[index] || { STK1: 0, STK2: 0, STK3: 0, STK4: 0 };
  stockList.forEach((symbol) => {
    comparisonSheetData.push([
      index + 1,
      symbol,
      plan[symbol],
      gercek[symbol],
      tavsiyeIstendiLogu[index] === 1 ? 1 : 0
    ]);
  });
});


const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonSheetData);
XLSX.utils.book_append_sheet(workbook, comparisonSheet, "Planlama vs Gerçekleşen");

  //  Excel Dosyasını İndir
  XLSX.writeFile(workbook, "yatirim_sonucu.xlsx");
  };

  
  return (

    
    <div className="p-2 md:p-4 max-w-4xl mx-auto">


     {step === 'intro' && (
  <div className="flex flex-col md:flex-row gap-6 mt-6">
    
    {/* Chatbot Bölümü */}
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <img src={roboAvatar} alt="roboadvisor" className="w-12 h-12 rounded-full shadow" />

        <span className="font-bold">FinZa</span>
      </div>

      <div className="bg-white shadow rounded p-6 h-[28rem] overflow-auto space-y-3 text-base">
        {chatHistory.map((msg, i) => (
          <div
      key={i}
      className={`flex ${
        msg.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`px-4 py-2 rounded-2xl break-words ${
          msg.sender === "user"
            ? "bg-blue-100 text-right w-fit max-w-[75%]"
            : "bg-gray-200 text-left w-[75%]"
        }`}
      >
        {msg.text}
      </div>
    </div>
  ))}
</div>

      {/* Kullanıcıdan isim al */}
      <div className="flex flex-col md:flex-row mt-2 space-y-2 md:space-y-0 md:space-x-2">
        <input
          className="border rounded p-2 w-full"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleIntroSubmit();
            }
          }}
          placeholder="Adını yaz ve gönder..."
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleIntroSubmit}
        >
          Gönder
        </button>
      </div>
    </div>
  </div>
)}



      {/* ADIM 1: YATIRIM PLANLAMA */}
      {step === 'plan' && (
  <div>
    <YatirimPlanlama
      iterations={iterations}
      quantities={quantities}
      handleQuantityChange={handleQuantityChange}
    />
    <div className="mt-4 text-center">
      <button
        onClick={handlePlanlamaKaydet}
        className="bg-green-600 text-white px-6 py-2 rounded"
      >
        Yatırıma Başla
      </button>
    </div>
  </div>
)}

  
      {/* ADIM 2: CHATBOT + YATIRIM MENÜSÜ */}

{step === 'execute' && iterations >= maxIterations ? (
  // SİMÜLASYON SONU EKRANI
  <div className="text-center py-12">

    <Confetti width={width} height={height} />

    <h1 className="text-3xl font-bold mb-4"> Simülasyon Tamamlandı! 🎉🎉🎉 </h1>
    <p className="text-2xl font-bold mb-6">
      Toplam {calculateTotalProfit() >= 0 ? "Kâr" : "Zarar"}: {calculateTotalProfit().toFixed(2)} ₺

      <p className="text-lg font-semibold mb-4">Katılımınız için teşekkür ederiz. Lütfen sonuç dosyasını anket linkinde ilgili alana ekleyip anketi tamamlayınız.</p>
    </p>
    
    {/* EXCEL İNDİRME BUTONU */}
    <button
      onClick={exportToExcel}
      className="bg-blue-600 text-white px-6 py-2 rounded mb-4"
    >
      Yatırım Sonucunu İndir
    </button>

    <br />

    {/* ANKET LİNKİ */}
    <a
      href="https://forms.gle/S2dPhjmp3Qxnko2ZA"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-green-600 text-white px-6 py-2 rounded inline-block"
    >
      Ankete Git
    </a>
  </div>
) 
       : step === 'execute' && (


        
        <div>
          {error && (
            <div className="bg-red-100 text-red-800 p-2 rounded mb-4">
              {error}
            </div>
          )}
  
          <div className="flex flex-col md:flex-row gap-6 mt-6">
  
            {/* Chatbot */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <img src={roboAvatar} alt="roboadvisor" className="w-12 h-12 rounded-full shadow" />
                <span className="font-bold">FinZa</span>
              </div>
              <div className="bg-white shadow rounded p-6 h-[28rem] overflow-auto space-y-3 text-base">

                {chatHistory.map((msg, i) => (
                    <div key={i} className="flex">
                      <div
                        className={`rounded-2xl px-4 py-2 break-words mb-1 max-w-[75%] ${
                          msg.sender === 'user'
                            ? 'ml-auto bg-blue-100 text-right w-fit'
                            : 'mr-auto bg-gray-100 text-left w-full'
                        }`}
                      >
                      {msg.text}
                  </div>
                 </div>

                ))} <div ref={chatEndRef} /> 
              </div>
              <div className="flex flex-col md:flex-row mt-2 space-y-2 md:space-y-0 md:space-x-2">
                <input
                  className="border rounded p-2 w-full"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                  placeholder={userName ? "Hisse senedi sor, öneri iste..." : "Önce adını yazmalısın"}
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleChat}>
                  Gönder
                </button>
              </div>
            </div>



  
            {/* Yatırım Menüsü */}
            <div className="flex-1 space-y-4">


<div className="grid grid-cols-1 gap-3 bg-white p-4 rounded-xl shadow text-sm sm:text-base max-w-xl">

  
    <div className="flex justify-between">
    <span className="text-black-600 font-semibold"> Kullanılabilir Bakiye:</span>
    <span className="font-semibold text-black">
      {balance.toFixed(2)} ₺
    </span>
  </div>

  <div className="flex justify-between">
    <span className="text-blue-900 font-semibold">Son Tur Kâr/Zarar:</span>
    <span className="font-semibold text-blue-900">
      {(calculateTotalProfit() - previousProfit).toFixed(2)} ₺
    </span>
  </div>

    <div className="flex justify-between">
    <span className="text-green-600 font-semibold">Toplam Kâr/Zarar:</span>
    <span className="font-semibold text-green-600">
      {calculateTotalProfit().toFixed(2)} ₺
    </span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-600 font-semibold"> ⏳ Kalan Tur:</span>
    <span className="font-semibold text-gray-600">
      {maxIterations - iterations}
    </span>
  </div>


</div>


  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">

              {stockList.map((symbol) => {
                
                const typedSymbol = symbol as StockSymbol;
                return (
                  <div key={symbol} className="bg-white shadow rounded-lg p-4 flex flex-col gap-2 w-full max-w-[18rem]">
            <div className="font-semibold text-base">{symbol} - {prices[typedSymbol]} ₺</div>
              <div className="text-sm text-gray-600">Eldeki: {stocks[typedSymbol]} adet</div>
              <div className="text-sm text-blue-600">Planlanan: {planlamaLog[iterations]?.[typedSymbol] ?? 0} adet</div>
            

<input
  type="number"
  min="1"
  value={quantities[typedSymbol]}
  onChange={(e) => handleQuantityChange(typedSymbol, e.target.value)}
  className="border rounded-lg px-4 py-2 w-28 text-center text-base shadow-sm"
/>

                    <div className="flex gap-2 mt-2">
                      <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => buyStock(typedSymbol)}>Al</button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => sellStock(typedSymbol)}>Sat</button>
                    </div>

                  {inputErrors[typedSymbol] && (
                        <div className="text-sm text-red-600">{inputErrors[typedSymbol]}</div>
                   )}


                  </div>
                );
              })}
</div>


<div className="bg-white shadow rounded p-4 mt-4">
  <div className="font-semibold mb-2"> İşlem Geçmişi</div>
  {history.length === 0 ? (
    <p className="text-sm text-gray-500">Henüz işlem yapılmadı.</p>
  ) : (
    <div className="space-y-3 text-sm">
      {[...Array(iterations + 1).keys()].map(tur => {
        const turNo = tur + 1;
        const turIslemleri = history.filter(entry => entry.startsWith(`Tur ${turNo}:`));
        return turIslemleri.length > 0 ? (
          <div key={turNo}>
            <div className="font-semibold text-blue-600">Tur {turNo}</div>
            <ul className="list-disc pl-5">
              {turIslemleri.map((item, i) => (
                <li key={i}>{item.replace(`Tur ${turNo}: `, '')}</li>
              ))}
            </ul>
          </div>
        ) : null;
      })}
    </div>
  )}
</div>


            </div>
          </div>
  
          {/* Sonraki Tur Butonu */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                handleNextStep();
               // setStep('plan');
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded"
            >
              Sonraki Tur
            </button>
          </div>
        </div>
      )}
    </div>
  );

}


