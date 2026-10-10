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
    const { userSpeech, isGreeting, history } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    let aiReply = "أهلاً وسهلاً بك في مأكولات العاصمة! تفضل شو بتحب تطلب اليوم؟";
    let geminiStatus = "Greeting Default";

    if (!isGreeting && userSpeech) {
      if (geminiKey) {
        const contents = [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "أهلاً وسهلاً بك في مأكولات العاصمة! تفضل شو بتحب تطلب اليوم؟" }] }
        ];

        if (Array.isArray(history)) {
          history.forEach((msg: { sender: string; text: string }) => {
            contents.push({
              role: msg.sender === "user" ? "user" : "model",
              parts: [{ text: msg.text }],
            });
          });
        }

        contents.push({ role: "user", parts: [{ text: userSpeech }] });

        // قائمة النماذج المتاحة بالتسلسل
        const candidateModels = [
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-2.0-flash-exp"
        ];

        let success = false;

        for (const model of candidateModels) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiReply = geminiData.candidates[0].content.parts[0].text;
                geminiStatus = `Gemini (${model}) - Success 200`;
                success = true;
                break;
              }
            } else {
              const errData = await geminiRes.json();
              geminiStatus = `Failed ${model}: ${errData?.error?.message || geminiRes.status}`;
            }
          } catch (e: any) {
            geminiStatus = `Exception ${model}: ${e.message}`;
          }
        }

        if (!success) {
          aiReply = `تكرم عينك أخي! سجّلت طلبك: "${userSpeech}". حابب تضيف كينزا أو صحن بطاطا مع الطلب؟`;
        }
      } else {
        geminiStatus = "Missing GEMINI_API_KEY";
        aiReply = `تكرم عينك! سجّلت طلبك: "${userSpeech}".`;
      }
    }

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
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          }
        );

        if (elevenRes.ok) {
          const audioBuffer = await elevenRes.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "X-Ai-Reply-Text": encodeURIComponent(aiReply),
              "X-Gemini-Status": encodeURIComponent(geminiStatus),
            },
          });
        }
      } catch (e) {}
    }

    return NextResponse.json(
      { replyText: aiReply, geminiStatus },
      { headers: { "X-Gemini-Status": encodeURIComponent(geminiStatus) } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
