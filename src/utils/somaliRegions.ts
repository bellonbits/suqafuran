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

export const LOCATION_HIERARCHY: State[] = [
    {
        name: "Banadir",
        regions: [
            {
                name: "Banadir",
                towns: [
                    "Mogadishu", "Cabdicasis", "Boondheere", "Dayniile", "Dharkeenly", "Xamar Jajab",
                    "Xamar Weyne", "Hodan", "Howlwadaag", "Karaan", "Shangani",
                    "Shibis", "Waaberi", "Wadajir", "Warta Nabadda", "Yaqshiid",
                    "Kahda", "Garsabaaley"
                ]
            }
        ]
    },
    {
        name: "Hargeysa",
        regions: [
            {
                name: "Maroodi Jeex",
                towns: ["Hargeysa", "Gabiley", "Arabsiyo", "Baligubadle"]
            },
            {
                name: "Awdal",
                towns: ["Boorama", "Saylac", "Lughaya", "Baki"]
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
        name: "Garowe",
        regions: [
            {
                name: "Nugaal",
                towns: ["Garowe", "Burtinle", "Eyl", "Dangorayo"]
            },
            {
                name: "Bari",
                towns: ["Boosaaso", "Qardho", "Iskushuban", "Caluula", "Ufayn", "Bargaal", "Bandar Bayla", "Timirshe"]
            }
        ]
    },
    {
        name: "Gaalkacyo",
        regions: [
            {
                name: "Mudug",
                towns: ["Gaalkacyo", "Jariiban", "Goldogob", "Bursaalah", "Hobyo", "Xarardheere"]
            }
        ]
    },
    {
        name: "Kismayo",
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
        name: "Baidoa",
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
        name: "Beledweyne",
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
        name: "Dhusamareeb",
        regions: [
            {
                name: "Galgaduud",
                towns: ["Dhuusamareeb", "Cadaado", "Guriceel", "Ceel Dheer"]
            }
        ]
    },
    {
        name: "Las Anod",
        regions: [
            {
                name: "Sool",
                towns: ["Laascaanood", "Taleex", "Xudun", "Boocame", "Kalabaydh", "Yagoori", "Adhi Cadeeye"]
            }
        ]
    },
    {
        name: "Kenya",
        regions: [
            {
                name: "Cities",
                towns: ["Nairobi", "Mombasa", "Garisa"]
            }
        ]
    },
    {
        name: "Ogaden",
        regions: [
            {
                name: "Cities",
                towns: ["Degahbur", "Godey", "Qabri Dahare", "Shilabo", "Qalaafe", "Wardheer", "Danan"]
            }
        ]
    },
    {
        name: "Border",
        regions: [
            {
                name: "Towns",
                towns: ["Tog Wajale"]
            }
        ]
    }
];

// For backward compatibility and generic usage
export const SOMALI_STATES = LOCATION_HIERARCHY;

export const SOMALI_REGIONS = LOCATION_HIERARCHY.flatMap(state =>
    state.regions.map(region => ({
        name: region.name,
        cities: region.towns
    }))
);

export const ALL_LOCATIONS = Array.from(
    new Set(LOCATION_HIERARCHY.flatMap(state =>
        state.regions.flatMap(region => region.towns)
    ))
).sort();
