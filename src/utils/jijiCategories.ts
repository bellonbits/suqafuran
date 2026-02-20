export interface SubCategory {
    name: string;
    count: number;
    image?: string;
}

export interface JijiCategory {
    id: string;
    label: string;
    icon: string; // Key to lookup in categoryIcons.tsx
    image?: string; // Path to category image
    count: number;
    subcategories: SubCategory[];
}

export const JIJI_CATEGORIES: JijiCategory[] = [
    {
        id: 'food-groceries',
        label: 'Raashinka & Cuntada (Food & Groceries)',
        icon: 'utensils',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Qudaarta (Vegetables)', count: 0, image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c12e8c?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Miraha (Fruits)', count: 0, image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400c?auto=format&fit=crop&q=80&w=200' },
            { name: '3 Bariiska & Baastada (Rice & Pasta)', count: 0, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200' },
            { name: '4 Hilibka (Meat)', count: 0, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200' },
            { name: '5 Kalluun & Cunto Badeed (Seafood)', count: 0, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=200' },
            { name: '6 Caanaha & Caanaha La\'eg (Milk & Dairy)', count: 0, image: 'https://images.unsplash.com/photo-1550583724-1255818c0533?auto=format&fit=crop&q=80&w=200' },
            { name: '7 Ukunta (Eggs)', count: 0, image: 'https://images.unsplash.com/photo-1582722472900-2fc70bafe824?auto=format&fit=crop&q=80&w=200' },
            { name: '8 Cuntooyinka Diyaarsan (Prepared Foods)', count: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200' }
        ]
    },
    {
        id: 'clothing-shoes',
        label: 'Dharka & Kabaha (Clothing & Shoes)',
        icon: 'fashion',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Dharka Ragga (Men’s Clothing)', count: 0, image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Dharka Dumarka (Women’s Clothing)', count: 0, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=200' },
            { name: '3 Dharka Carruurta (Children’s Clothing)', count: 0, image: 'https://images.unsplash.com/photo-1522771935377-50b32915cd67?auto=format&fit=crop&q=80&w=200' },
            { name: '4 Kabaha (Shoes)', count: 0, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200' },
            { name: '5 Agabka Dharka (Clothing Accessories)', count: 0, image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=200' }
        ]
    },
    {
        id: 'household-items',
        label: 'Alaabta Guriga (Household Items)',
        icon: 'home-living',
        image: 'https://images.unsplash.com/photo-1581850518616-bcb8077fa2aa?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Qalabka Jikada (Kitchenware)', count: 0, image: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Gogosha (Bedding)', count: 0, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=200' },
            { name: '3 Alaabta Qurxinta (Home Décor)', count: 0, image: 'https://images.unsplash.com/photo-1513519247388-4e282660bf6b?auto=format&fit=crop&q=80&w=200' },
            { name: '4 Qalabka Nadaafadda (Cleaning Supplies)', count: 0, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200' },
            { name: '5 Qalabka Korontada (Appliances)', count: 0, image: 'https://images.unsplash.com/photo-1583944246415-3200b343809e?auto=format&fit=crop&q=80&w=200' }
        ]
    },
    {
        id: 'electronics',
        label: 'Korontada & Elektaroonigga (Electronics)',
        icon: 'laptop',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Mobaylada (Mobile Phones)', count: 0, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Kombiyuutarada (Computers)', count: 0, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=200' },
            { name: '3 TV-yada (TVs)', count: 0, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=200' },
            { name: '4 Qalabka Elektaroonigga Kale (Other Electronics)', count: 0, image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=200' },
            { name: '5 Qalabka Dhagaha & Codka (Audio & Headphones)', count: 0, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200' }
        ]
    },
    {
        id: 'vehicles',
        label: 'Gaadiidka (Vehicles)',
        icon: 'car',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Baabuurta (Cars)', count: 0, image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Mootooyinka (Motorcycles)', count: 0, image: 'https://images.unsplash.com/photo-1558981403-c5f91cb9c2f1?auto=format&fit=crop&q=80&w=200' },
            { name: '3 Bajaajta (Tuk-tuks)', count: 0, image: 'https://images.unsplash.com/photo-1589330273752-6e9f16886e8e?auto=format&fit=crop&q=80&w=200' },
            { name: '4 Qalabka Gaadiidka (Vehicle Accessories)', count: 0, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=200' }
        ]
    },
    {
        id: 'livestock',
        label: 'Xoolaha Nool (Livestock)',
        icon: 'animals',
        image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Riyaha (Goats)', count: 0, image: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Idaha (Sheep)', count: 0, image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=200' },
            { name: '3 Lo’da (Cattle)', count: 0, image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=200' },
            { name: '4 Digaagga (Chickens)', count: 0, image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=200' },
            { name: '5 Geela (Camels)', count: 0, image: 'https://images.unsplash.com/photo-1510425482613-333e8b091f09?auto=format&fit=crop&q=80&w=200' }
        ]
    },
    {
        id: 'land-farms',
        label: 'Dhul & Beeraha (Land & Farms)',
        icon: 'agriculture',
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600',
        count: 0,
        subcategories: [
            { name: '1 Dhul Banaan (Vacant Land)', count: 0, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=200' },
            { name: '2 Beeraha (Farms)', count: 0, image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=200' },
            { name: '3 Dhul Beereed (Agricultural Land)', count: 0, image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=200' }
        ]
    }
];
