import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Listing, Message, BuyerHelperResponse, Conversation } from '../types';
import { UnifiedMarketplaceService } from '../services/unifiedService';
import { PaperclipIcon, SendIcon, GeminiIcon, LightbulbIcon } from './icons';

interface BuynderChatProps {
  initialListing?: Listing | null;
  conversation?: Conversation | null;
  onUpdateConversation?: (conversationId: string, messages: Message[]) => void;
  conversations?: Conversation[];
  onSwitchConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

// --- MOCK DATA (fallback) ---
const defaultListing: Listing = {
  id: 'listing-123',
  title: 'Vintage Leather Messenger Bag',
  description: 'A beautiful, well-loved leather bag. Perfect for laptops and books. Some minor scuffs but adds to the character.',
  imgUrl: 'https://picsum.photos/id/10/200/200',
  condition: 'Used - Good',
  askingPrice: 120,
  price: '$120',
  location: 'Downtown',
  image_url: 'https://picsum.photos/id/10/200/200',
  quality: 'good',
  posted_at: new Date().toISOString(),
  notesFromSeller: 'Great condition, used daily for 2 years'
};

// --- HELPER COMPONENTS (defined outside App to prevent re-renders) ---

interface ListingHeaderProps {
  listing: Listing;
  buyerHelper: BuyerHelperResponse | null;
}

const ListingHeader: React.FC<ListingHeaderProps> = ({ listing, buyerHelper }) => (
  <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
    <div className="flex flex-col gap-3">
      {/* Listing Info */}
      <div className="flex items-center">
        <img src={listing.imgUrl} alt={listing.title} className="w-12 h-12 rounded-lg object-cover mr-3" />
        <div className="flex-grow min-w-0">
          <h1 className="font-bold text-base text-gray-800 truncate">{listing.title}</h1>
          <p className="text-sm text-gray-500">
            {listing.condition} - <span className="font-semibold text-green-600">${listing.askingPrice}</span>
          </p>
        </div>
      </div>
      
      {/* Gemini Insights */}
      {buyerHelper && (
        <div className="space-y-2">
          {/* Deal Advisor Panel */}
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-1">
              <LightbulbIcon className="w-4 h-4 mr-2 text-blue-500" />
              <h2 className="font-bold text-xs text-blue-800">Deal Advisor</h2>
            </div>
            <p className="text-xs text-blue-700">{buyerHelper.deal_advice}</p>
          </div>
          
          {/* Target Price Badge */}
          <div className="flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full w-fit">
            <GeminiIcon className="w-3 h-3 mr-1.5" />
            <span>Target <span className="font-bold">${buyerHelper.target_price}</span></span>
          </div>
        </div>
      )}
    </div>
  </div>
);

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBuyer = message.sender === 'buyer';
  
