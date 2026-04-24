export type UserRole = 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN'

/** Matches the backend user shape returned from auth endpoints */
export interface AuthUser {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  /** Convenience: firstName + lastName (computed client-side) */
  name: string
  role: UserRole
  isVerified: boolean
  isVerifiedLandlord: boolean
  avatarUrl: string | null
  emailVerified: boolean
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

/** Matches the backend Property model (with client-side normalisation) */
export interface Property {
  id: string
  title: string
  description: string
  /** Full display location string e.g. "Lekki Phase 1, Lagos" */
  location: string
  city: string
  state: string
  area: string
  address: string
  /** monthlyRent in naira */
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  furnishing: string
  images: string[]
  features: string[]
  /** DAILY | MONTHLY | YEARLY pricing model */
  priceType: 'DAILY' | 'MONTHLY' | 'YEARLY'
  /** isAvailable mapped to 'available' | 'rented' */
  status: 'available' | 'rented'
  isVerified: boolean
  isFlagged: boolean
  petAllowed: boolean
  maxGuests?: number
  hasPendingEdits?: boolean
  pendingData?: Record<string, any>
  latitude: number
  longitude: number
  views: number
  landlord: {
    id: string
    name: string
    firstName: string
    lastName: string
    phone?: string | null
    email?: string | null
    isVerified: boolean
    isVerifiedLandlord: boolean
    avatarUrl: string | null
  }
  createdAt: string
}

export interface PropertySearchParams {
  query?: string
  location?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  latitude?: number
  longitude?: number
  radiusKm?: number
  state?: string
  city?: string
  page?: number
  limit?: number
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  } | null
}

export interface GeocodedLocation {
  label: string
  latitude: number
  longitude: number
  zoom: number
}

export interface Booking {
  id: string
  propertyId: string
  tenantId: string
  landlordId: string
  date: string
  time: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESCHEDULED'
  createdAt: string
  updatedAt: string
  property?: {
    id: string
    title: string
    city: string
    address: string
  }
  tenant?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email: string
  }
}

export interface Agreement {
  id: string
  propertyId: string
  tenantId: string
  landlordId: string
  rentAmount: number
  duration: string
  terms: string
  status: 'DRAFT' | 'PENDING_TENANT' | 'SIGNED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  property?: {
    id: string
    title: string
    city: string
    address: string
  }
  tenant?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  landlord?: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
}

export interface ChatConversation {
  id: string
  propertyId: string
  tenantId: string
  landlordId: string
  createdAt: string
  updatedAt: string
  property: {
    id: string
    title: string
    city: string
    monthlyRent: number
  }
  tenant: {
    id: string
    firstName: string
    lastName: string
    phone: string
    avatarUrl: string | null
  }
  landlord: {
    id: string
    firstName: string
    lastName: string
    phone: string
    avatarUrl: string | null
  }
  messages?: ChatMessage[]
}

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'PDF' | 'VIDEO'

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  content: string
  type: MessageType
  mediaUrl: string | null
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  linkUrl: string | null
  createdAt: string
}

export interface FavoriteProperty extends Property {
  favoriteId: string
}

export type LeadStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface Lead {
  id: string
  propertyId: string
  tenantId: string
  agentId: string
  message: string | null
  status: LeadStatus
  chatId: string | null
  createdAt: string
  updatedAt: string
  property?: {
    id: string
    title: string
    city: string
    images: string[]
  }
  tenant?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email: string
    avatarUrl: string | null
  }
}

export interface AgentStats {
  totalListings: number
  pendingLeads: number
  acceptedLeads: number
  activeLeads: number
  pendingTours: number
  approvedTours: number
}
