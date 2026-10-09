"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";

export default function Home() {
  const [callState, setCallState] = useState<"idle" | "connecting" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCallingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

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
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-SY";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = async (event: any) => {
          if (isProcessingRef.current) return;
          const userSpeech = event.results[0][0].transcript;
          setTranscript(userSpeech);
          await processUserSpeech(userSpeech);
        };

        recognition.onerror = () => {
          if (isCallingRef.current && !isProcessingRef.current) {
            safeStartRecognition();
          }
        };

        recognition.onend = () => {
          if (
            isCallingRef.current &&
            !isProcessingRef.current &&
            (!audioRef.current || audioRef.current.paused)
          ) {
            safeStartRecognition();
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const safeStartRecognition = () => {
    if (recognitionRef.current && isCallingRef.current && !isProcessingRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setTimeout(() => {
        try {
          recognitionRef.current.start();
          setAiStatus("عم أسمعك.. تفضل احكي");
        } catch (e) {}
      }, 100);
    }
  };

  const processUserSpeech = async (userSpeech: string) => {
    if (!userSpeech.trim()) return;

    isProcessingRef.current = true;
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

      const contentType = res.headers.get("Content-Type") || "";

      if (contentType.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        setAiStatus("الكاشير يتحدث الآن...");
        audio.onended = () => {
          isProcessingRef.current = false;
          setAiStatus("عم أسمعك.. تفضل احكي");
          safeStartRecognition();
        };

        await audio.play();
      } else {
        isProcessingRef.current = false;
        setAiStatus("عم أسمعك.. تفضل احكي");
        safeStartRecognition();
      }
    } catch (err) {
      console.error(err);
      isProcessingRef.current = false;
      setAiStatus("حدث خطأ في الاتصال بالسيرفر...");
      safeStartRecognition();
    }
  };

  const startCall = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("يرجى إعطاء إذن الميكروفون للمتصفح.");
      return;
    }

    isCallingRef.current = true;
    isProcessingRef.current = false;
    setCallState("connecting");

    setTimeout(async () => {
      setCallState("active");
      await processUserSpeech("مرحبا أهلاً وسهلاً");
    }, 1000);
  };

  const endCall = () => {
    isCallingRef.current = false;
    isProcessingRef.current = false;
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
            <p className="text-[10px] text-gray-400">طلب مباشر بالذكاء الاصطناعي</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
          <Sparkles className="w-3 h-3" />
          <span>الكاشير الرقمي</span>
        </div>
      </header>

      {/* Main Call View */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative">
          {callState === "active" && (
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 animate-ping scale-150 pointer-events-none" />
          )}
          <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] bg-[#1A1A1A] flex flex-col items-center justify-center shadow-2xl relative z-10">
            <span className="text-4xl font-bold text-[#D4AF37]">ع</span>
            <span className="text-[10px] text-gray-400 mt-1">مأكولات العاصمة</span>
          </div>
        </div>

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
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full border transition-all ${
                isMuted
                  ? "bg-red-500/20 text-red-500 border-red-500"
                  : "bg-white/10 text-white border-white/20"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-lg transition-all"
            >
              <PhoneOff className="w-7 h-7 fill-current" />
            </button>
          </div>
        )}
      </footer>
    </main>
  );
        }
