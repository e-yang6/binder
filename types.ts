// Combined types from both projects
export enum Mode {
  SWIPE_MODE = 'swipe_mode',
  MESSAGE_COACH_MODE = 'message_coach_mode',
}

export type ListingQuality = 'poor' | 'used' | 'good' | 'like new';

// Unified Listing interface combining both projects
export interface Listing {
  id: string;
  title: string;
  description: string;
  imgUrl: string;
  condition: 'Brand New' | 'Like New' | 'Used - Good' | 'Used - Fair' | 'Needs Repair';
  askingPrice: number;
  price: string; // For compatibility with SwipeCartService
  location: string;
  image_url: string; // For compatibility with SwipeCartService
  quality: ListingQuality;
  additional_image_urls?: string[];
  seller_name?: string;
  posted_at: string;
  notesFromSeller?: string;
}

export type DealStyle = 'polite' | 'balanced' | 'aggressive';

export interface UserPrefs {
  max_price?: number;
  min_quality?: ListingQuality;
  preferred_locations?: string[];
  deal_style?: DealStyle;
}

export interface ChatMessage {
  sender: 'buyer' | 'seller';
  text: string;
}

export interface Message {
  id: string;
  sender: 'buyer' | 'seller';
  text: string;
  timestamp: string;
}

export interface Constraints {
  must_have_images?: boolean;
}

export interface ParsedPrice {
  currency: string;
  value: number;
}

export interface SwipeCartAIResponse {
  mode: Mode;
  decision?: 'left' | 'right';
  reason?: string;
  quick_facts?: string[];
  after_right_swipe?: {
    extra_fields: string[];
    follow_up_questions: string[];
  };
  goal?: MessageGoal;
  draft_messages?: { polite: string; balanced: string; direct: string };
  counter_offer?: { suggested_price: string; rationale: string };
  tactics_safety_tips?: string[];
  next_best_action?: string;
  risks?: string[];
  notes?: string[];
}

export interface SwipeModeAIResponse extends SwipeCartAIResponse {
  mode: Mode.SWIPE_MODE;
  decision: 'left' | 'right';
  reason: string;
  quick_facts: string[];
  after_right_swipe: {
    extra_fields: string[];
    follow_up_questions: string[];
  };
}

export type MessageGoal = 'start_conversation' | 'negotiate_price' | 'clarify_details' | 'schedule_meetup';

export interface MessageCoachModeAIResponse extends SwipeCartAIResponse {
  mode: Mode.MESSAGE_COACH_MODE;
  goal: MessageGoal;
  draft_messages: { polite: string; balanced: string; direct: string };
  counter_offer?: { suggested_price: string; rationale: string };
  tactics_safety_tips: string[];
  next_best_action: string;
}

export interface BuyerHelperResponse {
  suggested_messages: string[];
  target_price: number;
  deal_advice: string;
}

export type SellerResponse = string;
