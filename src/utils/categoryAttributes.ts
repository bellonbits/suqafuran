export interface CategoryAttribute {
    name: string;
    label: string;
    type: 'text' | 'select' | 'number';
    options?: string[];
    placeholder?: string;
    required?: boolean;
}

export const CATEGORY_ATTRIBUTES: Record<string, CategoryAttribute[]> = {
    'food-groceries': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Qudaarta (Vegetables)',
                '2 Miraha (Fruits)',
                '3 Bariiska & Baastada (Rice & Pasta)',
                '4 Hilibka (Meat)',
                '5 Kalluun & Cunto Badeed (Seafood)',
                '6 Caanaha & Caanaha La\'eg (Milk & Dairy)',
                '7 Ukunta (Eggs)',
                '8 Cuntooyinka Diyaarsan (Prepared Foods)'
            ],
            required: true
        },
    ],
    'clothing-shoes': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Dharka Ragga (Men’s Clothing)',
                '2 Dharka Dumarka (Women’s Clothing)',
                '3 Dharka Carruurta (Children’s Clothing)',
                '4 Kabaha (Shoes)',
                '5 Agabka Dharka (Clothing Accessories)'
            ],
            required: true
        },
    ],
    'household-items': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Qalabka Jikada (Kitchenware)',
                '2 Gogosha (Bedding)',
                '3 Alaabta Qurxinta (Home Décor)',
                '4 Qalabka Nadaafadda (Cleaning Supplies)',
                '5 Qalabka Korontada (Appliances)'
            ],
            required: true
        },
    ],
    'electronics': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Mobaylada (Mobile Phones)',
                '2 Kombiyuutarada (Computers)',
                '3 TV-yada (TVs)',
                '4 Qalabka Elektaroonigga Kale (Other Electronics)',
                '5 Qalabka Dhagaha & Codka (Audio & Headphones)'
            ],
            required: true
        },
        { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Apple, Sony, HP' },
    ],
    'vehicles': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Baabuurta (Cars)',
                '2 Mootooyinka (Motorcycles)',
                '3 Bajaajta (Tuk-tuks)',
                '4 Qalabka Gaadiidka (Vehicle Accessories)'
            ],
            required: true
        },
        { name: 'brand', label: 'Brand', type: 'select', options: ['Toyota', 'Mazda', 'Nissan', 'Honda', 'Mercedes-Benz', 'BMW', 'Volkswagen', 'Subaru', 'Mitsubishi', 'Audi'], required: true },
        { name: 'year', label: 'Year', type: 'number', placeholder: 'e.g. 2018' },
    ],
    'livestock': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Riyaha (Goats)',
                '2 Idaha (Sheep)',
                '3 Lo’da (Cattle)',
                '4 Digaagga (Chickens)',
                '5 Geela (Camels)'
            ],
            required: true
        },
    ],
    'land-farms': [
        {
            name: 'subcategory',
            label: 'Subcategory',
            type: 'select',
            options: [
                '1 Dhul Banaan (Vacant Land)',
                '2 Beeraha (Farms)',
                '3 Dhul Beereed (Agricultural Land)'
            ],
            required: true
        },
    ],
};

export const getAttributesForCategory = (categorySlug: string): CategoryAttribute[] => {
    return CATEGORY_ATTRIBUTES[categorySlug] || [];
};
