"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Sparkles, ShoppingBag, Volume2 } from "lucide-react";
import { MENU_DATA } from "@/data/menu";

export default function Home() {
  const [callState, setCallState] = useState<"idle" | "connecting" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<string>("");
  const [lastOrderSummary, setLastOrderSummary] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // تعليمات الكاشير الرقمي الموجهة لـ Gemini
  const systemPrompt = `
أنت "كاشير رقمي" ودود ولطيف لمطعم "مأكولات العاصمة" في سيدي مقداد - ريف دمشق.
تتحدث فقط باللهجة الشامية العفوية والمهذبة (مثل: "أهلاً وسهلاً أخي"، "تكرم عينك"، "شو بتحب تطلب اليوم؟").

قائمة الطعام والأسعار المتوفرة لديك:
${MENU_DATA.map((i) => `- ${i.name}: ${i.price} ليرة سورية (${i.description || ""})`).join("\n")}

مناطق التوصيل: يلدا، ببيلا، سيدي مقداد، جرمانا.

مهامك أثناء المكالمة:
1. الترحيب بالزبون وأخذ طلبه.
2. اقتراح إضافة سرافيس أو مشروبات (مثل ثوم، مخلل، كينزا).
3. تأكيد الطلب والسعر الإجمالي وحساب منطقة التوصيل.
4. الإجابة باختصار شديد ومباشر دون إطالة ليناسب المكالمة الصوتية (لا تتجاوز 2-3 جمل في كل رد).
`;

  // إدارة مؤقت المكالمة
  useEffect(() => {
    let timer: any;
    if (callState === "active") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // إعداد المحرك الصوتي في المتصفح
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-SY"; // أو ar-SA
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = async (event: any) => {
          const lastIndex = event.results.length - 1;
          const userSpeech = event.results[lastIndex][0].transcript;
          setTranscript(userSpeech);
          await processUserSpeechWithGemini(userSpeech);
        };

        recognition.onerror = () => {
          setAiStatus("تعذر الاستماع، يرجى المحاولة مرّة أخرى...");
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // التحدث بصوت الكاشير (Text to Speech)
  const speakText = (text: string, onEnd?: () => void) => {
  if (!synthRef.current) return;
  synthRef.current.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // البحث عن أصوات طبيعية محسّنة بدلاً من الصوت الآلي الافتراضي
  const voices = synthRef.current.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.lang.includes("ar") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Online")))
  );

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.lang = "ar-SY";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => setAiStatus("الكاشير يتحدث الآن...");
  utterance.onend = () => {
    setAiStatus("بانتظار حديثك...");
    if (onEnd) onEnd();
  };

  synthRef.current.speak(utterance);
};


  // إرسال حديث الزبون إلى Gemini API
  const processUserSpeechWithGemini = async (userText: string) => {
    setAiStatus("جاري معالجة الطلب بالذكاء الاصطناعي...");

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      const fallbackReply = `تكرم عينك! سجّلت طلبك: "${userText}". حابب تضيف مشروب كينزا أو صحن بطاطا مع الطلب؟`;
      speakText(fallbackReply);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemPrompt },
                  { text: `الزبون يقول: "${userText}"` },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const aiReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "تكرم عينك، وصل طلبك! حابب تضيف شيء ثانٍ؟";

      speakText(aiReply);
    } catch (error) {
      console.error(error);
      speakText("تكرم عينك يا غالي، سجّلت طلبك! حابب نتأكد من العنوان للتوصيل؟");
    }
  };

  // بدء المكالمة
  const startCall = () => {
    setCallState("connecting");
    setTimeout(() => {
      setCallState("active");
      if (recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
      const welcomeMsg =
        "أهلاً وسهلاً فيك بمأكولات العاصمة! معك الكاشير الرقمي، تفضل شو بتحب تطلب اليوم؟";
      speakText(welcomeMsg);
    }, 1500);
  };

  // إنهاء المكالمة
  const endCall = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setCallState("idle");
    setAiStatus("");
    setTranscript("");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white flex flex-col justify-between max-w-md mx-auto dir-rtl border-x border-white/5 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#1A1A1A]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border border-[#D4AF37] bg-[#0F0F0F] flex items-center justify-center font-bold text-[#D4AF37] text-sm">
            ع
          </div>
          <div>
            <h1 className="font-bold text-[#D4AF37] text-sm leading-tight">مأكولات العاصمة</h1>
            <p className="text-[10px] text-gray-400">محاكاة المكالمة الصوتية المباشرة</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
          <Sparkles className="w-3 h-3" />
          <span>Gemini AI Call</span>
        </div>
      </header>

      {/* Main Call View */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        {/* Avatar with Radar Waves */}
        <div className="relative">
          {callState === "active" && (
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 animate-ping scale-150 pointer-events-none" />
          )}
          <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] bg-[#1A1A1A] flex flex-col items-center justify-center shadow-2xl relative z-10">
            <span className="text-4xl font-bold text-[#D4AF37]">ع</span>
            <span className="text-[10px] text-gray-400 mt-1">مأكولات العاصمة</span>
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">الكاشير الرقمي الذكي</h2>
          {callState === "idle" && (
            <p className="text-xs text-gray-400">انقر على زر الاتصال لبدء المكالمة والطلب بالصوت</p>
          )}
          {callState === "connecting" && (
            <p className="text-xs text-[#D4AF37] animate-pulse">جاري الاتصال بمطعم العاصمة...</p>
          )}
          {callState === "active" && (
            <div>
              <p className="text-sm font-semibold text-[#D4AF37]">{formatDuration(callDuration)}</p>
              <p className="text-xs text-gray-300 mt-1 flex items-center justify-center gap-1">
                <Volume2 className="w-3.5 h-3.5 animate-bounce text-[#D4AF37]" />
                <span>{aiStatus || "المكالمة نشطة..."}</span>
              </p>
            </div>
          )}
        </div>

        {/* Live Transcript Box */}
        {callState === "active" && transcript && (
          <div className="w-full bg-[#1A1A1A] border border-[#D4AF37]/30 p-3 rounded-2xl text-xs text-gray-200 animate-fade-in max-h-24 overflow-y-auto">
            <span className="text-[#D4AF37] font-bold block mb-1">سمعنا منك:</span>
            "{transcript}"
          </div>
        )}
      </section>

      {/* Call Controls Bar */}
      <footer className="p-6 bg-[#1A1A1A] border-t border-[#D4AF37]/20 rounded-t-3xl">
        {callState === "idle" ? (
          <button
            onClick={startCall}
            className="w-full bg-[#D4AF37] hover:bg-[#B8952B] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10 transition-all text-base"
          >
            <Phone className="w-5 h-5 fill-current" />
            <span>بدء مكالمة مع الكاشير</span>
          </button>
        ) : (
          <div className="flex items-center justify-around">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full border transition-all ${
                isMuted
                  ? "bg-red-500/20 text-red-500 border-red-500"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-lg transition-all"
              title="إنهاء المكالمة"
            >
              <PhoneOff className="w-7 h-7 fill-current" />
            </button>
          </div>
        )}
      </footer>
    </main>
  );
}
