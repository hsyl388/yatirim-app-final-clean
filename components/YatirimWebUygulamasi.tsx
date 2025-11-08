import { useState, useEffect } from "react";
import { AI_RECOMMENDATIONS } from "./ai_yorumlar";
import YatirimPlanlama from "./YatirimPlanlama";
import { AI_RECOMMENDATIONS_FORSTK1 } from "./STK1";
import { AI_RECOMMENDATIONS_FORSTK2 } from "./STK2";
import { AI_RECOMMENDATIONS_FORSTK3 } from "./STK3";
import { AI_RECOMMENDATIONS_FORSTK4 } from "./STK4";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useRef } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"; //grafik için



import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const stockList = ["STK1", "STK2", "STK3", "STK4"];
//const roboAvatar = "/roboadviser2.png";
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
  { STK1: 60.65, STK2: 15.51, STK3: 23.95, STK4: 493.5 }, //0
  { STK1: 63.3, STK2: 16.2, STK3: 27.5, STK4: 553.9 }, //1
  { STK1: 56.75, STK2: 13.9, STK3: 25.05, STK4: 557.5 }, //2
  { STK1: 57.5, STK2: 13.59, STK3: 24.02, STK4: 547.5 }, //3
  { STK1: 61.15, STK2: 12.66, STK3: 25.08, STK4: 481 }, //4
  { STK1: 65.15, STK2: 10.99, STK3: 23.88, STK4: 460 }, //5
  { STK1: 71, STK2: 13.95, STK3: 25.92, STK4: 511 }, //6
  { STK1: 75.5, STK2: 14.14, STK3: 24.72, STK4: 531 }, //7
  { STK1: 86.2, STK2: 13.74, STK3: 21.7, STK4: 539.5 }, //8
  { STK1: 105.4, STK2: 15.99, STK3: 23.74, STK4: 542.5 }, //9
  { STK1: 117.4, STK2: 12.02, STK3: 21.6, STK4: 437.5 }, //10
  { STK1: 129.8, STK2: 10.18, STK3: 24.04, STK4: 474 }, //11
  { STK1: 139.5, STK2: 11.42 , STK3: 23.54, STK4: 521.5 }, //12
];


const OPTIMIZED_QUANTITIES: Record<number, StockMap> = {
  1: { STK1: 4, STK2: 5, STK3: 17, STK4: 9 },
  2: { STK1: 4, STK2: 2, STK3: 2, STK4: 14 },
  3: { STK1: 146, STK2: 1, STK3: 1, STK4: 5 },
  4: { STK1: 110, STK2: 1, STK3: 77, STK4: 28 },
  5: { STK1: 134, STK2: 2, STK3: 1, STK4: 9 },
  6: { STK1: 10, STK2: 35, STK3: 11, STK4: 9 },
  7: { STK1: 20, STK2: 5, STK3: 1, STK4: 8 },
  8: { STK1: 57, STK2: 1, STK3: 2, STK4: 5 },
  9: { STK1: 62, STK2: 50, STK3: 29, STK4: 1 },
 10: { STK1: 74, STK2: 3, STK3: 2, STK4: 43 },
 11: { STK1: 12, STK2: 2, STK3: 17, STK4: 8 },
 12: { STK1: 7, STK2: 17, STK3: 1, STK4: 9 },
};


