/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform, PanInfo } from "framer-motion";
import {
    FiChevronRight, FiTrendingUp, FiClock, FiCalendar, FiTarget, FiHeart, FiMapPin,
    FiDollarSign, FiSearch, FiArrowRight, FiPlus, FiStar, FiUsers, FiTag,
    FiNavigation, FiX, FiLoader, FiCheck, FiAlertCircle, FiCompass, FiZap,
    FiFilter, FiMaximize2, FiMinimize2, FiPlay, FiMusic, FiCoffee, FiWifi, FiMenu,
    FiMoreHorizontal, FiBookmark, FiShare, FiGrid, FiList, FiEye, FiSliders
} from "react-icons/fi";
import {
    BsDroplet, BsLightningCharge, BsBuilding, BsTree, BsFlag, BsWater,
    BsDoorOpen, BsUmbrella, BsHouseDoor, BsMusicNote, BsBrush,
    BsCameraVideo, BsGlobe, BsGem, BsStars, BsMagic, BsFire, BsTicket,
    BsCardImage, BsCollection, BsDiamond
} from "react-icons/bs";
import { FaMountainSun } from "react-icons/fa6";
import { IoGameControllerOutline, IoTicketOutline, IoSparkles } from "react-icons/io5";
import { GiPartyPopper } from "react-icons/gi";
import EchoChatWidget from "./EchoChatWidget";
import EventMapWidget from "./EventMapWidget";
import { eventsApi } from '@/lib/api-client';

// Types
interface Event {
    id: string;
    title: string;
    image: string;
    date: Date;
    location: {
        name: string;
        address: string;
        coordinates: { lat: number; lng: number; }
    };
    price: { min: string; max?: string; amount: number };
    attendees: number;
    category: string;
    creator: {
        name: string;
        avatar: string;
        verified: boolean;
    };
    description: string;
    tags: string[];
    isHot?: boolean;
    isFeatured?: boolean;
}

interface Creator {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    verified: boolean;
    followers: number;
    bio: string;
    eventsCount: number;
    rating: number;
}

type CategoryType = "music" | "tech" | "art" | "games" | "food" | "sports" | "wellness" | "outdoor" | "nightlife" | "education";
type FilterType = "all" | "trending" | "upcoming" | "nft" | "free" | "this-week";
type ViewType = "grid" | "list";

// Clean categories with your color palette
const CATEGORIES = [
    { id: "music", label: "Music", icon: BsMusicNote, count: 245 },
    { id: "tech", label: "Tech", icon: BsLightningCharge, count: 189 },
    { id: "food", label: "Food", icon: FiCoffee, count: 356 },
    { id: "art", label: "Art", icon: BsBrush, count: 167 },
    { id: "sports", label: "Sports", icon: BsFlag, count: 234 },
    { id: "games", label: "Gaming", icon: IoGameControllerOutline, count: 198 },
    { id: "wellness", label: "Wellness", icon: BsTree, count: 145 },
    { id: "outdoor", label: "Outdoor", icon: FaMountainSun, count: 287 },
];

const FILTERS = [
    { id: "all", label: "All Events", icon: FiCalendar, count: 2145 },
    { id: "trending", label: "Trending", icon: FiTrendingUp, count: 89 },
    { id: "this-week", label: "This Week", icon: FiClock, count: 156 },
    { id: "free", label: "Free", icon: BsGem, count: 67 },
    { id: "nft", label: "NFT", icon: BsTicket, count: 23 },
];

