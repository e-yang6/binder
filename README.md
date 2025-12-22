# binder.
** Swipe your way to the perfect marketplace deal  
** AI-powered negotiation assistant for smart shopping  

Overview
--------

Ever wish you could browse marketplace listings like Tinder, with AI that helps you negotiate better deals?  
Traditional marketplace apps are cluttered and negotiation can be awkward.  
That's why we built binder.: a Tinder-style marketplace browser with AI-powered negotiation coaching.

binder. combines web scraping, AI reasoning, and an intuitive swipe interface to help you discover great deals and negotiate like a pro. Swipe through Kijiji listings, save items to your watchlist, and get AI-powered message suggestions to help you close the deal.


Features
--------

Core Capabilities  
- Swipe Interface: Browse marketplace listings with an intuitive Tinder-style swipe interface.  
- AI Recommendations: Get intelligent left/right swipe suggestions based on your preferences.  
- Price Estimation: AI-powered price analysis for better deal evaluation.  
- Message Coach: Real-time negotiation assistance with personalized message suggestions.  
- Watchlist: Save interesting items for later review.  
- Real-time Scraping: Live updates from Kijiji as you browse.  

Technical Features  
- Smart Filtering: Filter by price, quality, location, and more.  
- Multi-style Messaging: Choose from polite, balanced, or direct communication styles.  
- Deal Analysis: Get risk assessments and negotiation tactics.  
- Background Processing: Non-blocking scraping with real-time CSV updates.  
- Responsive Design: Works seamlessly on mobile and desktop.

Architecture
------------

binder. connects multiple systems into a unified marketplace experience:

User Search → Kijiji Scraper → CSV Storage → AI Analysis → Swipe Interface → Message Coach → Watchlist  

(Add a system diagram here, e.g., docs/images/system-diagram.png)


Tech Stack
-----------

| Category | Technologies |
|-----------|---------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS |
| AI & ML | Google Gemini API, AI-powered recommendations |
| Backend | Python 3.14, Selenium 4.15, BeautifulSoup 4 |
| Data Storage | CSV files (lightweight, no database required) |
| Build Tools | Vite with custom CSV API plugin |
| State Management | React Hooks (useState, useEffect, useCallback) |

How It Works
------------

1. Search & Scrape – User enters search query, system instantly loads existing results and triggers background scraper.  
2. AI Analysis – Google Gemini analyzes listings and provides swipe recommendations based on preferences.  
3. Swipe Interface – Users swipe left (pass) or right (save) through listings with smooth animations.  
4. Message Coaching – AI generates personalized message suggestions for negotiating with sellers.  
5. Price Negotiation – Get counter-offer suggestions, safety tips, and negotiation tactics.  

Data Sources
------------

- Kijiji marketplace listings via web scraping  
- Google Gemini API for AI-powered analysis and recommendations  
- CSV file storage for lightweight data persistence  
  - `{searchTerm}.csv` – Search-specific results  
  - `listings.csv` – Master feed (shuffled every 2 seconds)  
  - `fyp.csv` – Historical archive  

Challenges Overcome
-------------------

- Integrated Selenium scraping with real-time CSV updates.  
- Built custom Vite plugin for seamless Python backend integration.  
- Implemented swipe gestures with smooth animations.  
- Created unified AI service combining recommendation and chat assistance.  
- Optimized polling mechanism for efficient real-time updates.  

Future Roadmap
--------------

- Multi-marketplace Support: Extend to Facebook Marketplace, Craigslist, and more.  
- User Accounts: Save preferences, search history, and negotiation templates.  
- Push Notifications: Alert when new items match your criteria.  
- Advanced AI: Better price prediction using historical data.  
- Database Migration: Replace CSV with SQLite/PostgreSQL for better performance.  
- WebSocket Integration: Real-time updates without polling.  
- Mobile App: Native iOS and Android applications.

Team
----

| Member |
|---------|
| Arham Aamir |
| Ryan Gao |
| Jeremy Liu |
| Ethan Yang |

Links
-----
- Devpost Submission: https://devpost.com/software/binder-us65t7
