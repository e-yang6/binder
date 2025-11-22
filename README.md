# binder.

**🔗 Demo:** https://devpost.com/software/binder-us65t7

## Overview

binder. is a Tinder-inspired marketplace browser for Kijiji listings. It blends a swipe-first React experience with live scraping and lightweight AI helpers so you can discover, evaluate, and save deals without leaving the app. Search terms spin up the Python scraper in the background, fresh results stream in via CSV files, and a Gemini-powered price check helps you spot over-priced posts before reaching out to sellers.

## Highlights

- Swipe through Kijiji inventory with card gestures, quick facts, and instant add-to-watchlist.
- Run ad‑hoc searches that trigger the bundled Selenium scraper; results are polled every few seconds and cached as `{searchTerm}.csv`.
- Tap **Fair Price Check** on any card to ask Google Gemini for a conservative market estimate (requires an API key).
- Maintain a watchlist with detailed modals, image galleries, and one-click removal or jump-out to the original listing.
- Custom Vite middleware exposes `/api/create-csv` and `/api/scrape`, keeping everything in one dev server.

## Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite.
- **AI & Services:** Google Gemini via `@google/generative-ai`, shared logic in `UnifiedMarketplaceService`.
- **Scraping:** Python (Selenium, BeautifulSoup, Pandas) launched from the Vite plugin; listings persisted as CSV in `public/`.

## Getting Started

### Prerequisites

- Node.js 18+ and npm.
- Python 3.10+ with access to Chrome/Chromedriver (for the Selenium scraper).
- A Google Gemini API key if you plan to use Fair Price Check.

### Install dependencies

1. (Optional) If the `kijiji-scraper/` folder is empty, unzip `kijiji-scraper.zip` so the Python scripts are available.
2. Install frontend packages:
   ```bash
   npm install
   ```
3. Install scraper dependencies:
   ```bash
   cd kijiji-scraper
   pip install -r requirements.txt
   cd ..
   ```

### Configure environment

Create a `.env` file in the project root (same level as `package.json`) and supply your Gemini key:
```
VITE_GEMINI_API_KEY=YOUR_KEY_HERE
```

### Run the app

```bash
npm run dev
```

Open the Vite URL (default `http://localhost:5173`). Search for something (e.g. “mountain bike”) to kick off scraping; cards will update as the CSV fills. Use the browse/watchlist tabs in the footer to navigate.

## How Data Flows

1. `SwipeMode` loads `public/listings.csv` on start for the “For You” feed.
2. Entering a search:
   - Immediately loads `{search}.csv` if it already exists.
   - POSTs to `/api/scrape`, which spawns `kijiji_scraper.py`.
   - Every two seconds the UI polls `{search}.csv` for freshly scraped rows.
3. Swiping right adds a listing to the watchlist; the list persists for the current session.

CSV files live under `public/`, so you can preseed data or inspect results directly from disk.

## Troubleshooting

- **Scraper fails to start:** make sure Python deps are installed and Chromedriver is reachable; check terminal output where Vite is running.
- **Fair Price Check disabled:** ensure `VITE_GEMINI_API_KEY` is set before starting the dev server.
- **Stale results:** delete outdated CSVs in `public/` to force a fresh scrape.

## Scripts

- `npm run dev` – start Vite with the CSV API middleware.
- `npm run build` – production build.
- `npm run preview` – preview the built app.

Happy hunting!


