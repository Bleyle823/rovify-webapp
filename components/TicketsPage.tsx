/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiClock, FiTag, FiSend, FiDownload, FiShare2 } from 'react-icons/fi';
import { Ticket, Event, User } from '@/types';
import { ticketsApi, eventsApi } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import BottomNavigation from '@/components/SideNavigation';
import Header from '@/components/Header';

export default function TicketsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [userTickets, setUserTickets] = useState<Array<Ticket & { event: Event }>>([]);
    const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
    const [activeTab, setActiveTab] = useState<'mytickets' | 'marketplace'>('mytickets');
    const [ticketView, setTicketView] = useState<'upcoming' | 'past' | 'nft'>('upcoming');
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseStep, setPurchaseStep] = useState(1);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const [ticketType, setTicketType] = useState<'GENERAL' | 'VIP'>('GENERAL');

    useEffect(() => {
        const fetchUserTickets = async () => {
            if (!isAuthenticated || !user) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                
                // Fetch user's tickets
                const ticketsResult = await ticketsApi.getUserTickets();
                if (ticketsResult.data) {
                    setUserTickets(ticketsResult.data);
                } else {
                    console.error('Failed to fetch tickets:', ticketsResult.error);
                    setUserTickets([]);
                }

                // Fetch available events for marketplace
                const eventsResult = await eventsApi.getAll({
                    status: 'published',
                    limit: 20
                });
                if (eventsResult.data) {
                    setAvailableEvents(eventsResult.data);
                } else {
                    console.error('Failed to fetch events:', eventsResult.error);
                    setAvailableEvents([]);
                }
            } catch (error) {
                console.error('Error fetching tickets:', error);
                setUserTickets([]);
                setAvailableEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserTickets();
    }, [isAuthenticated, user]);

    // Filter user tickets based on selected view
    const now = new Date();
    const filteredUserTickets = userTickets.filter(ticket => {
        if (ticketView === 'upcoming') {
            return new Date(ticket.event.date) > now;
        } else if (ticketView === 'past') {
            return new Date(ticket.event.date) <= now;
        } else { // nft
            return ticket.isNft;
        }
    });

    // Get selected ticket data
    const selectedTicketData = selectedTicket
        ? userTickets.find(t => t.id === selectedTicket)
        : null;

    // Handle ticket purchase
    const handlePurchaseTicket = (event: Event) => {
        setSelectedEvent(event);
        setPurchaseStep(1);
        setIsPurchasing(true);
    };

    const continueToPayment = () => {
        setPurchaseStep(2);
    };

    const completePayment = async () => {
        if (!selectedEvent || !user) return;

        try {
            setIsLoading(true);
            
            // Purchase ticket using real API
            const result = await ticketsApi.purchase({
                event_id: selectedEvent.id,
                type: ticketType,
                tier_name: ticketType,
                payment_method: 'stripe', // Default to stripe for now
                seat_info: {
                    section: 'General',
                    timeSlot: new Date().toISOString()
                }
            });

            if (result.data) {
                setIsPurchasing(false);
                // Refresh user tickets
                const ticketsResult = await ticketsApi.getUserTickets();
                if (ticketsResult.data) {
                    setUserTickets(ticketsResult.data);
                }
                router.push('/success?type=ticket');
            } else {
                console.error('Purchase failed:', result.error);
                alert('Purchase failed: ' + result.error);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Purchase failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate price based on ticket type and quantity
    const calculatePrice = () => {
        if (!selectedEvent) return 0;

        const basePrice = ticketType === 'VIP'
            ? selectedEvent.price.max
            : selectedEvent.price.min;

        return basePrice * ticketQuantity;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-6 pt-24 pb-32">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>

                    {/* View Switcher */}
                    <div className="bg-white rounded-xl p-1 shadow-neumorph-sm">
                        <button
                            onClick={() => setActiveTab('mytickets')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'mytickets'
                                ? 'bg-[#FF5722] text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            My Tickets
                        </button>
                        <button
                            onClick={() => setActiveTab('marketplace')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'marketplace'
                                ? 'bg-[#FF5722] text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Marketplace
                        </button>
                    </div>
                </div>

                {activeTab === 'mytickets' ? (
                    <>
                        {/* Filter tabs for mytickets */}
                        <div className="bg-white rounded-xl p-2 flex mb-6 overflow-x-auto no-scrollbar shadow-neumorph-sm">
                            {['upcoming', 'past', 'nft'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setTicketView(tab as 'upcoming' | 'past' | 'nft')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${ticketView === tab
                                        ? 'bg-[#FF5722]/10 text-[#FF5722] shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab === 'upcoming' && <FiClock className="w-4 h-4" />}
                                    {tab === 'past' && <FiCalendar className="w-4 h-4" />}
                                    {tab === 'nft' && <FiTag className="w-4 h-4" />}
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* My Tickets Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Ticket List */}
                            <div className="lg:col-span-1 space-y-4">
                                {isLoading ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="relative h-32 flex rounded-xl overflow-hidden shadow-neumorph-sm">
                                            {/* Left: Event Image Skeleton */}
                                            <div className="w-1/3 relative bg-gray-200 animate-pulse"></div>

                                            {/* Right: Ticket Info Skeleton */}
                                            <div className="w-2/3 bg-white p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="h-6 w-3/4 bg-gray-200 rounded-md animate-shimmer"></div>
                                                    <div className="h-4 w-1/2 bg-gray-200 rounded-md mt-2 animate-shimmer" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="h-4 w-2/3 bg-gray-200 rounded-md mt-2 animate-shimmer" style={{ animationDelay: '0.2s' }}></div>
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div className="h-5 w-20 bg-gray-200 rounded-md animate-shimmer" style={{ animationDelay: '0.3s' }}></div>
                                                    <div className="h-5 w-16 bg-gray-200 rounded-md animate-shimmer" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : filteredUserTickets.length > 0 ? (
                                    filteredUserTickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket.id)}
                                            className={`relative bg-white rounded-xl overflow-hidden flex cursor-pointer transform transition-all duration-300 ${selectedTicket === ticket.id
                                                ? 'shadow-[0_0_0_2px_#FF5722] scale-[1.02]'
                                                : 'shadow-neumorph-sm hover:shadow-[0_0_0_1px_#FF5722] hover:-translate-y-1'
                                                }`}
                                        >
                                            {/* Left: Event Image */}
                                            <div className="w-1/3 h-32 relative">
                                                <Image
                                                    src={ticket.event.image}
                                                    alt={ticket.event.title}
                                                    fill
                                                    className="object-cover"
                                                />

                                                {/* NFT Badge */}
                                                {ticket.isNft && (
                                                    <div className="absolute top-2 left-2 bg-[#FF5722] text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                        <FiTag className="w-3 h-3" />
                                                        NFT
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Ticket Info */}
                                            <div className="w-2/3 p-3 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 line-clamp-1">{ticket.event.title}</h3>
                                                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                                        <FiCalendar className="w-3 h-3 text-[#FF5722]" />
                                                        <span>{new Date(ticket.event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                                                        <FiMapPin className="w-3 h-3 text-[#FF5722]" />
                                                        <span className="line-clamp-1">{ticket.event.location.name}</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        {ticket.type}
                                                    </span>
                                                    <span className="text-[#FF5722] font-semibold text-sm">
                                                        #{ticket.tokenId?.substring(0, 4) || ticket.id.substring(0, 4)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ticket Perforation */}
                                            <div className="absolute h-full w-0 left-1/3 flex flex-col justify-between py-2">
                                                <div className="h-3 w-3 rounded-full bg-white shadow-inner border border-gray-100 -ml-1.5"></div>
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="h-1 w-1 rounded-full bg-white -ml-0.5"></div>
                                                ))}
                                                <div className="h-3 w-3 rounded-full bg-white shadow-inner border border-gray-100 -ml-1.5"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-xl p-8 text-center shadow-neumorph">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-[#FF5722]/10 rounded-full flex items-center justify-center">
                                            <FiTag className="w-7 h-7 text-[#FF5722]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No tickets found</h3>
                                        <p className="text-gray-500 mb-6">You don&apos;t have any {ticketView} tickets yet</p>
                                        <button
                                            onClick={() => setActiveTab('marketplace')}
                                            className="px-4 py-2 bg-[#FF5722] text-white rounded-lg shadow-sm hover:bg-[#E64A19] transition-colors"
                                        >
                                            Browse Marketplace
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Selected Ticket Details */}
                            <div className="lg:col-span-2">
                                {selectedTicketData ? (
                                    <div className="bg-white rounded-xl overflow-hidden shadow-neumorph">
                                        {/* Ticket Header with Glassmorphism */}
                                        <div className="relative h-48">
                                            <Image
                                                src={selectedTicketData.event.image}
                                                alt={selectedTicketData.event.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>

                                            {/* Overlay Content */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedTicketData.event.title}</h2>
                                                <div className="flex items-center gap-4 text-sm mt-1">
                                                    <div className="flex items-center gap-1 text-gray-700">
                                                        <FiCalendar className="w-4 h-4 text-[#FF5722]" />
                                                        <span>
                                                            {new Date(selectedTicketData.event.date).toLocaleDateString(undefined, {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-700">
                                                        <FiClock className="w-4 h-4 text-[#FF5722]" />
                                                        <span>
                                                            {new Date(selectedTicketData.event.date).toLocaleTimeString(undefined, {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ticket Content */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
                                            {/* Left: Ticket Info */}
                                            <div className="md:col-span-3 space-y-6">
                                                {/* Location */}
                                                <div className="bg-white p-4 rounded-xl shadow-neumorph-inset">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                                                    <div className="flex items-start gap-2">
                                                        <FiMapPin className="w-5 h-5 text-[#FF5722] mt-0.5" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{selectedTicketData.event.location.name}</p>
                                                            <p className="text-gray-600 text-sm">{selectedTicketData.event.location.address}</p>
                                                            <p className="text-gray-600 text-sm">{selectedTicketData.event.location.city}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ticket Details */}
                                                <div className="bg-white p-4 rounded-xl shadow-neumorph-inset">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Ticket Details</h3>
                                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                                        <div className="flex justify-between sm:block">
                                                            <dt className="text-gray-500">Type</dt>
                                                            <dd className="font-medium text-gray-900">{selectedTicketData.type}</dd>
                                                        </div>

                                                        <div className="flex justify-between sm:block">
                                                            <dt className="text-gray-500">Price Paid</dt>
                                                            <dd className="font-medium text-gray-900">
                                                                {selectedTicketData.currency} {selectedTicketData.price}
                                                            </dd>
                                                        </div>

                                                        <div className="flex justify-between sm:block">
                                                            <dt className="text-gray-500">Purchase Date</dt>
                                                            <dd className="font-medium text-gray-900">
                                                                {new Date(selectedTicketData.purchaseDate).toLocaleDateString()}
                                                            </dd>
                                                        </div>

                                                        <div className="flex justify-between sm:block">
                                                            <dt className="text-gray-500">Status</dt>
                                                            <dd className="font-medium">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedTicketData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                                    selectedTicketData.status === 'USED' ? 'bg-gray-100 text-gray-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {selectedTicketData.status}
                                                                </span>
                                                            </dd>
                                                        </div>

                                                        {selectedTicketData.isNft && (
                                                            <>
                                                                <div className="flex justify-between sm:block">
                                                                    <dt className="text-gray-500">Token ID</dt>
                                                                    <dd className="font-medium text-gray-900 font-mono">
                                                                        {selectedTicketData.tokenId}
                                                                    </dd>
                                                                </div>

                                                                <div className="flex justify-between sm:block">
                                                                    <dt className="text-gray-500">Contract</dt>
                                                                    <dd className="font-medium text-gray-900 font-mono text-xs truncate max-w-[180px]">
                                                                        {selectedTicketData.contractAddress}
                                                                    </dd>
                                                                </div>
                                                            </>
                                                        )}

                                                        {selectedTicketData.seatInfo && (
                                                            <div className="flex justify-between sm:block sm:col-span-2">
                                                                <dt className="text-gray-500">Seat Information</dt>
                                                                <dd className="font-medium text-gray-900">
                                                                    {selectedTicketData.seatInfo.section && `Section ${selectedTicketData.seatInfo.section}, `}
                                                                    {selectedTicketData.seatInfo.row && `Row ${selectedTicketData.seatInfo.row}, `}
                                                                    {selectedTicketData.seatInfo.seat && `Seat ${selectedTicketData.seatInfo.seat}`}
                                                                    {selectedTicketData.seatInfo.timeSlot && new Date(selectedTicketData.seatInfo.timeSlot).toLocaleTimeString(undefined, {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </dd>
                                                            </div>
                                                        )}
                                                    </dl>
                                                </div>

                                                {/* Perks (if any) */}
                                                {selectedTicketData.metadata.perks && selectedTicketData.metadata.perks.length > 0 && (
                                                    <div className="bg-white p-4 rounded-xl shadow-neumorph-inset">
                                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Included Perks</h3>
                                                        <ul className="space-y-2 text-sm">
                                                            {selectedTicketData.metadata.perks.map((perk, index) => (
                                                                <li key={index} className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-[#FF5722]/10 flex items-center justify-center flex-shrink-0">
                                                                        <svg className="w-3 h-3 text-[#FF5722]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-gray-700">{perk}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: QR Code & Actions */}
                                            <div className="md:col-span-2 space-y-6">
                                                {/* QR Code with Neumorphic Effect */}
                                                <div className="flex flex-col items-center">
                                                    <div className="p-4 rounded-xl shadow-neumorph bg-white">
                                                        <div className="p-1 bg-white rounded-lg border border-gray-100">
                                                            <Image
                                                                src={selectedTicketData.qrCode}
                                                                alt="Ticket QR Code"
                                                                width={180}
                                                                height={180}
                                                                className="rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                                        {selectedTicketData.isNft
                                                            ? 'NFT Ticket with on-chain verification'
                                                            : 'Scan at venue for entry'}
                                                    </p>
                                                </div>

                                                {/* Action Buttons with Improved Styling */}
                                                <div className="space-y-3">
                                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#FF5722] text-white hover:bg-[#E64A19] transition-colors shadow-sm">
                                                        <FiDownload className="w-4 h-4" />
                                                        Save Ticket
                                                    </button>

                                                    {selectedTicketData.transferable && (
                                                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-neumorph-sm hover:shadow-neumorph-inset">
                                                            <FiSend className="w-4 h-4" />
                                                            Transfer Ticket
                                                        </button>
                                                    )}

                                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-neumorph-sm hover:shadow-neumorph-inset">
                                                        <FiShare2 className="w-4 h-4" />
                                                        Share
                                                    </button>

                                                    {selectedTicketData.isNft && (
                                                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-neumorph-sm hover:shadow-neumorph-inset">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M8 12L8 8C8 5.79086 9.79086 4 12 4V4C14.2091 4 16 5.79086 16 8L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                <path d="M3 12H21V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V12Z" stroke="currentColor" strokeWidth="2" />
                                                                <path d="M12 17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            View on Blockchain
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // No ticket selected - Glass card effect
                                    <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center h-full glass-card min-h-[300px]">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-[#FF5722]/10 rounded-full flex items-center justify-center">
                                            <svg className="w-7 h-7 text-[#FF5722]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 14L12 17L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 17L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M20 14C20 17.3137 17.3137 20 14 20H10C6.68629 20 4 17.3137 4 14L4 10C4 6.68629 6.68629 4 10 4H14C17.3137 4 20 6.68629 20 10L20 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Ticket Selected</h3>
                                        <p className="text-gray-500 text-center max-w-md mb-6">
                                            Select a ticket from the list to view its details and manage your ticket
                                        </p>
                                        {!isLoading && filteredUserTickets.length === 0 && (
                                            <button
                                                onClick={() => setActiveTab('marketplace')}
                                                className="px-4 py-2 bg-[#FF5722] text-white rounded-lg shadow-sm hover:bg-[#E64A19] transition-colors"
                                            >
                                                Browse Marketplace
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    // Marketplace Tab
                    <>
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for events or tickets..."
                                    className="w-full py-3 pl-10 pr-4 bg-white rounded-full shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                                />
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-neumorph animate-shimmer">
                                        <div className="h-48 bg-gray-200"></div>
                                        <div className="p-4">
                                            <div className="h-6 w-3/4 bg-gray-200 rounded-md"></div>
                                            <div className="h-4 w-1/2 bg-gray-200 rounded-md mt-2"></div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="h-6 w-20 bg-gray-200 rounded-lg"></div>
                                                <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : availableEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableEvents.map((event) => (
                                    <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-neumorph hover:shadow-lg transition-all transform hover:-translate-y-1 duration-300">
                                        {/* Event Image with Glassmorphism Category */}
                                        <div className="relative h-48">
                                            <Image
                                                src={event.image}
                                                alt={event.title}
                                                fill
                                                className="object-cover"
                                            />
                                            {/* Category Tag with Glassmorphism */}
                                            <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                                                {event.category}
                                            </div>
                                            {/* NFT Badge */}
                                            {event.hasNftTickets && (
                                                <div className="absolute top-3 right-3 bg-[#FF5722] text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <FiTag className="w-3 h-3" />
                                                    NFT
                                                </div>
                                            )}
                                        </div>

                                        {/* Event Info */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
                                            <div className="flex items-center gap-4 text-sm mt-1 text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3 text-[#FF5722]" />
                                                    <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FiMapPin className="w-3 h-3 text-[#FF5722]" />
                                                    <span className="truncate max-w-[100px]">{event.location.city}</span>
                                                </div>
                                            </div>

                                            {/* Ticket Info & Buy Button */}
                                            <div className="flex justify-between items-center mt-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Tickets from</p>
                                                    <p className="font-semibold text-[#FF5722]">
                                                        {event.price.currency} {event.price.min}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handlePurchaseTicket(event)}
                                                    className="px-3 py-1.5 bg-[#FF5722] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#E64A19] transition-colors"
                                                >
                                                    Buy Tickets
                                                </button>
                                            </div>

                                            {/* Availability Progress */}
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Available tickets</span>
                                                    <span>{event.totalTickets - event.soldTickets} of {event.totalTickets}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#FF5722] to-[#FF8A65]"
                                                        style={{ width: `${(event.soldTickets / event.totalTickets) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl p-8 text-center shadow-neumorph">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[#FF5722]/10 rounded-full flex items-center justify-center">
                                    <FiTag className="w-7 h-7 text-[#FF5722]" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No events available</h3>
                                <p className="text-gray-500 mb-6">There are no events with available tickets at the moment</p>
                                <Link
                                    href="/"
                                    className="px-4 py-2 bg-[#FF5722] text-white rounded-lg shadow-sm hover:bg-[#E64A19] transition-colors"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </main>

            <BottomNavigation />

            {/* Purchase Modal with Glassmorphism */}
            {isPurchasing && selectedEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-lg animate-fade-in-up">
                        {/* Modal Header with Gradient and Glassmorphism */}
                        <div className="relative h-40">
                            <Image
                                src={selectedEvent.image}
                                alt={selectedEvent.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent"></div>

                            {/* Close Button with Neumorphism */}
                            <button
                                onClick={() => setIsPurchasing(false)}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-neumorph-sm hover:shadow-neumorph-inset flex items-center justify-center text-gray-700 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Event Title */}
                            <div className="absolute bottom-3 left-4 right-4">
                                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <FiCalendar className="w-3 h-3 text-[#FF5722]" />
                                        <span>{new Date(selectedEvent.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiMapPin className="w-3 h-3 text-[#FF5722]" />
                                        <span>{selectedEvent.location.city}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {purchaseStep === 1 ? (
                                // Step 1: Select tickets with Neumorphism
                                <>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Tickets</h4>

                                    {/* Ticket Types */}
                                    <div className="space-y-4 mb-6">
                                        {/* General Admission */}
                                        <div
                                            className={`p-4 rounded-lg transition-all cursor-pointer ${ticketType === 'GENERAL'
                                                ? 'shadow-[0_0_0_2px_#FF5722] bg-[#FF5722]/5'
                                                : 'shadow-neumorph-sm hover:shadow-[0_0_0_1px_#FF5722]'
                                                }`}
                                            onClick={() => setTicketType('GENERAL')}
                                        >
                                            <div className="flex justify-between mb-2">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">General Admission</h5>
                                                    <p className="text-sm text-gray-500">Standard entry to the event</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-[#FF5722]">
                                                        {selectedEvent.price.currency} {selectedEvent.price.min}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedEvent.totalTickets - selectedEvent.soldTickets} available
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    {selectedEvent.hasNftTickets && (
                                                        <div className="flex items-center gap-1">
                                                            <FiTag className="w-3 h-3 text-[#FF5722]" />
                                                            <span>NFT Ticket</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="ticketType"
                                                        checked={ticketType === 'GENERAL'}
                                                        onChange={() => setTicketType('GENERAL')}
                                                        className="w-4 h-4 text-[#FF5722] focus:ring-[#FF5722]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* VIP Ticket */}
                                        {selectedEvent.price.min !== selectedEvent.price.max && (
                                            <div
                                                className={`p-4 rounded-lg transition-all cursor-pointer ${ticketType === 'VIP'
                                                    ? 'shadow-[0_0_0_2px_#FF5722] bg-[#FF5722]/5'
                                                    : 'shadow-neumorph-sm hover:shadow-[0_0_0_1px_#FF5722]'
                                                    }`}
                                                onClick={() => setTicketType('VIP')}
                                            >
                                                <div className="flex justify-between mb-2">
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">VIP Experience</h5>
                                                        <p className="text-sm text-gray-500">Premium access with exclusive perks</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-[#FF5722]">
                                                            {selectedEvent.price.currency} {selectedEvent.price.max}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Limited availability</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        {selectedEvent.hasNftTickets && (
                                                            <div className="flex items-center gap-1">
                                                                <FiTag className="w-3 h-3 text-[#FF5722]" />
                                                                <span>NFT Ticket</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            name="ticketType"
                                                            checked={ticketType === 'VIP'}
                                                            onChange={() => setTicketType('VIP')}
                                                            className="w-4 h-4 text-[#FF5722] focus:ring-[#FF5722]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity Selector with Neumorphism */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quantity
                                        </label>
                                        <div className="flex items-center rounded-lg w-32 shadow-neumorph-sm">
                                            <button
                                                type="button"
                                                onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <div className="flex-1 text-center font-medium border-x">
                                                {ticketQuantity}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price Summary */}
                                    <div className="bg-gray-50 p-4 rounded-xl shadow-neumorph-inset mb-6">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">
                                                {ticketType} Ticket × {ticketQuantity}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {selectedEvent.price.currency} {ticketType === 'VIP' ? selectedEvent.price.max * ticketQuantity : selectedEvent.price.min * ticketQuantity}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="text-gray-600">Service Fee</span>
                                            <span className="font-medium text-gray-900">
                                                {selectedEvent.price.currency} {((ticketType === 'VIP' ? selectedEvent.price.max : selectedEvent.price.min) * ticketQuantity * 0.15).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-lg mt-4 pt-3 border-t border-gray-200">
                                            <span className="text-gray-900">Total</span>
                                            <span className="text-[#FF5722]">
                                                {selectedEvent.price.currency} {(calculatePrice() * 1.15).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={continueToPayment}
                                        className="w-full py-3 bg-[#FF5722] text-white font-medium rounded-lg shadow-sm hover:bg-[#E64A19] transition-colors"
                                    >
                                        Continue to Payment
                                    </button>
                                </>
                            ) : (
                                // Step 2: Payment with Neumorphism
                                <>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment</h4>

                                    {/* Payment Methods */}
                                    <div className="space-y-4 mb-6">
                                        <div className="p-4 rounded-lg shadow-[0_0_0_2px_#FF5722] bg-[#FF5722]/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-semibold text-sm">
                                                        VISA
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">•••• 4242</p>
                                                        <p className="text-xs text-gray-500">Expires 12/25</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="radio"
                                                    checked={true}
                                                    readOnly
                                                    className="w-4 h-4 text-[#FF5722] focus:ring-[#FF5722]"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500 shadow-neumorph-inset">
                                            Connect a wallet to access crypto payment methods
                                        </div>
                                    </div>

                                    {/* Total Summary */}
                                    <div className="bg-gray-50 p-4 rounded-xl shadow-neumorph-inset mb-6">
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span className="text-gray-900">Total Payment</span>
                                            <span className="text-[#FF5722]">
                                                {selectedEvent.price.currency} {(calculatePrice() * 1.15).toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPurchaseStep(1)}
                                            className="flex-1 py-3 bg-white text-gray-700 font-medium rounded-lg shadow-neumorph-sm hover:shadow-neumorph-inset transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={completePayment}
                                            className="flex-1 py-3 bg-[#FF5722] text-white font-medium rounded-lg shadow-sm hover:bg-[#E64A19] transition-colors"
                                        >
                                            Complete Purchase
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Styles for advanced UI effects */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
                
                .animate-shimmer {
                    background: linear-gradient(
                        90deg,
                        #f0f0f0 25%,
                        #e0e0e0 50%,
                        #f0f0f0 75%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
                }
                
                .shadow-neumorph {
                    box-shadow: 
                        8px 8px 16px rgba(0, 0, 0, 0.05),
                        -8px -8px 16px rgba(255, 255, 255, 0.8);
                }
                
                .shadow-neumorph-sm {
                    box-shadow: 
                        5px 5px 10px rgba(0, 0, 0, 0.05),
                        -5px -5px 10px rgba(255, 255, 255, 0.8);
                }
                
                .shadow-neumorph-inset {
                    box-shadow: 
                        inset 3px 3px 6px rgba(0, 0, 0, 0.05),
                        inset -3px -3px 6px rgba(255, 255, 255, 0.8);
                }
                
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}