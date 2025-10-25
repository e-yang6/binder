import {
  Mode,
  Listing,
  UserPrefs,
  ChatMessage,
  Constraints,
  SwipeCartAIResponse,
  SwipeModeAIResponse,
  MessageCoachModeAIResponse,
  ListingQuality,
  MessageGoal,
  ParsedPrice,
  Message,
  BuyerHelperResponse,
  SellerResponse,
} from '../types';
import { QUALITY_RANKING } from '../constants';

// Helper to pick a random element from an array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to parse price offers from messages
const getOffers = (messages: Message[], sender: 'buyer' | 'seller'): number[] => {
  return messages
    .filter(m => m.sender === sender)
    .map(m => m.text.match(/\$(\d+(\.\d{1,2})?)/)) // handles dollars and cents
    .filter((match): match is RegExpMatchArray => !!match)
    .map(match => parseInt(match[1], 10));
};

export class UnifiedMarketplaceService {
  // SwipeCart functionality
  public parsePrice(priceString: string): ParsedPrice | null {
    const match = priceString.match(/^([$€£])(\d+(\.\d{1,2})?)$/);
    if (match) {
      return {
        currency: match[1],
        value: parseFloat(match[2]),
      };
    }
    return null;
  }

  private formatPrice(parsedPrice: ParsedPrice): string {
    return `${parsedPrice.currency}${parsedPrice.value.toFixed(0)}`;
  }

  private formatPriceForDisplay(currency: string, value: number): string {
    const hasDecimals = value % 1 !== 0;
    return `${currency}${value.toFixed(hasDecimals ? 2 : 0)}`;
  }

  public async processListing(
    mode: Mode,
    listing: Listing,
    userPrefs: UserPrefs = {},
    chatContext: ChatMessage[] = [],
    constraints: Constraints = {},
  ): Promise<SwipeCartAIResponse> {
    if (mode === Mode.SWIPE_MODE) {
      return this.handleSwipeMode(listing, userPrefs, constraints);
    } else {
      return this.handleMessageCoachMode(listing, userPrefs, chatContext);
    }
  }

  private handleSwipeMode(
    listing: Listing,
    userPrefs: UserPrefs,
    constraints: Constraints,
  ): SwipeModeAIResponse {
    let decision: 'left' | 'right' = 'right';
    let reason: string = 'Item fits preferences.';
    const risks: string[] = [];
    const notes: string[] = [];

    const listingPrice = this.parsePrice(listing.price);
    if (!listingPrice) {
      notes.push('Could not parse listing price.');
    }

    if (userPrefs.max_price !== undefined && listingPrice && listingPrice.value > userPrefs.max_price) {
      decision = 'left';
      reason = `Exceeds maximum price preference of ${this.formatPriceForDisplay(listingPrice.currency, userPrefs.max_price)}.`;
    } else if (userPrefs.min_quality && QUALITY_RANKING[listing.quality] < QUALITY_RANKING[userPrefs.min_quality]) {
      decision = 'left';
      reason = `Below minimum quality preference of ${userPrefs.min_quality}.`;
    } else if (userPrefs.preferred_locations && userPrefs.preferred_locations.length > 0 && !userPrefs.preferred_locations.some(loc => listing.location.includes(loc))) {
      decision = 'left';
      reason = 'Location outside preferred areas.';
    } else if (constraints.must_have_images && !listing.image_url) {
      decision = 'left';
      reason = 'Missing required image.';
    }

    const quick_facts = [
      `Title: ${listing.title}`,
      `Price: ${listing.price}`,
      `Location: ${listing.location}`,
      `Quality: ${listing.quality}`,
      `Posted: ${new Date(listing.posted_at).toLocaleDateString()}`,
    ];

    if (!listing.description) {
      risks.push('Missing detailed description.');
    }
    if (!listing.image_url) {
      risks.push('No image available.');
    }

    const follow_up_questions: string[] = [];
    if (decision === 'right') {
      follow_up_questions.push('Is the price negotiable?');
      if (listing.quality === 'used' || listing.quality === 'poor') {
        follow_up_questions.push('What are the specific conditions or any defects?');
      } else {
        follow_up_questions.push('When is a good time for pickup?');
      }
      follow_up_questions.push('What accessories are included?');
    }

    return {
      mode: Mode.SWIPE_MODE,
      decision,
      reason,
      quick_facts,
      after_right_swipe: {
        extra_fields: ['description', 'seller_name', 'posted_at'],
        follow_up_questions: follow_up_questions.slice(0, 3),
      },
      ...(risks.length > 0 && { risks }),
      ...(notes.length > 0 && { notes }),
    };
  }