// Production events data
const PRODUCTION_EVENTS: Event[] = [
    {
        id: "1",
        title: "Summer Music Festival 2025",
        image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
        date: new Date("2025-07-15"),
        location: {
            name: "Central Park",
            address: "New York, NY",
            coordinates: { lat: 40.7829, lng: -73.9654 }
        },
        price: { min: "$45", amount: 45 },
        attendees: 1250,
        category: "music",
        creator: {
            name: "EventPro",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Join thousands for the ultimate summer music experience",
        tags: ["outdoor", "festival", "live-music"],
        isHot: true,
        isFeatured: true
    },
    {
        id: "2",
        title: "Tech Innovation Summit 2025",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
        date: new Date("2025-08-20"),
        location: {
            name: "Convention Center",
            address: "San Francisco, CA",
            coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        price: { min: "Free", amount: 0 },
        attendees: 890,
        category: "tech",
        creator: {
            name: "TechEvents",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Connect with innovators and builders shaping the future",
        tags: ["networking", "innovation", "startup"],
        isHot: true
    },
    {
        id: "3",
        title: "Digital Art Exhibition: Future Visions",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
        date: new Date("2025-09-10"),
        location: {
            name: "Modern Gallery",
            address: "Los Angeles, CA",
            coordinates: { lat: 34.0522, lng: -118.2437 }
        },
        price: { min: "$25", amount: 25 },
        attendees: 456,
        category: "art",
        creator: {
            name: "ArtCollective",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
            verified: false
        },
        description: "Explore cutting-edge digital art from renowned artists",
        tags: ["exhibition", "digital-art", "gallery"],
        isFeatured: true
    },
    {
        id: "4",
        title: "Gaming Championship Finals",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
        date: new Date("2025-10-05"),
        location: {
            name: "Esports Arena",
            address: "Austin, TX",
            coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        price: { min: "$30", amount: 30 },
        attendees: 2100,
        category: "games",
        creator: {
            name: "GameMasters",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Watch the best players compete for the ultimate prize",
        tags: ["esports", "competition", "gaming"],
        isHot: true
    },
    {
        id: "5",
        title: "Street Food Festival",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
        date: new Date("2025-08-12"),
        location: {
            name: "Santa Monica Pier",
            address: "Santa Monica, CA",
            coordinates: { lat: 34.0195, lng: -118.4912 }
        },
        price: { min: "$20", amount: 20 },
        attendees: 3200,
        category: "food",
        creator: {
            name: "FoodieEvents",
            avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Taste amazing cuisine from around the world",
        tags: ["food", "festival", "outdoor"],
        isHot: true
    },
    {
        id: "6",
        title: "Yoga & Wellness Retreat",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
        date: new Date("2025-06-30"),
        location: {
            name: "Lake Tahoe Resort",
            address: "South Lake Tahoe, CA",
            coordinates: { lat: 38.9399, lng: -119.9772 }
        },
        price: { min: "$85", amount: 85 },
        attendees: 150,
        category: "wellness",
        creator: {
            name: "ZenMasters",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Find inner peace in nature's most beautiful setting",
        tags: ["wellness", "yoga", "retreat"],
        isFeatured: true
    },
];

const FEATURED_CREATORS: Creator[] = [
    {
        id: "1",
        name: "Olivia Martinez",
        email: "olivia@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
        verified: true,
        followers: 42500,
        bio: "Music producer & event organiser",
        eventsCount: 23,
        rating: 4.9
    },
    {
        id: "2",
        name: "Marcus Chen",
        email: "marcus@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop&crop=face",
        verified: true,
        followers: 31200,
        bio: "NFT artist & festival creator",
        eventsCount: 18,
        rating: 4.8
    },
    {
        id: "3",
        name: "Sarah Johnson",
        email: "rover@rovify.io",
        avatarUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=100&h=100&fit=crop&crop=face",
        verified: true,
        followers: 27800,
        bio: "Tech conference organiser",
        eventsCount: 31,
        rating: 4.9
    },
];

// Accurate Skeleton Loader Components
const EventCardSkeleton = ({ viewType = "grid" }: { viewType?: ViewType }) => {
    if (viewType === "list") {
        return (
            <div className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                    <div className="flex gap-4">
                        <div className="h-3 bg-gray-200 rounded w-20" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded-full" />
                            <div className="h-3 bg-gray-200 rounded w-16" />
                        </div>
                        <div className="flex gap-3">
                            <div className="h-3 bg-gray-200 rounded w-8" />
                            <div className="h-3 bg-gray-200 rounded w-10" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse shadow-sm" style={{ height: '384px' }}>
            {/* Image skeleton */}
            <div className="h-48 bg-gray-200 relative">
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="w-12 h-6 bg-gray-300 rounded" />
                    <div className="w-10 h-6 bg-gray-300 rounded" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-300 rounded-full" />
            </div>

            {/* Content skeleton */}
            <div className="p-5 space-y-4">
                <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-8" />
                </div>
            </div>
        </div>
    );
};

const TrendingEventSkeleton = () => (
    <div className="flex gap-3 p-4 rounded-xl animate-pulse">
        <div className="relative w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0">
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 rounded-full" />
        </div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="flex gap-2">
                <div className="h-3 bg-gray-200 rounded w-12" />
                <div className="h-3 bg-gray-200 rounded w-8" />
            </div>
            <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-10" />
                <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
        </div>
    </div>
);

const CreatorCardSkeleton = () => (
    <div className="flex items-center gap-3 p-4 rounded-xl animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-32" />
            <div className="flex gap-3">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-8" />
            </div>
        </div>
    </div>
);

// iOS-Style Category Button
const CategoryButton = ({ category, isActive, onClick }: {
    category: typeof CATEGORIES[number];
    isActive: boolean;
    onClick: () => void;
}) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
            ${isActive
                ? 'bg-[#FF5900] text-white shadow-lg shadow-[#FF5900]/25'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
            }
        `}
    >
        <category.icon className="w-4 h-4" />
        <span>{category.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            {category.count}
        </span>
    </motion.button>
);

// iOS-Style Event Card with Equal Heights
const EventCard = ({ event, viewType = "grid" }: {
    event: Event;
    viewType?: ViewType;
}) => {
    const isListView = viewType === "list";

    if (isListView) {
        return (
            <Link href={`/events/${event.id}`}>
                <motion.div
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-sm hover:shadow-md"
                >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover"
                        />
                        {event.isHot && (
                            <div className="absolute top-1.5 left-1.5 bg-[#FF5900] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                HOT
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1.5">
                                <FiCalendar className="w-3.5 h-3.5 text-[#3329CF]" />
                                {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <FiMapPin className="w-3.5 h-3.5 text-[#FF5900]" />
                                {event.location.name}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={event.creator.avatar}
                                    alt={event.creator.name}
                                    width={16}
                                    height={16}
                                    className="rounded-full"
                                />
                                <span className="text-sm text-gray-600 font-medium">{event.creator.name}</span>
                                {event.creator.verified && (
                                    <FiStar className="w-3 h-3 text-[#3329CF] fill-current" />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-full">
                                    {event.price.amount === 0 ? 'Free' : event.price.min}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FiUsers className="w-3 h-3" />
                                    {event.attendees}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    return (
        <Link href={`/events/${event.id}`}>
            <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:shadow-gray-900/5"
                style={{ height: '384px' }} // Fixed height for equal cards
            >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                            {event.price.amount === 0 ? 'Free' : event.price.min}
                        </span>
                        {event.isHot && (
                            <span className="bg-[#FF5900] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                                <BsFire className="w-3 h-3" />
                                HOT
                            </span>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <FiHeart className="w-4 h-4 text-gray-600 hover:text-[#FF5900]" />
                    </motion.button>
                </div>

                <div className="p-5 flex flex-col justify-between h-36"> {/* Fixed content height */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">{event.title}</h3>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <FiCalendar className="w-4 h-4 text-[#3329CF]" />
                            <span className="font-medium">{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <FiMapPin className="w-4 h-4 text-[#FF5900]" />
                            <span className="truncate font-medium">{event.location.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image
                                src={event.creator.avatar}
                                alt={event.creator.name}
                                width={24}
                                height={24}
                                className="rounded-full border-2 border-white shadow-sm"
                            />
                            <span className="text-sm text-gray-600 truncate font-medium">{event.creator.name}</span>
                            {event.creator.verified && (
                                <FiStar className="w-3.5 h-3.5 text-[#3329CF] fill-current" />
                            )}
                        </div>

                        <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-full font-medium">
                            <FiUsers className="w-3 h-3" />
                            {event.attendees}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

// Enhanced Trending Event Card with Context
const TrendingEventCard = ({ event, trendReason, trendMetric }: {
    event: Event;
    trendReason?: string;
    trendMetric?: string;
}) => (
    <Link href={`/events/${event.id}`}>
        <motion.div
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            className="relative flex gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-[#FF5900]/10"
        >
            {/* Trending Pulse Effect */}
            <motion.div
                className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5900]/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                />
                {/* Trending Badge */}
                <div className="absolute -top-1 -right-1 bg-[#FF5900] text-white text-xs p-1 rounded-full">
                    <FiTrendingUp className="w-2.5 h-2.5" />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{event.title}</h4>

                {/* Trending Reason */}
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-medium text-[#FF5900] bg-[#FF5900]/10 px-2 py-0.5 rounded-full">
                        {trendReason || "🔥 Going Viral"}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <span className="font-medium">{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="flex items-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        {event.attendees}
                    </span>
                </div>

                {/* Trend Metric */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#C281FF] bg-[#C281FF]/10 px-2 py-0.5 rounded-full">
                        {event.price.amount === 0 ? 'Free' : event.price.min}
                    </span>
                    <span className="text-xs font-bold text-[#18E299] flex items-center gap-1">
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            ↗
                        </motion.div>
                        {trendMetric || "+347%"}
                    </span>
                </div>
            </div>
        </motion.div>
    </Link>
);

// iOS-Style Creator Card
const CreatorCard = ({ creator }: { creator: Creator }) => (
    <Link href={`/creator/${creator.id}`}>
        <motion.div
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
        >
            <div className="relative">
                <Image
                    src={creator.avatarUrl}
                    alt={creator.name}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white shadow-sm"
                />
                {creator.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-[#3329CF] rounded-full p-1 border-2 border-white">
                        <FiStar className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{creator.name}</p>
                <p className="text-xs text-gray-600 truncate mb-1">{creator.bio}</p>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                        {creator.followers >= 1000 ? `${(creator.followers / 1000).toFixed(1)}k` : creator.followers} followers
                    </span>
                    <span className="text-xs text-[#18E299] flex items-center gap-1 bg-[#18E299]/10 px-2 py-0.5 rounded-full font-semibold">
                        <FiStar className="w-3 h-3" />
                        {creator.rating}
                    </span>
                </div>
            </div>
        </motion.div>
    </Link>
);

// iOS-Style Bottom Sheet for Mobile with Enhanced Scrolling
const MobileBottomSheet = ({ isOpen, onClose, trendingEvents, featuredCreators }: {
    isOpen: boolean;
    onClose: () => void;
    trendingEvents: Event[];
    featuredCreators: Creator[];
}) => {
    const [dragConstraints, setDragConstraints] = useState({ top: 0, bottom: 0 });

    const handleDragEnd = (event: MouseEvent | TouchEvent, info: PanInfo) => {
        if (info.offset.y > 100) {
            onClose();
        }
    };

    const trendingReasons = [
        "🔥 Going Viral",
        "⚡ Selling Fast",
        "🎉 Most Shared",
        "🌟 Editor's Pick"
    ];

    const trendMetrics = ["+347%", "+289%", "+156%", "+423%"];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 200 }}
                        dragElastic={{ top: 0, bottom: 0.2 }}
                        onDragEnd={handleDragEnd}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 right-0 bg-white rounded-t-3xl z-50 lg:hidden shadow-2xl flex flex-col"
                        style={{
                            bottom: '80px', // Account for bottom navbar (typically 64-80px)
                            height: 'calc(100vh - 160px)', // Total height minus navbar and some spacing
                            maxHeight: 'calc(100vh - 160px)'
                        }}
                    >
                        {/* Drag Handle - Fixed at top */}
                        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header - Fixed at top */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900">Discover</h2>
                                <span className="bg-[#FF5900]/10 text-[#FF5900] text-xs px-2 py-1 rounded-full font-bold">
                                    Hot
                                </span>
                            </div>
                            <motion.button
                                onClick={onClose}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Scrollable Content - Takes remaining space */}
                        <div
                            className="flex-1 overflow-y-auto overscroll-contain px-6"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                scrollBehavior: 'smooth'
                            }}
                        >
                            <div className="space-y-6 py-6 pb-12">
                                {/* Enhanced Trending Section */}
                                <div className="bg-gradient-to-br from-[#FF5900]/5 to-[#FF5900]/10 rounded-2xl p-5 border border-[#FF5900]/10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-[#FF5900]/20 rounded-xl flex items-center justify-center">
                                                <BsFire className="w-5 h-5 text-[#FF5900]" />
                                            </div>
                                            <motion.div
                                                className="absolute inset-0 bg-[#FF5900]/30 rounded-xl"
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Trending Now</h3>
                                            <p className="text-sm text-gray-600 font-medium">What&apos;s hot this week</p>
                                        </div>
                                        <motion.div
                                            className="ml-auto bg-[#FF5900] text-white text-xs px-3 py-1.5 rounded-full font-bold"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            Live
                                        </motion.div>
                                    </div>
                                    <div className="space-y-2">
                                        {trendingEvents.slice(0, 4).map((event, index) => (
                                            <TrendingEventCard
                                                key={event.id}
                                                event={event}
                                                trendReason={trendingReasons[index]}
                                                trendMetric={trendMetrics[index]}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Featured Creators */}
                                <div className="bg-gradient-to-br from-[#C281FF]/5 to-[#C281FF]/10 rounded-2xl p-5 border border-[#C281FF]/10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-[#C281FF]/20 rounded-xl flex items-center justify-center">
                                            <FiUsers className="w-5 h-5 text-[#C281FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Featured Creators</h3>
                                            <p className="text-sm text-gray-600 font-medium">Top event organizers</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {featuredCreators.map((creator) => (
                                            <CreatorCard key={creator.id} creator={creator} />
                                        ))}
                                    </div>
                                </div>

                                {/* Enhanced Stats with Brand Colors */}
                                <div className="bg-gradient-to-br from-[#3329CF] to-[#C281FF] rounded-2xl p-5 text-white">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <BsDiamond className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-white text-lg">Live Platform Stats</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">Total Events</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">2,145</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+12%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">Active Creators</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">489</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+8%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">This Week</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">156</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+24%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Main Component
export default function HomePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
    const [currentCategory, setCurrentCategory] = useState<CategoryType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [viewType, setViewType] = useState<ViewType>("grid");
    const [isMobileBottomSheetOpen, setIsMobileBottomSheetOpen] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    // Load events from Supabase
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const result = await eventsApi.getAll({
                    status: 'published',
                    limit: 20
                });
                
                if (result.data) {
                    // Transform Supabase data to match HomePage Event interface
                    const transformedEvents = result.data.map((event: any) => ({
                        id: event.id,
                        title: event.title,
                        image: event.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
                        date: new Date(event.date),
                        location: {
                            name: event.location?.name || 'Unknown Location',
                            address: event.location?.address || 'Unknown Address',
                            coordinates: {
                                lat: event.location?.coordinates?.lat || 0,
                                lng: event.location?.coordinates?.lng || 0
                            }
                        },
                        price: {
                            min: event.price?.min ? `$${event.price.min}` : 'Free',
                            amount: event.price?.min || 0
                        },
                        attendees: event.sold_tickets || 0,
                        category: event.category?.toLowerCase() || 'general',
                        creator: {
                            name: event.organiser?.name || 'Unknown Organiser',
                            avatar: event.organiser?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
                            verified: event.organiser?.verified || false
                        },
                        description: event.description || 'No description available',
                        tags: event.tags || [],
                        isHot: event.is_featured || Math.random() > 0.7, // Use featured or random for demo
                        isFeatured: event.is_featured || false
                    }));
                    setEvents(transformedEvents);
                } else {
                    console.error('Failed to fetch events:', result.error);
                    setEvents([]);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                setEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Load sidebar
    useEffect(() => {
        const timer = setTimeout(() => {
            setSidebarLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    // Prevent body scroll when bottom sheet is open
    useEffect(() => {
        if (isMobileBottomSheetOpen) {
            document.body.classList.add('bottom-sheet-open');
        } else {
            document.body.classList.remove('bottom-sheet-open');
        }

        return () => {
            document.body.classList.remove('bottom-sheet-open');
        };
    }, [isMobileBottomSheetOpen]);

    const filteredEvents = events.filter(event => {
        if (currentCategory && event.category !== currentCategory) return false;

        if (currentFilter === "trending") return event.isHot;
        if (currentFilter === "this-week") return event.date > new Date() && event.date < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (currentFilter === "free") return event.price.amount === 0;
        if (currentFilter === "nft") return event.tags.includes("nft") || event.category === "art";

        return true;
    });

    const trendingEvents = events.filter(e => e.isHot);

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto flex">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0 lg:mr-80">
                        <motion.div className="px-4 lg:px-6 pt-4 pb-8">
                            {/* Clean Hero Banner */}
                            <motion.div
                                className="mb-8 relative overflow-hidden rounded-2xl h-64 sm:h-80 md:h-96 bg-gradient-to-r from-[#3329CF] via-[#C281FF] to-[#FF5900] shadow-lg"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="relative h-full flex flex-col justify-center p-6 md:p-8 lg:p-12 text-white z-10">
                                    <motion.div
                                        className="flex flex-wrap items-center gap-2 mb-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold">
                                            🔥 Trending
                                        </span>
                                        <span className="bg-[#18E299] text-gray-900 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                            50% OFF
                                        </span>
                                    </motion.div>

                                    <motion.h2
                                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        Summer Festival 2025
                                    </motion.h2>
                                    <motion.p
                                        className="mb-6 text-white/90 max-w-lg text-base md:text-lg font-medium leading-relaxed"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        Experience world-class music, food, and unforgettable memories
                                    </motion.p>

                                    <motion.div
                                        className="flex flex-col sm:flex-row gap-3"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.button
                                            className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Get Tickets
                                        </motion.button>
                                        <motion.button
                                            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold border border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FiPlay className="w-4 h-4" />
                                            Watch Trailer
                                        </motion.button>
                                    </motion.div>
                                </div>

                                <motion.div
                                    className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/15 backdrop-blur-xl rounded-xl p-3 md:p-4 border border-white/20 shadow-lg"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <div className="text-center">
                                        <p className="text-white/80 text-xs md:text-sm font-medium">From</p>
                                        <p className="text-white font-black text-lg md:text-xl">$45</p>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Controls */}
                            <motion.div
                                className="flex justify-between items-center mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={() => setViewType(viewType === "grid" ? "list" : "grid")}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        {viewType === "grid" ? <FiList className="w-4 h-4" /> : <FiGrid className="w-4 h-4" />}
                                        <span className="hidden sm:inline font-medium">{viewType === "grid" ? "List" : "Grid"}</span>
                                    </motion.button>
                                </div>

                                <motion.button
                                    onClick={() => setIsMapOpen(true)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-gray-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg"
                                >
                                    <BsGlobe className="w-4 h-4" />
                                    <span>Map</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filteredEvents.length}
                                    </span>
                                </motion.button>
                            </motion.div>

                            {/* Categories */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Categories</h3>
                                    <Link href="/categories" className="text-[#FF5900] hover:text-[#FF5900]/80 text-sm font-semibold">
                                        View all
                                    </Link>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {CATEGORIES.map((category) => (
                                        <CategoryButton
                                            key={category.id}
                                            category={category}
                                            isActive={currentCategory === category.id}
                                            onClick={() => setCurrentCategory(
                                                currentCategory === category.id ? null : category.id as CategoryType
                                            )}
                                        />
                                    ))}
                                </div>
                            </motion.div>

                            {/* Filters */}
                            <motion.div
                                className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {FILTERS.map((filter) => (
                                    <motion.button
                                        key={filter.id}
                                        onClick={() => setCurrentFilter(filter.id as FilterType)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                        px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-200
                                        ${currentFilter === filter.id
                                                ? "bg-gray-900 text-white shadow-lg"
                                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
                                            }
                                    `}
                                    >
                                        <filter.icon className="w-4 h-4" />
                                        {filter.label}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${currentFilter === filter.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {filter.count}
                                        </span>
                                    </motion.button>
                                ))}
                            </motion.div>

                            {/* Results */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {currentCategory ? `${CATEGORIES.find(c => c.id === currentCategory)?.label} Events` :
                                            currentFilter !== "all" ? `${FILTERS.find(f => f.id === currentFilter)?.label}` :
                                                "All Events"}
                                    </h3>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                                        {filteredEvents.length} events
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className={viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                                        {[...Array(6)].map((_, i) => (
                                            <EventCardSkeleton key={i} viewType={viewType} />
                                        ))}
                                    </div>
                                ) : filteredEvents.length > 0 ? (
                                    <div className={viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                                        {filteredEvents.map((event, index) => (
                                            <motion.div
                                                key={event.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * (index % 3) }}
                                            >
                                                <EventCard event={event} viewType={viewType} />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                                            <FiSearch className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No events found</h4>
                                        <p className="text-gray-600 mb-6">Try adjusting your filters</p>
                                        <motion.button
                                            onClick={() => {
                                                setCurrentFilter("all");
                                                setCurrentCategory(null);
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-6 py-3 bg-[#FF5900] text-white rounded-xl font-semibold hover:bg-[#FF5900]/90 transition-colors shadow-lg"
                                        >
                                            Clear Filters
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* iOS-Style Right Sidebar - Desktop Only */}
                <div className="hidden lg:block fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-xl border-l border-gray-200/50 overflow-y-auto shadow-xl">
                    <div className="p-6 space-y-6 pb-24">
                        {sidebarLoading ? (
                            <>
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                                    <div className="flex gap-3 mb-4">
                                        <div className="w-8 h-8 bg-gray-200 rounded-xl" />
                                        <div className="space-y-1">
                                            <div className="h-4 bg-gray-200 rounded w-24" />
                                            <div className="h-3 bg-gray-200 rounded w-20" />
                                        </div>
                                    </div>
                                    {[...Array(4)].map((_, i) => (
                                        <TrendingEventSkeleton key={i} />
                                    ))}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                                    <div className="flex gap-3 mb-4">
                                        <div className="w-8 h-8 bg-gray-200 rounded-xl" />
                                        <div className="space-y-1">
                                            <div className="h-4 bg-gray-200 rounded w-28" />
                                            <div className="h-3 bg-gray-200 rounded w-24" />
                                        </div>
                                    </div>
                                    {[...Array(3)].map((_, i) => (
                                        <CreatorCardSkeleton key={i} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Enhanced Trending Section */}
                                <motion.div
                                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {/* Trending Background Effect */}
                                    <motion.div
                                        className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5900]/10 to-transparent rounded-bl-full"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />

                                    <div className="flex items-center gap-3 mb-5 relative z-10">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-[#FF5900]/10 rounded-xl flex items-center justify-center">
                                                <BsFire className="w-5 h-5 text-[#FF5900]" />
                                            </div>
                                            <motion.div
                                                className="absolute inset-0 bg-[#FF5900]/20 rounded-xl"
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Trending Now</h3>
                                            <p className="text-xs text-gray-600 font-medium">What&apos;s hot this week</p>
                                        </div>
                                        <motion.div
                                            className="ml-auto bg-[#FF5900] text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1"
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                            Live
                                        </motion.div>
                                    </div>

                                    <div className="space-y-1 relative z-10">
                                        {trendingEvents.slice(0, 4).map((event, index) => {
                                            const trendingReasons = ["🔥 Going Viral", "⚡ Selling Fast", "🎉 Most Shared", "🌟 Editor's Pick"];
                                            const trendMetrics = ["+347%", "+289%", "+156%", "+423%"];

                                            return (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 * index }}
                                                >
                                                    <TrendingEventCard
                                                        event={event}
                                                        trendReason={trendingReasons[index]}
                                                        trendMetric={trendMetrics[index]}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    <Link href="/trending" className="block mt-5 text-sm text-[#FF5900] hover:text-[#FF5900]/80 font-semibold">
                                        View all trending →
                                    </Link>
                                </motion.div>

                                {/* Featured Creators */}
                                <motion.div
                                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-8 h-8 bg-[#C281FF]/10 rounded-xl flex items-center justify-center">
                                            <FiUsers className="w-4 h-4 text-[#C281FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Featured Creators</h3>
                                            <p className="text-xs text-gray-600 font-medium">Top event organizers</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {FEATURED_CREATORS.map((creator, index) => (
                                            <motion.div
                                                key={creator.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                            >
                                                <CreatorCard creator={creator} />
                                            </motion.div>
                                        ))}
                                    </div>
                                    <Link href="/creators" className="block mt-5 text-sm text-[#C281FF] hover:text-[#C281FF]/80 font-semibold">
                                        View all creators →
                                    </Link>
                                </motion.div>

                                {/* Brand-Colored Stats */}
                                <motion.div
                                    className="bg-gradient-to-br from-[#3329CF] to-[#C281FF] rounded-2xl p-6 shadow-sm text-white"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <BsDiamond className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-bold text-white">Platform Stats</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">Total Events</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">2,145</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+12%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">Active Creators</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">489</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+8%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">This Week</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">156</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+24%</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Discovery Button */}
                <motion.button
                    onClick={() => setIsMobileBottomSheetOpen(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="lg:hidden fixed top-20 right-4 z-30 bg-[#C281FF] text-white p-3.5 rounded-2xl shadow-lg"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <FiSliders className="w-5 h-5" />
                </motion.button>
            </div>

            {/* iOS-Style Mobile Bottom Sheet */}
            <MobileBottomSheet
                isOpen={isMobileBottomSheetOpen}
                onClose={() => setIsMobileBottomSheetOpen(false)}
                trendingEvents={trendingEvents}
                featuredCreators={FEATURED_CREATORS}
            />

            <EventMapWidget
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                events={filteredEvents}
                title="Event Explorer"
                showFilter={true}
                apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY || ""}
            />

            <EchoChatWidget />

            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .line-clamp-1 {
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                }
                .line-clamp-2 {
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                }
                
                /* Enhanced mobile scrolling */
                .overscroll-contain {
                    overscroll-behavior: contain;
                }
                
                /* Smooth momentum scrolling for iOS */
                .overflow-y-auto {
                    -webkit-overflow-scrolling: touch;
                    scroll-behavior: smooth;
                }
                
                /* Prevent body scroll when bottom sheet is open */
                body.bottom-sheet-open {
                    overflow: hidden;
                    position: fixed;
                    width: 100%;
                }
            `}</style>
        </>
    );
}