export default function YatirimWebUygulamasi() {
  const [userName, setUserName] = useState<string | null>(null);
  const [balance, setBalance] = useState(100000);
  const [stocks, setStocks] = useState<StockMap>({ STK1: 0, STK2: 0, STK3: 0, STK4: 0 });
  const [prices, setPrices] = useState<StockMap>(staticPrices[0]);
  const [iterations, setIterations] = useState(0);

const [introStep, setIntroStep] = useState<0 | 1 | 2 | 3 >(0);

const chatEndRef = useRef<HTMLDivElement>(null);

type ChatMessage = { sender: 'user' | 'bot'; text: string };

const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
sender: 'bot' as const,
    text: 'İsminizi giriniz.'
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

  const timestamp = new Date().toLocaleString();
  
const { width, height } = useWindowSize();

const [showChart, setShowChart] = useState(false); //grafik için eklendi

const [riskProfile, setRiskProfile] = useState<number | null>(null);

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
    return "Yatırım önerisi ister misiniz?";
  }

  if ([3, 7, 10].includes(tur)) {
    return `${tur}. turdasınız. Yatırım önerisi ister misiniz?`;
  }

  // Varsayılan: 1. tur dahil diğer tüm turlar
  return `Şu an ${tur}. turdayız. Yatırım önerisi ister misiniz?`;
}

// Burada ilk chatbot arayüzündeki konuşmalar var
const handleIntroSubmit = () => {
  const trimmed = inputMessage.trim();
  if (trimmed === "") return;

  const userMsg: ChatMessage = { sender: "user", text: trimmed };
  let botMsg: ChatMessage;

  // 0) İsim al ➜ risk sor
  if (introStep === 0) {
    setUserName(trimmed);
    const msg2: ChatMessage = { sender: "bot", text: "Yatırım yaklaşımınızı 1–5 arasında puanlayınız. 1=Çok temkinli, 5=Agresif." };
    setChatHistory(prev => [...prev, userMsg, msg2]);
    setLog(prev => [...prev, `KULLANICI: ${trimmed}`, `ROBO: ${msg2.text}`]);
    setInputMessage("");
    setIntroStep(1);
    return;
  }

  // 1) Risk al ➜ süre sor
  if (introStep === 1) {
    const risk = parseInt(trimmed, 10);
    if (Number.isNaN(risk) || risk < 1 || risk > 5) {
      botMsg = { sender: "bot", text: "1–5 arasında bir sayı giriniz. (1=Çok temkinli, 5=Agresif)" };
      setChatHistory(prev => [...prev, userMsg, botMsg]);
      setLog(prev => [...prev, `KULLANICI: ${trimmed}`, `ROBO: ${botMsg.text}`]);
      setInputMessage("");
      return;
    }
    setRiskProfile(risk);
    const msg2: ChatMessage = {
      sender: "bot",
      text:
        "Yatırımlarınızı genellikle ne kadar süreyle yaparsınız? Aşağıdakilerden birini yazınız:\n\n• 0-6 Ay\n• 6-12 Ay\n• 1-3 Yıl\n• 3 Yıldan Uzun",
    };
    setChatHistory(prev => [...prev, userMsg, msg2]);
    setLog(prev => [...prev, `KULLANICI: ${trimmed}`, `ROBO: ${msg2.text}`]);
    setInputMessage("");
    setIntroStep(2);
    return;
  }

  // 2) Süre al ➜ onay iste
  if (introStep === 2) {
    const lower = trimmed.toLowerCase();
    const validDurations = ["0-6", "6-12", "1-3", "3", "uzun", "yıl", "ay"];
    if (validDurations.some(k => lower.includes(k))) {
      const msg1: ChatMessage = { sender: "bot", text: "Cevaplarınız kaydedildi." };
      const msg2: ChatMessage = { sender: "bot", text: "Planlama adımına başlamak için 'Devam etmek istiyorum' yazınız." };
      setChatHistory(prev => [...prev, userMsg, msg1, msg2]);
      setLog(prev => [...prev, `KULLANICI: ${trimmed}`, `ROBO: ${msg1.text}`, `ROBO: ${msg2.text}`]);
      setInputMessage("");
      setIntroStep(3);
      return;
    } else {
      botMsg = { sender: "bot", text: "Yatırım sürenizi örneğin '0-6 Ay' veya '1-3 Yıl' gibi yazabilir misiniz?" };
      setChatHistory(prev => [...prev, userMsg, botMsg]);
      setLog(prev => [...prev, `KULLANICI: ${trimmed}`, `ROBO: ${botMsg.text}`]);
      setInputMessage("");
      return;
    }
  }

  // 3) Onay ➜ plan aşamasına geç
  if (introStep === 3) {
    const lower = trimmed.toLowerCase();
    const yesWords = ["evet", "başlayalım", "devam", "olur", "tamam", "let's go", "haydi", "hadi"];
    const noWords = ["hayır", "hayir", "bekle", "dur", "sonra", "şimdi değil", "simdi degil"];

    if (yesWords.some(k => lower.includes(k))) {
      const proceedMsg: ChatMessage = { sender: "bot", text: "Yatırım planlama adımına yönlendiriliyorsunuz." };
      setChatHistory(prev => [...prev, userMsg, proceedMsg]);
      setLog(prev => [...prev, `KULLANICI: ${trimmed}`, `ROBO: ${proceedMsg.text}`]);
      setInputMessage("");

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);

      setTimeout(() => {
        setStep("plan");
      }, 500); // istersen 5000 yerine daha kısa bekleme
      return;
    }

    if (noWords.some(k => lower.includes(k))) {
      const stayMsg: ChatMessage = { sender: "bot", text: "Yatırım planlamaya başlamak için 'Devam etmek istiyorum' yazınız." };
      setChatHistory(prev => [...prev, userMsg, stayMsg]);
      setInputMessage("");
      return;
    }

    const nudge: ChatMessage = { sender: "bot", text: "Planlama adımında başlanılması için 'Devam etmek istiyorum' yazabilirsiniz. 😊" };
    setChatHistory(prev => [...prev, userMsg, nudge]);
    setInputMessage("");
    return;
  }
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
    setChatHistory([{ sender: 'bot' as const, text: 'İsminizi giriniz' }]);
  }
}, [step]);


