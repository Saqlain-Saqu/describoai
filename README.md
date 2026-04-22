# ✍️ AI Product Description Writer — Shopify App

Shopify merchants ke liye AI-powered product description generator.
**English, Urdu, Hindi, Arabic** — sab languages support karta hai!

---

## 🚀 Setup Kaise Karo (Step by Step)

### Step 1: Files Ready Karo
```bash
cd shopify-ai-app
npm install
```

### Step 2: .env File Banao
```bash
cp .env.example .env
```
Ab `.env` file open karo aur apni keys daalo:

### Step 3: Shopify Partner Dashboard
1. https://partners.shopify.com pe jao
2. **Apps** → **Create App** → **Custom App**
3. App URL: `https://localhost:3000` (development ke liye)
4. Redirect URL: `https://localhost:3000/auth/callback`
5. **API Key** aur **API Secret** copy karo → `.env` mein paste karo

### Step 4: Anthropic API Key (FREE credits milte hain)
1. https://console.anthropic.com pe jao
2. API Keys → Create New Key
3. `.env` mein `ANTHROPIC_API_KEY` mein paste karo

### Step 5: App Chalao
```bash
npm run dev
```
Browser mein jao: `http://localhost:3000`

---

## 💻 Testing Kaise Karo

**Development Store ke sath:**
1. Partners Dashboard → Stores → Add Development Store
2. Store banao (free hai)
3. Admin → Apps → Install your app

**Manual testing (bina OAuth ke):**
1. App open karo
2. Shop URL: `yourstore.myshopify.com`
3. Access Token: Shopify Admin → Settings → Apps → Private Apps → Create → copy token
4. Connect dabao

---

## 🌐 Production Pe Deploy Karna

### Option 1: Railway.app (Recommended - Easy & Cheap)
```bash
# railway.app pe account banao (free tier available)
npm install -g railway
railway login
railway init
railway up
```

### Option 2: Heroku
```bash
heroku create your-app-name
heroku config:set SHOPIFY_API_KEY=xxx ANTHROPIC_API_KEY=xxx
git push heroku main
```

### Option 3: VPS (DigitalOcean $6/month)
```bash
# Server pe yeh commands chalao:
git clone your-repo
npm install
# PM2 se run karo
npm install -g pm2
pm2 start server.js --name "shopify-app"
pm2 startup
```

---

## 📦 App Store Pe Submit Karna

1. Production URL set karo `.env` mein
2. Shopify Partners Dashboard → App → Distribution
3. **Public distribution** choose karo
4. App listing bharo (screenshots, description)
5. Submit for review (3-5 din lagte hain)

---

## 💰 Pricing Plans Setup

Shopify billing API use karo:
```javascript
// Recurring charge create karo
const charge = await shopify.api.billing.request({
  session,
  plan: {
    chargeName: "Pro Plan",
    amount: 29.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  isTest: true, // Testing ke liye true rakho
});
```

---

## 📁 Project Structure

```
shopify-ai-app/
├── server.js          # Main Express server
├── public/
│   └── index.html     # Frontend UI
├── package.json
├── .env.example       # Environment template
└── README.md
```

---

## 🆘 Common Problems

**"Cannot find module" error:**
```bash
npm install
```

**API key error:**
- `.env` file check karo
- Keys mein spaces na hon

**Shopify connection error:**
- Shop URL correct ho: `store.myshopify.com`
- Token mein `shpat_` prefix hona chahiye

---

## 📞 Support

Koi problem ho toh:
- Shopify Dev Docs: https://shopify.dev/docs/apps
- Anthropic Docs: https://docs.anthropic.com

---

**Banaya by:** Aap! 🎉
**Tech:** Node.js + Express + Anthropic AI + Shopify API
