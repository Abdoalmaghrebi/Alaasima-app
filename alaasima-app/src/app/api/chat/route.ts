import { NextResponse } from "next/server";
import { MENU_DATA } from "@/data/menu";

const systemPrompt = `
أنت "كاشير رقمي" ودود ولطيف لمطعم "مأكولات العاصمة" في سيدي مقداد - ريف دمشق.
تتحدث فقط باللهجة الشامية العفوية والمهذبة (مثل: "أهلاً وسهلاً أخي"، "تكرم عينك"، "شو بتحب تطلب اليوم؟").

قائمة الطعام والأسعار المتوفرة لديك:
${MENU_DATA.map((i) => `- ${i.name}: ${i.price} ليرة سورية (${i.description || ""})`).join("\n")}

مناطق التوصيل: يلدا، ببيلا، سيدي مقداد، جرمانا.

مهامك أثناء المكالمة:
1. متابعة الحوار مع الزبون وفهم طلباته بناءً على الرسائل السابقة.
2. اقتراح إضافة سرافيس أو مشروبات (مثل ثوم، مخلل، كينزا).
3. تأكيد الطلب والسعر الإجمالي وحساب منطقة التوصيل عند إنهاء الطلب.
4. الإجابة باختصار شديد ومباشر دون إطالة (2-3 جمل في كل رد).
`;

export async function POST(req: Request) {
  try {
    const { userSpeech, history } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    let aiReply = "تكرم عينك، وصل طلبك! حابب تضيف شي ثانٍ من القائمة؟";

    // بناء سجل المحادثة لـ Gemini
    if (userSpeech && geminiKey) {
      try {
        const contents = [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [{ text: "أهلاً وسهلاً بك في مأكولات العاصمة! تفضل شو بتحب تطلب اليوم؟" }],
          },
        ];

        // إضافة الرسائل السابقة إن وجدت
        if (Array.isArray(history)) {
          history.forEach((msg: { sender: string; text: string }) => {
            contents.push({
              role: msg.sender === "user" ? "user" : "model",
              parts: [{ text: msg.text }],
            });
          });
        }

        // إضافة رسالة الزبون الحالية
        contents.push({
          role: "user",
          parts: [{ text: userSpeech }],
        });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
          }
        );

        const geminiData = await geminiRes.json();
        if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiReply = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        console.error("Gemini Error:", e);
      }
    }

    // توليد الصوت عبر ElevenLabs
    if (elevenKey) {
      try {
        const elevenRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": elevenKey,
            },
            body: JSON.stringify({
              text: aiReply,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (elevenRes.ok) {
          const audioBuffer = await elevenRes.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "X-Ai-Reply-Text": encodeURIComponent(aiReply),
            },
          });
        }
      } catch (e) {
        console.error("ElevenLabs Error:", e);
      }
    }

    return NextResponse.json({ replyText: aiReply });
  } catch (error) {
    return NextResponse.json({ error: "خطأ بالسيرفر" }, { status: 500 });
  }
}