  private handleMessageCoachMode(
    listing: Listing,
    userPrefs: UserPrefs,
    chatContext: ChatMessage[],
  ): MessageCoachModeAIResponse {
    let goal: MessageGoal = 'start_conversation';
    const draft_messages: { polite: string; balanced: string; direct: string } = {
      polite: '',
      balanced: '',
      direct: '',
    };
    let counter_offer: { suggested_price: string; rationale: string } | undefined;
    const tactics_safety_tips: string[] = [];
    let next_best_action: string = '';
    const risks: string[] = [];
    const notes: string[] = [];

    const lastMessage = chatContext.length > 0 ? chatContext[chatContext.length - 1] : null;
    const buyerMessages = chatContext.filter(msg => msg.sender === 'buyer').map(msg => msg.text.toLowerCase());
    const sellerMessages = chatContext.filter(msg => msg.sender === 'seller').map(msg => msg.text.toLowerCase());
    const originalPrice = this.parsePrice(listing.price);

    // Determine goal
    if (chatContext.length === 0 || (lastMessage && lastMessage.sender === 'seller' && !buyerMessages.some(m => m.includes('available')))) {
      goal = 'start_conversation';
    } else if (buyerMessages.some(m => m.includes('negotiate') || m.includes('offer') || m.includes('price')) || sellerMessages.some(m => m.includes('offer'))) {
      goal = 'negotiate_price';
    } else if (buyerMessages.some(m => m.includes('condition') || m.includes('defect') || m.includes('rust') || m.includes('working'))) {
      goal = 'clarify_details';
    } else if (buyerMessages.some(m => m.includes('pickup') || m.includes('meet') || m.includes('time') || m.includes('where'))) {
      goal = 'schedule_meetup';
    }

    // Generate messages, counter-offer, tips, and next action based on goal
    switch (goal) {
      case 'start_conversation':
        draft_messages.polite = `Hello, is this ${listing.title} still available? I can pick up at your convenience.`;
        draft_messages.balanced = `Hi, is this ${listing.title} still available? I'm flexible for pickup.`;
        draft_messages.direct = `Available? Flexible pickup.`;
        tactics_safety_tips.push('Offer quick pickup to sweeten the deal.');
        next_best_action = 'Send a message to confirm availability.';
        if (!listing.description) risks.push('Lacking detailed item description.');
        break;

      case 'negotiate_price':
        if (originalPrice) {
          const dealStyle = userPrefs.deal_style || 'balanced';
          let discountPercentage = 0;

          if (listing.quality === 'like new') {
            discountPercentage = dealStyle === 'aggressive' ? 0.10 : (dealStyle === 'balanced' ? 0.07 : 0.05);
          } else if (listing.quality === 'good' || listing.quality === 'used') {
            discountPercentage = dealStyle === 'aggressive' ? 0.20 : (dealStyle === 'balanced' ? 0.15 : 0.10);
          } else {
            discountPercentage = dealStyle === 'aggressive' ? 0.30 : (dealStyle === 'balanced' ? 0.25 : 0.20);
          }

          const suggestedValue = originalPrice.value * (1 - discountPercentage);
          counter_offer = {
            suggested_price: this.formatPrice({ ...originalPrice, value: suggestedValue }),
            rationale: `Suggesting ${Math.round(discountPercentage * 100)}% below asking based on item quality and your deal style.`,
          };

          draft_messages.polite = `Would you consider ${counter_offer.suggested_price} for the ${listing.title}? I can arrange a quick pickup.`;
          draft_messages.balanced = `I'm interested in the ${listing.title}. My offer is ${counter_offer.suggested_price} for a fast deal.`;
          draft_messages.direct = `Offer ${counter_offer.suggested_price}. Can pick up today.`;
        } else {
          draft_messages.polite = `I'm very interested in the ${listing.title}. Is there any flexibility on the price?`;
          draft_messages.balanced = `What's the lowest you'd go for the ${listing.title}?`;
          draft_messages.direct = `Best price for ${listing.title}?`;
          risks.push('Could not determine original price for counter-offer.');
        }
        tactics_safety_tips.push('Mention quick payment for a better price.');
        tactics_safety_tips.push('Always confirm the final agreed price in writing.');
        next_best_action = 'Send a counter-offer or ask about price flexibility.';
        break;

      case 'clarify_details':
        draft_messages.polite = `Could you please provide more details about the item's condition? For example, about [specific aspect]?`;
        draft_messages.balanced = `Can you clarify the condition, especially regarding [specific aspect]?`;
        draft_messages.direct = `More condition details? Specifically [specific aspect]?`;
        tactics_safety_tips.push('Ensure all questions are answered before proceeding.');
        next_best_action = 'Ask specific questions about the item condition.';
        if (!listing.description) risks.push('Lacking detailed item description.');
        break;

      case 'schedule_meetup':
        draft_messages.polite = `Great! Would picking up between 10 AM-12 PM tomorrow or 4 PM-6 PM on Thursday work for you? I'm available near a public place like the City Park.`;
        draft_messages.balanced = `Let's meet tomorrow between 10 AM-12 PM or Thursday 4 PM-6 PM. Perhaps at the City Park?`;
        draft_messages.direct = `Pickup times: Tomorrow 10-12 PM or Thursday 4-6 PM. Meet at City Park.`;
        tactics_safety_tips.push('Meet in a well-lit, public place.');
        tactics_safety_tips.push('Share your meetup location and time with a friend or family member.');
        next_best_action = 'Propose concrete time windows and a safe public location.';
        break;
    }

    return {
      mode: Mode.MESSAGE_COACH_MODE,
      goal,
      draft_messages,
      ...(counter_offer && { counter_offer }),
      tactics_safety_tips: tactics_safety_tips.slice(0, 3),
      next_best_action,
      ...(risks.length > 0 && { risks }),
      ...(notes.length > 0 && { notes }),
    };
  }

