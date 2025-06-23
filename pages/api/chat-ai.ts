export async function POST(req: Request) {
  const { prompt, base64Image } = await req.json();

  try {
    const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer hf_xxxxxxxxxxxxx`, // ใส่ API Key ของคุณ
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'novita',
        model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt || 'Describe this image in one sentence.' },
              base64Image
                ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                : null,
            ].filter(Boolean),
          },
        ],
      }),
    });

    const data = await res.json();

    return Response.json({
      text: data?.choices?.[0]?.message?.content || 'ไม่สามารถสรุปข้อมูลได้',
    });
  } catch (error) {
    console.error('[HuggingFace Error]', error);
    return Response.json({ text: 'เกิดข้อผิดพลาดในการเรียก AI' }, { status: 500 });
  }
}