useEffect(() => {
  if (chatEndRef.current) {
    chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [chatHistory]);

   
const samplePriceHistory = staticPrices.slice(0, iterations + 1).map((prices, index) => ({
  tur: index + 1,
  STK1: prices.STK1,
  STK2: prices.STK2,
  STK3: prices.STK3,
  STK4: prices.STK4,
}));


  const handleChat = () => {
    
    if (!userName) {
      setUserName(inputMessage.trim());
      setChatHistory(prev => [...prev, { sender: 'user', text: inputMessage }, { sender: 'bot' as const, text: `İsminiz kaydedildi. ` }]);

      setLog(prev => [...prev, `KULLANICI: ${inputMessage}`, `ROBO: İsminiz ${inputMessage} olarak kaydedildi!`]);
      setInputMessage("");
      return;
    }

    if (inputMessage.trim() === "") return;

    const lower = inputMessage.toLowerCase();


    
  // TAVSİYE İSTENDİ Mİ LOG
  const tavsiyeIsteniyorMu = [
    "evet",
    "olur",
    "tamam",
    "merak et",
    "merak ed",
    "anlat",
    "ne önerirsin",
    "düşünü",
    "yatırım",
    "yatır",
    "hangi hisse",
    "Finza",
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
    let botResponse = "Talebinizi detaylı belirtiniz.";


      if (lower.includes("yatırım") || lower.includes("tavsiye")) {
      botResponse = "Hisse senedi bazlı mı yoksa genel bir tavsiye mi talep etmektesiniz?";
     }

    else if (lower.includes("hisse senedi") || lower.includes("bazlı")) {
      botResponse = "Hangi hisse özelinde tavsiye talep ettiğinizi belirtiniz";
     }

    else if (lower.includes("evet") || lower.includes("merak et") || lower.includes("merak ed" ) || lower.includes("anlat" )|| lower.includes("olur" )) {
      botResponse = "Hangi hisse özelinde tavsiye istiyorsunuz? ";
     const currentPlan = OPTIMIZED_QUANTITIES[iterations + 1];
      botResponse = `${iterations + 1}. tur sonunda portföyünüzde\n` +
      `STK1 hissesinden ${currentPlan.STK1} adet\n` +
      `STK2 hissesinden ${currentPlan.STK2} adet\n` +
      `STK3 hissesinden ${currentPlan.STK3} adet\n` +
      ` STK4 hissesinden ${currentPlan.STK4} adet\n bulundurmalısınız. `;

     }

 
     else if (lower.includes("genel")) {
            botResponse = "Hangi hisse özelinde tavsiye istiyorsunuz?";
     const currentPlan = OPTIMIZED_QUANTITIES[iterations + 1];
      botResponse = `${iterations + 1}. tur sonunda portföyünüzde\n` +
      `STK1 hissesinden ${currentPlan.STK1} adet\n` +
      `STK2 hissesinden ${currentPlan.STK2} adet\n` +
      `STK3 hissesinden ${currentPlan.STK3} adet\n` +
      ` STK4 hissesinden ${currentPlan.STK4} adet\n bulundurmalısınız. `;
     }



    else if (lower.includes("hayır")) {
      botResponse = "Tamam";
     }


         else if (lower.includes("neden") || lower.includes("detay")|| lower.includes("neye dayanarak") || (lower.includes("nasıl") && (lower.includes("öngörüde")))) {
      botResponse = AI_RECOMMENDATIONS[iterations] || "Şu anda isteğiniz yerine getirilememektedir.";
     }

     
    //STK'lara göre
    else if (lower.includes("stk1")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK1[iterations] || "Şu anda isteğiniz yerine getirilememektedir.";
    }

    else if (lower.includes("stk2")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK2[iterations] || "Şu anda isteğiniz yerine getirilememektedir.";
    }

    else if (lower.includes("stk3")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK3[iterations] || "Şu anda isteğiniz yerine getirilememektedir.";
    }

    else if (lower.includes("stk4")) {
      botResponse = AI_RECOMMENDATIONS_FORSTK4[iterations] || "Şu anda isteğiniz yerine getirilememektedir.";
    }


else if (lower.includes("ne önerir") || lower.includes("yatırım") || lower.includes("hangi hisse") || lower.includes("yatır") ||  lower.includes("tavsiye") || lower.includes("öner") || lower.includes ("düşünü") ||
      lower.includes("kaç adet") || lower.includes("kaçar") || lower.includes("ne kadar") || lower.includes("ne yapmalı") ) {
  const currentPlan = OPTIMIZED_QUANTITIES[iterations + 1];
  if (currentPlan) {
    botResponse = `Tur ${iterations + 1} için \n` +
      `STK1 hissesinden ${currentPlan.STK1} adet\n` +
      `STK2 hissesinden  ${currentPlan.STK2} adet\n` +
      `STK3 hissesinden ${currentPlan.STK3} adet\n` +
      ` STK4 hissesinden ${currentPlan.STK4} adet\n bulundurmalısınız.`;
  } else {
    botResponse = "Şu an öneri sunulamamaktadır.";
  }
}


    //Sonradan eklenenler

    else if (lower.includes("hisse senedi") || lower.includes("senet") || lower.includes("senedi") ) {
      botResponse =  "Hangi hisse senedi hakkında bilgi almak istiyorsunuz?";
    }


    //Hesaplama



    setChatHistory(prev => [...prev, { sender: 'user', text: inputMessage }, { sender: 'bot' as const, text: botResponse }]);
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

/*
TIMESTAMP EKLEMEK İSTERSEM

setHistory((prev) => [
  ...prev,
  `Tur ${iterations + 1}: [${timestamp}] ${symbol} hissesi alındı (${quantity} adet, toplam ${totalCost.toFixed(2)} ₺)`
]); */
      
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
    setChatHistory(prev => [...prev, { sender: 'bot' as const, text: mesaj }]);
       setInputErrors({}); // tüm hata mesajlarını sıfırla
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
   updated[iterations] = { ...plannedQuantities }; // artık tahmini değerleri kaydediyoruz
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
    Gönderen: entry.sender === 'user' ? 'Kullanıcı' : 'Finza',
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

  // Sayfa 4: Özet (12. Tur Fiyatlarıyla)
const finalPrices = staticPrices[12]; // 12. tur fiyatları
let finalStockValue = 0;
for (const symbol of stockList) {
  finalStockValue += stocks[symbol] * finalPrices[symbol];
}
const finalTotal = balance + finalStockValue;
const finalProfit = finalTotal - 100000;

const summarySheet = XLSX.utils.aoa_to_sheet([
  ["Tarih", tarihSaat],
  ["Bakiye (12. Tur Sonu)", `${finalTotal.toFixed(2)} ₺`],
  ["Toplam Kar/Zarar", `${finalProfit.toFixed(2)} ₺`]
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
       <span className="font-bold">Robo-Danışman</span>
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
          onFocus={(e) => e.target.select()}
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
  handlePlanlamaKaydet={handlePlanlamaKaydet}
  prices={prices}
  balance={balance}
  stocks={stocks}
  setQuantities={setQuantities}
  setInputErrors={setInputErrors}
  inputErrors={inputErrors}
  setPlannedQuantities={setPlannedQuantities}
   priceHistory={staticPrices} //grafik için eklendi

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
{(() => {
  const finalPrices = staticPrices[12]; // 12. tur fiyatları
  let finalStockValue = 0;
  for (const symbol of stockList) {
    finalStockValue += stocks[symbol] * finalPrices[symbol];
  }
  const finalTotal = balance + finalStockValue;
  const finalProfit = finalTotal - 100000;

  return (
    <p className="text-2xl font-bold mb-6">
      Toplam {finalProfit >= 0 ? "Kâr" : "Zarar"}: {finalProfit.toFixed(2)} ₺
      <p className="text-lg font-semibold mb-4">
        Katılımınız için teşekkür ederiz. Lütfen sonuç dosyasını anket linkinde ilgili alana ekleyip anketi tamamlayınız.
      </p>
    </p>
  );
})()}

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
             <span className="font-bold">Robo-Danışman</span>
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
  

{/*GRAFİK İÇİN*/}
          <button
  onClick={() => setShowChart(prev => !prev)}
  className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded"
>
  {showChart ? "Grafiği Gizle" : "Hisse Fiyat Grafiğini Göster"}
</button>


{/* GRAFİK */}
{showChart && (
  <div className="bg-white shadow rounded p-4 mt-4">
    <h3 className="text-lg font-semibold mb-2">Hisse Fiyatları Grafiği</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={samplePriceHistory}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="tur" label={{ value: 'Tur', position: 'insideBottomRight', offset: -5 }} />
        <YAxis label={{ value: 'Fiyat (₺)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="linear" dataKey="STK1" stroke="#8884d8" />
        <Line type="linear" dataKey="STK2" stroke="#13a972ff" />
        <Line type="linear" dataKey="STK3" stroke="#301934" />
        <Line type="linear" dataKey="STK4" stroke="#8B0000" />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}



</div>


  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">

              {stockList.map((symbol) => {
                
                const typedSymbol = symbol as StockSymbol;
                return (
                  <div key={symbol} className="bg-white shadow rounded-lg p-4 flex flex-col gap-2 w-full max-w-[18rem]">
            <div className="font-semibold text-base">{symbol} - {prices[typedSymbol]} ₺</div>
              <div className="text-sm text-gray-600">Eldeki Adet: {stocks[typedSymbol]} </div>
       <span className="text-sm text-blue-600">Planlanan Adet: {plannedQuantities[typedSymbol] ?? 0}</span>

            

<input
  type="number"
  min="1"
  value={quantities[typedSymbol]}
  onChange={(e) => handleQuantityChange(typedSymbol, e.target.value)}
  onFocus={(e) => e.target.select()}
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