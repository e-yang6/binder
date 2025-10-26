import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Listing,
  UserPrefs,
  SwipeModeAIResponse,
  Mode,
  Constraints,
} from '../types';
import { UnifiedMarketplaceService } from '../services/unifiedService';
import ListingCard from './ListingCard';
import LoadingSpinner from './LoadingSpinner';

// Mock data from original newhacks
const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Vintage Leather Armchair',
    price: '$150',
    location: 'Downtown, Cityville',
    image_url: 'https://picsum.photos/400/300?random=1',
    additional_image_urls: [
      'https://picsum.photos/400/300?random=11',
      'https://picsum.photos/400/300?random=12',
      'https://picsum.photos/400/300?random=13',
    ],
    description: 'A classic vintage leather armchair, well-maintained with minor wear. Perfect for a cozy reading nook.',
    seller_name: 'Sarah P.',
    posted_at: '2024-07-20T10:00:00Z',
    // Additional fields for compatibility
    imgUrl: 'https://picsum.photos/400/300?random=1',
    condition: 'Used - Good',
    quality: 'good',
    askingPrice: 150,
  },
  {
    id: '2',
    title: 'Modern Coffee Table',
    price: '$75',
    location: 'Northside, Cityville',
    image_url: 'https://picsum.photos/400/300?random=2',
    additional_image_urls: [
      'https://picsum.photos/400/300?random=21',
      'https://picsum.photos/400/300?random=22',
    ],
    description: 'Sleek, minimalist design coffee table. No scratches or dents. Bought 3 months ago.',
    seller_name: 'John D.',
    posted_at: '2024-07-19T14:30:00Z',
    // Additional fields for compatibility
    imgUrl: 'https://picsum.photos/400/300?random=2',
    condition: 'Like New',
    quality: 'like new',
    askingPrice: 75,
  },
  {
    id: '3',
    title: 'Used Mountain Bike',
    price: '£250',
    location: 'Eastwood, Cityville',
    image_url: 'https://picsum.photos/400/300?random=3',
    additional_image_urls: [
      'https://picsum.photos/400/300?random=31',
      'https://picsum.photos/400/300?random=32',
      'https://picsum.photos/400/300?random=33',
    ],
    description: '26-inch mountain bike, 21 gears. Rides well, needs new tires soon. Some rust on chain.',
    seller_name: 'Mike R.',
    posted_at: '2024-07-18T09:15:00Z',
    // Additional fields for compatibility
    imgUrl: 'https://picsum.photos/400/300?random=3',
    condition: 'Used - Fair',
    quality: 'used',
    askingPrice: 250,
  },
  {
    id: '4',
    title: 'Antique Grandfather Clock',
    price: '$1200',
    location: 'Westend, Cityville',
    image_url: 'https://picsum.photos/400/300?random=4',
    description: 'Working condition, beautiful ornate carvings. A true collector\'s item. Selling due to moving.',
    seller_name: 'Eleanor V.',
    posted_at: '2024-07-17T11:00:00Z',
    // Additional fields for compatibility
    imgUrl: 'https://picsum.photos/400/300?random=4',
    condition: 'Used - Good',
    quality: 'good',
    askingPrice: 1200,
  },
  {
    id: '5',
    title: 'Small Desk Lamp',
    price: '€20',
    location: 'Southwood, Cityville',
    image_url: 'https://picsum.photos/400/300?random=5',
    description: 'Functional desk lamp, but has a cracked base. Bulb included.',
    seller_name: 'Chris L.',
    posted_at: '2024-07-16T16:00:00Z',
    // Additional fields for compatibility
    imgUrl: 'https://picsum.photos/400/300?random=5',
    condition: 'Used - Fair',
    quality: 'poor',
    askingPrice: 20,
  },
];

const MOCK_USER_PREFS: UserPrefs = {
  max_price: 300,
  preferred_locations: ['Downtown, Cityville', 'Northside, Cityville'],
  deal_style: 'balanced',
};

const service = new UnifiedMarketplaceService();


interface SwipeModeProps {
  onAddToWatchlist: (listing: Listing) => void;
  watchlist: Listing[];
}