  // Gemini chat functionality
  public async getSellerResponse(
    listing: Listing,
    chatContext: Message[]
  ): Promise<SellerResponse> {
    console.log("Calling Gemini for seller_response with context:", { listing, chatContext });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    const lastBuyerMessage = chatContext.filter(m => m.sender === 'buyer').pop()?.text.toLowerCase() || '';
    const sellerMessages = chatContext.filter(m => m.sender === 'seller').map(m => m.text);
    const buyerOffers = getOffers(chatContext, 'buyer');
    const lastBuyerOffer = buyerOffers.length > 0 ? buyerOffers[buyerOffers.length - 1] : null;
    const sellerCounters = getOffers(chatContext, 'seller');
    const lastSellerPrice = sellerCounters.length > 0 ? sellerCounters[sellerCounters.length - 1] : listing.askingPrice;

    const pickUnique = (options: string[]): string => {
      const availableOptions = options.filter(opt => !sellerMessages.includes(opt));
      return pickRandom(availableOptions.length > 0 ? availableOptions : options);
    };

    // Priority 1: Check if the buyer has accepted the seller's last price.
    if (lastBuyerOffer !== null && lastBuyerOffer >= lastSellerPrice) {
      return pickUnique([
          `Perfect, ${lastBuyerOffer} works for me. Let's meet at the mall entrance around 6 PM. Here's my number (555-123-4567) to coordinate.`,
          `You got it. $${lastBuyerOffer} is a deal. We can meet at the Starbucks on Oak Street. Let me know what time is good for you.`,
          `Deal! Let's arrange a meetup. I'm free this afternoon. The public library downtown is a good spot.`,
          `Awesome, it's a deal at $${lastBuyerOffer}. Can you meet at the Target parking lot today? You can text me at (555) 123-4567 when you're on your way.`
      ]);
    }
    
    // Priority 2: Handle initial "is it available" queries
    if (lastBuyerMessage.includes("available") && chatContext.length <= 2) {
      return pickUnique([
        `Yep, still available! Asking $${listing.askingPrice}, but open to reasonable offers.`,
        `Hi there! Yes, it's still available. My price is $${listing.askingPrice}.`,
        `It is! Happy to answer any questions. Asking $${listing.askingPrice}.`
      ]);
    }

    // Priority 3: Handle negotiation based on the buyer's offer relative to the seller's LAST price.
    if (lastBuyerOffer !== null) {
      // A) Offer is way too low
      if (lastBuyerOffer < lastSellerPrice * 0.7) {
        return pickUnique([
          `Sorry, that's a bit too low for me, especially since I'm already at $${lastSellerPrice}.`,
          `I appreciate the offer, but I can't go that low.`,
          `Unfortunately, that's too far from what I'm looking for. My price is $${lastSellerPrice}.`
        ]);
      }
      
      // B) Offer is low, but in negotiating range -> Make a counter-offer
      if (lastBuyerOffer < lastSellerPrice * 0.95) {
         const counterPrice = Math.round(Math.max(lastBuyerOffer * 1.08, lastSellerPrice * 0.92) / 5) * 5;
         if (counterPrice >= lastSellerPrice) {
              return pickUnique([
                 `I'm firm at $${lastSellerPrice}. That's my best price.`,
                 `Sorry, can't go any lower than $${lastSellerPrice} for now.`
              ]);
         }
         return pickUnique([
           `Thanks for the offer, but that's a little low. Could you meet me at $${counterPrice}?`,
           `We're getting closer! How about we settle at $${counterPrice}?`,
           `I can't do $${lastBuyerOffer}, but I could do $${counterPrice} for a quick pickup.`
         ]);
      }

      // C) Offer is very close to the last price -> Be a bit stubborn and push for the last price
      if (lastBuyerOffer >= lastSellerPrice * 0.95 && lastBuyerOffer < lastSellerPrice) {
        return pickUnique([
            `We are so close. My absolute lowest is $${lastSellerPrice}. Can you make that work?`,
            `I appreciate that. If you can do $${lastSellerPrice}, it's all yours.`,
            `I was really hoping for $${lastSellerPrice}. Let's stick with that and we have a deal.`
        ]);
      }
    }

    // Priority 4: Answer questions about condition
    if (lastBuyerMessage.includes("condition") || lastBuyerMessage.includes("scratches") || lastBuyerMessage.includes("issues")) {
        return pickUnique([
            `It's in '${listing.condition}' condition, as mentioned in the listing. ${listing.notesFromSeller || 'No major issues to report from my end.'}`,
            `Good question. It's in great shape. ${listing.description}`,
            `It's held up really well. ${listing.notesFromSeller || "I haven't noticed any major problems myself."}`
        ]);
    }

    // Fallback if no other condition is met
    return pickUnique([
      "I'm open to reasonable offers.",
      "Let me know if you have a price in mind!",
      "What were you thinking for price?",
      `My asking price is $${listing.askingPrice}, let me know what you think.`
    ]);
  }

