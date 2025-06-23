export default async function handler(req, res) {
  const { base64Image } = req.body;

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_AI_KEY_API}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Google API Error:', data.error);
      return res.status(400).json({ error: data.error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Google Vision API failed' });
  }
}
