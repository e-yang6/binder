import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Listing, Message, BuyerHelperResponse } from '../types';
import { UnifiedMarketplaceService } from '../services/unifiedService';
import { PaperclipIcon, SendIcon, GeminiIcon, LightbulbIcon } from './icons';

interface MessageCoachModeProps {
  initialListing: Listing | null;
}

const MessageCoachMode: React.FC<MessageCoachModeProps> = ({ initialListing }) => {
  const [listing] = useState<Listing>(initialListing || {
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
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'buyer',
      text: 'Hi, I saw your listing for the messenger bag. Is it still available?',
      timestamp: '10:01 AM',
    },
  ]);

  const [buyerHelper, setBuyerHelper] = useState<BuyerHelperResponse | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const service = new UnifiedMarketplaceService();

  const handleSendMessage = useCallback(async () => {
    if (!draft.trim()) return;

    const newBuyerMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'buyer',
      text: draft,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, newBuyerMessage]);
    setDraft('');
    setIsLoading(true);
    setBuyerHelper(prev => prev ? { ...prev, suggested_messages: [] } : null);

    const updatedChatContext = [...messages, newBuyerMessage];
    
    // Get seller response
    const sellerText = await service.getSellerResponse(listing, updatedChatContext);
    
    const newSellerMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      sender: 'seller',
      text: sellerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, newSellerMessage]);

    // Get buyer assistance
    const buyerHelperData = await service.getBuyerSuggestions(listing, [...updatedChatContext, newSellerMessage]);
    setBuyerHelper(buyerHelperData);
    
    setIsLoading(false);
  }, [draft, messages, listing, service]);
  
  // Initial fetch for suggestions
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const sellerText = await service.getSellerResponse(listing, messages);
      const newSellerMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: 'seller',
          text: sellerText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newSellerMessage]);

      const initialBuyerHelperData = await service.getBuyerSuggestions(listing, [...messages, newSellerMessage]);
      setBuyerHelper(initialBuyerHelperData);
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (text: string) => {
    setDraft(text);
  };

  const ListingHeader: React.FC<{ listing: Listing; buyerHelper: BuyerHelperResponse | null }> = ({ listing, buyerHelper }) => (
    <div className="p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="flex items-center flex-grow w-full">
          <img src={listing.imgUrl} alt={listing.title} className="w-16 h-16 rounded-lg object-cover mr-4" />
          <div className="flex-grow">
            <h1 className="font-bold text-lg text-gray-800">{listing.title}</h1>
            <p className="text-sm text-gray-500">
              {listing.condition} - <span className="font-semibold text-green-600">${listing.askingPrice}</span>
            </p>
          </div>
        </div>
        
        {buyerHelper && (
          <div className="w-full md:w-auto md:max-w-xs flex-shrink-0 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-1">
                <LightbulbIcon className="w-5 h-5 mr-2 text-blue-500" />
                <h2 className="font-bold text-sm text-blue-800">Deal Advisor</h2>
              </div>
              <p className="text-xs text-blue-700">{buyerHelper.deal_advice}</p>
            </div>
            
            <div className="flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full w-fit">
              <GeminiIcon className="w-3 h-3 mr-1.5" />
              <span>Target <span className="font-bold">${buyerHelper.target_price}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isBuyer = message.sender === 'buyer';
    return (
      <div className={`flex items-end gap-2 my-2 ${isBuyer ? 'justify-end' : 'justify-start'}`}>
        {!isBuyer && <img src="https://picsum.photos/seed/seller/40/40" alt="Seller" className="w-8 h-8 rounded-full" />}
        <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isBuyer ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
          <p className="text-sm">{message.text}</p>
          <span className={`text-xs mt-1 block text-right ${isBuyer ? 'text-blue-200' : 'text-gray-500'}`}>{message.timestamp}</span>
        </div>
         {isBuyer && <img src="https://picsum.photos/seed/buyer/40/40" alt="Buyer" className="w-8 h-8 rounded-full" />}
      </div>
    );
  };

  const SuggestionChip: React.FC<{ text: string; onClick: (text: string) => void }> = ({ text, onClick }) => (
    <button
      onClick={() => onClick(text)}
      className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors whitespace-nowrap"
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans max-w-3xl mx-auto shadow-2xl">
      <ListingHeader listing={listing} buyerHelper={buyerHelper} />
      
      <main className="flex-grow p-4 overflow-y-auto">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isLoading && (
            <div className="flex items-end gap-2 my-2 justify-start">
                <img src="https://picsum.photos/seed/seller/40/40" alt="Seller" className="w-8 h-8 rounded-full" />
                <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
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
      
      <footer className="bg-white p-3 border-t border-gray-200 sticky bottom-0">
        {!isLoading && buyerHelper && buyerHelper.suggested_messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3">
             {buyerHelper.suggested_messages.map((text, i) => (
              <SuggestionChip key={i} text={text} onClick={handleSuggestionClick} />
            ))}
          </div>
        )}
        
        <div className="flex items-center bg-gray-100 rounded-full p-1">
           <button className="p-2 text-gray-500 hover:text-gray-700">
            <PaperclipIcon className="w-6 h-6" />
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
            placeholder="Type your message..."
            className="flex-grow bg-transparent focus:outline-none resize-none p-2 text-gray-800 placeholder-gray-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!draft.trim() || isLoading}
            className="p-2 rounded-full bg-blue-500 text-white disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MessageCoachMode;
