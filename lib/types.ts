// ── User & Auth ───────────────────────────────────────────────────────────────

export interface User {
  id: number; // Laravel auto-increment
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "agent" | "buyer"; // matches Laravel enum
  avatar: string | null; // full URL from asset()
  is_active: boolean;
  created_at: string; // ISO string from Laravel
  updated_at?: string;
}

export interface Agent extends Omit<User, "role"> {
  role: "agent";
  license_number: string | null;
  specialization: string | null;
  experience_years: number | null;
  listings: number;
  rating: number;
  review_count: number;
}

// ── Property ──────────────────────────────────────────────────────────────────

// Values returned by Laravel PropertyController transformProperty()
export type PropertyType =
  | "house"
  | "condo"
  | "townhouse"
  | "lot"
  | "commercial"
  | "warehouse";
export type ListingType = "sale" | "rent"; // matches Laravel enum
export type PropertyStatus = "active" | "sold" | "rented" | "inactive"; // matches Laravel enum

export interface PropertyImage {
  id: number;
  url: string; // full URL from asset()
  sort_order: number;
}

export interface PropertyTag {
  id?: number;
  label: string;
  color: string;
  active?: boolean;
}

export interface Property {
  type: string;
  image(image: (image: any) => unknown): unknown;
  image(image: any): unknown;
  blur_hash: string;
  id: string;
  title: string;
  description: string | null;
  listing_type: ListingType;
  tags?: PropertyTag[] | string;
  property_type: PropertyType;
  status: PropertyStatus;
  raw_id?: number;
  // Pricing
  price: number | null; // for sale
  price_per_month: number | null; // for rent
  source?: "agent" | "developer";
  // Location
  address: string;
  city: string;
  state: string | null;
  zip_code: string | null;

  // Details
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null; // sqm
  year_built: number | null;

  // Media
  thumbnail: string | null; // full URL from asset()
  images: PropertyImage[];

  // Relations
  amenities: string[]; // plucked names
  features: string[]; // plucked names
  agent: PropertyAgent | null;
  priority: number | null;
  // Timestamps
  created_at: string;
  updated_at: string;

  // ── Legacy camelCase aliases (for backward compat with existing components) ──
  // Remove these once all components are updated to snake_case
  listingType?: ListingType;
  pricePerMonth?: number | null;
  yearBuilt?: number | null;
  zipCode?: string | null;

  // Null-safe re-exports for components that don't expect null
  // Use these with ?? fallback: property.price ?? 0
}

// Subset of agent data embedded in property response
export interface PropertyAgent {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  specialization: string | null;
  experience_years: number | null;
}

// ── Inquiry ───────────────────────────────────────────────────────────────────

export type InquiryStatus = "new" | "contacted" | "viewed" | "closed";
export type PreferredContact = "sms" | "viber" | "email" | "phone";

export interface Inquiry {
  id: number;
  property_id: number;
  agent_id: number;
  lead_name: string;
  lead_phone: string;
  lead_email: string | null;
  message: string | null;
  preferred_contact: PreferredContact;
  viewing_date: string | null; // ISO date string
  status: InquiryStatus;
  created_at: string;
  updated_at: string;

  // Eager loaded relations (optional)
  property?: Pick<Property, "id" | "title" | "thumbnail" | "address" | "city">;
  agent?: Pick<Agent, "id" | "name" | "phone" | "avatar">;
}

// ── Tour ──────────────────────────────────────────────────────────────────────

export type TourType = "in-person" | "video";
export type TourStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Tour {
  id: number;
  property_id: number;
  agent_id: number;
  tour_type: TourType;
  tour_date: string; // ISO date string
  tour_time: string; // HH:MM:SS
  lead_name: string;
  lead_phone: string;
  lead_email: string | null;
  preferred_contact: PreferredContact;
  status: TourStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Eager loaded relations (optional)
  property?: Pick<Property, "id" | "title" | "thumbnail" | "address" | "city">;
  agent?: Pick<Agent, "id" | "name" | "phone" | "avatar">;
}

// ── Paginated API response ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface PropertyFilter {
  listing_type?: ListingType;
  property_type?: PropertyType;
  status?: PropertyStatus;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

// ── Form data ─────────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "buyer" | "agent";
  license_number?: string; // required if role === 'agent'
}

export interface ListPropertyFormData {
  title: string;
  description?: string;
  listing_type: ListingType;
  property_type: PropertyType;
  price?: number;
  price_per_month?: number;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  year_built?: number;
  amenities?: string[];
  features?: string[];
}
export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Location {
  id: string;
  city: string;
  state: string;
  propertiesCount: number;
  avgPrice: number;
}
// ── Blog ──────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author: User;
  category: string;
  tags: string[];
  published: boolean;
  view_count: number;
  /** @deprecated use view_count */
  viewCount?: number;
  created_at: string;
  updated_at: string;
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  property_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  property_id?: number;
  message: string;
  read: boolean;
  created_at: string;
}

export interface PropertyStats {
  total_properties: number;
  active_listings: number;
  sold_properties: number;
  total_revenue: number;
  avg_days_on_market: number;
}
