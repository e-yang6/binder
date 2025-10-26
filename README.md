# binder.

> **Swipe. Save. Shop.** - A Tinder-style marketplace app that makes browsing Kijiji listings fun and effortless.

---

## Overview

**Binder** transforms traditional marketplace browsing into an intuitive, swipe-based interface. Browse Toronto-area Kijiji listings with simple gestures, save your favorites, and discover deals in a fun, engaging way.

---

## Key Features

### Swipe Interface
- **Swipe Right** to save items to your watchlist
- **Swipe Left** to pass on items
- **Swipe Up/Down** to reveal or hide full descriptions
- Visual feedback and smooth animations

### Smart Search
- Search for any item (e.g., "laptop", "bike", "furniture")
- Instant display of existing results
- Automatic background scraping for fresh listings
- Real-time updates as new items are found

### Watchlist
- Save items you're interested in with a single swipe
- View detailed information and multiple photos
- Easy management and removal of saved items
- Persistent across sessions

### Dynamic Feed
- Randomized listing display on the main page
- Auto-refreshes with new items
- Filters out duplicates and already-saved items
- Quality-checked listings only

---

## Installation

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Chrome Browser

### Setup

1. **Install frontend dependencies**
```bash
npm install
```

2. **Install Python dependencies**
```bash
cd kijiji-scraper
python setup.py
```

3. **Start the app**
```bash
npm run dev
```

4. Open `http://localhost:5173` in your browser

---

## Usage

### Searching
1. Type a search term in the search box
2. Press Enter
3. Browse results as they load in real-time

### Browsing
- Leave the search box empty to browse all listings
- Swipe right on items you like
- Swipe left to skip

### Managing Watchlist
- Click the "Watchlist" tab to view saved items
- Click any item for full details
- Remove items you're no longer interested in

### Stopping a Scrape
- Click the 'X' button next to the search box
- Start a new search (automatically stops the current one)
- Switch to the Watchlist tab

---

## Configuration

Adjust scraper settings in `kijiji-scraper/config.py`:

```python
SCRAPER_CONFIG = {
    'headless': False,       # Show/hide browser window
    'max_pages': 2,          # Pages to scrape per search
    'max_listings': 10,      # Items per search
}
```

Common adjustments:
- Set `headless: True` for background scraping
- Increase `max_listings` for more results
- Adjust timeout values for faster/slower scraping

---

## Project Structure

```
binder/
├── components/          # React UI components
├── services/            # Business logic
├── kijiji-scraper/      # Python scraper
│   ├── kijiji_scraper.py
│   └── config.py
├── public/              # Static files and CSV data
├── App.tsx              # Main application
└── vite-plugin-csv-api.js  # Backend API integration
```

---

## Features in Detail

### Intelligent Scraping
- Scrapes real Kijiji listings on demand
- Runs in the background without blocking the UI
- Automatically filters out errors and duplicates
- Validates data quality before saving

### Data Quality
- Skips incomplete or error listings
- Removes duplicate entries
- Validates all required fields
- Formats prices for readability

### User Experience
- Mobile-responsive design
- Touch-optimized gestures
- Smooth card animations
- No page reloads needed

---

## Use Cases

**Apartment Hunting**
Search for apartments, swipe through options, save favorites for comparison.

**Finding Deals**
Browse electronics, furniture, or vehicles with real-time market data.

**Casual Discovery**
Browse the randomized main feed to discover unexpected finds.


---

*Happy browsing!*
