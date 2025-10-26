# Technology Stack - Binder

## Overview
Binder is a Tinder-style marketplace app that scrapes and displays Kijiji listings with a swipe interface. It combines web scraping, real-time data updates, and an intuitive UI for browsing marketplace items.

---

## Frontend Stack

### **React 19 + TypeScript**
- **Purpose**: Core UI framework
- **Key Features**:
  - Type-safe component development
  - Modern hooks (useState, useEffect, useCallback, useRef)
  - Responsive swipe-based interface
  
### **Vite 6.2**
- **Purpose**: Build tool and dev server
- **Why Vite**: Fast hot module replacement (HMR), optimized builds
- **Custom Plugin**: `vite-plugin-csv-api.js` for handling API endpoints

### **Tailwind CSS 3.3**
- **Purpose**: Utility-first CSS framework
- **Features Used**:
  - Responsive design (mobile-first)
  - Custom animations for swipe gestures
  - Gradient backgrounds
  - Custom color schemes (rose/pink theme)

---

## Backend Stack

### **Python 3.14**
Main scraping engine with the following libraries:

#### **Selenium 4.15**
- **Purpose**: Browser automation for web scraping
- **Why Selenium**: Kijiji uses JavaScript rendering, requires full browser
- **Features**:
  - ChromeDriver integration via webdriver-manager
  - Headless mode support
  - Anti-bot detection countermeasures

#### **BeautifulSoup 4.12**
- **Purpose**: HTML parsing (backup/utility)
- **Use Case**: Parsing static elements when needed

#### **Pandas 2.3**
- **Purpose**: Data manipulation and CSV operations
- **Use Case**: Efficient CSV reading/writing

#### **Flask-CORS**
- **Purpose**: Enable cross-origin requests
- **Integration**: Allows Vite dev server to communicate with Python backend

---

## Data Storage

### **CSV Files** (File-based Database)
Simple, lightweight data storage with three main files:

1. **`{searchTerm}.csv`** (e.g., `bike.csv`, `laptop.csv`)
   - Stores results for specific searches
   - Allows quick reload of previous searches

2. **`listings.csv`**
   - **Master feed** - displayed on main page
   - Aggregates all scraped listings
   - Shuffled randomly every 2 seconds

3. **`fyp.csv`** (For You Page)
   - Archive of all scraped listings
   - Kept for historical records

**CSV Structure**:
```
listing_id,title,price,description,image_url,listing_url,condition
```

---

## Architecture & Data Flow

### 1. **User Searches**
```
User types search query → Presses Enter
    ↓
Frontend (SwipeMode.tsx)
    ↓
1. Load existing CSV (if available) - INSTANT display
2. Trigger scraper in background
```

### 2. **Web Scraping Process**
```
Frontend → POST /api/scrape
    ↓
Vite Plugin (vite-plugin-csv-api.js)
    ↓
Spawns Python process → kijiji_scraper.py
    ↓
Selenium opens Chrome
    ↓
Navigate to Kijiji search URL
    ↓
Extract listing links
    ↓
For each listing:
  - Navigate to page
  - Extract: title, price, description, image, URL
  - Check for duplicates
  - Skip "Error" listings
  - Save to CSV files
    ↓
Return success/failure
```

### 3. **Real-Time Updates**
```
While scraping:
    Frontend polls CSV every 2 seconds
        ↓
    Reads updated CSV
        ↓
    Parses new listings
        ↓
    Updates UI (new cards appear)
```

### 4. **Data Deduplication**
```
Before saving each listing:
    1. Check if title === "Error" → Skip
    2. Check if listing_id exists in CSV → Skip
    3. Otherwise → Append to CSV
    
Applied to ALL three CSV files independently
```

---

## Key Components

### **Frontend Components**

#### **App.tsx**
- Root component
- Manages tab navigation (Browse vs Watchlist)
- Handles watchlist state

#### **SwipeMode.tsx**
- Main browse interface
- Handles search functionality
- Manages scraper lifecycle
- Implements swipe gestures
- Real-time data polling

#### **ListingCard.tsx**
- Displays individual listings
- Swipe animations
- Price formatting ("N/A" → "Please contact seller")
- AI price estimation integration

#### **Watchlist.tsx**
- Shows saved listings
- Detail modal view
- Image gallery
- Remove from watchlist

#### **LoadingSpinner.tsx**
- Visual feedback during scraping
- Used across components

---

## API Endpoints (Vite Plugin)

### **POST /api/scrape**
- **Purpose**: Trigger Kijiji scraping
- **Input**: `{ searchTerm: string }`
- **Process**:
  1. Spawns Python subprocess
  2. Streams output logs
  3. Waits for completion
- **Output**: `{ success: boolean, message: string, filename: string }`

### **POST /api/create-csv**
- **Purpose**: Create empty CSV file
- **Input**: `{ filename: string, content: string }`
- **Output**: `{ success: boolean, message: string }`

---

## State Management

### **React State (useState)**
- `searchQuery`: Current search term
- `searchListings`: Results for current search
- `fypListings`: Main page listings (from listings.csv)
- `watchlist`: User's saved items
- `isScraperRunning`: Scraper status
- `currentListing`: Currently displayed card

### **Refs (useRef)**
- `pollIntervalRef`: Tracks polling interval for cleanup
- `scraperAbortControllerRef`: Allows canceling scraper requests
- `previousSearchQueryRef`: Detects search changes

