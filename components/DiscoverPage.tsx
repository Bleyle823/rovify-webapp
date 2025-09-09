/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EventCategory, Event } from '@/types';
import EventCard from '@/components/EventCard';
import EventCardSkeleton from '@/components/skeletons/EventCardSkeleton';
import { eventsApi } from '@/lib/api-client';
import {
    FiSearch, FiMap, FiList, FiFilter, FiX, FiCalendar, FiDollarSign, FiTag, FiCheck, FiHash,
    FiMapPin, FiNavigation, FiLayers, FiZoomIn, FiZoomOut, FiCrosshair
} from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoicmtuZCIsImEiOiJjbWFwbTEzajAwMDVxMmlxeHY1dDdyY3h6In0.OQrYFVmEq-QL95nnbh1jTQ';

// Define filter types
interface DateFilter {
    label: string;
    value: string;
    selected: boolean;
}

interface PriceFilter {
    label: string;
    value: string;
    selected: boolean;
}

interface FeatureFilter {
    label: string;
    value: string;
    selected: boolean;
    color?: string;
}

// Ensure Event type is extended with features
interface ExtendedEvent extends Event {
    features?: string[];
}

export default function DiscoverPage() {
    const [events, setEvents] = useState<ExtendedEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
    const [activeFilter, setActiveFilter] = useState<EventCategory | 'ALL'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [isMapView, setIsMapView] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Advanced filter states
    const [dateFilters, setDateFilters] = useState<DateFilter[]>([
        { label: 'Today', value: 'today', selected: false },
        { label: 'This Weekend', value: 'weekend', selected: false },
        { label: 'This Week', value: 'week', selected: false },
        { label: 'This Month', value: 'month', selected: false },
    ]);

    const [priceFilters, setPriceFilters] = useState<PriceFilter[]>([
        { label: 'Free', value: 'free', selected: false },
        { label: 'Under $25', value: 'under25', selected: false },
        { label: '$25 - $50', value: '25-50', selected: false },
        { label: '$50 - $100', value: '50-100', selected: false },
        { label: '$100+', value: '100plus', selected: false },
    ]);

    const [featureFilters, setFeatureFilters] = useState<FeatureFilter[]>([
        { label: 'NFT Tickets', value: 'nft', selected: false, color: '#FF5722' },
        { label: 'Free Parking', value: 'parking', selected: false },
        { label: 'Accessible', value: 'accessible', selected: false },
        { label: 'Family Friendly', value: 'family', selected: false },
    ]);

    const [activeFilterCount, setActiveFilterCount] = useState(0);
    const [showFilterCount, setShowFilterCount] = useState(false);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const mapInitialized = useRef<boolean>(false);
    const filtersPanelRef = useRef<HTMLDivElement | null>(null);
    const customControls = useRef<HTMLDivElement | null>(null);

    // Define available map styles
    const mapStyles = [
        { id: 'light', label: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
        { id: 'dark', label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
        { id: 'streets', label: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
        { id: 'satellite', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' }
    ];

    // Current map style state
    const [currentMapStyle, setCurrentMapStyle] = useState(mapStyles[0]);

    // FIX 1: Define filteredEvents BEFORE updateMapMarkers
    // Filtered events using useMemo with advanced filtering
    const filteredEvents = useMemo(() => {
        // Start with category filter
        let filtered = events.filter(event =>
            activeFilter === 'ALL' || event.category === activeFilter
        );

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event => (
                event.title.toLowerCase().includes(query) ||
                event.location.name.toLowerCase().includes(query) ||
                event.category.toLowerCase().includes(query)
            ));
        }

        // Apply date filters if any are selected
        const activeDateFilters = dateFilters.filter(f => f.selected);
        if (activeDateFilters.length > 0) {
            const today = new Date();
            const weekend = new Date(today);
            weekend.setDate(today.getDate() + (6 - today.getDay()));

            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);

            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);

                return activeDateFilters.some(filter => {
                    switch (filter.value) {
                        case 'today':
                            return (
                                eventDate.getDate() === today.getDate() &&
                                eventDate.getMonth() === today.getMonth() &&
                                eventDate.getFullYear() === today.getFullYear()
                            );
                        case 'weekend':
                            return eventDate <= weekend && eventDate >= today;
                        case 'week':
                            return eventDate <= nextWeek && eventDate >= today;
                        case 'month':
                            return eventDate <= nextMonth && eventDate >= today;
                        default:
                            return true;
                    }
                });
            });
        }

        // Apply price filters if any are selected
        const activePriceFilters = priceFilters.filter(f => f.selected);
        if (activePriceFilters.length > 0) {
            filtered = filtered.filter(event => {
                // Convert price to number for comparison
                const priceValue = typeof event.price === 'number'
                    ? event.price
                    : Number(event.price); // Handle price as a string or custom type

                return activePriceFilters.some(filter => {
                    switch (filter.value) {
                        case 'free':
                            return priceValue === 0;
                        case 'under25':
                            return priceValue > 0 && priceValue < 25;
                        case '25-50':
                            return priceValue >= 25 && priceValue <= 50;
                        case '50-100':
                            return priceValue > 50 && priceValue <= 100;
                        case '100plus':
                            return priceValue > 100;
                        default:
                            return true;
                    }
                });
            });
        }

        // Apply feature filters if any are selected
        const activeFeatureFilters = featureFilters.filter(f => f.selected);
        if (activeFeatureFilters.length > 0) {
            filtered = filtered.filter(event => {
                return activeFeatureFilters.every(filter => {
                    switch (filter.value) {
                        case 'nft':
                            return !!event.hasNftTickets;
                        case 'parking':
                            return event.features?.includes('parking') || false;
                        case 'accessible':
                            return event.features?.includes('accessible') || false;
                        case 'family':
                            return event.features?.includes('family') || false;
                        default:
                            return true;
                    }
                });
            });
        }

        return filtered;
    }, [events, activeFilter, searchQuery, dateFilters, priceFilters, featureFilters]);

    // Helper function to get marker icon based on event category
    const getMarkerIcon = (category: string) => {
        switch (category.toUpperCase()) {
            case 'MUSIC':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
            case 'CONFERENCE':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
            case 'ART':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>';
            case 'GAMING':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="6" y1="11" x2="10" y2="11"></line><line x1="8" y1="9" x2="8" y2="13"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg>';
            case 'FILM':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>';
            case 'TECHNOLOGY':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
            case 'WORKSHOP':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
            case 'OUTDOOR':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
            case 'WELLNESS':
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
            default:
                return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
        }
    };

    // FIX 2: Wrap addCustomMapControls in useCallback
    // Function to add custom map controls
    const addCustomMapControls = useCallback(() => {
        if (!map.current || customControls.current) return;

        // Create container for controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'custom-map-controls';

        // Style layer control
        const styleControl = document.createElement('div');
        styleControl.className = 'custom-control style-control';

        // Style switcher button
        const styleButton = document.createElement('button');
        styleButton.className = 'control-button style-button';
        styleButton.innerHTML = `<div class="control-icon"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg></div>`;
        styleButton.title = 'Change map style';

        // Style options dropdown
        const styleOptions = document.createElement('div');
        styleOptions.className = 'style-options';

        // Create style option for each map style
        mapStyles.forEach(style => {
            const option = document.createElement('button');
            option.textContent = style.label;
            option.className = style.id === currentMapStyle.id ? 'active' : '';
            option.addEventListener('click', () => {
                // Update active style
                Array.from(styleOptions.children).forEach(child =>
                    (child as HTMLElement).className = (child as HTMLElement).textContent === style.label ? 'active' : ''
                );

                // Set new map style
                const newStyle = mapStyles.find(s => s.id === style.id) || mapStyles[0];
                setCurrentMapStyle(newStyle);

                // Hide dropdown after selection
                styleOptions.classList.remove('visible');
            });
            styleOptions.appendChild(option);
        });

        // Toggle style options visibility
        styleButton.addEventListener('click', () => {
            styleOptions.classList.toggle('visible');
        });

        // Add style control elements
        styleControl.appendChild(styleButton);
        styleControl.appendChild(styleOptions);
        controlsContainer.appendChild(styleControl);

        // Zoom controls
        const zoomControl = document.createElement('div');
        zoomControl.className = 'custom-control zoom-control';

        // Zoom in button
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'control-button';
        zoomInBtn.innerHTML = `<div class="control-icon"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></div>`;
        zoomInBtn.addEventListener('click', () => {
            if (map.current) map.current.zoomIn();
        });
        zoomInBtn.title = 'Zoom in';

        // Zoom out button
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'control-button';
        zoomOutBtn.innerHTML = `<div class="control-icon"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg></div>`;
        zoomOutBtn.addEventListener('click', () => {
            if (map.current) map.current.zoomOut();
        });
        zoomOutBtn.title = 'Zoom out';

        // Add zoom buttons to control
        zoomControl.appendChild(zoomInBtn);
        zoomControl.appendChild(zoomOutBtn);
        controlsContainer.appendChild(zoomControl);

        // 3D tilt control (pitch)
        const tiltControl = document.createElement('div');
        tiltControl.className = 'custom-control tilt-control';

        // Tilt button
        const tiltButton = document.createElement('button');
        tiltButton.className = 'control-button';
        tiltButton.innerHTML = `<div class="control-icon"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>`;
        tiltButton.title = 'Toggle 3D view';

        let is3DView = false;
        tiltButton.addEventListener('click', () => {
            if (!map.current) return;

            is3DView = !is3DView;

            if (is3DView) {
                // Animate to 3D view with a 60-degree pitch
                map.current.easeTo({
                    pitch: 60,
                    bearing: 30,
                    duration: 1000
                });
                tiltButton.classList.add('active');
            } else {
                // Return to 2D view
                map.current.easeTo({
                    pitch: 0,
                    bearing: 0,
                    duration: 1000
                });
                tiltButton.classList.remove('active');
            }
        });

        tiltControl.appendChild(tiltButton);
        controlsContainer.appendChild(tiltControl);

        // Reset view button
        const resetControl = document.createElement('div');
        resetControl.className = 'custom-control reset-control';

        const resetButton = document.createElement('button');
        resetButton.className = 'control-button';
        resetButton.innerHTML = `<div class="control-icon"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></div>`;
        resetButton.title = 'Reset view';

        resetButton.addEventListener('click', () => {
            updateMapMarkers.current();
        });

        resetControl.appendChild(resetButton);
        controlsContainer.appendChild(resetControl);

        // Add the custom controls container to the map
        mapContainer.current?.appendChild(controlsContainer);
        customControls.current = controlsContainer;
    }, [currentMapStyle, mapStyles, setCurrentMapStyle]); // Add dependencies

    // Now define updateMapMarkers after filteredEvents is defined
    // Function to update markers with enhanced styling
    const updateMapMarkers = useRef(() => {
        if (!map.current || !events.length) return;

        // Remove existing markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // Filter events based on current filters
        const eventsToShow = filteredEvents;

        // Create bounds object to fit all markers
        const bounds = new mapboxgl.LngLatBounds();

        // Add markers with enhanced styling
        eventsToShow.forEach((event) => {
            // Add location to bounds
            bounds.extend([
                event.location.coordinates.lng,
                event.location.coordinates.lat
            ]);

            // Create marker element with enhanced styling
            const el = document.createElement('div');
            el.className = 'event-marker';

            // Set marker HTML with more detailed styling based on event type
            el.innerHTML = `
                <div class="marker-container ${selectedEvent?.id === event.id ? 'selected' : ''}">
                    <div class="marker-pin-shadow"></div>
                    <div class="marker-pin ${selectedEvent?.id === event.id ? 'selected' : ''} ${event.category.toLowerCase()}">
                        <div class="marker-icon">
                            ${getMarkerIcon(event.category)}
                        </div>
                        <div class="marker-dot"></div>
                    </div>
                    ${event.hasNftTickets ? '<div class="marker-badge">NFT</div>' : ''}
                    ${selectedEvent?.id === event.id ? `
                        <div class="marker-label">
                            <span>${event.title}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            // Add click event
            el.addEventListener('click', () => {
                setSelectedEvent(event);

                // Zoom in slightly and center on the clicked marker
                if (map.current) {
                    map.current.flyTo({
                        center: [event.location.coordinates.lng, event.location.coordinates.lat],
                        zoom: Math.max(map.current.getZoom(), 14), // Don't zoom out if already zoomed in
                        offset: [0, -100], // Offset to account for the event card
                        duration: 800,
                        essential: true
                    });
                }
            });

            // Create and add the enhanced marker
            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat([event.location.coordinates.lng, event.location.coordinates.lat])
                .addTo(map.current!);

            markers.current.push(marker);
        });

        // Only fit bounds if we have events
        if (eventsToShow.length > 0) {
            map.current.fitBounds(bounds, {
                padding: { top: 100, bottom: 200, left: 50, right: 50 },
                maxZoom: 15,
                duration: 1000
            });
        }
    });

    // Fetch events from Supabase
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const result = await eventsApi.getAll({
                    status: 'published',
                    limit: 50
                });
                
                if (result.data) {
                    // Transform the data to match ExtendedEvent interface
                    const transformedEvents = result.data.map((event: any) => ({
                        ...event,
                        features: event.has_nft_tickets ? ['nft'] : [],
                        // Ensure location has the right structure
                        location: {
                            name: event.location?.name || 'Unknown Location',
                            address: event.location?.address || '',
                            city: event.location?.city || '',
                            coordinates: {
                                lat: event.location?.coordinates?.lat || 0,
                                lng: event.location?.coordinates?.lng || 0
                            }
                        }
                    }));
                    setEvents(transformedEvents);
                } else if (result.error) {
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

    // Handle clicks outside filter panel
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                filtersPanelRef.current &&
                !filtersPanelRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('[data-filter-toggle]')
            ) {
                setShowFilters(false);
            }
        }

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    // Update filter count
    useEffect(() => {
        const count =
            dateFilters.filter(filter => filter.selected).length +
            priceFilters.filter(filter => filter.selected).length +
            featureFilters.filter(filter => filter.selected).length;

        setActiveFilterCount(count);
        setShowFilterCount(count > 0);
    }, [dateFilters, priceFilters, featureFilters]);

    // FIX 3: Add addCustomMapControls to the dependency array
    // Initialize map when map view is activated
    useEffect(() => {
        // Only create map if in map view and container exists
        if (!isMapView || !mapContainer.current) {
            return;
        }

        // Initialize map if it doesn't exist yet
        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: currentMapStyle.url,
                center: [-74.5, 40],
                zoom: 9,
                pitchWithRotate: true,
                attributionControl: false
            });

            // Add standard navigation controls but don't add them yet
            // We'll create our own custom UI controls
            map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

            // Add geolocation control
            map.current.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true,
                    showUserHeading: true
                }),
                'bottom-right'
            );

            // Add event for when map loads
            map.current.on('load', () => {
                if (!map.current) return;

                // Add a sky layer for 3D effect if using satellite view
                if (currentMapStyle.id === 'satellite') {
                    map.current.addLayer({
                        'id': 'sky',
                        'type': 'sky',
                        'paint': {
                            'sky-type': 'atmosphere',
                            'sky-atmosphere-sun': [0.0, 0.0],
                            'sky-atmosphere-sun-intensity': 15
                        }
                    });
                }

                // Add markers once map is loaded
                updateMapMarkers.current();

                // Add terrain if on satellite view
                if (currentMapStyle.id === 'satellite') {
                    map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
                }
            });

            // Add map move event to update markers when panning
            map.current.on('moveend', () => {
                // We could implement performance optimizations here
                // Only update markers in view, etc.
            });

            mapInitialized.current = true;
        } else {
            // Map already exists, just update markers and style
            map.current.resize();
            map.current.setStyle(currentMapStyle.url);
            updateMapMarkers.current();
        }

        // Add custom controls when map is in view
        if (map.current && !customControls.current) {
            addCustomMapControls();
        }

        return () => {
            // Clean up markers but don't destroy map
            markers.current.forEach(marker => marker.remove());
            markers.current = [];

            // Remove custom controls when switching away from map
            if (customControls.current) {
                customControls.current.remove();
                customControls.current = null;
            }
        };
    }, [isMapView, currentMapStyle, addCustomMapControls]); // Add addCustomMapControls here

    // Update markers when events or filters change
    useEffect(() => {
        if (map.current && isMapView && mapInitialized.current) {
            updateMapMarkers.current();
        }
    }, [filteredEvents, selectedEvent, isMapView]);

    // Properly destroy map on component unmount
    useEffect(() => {
        return () => {
            if (map.current) {
                markers.current.forEach(marker => marker.remove());
                map.current.remove();
                map.current = null;
                mapInitialized.current = false;
            }
        };
    }, []);

    // Toggle date filter
    const toggleDateFilter = (index: number) => {
        setDateFilters(prev => {
            const updated = [...prev];
            updated[index].selected = !updated[index].selected;
            return updated;
        });
    };

    // Toggle price filter
    const togglePriceFilter = (index: number) => {
        setPriceFilters(prev => {
            const updated = [...prev];
            updated[index].selected = !updated[index].selected;
            return updated;
        });
    };

    // Toggle feature filter
    const toggleFeatureFilter = (index: number) => {
        setFeatureFilters(prev => {
            const updated = [...prev];
            updated[index].selected = !updated[index].selected;
            return updated;
        });
    };

    // Reset all filters
    const resetAllFilters = () => {
        setActiveFilter('ALL');
        setSearchQuery('');
        setDateFilters(prev => prev.map(filter => ({ ...filter, selected: false })));
        setPriceFilters(prev => prev.map(filter => ({ ...filter, selected: false })));
        setFeatureFilters(prev => prev.map(filter => ({ ...filter, selected: false })));
    };

    // Categories for filter - ensure WELLNESS is included in EventCategory
    const categories: Array<EventCategory | 'ALL'> = ['ALL', 'MUSIC', 'CONFERENCE', 'ART', 'GAMING', 'FILM', 'TECHNOLOGY', 'WORKSHOP', 'OUTDOOR', 'WELLNESS'];

    return (
        <div className="relative min-h-screen">
            {/* No header here - just search and filters */}
            <main className="pt-20 pb-20">
                <div className="bg-white pt-4 pb-2">
                    <div className="container mx-auto px-4">
                        {/* Search Bar */}
                        <div className="relative mb-5">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Search events, locations, categories..."
                                    className="w-full py-3.5 pl-12 pr-12 bg-white rounded-full shadow-sm border border-gray-100 focus:ring-2 focus:ring-[#FF5722] focus:border-transparent focus:shadow-md transition-all text-gray-700 placeholder-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="absolute left-4 flex items-center justify-center h-8 w-8 text-[#FF5722]">
                                    <FiSearch className="w-5 h-5" />
                                </div>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <FiX className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-sm text-gray-500 mr-1 flex items-center">
                                    <FiHash className="w-3.5 h-3.5 mr-1" /> Popular:
                                </span>
                                <button
                                    onClick={() => setSearchQuery("music festival")}
                                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-full transition-colors"
                                >
                                    Music Festival
                                </button>
                                <button
                                    onClick={() => setSearchQuery("tech conference")}
                                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-full transition-colors"
                                >
                                    Tech Conference
                                </button>
                                <button
                                    onClick={() => setSearchQuery("workshop")}
                                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-full transition-colors"
                                >
                                    Workshop
                                </button>
                                <button
                                    onClick={() => setSearchQuery("free events")}
                                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-full transition-colors"
                                >
                                    Free Events
                                </button>
                                <button
                                    onClick={() => setSearchQuery("weekend")}
                                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-full transition-colors"
                                >
                                    This Weekend
                                </button>
                            </div>
                        </div>

                        {/* View toggle and filters */}
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex space-x-2">
                                <div className="bg-gray-100 rounded-full p-1 flex">
                                    <button
                                        onClick={() => setIsMapView(false)}
                                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${!isMapView
                                            ? 'bg-white text-[#FF5722] shadow-sm'
                                            : 'text-gray-600'
                                            }`}
                                        aria-label="List view"
                                    >
                                        <FiList className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => setIsMapView(true)}
                                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isMapView
                                            ? 'bg-white text-[#FF5722] shadow-sm'
                                            : 'text-gray-600'
                                            }`}
                                        aria-label="Map view"
                                    >
                                        <FiMap className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                data-filter-toggle
                                onClick={() => setShowFilters(!showFilters)}
                                className={`h-10 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${showFilters
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                    }`}
                                aria-label="Filter"
                            >
                                <FiFilter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filters</span>
                                {showFilterCount && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-[#FF5722] text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Category Filters - Horizontal Scrollable */}
                        <div className="py-2 flex gap-2 overflow-x-auto hide-scrollbar">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === category
                                        ? 'bg-[#FF5722] text-white shadow-sm'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {category === 'ALL' ? 'All Events' : category.charAt(0) + category.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {/* Advanced Filters Panel - Beautiful and Functional */}
                        {showFilters && (
                            <div
                                ref={filtersPanelRef}
                                className="py-4 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg animate-slideDown"
                            >
                                <div className="px-4 pb-4 mb-4 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Refine your search</h3>
                                    <p className="text-sm text-gray-500">Use filters to find exactly what you&apos;re looking for</p>
                                </div>

                                <div className="px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Date Filter */}
                                    <div className="filter-group">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                            <FiCalendar className="mr-2 text-[#FF5722]" /> Date
                                        </h3>
                                        <div className="space-y-2">
                                            {dateFilters.map((filter, index) => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => toggleDateFilter(index)}
                                                    className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${filter.selected
                                                        ? 'bg-orange-50 text-[#FF5722] font-medium'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {filter.label}
                                                    {filter.selected && (
                                                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#FF5722] text-white">
                                                            <FiCheck className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price Filter */}
                                    <div className="filter-group">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                            <FiDollarSign className="mr-2 text-[#FF5722]" /> Price
                                        </h3>
                                        <div className="space-y-2">
                                            {priceFilters.map((filter, index) => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => togglePriceFilter(index)}
                                                    className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${filter.selected
                                                        ? 'bg-orange-50 text-[#FF5722] font-medium'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {filter.label}
                                                    {filter.selected && (
                                                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#FF5722] text-white">
                                                            <FiCheck className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Features Filter */}
                                    <div className="filter-group">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                            <FiTag className="mr-2 text-[#FF5722]" /> Features
                                        </h3>
                                        <div className="space-y-2">
                                            {featureFilters.map((filter, index) => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => toggleFeatureFilter(index)}
                                                    className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${filter.selected
                                                        ? 'bg-orange-50 text-[#FF5722] font-medium'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <span className="flex items-center">
                                                        {filter.color && (
                                                            <span
                                                                className="h-3 w-3 rounded-full mr-2"
                                                                style={{ backgroundColor: filter.color }}
                                                            ></span>
                                                        )}
                                                        {filter.label}
                                                    </span>
                                                    {filter.selected && (
                                                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#FF5722] text-white">
                                                            <FiCheck className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 px-4 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={resetAllFilters}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="ml-3 px-5 py-2 text-sm font-medium bg-[#FF5722] text-white rounded-lg hover:bg-[#e64a14] transition-colors shadow-sm"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area - Dynamic View Switching */}
                <div className="relative flex-1">
                    {/* Loading States */}
                    {isLoading ? (
                        <div className="container mx-auto px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, index) => (
                                    <EventCardSkeleton key={index} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Enhanced Map View */}
                            {isMapView && (
                                <div className="absolute inset-0 z-0 h-[calc(100vh-200px)]">
                                    {/* Map Container */}
                                    <div
                                        ref={mapContainer}
                                        className="h-full w-full map-container"
                                    />

                                    {/* Selected Event Overlay - Enhanced with better animations & UI */}
                                    {selectedEvent && (
                                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-10 animate-slideUp">
                                            <div className="relative">
                                                <div className="absolute -top-2 -right-2 z-20">
                                                    <button
                                                        onClick={() => setSelectedEvent(null)}
                                                        className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        <FiX className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                </div>

                                                <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all border border-gray-100">
                                                    <EventCard event={selectedEvent} disableLink={true} />

                                                    {/* Directions button */}
                                                    <div className="p-4 pt-0 flex justify-between items-center gap-3">
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedEvent.location.coordinates.lat},${selectedEvent.location.coordinates.lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <FiNavigation className="w-4 h-4" />
                                                            <span>Directions</span>
                                                        </a>

                                                        <Link
                                                            href={`/events/${selectedEvent.id}`}
                                                            className="flex-1 py-2.5 px-4 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <span>View Details</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Map Overlays - Event Count & Active Filters */}
                                    <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row justify-between gap-2 z-10">
                                        <div className="bg-white rounded-full shadow-md py-2 px-4 text-sm font-medium flex items-center gap-2">
                                            <FiMapPin className="text-[#FF5722] w-4 h-4" />
                                            <span>{filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'} Found</span>
                                        </div>

                                        {showFilterCount && (
                                            <div className="bg-white rounded-full shadow-md py-2 px-4 text-sm font-medium flex items-center gap-2">
                                                <FiFilter className="text-[#FF5722] w-4 h-4" />
                                                <span>{activeFilterCount} {activeFilterCount === 1 ? 'Filter' : 'Filters'} Applied</span>
                                                <button
                                                    onClick={resetAllFilters}
                                                    className="ml-1 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                >
                                                    <FiX className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Event Quick Navigation - Horizontal pill indicators for different categories */}
                                    <div className="absolute bottom-28 left-4 right-4 z-10">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-md py-2 px-2 overflow-x-auto hide-scrollbar">
                                            <div className="flex gap-1">
                                                {/* Current view indicator - shows which category has most events on screen */}
                                                {categories
                                                    .filter(cat => cat !== 'ALL')
                                                    .map(category => {
                                                        const count = filteredEvents.filter(e => e.category === category).length;
                                                        if (count === 0) return null;

                                                        return (
                                                            <button
                                                                key={category}
                                                                onClick={() => {
                                                                    setActiveFilter(category);
                                                                    // Find first event of this category and focus on it
                                                                    const firstEvent = filteredEvents.find(e => e.category === category);
                                                                    if (firstEvent && map.current) {
                                                                        map.current.flyTo({
                                                                            center: [firstEvent.location.coordinates.lng, firstEvent.location.coordinates.lat],
                                                                            zoom: 14,
                                                                            duration: 1000
                                                                        });
                                                                    }
                                                                }}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${activeFilter === category
                                                                    ? 'bg-[#FF5722] text-white'
                                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                <span dangerouslySetInnerHTML={{ __html: getMarkerIcon(category) }} className="h-3.5 w-3.5" />
                                                                <span>{category.charAt(0) + category.slice(1).toLowerCase()}</span>
                                                                <span className="bg-gray-200/50 text-gray-700 rounded-full h-4 w-4 inline-flex items-center justify-center text-[10px]">
                                                                    {count}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* List View - Clean Card Layout */}
                            {!isMapView && (
                                <div className="container mx-auto px-4 py-4 min-h-[calc(100vh-200px)]">
                                    {/* Active filter badges */}
                                    {showFilterCount && (
                                        <div className="mb-4">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <span className="text-sm font-medium text-gray-700 mr-1">
                                                    Filters:
                                                </span>

                                                {dateFilters.filter(f => f.selected).map(filter => (
                                                    <span key={filter.value} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-[#FF5722] rounded-full text-xs font-medium">
                                                        <FiCalendar className="w-3 h-3" />
                                                        {filter.label}
                                                        <button
                                                            onClick={() => {
                                                                const index = dateFilters.findIndex(f => f.value === filter.value);
                                                                if (index !== -1) toggleDateFilter(index);
                                                            }}
                                                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#FF5722] hover:text-white transition-colors ml-1"
                                                        >
                                                            <FiX className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}

                                                {priceFilters.filter(f => f.selected).map(filter => (
                                                    <span key={filter.value} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-[#FF5722] rounded-full text-xs font-medium">
                                                        <FiDollarSign className="w-3 h-3" />
                                                        {filter.label}
                                                        <button
                                                            onClick={() => {
                                                                const index = priceFilters.findIndex(f => f.value === filter.value);
                                                                if (index !== -1) togglePriceFilter(index);
                                                            }}
                                                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#FF5722] hover:text-white transition-colors ml-1"
                                                        >
                                                            <FiX className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}

                                                {featureFilters.filter(f => f.selected).map(filter => (
                                                    <span key={filter.value} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-[#FF5722] rounded-full text-xs font-medium">
                                                        <FiTag className="w-3 h-3" />
                                                        {filter.label}
                                                        <button
                                                            onClick={() => {
                                                                const index = featureFilters.findIndex(f => f.value === filter.value);
                                                                if (index !== -1) toggleFeatureFilter(index);
                                                            }}
                                                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#FF5722] hover:text-white transition-colors ml-1"
                                                        >
                                                            <FiX className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}

                                                {activeFilterCount > 0 && (
                                                    <button
                                                        onClick={resetAllFilters}
                                                        className="text-xs text-gray-600 underline hover:text-gray-800 ml-2"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {filteredEvents.length > 0 ? (
                                        <>
                                            <div className="mb-4 text-sm text-gray-500">
                                                Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredEvents.map((event) => (
                                                    <Link
                                                        href={`/events/${event.id}`}
                                                        key={event.id}
                                                        className="group"
                                                    >
                                                        <div className="h-full bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all overflow-hidden border border-gray-100">
                                                            <EventCard event={event} disableLink={true} />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="h-16 w-16 mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">No events found</h3>
                                            <p className="text-gray-500 mb-6">Try adjusting your filters or check back later</p>
                                            <button
                                                onClick={resetAllFilters}
                                                className="bg-white hover:bg-gray-50 border border-gray-200 transition-colors rounded-full px-6 py-2 font-medium"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Global Styles */}
            <style jsx global>{`
                /* Hide scrollbar */
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                /* Animation keyframes */
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out forwards;
                }
                
                /* Mapbox custom styles */
                .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib {
                    display: none !important;
                }
                
                .mapboxgl-ctrl-top-right {
                    top: 10px;
                    right: 10px;
                }
                
                .mapboxgl-ctrl-top-right .mapboxgl-ctrl {
                    margin: 0;
                }
                
                /* Map Container Styles */
                .map-container {
                    transition: all 0.3s ease;
                }
                
                .map-container .mapboxgl-canvas {
                    outline: none;
                }
                
                /* Enhanced Marker Styles */
                .event-marker {
                    cursor: pointer;
                    z-index: 1;
                    transition: all 0.2s ease;
                }
                
                .event-marker:hover {
                    z-index: 2;
                }
                
                .marker-container {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transform: translate(-50%, -50%);
                }
                
                .marker-pin {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    border: 2px solid #FF5722;
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 1;
                }
                
                .marker-container:hover .marker-pin {
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                
                .marker-pin.selected {
                    background: #FF5722;
                    transform: scale(1.2);
                    box-shadow: 0 4px 10px rgba(255, 87, 34, 0.3);
                    z-index: 10;
                }
                
                .marker-icon {
                    color: #FF5722;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    transition: all 0.2s ease;
                }
                
                .marker-pin.selected .marker-icon {
                    color: white;
                }
                
                /* Category-specific marker colors */
                .marker-pin.music { border-color: #FF5722; }
                .marker-pin.music .marker-icon { color: #FF5722; }
                .marker-pin.music.selected { background: #FF5722; }
                
                .marker-pin.conference { border-color: #2196F3; }
                .marker-pin.conference .marker-icon { color: #2196F3; }
                .marker-pin.conference.selected { background: #2196F3; }
                
                .marker-pin.art { border-color: #9C27B0; }
                .marker-pin.art .marker-icon { color: #9C27B0; }
                .marker-pin.art.selected { background: #9C27B0; }
                
                .marker-pin.gaming { border-color: #4CAF50; }
                .marker-pin.gaming .marker-icon { color: #4CAF50; }
                .marker-pin.gaming.selected { background: #4CAF50; }
                
                .marker-pin.film { border-color: #795548; }
                .marker-pin.film .marker-icon { color: #795548; }
                .marker-pin.film.selected { background: #795548; }
                
                .marker-pin.technology { border-color: #607D8B; }
                .marker-pin.technology .marker-icon { color: #607D8B; }
                .marker-pin.technology.selected { background: #607D8B; }
                
                .marker-pin.workshop { border-color: #FFC107; }
                .marker-pin.workshop .marker-icon { color: #FFC107; }
                .marker-pin.workshop.selected { background: #FFC107; }
                
                .marker-pin.outdoor { border-color: #8BC34A; }
                .marker-pin.outdoor .marker-icon { color: #8BC34A; }
                .marker-pin.outdoor.selected { background: #8BC34A; }
                
                .marker-pin.wellness { border-color: #00BCD4; }
                .marker-pin.wellness .marker-icon { color: #00BCD4; }
                .marker-pin.wellness.selected { background: #00BCD4; }
                
                /* Marker shadow */
                .marker-pin-shadow {
                    width: 36px;
                    height: 4px;
                    background: rgba(0,0,0,0.1);
                    border-radius: 50%;
                    position: absolute;
                    bottom: -6px;
                    filter: blur(2px);
                    transition: all 0.3s ease;
                }
                
                .marker-container:hover .marker-pin-shadow {
                    transform: scale(1.2);
                    filter: blur(3px);
                }
                
                /* Marker badge for NFT events */
                .marker-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: linear-gradient(135deg, #FF5722, #FF9800);
                    color: white;
                    font-size: 8px;
                    font-weight: bold;
                    padding: 2px 4px;
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    z-index: 2;
                }
                
                /* Label for selected marker */
                .marker-label {
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.7);
                    color: white;
                    font-size: 10px;
                    font-weight: medium;
                    padding: 3px 8px;
                    border-radius: 12px;
                    white-space: nowrap;
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    animation: fadeIn 0.3s ease;
                    z-index: 3;
                }
                
                /* Custom controls */
                .custom-map-controls {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 10;
                }
                
                .custom-control {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .control-button {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    color: #666;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .control-button:hover, .control-button.active {
                    background: #f1f1f1;
                    color: #FF5722;
                }
                
                .control-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .style-options {
                    display: none;
                    flex-direction: column;
                    width: 120px;
                    background: white;
                    border-top: 1px solid #eee;
                }
                
                .style-options.visible {
                    display: flex;
                }
                
                .style-options button {
                    padding: 8px;
                    text-align: left;
                    border: none;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 12px;
                }
                
                .style-options button:hover {
                    background: #f5f5f5;
                }
                
                .style-options button.active {
                    background: #f1f1f1;
                    color: #FF5722;
                    font-weight: 500;
                }
                
                .zoom-control {
                    display: flex;
                    flex-direction: column;
                }
                
                .zoom-control .control-button:first-child {
                    border-bottom: 1px solid #eee;
                }
                
                /* Animations */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out forwards;
                }
                
                /* Hide Mapbox branding */
                .mapboxgl-ctrl-attrib-inner {
                    display: none;
                }
            `}</style>
        </div>
    );
}