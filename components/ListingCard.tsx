import React from "react";
import { Listing, SwipeModeAIResponse } from "../types";

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
        <h3 className="text-xl font-semibold text-gray-800 mb-1">
          {listing.title}
        </h3>
        <p className="text-2xl font-bold text-blue-600 mb-2">{listing.price}</p>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{listing.location}</span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Quality:{" "}
          <span className="font-medium text-gray-800 capitalize">
            {listing.quality}
          </span>
        </p>
        <p className="text-xs text-gray-500">Posted: {postedDate}</p>

        {/* Expanded Details - Always show relevant info when expanded */}
        {expanded && aiResponse && (
          <div className="mt-4 border-t pt-4">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
