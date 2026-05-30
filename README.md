# InMarket — Smart POS & Business Assistant for Indonesian UMKM

InMarket is an advanced, gamified, and offline-resilient Point of Sale (POS) application integrated with dynamic calendar agendas, real-time analytics dashboards, and an AI-driven smart business assistant powered directly by Gemini.

## 🚀 Easy Local Setup Instructions

Follow these clear steps to set up and run the application on your local machine:

### 1. Configure Your Environment Variables
First, copy the local environment template file to create your active `.env.local`:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and configure your credentials:
1. **GEMINI_API_KEY**: Retrieve your API key from [Google AI Studio](https://aistudio.google.com/).
2. **Firebase Configuration**: Set up a web app in your Firebase Console and paste the provided key/config values:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

---

### 2. Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

---

### 3. Star the Development Server
Once the details are filled, boot the full-stack server locally with:
```bash
npm run dev
```
The application will listen on [http://localhost:3000](http://localhost:3000).

---

## 🛠 Features Breakdown

- **AI Business Consultant**: Dynamic prompt grounding using live product levels, daily profits, and target revenues directly calling Gemini-2.5-flash.
- **Voice AI Assistant**: Offline pattern matcher coupled with real-time fallback queries via the Gemini API.
- **Gamified Employee Tiers**: Employee check-in mechanics tied with levels, exp scales, and real-time attendance logs.
- **Robust Offline Fallback**: Complete offline-first support using localized caching for products, expenses, login registers, and sales history.
- **Premium Design Philosophy**: Holographic cards, clean glassmorphism accents, and smooth transitions paired with Inter & JetBrains Mono typography.
