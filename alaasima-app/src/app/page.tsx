"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Sparkles, Volume2, Send, Bug } from "lucide-react";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export default function Home() {
  const [callState, setCallState] = useState<"idle" | "connecting" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // سجل التصحيح المباشر (Debug Console)
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCallingRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 14)]);
  };

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        addLog("🎙️ Web Speech API متوفر في المتصفح");
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-SY";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          addLog("🟢 المايك يستمع الآن...");
        };

        recognition.onresult = async (event: any) => {
          const userSpeech = event.results[0][0].transcript;
          addLog(`🗣️ المايك التقط: "${userSpeech}"`);
          if (userSpeech && userSpeech.trim()) {
            setTranscript(userSpeech);
            await sendMessage(userSpeech);
          }
        };

        recognition.onerror = (err: any) => {
          addLog(`⚠️ خطأ المايك: ${err.error}`);
        };

        recognition.onend = () => {
          addLog("🔴 توقف المايك عن الاستماع");
          if (isCallingRef.current && (!audioRef.current || audioRef.current.paused)) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
      } else {
        addLog("❌ المتصفح لا يدعم Web Speech API");
      }
    }
  }, [chatHistory]);

  const sendGreetingCall = async () => {
    setAiStatus("جاري الاتصال بالكاشير...");
    addLog("📞 طلب الترحيب الأولي من السيرفر...");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGreeting: true }),
      });

      const contentType = res.headers.get("Content-Type") || "";
      const replyHeader = res.headers.get("X-Ai-Reply-Text");
      const geminiStatus = res.headers.get("X-Gemini-Status");
      const replyText = replyHeader ? decodeURIComponent(replyHeader) : "أهلاً وسهلاً بك بمأكولات العاصمة!";

      if (geminiStatus) addLog(`🤖 حالة Gemini: ${decodeURIComponent(geminiStatus)}`);

      setChatHistory([{ sender: "bot", text: replyText }]);

      if (contentType.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);

        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        setAiStatus("الكاشير يتحدث الآن...");
        audio.onended = () => {
          setAiStatus("عم أسمعك.. تفضل احكي");
          if (recognitionRef.current && isCallingRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        };

        await audio.play();
      } else {
        setAiStatus("عم أسمعك.. تفضل احكي");
      }
    } catch (e: any) {
      addLog(`❌ خطأ اتصال السيرفر: ${e.message}`);
      setAiStatus("عم أسمعك.. تفضل احكي");
    }
  };

  const sendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    addLog(`🚀 إرسال النص لـ Gemini: "${userText}"`);
    setAiStatus("جاري معالجة طلبك بذكاء العاصمة...");

    const updatedHistory = [...chatHistory, { sender: "user" as const, text: userText }];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSpeech: userText, history: chatHistory }),
      });

      const contentType = res.headers.get("Content-Type") || "";
      const replyHeader = res.headers.get("X-Ai-Reply-Text");
      const geminiStatus = res.headers.get("X-Gemini-Status");
      const replyText = replyHeader ? decodeURIComponent(replyHeader) : "تكرم عينك!";

      if (geminiStatus) addLog(`🤖 حالة Gemini: ${decodeURIComponent(geminiStatus)}`);

      setChatHistory([...updatedHistory, { sender: "bot", text: replyText }]);

      if (contentType.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);

        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        setAiStatus("الكاشير يتحدث الآن...");
        audio.onended = () => {
          setAiStatus("عم أسمعك.. تفضل احكي");
          if (recognitionRef.current && isCallingRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        };

        await audio.play();
      } else {
        setAiStatus("عم أسمعك.. تفضل احكي");
      }
    } catch (err: any) {
      addLog(`❌ خطأ بالاتصال: ${err.message}`);
      setAiStatus("حدث خطأ بالاتصال...");
    }
  };

  const startCall = async () => {
    addLog("📱 طلب إذن الميكروفون...");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("✅ تم إعطاء إذن الميكروفون بنجاح");
    } catch (err: any) {
      addLog(`❌ رفض إذن المايك: ${err.message}`);
      alert("يرجى إعطاء إذن الميكروفون للمتصفح.");
      return;
    }

    isCallingRef.current = true;
    setCallState("connecting");
    setChatHistory([]);

    setTimeout(async () => {
      setCallState("active");
      await sendGreetingCall();
    }, 800);
  };

  const endCall = () => {
    isCallingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setCallState("idle");
    setAiStatus("");
    setTranscript("");
    setChatHistory([]);
    addLog("🔴 تم إنهاء المكالمة");
  };

  const handleManualSend = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setTranscript(text);
    setInputText("");
    sendMessage(text);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white flex flex-col justify-between max-w-md mx-auto dir-rtl border-x border-white/5 shadow-2xl relative overflow-hidden pb-6">
      {/* Header */}
      <header className="px-4 py-3 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#1A1A1A]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border border-[#D4AF37] bg-[#0F0F0F] flex items-center justify-center font-bold text-[#D4AF37] text-sm">
            ع
          </div>
          <div>
            <h1 className="font-bold text-[#D4AF37] text-sm leading-tight">مأكولات العاصمة</h1>
            <p className="text-[10px] text-gray-400">طلب مباشر + Debugging</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
          <Bug className="w-3 h-3" />
          <span>Debug Console</span>
        </div>
      </header>

      {/* Main Call View */}
      <section className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="relative">
          {callState === "active" && (
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 animate-ping scale-150 pointer-events-none" />
          )}
          <div className="w-28 h-28 rounded-full border-4 border-[#D4AF37] bg-[#1A1A1A] flex flex-col items-center justify-center shadow-2xl relative z-10">
            <span className="text-3xl font-bold text-[#D4AF37]">ع</span>
            <span className="text-[9px] text-gray-400 mt-1">مأكولات العاصمة</span>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">الكاشير الرقمي الذكي</h2>
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

        {callState === "active" && (
          <div className="w-full flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSend()}
              placeholder="اكتب طلبك هنا لتجربة Gemini..."
              className="flex-1 bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={handleManualSend}
              className="bg-[#D4AF37] text-black px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}

        {/* Debug Log Box */}
        <div className="w-full bg-black/90 border border-[#D4AF37]/40 p-2.5 rounded-xl text-[11px] font-mono text-right text-green-400 h-36 overflow-y-auto space-y-1">
          <div className="text-gold font-bold border-b border-white/10 pb-1 flex justify-between">
            <span>سجل الفحص اللحظي (Debug Logs):</span>
            <button onClick={() => setDebugLogs([])} className="text-red-400 text-[10px]">
              مسح
            </button>
          </div>
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">اضغط "بدء مكالمة" لمشاهدة حالة المايك و Gemini...</p>
          ) : (
            debugLogs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </section>

      {/* Call Controls Bar */}
      <footer className="p-4 bg-[#1A1A1A] border-t border-[#D4AF37]/20 rounded-t-3xl">
        {callState === "idle" ? (
          <button
            onClick={startCall}
            className="w-full bg-[#D4AF37] hover:bg-[#B8952B] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10 transition-all text-sm"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>بدء مكالمة مع الكاشير</span>
          </button>
        ) : (
          <div className="flex items-center justify-around">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full border transition-all ${
                isMuted
                  ? "bg-red-500/20 text-red-500 border-red-500"
                  : "bg-white/10 text-white border-white/20"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all"
            >
              <PhoneOff className="w-6 h-6 fill-current" />
            </button>
          </div>
        )}
      </footer>
    </main>
  );
}
