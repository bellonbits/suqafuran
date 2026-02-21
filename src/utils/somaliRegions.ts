export interface Town {
    name: string;
}

export interface Region {
    name: string;
    towns: string[];
}

export interface State {
    name: string;
    regions: Region[];
}

export const SOMALI_STATES: State[] = [
    {
        name: "Banadir",
        regions: [
            {
                name: "Banadir",
                towns: [
                    "Cabdicasis", "Boondheere", "Dayniile", "Dharkeenly", "Xamar Jajab",
                    "Xamar Weyne", "Hodan", "Howlwadaag", "Karaan", "Shangani",
                    "Shibis", "Waaberi", "Wadajir", "Warta Nabadda", "Yaqshiid",
                    "Kahda", "Garsabaaley"
                ]
            }
        ]
    },
    {
        name: "Puntland",
        regions: [
            {
                name: "Bari",
                towns: ["Boosaaso", "Qardho", "Iskushuban", "Caluula", "Ufayn", "Bargaal", "Bandar Bayla", "Timirshe"]
            },
            {
                name: "Nugaal",
                towns: ["Garowe", "Burtinle", "Eyl", "Dangorayo"]
            },
            {
                name: "Mudug (North)",
                towns: ["Gaalkacyo", "Jariiban", "Goldogob", "Bursaalah"]
            }
        ]
    },
    {
        name: "North East",
        regions: [
            {
                name: "Sool",
                towns: ["Laascaanood", "Taleex", "Xudun", "Boocame", "Kalabaydh", "Yagoori", "Adhi Cadeeye"]
            }
        ]
    },
    {
        name: "Somaliland",
        regions: [
            {
                name: "Awdal",
                towns: ["Boorama", "Saylac", "Lughaya", "Baki"]
            },
            {
                name: "Maroodi Jeex",
                towns: ["Hargeysa", "Gabiley", "Arabsiyo", "Baligubadle"]
            },
            {
                name: "Togdheer",
                towns: ["Burco", "Oodweyne", "Sheikh"]
            },
            {
                name: "Sanaag",
                towns: ["Ceerigaabo", "El Afweyn", "Dhahar", "Badhan", "Hadaaftimo", "Laasqoray", "Maydh"]
            }
        ]
    },
    {
        name: "Jubaland",
        regions: [
            {
                name: "Jubbada Hoose",
                towns: ["Kismaayo", "Afmadow", "Badhaadhe", "Dhoobley", "Kulbiyow"]
            },
            {
                name: "Jubbada Dhexe",
                towns: ["Bu'aale", "Saakow", "Jilib"]
            },
            {
                name: "Gedo",
                towns: ["Garbahaarey", "Baardheere", "Luuq", "Doolow", "Beled Xaawo", "Ceel Waaq"]
            }
        ]
    },
    {
        name: "Koonfur Galbeed",
        regions: [
            {
                name: "Baay",
                towns: ["Baydhabo", "Qansaxdheere", "Diinsoor"]
            },
            {
                name: "Bakool",
                towns: ["Xudur", "Tiyeglow", "Rabdhuure", "Waajid"]
            },
            {
                name: "Shabelle Hoose",
                towns: ["Marka", "Baraawe", "Wanlaweyn", "Afgooye", "Kurtunwaarey", "Sablaale"]
            }
        ]
    },
    {
        name: "Hirshabelle",
        regions: [
            {
                name: "Hiiraan",
                towns: ["Beledweyne", "Buuloburde", "Jalalaqsi", "Matabaan"]
            },
            {
                name: "Shabelle Dhexe",
                towns: ["Jowhar", "Balcad", "Cadale", "Mahadaay", "Warsheekh"]
            }
        ]
    },
    {
        name: "Galmudug",
        regions: [
            {
                name: "Galgaduud",
                towns: ["Dhuusamareeb", "Cadaado", "Guriceel", "Ceel Dheer"]
            },
            {
                name: "Mudug (South)",
                towns: ["Gaalkacyo", "Hobyo", "Xarardheere"]
            }
        ]
    }
];

// Compatibility exports to avoid breaking existing code
export const SOMALI_REGIONS = SOMALI_STATES.flatMap(state =>
    state.regions.map(region => ({
        name: region.name,
        cities: region.towns
    }))
);

export const ALL_LOCATIONS = Array.from(
    new Set(SOMALI_STATES.flatMap(state =>
        state.regions.flatMap(region => region.towns)
    ))
).sort();
