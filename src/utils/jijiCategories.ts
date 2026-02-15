export interface SubCategory {
    name: string;
    count: number;
}

export interface JijiCategory {
    id: string;
    label: string;
    icon: string; // Key to lookup in categoryIcons.tsx
    count: number;
    subcategories: SubCategory[];
}

export const JIJI_CATEGORIES: JijiCategory[] = [
    {
        id: 'food-groceries',
        label: 'Raashinka & Cuntada',
        icon: 'utensils',
        count: 0,
        subcategories: [
            { name: 'Qudaarta (Vegetables)', count: 0 },
            { name: 'Miraha (Fruits)', count: 0 },
            { name: 'Bariiska & Baastada (Rice & Pasta)', count: 0 },
            { name: 'Hilibka (Meat)', count: 0 },
            { name: 'Kalluun & Cunto Badeed (Seafood)', count: 0 },
            { name: 'Caanaha & Caanaha La\'eg (Milk & Dairy)', count: 0 },
            { name: 'Ukunta (Eggs)', count: 0 },
            { name: 'Cuntooyinka Diyaarsan (Prepared Foods)', count: 0 }
        ]
    },
    {
        id: 'clothing-shoes',
        label: 'Dharka & Kabaha',
        icon: 'fashion',
        count: 0,
        subcategories: [
            { name: 'Dharka Ragga (Men’s Clothing)', count: 0 },
            { name: 'Dharka Dumarka (Women’s Clothing)', count: 0 },
            { name: 'Dharka Carruurta (Children’s Clothing)', count: 0 },
            { name: 'Kabaha (Shoes)', count: 0 },
            { name: 'Agabka Dharka (Clothing Accessories)', count: 0 }
        ]
    },
    {
        id: 'household-items',
        label: 'Alaabta Guriga',
        icon: 'home-living',
        count: 0,
        subcategories: [
            { name: 'Qalabka Jikada (Kitchenware)', count: 0 },
            { name: 'Gogosha (Bedding)', count: 0 },
            { name: 'Alaabta Qurxinta (Home Décor)', count: 0 },
            { name: 'Qalabka Nadaafadda (Cleaning Supplies)', count: 0 },
            { name: 'Qalabka Korontada (Appliances)', count: 0 }
        ]
    },
    {
        id: 'electronics',
        label: 'Korontada & Elektaroonigga',
        icon: 'laptop',
        count: 0,
        subcategories: [
            { name: 'Mobaylada (Mobile Phones)', count: 0 },
            { name: 'Kombiyuutarada (Computers)', count: 0 },
            { name: 'TV-yada (TVs)', count: 0 },
            { name: 'Qalabka Elektaroonigga Kale (Other Electronics)', count: 0 },
            { name: 'Qalabka Dhagaha & Codka (Audio & Headphones)', count: 0 }
        ]
    },
    {
        id: 'vehicles',
        label: 'Gaadiidka',
        icon: 'car',
        count: 0,
        subcategories: [
            { name: 'Baabuurta (Cars)', count: 0 },
            { name: 'Mootooyinka (Motorcycles)', count: 0 },
            { name: 'Bajaajta (Tuk-tuks)', count: 0 },
            { name: 'Qalabka Gaadiidka (Vehicle Accessories)', count: 0 }
        ]
    },
    {
        id: 'livestock',
        label: 'Xoolaha Nool',
        icon: 'animals',
        count: 0,
        subcategories: [
            { name: 'Riyaha (Goats)', count: 0 },
            { name: 'Idaha (Sheep)', count: 0 },
            { name: 'Lo’da (Cattle)', count: 0 },
            { name: 'Digaagga (Chickens)', count: 0 },
            { name: 'Geela (Camels)', count: 0 }
        ]
    },
    {
        id: 'land-farms',
        label: 'Dhul & Beeraha',
        icon: 'agriculture',
        count: 0,
        subcategories: [
            { name: 'Dhul Banaan (Vacant Land)', count: 0 },
            { name: 'Beeraha (Farms)', count: 0 },
            { name: 'Dhul Beereed (Agricultural Land)', count: 0 }
        ]
    }
];
