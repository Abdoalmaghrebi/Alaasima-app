"use client";

import { useState, useEffect } from "react";
import { Phone, MapPin, Mic, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "أهلاً بك في مأكولات العاصمة! 🌯 كيف بقدر أساعدك بالطلب اليوم؟ شو حابب تطلب؟",
      time: "الآن",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // تحديث وقت أول رسالة بعد التحميل في المتصفح
  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString("ar-SY", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === "1" ? { ...m, time: currentTime } : m))
    );
  }, []);

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

    // رد تجريبي مبدئي
    setTimeout(() => {
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: `تكرم عينك! سجّلت طلبك: "${text}". حابب تضيف علبة ثوم أو مخلل أو مشروب مع الطلب؟`,
        time: new Date().toLocaleTimeString("ar-SY", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
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
              className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#D4AF37] text-black font-medium rounded-tr-none"
                  : "bg-[#1A1A1A] text-gray-100 border border-[#D4AF37]/30 rounded-tl-none shadow-md"
              }`}
            >
              <p>{msg.text}</p>
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
        {["🌯 وجبة شاورما عربي", "🍗 بروستد 4 قطع", "🥖 ساندويش دبل", "🥗 صحن فتة"].map((item) => (
          <button
            key={item}
            onClick={() => handleSend(item)}
            className="shrink-0 text-xs bg-[#1A1A1A] text-gray-300 border border-[#D4AF37]/30 px-3 py-1.5 rounded-full hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
          >
            {item}
          </button>
        ))}
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
            title="طلب بالصوت"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="اكتب طلبك هنا (مثلاً: 2 شاورما عربي دبل)..."
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
