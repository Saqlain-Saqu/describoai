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

// ============================================
// SHOPIFY OAUTH - Install Route
// ============================================
app.get('/install', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Shop parameter required');

  const redirectUri = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  const scopes = process.env.SCOPES;
  const apiKey = process.env.SHOPIFY_API_KEY;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}`;
  res.redirect(installUrl);
});

// ============================================
// SHOPIFY OAUTH - Callback Route
// ============================================
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
    const accessToken = tokenData.access_token;

    // Production mein: accessToken ko database mein save karo
    // Abhi ke liye: query param mein pass kar rahe hain (sirf testing ke liye)
    res.redirect(`/?shop=${shop}&token=${accessToken}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// ============================================
// AI DESCRIPTION GENERATOR API
// ============================================
app.post('/api/generate', async (req, res) => {
  const { productName, keywords, language, tone, shop, token } = req.body;

  if (!productName) {
    return res.status(400).json({ error: 'Product name required' });
  }

  const languageMap = {
    english: 'English',
    urdu: 'Urdu (Roman + Nastaliq)',
    hindi: 'Hindi',
    arabic: 'Arabic',
    both: 'English aur Urdu dono mein (bilingual)',
  };

  const toneMap = {
    professional: 'professional aur formal',
    casual: 'friendly aur casual',
    luxury: 'luxury aur premium',
    exciting: 'exciting aur energetic',
  };

  const prompt = `Tum ek expert eCommerce copywriter ho. Neeche diye product ke liye ek compelling product description likho.

Product Name: ${productName}
Keywords: ${keywords || 'N/A'}
Language: ${languageMap[language] || 'English'}
Tone: ${toneMap[tone] || 'professional'}

Requirements:
- 3-4 sentences ka description
- Key features highlight karo
- Customer ko convince karo khareedne ke liye
- SEO-friendly rakho
- Agar Urdu/Hindi manga hai toh proper script use karo

Sirf description do, koi extra explanation nahi.`;

  try {
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiData = await aiResponse.json();
    const description = aiData.content?.[0]?.text || 'Description generate nahi ho saka. Dobara try karein.';

    res.json({ description });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'AI service error. Baad mein try karein.' });
  }
});

// ============================================
// SHOPIFY PRODUCT UPDATE API
// ============================================
app.post('/api/save-to-shopify', async (req, res) => {
  const { productId, description, shop, token } = req.body;

  if (!productId || !description || !shop || !token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products/${productId}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        product: {
          id: productId,
          body_html: `<p>${description}</p>`,
        },
      }),
    });

    const data = await response.json();
    if (data.product) {
      res.json({ success: true, message: 'Product description update ho gaya!' });
    } else {
      res.status(400).json({ error: 'Shopify update failed', details: data });
    }
  } catch (error) {
    console.error('Shopify save error:', error);
    res.status(500).json({ error: 'Save karne mein error aaya' });
  }
});

// ============================================
// PRODUCTS LIST API
// ============================================
app.get('/api/products', async (req, res) => {
  const { shop, token } = req.query;

  if (!shop || !token) {
    return res.status(400).json({ error: 'Shop and token required' });
  }

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=20`, {
      headers: { 'X-Shopify-Access-Token': token },
    });

    const data = await response.json();
    res.json(data.products || []);
  } catch (error) {
    res.status(500).json({ error: 'Products fetch nahi ho sake' });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   AI Product Description Writer       ║
║   Server chal raha hai port ${PORT} pe  ║
╚════════════════════════════════════════╝
  `);
});
