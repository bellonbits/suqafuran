import {
    Car, Home, Smartphone, Briefcase, Sofa,
    Dumbbell, Heart, Watch, Menu
} from 'lucide-react';

export const CATEGORIES = [
    { id: '1', label: 'Vehicles', icon: Car, color: 'bg-primary-50 text-primary-500' },
    { id: '2', label: 'Property', icon: Home, color: 'bg-green-50 text-green-600' },
    { id: '3', label: 'Electronics', icon: Smartphone, color: 'bg-purple-50 text-purple-600' },
    { id: '4', label: 'Jobs', icon: Briefcase, color: 'bg-orange-50 text-orange-600' },
    { id: '5', label: 'Home & Furniture', icon: Sofa, color: 'bg-yellow-50 text-yellow-600' },
    { id: '6', label: 'Sports', icon: Dumbbell, color: 'bg-red-50 text-red-600' },
    { id: '7', label: 'Health & Beauty', icon: Heart, color: 'bg-pink-50 text-pink-600' },
    { id: '8', label: 'Fashion', icon: Watch, color: 'bg-teal-50 text-teal-600' },
    { id: '9', label: 'More', icon: Menu, color: 'bg-gray-50 text-gray-600' },
];

export const FEATURED_ADS = [
    {
        id: 'ad1',
        title: 'Toyota Corolla 2018 - Clean & Well Maintained',
        price: 1850000,
        location: 'Nairobi, Westlands',
        imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop',
        isVerified: true,
        isPromoted: true,
    },
    {
        id: 'ad2',
        title: 'iPhone 15 Pro Max 256GB Titanium Blue',
        price: 165000,
        location: 'Nairobi, CBD',
        imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800&auto=format&fit=crop',
        isVerified: true,
        isPromoted: false,
    },
    {
        id: 'ad3',
        title: 'Modern 2 Bedroom Apartment to Let',
        price: 75000,
        location: 'Mombasa, Nyali',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
        isVerified: false,
        isPromoted: true,
    },
    {
        id: 'ad4',
        title: 'PlayStation 5 Console + 2 Controllers',
        price: 85000,
        location: 'Kisumu City',
        imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800&auto=format&fit=crop',
        isVerified: true,
        isPromoted: false,
    },
    {
        id: 'ad5',
        title: 'Executive Leather Sofa Set (7 Seater)',
        price: 120000,
        location: 'Nakuru, Milimani',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
        isVerified: false,
        isPromoted: false,
    },
    {
        id: 'ad6',
        title: 'Rolex Submariner Date - Luxury Watch',
        price: 2400000,
        location: 'Nairobi, Karen',
        imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop',
        isVerified: true,
        isPromoted: true,
    },
];
