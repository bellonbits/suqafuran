export interface CategoryAttribute {
    name: string;
    label: string;
    type: 'text' | 'select' | 'number';
    options?: string[];
    placeholder?: string;
    required?: boolean;
}

export const CATEGORY_ATTRIBUTES: Record<number, CategoryAttribute[]> = {
    1: [ // Vehicles/Cars (Assuming ID 1 is Vehicles based on Jiji)
        { name: 'brand', label: 'Brand', type: 'select', options: ['Toyota', 'Mazda', 'Nissan', 'Honda', 'Mercedes-Benz', 'BMW', 'Volkswagen', 'Subaru', 'Mitsubishi', 'Audi'], required: true },
        { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Camry, CX-5', required: true },
        { name: 'year', label: 'Year of Manufacture', type: 'number', placeholder: 'e.g. 2018', required: true },
        { name: 'mileage', label: 'Mileage (km)', type: 'number', placeholder: 'e.g. 45000' },
        { name: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual', 'CVT'] },
        { name: 'fuel', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
    ],
    2: [ // Property/Real Estate
        { name: 'property_type', label: 'Property Type', type: 'select', options: ['Apartment', 'House', 'Land', 'Commercial'], required: true },
        { name: 'bedrooms', label: 'Bedrooms', type: 'number', placeholder: 'e.g. 3' },
        { name: 'bathrooms', label: 'Bathrooms', type: 'number', placeholder: 'e.g. 2' },
        { name: 'furnished', label: 'Furnished', type: 'select', options: ['Yes', 'No'] },
    ],
    3: [ // Phones & Tablets
        { name: 'brand', label: 'Brand', type: 'select', options: ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Vivo', 'Realme'], required: true },
        { name: 'storage', label: 'Internal Storage', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'] },
        { name: 'ram', label: 'RAM', type: 'select', options: ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB'] },
        { name: 'screen_size', label: 'Screen Size', type: 'text', placeholder: 'e.g. 6.7 inches' },
    ],
    4: [ // Electronics
        { name: 'type', label: 'Device Type', type: 'select', options: ['Laptop', 'TV', 'Audio', 'Camera', 'Networking'] },
        { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Sony, HP, Dell' },
    ]
};

export const getAttributesForCategory = (categoryId: number): CategoryAttribute[] => {
    return CATEGORY_ATTRIBUTES[categoryId] || [];
};
