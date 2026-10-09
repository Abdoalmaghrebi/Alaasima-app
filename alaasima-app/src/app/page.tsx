import { Phone, MapPin, Sparkles, Utensils } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white pb-20 dir-rtl">
      {/* Header / الهيدر الرئيسي */}
      <header className="sticky top-0 z-50 bg-[#0F0F0F]/90 backdrop-blur-md border-b border-[#D4AF37]/30 px-4 py-3 flex items-center justify-between shadow-lg">
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

      {/* Hero Section */}
      <section className="p-6 text-center border-b border-white/5 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>خدمة الطلب المباشر بالذكاء الاصطناعي</span>
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">طلبك عم يوصل هلق!</h2>
        <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
          أطلب شاورما، بروستد، أو وجبات غريية بصوتك أو بالكتابة مباشرة.
        </p>
        
        <div className="flex items-center justify-center gap-1 text-xs text-[#D4AF37]">
          <MapPin className="w-3.5 h-3.5" />
          <span>يلدا - ببيلا - سيدي مقداد - جرمانا</span>
        </div>
      </section>

      {/* حالة الانتظار لبناء المحادثة */}
      <section className="p-4 max-w-md mx-auto mt-6 text-center">
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/20 flex flex-col items-center gap-3">
          <Utensils className="w-8 h-8 text-[#D4AF37] animate-pulse" />
          <p className="text-sm text-gray-300">جاري تجهيز واجهة المحادثة الصوتية والكتابية...</p>
        </div>
      </section>
    </main>
  );
}
