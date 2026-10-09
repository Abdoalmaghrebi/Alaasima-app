"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Sparkles, Volume2, Bug, Send } from "lucide-react";

export default function Home() {
  const [callState, setCallState] = useState<"idle" | "connecting" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<string>("");
  const [manualText, setManualText] = useState<string>("");

  // سجل التصحيح (Debug Logs)
  const [logs, setLogs] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCallingRef = useRef<boolean>(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
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

  // إعداد الصوت والتعرف
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        addLog("❌ المتصفح لا يدعم Web Speech API");
      } else {
        addLog("✅ تم إعداد Web Speech API بنجاح");
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-SY";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          addLog("🎙️ المايك يكتشف الصوت الآن...");
        };

        recognition.onresult = async (event: any) => {
          const userSpeech = event.results[0][0].transcript;
          addLog(`🗣️ تم التقاط الصوت: "${userSpeech}"`);
          setTranscript(userSpeech);
          await processUserSpeech(userSpeech);
        };

        recognition.onerror = (err: any) => {
          addLog(`⚠️ خطأ بالمايك: ${err.error}`);
          if (isCallingRef.current) {
            setAiStatus("عم أسمعك.. احكي تفضل");
          }
        };

        recognition.onend = () => {
          addLog("🛑 توقف المايك عن الاستماع");
          if (isCallingRef.current && (!audioRef.current || audioRef.current.paused)) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && isCallingRef.current) {
      try {
        recognitionRef.current.start();
        setAiStatus("عم أسمعك.. تفضل احكي");
      } catch (e) {
        addLog(`⚠️ فشل بدء الاستماع: ${e}`);
      }
    }
  };

  // إرسال الطلب للـ API
  const processUserSpeech = async (userSpeech: string) => {
    if (!userSpeech.trim()) return;

    addLog(`🚀 جاري إرسال النص لـ /api/chat...`);
    setAiStatus("جاري معالجة الطلب بذكاء العاصمة...");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSpeech }),
      });

      addLog(`📡 استجابة السيرفر Status: ${res.status}`);

      const contentType = res.headers.get("Content-Type") || "";

      if (contentType.includes("audio/mpeg")) {
        addLog("🔊 استلام ملف صوتي من ElevenLabs، جاري التشغيل...");
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        setAiStatus("الكاشير يتحدث الآن...");
        audio.onended = () => {
          addLog("🎵 انتهى الصوت، جاري إعادة المايك...");
          setAiStatus("عم أسمعك.. تفضل احكي");
          startListening();
        };

        await audio.play();
      } else {
        const data = await res.json();
        addLog(`📄 استلام رد نصي فقط: ${JSON.stringify(data)}`);
        setAiStatus("عم أسمعك.. تفضل احكي");
        startListening();
      }
    } catch (err: any) {
      addLog(`❌ خطأ في الاتصال: ${err.message}`);
      setAiStatus("حدث خطأ في الاتصال بالسيرفر...");
      startListening();
    }
  };

  const startCall = async () => {
    addLog("📞 طلب إذن الميكروفون...");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("✅ تم منح إذن الميكروفون");
    } catch (err: any) {
      addLog(`❌ تم رفض إذن المايك: ${err.message}`);
      alert("يرجى إعطاء إذن الميكروفون للمتصفح.");
      return;
    }

    isCallingRef.current = true;
    setCallState("connecting");

    setTimeout(async () => {
      setCallState("active");
      addLog("🎬 بدء المكالمة وإرسال الترحيب...");
      await processUserSpeech("مرحبا أهلاً وسهلاً");
    }, 1000);
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
    addLog("🔴 تم إنهاء المكالمة");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white flex flex-col justify-between max-w-md mx-auto dir-rtl border-x border-white/5 shadow-2xl relative overflow-hidden pb-10">
      {/* Header */}
      <header className="px-4 py-3 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#1A1A1A]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border border-[#D4AF37] bg-[#0F0F0F] flex items-center justify-center font-bold text-[#D4AF37] text-sm">
            ع
          </div>
          <div>
            <h1 className="font-bold text-[#D4AF37] text-sm leading-tight">مأكولات العاصمة</h1>
            <p className="text-[10px] text-gray-400">مكالمة صوتية بشرية + Debug</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
          <Bug className="w-3 h-3" />
          <span>Debug Mode</span>
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

        {/* حقل تجريبي لتجربة النص كتابة إذا المايك لم يلقط */}
        {callState === "active" && (
          <div className="w-full flex gap-2 my-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="اكتب تجربة يدوياً..."
              className="flex-1 bg-[#1A1A1A] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
            />
            <button
              onClick={() => {
                processUserSpeech(manualText);
                setManualText("");
              }}
              className="bg-[#D4AF37] text-black px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              إرسال
            </button>
          </div>
        )}

        {/* سجل الـ Debugging */}
        <div className="w-full bg-black/80 border border-[#D4AF37]/40 p-2.5 rounded-xl text-[11px] font-mono text-right text-green-400 h-40 overflow-y-auto space-y-1">
          <div className="text-gold font-bold border-b border-white/10 pb-1 flex justify-between">
            <span>سجل التصحيح اللحظي (Debug Logs):</span>
            <button onClick={() => setLogs([])} className="text-red-400 text-[10px]">
              مسح
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-gray-500">اضغط "بدء مكالمة" لمشاهدة التفاصيل...</p>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </section>

      {/* Call Controls Bar */}
      <footer className="p-4 bg-[#1A1A1A] border-t border-[#D4AF37]/20 rounded-t-3xl">
        {callState === "idle" ? (
          <button
            onClick={startCall}
            className="w-full bg-[#D4AF37] hover:bg-[#B8952B] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm"
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
