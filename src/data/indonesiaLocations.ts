// svgX and svgY are the true center coordinates of each province's path in the SVG
// These were computed directly from getBBox() of each <path> element
export const indonesiaLocations = [
  { province: "Aceh",                    svgX: 26.7,   svgY: 61.0,   lat: 3.83,   lng: 96.76,  keywords: ["aceh", "banda aceh", "sabang", "lhokseumawe", "langsa", "pidie", "meulaboh"] },
  { province: "Sumatera Utara",          svgX: 49.5,   svgY: 95.2,   lat: 1.85,   lng: 98.08,  keywords: ["sumatera utara", "sumut", "medan", "toba", "samosir", "pematangsiantar", "binjai", "sibolga", "tanjungbalai", "tebing tinggi", "padangsidempuan", "gunungsitoli", "nias"] },
  { province: "Sumatera Barat",          svgX: 87.0,   svgY: 148.1,  lat: -1.23,  lng: 100.24, keywords: ["sumatera barat", "sumbar", "padang", "bukittinggi", "pariaman", "solok", "payakumbuh", "sawahlunto", "padang panjang", "mentawai"] },
  { province: "Riau",                    svgX: 116.3,  svgY: 115.1,  lat: 0.69,   lng: 101.94, keywords: ["riau", "pekanbaru", "dumai", "bengkalis", "siak", "kampar", "rokan", "pelalawan", "kuantan singingi"] },
  { province: "Kepulauan Riau",          svgX: 154.8,  svgY: 122.4,  lat: 0.27,   lng: 104.16, keywords: ["kepulauan riau", "kepri", "batam", "tanjung pinang", "tanjungpinang", "bintan", "karimun", "natuna", "anambas", "lingga"] },
  { province: "Jambi",                   svgX: 131.5,  svgY: 157.3,  lat: -1.76,  lng: 102.81, keywords: ["jambi", "sungai penuh", "kerinci", "bungo", "tebo", "merangin", "sarolangun", "batanghari", "muaro jambi"] },
  { province: "Bengkulu",                svgX: 124.4,  svgY: 189.0,  lat: -3.60,  lng: 102.41, keywords: ["bengkulu", "rejong lebong", "lebong", "mukomuko", "seluma", "kaur", "kepahiang"] },
  { province: "Sumatera Selatan",        svgX: 153.4,  svgY: 183.8,  lat: -3.29,  lng: 104.08, keywords: ["sumatera selatan", "sumsel", "palembang", "prabumulih", "lubuklinggau", "pagar alam", "banyuasin", "musi", "ogan", "lahat"] },
  { province: "Kepulauan Bangka Belitung", svgX: 198.9, svgY: 167.8, lat: -2.37,  lng: 106.71, keywords: ["bangka belitung", "babel", "pangkalpinang", "bangka", "belitung", "sungailiat", "tanjung pandan", "muntok"] },
  { province: "Lampung",                 svgX: 165.2,  svgY: 210.3,  lat: -4.83,  lng: 104.76, keywords: ["lampung", "bandar lampung", "metro", "kalianda", "pringsewu", "pesawaran", "tanggamus", "tulang bawang"] },
  { province: "Banten",                  svgX: 186.5,  svgY: 238.0,  lat: -6.43,  lng: 106.00, keywords: ["banten", "serang", "cilegon", "tangerang", "pandeglang", "lebak", "tangerang selatan", "tangsel"] },
  { province: "DKI Jakarta",             svgX: 187.4,  svgY: 237.0,  lat: -6.38,  lng: 106.05, keywords: ["jakarta", "dki", "jkt", "jaksel", "jakut", "jaktim", "jakbar", "jakpus", "ancol", "monas"] },
  { province: "Jawa Barat",              svgX: 214.4,  svgY: 245.4,  lat: -6.86,  lng: 107.61, keywords: ["jawa barat", "jabar", "bandung", "bogor", "depok", "bekasi", "cimahi", "cirebon", "sukabumi", "tasikmalaya", "banjar", "garut", "cianjur", "purwakarta", "karawang", "subang", "sumedang", "indramayu", "majalengka", "kuningan", "ciamis", "pangandaran"] },
  { province: "Jawa Tengah",             svgX: 258.0,  svgY: 253.1,  lat: -7.30,  lng: 110.13, keywords: ["jawa tengah", "jateng", "semarang", "surakarta", "solo", "magelang", "pekalongan", "tegal", "salatiga", "purwokerto", "cilacap", "banyumas", "purbalingga", "banjarnegara", "kebumen", "purworejo", "wonosobo", "boyolali", "klaten", "sukoharjo", "wonogiri", "karanganyar", "sragen", "grobogan", "blora", "rembang", "pati", "kudus", "jepara", "demak", "temanggung", "kendal", "batang", "pemalang", "brebes"] },
  { province: "DI Yogyakarta",           svgX: 263.2,  svgY: 262.8,  lat: -7.86,  lng: 110.43, keywords: ["yogyakarta", "jogja", "diy", "sleman", "bantul", "gunungkidul", "kulon progo", "malioboro"] },
  { province: "Jawa Timur",              svgX: 314.7,  svgY: 252.0,  lat: -7.24,  lng: 113.40, keywords: ["jawa timur", "jatim", "surabaya", "malang", "batu", "kediri", "madiun", "mojokerto", "pasuruan", "probolinggo", "blitar", "sidoarjo", "banyuwangi", "jember", "gresik", "tuban", "lamongan", "bojonegoro", "ngawi", "magetan", "ponorogo", "pacitan", "trenggalek", "tulungagung", "lumajang", "bondowoso", "situbondo", "bangkalan", "sampang", "pamekasan", "sumenep", "madura"] },
  { province: "Bali",                    svgX: 343.6,  svgY: 272.9,  lat: -8.44,  lng: 115.07, keywords: ["bali", "denpasar", "badung", "kuta", "ubud", "gianyar", "buleleng", "singaraja", "karangasem", "klungkung", "bangli", "tabanan", "jembrana", "nusa penida", "jimbaran", "canggu", "seminyak", "sanur", "uluwatu"] },
  { province: "Nusa Tenggara Barat",     svgX: 387.0,  svgY: 275.3,  lat: -8.58,  lng: 117.58, keywords: ["nusa tenggara barat", "ntb", "mataram", "lombok", "bima", "sumbawa", "dompu"] },
  { province: "Nusa Tenggara Timur",     svgX: 464.4,  svgY: 291.2,  lat: -9.49,  lng: 122.05, keywords: ["nusa tenggara timur", "ntt", "kupang", "komodo", "flores", "sumba", "timor", "ende", "maumere", "ruteng", "labuan bajo", "alor"] },
  { province: "Kalimantan Barat",        svgX: 254.8,  svgY: 117.1,  lat: 0.57,   lng: 109.94, keywords: ["kalimantan barat", "kalbar", "pontianak", "singkawang", "ketapang", "sintang", "sambas"] },
  { province: "Kalimantan Tengah",       svgX: 312.8,  svgY: 151.1,  lat: -1.40,  lng: 113.29, keywords: ["kalimantan tengah", "kalteng", "palangka raya", "palangkaraya", "kotawaringin", "kapuas", "barito"] },
  { province: "Kalimantan Selatan",      svgX: 350.2,  svgY: 174.3,  lat: -2.75,  lng: 115.45, keywords: ["kalimantan selatan", "kalsel", "banjarmasin", "banjarbaru", "martapura", "tabalong"] },
  { province: "Kalimantan Timur",        svgX: 367.0,  svgY: 125.3,  lat: 0.10,   lng: 116.42, keywords: ["kalimantan timur", "kaltim", "samarinda", "balikpapan", "bontang", "kutai", "berau", "ikn", "penajam"] },
  { province: "Kalimantan Utara",        svgX: 364.5,  svgY: 79.5,   lat: 2.76,   lng: 116.28, keywords: ["kalimantan utara", "kaltara", "tarakan", "tanjung selor", "bulungan", "nunukan", "malinau"] },
  { province: "Sulawesi Utara",          svgX: 515.6,  svgY: 85.6,   lat: 2.40,   lng: 125.01, keywords: ["sulawesi utara", "sulut", "manado", "bitung", "tomohon", "minahasa", "kotamobagu", "bunaken"] },
  { province: "Gorontalo",               svgX: 469.4,  svgY: 115.8,  lat: 0.65,   lng: 122.34, keywords: ["gorontalo", "pohuwato", "bone bolango", "boalemo"] },
  { province: "Sulawesi Tengah",         svgX: 455.4,  svgY: 164.6,  lat: -2.18,  lng: 121.53, keywords: ["sulawesi tengah", "sulteng", "palu", "poso", "donggala", "toli-toli", "banggai", "luwuk", "morowali"] },
  { province: "Sulawesi Barat",          svgX: 417.0,  svgY: 165.0,  lat: -2.21,  lng: 119.31, keywords: ["sulawesi barat", "sulbar", "mamuju", "majene", "polewali", "mamasa"] },
  { province: "Sulawesi Selatan",        svgX: 438.8,  svgY: 206.4,  lat: -4.61,  lng: 120.57, keywords: ["sulawesi selatan", "sulsel", "makassar", "parepare", "palopo", "bone", "gowa", "toraja", "bulukumba", "maros", "wajo"] },
  { province: "Sulawesi Tenggara",       svgX: 461.5,  svgY: 192.9,  lat: -3.82,  lng: 121.88, keywords: ["sulawesi tenggara", "sultra", "kendari", "baubau", "bau-bau", "wakatobi", "kolaka", "buton"] },
  { province: "Maluku",                  svgX: 607.8,  svgY: 223.0,  lat: -5.57,  lng: 130.33, keywords: ["maluku", "ambon", "tual", "banda neira", "seram", "buru", "kei"] },
  { province: "Maluku Utara",            svgX: 543.3,  svgY: 125.8,  lat: 0.07,   lng: 126.61, keywords: ["maluku utara", "malut", "ternate", "tidore", "halmahera", "sofifi", "morotai"] },
  { province: "Papua Barat",             svgX: 641.2,  svgY: 163.7,  lat: -2.13,  lng: 132.26, keywords: ["papua barat", "pabar", "manokwari", "fakfak", "kaimana"] },
  { province: "Papua Barat Daya",        svgX: 610.0,  svgY: 148.0,  lat: -0.80,  lng: 131.5,  keywords: ["papua barat daya", "sorong", "raja ampat", "tambrauw", "maybrat", "sorong selatan"] },
  { province: "Papua",                   svgX: 733.4,  svgY: 211.3,  lat: -4.89,  lng: 137.59, keywords: ["papua", "jayapura", "biak", "merauke", "wamena", "asmat"] },
  { province: "Papua Selatan",           svgX: 718.0,  svgY: 238.0,  lat: -6.50,  lng: 139.5,  keywords: ["papua selatan", "boven digoel", "mappi"] },
  { province: "Papua Tengah",            svgX: 700.0,  svgY: 200.0,  lat: -3.50,  lng: 136.0,  keywords: ["papua tengah", "nabire", "mimika", "timika", "paniai", "puncak jaya"] },
  { province: "Papua Pegunungan",        svgX: 720.0,  svgY: 195.0,  lat: -4.00,  lng: 139.0,  keywords: ["papua pegunungan", "jayawijaya", "lanny jaya", "tolikara", "yahukimo"] },
];

export function findProvinceSvgCoords(query: string): { svgX: number; svgY: number } | null {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();
  for (const loc of indonesiaLocations) {
    if (loc.keywords.some(k => lowerQuery.includes(k.toLowerCase()))) {
      // Small random offset so multiple pins in same province don't fully overlap
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 6;
      return {
        svgX: loc.svgX + offsetX,
        svgY: loc.svgY + offsetY,
      };
    }
  }
  return null;
}

export function findProvinceCoordinates(query: string): { lat: number; lng: number } | null {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();
  for (const loc of indonesiaLocations) {
    if (loc.keywords.some(k => lowerQuery.includes(k.toLowerCase()))) {
      const latOffset = (Math.random() - 0.5) * 0.4;
      const lngOffset = (Math.random() - 0.5) * 0.4;
      return {
        lat: loc.lat + latOffset,
        lng: loc.lng + lngOffset
      };
    }
  }
  return null;
}