  return (
    <div className={`flex items-end gap-2 my-2 ${isBuyer ? 'justify-end' : 'justify-start'}`}>
      {!isBuyer && <img src="https://picsum.photos/seed/seller/40/40" alt="Seller" className="w-8 h-8 rounded-full flex-shrink-0" />}
      <div className={`max-w-xs px-4 py-2 rounded-2xl ${isBuyer ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
        <p className="text-sm break-words">{message.text}</p>
        <span className={`text-xs mt-1 block text-right ${isBuyer ? 'text-blue-200' : 'text-gray-500'}`}>{message.timestamp}</span>
      </div>
       {isBuyer && <img src="https://picsum.photos/seed/buyer/40/40" alt="Buyer" className="w-8 h-8 rounded-full flex-shrink-0" />}
    </div>
  );
};

interface SuggestionChipProps {
  text: string;
  onClick: (text: string) => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ text, onClick }) => (
  <button
    onClick={() => onClick(text)}
    className="flex-shrink-0 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-full active:bg-blue-200 transition-colors whitespace-nowrap touch-manipulation"
  >
    {text}
  </button>
);

// --- MAIN BUYNDER CHAT COMPONENT ---

const BuynderChat: React.FC<BuynderChatProps> = ({ 
  initialListing, 
  conversation, 
  onUpdateConversation, 
  conversations = [], 
  onSwitchConversation, 
  onDeleteConversation 
}) => {
  // --- STATE MANAGEMENT ---
  const [listing, setListing] = useState<Listing | null>(initialListing);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [buyerHelper, setBuyerHelper] = useState<BuyerHelperResponse | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConversationList, setShowConversationList] = useState<boolean>(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUpdatingConversation = useRef<boolean>(false);
  const service = new UnifiedMarketplaceService();

  // Simple loading state management with timeout
  const setLoadingWithTimeout = (loading: boolean, timeoutMs: number = 10000) => {
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
    
    setIsLoading(loading);
    
    if (loading) {
      // Set a timeout to force loading to false
      const timeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing loading to false');
        setIsLoading(false);
        setLoadingTimeout(null);
      }, timeoutMs);
      
      setLoadingTimeout(timeout);
    }
  };

  // --- CONVERSATION MANAGEMENT ---
  useEffect(() => {
    if (conversation) {
      setListing(conversation.listing);
      setMessages(conversation.messages);
      
      // Only fetch buyer helper if we don't already have it or if it's for a different conversation
      if (conversation.messages.length > 0) {
        const fetchBuyerHelper = async () => {
          try {
            // Don't show loading state when switching conversations - just fetch in background
            const buyerHelperData = await service.getBuyerSuggestions(conversation.listing, conversation.messages);
            setBuyerHelper(buyerHelperData);
          } catch (error) {
            console.error('Error fetching buyer helper:', error);
            setBuyerHelper(null);
          }
        };
        fetchBuyerHelper();
        setIsLoading(false); // Ensure loading is false when switching to existing conversation
      } else {
        setBuyerHelper(null);
        setIsLoading(false);
      }
    } else if (initialListing) {
      setListing(initialListing);
      setMessages([]);
      setBuyerHelper(null);
      setIsLoading(false);
    }
  }, [conversation?.id, initialListing, service]); // Only depend on conversation ID, not the whole conversation object

  // Update conversation when messages change (but not on initial load)
  useEffect(() => {
    if (conversation && onUpdateConversation && messages.length > 0 && !isUpdatingConversation.current) {
      // Only update if this isn't the initial load from conversation.messages
      const isInitialLoad = conversation.messages.length === messages.length && 
        conversation.messages.every((msg, index) => msg.id === messages[index]?.id);
      
       if (!isInitialLoad) {
         isUpdatingConversation.current = true;
         onUpdateConversation(conversation.id, messages);
         // Reset the flag after a short delay to allow for the update to complete
         setTimeout(() => {
           isUpdatingConversation.current = false;
         }, 100);
       }
    }
  }, [messages, conversation?.id, onUpdateConversation]); // Only depend on conversation ID

  // --- DATA FLOW / LOOP ---
  const handleSendMessage = useCallback(async () => {
    if (!draft.trim() || !listing || isLoading) return;

    const messageText = draft.trim();
    setDraft('');
    setIsLoading(true);
    setBuyerHelper(null);

    // Create both messages upfront
    const newBuyerMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'buyer',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Add buyer message immediately with flushSync to prevent flashing
    flushSync(() => {
      setMessages(prev => [...prev, newBuyerMessage]);
    });

    try {
      // Get current messages for AI context
      const currentMessages = [...messages, newBuyerMessage];
      
      // Get seller response
      const sellerText = await service.getSellerResponse(listing, currentMessages);
      
      // Create seller message
      const newSellerMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'seller',
        text: sellerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      // Add seller message with flushSync to prevent flashing
      flushSync(() => {
        setMessages(prev => [...prev, newSellerMessage]);
      });

      // Get buyer assistance
      const allMessages = [...currentMessages, newSellerMessage];
      const buyerHelperData = await service.getBuyerSuggestions(listing, allMessages);
      setBuyerHelper(buyerHelperData);
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      // Add fallback seller message
      const fallbackMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'seller',
        text: "Thanks for your message! I'll get back to you soon.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      flushSync(() => {
        setMessages(prev => [...prev, fallbackMessage]);
      });
    } finally {
      setIsLoading(false);
    }
  }, [draft, listing, service, messages, isLoading]);
  
  // Initial fetch for suggestions (only for new conversations)
  useEffect(() => {
    if (!listing) {
      setIsLoading(false);
      return;
    }

    // Only fetch initial data if this is a new conversation (no existing messages)
    if (conversation && conversation.messages.length > 0) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Start with initial buyer message
        const initialBuyerMessage: Message = {
          id: 'msg-1',
          sender: 'buyer',
          text: `Hi, I saw your listing for the ${listing.title}. Is it still available?`,
          timestamp: '10:01 AM',
        };
        
        // Simulate initial seller response
        const sellerText = await service.getSellerResponse(listing, [initialBuyerMessage]);
        const newSellerMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            sender: 'seller',
            text: sellerText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        // Set both messages at once to avoid double rendering
        setMessages([initialBuyerMessage, newSellerMessage]);

        // Fetch initial suggestions
        const initialBuyerHelperData = await service.getBuyerSuggestions(listing, [initialBuyerMessage, newSellerMessage]);
        setBuyerHelper(initialBuyerHelperData);
      } catch (error) {
        console.error('Error in fetchInitialData:', error);
        // Add fallback messages if AI fails
        const fallbackBuyerMessage: Message = {
          id: 'msg-1',
          sender: 'buyer',
          text: `Hi, I saw your listing for the ${listing.title}. Is it still available?`,
          timestamp: '10:01 AM',
        };
        const fallbackSellerMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: 'seller',
          text: "Thanks for your interest! Yes, it's still available. Feel free to ask any questions.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([fallbackBuyerMessage, fallbackSellerMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing, conversation?.id]); // Run when listing changes or conversation ID changes

  // --- UI EFFECTS ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  const handleSuggestionClick = (text: string) => {
    setDraft(text);
  };

  // Show empty state if no listing selected
  if (!listing) {
    return (
      <div className="flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Conversation Started</h2>
          <p className="text-gray-600 mb-4">Swipe right on an item and click the green checkmark to start a conversation with the seller.</p>
          <div className="text-sm text-gray-500">
            <p>Tip: Browse items in the Browse tab to find something you're interested in!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      <ListingHeader listing={listing} buyerHelper={buyerHelper} />
      

      {/* Conversation List Toggle */}
      {conversations.length > 1 && (
        <div className="bg-white border-b border-gray-200 p-3 flex-shrink-0">
          <button
            onClick={() => setShowConversationList(!showConversationList)}
            className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium text-gray-700">
                {conversations.length} Conversations
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showConversationList ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Conversation List */}
          {showConversationList && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    conversation?.id === conv.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => onSwitchConversation?.(conv.id)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <img
                      src={conv.listing.image_url || 'https://picsum.photos/40/40'}
                      alt={conv.listing.title}
                      className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{conv.listing.title}</h4>
                      <p className="text-sm text-gray-500">
                        {conv.messages.length} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation?.(conv.id);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto p-3 min-h-0" key={`messages-${messages.length}`}>
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isLoading && (
            <div className="flex items-end gap-2 my-2 justify-start">
                <img src="https://picsum.photos/seed/seller/40/40" alt="Seller" className="w-8 h-8 rounded-full" />
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                    <div className="flex items-center justify-center space-x-1 py-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      
      <footer className="bg-white p-3 border-t border-gray-200 flex-shrink-0">
        {/* Gemini Suggestions Bar */}
        {buyerHelper && buyerHelper.suggested_messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3">
             {buyerHelper.suggested_messages.map((text, i) => (
              <SuggestionChip key={i} text={text} onClick={handleSuggestionClick} />
            ))}
          </div>
        )}
        
        {/* Loading state for AI suggestions */}
        {isLoading && !buyerHelper && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3">
            <div className="flex-shrink-0 px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full animate-pulse">
              Loading AI suggestions...
            </div>
          </div>
        )}
        
        {/* Message Composer */}
        <div className="flex items-center bg-gray-100 rounded-full p-1">
           <button className="p-2 text-gray-500 active:text-gray-700 touch-manipulation">
            <PaperclipIcon className="w-5 h-5" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
            placeholder={isLoading ? "AI is responding..." : "Type your message..."}
            className="flex-grow bg-transparent focus:outline-none resize-none p-2 text-gray-800 placeholder-gray-500 text-base"
            rows={1}
            disabled={isLoading}
          />
           {isLoading ? (
             <button
               onClick={() => {
                 setIsLoading(false);
                 if (loadingTimeout) {
                   clearTimeout(loadingTimeout);
                   setLoadingTimeout(null);
                 }
               }}
               className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors touch-manipulation"
               title="Reset if stuck"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           ) : (
            <button
              onClick={handleSendMessage}
              disabled={!draft.trim()}
              className="p-2 rounded-full bg-blue-500 text-white disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default BuynderChat;
