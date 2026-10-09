import { NextResponse } from "next/server";
import { MENU_DATA } from "@/data/menu";

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

export async function POST(req: Request) {
  try {
    const { userSpeech, isGreeting } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    let aiReply = "أهلاً وسهلاً فيك. مأكولات العاصمة! تفضل شو طلبك";

    // إذا لم يكن طلب ترحيب أولي، نرسل كلام الزبون لـ Gemini
    if (!isGreeting && userSpeech && geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemPrompt },
                    { text: `الزبون يقول: "${userSpeech}"` },
                  ],
                },
              ],
            }),
          }
        );
        const geminiData = await geminiRes.json();
        if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiReply = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        console.error("Gemini Error:", e);
        aiReply = `تكرم عينك! سجّلت طلبك: "${userSpeech}". حابب تضيف مشروب كينزا أو صحن بطاطا مع الطلب؟`;
      }
    }

    // تحويل الرد إلى صوت عبر ElevenLabs
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
