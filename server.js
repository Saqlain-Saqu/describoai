import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/install', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Shop parameter required');
  const redirectUri = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SCOPES}&redirect_uri=${redirectUri}`;
  res.redirect(installUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;
  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });
    const tokenData = await tokenResponse.json();
    res.redirect(`/?shop=${shop}&token=${tokenData.access_token}`);
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});

app.post('/api/generate', async (req, res) => {
  const { productName, keywords, language, tone } = req.body;
  if (!productName) return res.status(400).json({ error: 'Product name required' });

  const languageMap = {
    english: 'English', urdu: 'Urdu', hindi: 'Hindi',
    arabic: 'Arabic', both: 'English aur Urdu dono mein',
  };
  const toneMap = {
    professional: 'professional aur formal', casual: 'friendly aur casual',
    luxury: 'luxury aur premium', exciting: 'exciting aur energetic',
  };

  const prompt = `Tum ek expert eCommerce copywriter ho. Product ke liye compelling description likho.
Product: ${productName}
Keywords: ${keywords || 'N/A'}
Language: ${languageMap[language] || 'English'}
Tone: ${toneMap[tone] || 'professional'}
3-4 sentences, SEO-friendly, sirf description do.`;

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await groqResponse.json();
    console.log('Groq response:', JSON.stringify(data));
    const description = data.choices?.[0]?.message?.content || 'Error aaya';
    res.json({ description });
  } catch (error) {
    console.error('Groq Error:', error);
    res.status(500).json({ error: 'AI service error' });
  }
});

app.post('/api/save-to-shopify', async (req, res) => {
  const { productId, description, shop, token } = req.body;
  if (!productId || !description || !shop || !token)
    return res.status(400).json({ error: 'Missing required fields' });
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products/${productId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ product: { id: productId, body_html: `<p>${description}</p>` } }),
    });
    const data = await response.json();
    if (data.product) res.json({ success: true });
    else res.status(400).json({ error: 'Save failed' });
  } catch (error) {
    res.status(500).json({ error: 'Save error' });
  }
});

app.get('/api/products', async (req, res) => {
  const { shop, token } = req.query;
  if (!shop || !token) return res.status(400).json({ error: 'Missing params' });
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=20`, {
      headers: { 'X-Shopify-Access-Token': token },
    });
    const data = await response.json();
    res.json(data.products || []);
  } catch (error) {
    res.status(500).json({ error: 'Fetch error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DescriboAI running on port ${PORT}`);
});