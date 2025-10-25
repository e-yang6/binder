import React, { useState, useEffect } from 'react';
import SwipeMode from './components/SwipeMode';
import BuynderChat from './components/BuynderChat';
import Watchlist from './components/Watchlist';
import { Listing, Conversation, Message } from './types';

type ActiveTab = 'swipe' | 'watchlist' | 'messages';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('swipe');
  const [selectedListingForMessages, setSelectedListingForMessages] = useState<Listing | null>(null);
  const [watchlist, setWatchlist] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [watchlistGlow, setWatchlistGlow] = useState(false);

  const handleStartConversation = (listing: Listing) => {
    // Check if conversation already exists for this listing
    const existingConversation = conversations.find(conv => conv.listing.id === listing.id);
    
    if (existingConversation) {
      // Switch to existing conversation
      setActiveConversationId(existingConversation.id);
      setSelectedListingForMessages(listing);
    } else {
      // Create new conversation
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        listing: listing,
        messages: [],
        lastMessageAt: new Date().toISOString(),
        isActive: true
      };
      
      setConversations(prev => [...prev, newConversation]);
      setActiveConversationId(newConversation.id);
      setSelectedListingForMessages(listing);
    }
    
    setActiveTab('messages');
  };

  const handleAddToWatchlist = (listing: Listing) => {
    setWatchlist(prev => {
      // Check if item is already in watchlist
      if (prev.some(item => item.id === listing.id)) {
        return prev;
      }
      return [...prev, listing];
    });
    
    // Trigger glow effect
    setWatchlistGlow(true);
    setTimeout(() => setWatchlistGlow(false), 1200); // Glow for 1.2 seconds
  };

  const handleRemoveFromWatchlist = (listingId: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== listingId));
  };

  const handleUpdateConversation = (conversationId: string, messages: Message[]) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, messages, lastMessageAt: new Date().toISOString() }
        : conv
    ));
  };

  const handleSwitchConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setActiveConversationId(conversationId);
      setSelectedListingForMessages(conversation.listing);
      setActiveTab('messages');
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setSelectedListingForMessages(null);
      if (conversations.length === 1) {
        setActiveTab('swipe');
      }
    }
  };

  // Get current conversation
  const currentConversation = conversations.find(conv => conv.id === activeConversationId);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header/Logo Only */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 shadow-md flex-shrink-0 z-10">
        <nav className="flex justify-center items-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Open Sauce One, sans-serif' }}>Binder.</h1>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'swipe' && <SwipeMode onStartConversation={handleStartConversation} onAddToWatchlist={handleAddToWatchlist} watchlist={watchlist} />}
        {activeTab === 'watchlist' && <Watchlist watchlist={watchlist} onStartConversation={handleStartConversation} onRemoveFromWatchlist={handleRemoveFromWatchlist} />}
        {activeTab === 'messages' && (
          <BuynderChat 
            key={activeConversationId || 'new-conversation'}
            initialListing={selectedListingForMessages} 
            conversation={currentConversation}
            onUpdateConversation={handleUpdateConversation}
            conversations={conversations}
            onSwitchConversation={handleSwitchConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="bg-white border-t border-gray-200 shadow-lg flex-shrink-0 z-20">
        <nav className="flex justify-around items-center h-14 px-2">
          <button
            onClick={() => setActiveTab('swipe')}
            className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors duration-200 min-w-0
              ${activeTab === 'swipe' ? 'text-blue-600' : 'text-gray-500'}`}
            aria-label="Browse"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0v-9a1 1 0 00-1-1H9a1 1 0 00-1 1v9m-6 0h16" />
            </svg>
            <span className="truncate">Browse</span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-all duration-200 min-w-0 relative
              ${activeTab === 'watchlist' ? 'text-blue-600' : 'text-gray-500'}`}
            aria-label="Watchlist"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-1 transition-all duration-500 ease-out ${watchlistGlow ? 'text-red-500 drop-shadow-lg scale-110' : 'scale-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="truncate">Watchlist</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors duration-200 min-w-0
              ${activeTab === 'messages' ? 'text-blue-600' : 'text-gray-500'}`}
            aria-label="Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="truncate">Chat</span>
          </button>
        </nav>
      </footer>
    </div>
  );
};

export default App;
