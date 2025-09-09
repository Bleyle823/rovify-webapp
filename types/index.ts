import { StaticImport } from "next/dist/shared/lib/get-img-props";

// Event Types
export type EventCategory =
    | 'MUSIC'
    | 'CONFERENCE'
    | 'WORKSHOP'
    | 'ART'
    | 'WELLNESS'
    | 'GAMING'
    | 'FILM'
    | 'AUTOMOTIVE'
    | 'TECHNOLOGY'
    | 'FOOD'
    | 'OUTDOOR'
    | 'WELLNESS';

export interface Location {
    name: string;
    address: string;
    city: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface Organiser {
    id: string;
    name: string;
    image: string;
    verified: boolean;
}

export interface Price {
    amount: number;
    min: number;
    max: number;
    currency: string;
}

export interface Event {
    popularity?: number;
    venue?: Location;
    imageUrl?: string | StaticImport;
    id: string;
    title: string;
    description: string;
    image: string;
    date: Date;
    endDate: Date;
    location: Location;
    organiser: Organiser;
    category: string;
    subcategory: string;
    price: Price;
    hasNftTickets: boolean;
    totalTickets: number;
    soldTickets: number;
    tags: string[];
    attendees: string[];
    likes: number;
    comments: number;
    shares: number;
}

// User Types
export type NotificationType = 'REMINDER' | 'FRIEND_GOING' | 'NEW_EVENT' | 'PRICE_DROP';

export interface UserPreferences {
    notificationTypes: NotificationType[];
    locationRadius: number;
    currency: string;
}

export interface User {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    image?: string;
    bio?: string;
    interests?: string[];
    followers?: number;
    following?: number;
    walletAddress?: string;
    savedEvents?: string[];
    attendedEvents?: string[];
    createdEvents?: string[];
    preferences?: UserPreferences;
    verified?: boolean;
    authMethod?: 'email' | 'google' | 'metamask' | 'base';
    role?: 'admin' | 'attendee' | 'organiser';
    baseName?: string;
    ethName?: string;
    [key: string]: unknown; // Allowing additional properties
}

// Ticket Types
export type TicketStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'TRANSFERRED';
export type TicketType = 'GENERAL' | 'VIP' | 'EARLY_BIRD' | 'PREMIUM' | 'FESTIVAL_PASS';

export interface SeatInfo {
    section?: string;
    row?: string;
    seat?: string;
    timeSlot?: string;
}

export interface TicketMetadata {
    issuer: string;
    edition: string;
    perks: string[];
    [key: string]: string | number | boolean | string[] | number[] | boolean[] | null;
}

export interface Ticket {
    id: string;
    eventId: string;
    ownerId: string;
    type: TicketType;
    price: number;
    currency: string;
    purchaseDate: Date;
    isNft: boolean;
    tokenId: string | null;
    contractAddress: string | null;
    transferable: boolean;
    status: TicketStatus;
    seatInfo: SeatInfo | null;
    qrCode: string;
    metadata: TicketMetadata;
}

// API Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface EventSearchParams {
    category?: EventCategory;
    location?: string;
    radius?: number;
    startDate?: Date;
    endDate?: Date;
    hasNftTickets?: boolean;
    minPrice?: number;
    maxPrice?: number;
    query?: string;
    limit?: number;
    offset?: number;
}

// Web3 Types
export interface Web3Config {
    chainId: number;
    contractAddress: string;
    rpcUrl: string;
    explorer: string;
}

export type BasicUser = Pick<User, 'id' | 'name' | 'email' | 'image'>;

export interface Session {
    user: BasicUser;
    expires: string;
    accessToken?: string;
}

export interface Window {
    ethereum?: {
        isMetaMask?: boolean;
        isCoinbaseWallet?: boolean;
        isBase?: boolean;
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (eventName: string, callback: (...args: unknown[]) => void) => void;
        removeListener: (eventName: string, callback: (...args: unknown[]) => void) => void;
        chainId?: string;
    }
}