---

## Key Features & Interactions

### **1. Scraper Control**
- ✅ **Auto-stop on search change**: Cancels current scrape
- ✅ **Stop on 'X' click**: Clears search and stops scraper
- ✅ **Stop on tab switch**: Cleanup on unmount
- ✅ **AbortController**: Properly cancels HTTP requests

### **2. Data Validation**
- ✅ **Error filtering**: Skips listings with title "Error"
- ✅ **Duplicate detection**: Checks listing_id before saving
- ✅ **Frontend filtering**: Removes errors during CSV parsing

### **3. Real-Time Updates**
- ✅ **Polling mechanism**: Checks CSV every 2 seconds
- ✅ **Instant display**: Shows existing data immediately
- ✅ **Background scraping**: Non-blocking UI

### **4. User Experience**
- ✅ **Swipe gestures**: Tinder-style card interface
- ✅ **Random feed**: Shuffles listings.csv for variety
- ✅ **Watchlist**: Save interesting items
- ✅ **Responsive design**: Works on mobile and desktop

---

## Configuration Files

### **kijiji-scraper/config.py**
Python scraper settings:
- Browser mode (headless/visible)
- Timeout values
- Max pages/listings per scrape
- CSS selectors for Kijiji elements

### **vite.config.ts**
Vite configuration:
- React plugin
- Custom CSV API plugin
- Dev server settings

### **tailwind.config.js**
Tailwind customization:
- Custom colors
- Typography settings
- Responsive breakpoints

### **tsconfig.json**
TypeScript configuration:
- Strict mode enabled
- Modern ES target
- Path aliases

---

## Development Workflow

### **1. Install Dependencies**
```bash
# Frontend
npm install

# Backend
cd kijiji-scraper
python setup.py
```

### **2. Run Development Server**
```bash
npm run dev
```
- Vite dev server runs on `http://localhost:5173`
- Hot reload enabled
- API endpoints available via plugin

### **3. Scraping Process**
1. User searches → Triggers `/api/scrape`
2. Vite plugin spawns Python process
3. Selenium scrapes Kijiji
4. Data saved to `/public/*.csv`
5. Frontend polls and displays results

---

## Performance Optimizations

### **Frontend**
- ✅ `useCallback` for memoized functions
- ✅ Conditional rendering based on state
- ✅ Efficient CSV parsing (skip empty lines)
- ✅ Debounced polling (2-second intervals)

### **Backend**
- ✅ Reduced wait times (optimized delays)
- ✅ Duplicate checking before saving
- ✅ Stream processing (save as you scrape)
- ✅ Early termination on abort

### **Data**
- ✅ CSV format (lightweight, no database needed)
- ✅ Incremental updates (append-only)
- ✅ Independent file checks (no cross-file locks)

---

## Error Handling

### **Frontend**
- Graceful fallback to mock data
- Console logging for debugging
- Try-catch blocks around async operations
- AbortError handling for canceled requests

### **Backend**
- Comprehensive logging (to file + console)
- Retry logic for failed requests
- Graceful degradation (skip bad listings)
- Error listings marked clearly

---

## Future Improvements

### **Potential Enhancements**
1. **Database**: Replace CSV with SQLite/PostgreSQL
2. **Caching**: Redis for faster data access
3. **WebSockets**: Push updates instead of polling
4. **AI Features**: Better price estimation, item categorization
5. **User Accounts**: Save preferences, search history
6. **Notifications**: Alert when new items match criteria
7. **Multi-source**: Support other marketplaces (Facebook, Craigslist)

---

## Dependencies Summary

### **Frontend (`package.json`)**
```json
{
  "react": "^19.2.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0",
  "tailwindcss": "^3.3.6",
  "@google/generative-ai": "^0.24.1"
}
```

### **Backend (`requirements.txt`)**
```
selenium==4.15.2
webdriver-manager==4.0.1
pandas>=2.0.0
beautifulsoup4==4.12.2
lxml>=4.9.0
requests==2.31.0
flask-cors
```

---

## Project Structure
```
binder/
├── public/                 # Static files + CSV data
│   ├── *.csv              # Scraped listings
│   └── index.html
├── components/            # React components
│   ├── SwipeMode.tsx      # Main browse UI
│   ├── Watchlist.tsx      # Saved items
│   ├── ListingCard.tsx    # Card component
│   └── LoadingSpinner.tsx
├── services/              # Business logic
│   ├── unifiedService.ts  # AI response handling
│   └── priceEstimationService.ts
├── kijiji-scraper/        # Python scraper
│   ├── kijiji_scraper.py  # Main scraper
│   ├── config.py          # Settings
│   ├── server.py          # Flask API (unused in prod)
│   └── requirements.txt
├── App.tsx                # Root component
├── vite-plugin-csv-api.js # Custom Vite plugin
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies
```

---

## Summary

**Binder** is a modern, lightweight marketplace browser that combines:
- **React** for a smooth, interactive UI
- **Python + Selenium** for powerful web scraping
- **CSV files** for simple data storage
- **Real-time polling** for live updates
- **Smart filtering** to ensure data quality

The architecture prioritizes **simplicity**, **speed**, and **user experience** while maintaining clean separation between frontend, backend, and data layers.

