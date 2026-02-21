export const SOMALI_REGIONS = [
    {
        name: "Banaadir",
        cities: [
            "Mogadishu", "Afgooye", "Balcad", "Jazeera", "Lafoole", "Ceelasha Biyaha"
        ]
    },
    {
        name: "Puntland",
        cities: [
            "Garowe", "Burtinle", "Dangorayo", "Eyl", "Godobjiraan", "Ceel Daahir",
            "Bosaso", "Qandala", "Iskushuban", "Bargal", "Bandarbayla", "Caluula",
            "Hafun", "Carmo", "Galkayo", "Galdogob", "Jariban", "Harfo", "Bacaadweyn",
            "Qardho", "Xingalol", "Ufayn", "Rako", "Timirshe"
        ]
    },
    {
        name: "Somaliland",
        cities: [
            "Hargeisa", "Tog Wajaale", "Gabiley", "Baligubadle", "Arabsiyo", "Faraweyne",
            "Berbera", "Sheikh", "Mandera", "Xiis (Heis)", "Burao", "Oodweyne", "Qoyta",
            "Widhwidh", "Borama", "Baki", "Lughaya", "Zeila (Saylac)", "Dilla",
            "Ceerigaabo", "Badhan", "Dhahar", "Maydh"
        ]
    },
    {
        name: "Galmudug",
        cities: [
            "Dhusamareeb", "Guriceel", "Balanbale", "Galinsoor", "Eldher", "Abudwaq",
            "Galkayo (South)", "Gaalkacyo", "Bacaadweyne", "Hobyo", "Xarardheere", "Ceel Dheer"
        ]
    },
    {
        name: "Hirshabelle",
        cities: [
            "Jowhar", "Mahaday", "Balcad", "Raage Ceelle", "Beledweyne", "Bulo Burde",
            "Jalalaqsi", "Mataban"
        ]
    },
    {
        name: "Jubaland",
        cities: [
            "Kismayo", "Jamaame", "Afmadow", "Dhobley", "Badhaadhe", "Bu'aale", "Bardhere"
        ]
    },
    {
        name: "SouthWest",
        cities: [
            "Baidoa", "Buur Hakaba", "Berdale", "Qansax Dheere", "Diinsoor", "Awdinle",
            "Leego", "Goofgaduud", "Hudur (Xudur)", "Tiyeglow", "Wajid", "Ceel Barde",
            "Rabdhure", "Yeed", "Marka", "Janaale", "Awdheegle", "Sablaale", "Kurtunwaarey",
            "Bulo Mareer", "Golweyn", "Baraawe", "Kuumyo Baraawe", "Danow", "Dhaaytubako",
            "Wanlaweyn", "Qoryoley", "Shalanbood"
        ]
    },
    {
        name: "North East",
        cities: [
            "Laascaanood", "Taleh", "Xudun", "Kalabaydh", "Adhicadeeye", "Buuhoodle"
        ]
    }
];

// Flattened list of unique locations for simple dropdowns if needed
export const ALL_LOCATIONS = Array.from(
    new Set(SOMALI_REGIONS.flatMap(region => region.cities))
).sort();
