import type { NextApiRequest, NextApiResponse } from 'next';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { imageBase64, anchorText, taskType } = req.body;

    const PROMPTS_SYS = {
        "default": (base_text: string) => (
            `Below is an image of a document page along with its dimensions. ` +
            `Simply return the markdown representation of this document, presenting tables in markdown format as they naturally appear.\n` +
            `If the document contains images, use a placeholder like dummy.png for each image.\n` +
            `Your final output must be in JSON format with a single key \`natural_text\` containing the response.\n` +
            `RAW_TEXT_START\n${base_text}\nRAW_TEXT_END`
        ),
        "structure": (base_text: string) => (
            `Below is an image of a document page, along with its dimensions and possibly some raw textual content previously extracted from it. ` +
            `Note that the text extraction may be incomplete or partially missing. Carefully consider both the layout and any available text to reconstruct the document accurately.\n` +
            `Your task is to return the markdown representation of this document, presenting tables in HTML format as they naturally appear.\n` +
            `If the document contains images or figures, analyze them and include the tag <figure>IMAGE_ANALYSIS</figure> in the appropriate location.\n` +
            `Your final output must be in JSON format with a single key \`natural_text\` containing the response.\n` +
            `RAW_TEXT_START\n${base_text}\nRAW_TEXT_END`
        ),
        "mileage_only": (base_text: string) => (
            `Below is an image of a document page along with its dimensions. ` +
            `Extract and return only the odometer number (ODO) found in the image. Do not include any other text or explanation.\n` +
            `If the document contains images, use a placeholder like dummy.png for each image.\n` +
            `Your final output must be in JSON format with a single key \`natural_text\` containing the response.\n` +
            `RAW_TEXT_START\n${base_text}\nRAW_TEXT_END`
        ),
        "summary": (base_text: string) => (
            `Below is an image of a document page along with its dimensions. ` +
            `Extract and summarize only the key financial figures from the document such as total revenue, total expenses, net profit/loss, or any clearly indicated summary amounts. `+
            `If the document contains images, use a placeholder like dummy.png for each image.\n` +
            `Your final output must be in JSON format with a single key \`natural_text\` containing the response.\n` +
            `RAW_TEXT_START\n${base_text}\nRAW_TEXT_END`
        ),
    };

    const promptFn = PROMPTS_SYS[taskType as keyof typeof PROMPTS_SYS];
    if (!promptFn) {
        res.status(400).json({ error: 'Invalid taskType' });
        return;
    }

    const prompt = promptFn(anchorText);

    try {
        const response = await fetch("https://api.opentyphoon.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.TYPHOON_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.TYPHOON_OCR_MODEL || "typhoon-ocr-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } },
                        ],
                    },
                ],
                max_tokens: 4096,
                temperature: 0,
                top_p: 1,
                repetition_penalty: 1.0,
            }),
        });

        const result = await response.json();
        res.status(200).json(result);
    } catch (error) {
        console.error('OCR error:', error);
        res.status(500).json({ error: 'OCR processing failed' });
    }
}