const SwipeMode: React.FC<SwipeModeProps> = ({ onAddToWatchlist, watchlist }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [fypListings, setFypListings] = useState<Listing[]>([]);
  const [searchListings, setSearchListings] = useState<Listing[]>([]);
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const [currentListing, setCurrentListing] = useState<Listing | null>(null);
  const [userPrefs] = useState<UserPrefs>(MOCK_USER_PREFS);
  const [aiResponse, setAiResponse] = useState<SwipeModeAIResponse | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [verticalDragOffset, setVerticalDragOffset] = useState(0);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);

  // Function to parse CSV data with proper handling of quoted fields
  const parseCSVData = (csvText: string): Listing[] => {
    const lines = csvText.trim().split('\n');
    const listings: Listing[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= 7) {
        console.log('Parsing values:', values);
        const listing: Listing = {
          id: values[0],
          title: values[1],
          price: values[2],
          description: values[3],
          image_url: values[4],
          listing_url: values[5],
          condition: (values[6] || 'Used - Good') as 'Brand New' | 'Like New' | 'Used - Good' | 'Used - Fair' | 'Needs Repair', // Use condition from CSV
          quality: 'good', // Default quality
          // Add required fields with defaults
          location: 'Downtown, Cityville', // Default location
          seller_name: 'Seller', // Default seller
          posted_at: new Date().toISOString(),
          // Additional fields for compatibility
          imgUrl: values[4],
          askingPrice: parseFloat(values[2].replace(/[^0-9.]/g, '')) || 0,
        };
        console.log('Created listing:', listing);
        listings.push(listing);
      }
    }
    return listings;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadFYPData = async () => {
    try {
      const response = await fetch('/fyp.csv');
      const csvText = await response.text();
      const listings = parseCSVData(csvText);
      // Shuffle FYP listings for random order
      const shuffledListings = shuffleArray(listings);
      setFypListings(shuffledListings);
    } catch (error) {
      console.error('Error loading FYP data:', error);
    }
  };

  const checkAndCreateSearchCSV = useCallback(async (searchTerm: string) => {
    try {
      console.log(`[checkAndCreateSearchCSV] Starting check for: "${searchTerm}"`);
      
      // First, try to load existing CSV file
      const checkResponse = await fetch(`/search-results/${searchTerm}.csv`);
      console.log(`[checkAndCreateSearchCSV] Check response status: ${checkResponse.status}`);
      console.log(`[checkAndCreateSearchCSV] Content-Type: ${checkResponse.headers.get('content-type')}`);
      
      // Check if it's actually a CSV file (not HTML fallback)
      const contentType = checkResponse.headers.get('content-type');
      const isCSV = contentType && (contentType.includes('text/csv') || contentType.includes('text/plain'));
      
      if (checkResponse.ok && isCSV) {
        // CSV file already exists, load it
        console.log(`CSV file already exists for: ${searchTerm}, loading data...`);
        const csvText = await checkResponse.text();
        const listings = parseCSVData(csvText);
        console.log(`[checkAndCreateSearchCSV] Loaded ${listings.length} listings from existing CSV`);
        return listings;
      } else {
        // CSV file doesn't exist, create it
        console.log(`CSV file doesn't exist for: ${searchTerm}, creating new one...`);
        const csvContent = `listing_id,title,price,description,image_url,listing_url,condition`;
        
        console.log(`[checkAndCreateSearchCSV] Sending POST request to /api/create-csv`);
        console.log(`[checkAndCreateSearchCSV] Filename: ${searchTerm}.csv`);
        
        // Send request to create CSV file on server
        const createResponse = await fetch('/api/create-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: `${searchTerm}.csv`,
            content: csvContent
          })
        });
        
        console.log(`[checkAndCreateSearchCSV] Create response status: ${createResponse.status}`);
        const responseData = await createResponse.json();
        console.log(`[checkAndCreateSearchCSV] Create response data:`, responseData);
        
        if (createResponse.ok) {
          console.log(`Created search CSV file: ${searchTerm}.csv in search-results folder`);
        } else {
          throw new Error(`Failed to create CSV file: ${responseData.error || 'Unknown error'}`);
        }
        
        // Return empty array since it's a new file
        return [];
      }
    } catch (error) {
      console.error('[checkAndCreateSearchCSV] Error:', error);
      return [];
    }
  }, []);

  const listSearchCSVs = () => {
    const searchCSVs: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('search_csv_')) {
        const searchTerm = key.replace('search_csv_', '').replace(/_/g, ' ');
        searchCSVs.push(searchTerm);
      }
    }
    console.log('Available search CSV files:', searchCSVs);
    return searchCSVs;
  };

  // Load CSV data on component mount
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/listings.csv');
        const csvText = await response.text();
        const listings = parseCSVData(csvText);
        console.log('Parsed listings:', listings);
        setAllListings(listings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading CSV data:', error);
        // Fallback to mock data if CSV fails
        setAllListings(MOCK_LISTINGS);
        setIsLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Check every 2 seconds if search is empty and load FYP data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!searchQuery) {
        loadFYPData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  // Filter states
  const [filters, setFilters] = useState({
    maxPrice: '',
    minPrice: '',
    condition: '',
    showFilters: false
  });

  // State for image gallery
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentGalleryImageIndex, setCurrentGalleryImageIndex] = useState(0);

  // State for drag gestures
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = 150; // Pixels to register a swipe
  const verticalSwipeThreshold = 80; // Pixels to register a vertical swipe

  // Effect to filter listings based on search query and filters
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const userLocation = 'Downtown, Cityville'; // In real app, this would come from user profile
    
    // Use FYP data if search is empty, search-specific listings if search exists, otherwise all listings
    const sourceListings = !searchQuery ? fypListings : (searchListings.length > 0 ? searchListings : allListings);
    
    const newFilteredListings = sourceListings.filter(listing => {
      // Exclude items already in watchlist
      const isInWatchlist = watchlist.some(watchlistItem => watchlistItem.id === listing.id);
      if (isInWatchlist) return false;
      
      // Text search filter
      const matchesSearch = !searchQuery || 
        listing.title.toLowerCase().includes(lowerCaseQuery) ||
        listing.description?.toLowerCase().includes(lowerCaseQuery);
      
      if (!matchesSearch) return false;
      
      // Price filters
      const listingPrice = service.parsePrice(listing.price);
      if (filters.minPrice && listingPrice && listingPrice.value < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && listingPrice && listingPrice.value > parseFloat(filters.maxPrice)) return false;
      
      // Condition filter
      if (filters.condition && listing.condition !== filters.condition) return false;
      
      
      return true;
    });
    
    setFilteredListings(newFilteredListings);

    // Only reset current listing if it's truly changed (not just a data refresh)
    if (newFilteredListings.length > 0) {
      // Check if current listing still exists in the new filtered list
      if (currentListing) {
        const currentIndex = newFilteredListings.findIndex(listing => listing.id === currentListing.id);
        if (currentIndex !== -1) {
          // Current listing still exists, just update the index if needed
          setCurrentListingIndex(currentIndex);
        } else {
          // Current listing no longer in filtered list, go to first item
          setCurrentListingIndex(0);
          setCurrentListing(newFilteredListings[0]);
        }
      } else {
        // No current listing, go to first item
        setCurrentListingIndex(0);
        setCurrentListing(newFilteredListings[0]);
      }
    } else {
      setCurrentListingIndex(0);
      setCurrentListing(null);
      setAiResponse(null);
      setIsAiProcessing(false);
    }
  }, [searchQuery, filters, watchlist, allListings, fypListings, searchListings, currentListing]);

  const processListingForAI = useCallback(async (listing: Listing, prefs: UserPrefs) => {
    setIsAiProcessing(true);
    setAiResponse(null);
    setDragOffset(0);
    try {
      const constraints: Constraints = {
        must_have_images: false,
      };
      const response = await service.processListing(
        Mode.SWIPE_MODE,
        listing,
        prefs,
        [],
        constraints,
      ) as SwipeModeAIResponse;
      setAiResponse(response);
    } catch (error) {
      console.error('Error processing listing for AI:', error);
      setAiResponse(null);
    } finally {
      setIsAiProcessing(false);
    }
  }, []);

  const moveToNextListing = useCallback(() => {
    if (filteredListings.length === 0) return;

    const nextIndex = currentListingIndex + 1;
    if (nextIndex >= filteredListings.length) {
      // No more items, reset to empty state
      setCurrentListingIndex(0);
      setCurrentListing(null);
      setShowImageGallery(false);
      setGalleryImages([]);
      setCurrentGalleryImageIndex(0);
      setShowDescription(false);
      setDragOffset(0);
      setVerticalDragOffset(0);
      setIsVerticalDragging(false);
      setAiResponse(null);
      setIsAiProcessing(false);
      return;
    }

    setCurrentListingIndex(nextIndex);
    setCurrentListing(filteredListings[nextIndex]);
    setShowImageGallery(false);
    setGalleryImages([]);
    setCurrentGalleryImageIndex(0);
    setShowDescription(false);
    setDragOffset(0);
    setVerticalDragOffset(0);
    setIsVerticalDragging(false);
    setAiResponse(null);
    setIsAiProcessing(false);
  }, [currentListingIndex, filteredListings]);

  // Effect to process current listing for AI whenever currentListing or userPrefs change
  useEffect(() => {
    if (currentListing) {
      processListingForAI(currentListing, userPrefs);
    } else {
      setAiResponse(null);
      setIsAiProcessing(false);
    }
  }, [currentListing, userPrefs, processListingForAI]);

  // Image Gallery handlers
  const handleImageClick = useCallback((listing: Listing) => {
    if (!listing) return;
    const images = [listing.image_url, ...(listing.additional_image_urls || [])].filter(Boolean) as string[];
    if (images.length > 0) {
      setGalleryImages(images);
      setCurrentGalleryImageIndex(0);
      setShowImageGallery(true);
    }
  }, []);

  const handlePrevImage = useCallback(() => {
    setCurrentGalleryImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const handleNextImage = useCallback(() => {
    setCurrentGalleryImageIndex(prev => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const handleCloseGallery = useCallback(() => {
    setShowImageGallery(false);
    setGalleryImages([]);
    setCurrentGalleryImageIndex(0);
  }, []);

  // Swipe gesture handlers
  const handleGestureStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
  }, []);

  const handleGestureMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    
    // Determine if this is primarily a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      setDragOffset(deltaX);
      setVerticalDragOffset(0);
      setIsVerticalDragging(false);
    } else {
      // Vertical swipe
      setVerticalDragOffset(deltaY);
      setDragOffset(0);
      setIsVerticalDragging(true);
    }
  }, [isDragging]);

  const handleGestureEnd = useCallback(() => {
    setIsDragging(false);
    const finalDragOffset = dragOffset;
    const finalVerticalDragOffset = verticalDragOffset;
    setDragOffset(0);
    setVerticalDragOffset(0);
    setIsVerticalDragging(false);

    if (isAiProcessing) {
      return;
    }

    // Check for vertical swipes
    if (isVerticalDragging) {
      if (finalVerticalDragOffset < -verticalSwipeThreshold) {
        // Swipe up - show description
        setShowDescription(true);
      } else if (finalVerticalDragOffset > verticalSwipeThreshold) {
        // Swipe down - hide description
        setShowDescription(false);
      }
      return;
    }

    // Check for horizontal swipes
    if (finalDragOffset > swipeThreshold) { // Right Swipe - Add to watchlist
      if (currentListing) {
        onAddToWatchlist(currentListing);
      }
      moveToNextListing();
    } else if (finalDragOffset < -swipeThreshold) { // Left Swipe
      moveToNextListing();
    }
  }, [dragOffset, verticalDragOffset, isVerticalDragging, isAiProcessing, moveToNextListing, swipeThreshold, verticalSwipeThreshold, currentListing, onAddToWatchlist]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isAiProcessing) { e.preventDefault(); e.stopPropagation(); return; }
    handleGestureStart(e.clientX, e.clientY);
  }, [handleGestureStart, isAiProcessing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isAiProcessing) { e.preventDefault(); e.stopPropagation(); return; }
    handleGestureMove(e.clientX, e.clientY);
  }, [handleGestureMove, isAiProcessing]);

  const handleMouseUp = useCallback(() => {
    if (isAiProcessing) return;
    handleGestureEnd();
  }, [handleGestureEnd, isAiProcessing]);

  const handleMouseLeave = useCallback(() => {
    if (isAiProcessing) return;
    if (isDragging) {
      handleGestureEnd();
    }
  }, [isDragging, handleGestureEnd, isAiProcessing]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isAiProcessing) { e.preventDefault(); e.stopPropagation(); return; }
    handleGestureStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleGestureStart, isAiProcessing]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isAiProcessing) { e.preventDefault(); e.stopPropagation(); return; }
    handleGestureMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleGestureMove, isAiProcessing]);

  const handleTouchEnd = useCallback(() => {
    if (isAiProcessing) return;
    handleGestureEnd();
  }, [handleGestureEnd, isAiProcessing]);


  // Show loading state while CSV data is being loaded
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-6 lg:p-8 bg-gray-50">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-4 sm:p-6 lg:p-8 bg-gray-50 relative overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto mb-6 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center flex-1 w-full max-w-sm">
          <label htmlFor="searchProductInput" className="text-gray-700 text-lg font-semibold mb-2">
            Search Products:
          </label>
          <div className="flex w-full gap-2">
            <input
              id="searchProductInput"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput);
                  if (searchInput.trim()) {
                    const listings = await checkAndCreateSearchCSV(searchInput.trim());
                    setSearchListings(listings);
                  } else {
                    setSearchListings([]);
                  }
                }
              }}
              placeholder="e.g., Mountain Bike, Coffee Table"
              className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white"
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchInput('');
                  setSearchListings([]);
                }}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-1">
              Showing results for: "{searchQuery}"
            </p>
          )}
        </div>
        
        {/* Filter Toggle Button */}
        <button
          onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
          className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
        
        {/* Filter Panel */}
        {filters.showFilters && (
          <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, decimal point
                      if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                          (e.keyCode === 65 && e.ctrlKey === true) ||
                          (e.keyCode === 67 && e.ctrlKey === true) ||
                          (e.keyCode === 86 && e.ctrlKey === true) ||
                          (e.keyCode === 88 && e.ctrlKey === true) ||
                          // Allow: home, end, left, right, down, up
                          (e.keyCode >= 35 && e.keyCode <= 40)) {
                        return;
                      }
                      // Ensure that it is a number and stop the keypress
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-rose-500 focus:border-rose-500"
                  />
                  <input
                    type="number"
                    placeholder="Max $"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, decimal point
                      if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                          (e.keyCode === 65 && e.ctrlKey === true) ||
                          (e.keyCode === 67 && e.ctrlKey === true) ||
                          (e.keyCode === 86 && e.ctrlKey === true) ||
                          (e.keyCode === 88 && e.ctrlKey === true) ||
                          // Allow: home, end, left, right, down, up
                          (e.keyCode >= 35 && e.keyCode <= 40)) {
                        return;
                      }
                      // Ensure that it is a number and stop the keypress
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
              
              
              {/* Condition */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Condition</label>
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any condition</option>
                  <option value="New">New</option>
                  <option value="Used - Like New">Used - Like New</option>
                  <option value="Used - Good">Used - Good</option>
                  <option value="Used - Fair">Used - Fair</option>
                  <option value="Used - Poor">Used - Poor</option>
                </select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  maxPrice: '',
                  minPrice: '',
                  condition: '',
                  showFilters: true
                })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {!showImageGallery && (
        currentListing ? (
          <>
            <div className="relative w-full max-w-xl mx-auto mb-8">
              {/* Visual feedback for horizontal swipe direction - Behind card */}
              {dragOffset > 50 && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 text-green-700 font-bold text-4xl rounded-lg pointer-events-none z-0">
                  SMASH
                </div>
              )}
              {dragOffset < -50 && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 text-red-700 font-bold text-4xl rounded-lg pointer-events-none z-0">
                  PASS
                </div>
              )}
              
              <div
                ref={cardRef}
                className={`relative z-10 
                            ${isAiProcessing ? 'cursor-not-allowed pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <ListingCard
                  listing={currentListing}
                  expanded={showDescription}
                  aiResponse={aiResponse || undefined}
                  dragOffset={dragOffset}
                  isDragging={isDragging}
                  onImageClick={undefined}
                  revealProgress={Math.max(0, Math.min(1, (showDescription ? 1 : 0) + (-verticalDragOffset / 200)))}
                />
                {isAiProcessing && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
                    <LoadingSpinner />
                  </div>
                )}
              </div>
            </div>


          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] h-full p-4 text-gray-600 flex-grow">
            {searchQuery ? (
              <p>No listings found for "{searchQuery}". Try a different search term.</p>
            ) : (
              <p>No listings available to swipe.</p>
            )}
          </div>
        )
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <button
            onClick={handleCloseGallery}
            className="absolute top-4 right-4 text-white text-4xl font-bold p-2 z-50"
            aria-label="Close image gallery"
          >
            &times;
          </button>
          <div className="relative flex items-center justify-center w-full h-full">
            <button
              onClick={handlePrevImage}
              className="absolute left-4 p-3 bg-gray-800 bg-opacity-50 text-white rounded-full text-2xl z-40 hover:bg-opacity-75 transition-opacity duration-200"
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <img
              src={galleryImages[currentGalleryImageIndex]}
              alt={`Gallery image ${currentGalleryImageIndex + 1} of ${currentListing?.title}`}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={handleNextImage}
              className="absolute right-4 p-3 bg-gray-800 bg-opacity-50 text-white rounded-full text-2xl z-40 hover:bg-opacity-75 transition-opacity duration-200"
              aria-label="Next image"
            >
              &#8250;
            </button>
            <div className="absolute bottom-4 text-white text-lg z-40">
              {currentGalleryImageIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SwipeMode;