  public async getBuyerSuggestions(
    listing: Listing,
    chatContext: Message[]
  ): Promise<BuyerHelperResponse> {
    console.log("Calling Gemini for buyer_helper with context:", { listing, chatContext });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lastSellerMessage = chatContext.filter(m => m.sender === 'seller').pop()?.text.toLowerCase() || '';
    const askingPrice = listing.askingPrice;

    const buyerOffers = getOffers(chatContext, 'buyer');
    const sellerCounters = getOffers(chatContext, 'seller');
    const lastSellerPrice = sellerCounters.length > 0 ? sellerCounters[sellerCounters.length - 1] : askingPrice;

    let advice = "";
    let suggestions: string[] = [];
    let target = Math.round(askingPrice * 0.88 / 5) * 5; // Initial target rounded to nearest $5

    const acceptedDeal = lastSellerMessage.includes("deal") || lastSellerMessage.includes("works for me") || lastSellerMessage.includes("you got it");
    const sellerCountered = lastSellerMessage.match(/\$(\d+)/) && (lastSellerMessage.includes('how about') || lastSellerMessage.includes('could you do') || lastSellerMessage.includes('meet me at'));
    const sellerIsFirm = lastSellerMessage.match(/my best price is|lowest is|can't go lower|price is firm|firm on/);
    const sellerRejected = (lastSellerMessage.includes("low for me") || lastSellerMessage.includes("can't accept that") || lastSellerMessage.includes("can't go that low")) && !sellerCountered;
    const negotiationStalled = buyerOffers.length >= 2 && sellerRejected;

    if (acceptedDeal) {
        const finalPrice = lastSellerPrice;
        advice = "You've got a deal! Now's the time to confirm the meetup details. Always choose a safe, public location.";
        suggestions = [
            "Great! That time works for me.",
            "Perfect, see you there!",
            "Sounds good, I'll text you when I'm on my way.",
            "Excellent! Looking forward to it."
        ];
        target = finalPrice;
    } else if (negotiationStalled) {
        target = Math.round(lastSellerPrice * 0.98 / 5) * 5;
        advice = `The negotiation has stalled. The seller rejected your last offers. You could try one final offer close to their last price, or it might be time to walk away.`;
        suggestions = [
            `I understand. My best and final offer is $${target}.`,
            `Okay, thanks for considering. I think I'll have to pass for now.`,
            `What is the absolute lowest you would take today?`
        ];
    } else if (sellerIsFirm) {
        const firmPriceMatch = lastSellerMessage.match(/(\d+)/);
        const firmPrice = firmPriceMatch ? parseInt(firmPriceMatch[0], 10) : lastSellerPrice;
        advice = `The seller is holding firm at $${firmPrice}. This is likely their final offer. You can accept, or politely walk away if it's too high for you.`;
        suggestions = [
            `Okay, I can do $${firmPrice}. Let's arrange pickup.`,
            `I understand. That's a bit more than I was hoping to spend. I'll have to think about it.`,
            `Thanks for letting me know. I'll pass for now, but good luck with the sale!`
        ];
        target = firmPrice;
    } else if (sellerCountered) {
        const sellerCounterPrice = parseInt(lastSellerMessage.match(/\$(\d+)/)![1], 10);
        target = Math.round(sellerCounterPrice * 0.97 / 5) * 5;
        advice = `The seller countered with $${sellerCounterPrice}. This is a great sign! They're willing to negotiate. Try offering a bit lower to seal the deal.`;
        suggestions = [
            `Thanks for being flexible. Would you take $${target} if I can pick it up today?`,
            `How about we meet in the middle at $${target}?`,
            `I can do that. Is $${sellerCounterPrice} your final price?`,
            `Okay, let's do $${sellerCounterPrice}. When are you free to meet?`
        ];
    } else if (sellerRejected && buyerOffers.length > 0) {
        target = Math.round(lastSellerPrice * 0.95 / 5) * 5;
        advice = `Your last offer was rejected. Try a more conservative bid around $${target} to show you're a serious buyer, or ask what they'd be comfortable with.`;
        suggestions = [
            `My apologies if that was too low. Would you consider $${target}?`,
            `I understand. What's the lowest you'd be willing to go?`,
            `No problem. Is the price negotiable at all?`,
            `Okay, what price would you be happy with?`
        ];
    } else {
        advice = `Start the negotiation. An opening offer around $${target} is reasonable for an item in '${listing.condition}' condition and often gets the conversation started.`;
        suggestions = [
            `Would you take $${target} cash?`,
            "What's the condition like in person? Any scratches I should know about?",
            `I'm very interested. Is the price flexible?`,
            `Could you do $${target}? I can pick it up this afternoon.`
        ];
    }

    return {
        suggested_messages: suggestions,
        target_price: target,
        deal_advice: advice
    };
  }
}
