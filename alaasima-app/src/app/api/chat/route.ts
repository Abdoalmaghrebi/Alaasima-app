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
    const { userSpeech } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    // 1. طلب النص من Gemini API
    let aiReply = "تكرم عينك، سجّلت طلبك! حابب تضيف شي ثانٍ؟";

    if (geminiKey) {
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
      aiReply =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || aiReply;
    }

    // 2. تحويل رد Gemini إلى صوت بشري باستخدام ElevenLabs API
    if (elevenKey) {
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
    }

    // بحال لم يتوفر المفتاح
    return NextResponse.json({ replyText: aiReply });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
