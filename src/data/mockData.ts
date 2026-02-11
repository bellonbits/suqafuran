export const MOCK_CATEGORIES = [
    { id: '1', name: 'Vehicles', slug: 'vehicles', icon_name: 'car' },
    { id: '2', name: 'Electronics', slug: 'electronics', icon_name: 'smartphone' },
    { id: '3', name: 'Property', slug: 'property', icon_name: 'home' },
    { id: '4', name: 'Home & Living', slug: 'home-living', icon_name: 'armchair' },
    { id: '5', name: 'Jobs', slug: 'jobs', icon_name: 'briefcase' },
    { id: '6', name: 'Services', slug: 'services', icon_name: 'wrench' },
    { id: '7', name: 'Agriculture & Food', slug: 'agriculture', icon_name: 'sprout' },
    { id: '8', name: 'Fashion', slug: 'fashion', icon_name: 'shirt' },
    { id: '9', name: 'Beauty & Wellness', slug: 'health-beauty', icon_name: 'heart' },
    { id: '10', name: 'Sports & Outdoors', slug: 'sports', icon_name: 'bike' },
    { id: '11', name: 'Babies & Kids', slug: 'babies-kids', icon_name: 'baby' },
    { id: '12', name: 'Construction & Industry', slug: 'construction', icon_name: 'hammer' },
];

import type { Listing } from '../types/listing';

export const MOCK_LISTINGS: Partial<Listing>[] = [
    {
        id: 1,
        title: 'Toyota Corolla 2022 - High Spec',
        price: 18500,
        location: 'Mogadishu, Hodan',
        description: 'Excellent condition Toyota Corolla 2022. Low mileage, fuel efficient, and very reliable for city driving.\n\nFeatures:\n- Automatic Transmission\n- Touchscreen Infotainment\n- Reverse Camera\n- Alloy Wheels',
        images: [
            'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800',
            'https://images.unsplash.com/photo-1623993044068-daaf40f35338?q=80&w=800'
        ],
        attributes: {
            'Engine': '1.8L Hybrid',
            'Mileage': '15,000 km',
            'Transmission': 'Automatic',
            'Fuel Type': 'Petrol/Hybrid',
            'Year': '2022'
        },
        owner: {
            id: 1001,
            full_name: 'Somali Auto Spares',
            email: 'sales@somaliauto.so',
            is_verified: true,
            response_time: 'Typically responds in 1 hour',
            phone: '+252 61 555 1234'
        }
    },
    {
        id: 2,
        title: 'Samsung Galaxy S24 Ultra - 512GB',
        price: 1150,
        location: 'Hargeisa, Maroodi Jeex',
        description: 'Brand new Samsung S24 Ultra. Titanium Gray, 512GB storage. Includes all original accessories and 1-year warranty.',
        images: [
            'https://images.unsplash.com/photo-1707230491515-998811d7eb62?q=80&w=800',
            'https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?q=80&w=800'
        ],
        attributes: {
            'Storage': '512 GB',
            'RAM': '12 GB',
            'Color': 'Titanium Gray',
            'Screen': '6.8" Dynamic AMOLED',
            'Warranty': '1 Year'
        },
        owner: {
            id: 1002,
            full_name: 'Hargeisa Tech Hub',
            email: 'info@hargeisatech.so',
            is_verified: true,
            response_time: 'Responds instantly',
            phone: '+252 63 444 5678'
        }
    },
    {
        id: 3,
        title: '3 Bedroom Modern Apartment in Garowe',
        price: 45000,
        location: 'Garowe, Puntland',
        description: 'Luxurious 3-bedroom apartment in a secure neighborhood in Garowe. Spacious rooms, modern kitchen, and 24/7 security.',
        images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800'
        ],
        attributes: {
            'Bedrooms': '3',
            'Bathrooms': '2',
            'Floor Size': '150 sqm',
            'Parking': 'Available',
            'Security': '24/7'
        },
        owner: {
            id: 1003,
            full_name: 'Puntland Properties',
            email: 'contact@puntlandprop.so',
            is_verified: true,
            response_time: 'Responds within a day',
            phone: '+252 66 777 8888'
        }
    },
    {
        id: 4,
        title: 'MacBook Pro 14" M3 Pro Chip',
        price: 2400,
        location: 'Mogadishu, Waberi',
        description: 'Power through your work with the latest M3 Pro Chip. 18GB Unified Memory, 512GB SSD. Space Black.',
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800',
            'https://images.unsplash.com/photo-1611186871348-b1ec696e5237?q=80&w=800'
        ],
        attributes: {
            'Processor': 'M3 Pro',
            'Memory': '18 GB',
            'Storage': '512 GB SSD',
            'Display': '14.2" Liquid Retina XDR',
            'Color': 'Space Black'
        },
        owner: {
            id: 1004,
            full_name: 'Mogadishu Tech Hub',
            email: 'sales@mogadishutech.so',
            is_verified: true,
            response_time: 'Typically responds in 3 hours',
            phone: '+252 61 999 0000'
        }
    }
];
