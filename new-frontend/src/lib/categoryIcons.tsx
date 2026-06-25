import {
    Apple, Shirt, Sofa, Laptop, Car, PawPrint, Wheat, Briefcase,
    SprayCan, Building2, Package, Sparkles, Tag, Carrot, Milk, Beef,
    Popcorn, CupSoda, Croissant, IceCreamCone, type LucideIcon
} from 'lucide-react';

export function getCategoryIcon(slug: string): LucideIcon {
    const lower = slug.toLowerCase();
    if (lower === 'all') return Sparkles;
    if (lower === 'deals') return Tag;
    if (lower.includes('vegetable') || lower.includes('qudaarta') || lower.includes('fruit') || lower.includes('miraha')) return Carrot;
    if (lower.includes('milk') || lower.includes('caanaha') || lower.includes('dairy') || lower.includes('egg') || lower.includes('ukunta')) return Milk;
    if (lower.includes('meat') || lower.includes('hilibka') || lower.includes('seafood') || lower.includes('kalluun') || lower.includes('fish')) return Beef;
    if (lower.includes('snack')) return Popcorn;
    if (lower.includes('drink') || lower.includes('beverage')) return CupSoda;
    if (lower.includes('bread') || lower.includes('bakery')) return Croissant;
    if (lower.includes('frozen') || lower.includes('ice')) return IceCreamCone;
    if (lower.includes('food') || lower.includes('grocery')) return Apple;
    if (lower.includes('cloth') || lower.includes('shoe') || lower.includes('apparel')) return Shirt;
    if (lower.includes('house') || lower.includes('home') || lower.includes('furniture')) return Sofa;
    if (lower.includes('electronics') || lower.includes('tech')) return Laptop;
    if (lower.includes('vehicle') || lower.includes('car')) return Car;
    if (lower.includes('live') || lower.includes('animal') || lower.includes('pet')) return PawPrint;
    if (lower.includes('land') || lower.includes('farm') || lower.includes('agriculture')) return Wheat;
    if (lower.includes('service') || lower.includes('job') || lower.includes('work')) return Briefcase;
    if (lower.includes('beauty') || lower.includes('health') || lower.includes('personal')) return SprayCan;
    if (lower.includes('property') || lower.includes('estate')) return Building2;
    return Package;
}
