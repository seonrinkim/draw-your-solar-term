export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SolarTerm {
  slug: string;
  hangul: string;
  romanized: string;
  english: string;
  date: string; // approximate solar date, "MM-DD"
  season: Season;
  color: string; // hex
  description: string;
  wisdom: string;
}

// Brand anchor colors (from Van het Seizoen palette):
// 한지 화이트 Hanji White #F4F0E6 — used as base/paper color, not tied to a single term
// 쑥 그린 Mugwort Green #8A9E6A — anchored at 춘분 Spring Equinox
// 청자 민트 Celadon Mint #8DCFCC — anchored at 하지 Summer Solstice
// 홍시 레드 Persimmon Red #C94A1E — anchored at 추분 Autumn Equinox
// 먹 블랙 Ink Black #272018 — anchored at 동지 Winter Solstice
// The 20 remaining terms interpolate between these four anchors in HSL space,
// following the natural progression of the seasons.

export const SOLAR_TERMS: SolarTerm[] = [
  {
    slug: "ipchun",
    hangul: "입춘",
    romanized: "Ipchun",
    english: "Beginning of Spring",
    date: "02-04",
    season: "spring",
    color: "#3E3428",
    description: "The first stirrings of warmth beneath still-cold soil.",
    wisdom:
      "Families used to paste handwritten couplets called ipchuncheop (입춘첩) on their gates and doorframes, wishing for good fortune and abundance in the year ahead.",
  },
  {
    slug: "usu",
    hangul: "우수",
    romanized: "Usu",
    english: "Rain Water",
    date: "02-19",
    season: "spring",
    color: "#726F4F",
    description: "Snow melts into rain as the ground begins to soften.",
    wisdom:
      "As river ice broke up and snow turned to rain, farmers began readying seedbeds and repairing tools, treating Usu as nature's signal to prepare for planting.",
  },
  {
    slug: "gyeongchip",
    hangul: "경칩",
    romanized: "Gyeongchip",
    english: "Awakening of Insects",
    date: "03-05",
    season: "spring",
    color: "#7C9457",
    description: "Hibernating creatures stir awake to the season's first thunder.",
    wisdom:
      "People believed spring water drawn on this day carried special vitality, and eating eggs at Gyeongchip was considered a small ritual for good health as the earth woke up.",
  },
  {
    slug: "chunbun",
    hangul: "춘분",
    romanized: "Chunbun",
    english: "Spring Equinox",
    date: "03-20",
    season: "spring",
    color: "#8A9E6A",
    description: "Day and night balance as fresh green spreads across the land.",
    wisdom:
      "With day and night in balance, Chunbun marked the true start of the farming year — full-scale plowing began, and elders read the day's wind and weather as an omen for the season's harvest.",
  },
  {
    slug: "cheongmyeong",
    hangul: "청명",
    romanized: "Cheongmyeong",
    english: "Clear and Bright",
    date: "04-05",
    season: "spring",
    color: "#90B47E",
    description: "Skies clear and fields brighten for the season's planting.",
    wisdom:
      "Falling near the Hansik (한식) holiday, this was traditionally a day to visit and tend ancestral graves, and some households ate only food prepared the day before, keeping the hearth fire unlit out of old custom.",
  },
  {
    slug: "gogu",
    hangul: "곡우",
    romanized: "Gogu",
    english: "Grain Rain",
    date: "04-20",
    season: "spring",
    color: "#83B995",
    description: "Gentle rains nourish the newly sown grain.",
    wisdom:
      "This was considered the best time to tap gorosoe (고로쇠) trees for their sap, drunk as a spring tonic, while rice farmers began wet-seeding paddies as the rains soaked into the soil.",
  },
  {
    slug: "ipha",
    hangul: "입하",
    romanized: "Ipha",
    english: "Beginning of Summer",
    date: "05-05",
    season: "summer",
    color: "#81BBA8",
    description: "Leaves thicken as the air turns warm and humid.",
    wisdom:
      "Villages moved into full summer rhythm, transplanting rice seedlings and tending mulberry leaves to feed the silkworms that many families raised for silk.",
  },
  {
    slug: "soman",
    hangul: "소만",
    romanized: "Soman",
    english: "Grain Full",
    date: "05-21",
    season: "summer",
    color: "#84C2B6",
    description: "Crops fill out under the strengthening early summer sun.",
    wisdom:
      "As barley began to fill out in the fields, households busied themselves with irrigation and weeding, preparing for the harvest rush that Mangjong (망종) would soon bring.",
  },
  {
    slug: "mangjong",
    hangul: "망종",
    romanized: "Mangjong",
    english: "Grain in Ear",
    date: "06-06",
    season: "summer",
    color: "#88C8C2",
    description: "Barley ripens and rice seedlings are planted in the paddies.",
    wisdom:
      "Barley harvest and rice transplanting landed at once, giving rise to the saying that people were so busy they'd \"wet their own feet standing still\" — Mangjong is remembered as the hardest-working stretch of the farming year.",
  },
  {
    slug: "haji",
    hangul: "하지",
    romanized: "Haji",
    english: "Summer Solstice",
    date: "06-21",
    season: "summer",
    color: "#8DCFCC",
    description: "The longest day of the year, under the brightest sky.",
    wisdom:
      "With barley harvest expected to be finished by Haji, communities would hold rain rituals if the skies stayed dry too long, praying for enough water to carry the rice paddies through summer.",
  },
  {
    slug: "soseo",
    hangul: "소서",
    romanized: "Soseo",
    english: "Minor Heat",
    date: "07-07",
    season: "summer",
    color: "#75BD81",
    description: "Humid heat settles in as the rainy season peaks.",
    wisdom:
      "As Korea's monsoon season, jangma (장마), set in, households reinforced roofs and drainage against flooding and shifted to cooling, easily digestible meals to handle the thickening humidity.",
  },
  {
    slug: "daeseo",
    hangul: "대서",
    romanized: "Daeseo",
    english: "Major Heat",
    date: "07-23",
    season: "summer",
    color: "#C0C059",
    description: "The hottest days of the year, thick with summer haze.",
    wisdom:
      "Falling within the sambok (삼복) dog days, this was when people ate hot samgyetang (삼계탕), believing in \"fighting heat with heat,\" and wore loose hemp sambe (삼베) clothing that let air move against the skin.",
  },
  {
    slug: "ipchu",
    hangul: "입추",
    romanized: "Ipchu",
    english: "Beginning of Autumn",
    date: "08-08",
    season: "autumn",
    color: "#C68B39",
    description: "A first hint of coolness slips into the lingering heat.",
    wisdom:
      "Farmers watched Ipchu's weather closely, as an old saying held that the day's wind and sky foretold how bountiful the coming rice harvest would be.",
  },
  {
    slug: "cheoseo",
    hangul: "처서",
    romanized: "Cheoseo",
    english: "End of Heat",
    date: "08-23",
    season: "autumn",
    color: "#C46E31",
    description: "The summer heat breaks and mornings turn crisp.",
    wisdom:
      "A well-known saying goes that \"even a mosquito's mouth turns crooked\" by Cheoseo — households took the cooling air as their cue to air out and sun-dry bedding and summer clothes before packing them away.",
  },
  {
    slug: "baengno",
    hangul: "백로",
    romanized: "Baengno",
    english: "White Dew",
    date: "09-08",
    season: "autumn",
    color: "#C66839",
    description: "Cool nights leave dew glistening white on the grass.",
    wisdom:
      "With cool morning dew now settling on the fields, families began preparing for the rice harvest and for Chuseok (추석), the autumn harvest festival that often falls close behind.",
  },
  {
    slug: "chubun",
    hangul: "추분",
    romanized: "Chubun",
    english: "Autumn Equinox",
    date: "09-23",
    season: "autumn",
    color: "#C94A1E",
    description: "Day and night balance again as leaves turn to color.",
    wisdom:
      "As day and night balanced once more, this was a season for giving thanks — tending family graves and sharing the year's harvest, echoing the same spirit of gratitude at the heart of Chuseok (추석).",
  },
  {
    slug: "hallo",
    hangul: "한로",
    romanized: "Hallo",
    english: "Cold Dew",
    date: "10-08",
    season: "autumn",
    color: "#9D4125",
    description: "Dew turns cold as autumn deepens toward winter.",
    wisdom:
      "As chrysanthemums came into bloom, people traditionally drank gukhwaju (국화주), chrysanthemum-infused wine, and took autumn outings into the hills to admire the turning leaves before the cold set in fully.",
  },
  {
    slug: "sanggang",
    hangul: "상강",
    romanized: "Sanggang",
    english: "Frost Descent",
    date: "10-23",
    season: "autumn",
    color: "#683D27",
    description: "The year's first frost settles over fading fields.",
    wisdom:
      "With the year's first frost on the way, farmers raced to bring in the last of the rice harvest, while red peppers and persimmons were laid out to dry in the autumn sun before the cold could reach them.",
  },
  {
    slug: "ipdong",
    hangul: "입동",
    romanized: "Ipdong",
    english: "Beginning of Winter",
    date: "11-07",
    season: "winter",
    color: "#4A3526",
    description: "The air sharpens as the land prepares to rest.",
    wisdom:
      "This was traditionally when kimjang (김장) began — whole families and neighbors gathering to prepare enough kimchi to last the household through the long winter ahead.",
  },
  {
    slug: "soseol",
    hangul: "소설",
    romanized: "Soseol",
    english: "Minor Snow",
    date: "11-22",
    season: "winter",
    color: "#625141",
    description: "The first light snow dusts the darkening season.",
    wisdom:
      "As the first snow and sharper winds arrived, households finished sealing windows and doors against drafts and brought out heavier winter clothing in preparation for the cold to come.",
  },
  {
    slug: "daeseol",
    hangul: "대설",
    romanized: "Daeseol",
    english: "Major Snow",
    date: "12-07",
    season: "winter",
    color: "#33271E",
    description: "Heavy snow blankets the quiet winter landscape.",
    wisdom:
      "Heavy snowfall at Daeseol was welcomed rather than feared — a deep snow cover was believed to insulate the wheat fields and promise a more fruitful harvest the following year.",
  },
  {
    slug: "dongji",
    hangul: "동지",
    romanized: "Dongji",
    english: "Winter Solstice",
    date: "12-22",
    season: "winter",
    color: "#272018",
    description: "The longest night of the year, deep and still.",
    wisdom:
      "On the year's longest night, families ate patjuk (팥죽), red bean porridge with chewy rice balls, said to ward off evil spirits — and everyone added one rice ball for each year of their age.",
  },
  {
    slug: "sohan",
    hangul: "소한",
    romanized: "Sohan",
    english: "Minor Cold",
    date: "01-06",
    season: "winter",
    color: "#1C1612",
    description: "The coldest stretch of the year begins to bite.",
    wisdom:
      "Despite its name, Sohan is often colder than Daehan (대한) that follows it — an old saying jokes that \"Daehan froze to death visiting Sohan's house,\" and households used this stretch to stock up on food and firewood.",
  },
  {
    slug: "daehan",
    hangul: "대한",
    romanized: "Daehan",
    english: "Major Cold",
    date: "01-20",
    season: "winter",
    color: "#15110F",
    description: "The year's harshest cold, just before spring returns.",
    wisdom:
      "As the last solar term of the year, Daehan was traditionally spent finishing year-end chores and rites to send off the old year, so the household could greet Ipchun (입춘) and the new cycle of spring with a clean start.",
  },
];

export function getTermBySlug(slug: string): SolarTerm | undefined {
  return SOLAR_TERMS.find((t) => t.slug === slug);
}

const MONTH_NAMES: Record<"en" | "nl", string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  nl: [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ],
};

// "03-20" -> "20 March" (en) / "20 maart" (nl) / "3월 20일" (ko)
export function formatTermDate(mmdd: string, language: "en" | "ko" | "nl" = "en"): string {
  const [month, day] = mmdd.split("-").map(Number);
  if (language === "ko") return `${month}월 ${day}일`;
  return `${day} ${MONTH_NAMES[language][month - 1]}`;
}

export const BRAND_COLORS = {
  hanjiWhite: "#F4F0E6",
  celadonMint: "#8DCFCC",
  persimmonRed: "#C94A1E",
  mugwortGreen: "#8A9E6A",
  inkBlack: "#272018",
};
