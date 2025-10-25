import React, { useState } from 'react';
import { Listing } from '../types';

interface WatchlistProps {
  watchlist: Listing[];
  onStartConversation: (listing: Listing) => void;
  onRemoveFromWatchlist: (listingId: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ watchlist, onStartConversation, onRemoveFromWatchlist }) => {
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  const handleItemClick = (listing: Listing) => {
    setSelectedItem(listing);
  };

  const handleAccept = (listing: Listing) => {
    onStartConversation(listing);
    setSelectedItem(null);
  };

  const handleReject = () => {
    setSelectedItem(null);
  };

  const handleRemove = (listingId: string) => {
    onRemoveFromWatchlist(listingId);
    setSelectedItem(null);
  };

  const handleImageClick = (listing: Listing, imageIndex: number) => {
    const images = [listing.image_url, ...(listing.additional_image_urls || [])].filter(Boolean) as string[];
    setAllImages(images);
    setCurrentImageIndex(imageIndex);
    setShowImageZoom(true);
  };

  const handleCloseImageZoom = () => {
    setShowImageZoom(false);
    setAllImages([]);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % allImages.length);
  };

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Watchlist is Empty</h2>
        <p className="text-gray-600 mb-4">Swipe right on items in the Browse tab to add them to your watchlist.</p>
        <div className="text-sm text-gray-500">
          <p>Tip: Items you swipe right on will appear here for you to review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Your Watchlist</h1>
        <p className="text-sm text-gray-600 mt-1">{watchlist.length} item{watchlist.length !== 1 ? 's' : ''} saved</p>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleItemClick(listing)}
            >
              <img
                src={listing.image_url || 'https://picsum.photos/400/300?grayscale'}
                alt={listing.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{listing.title}</h3>
                <p className="text-xl font-bold text-blue-600 mb-2">{listing.price}</p>
                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{listing.location}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Quality: <span className="font-medium text-gray-800 capitalize">{listing.quality}</span></p>
                {listing.description && (
                  <p className="text-sm text-gray-700 line-clamp-3">{listing.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Item Details</h2>
              <button
                onClick={handleReject}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Images */}
                <div className="space-y-4">
                  <div className="relative cursor-pointer group" onClick={() => handleImageClick(selectedItem, 0)}>
                    <img
                      src={selectedItem.image_url || 'https://picsum.photos/400/300?grayscale'}
                      alt={selectedItem.title}
                      className="w-full h-64 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                    />
                    {selectedItem.additional_image_urls && selectedItem.additional_image_urls.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        +{selectedItem.additional_image_urls.length} more
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Additional Images */}
                  {selectedItem.additional_image_urls && selectedItem.additional_image_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedItem.additional_image_urls.slice(0, 6).map((url, index) => (
                        <div
                          key={index}
                          className="cursor-pointer group relative"
                          onClick={() => handleImageClick(selectedItem, index + 1)}
                        >
                          <img
                            src={url}
                            alt={`${selectedItem.title} - Image ${index + 2}`}
                            className="w-full h-20 object-cover rounded transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Title and Price */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedItem.title}</h3>
                    <p className="text-3xl font-bold text-blue-600 mb-4">{selectedItem.price}</p>
                  </div>

                  {/* Key Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Location</span>
                      </div>
                      <p className="text-gray-800 font-medium">{selectedItem.location}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Quality</span>
                      </div>
                      <p className="text-gray-800 font-medium capitalize">{selectedItem.quality}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Condition</span>
                      </div>
                      <p className="text-gray-800 font-medium">{selectedItem.condition}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Posted</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {new Date(selectedItem.posted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Seller Information */}
                  {selectedItem.seller_name && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-blue-800">Seller</span>
                      </div>
                      <p className="text-blue-700 font-medium">{selectedItem.seller_name}</p>
                    </div>
                  )}

                  {/* Description */}
                  {selectedItem.description && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Description</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedItem.description}</p>
                    </div>
                  )}

                  {/* Notes from Seller */}
                  {selectedItem.notesFromSeller && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">Notes from Seller</h4>
                      <p className="text-yellow-700">{selectedItem.notesFromSeller}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAccept(selectedItem)}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Conversation
                </button>
                <button
                  onClick={() => handleRemove(selectedItem.id)}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Remove from Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageZoom && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <button
            onClick={handleCloseImageZoom}
            className="absolute top-4 right-4 text-white text-4xl font-bold p-2 z-50 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Close image zoom"
          >
            ×
          </button>
          
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Previous Button */}
            {allImages.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-4 p-3 bg-gray-800 bg-opacity-50 text-white rounded-full text-2xl z-40 hover:bg-opacity-75 transition-opacity duration-200"
                aria-label="Previous image"
              >
                &#8249;
              </button>
            )}
            
            {/* Main Image */}
            <img
              src={allImages[currentImageIndex]}
              alt={`${selectedItem?.title} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Next Button */}
            {allImages.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-4 p-3 bg-gray-800 bg-opacity-50 text-white rounded-full text-2xl z-40 hover:bg-opacity-75 transition-opacity duration-200"
                aria-label="Next image"
              >
                &#8250;
              </button>
            )}
            
            {/* Image Counter */}
            <div className="absolute bottom-4 text-white text-lg z-40 bg-black bg-opacity-50 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
