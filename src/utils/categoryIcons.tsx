import {
    Car, Home, Smartphone, Briefcase, Sofa,
    Dumbbell, Heart, Watch, Menu, Tag, Laptop,
    Shirt, Bike, Camera, Music, Book,
    Gamepad, ShoppingBag, Utensils, Zap, Wrench,
    Sprout, Baby, Hammer, Armchair, HelpCircle
} from 'lucide-react';
import React from 'react';

export const iconMap: Record<string, any> = {
    'car': Car,
    'home': Home,
    'smartphone': Smartphone,
    'briefcase': Briefcase,
    'sofa': Sofa,
    'dumbbell': Dumbbell,
    'heart': Heart,
    'watch': Watch,
    'menu': Menu,
    'tag': Tag,
    'laptop': Laptop,
    'shirt': Shirt,
    'bike': Bike,
    'camera': Camera,
    'music': Music,
    'book': Book,
    'wrench': Wrench,
    'tool': Wrench,
    'gamepad': Gamepad,
    'shopping-bag': ShoppingBag,
    'utensils': Utensils,
    'zap': Zap,
    'sprout': Sprout,
    'agriculture': Sprout,
    'fashion': Shirt,
    'health-beauty': Heart,
    'sports': Bike,
    'babies-kids': Baby,
    'baby': Baby,
    'hammer': Hammer,
    'construction': Hammer,
    'armchair': Armchair,
    'home-living': Armchair
};

export const getCategoryIcon = (iconName: string) => {
    return iconMap[iconName.toLowerCase()] || HelpCircle;
};
