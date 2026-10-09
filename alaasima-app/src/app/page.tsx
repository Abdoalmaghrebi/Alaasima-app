"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, MapPin, Mic, Send, Bot, User, ShoppingBag, CheckCircle } from "lucide-react";
import { MENU_DATA, MenuItem } from "@/data/menu";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  orderSummary?: { items: { item: MenuItem; qty: number }[]; total: number };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "أهلاً بك في مأكولات العاصمة! 🌯 يمكنك الطلب بالصوت أو الكتابة (مثلاً: 2 وجبة شاورما عربي ومشروب كينزا). شو حابب تطلب اليوم؟",
      time: "الآن",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString("ar-SY", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === "1" ? { ...m, time: currentTime } : m))
    );

    // إعداد المايك والتعرف على الصوت بمتصفح الموبايل
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-SA";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          handleSend(transcript);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // تحليل نص الطلب ومطابقته مع القائمة
  const parseOrder = (text: string) => {
    const foundItems: { item: MenuItem; qty: number }[] = [];
    let total = 0;

    MENU_DATA.forEach((menuItem) => {
      if (text.includes(menuItem.name) || text.includes(menuItem.name.split(" ")[0])) {
        // البحث عن عدد افتراضي
        let qty = 1;
        if (text.includes("2") || text.includes("اثنتين") || text.includes("وجبتين")) qty = 2;
        if (text.includes("3") || text.includes("ثلاثة")) qty = 3;
        if (text.includes("4") || text.includes("أربعة")) qty = 4;

        foundItems.push({ item: menuItem, qty });
        total += menuItem.price * qty;
      }
    });

    return { foundItems, total };
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const currentTime = new Date().toLocaleTimeString("ar-SY", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      time: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");

    // معالجة الطلب وإرجاع الرد
    setTimeout(() => {
      const { foundItems, total } = parseOrder(text);

      let botReplyText = "";
      let orderSummary;

      if (foundItems.length > 0) {
        botReplyText = `تكرم عينك! سجّلت طلبك المبدئي. يرجى تأكيد الطلب لتمريره فوراً لشاشة الكاشير:`;
        orderSummary = { items: foundItems, total };
      } else {
        botReplyText = `تكرم عينك! تلقيت طلبك: "${text}". حابب تضيف وجبات شاورما أو بروستد أو مشروبات من القائمة؟`;
      }

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReplyText,
        time: new Date().toLocaleTimeString("ar-SY", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        orderSummary,
      };

      setMessages((prev) => [...prev, botReply]);
    }, 800);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("التعرف على الصوت غير مدعوم في هذا المتصفح، يمكنك الكتابة بدلاً من ذلك.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white flex flex-col justify-between max-w-md mx-auto dir-rtl border-x border-white/5 shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#D4AF37]/30 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-[#D4AF37] bg-[#1A1A1A] flex items-center justify-center font-bold text-[#D4AF37] text-lg shadow-inner">
            ع
          </div>
          <div>
            <h1 className="font-bold text-[#D4AF37] text-base leading-tight">مأكولات العاصمة</h1>
            <p className="text-[11px] text-gray-400">طعم أصيل .. جودة تستحق</p>
          </div>
        </div>

        <a
          href="tel:0994934278"
          className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/40 p-2.5 rounded-full hover:bg-[#D4AF37] hover:text-black transition-all"
        >
          <Phone className="w-4 h-4" />
        </a>
      </header>

      {/* Hero Header Minimal */}
      <section className="px-4 py-2 text-center border-b border-white/5 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F]">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#D4AF37]">
          <MapPin className="w-3.5 h-3.5" />
          <span>التوصيل: يلدا - ببيلا - سيدي مقداد - جرمانا</span>
        </div>
      </section>

      {/* Messages Container */}
      <section className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[380px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === "user"
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-[#D4AF37] text-black"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#D4AF37] text-black font-medium rounded-tr-none"
                  : "bg-[#1A1A1A] text-gray-100 border border-[#D4AF37]/30 rounded-tl-none shadow-md"
              }`}
            >
              <p>{msg.text}</p>

              {/* كارت ملخص الفاتورة إن وجد */}
              {msg.orderSummary && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-bold">
                    <ShoppingBag className="w-4 h-4" />
                    <span>تفاصيل الطلب:</span>
                  </div>
                  {msg.orderSummary.items.map((entry, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-300">
                      <span>
                        {entry.qty}x {entry.item.name}
                      </span>
                      <span>{(entry.item.price * entry.qty).toLocaleString()} ل.س</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/10">
                    <span>المجموع الإجمالي:</span>
                    <span className="text-[#D4AF37]">
                      {msg.orderSummary.total.toLocaleString()} ل.س
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      alert("تم إرسال الطلب بنجاح إلى شاشة الكاشير في مطعم العاصمة!")
                    }
                    className="w-full mt-2 bg-[#D4AF37] text-black py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#B8952B] transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>تأكيد وإرسال للكاشير</span>
                  </button>
                </div>
              )}

              <span
                className={`text-[10px] block mt-1 text-left ${
                  msg.sender === "user" ? "text-black/60" : "text-gray-400"
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Suggestions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {["🌯 وجبة شاورما عربي دبل", "🍗 بروستد 4 قطع", "🥖 ساندويش زنجر", "🥤 مشروب كينزا"].map(
          (item) => (
            <button
              key={item}
              onClick={() => handleSend(item)}
              className="shrink-0 text-xs bg-[#1A1A1A] text-gray-300 border border-[#D4AF37]/30 px-3 py-1.5 rounded-full hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
            >
              {item}
            </button>
          )
        )}
      </div>

      {/* Input / Voice Bar */}
      <footer className="p-3 bg-[#1A1A1A] border-t border-[#D4AF37]/30 sticky bottom-0">
        <div className="flex items-center gap-2">
          {/* Microphone Button */}
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full border transition-all shrink-0 ${
              isRecording
                ? "bg-red-600 text-white border-red-500 animate-pulse"
                : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black"
            }`}
            title="انقر للتحدث بالصوت"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isRecording ? "جاري الاستماع لصوتك..." : "اكتب طلبك هنا..."}
            className="flex-1 bg-[#0F0F0F] text-white placeholder-gray-500 text-sm px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-[#D4AF37] transition-all"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            className="bg-[#D4AF37] text-black p-2.5 rounded-full hover:bg-[#B8952B] transition-all shrink-0 font-bold"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </footer>
    </main>
  );
}
