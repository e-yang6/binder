import React, { useState, useEffect } from "react";
import { Listing, SwipeModeAIResponse } from "../types";
import { estimateFairPrice } from "../services/priceEstimationService";

interface ListingCardProps {
  listing: Listing;
  expanded?: boolean;
  aiResponse?: SwipeModeAIResponse;
  dragOffset?: number; // New prop for swipe animation
  isDragging?: boolean; // New prop for swipe animation
  onImageClick?: (listing: Listing) => void; // New prop for image gallery
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  expanded = false,
  aiResponse,
  dragOffset = 0,
  isDragging = false,
  onImageClick,
}) => {
  const postedDate = new Date(listing.posted_at).toLocaleDateString();
  const [aiPriceEstimate, setAiPriceEstimate] = useState<number | null>(null);
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Reset estimate when listing changes
  useEffect(() => {
    setAiPriceEstimate(null);
    setIsEstimatingPrice(false);
  }, [listing.id]);

  const handlePriceEstimate = async () => {
    console.log('Button clicked, starting price estimation...');
    setIsEstimatingPrice(true);
    
    console.log('Calling estimateFairPrice with:', {
      title: listing.title,
      description: listing.description || '',
      condition: listing.condition,
      currentPrice: listing.price,
      category: 'General',
    });
    
    const estimate = await estimateFairPrice({
      title: listing.title,
      description: listing.description || '',
      condition: listing.condition,
      currentPrice: listing.price,
      category: 'General',
    });
    
    console.log('Got estimate:', estimate);
    setAiPriceEstimate(estimate.estimatedPrice);
    setIsEstimatingPrice(false);
  };

  const cardStyle: React.CSSProperties = {
    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`, // Rotate proportionally to drag
    transition: isDragging ? "none" : "transform 0.3s ease-in-out", // Smooth snap-back if not dragging
  };

  return (
    <div
      draggable="false"
      className="relative bg-white rounded-lg shadow-lg overflow-hidden md:max-w-xl mx-auto cursor-grab active:cursor-grabbing select-none"
      style={cardStyle}
    >
      {/* Image and Basic Info */}
      {/* Increased image height */}
      <img
        src={listing.image_url || "https://picsum.photos/400/300?grayscale"}
        alt={listing.title}
        className="w-full h-64 object-cover object-center cursor-pointer"
        draggable="false"
        onClick={() => onImageClick && expanded && onImageClick(listing)} // Only clickable if onImageClick is provided and card is expanded
      />
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-semibold text-gray-800 flex-1 mr-3">
            {listing.title}
          </h3>
          <button
            onClick={(e) => {
              console.log('Button clicked!');
              e.stopPropagation();
              handlePriceEstimate();
            }}
            disabled={isEstimatingPrice}
            className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 text-sm font-medium shadow-sm"
            title="Get Gemini Price Estimate"
          >
            {isEstimatingPrice ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Analyzing...</span>
              </div>
            ) : (
              <span>Gemini Fair Price Check</span>
            )}
          </button>
        </div>
        
        {/* Gemini Price Estimate Display */}
        {aiPriceEstimate !== null ? (
          <div className="mb-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Gemini Estimate:</span>
              <span className="text-xl font-bold text-blue-600">
                ${formatNumber(Math.round(aiPriceEstimate))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Asking:</span>
              <span className="text-lg font-semibold text-gray-700">
                {listing.price}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-2xl font-bold text-blue-600 mb-2">{listing.price}</p>
        )}
        <p className="text-xs text-gray-500">Posted: {postedDate}</p>

        {/* Expanded Details - Always show relevant info when expanded */}
        {expanded && (
          <div className="mt-4 border-t pt-4">
            {/* Always display description when expanded */}
            {listing.description && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Description</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}
            
            {/* AI Response details */}
            {aiResponse && (
              <>
                {/* Always display description, seller_name, posted_at if after_right_swipe indicates them */}
                {aiResponse.after_right_swipe?.extra_fields.includes(
                  "description"
                ) &&
                  listing.description && (
                    <p className="text-sm text-gray-700 mb-3">
                      {listing.description}
                    </p>
                  )}
            {aiResponse.after_right_swipe?.extra_fields.includes(
              "seller_name"
            ) && (
              <p className="text-sm text-gray-700 mb-1">
                Seller: {listing.seller_name}
              </p>
            )}
            {aiResponse.after_right_swipe?.extra_fields.includes(
              "posted_at"
            ) && (
              <p className="text-sm text-gray-700 mb-3">
                Original Post Date: {postedDate}
              </p>
            )}

            {/* Always display follow-up questions if available */}
            {aiResponse.after_right_swipe?.follow_up_questions.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-gray-800 mb-2">
                  Suggested Follow-up Questions:
                </h5>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {aiResponse.after_right_swipe.follow_up_questions.map(
                    (q, index) => (
                      <li key={index}>{q}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Risks and Notes - always show if available regardless of AI decision */}
            {aiResponse.risks && aiResponse.risks.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="text-md font-semibold text-yellow-800 mb-1">
                  Potential Risks:
                </h5>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {aiResponse.risks.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiResponse.notes && aiResponse.notes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="text-md font-semibold text-blue-800 mb-1">
                  Notes:
                </h5>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  {aiResponse.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
