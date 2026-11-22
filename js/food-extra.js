/*
 * Hawaii, Well Planned: food research layer.
 *
 * - HWP.foodSources: articles, magazine reader polls and guides consulted (2026-11-22).
 *   Reddit could not be searched with our tools, so community input comes from
 *   Hawaii Magazine's readers' choice polls and travel forums instead.
 * - Places added here come from those sources and have NOT been checked against
 *   their own websites yet; the UI marks them "Not yet verified".
 * - HWP.photos: freely licensed photos from Wikimedia Commons, stored in images/food/.
 *   Each keeps its author, license and source page for the on-page credit.
 */
window.HWP = window.HWP || {};

HWP.foodSources = {
  hm2026maui: { label: "Hawaii Magazine 2026 Readers' Choice: Maui", url: "https://www.hawaiimagazine.com/2026-readers-choice-awards-maui/" },
  hm2022maui: { label: "Hawaii Magazine Best of Maui 2022", url: "https://www.hawaiimagazine.com/?p=109358" },
  hmKauaiPlate: { label: "Hawaii Magazine: best plate lunch spots on Kauaʻi (2025)", url: "https://www.hawaiimagazine.com/?p=135815" },
  hmOnoPoke: { label: "Hawaii Magazine: top poke spot on Oʻahu", url: "https://www.hawaiimagazine.com/top-poke-spot-on-oahu-according-to-yelp/" },
  hm24: { label: "Hawaii Magazine: 24 must-eat dishes in Hawaiʻi", url: "https://www.hawaiimagazine.com/24-must-eat-dishes-in-hawaii/" },
  hmFoodie: { label: "Hawaii Magazine: foodie finds on Oʻahu", url: "https://www.hawaiimagazine.com/try-these-4-foodie-finds-instead-of-popular-oahu-eateries/" },
  hmSatos: { label: "Hawaii Magazine: the story of Sam Sato's dry mein", url: "https://www.hawaiimagazine.com/?p=2362" },
  hmMauiHole: { label: "Hawaii Magazine: Maui hole-in-the-wall eateries", url: "https://www.hawaiimagazine.com/7-must-try-maui-hole-in-the-wall-eateries/" },
  honmagPoke: { label: "Honolulu Magazine: editor's page on poke", url: "https://www.honolulumagazine.com/?p=317320" },
  frommersSatos: { label: "Frommer's: Sam Sato's", url: "https://www.frommers.com/destinations/maui/restaurants/sam-satos" },
  frommersOno: { label: "Frommer's: Ono Seafood", url: "https://www.frommers.com/destinations/oahu/restaurants/ono-seafood" },
  foodnetSatos: { label: "Food Network: Sam Sato's", url: "https://www.foodnetwork.com/restaurants/hi/wailuku/sam-satos-restaurant" },
  travelchOahu: { label: "Travel Channel: locals' list, Oʻahu", url: "https://www.travelchannel.com/destinations/us/hi/articles/locals-list-best-places-to-eat-on-oahu" },
  klookHnl: { label: "Klook: best food in Honolulu", url: "https://www.klook.com/blog/best-food-in-honolulu" },
  hawaiilifeKauai: { label: "Hawaii Life: where to eat on Kauaʻi", url: "https://www.hawaiilife.com/blog/where-eat-kauai-best-breakfast-happy-hour-more/" },
  localgetawaysBI: { label: "Local Getaways: Hawaiian food on the Big Island", url: "https://localgetaways.com/hawaii/best-hawaiian-local-food-on-the-big-island" },
  fodorsLanai: { label: "Fodor's: Lānaʻi restaurants", url: "https://www.fodors.com/world/north-america/usa/hawaii/lanai/restaurants" },
  landlopersLanai: { label: "Landlopers: Lānaʻi dining guide", url: "https://landlopers.com/?p=5267" },
  citylaneKens: { label: "The City Lane: Ken's Fresh Fish", url: "https://thecitylane.com/?p=50729" },
};

/* Sources for places already in the directory */
HWP.foodSourceLinks = {
  "f-rainbow": ["travelchOahu"],
  "f-liliha": ["travelchOahu"],
  "f-giovannis": ["klookHnl"],
  "f-matsumoto": ["hm24"],
  "f-tinroof": ["hm2026maui", "hm2022maui"],
  "f-blueginger": ["fodorsLanai"],
  "f-nobu": ["landlopersLanai"],
};

/* New places found in the research. Not yet checked against official websites. */
HWP.foodAdded = [
  { id: "f-onoseafood", name: "Ono Seafood", island: "oahu", area: "Kapahulu, Honolulu", lat: 21.281, lon: -157.813, kind: "Poke counter", meals: ["Lunch"], cuisine: "Poke", price: 2,
    why: "A tiny Kapahulu counter that keeps topping poke rankings. Hawaii Magazine reports it as Oʻahu's top-rated poke spot on Yelp, and Frommer's calls its poke some of Honolulu's freshest.",
    signature: "Shoyu ahi and spicy ahi poke bowls", setting: "Takeout with a couple of outdoor tables.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Poke", "Local favorite"],
    sources: ["hmOnoPoke", "frommersOno"], place: { type: "seafood", region: "Honolulu", rank: 0 } },
  { id: "f-kensfish", name: "Ken's Fresh Fish", island: "oahu", area: "Lāʻie, North Shore", lat: 21.64, lon: -157.92, kind: "Fish market and plate lunch", meals: ["Lunch"], cuisine: "Seafood", price: 2,
    why: "A North Shore fish shop across from Hukilau Beach known for ahi katsu plates and poke mixed with fresh limu (seaweed).",
    signature: "Ahi katsu plate", setting: "Counter service; hours vary, so check before driving out.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Seafood", "North Shore day"],
    sources: ["honmagPoke", "citylaneKens"], place: { type: "seafood", region: "North Shore", rank: 3 } },
  { id: "f-shiges", name: "Shige's Saimin Stand", island: "oahu", area: "Wahiawā, Central Oʻahu", lat: 21.50, lon: -158.024, kind: "Noodle shop", meals: ["Lunch", "Dinner"], cuisine: "Saimin", price: 1,
    why: "Hawaii Magazine calls it a must-try for saimin, one of the islands' great comfort foods. An easy stop on the drive to the North Shore.",
    signature: "Saimin and a burger", setting: "Casual local diner.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Saimin", "Road stop"],
    sources: ["hm24"], place: { type: "local", region: "Wahiawā", rank: 7 } },
  { id: "f-aokis", name: "Aoki's Shave Ice", island: "oahu", area: "Haleʻiwa, North Shore", lat: 21.594, lon: -158.103, kind: "Shave ice", meals: ["Snack"], cuisine: "Shave ice", price: 1,
    why: "Right across the street from Matsumoto's, and Hawaii Magazine's pick if the famous line is too long.",
    signature: "Shave ice with ice cream", setting: "Takeout.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Sweet treat", "North Shore day"],
    sources: ["hmFoodie"], place: { type: "shaveice", region: "North Shore", rank: 3 } },

  { id: "f-samsato", name: "Sam Sato's", island: "maui", area: "Wailuku", lat: 20.89, lon: -156.49, kind: "Noodle shop", meals: ["Breakfast", "Lunch"], cuisine: "Dry mein, saimin, manju", price: 1,
    why: "A family restaurant with roots back to 1933 and the name most Maui locals give for dry mein: saimin noodles with the broth on the side. Get there early.",
    signature: "Dry mein, a teriyaki stick and manju", setting: "Busy local lunch counter in Wailuku.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Local institution", "Value"],
    sources: ["hmSatos", "frommersSatos", "foodnetSatos", "hm2026maui"], place: { type: "local", region: "Wailuku", star: true, rank: 0 } },
  { id: "f-alohamixed", name: "Aloha Mixed Plate", island: "maui", area: "Lahaina", lat: 20.886, lon: -156.684, kind: "Plate lunch", meals: ["Lunch", "Dinner"], cuisine: "Local plate lunch", price: 2,
    why: "Voted Maui's best plate lunch in Hawaii Magazine's 2026 readers' poll.",
    signature: "Mixed plate", setting: "Oceanside, casual.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Plate lunch", "Readers' pick"],
    note: "Lahaina is rebuilding after the 2023 wildfire. Confirm it's open and follow County of Maui guidance on which areas are open.",
    sources: ["hm2026maui"], place: { type: "local", region: "West Maui", rank: 1 } },
  { id: "f-dakitchen", name: "Da Kitchen", island: "maui", area: "Kahului", lat: 20.886, lon: -156.47, kind: "Plate lunch", meals: ["Lunch", "Dinner"], cuisine: "Local plate lunch", price: 2,
    why: "Big local-style plates; third in Hawaii Magazine's 2026 Maui readers' poll for plate lunch.",
    signature: "Plate lunch", setting: "Casual.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Plate lunch", "Readers' pick"],
    sources: ["hm2026maui"], place: { type: "local", region: "Kahului", rank: 2 } },
  { id: "f-southmauifish", name: "South Maui Fish Co.", island: "maui", area: "Kīhei", lat: 20.74, lon: -156.45, kind: "Poke and fish", meals: ["Lunch"], cuisine: "Poke, fish", price: 2,
    why: "Top poke in Hawaii Magazine's 2022 Maui readers' poll and still in the 2026 top three.",
    signature: "Poke and fish plates", setting: "Casual takeout.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Poke", "Readers' pick"],
    sources: ["hm2022maui", "hm2026maui"], place: { type: "seafood", region: "Kīhei", rank: 1 } },
  { id: "f-tobis", name: "Tobi's Poke & Shave Ice", island: "maui", area: "Pāʻia", lat: 20.91, lon: -156.38, kind: "Poke and shave ice", meals: ["Lunch", "Snack"], cuisine: "Poke, shave ice", price: 2,
    why: "Poke and shave ice in one stop at the start of the Hāna Highway. Hawaii Magazine highlights it for fresh poke.",
    signature: "Poke bowl, then shave ice", setting: "Small, casual.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Poke", "Road to Hāna"],
    sources: ["hmMauiHole"], place: { type: "seafood", region: "Pāʻia", rank: 4 } },

  { id: "f-superjs", name: "Kaʻaloa's Super J's", island: "hawaii", area: "South Kona", lat: 19.44, lon: -155.88, kind: "Hawaiian food", meals: ["Lunch"], cuisine: "Hawaiian", price: 2,
    why: "A family-run roadside spot that one Big Island food guide calls the place for the best laulau in West Hawaiʻi.",
    signature: "Laulau plate", setting: "Small roadside kitchen.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Hawaiian food", "Road stop"],
    sources: ["localgetawaysBI"], place: { type: "hawaiian", region: "Kona", rank: 3 } },

  { id: "f-marksplace", name: "Mark's Place", island: "kauai", area: "Līhuʻe", lat: 21.96, lon: -159.38, kind: "Plate lunch", meals: ["Lunch"], cuisine: "Local plate lunch", price: 1,
    why: "One of Kauaʻi's most popular plate lunch spots, named in Hawaii Magazine's 2025 readers' picks. The mixed plate covers chicken katsu, teriyaki beef and beef stew.",
    signature: "Mixed plate", setting: "Takeout.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Plate lunch", "Readers' pick"],
    sources: ["hmKauaiPlate", "hawaiilifeKauai"], place: { type: "local", region: "Līhuʻe", star: true, rank: 1 } },
  { id: "f-koloafish", name: "Koloa Fish Market", island: "kauai", area: "Kōloa", lat: 21.906, lon: -159.468, kind: "Poke and plate lunch", meals: ["Lunch"], cuisine: "Poke, plate lunch", price: 1,
    why: "Poke and plate lunches (including a Hawaiian plate with kālua pig or laulau) near Poʻipū. Cash only, according to Hawaii Life.",
    signature: "Poke and a Hawaiian plate", setting: "Small takeout counter.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Poke", "Readers' pick"],
    sources: ["hmKauaiPlate", "hawaiilifeKauai"], place: { type: "seafood", region: "Kōloa", star: true, rank: 2 } },
  { id: "f-sueoka", name: "Sueoka Snack Shop", island: "kauai", area: "Kōloa", lat: 21.906, lon: -159.469, kind: "Plate lunch and shave ice", meals: ["Lunch", "Snack"], cuisine: "Local plate lunch", price: 1,
    why: "A Kōloa snack shop on Hawaii Magazine's 2025 Kauaʻi plate lunch list, with a shave ice stand on the market patio.",
    signature: "Plate lunch, then shave ice", setting: "Walk-up window.", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", tags: ["Plate lunch", "Value"],
    sources: ["hmKauaiPlate"], place: { type: "local", region: "Kōloa", rank: 4 } },
];

/* ---------------------------------------------------- Kauaʻi expansion */
Object.assign(HWP.foodSources, {
  hmKauaiPoke: { label: "Hawaii Magazine: the 5 best poke shops on Kauaʻi", url: "https://www.hawaiimagazine.com/the-5-best-poke-shops-on-kauai/" },
  abcPono: { label: "ABC7: best poke in Hawaiʻi at Pono Market", url: "https://abc7.com/videoClip/10328344/" },
  hmKauaiShave: { label: "Hawaii Magazine: best shave ice stands on Kauaʻi (2024 readers' choice)", url: "https://www.hawaiimagazine.com/5-best-shave-ice-stands-on-kauai-in-2024/" },
  tastingKauaiShave: { label: "Tasting Table: best shave ice on Kauaʻi", url: "https://www.tastingtable.com/cook/national/hawaii-tourism-kauai-shave-ice-wailua-wishing-well" },
  hmHiddenKauai: { label: "Hawaii Magazine: hidden foodie gems on Kauaʻi", url: "https://www.hawaiimagazine.com/hidden-foodie-gems-on-kauai/" },
  hmKauaiBakery: { label: "Hawaii Magazine: Kauaʻi Bakery is still our favorite sweet spot", url: "https://www.hawaiimagazine.com/kauai-bakery-is-still-our-favorite-sweet-spot/" },
  hmMalasadas: { label: "Hawaii Magazine: 10 favorite malasadas in Hawaiʻi", url: "https://www.hawaiimagazine.com/our-10-favorite-malasadas-to-celebrate-mardi-gras-in-hawaii/" },
  starMidnight: { label: "Star-Advertiser: Kauaʻi restaurant of the week, Midnight Bear Breads", url: "https://dining.staradvertiser.com/?p=43130" },
  fodorsKauai: { label: "Fodor's: best restaurants on Kauaʻi", url: "https://www.fodors.com/world/north-america/usa/hawaii/kauai/restaurants" },
  afarKauai: { label: "Afar: the best restaurants on Kauaʻi", url: "https://www.afar.com/travel-tips/the-best-restaurants-on-kauai" },
  hm2026all: { label: "Hawaii Magazine 2026 Readers' Choice: all islands", url: "https://www.hawaiimagazine.com/2026-readers-choice-awards-all-islands/" },
  hmKauaiTrucks: { label: "Hawaii Magazine: the 5 best food trucks on Kauaʻi (2026)", url: "https://www.hawaiimagazine.com/?p=139885" },
  hmKauaiWhere: { label: "Hawaii Magazine: Kauaʻi where to eat", url: "https://www.hawaiimagazine.com/category/kauai-where-to-eat/" },
  hmHanaleiTaro: { label: "Hawaii Magazine: Hanalei Taro & Juice Co.", url: "https://www.hawaiimagazine.com/tag/hanalei-taro-and-juice-co" },
});
HWP.foodTypes.splice(6, 0, { id: "trucks", label: "Food trucks", blurb: "Tacos, musubi and fish plates from a window" });

/* Group Kauaʻi into five areas a visitor would recognize. */
const KAUAI = { lihue: "Līhuʻe", east: "Kapaʻa & east side", north: "North shore (Hanalei & Kīlauea)", south: "Poʻipū & Kōloa", west: "West side (Hanapēpē to Waimea)" };
[["f-hamura", "lihue"], ["f-kauaimarket", "lihue"], ["f-marksplace", "lihue"], ["f-tahitinui", "north"], ["f-baracuda", "north"], ["f-holeygrail", "north"]]
  .forEach(([id, r]) => { if (HWP.foodPlacement[id]) HWP.foodPlacement[id].region = KAUAI[r]; });
HWP.foodAdded.forEach((p) => { if (p.island === "kauai") p.place.region = p.id === "f-marksplace" ? KAUAI.lihue : KAUAI.south; });

const kauaiPlace = (o) => Object.assign({ island: "kauai", web: null, webLabel: "No official website confirmed", reservations: "Walk-in", price: 1 }, o);
HWP.foodAdded.push(
  kauaiPlace({ id: "f-ponomarket", name: "Pono Market", area: "Kapaʻa", lat: 22.075, lon: -159.319, kind: "Poke and local deli", meals: ["Breakfast", "Lunch"], cuisine: "Poke, Hawaiian plates",
    why: "Family-owned since 1968 and the most consistently praised poke counter on the east side, with ahi, salmon, shrimp and tako poke plus Hawaiian plates.",
    signature: "Ahi poke and a laulau plate", setting: "Small market counter; takeout.", tags: ["Poke", "Local institution"],
    sources: ["hmKauaiPoke", "abcPono"], place: { type: "seafood", region: KAUAI.east, star: true, rank: 0 } }),
  kauaiPlace({ id: "f-kilaueafish", name: "Kilauea Fish Market", area: "Kīlauea", lat: 22.212, lon: -159.406, kind: "Fish market and takeout", meals: ["Lunch", "Dinner"], cuisine: "Poke, fish plates", price: 2,
    why: "A north shore favorite for fresh fish plates, wraps and poke to take to the beach.",
    signature: "Ahi plate or wrap", setting: "Takeout with a few outdoor tables.", tags: ["Seafood", "North shore day"],
    sources: ["hmKauaiPoke"], place: { type: "seafood", region: KAUAI.north, rank: 3 } }),
  kauaiPlace({ id: "f-fishexpress", name: "Fish Express", area: "Līhuʻe", lat: 21.966, lon: -159.383, kind: "Poke counter", meals: ["Lunch"], cuisine: "Poke, plate lunch",
    why: "A Līhuʻe go-to for a big poke selection and daily fish plate lunches, handy near the airport.",
    signature: "Poke by the pound", setting: "Takeout counter.", tags: ["Poke", "Near airport"],
    sources: ["hmKauaiPoke"], place: { type: "seafood", region: KAUAI.lihue, rank: 4 } }),
  kauaiPlace({ id: "f-jojos", name: "JoJo's Shave Ice", area: "Waimea (also Hanalei)", lat: 21.957, lon: -159.668, kind: "Shave ice", meals: ["Snack"], cuisine: "Shave ice",
    why: "Voted Kauaʻi's best shave ice in Hawaii Magazine's 2024 readers' poll, a local favorite since 1992 with 30-plus flavors. The Waimea stand is perfect after Waimea Canyon.",
    signature: "Shave ice with ice cream at the bottom", setting: "Takeout; check which locations are open.", tags: ["Sweet treat", "Readers' pick"],
    sources: ["hmKauaiShave"], place: { type: "shaveice", region: KAUAI.west, star: true, rank: 0 } }),
  kauaiPlace({ id: "f-wishingwell", name: "Wishing Well Shave Ice", area: "Hanalei", lat: 22.204, lon: -159.497, kind: "Shave ice truck", meals: ["Snack"], cuisine: "Shave ice, açaí, coffee",
    why: "A Hanalei shave ice truck running since the 1980s; reviewers single out the macadamia nut ice cream underneath.",
    signature: "Shave ice with mac nut ice cream", setting: "Vintage truck in Hanalei town.", tags: ["Sweet treat", "North shore day"],
    sources: ["tastingKauaiShave", "hmKauaiShave"], place: { type: "shaveice", region: KAUAI.north, rank: 1 } }),
  kauaiPlace({ id: "f-freshshave", name: "The Fresh Shave", area: "South side", lat: 21.906, lon: -159.47, kind: "Shave ice", meals: ["Snack"], cuisine: "Shave ice",
    why: "Shave ice made with natural syrups; Hawaii Magazine notes long lines at the midday rush.",
    signature: "Shave ice with fresh fruit syrups", setting: "Small stand.", note: "Sources list it in both Kōloa and Kalāheo. Check its current location before you go.", tags: ["Sweet treat"],
    sources: ["hmHiddenKauai"], place: { type: "shaveice", region: KAUAI.south, rank: 2 } }),
  kauaiPlace({ id: "f-kauaibakery", name: "Kauaʻi Bakery", area: "Līhuʻe", lat: 21.969, lon: -159.382, kind: "Bakery", meals: ["Breakfast", "Snack"], cuisine: "Malasadas, pastries",
    why: "Famous for stuffed malasadas. It beat Leonard's for best malasada in Hawaii Magazine's 2021 readers' poll. Order a malasada flight.",
    signature: "Stuffed malasada flight", setting: "Bakery counter.", tags: ["Sweet treat", "Readers' pick"],
    sources: ["hmKauaiBakery", "hmMalasadas"], place: { type: "sweets", region: KAUAI.lihue, star: true, rank: 0 } }),
  kauaiPlace({ id: "f-alohasweet", name: "Aloha Sweet Delights", area: "Kaumakani", lat: 21.92, lon: -159.62, kind: "Bakery", meals: ["Breakfast", "Snack"], cuisine: "Malasadas, fritters",
    why: "A family-run west side bakery for more than 50 years, known for malasadas and pineapple fritters that sell out early. A good stop on the way to Waimea Canyon.",
    signature: "Malasadas and pineapple fritters", setting: "Roadside bakery; go early.", tags: ["Sweet treat", "Road stop"],
    sources: ["hmMalasadas"], place: { type: "sweets", region: KAUAI.west, rank: 1 } }),
  kauaiPlace({ id: "f-midnightbear", name: "Midnight Bear Breads", area: "Hanapēpē", lat: 21.912, lon: -159.59, kind: "Bakery", meals: ["Breakfast", "Lunch", "Snack"], cuisine: "Artisan breads, pastries", price: 2,
    why: "Organic European-style breads from a stone hearth oven in historic Hanapēpē, plus pastries and sandwiches.",
    signature: "Hearth bread and pastries", setting: "Small bakery cafe; limited days (check).", tags: ["Bakery"],
    sources: ["starMidnight"], place: { type: "sweets", region: KAUAI.west, rank: 2 } }),
  kauaiPlace({ id: "f-japgrandma", name: "Japanese Grandma's Café", area: "Hanapēpē", lat: 21.912, lon: -159.591, kind: "Restaurant", meals: ["Lunch", "Dinner"], cuisine: "Japanese", price: 3,
    why: "Sushi and Japanese comfort food in Hanapēpē, featured in Hawaii Magazine's Kauaʻi dining coverage.",
    signature: "Sushi and bento", setting: "Small, casual dining room.", tags: ["Japanese"],
    sources: ["hmKauaiWhere"], place: { type: "local", region: KAUAI.west, rank: 6 } }),
  kauaiPlace({ id: "f-hanaleitaro", name: "Hanalei Taro & Juice Co.", area: "Hanalei", lat: 22.207, lon: -159.48, kind: "Farm food stand", meals: ["Lunch", "Snack"], cuisine: "Hawaiian, taro", price: 2,
    why: "Run by a taro-farming family, serving taro-based plates, smoothies and treats next to the loʻi of Hanalei Valley.",
    signature: "Kalo (taro) plate and a smoothie", setting: "Roadside food stand.", tags: ["Hawaiian food", "Local producers"],
    sources: ["hmHanaleiTaro"], place: { type: "hawaiian", region: KAUAI.north, rank: 0 } }),
  kauaiPlace({ id: "f-eatinghouse", name: "Eating House 1849", area: "Poʻipū (Kōloa)", lat: 21.885, lon: -159.475, kind: "Restaurant", meals: ["Dinner"], cuisine: "Plantation-era local", price: 4,
    why: "Chef Roy Yamaguchi's take on plantation-era cooking, with Portuguese, Filipino and Japanese influences. Fodor's top pick on the south shore.",
    signature: "Spicy ramen with pork belly", setting: "Lively dinner spot; dinner only.", reservations: "No reservations (per Fodor's); expect a wait", tags: ["Special occasion"],
    sources: ["fodorsKauai"], place: { type: "special", region: KAUAI.south, rank: 1 } }),
  kauaiPlace({ id: "f-beachhouse", name: "The Beach House Restaurant", area: "Lāwaʻi Beach, Poʻipū", lat: 21.879, lon: -159.486, kind: "Restaurant", meals: ["Dinner"], cuisine: "Island seafood", price: 4,
    why: "Oceanfront fine dining with one of the south shore's best sunset views. Pricey, but reviewers call the food top notch.",
    signature: "Fresh catch at sunset", setting: "Right on the water.", reservations: "Reservations recommended (verify)", tags: ["Special occasion", "Sunset"],
    sources: ["fodorsKauai", "afarKauai"], place: { type: "special", region: KAUAI.south, star: true, rank: 0 } }),
  kauaiPlace({ id: "f-mura", name: "Mura Izakaya", area: "Kōloa", lat: 21.906, lon: -159.471, kind: "Restaurant", meals: ["Dinner"], cuisine: "Japanese izakaya", price: 3,
    why: "Named the best new restaurant across all the islands in Hawaii Magazine's 2026 readers' poll, serving sushi, ramen and izakaya plates.",
    signature: "Sushi and izakaya small plates", setting: "Small dining room; dinner only.", reservations: "Reservations recommended (verify)", tags: ["Japanese", "Readers' pick"],
    sources: ["hm2026all"], place: { type: "special", region: KAUAI.south, rank: 2 } }),
  kauaiPlace({ id: "f-hukilau", name: "Hukilau Lanai", area: "Kapaʻa", lat: 22.05, lon: -159.32, kind: "Restaurant", meals: ["Dinner"], cuisine: "Island seafood", price: 3,
    why: "An east side favorite for seafood, live music and romance. Ask for a lanai table, and try the poke nachos the restaurant is credited with creating.",
    signature: "Poke nachos and fresh fish", setting: "Open-air, oceanside resort grounds.", reservations: "Reserve ahead and request the lanai", tags: ["Special occasion", "Live music"],
    sources: ["fodorsKauai"], place: { type: "special", region: KAUAI.east, rank: 3 } }),
  kauaiPlace({ id: "f-bajachalupas", name: "Baja Chalupa's", area: "Kōloa", lat: 21.906, lon: -159.469, kind: "Food truck", meals: ["Lunch", "Dinner"], cuisine: "Mexican", price: 1,
    why: "A red-and-white Kōloa taco truck on Hawaii Magazine's 2026 list of Kauaʻi's best food trucks, known for al pastor and blackened fish tacos.",
    signature: "Al pastor and blackened fish tacos", setting: "Food truck.", tags: ["Food truck", "Readers' pick"],
    sources: ["hmKauaiTrucks"], place: { type: "trucks", region: KAUAI.south, rank: 0 } }),
  kauaiPlace({ id: "f-musubitruck", name: "The Musubi Truck", area: "Kapaʻa, Hanapēpē and Kōloa", lat: 22.075, lon: -159.32, kind: "Food truck", meals: ["Breakfast", "Lunch"], cuisine: "Musubi", price: 1,
    why: "Elevated, local-style musubi from three trucks around the island, on Hawaii Magazine's 2026 best food trucks list.",
    signature: "Spam and specialty musubi", setting: "Food trucks; check locations.", tags: ["Food truck", "Readers' pick"],
    sources: ["hmKauaiTrucks"], place: { type: "trucks", region: KAUAI.east, rank: 1 } }),
);

/* Merriman's Kauaʻi: address read from merrimanshawaii.com on 2026-11-22 */
HWP.foodAdded.push(kauaiPlace({ id: "f-merrimanskauai", name: "Merriman's Kauaʻi", area: "Poʻipū (Kōloa)", lat: 21.884, lon: -159.47, kind: "Restaurant", meals: ["Dinner"], cuisine: "Hawaii Regional", price: 4,
  why: "Peter Merriman's farm-to-table cooking at the Shops at Kukuiʻula; the south shore sibling of his Waimea flagship.",
  signature: "Local fish and island-farm produce", setting: "Upstairs dining room in Kukuiʻula.", address: "2829 Ala Kalanikaumaka St., Kōloa",
  reservations: "Reservations through the official site", web: "https://www.merrimanshawaii.com/", webLabel: "Official website",
  verified: { date: "2026-11-22", source: "merrimanshawaii.com" }, status: "ok", tags: ["Special occasion", "Local producers"],
  place: { type: "special", region: KAUAI.south, rank: 4 } }));

/* Add Kauaʻi options to the dish strip */
HWP._kauaiDishAdds = { "poke": ["f-ponomarket"], "shave-ice": ["f-jojos"] };

HWP.photos = {
  "loco-moco": { src: "images/food/loco-moco.jpg", alt: "Loco moco: rice topped with a hamburger patty, brown gravy and a fried egg", author: "Ocdp", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Loco_moco_001.jpg" },
  "ahi-poke": { src: "images/food/ahi-poke.jpg", alt: "Ahi poke: cubes of raw tuna with onion and seaweed", author: "Janine from Mililani, Hawaii", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Ahi_poke_(poh-kay).jpg" },
  "plate-lunch": { src: "images/food/plate-lunch.jpg", alt: "Plate lunch with rice, poke, laulau and lomi salmon in a takeout box", author: "christian razukas", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", page: "https://commons.wikimedia.org/wiki/File:Wardsplatelunch.jpg" },
  "laulau": { src: "images/food/laulau.jpg", alt: "Laulau wrapped in leaves, served with fried rice and salad", author: "Neeta Lind", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Laulau.jpg" },
  "saimin": { src: "images/food/saimin.jpg", alt: "A bowl of saimin with noodles, sliced ham, green onion and kamaboko", author: "Honolulu Noodz", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:Classic_Saimin.jpg" },
  "garlic-shrimp": { src: "images/food/garlic-shrimp-giovannis.jpg", alt: "Spicy shrimp with rice and lemon from Giovanni's shrimp truck", author: "Daniel Ramirez", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Spicy_Shrimp_from_Giovanni%27s_shrimp_truck_(16774638669).jpg", at: "f-giovannis" },
  "spam-musubi": { src: "images/food/spam-musubi.jpg", alt: "Spam musubi: grilled Spam on rice wrapped with nori", author: "Ocdp", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Spam_musubi_001.jpg" },
  "poi": { src: "images/food/poi.jpg", alt: "A bowl of purple-grey poi with a spoon", author: "Bshams", license: "Public domain", licenseUrl: "", page: "https://commons.wikimedia.org/wiki/File:Bowl_of_poi.jpg" },
  "shave-ice": { src: "images/food/shave-ice.jpg", alt: "Shave ice: a cup of finely shaved ice soaked in orange and red syrups", author: "AlaskaDave", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", page: "https://commons.wikimedia.org/wiki/File:Hilo_Ice_Shave.JPG", note: "Kawate Seed Shop, Hilo" },
  "haupia": { src: "images/food/haupia.jpg", alt: "Squares of white haupia coconut pudding on a plate", author: "Arnold Gatilao", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Haupia.jpg" },
};

/* Signature dishes and where to try them (place ids). */
HWP.dishes = [
  { id: "loco-moco", name: "Loco moco", what: "Rice, a hamburger patty, a fried egg and brown gravy. Born in Hilo.", photo: "loco-moco", places: ["f-cafe100", "f-rainbow", "f-kens"] },
  { id: "poke", name: "Poke", what: "Cubed raw fish, usually ahi, seasoned with shoyu, limu, onion or chili.", photo: "ahi-poke", places: ["f-onoseafood", "f-dapoke", "f-southmauifish", "f-koloafish"] },
  { id: "plate-lunch", name: "Plate lunch", what: "Two scoops rice, mac salad and a main: the islands' everyday lunch.", photo: "plate-lunch", places: ["f-rainbow", "f-tinroof", "f-alohamixed", "f-marksplace"] },
  { id: "saimin", name: "Saimin", what: "Noodle soup in a light dashi broth; Maui's dry mein serves the broth on the side.", photo: "saimin", places: ["f-hamura", "f-samsato", "f-shiges"] },
  { id: "laulau", name: "Laulau", what: "Pork and butterfish wrapped in lūʻau leaves and steamed until tender.", photo: "laulau", places: ["f-helenas", "f-highwayinn", "f-superjs"] },
  { id: "shave-ice", name: "Shave ice", what: "Ice shaved fine as snow and soaked in fruit syrups, often with ice cream or azuki beans underneath.", photo: "shave-ice", places: ["f-matsumoto", "f-aokis", "f-ululanis"] },
  { id: "garlic-shrimp", name: "Garlic shrimp", what: "Kahuku's buttery, garlicky shrimp over rice, eaten at a truck.", photo: "garlic-shrimp", places: ["f-giovannis"] },
  { id: "spam-musubi", name: "Spam musubi", what: "Grilled Spam on rice wrapped in nori. Sold at nearly every market and convenience store.", photo: "spam-musubi", places: [] },
  { id: "poi", name: "Poi", what: "Pounded taro, a Hawaiian staple. Try it fresh alongside kalua pig.", photo: "poi", places: ["f-helenas", "f-highwayinn"] },
  { id: "haupia", name: "Haupia", what: "Coconut pudding, served in squares or in chocolate haupia pie.", photo: "haupia", places: ["f-helenas", "f-leodas"] },
];

/* Kauaʻi spots in the dish strip */
Object.entries(HWP._kauaiDishAdds).forEach(([dish, ids]) => {
  const d = HWP.dishes.find((x) => x.id === dish);
  if (d) ids.forEach((id) => { if (!d.places.includes(id)) d.places.push(id); });
});

/* ----------------------------------------------- Kauaʻi expansion, part 2
   From area round-ups and topic guides read on 2026-11-22 (search summaries
   of these pages). Each "round-up" source groups the pages we read for that
   area. None of these places are checked against official websites yet. */
Object.assign(HWP.foodSources, {
  kapaaRound: { label: "Kapaʻa dining round-ups (Amy Fillinger, Kauai Exclusive, Tripadvisor local eats)", url: "https://amyfillinger.com/places-to-eat-in-kapaa-kauai/" },
  lihueRound: { label: "Līhuʻe dining round-ups (Foodeist, Wanderlog)", url: "https://foodeist.com/best-restaurants-in-lihue-kauai" },
  poipuRound: { label: "Poʻipū and Kōloa restaurant guides (Kool Kondo, OpenTable, Wanderlog)", url: "https://koolkondo.com/poipu-and-koloa-restaurant-guide/" },
  northRound: { label: "North shore guides (I Heart Princeville, OpenTable, Wanderlustyle)", url: "https://iheartprinceville.com/shops/hanalei-restaurants/" },
  westRound: { label: "West side picks (She Saves She Travels, Tripadvisor Kauaʻi forum)", url: "https://shesavesshetravels.com/travel-destinations/best-places-to-eat-in-kauai/" },
  breakfastKauai: { label: "Wanderly: best breakfast on Kauaʻi", url: "https://gowanderly.com/best-breakfast-kauai/" },
  plateKauai: { label: "Parrish Kauaʻi: the best plate lunches on Kauaʻi", url: "https://www.parrishkauai.com/103260/plate-lunch-kauai/" },
  localGrindsKauai: { label: "Hawaii.com: best affordable eats on Kauaʻi", url: "https://hawaii.com/blog/check-out-these-restaurants-for-great-local-grinds-on-kauai" },
  barsKauai: { label: "Wanderly: best bars in Kauaʻi", url: "https://gowanderly.com/best-bars-kauai/" },
  eatsKauai: { label: "Teaspoon of Adventure: best places to eat in Kauaʻi", url: "https://teaspoonofadventure.com/best-places-to-eat-in-kauai/" },
  trucksKauai: { label: "Hawaii Vacation Guide: Kauaʻi food truck guide", url: "https://thehawaiivacationguide.com/kauai-food-trucks/" },
});
HWP.foodTypes.splice(HWP.foodTypes.findIndex((t) => t.id === "sweets") + 1, 0, { id: "coffee", label: "Coffee, breakfast & açaí", blurb: "Pancakes, local coffee and bowls before the beach" });
HWP.foodTypes.find((t) => t.id === "trucks").label = "Food trucks & tacos";

(function () {
  const R = { lihue: [KAUAI.lihue, 21.97, -159.37], east: [KAUAI.east, 22.07, -159.32], north: [KAUAI.north, 22.205, -159.49], south: [KAUAI.south, 21.885, -159.46], west: [KAUAI.west, 21.91, -159.6] };
  const jit = (id, salt) => { let h = salt; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 9973; return (h / 9973 - .5) * .012; };
  const K = (id, name, area, r, type, kind, price, meals, why, signature, sources, extra) => {
    const [region, lat, lon] = R[r];
    HWP.foodAdded.push(kauaiPlace(Object.assign({ id, name, area, lat: lat + jit(id, 1), lon: lon + jit(id, 7), kind, price, meals, cuisine: kind, why, signature, setting: "", tags: [], sources,
      place: { type, region, rank: 20 } }, extra || {})));
  };
  // Kapaʻa & east side
  K("f-kountry", "Kountry Kitchen", "Kapaʻa", "east", "coffee", "Breakfast diner", 2, ["Breakfast", "Lunch"], "A Kapaʻa breakfast institution since 1975; locals order the macadamia nut pancakes or kalua pork eggs Benedict.", "Mac nut pancakes", ["kapaaRound", "breakfastKauai"], { place: { type: "coffee", region: KAUAI.east, star: true, rank: 1 } });
  K("f-javakai", "Java Kai", "Kapaʻa (also Kōloa and Kīlauea)", "east", "coffee", "Coffee roaster and cafe", 1, ["Breakfast", "Snack"], "Roasts its own beans and is the coffee stop guides name most often; the macadamia nut latte is the order.", "Macadamia nut latte", ["breakfastKauai"], { place: { type: "coffee", region: KAUAI.east, star: true, rank: 0 } });
  K("f-smalltown", "Small Town Coffee", "Kapaʻa", "east", "coffee", "Coffee truck", 1, ["Breakfast"], "A coffee truck one guide calls the best place to grab breakfast on the east side.", "Coffee and a breakfast bite", ["breakfastKauai"]);
  K("f-onofamily", "Ono Family Restaurant", "Kapaʻa", "east", "coffee", "Breakfast cafe", 2, ["Breakfast", "Lunch"], "A cozy cafe and local favorite for more than 30 years.", "Local-style breakfast", ["kapaaRound"]);
  K("f-olympic", "Olympic Café", "Kapaʻa", "east", "local", "Diner", 2, ["Breakfast", "Lunch", "Dinner"], "Diner classics and Hawaiian-style plates in big portions, right in old Kapaʻa town.", "Loco moco", ["kapaaRound"]);
  K("f-bullshed", "Bull Shed Restaurant", "Wailua / Kapaʻa", "east", "special", "Steak and seafood", 3, ["Dinner"], "Oceanfront steak and seafood since 1973, known for generous surf 'n' turf at fair prices.", "Surf 'n' turf", ["kapaaRound"]);
  K("f-coconuts", "Coconut's Fish Cafe", "Kapaʻa", "east", "seafood", "Fish cafe", 2, ["Lunch", "Dinner"], "Often named the best spot in Kapaʻa for wild-caught fish tacos and fish and chips.", "Fish tacos", ["kapaaRound"]);
  K("f-samsocean", "Sam's Ocean View", "Kapaʻa", "east", "bars", "Restaurant and bar", 3, ["Lunch", "Dinner", "Drinks"], "Ocean views over Kapaʻa with well-liked fish and chips and a Wagyu steak locals rate.", "Fish and chips", ["kapaaRound"]);
  K("f-shakalafel", "Shakalafel", "Kapaʻa", "east", "trucks", "Mediterranean", 1, ["Lunch", "Dinner"], "Casual falafel and shawarma that one reviewer calls the best casual lunch in Kapaʻa.", "Falafel wrap", ["kapaaRound"]);
  K("f-chickenbarrel", "Chicken in a Barrel BBQ", "Kapaʻa", "east", "local", "Barbecue", 1, ["Lunch", "Dinner"], "Smoky barrel-cooked chicken and ribs at budget prices.", "Barrel-smoked chicken plate", ["kapaaRound"]);
  K("f-bubba", "Bubba Burgers", "Kapaʻa (also Poʻipū)", "east", "local", "Burgers", 1, ["Lunch", "Dinner"], "A long-running counter-serve burger stand using Kauaʻi beef.", "Kauaʻi beef burger", ["kapaaRound", "poipuRound"]);
  K("f-kenji", "Kenji Burger", "Kapaʻa", "east", "local", "Burgers and sushi burritos", 2, ["Lunch", "Dinner"], "The most-recommended burger on the east side: grass-fed Kauaʻi beef with Japanese twists, plus sushi burritos.", "Hapa burger", ["eatsKauai"], { place: { type: "local", region: KAUAI.east, star: true, rank: 3 } });
  K("f-streetburger", "Street Burger", "Wailua", "east", "bars", "Burger pub", 2, ["Lunch", "Dinner", "Drinks"], "An upscale burger micro-pub built around fresh local products.", "Burger and a local beer", ["kapaaRound"]);
  K("f-anattas", "Anatta's Thai Street Food", "Kapaʻa", "east", "trucks", "Thai", 1, ["Lunch", "Dinner"], "Well-rated Thai street food; reviewers single out the pad Thai and fried rice.", "Pad Thai", ["kapaaRound"]);
  K("f-tikitacos", "Tiki Tacos", "Kapaʻa", "east", "trucks", "Tacos", 1, ["Lunch", "Dinner"], "Huge tacos on handmade tortillas, with good vegetarian options.", "Fish and kalua pork tacos", ["eatsKauai"]);
  K("f-wailuashave", "Wailua Shave Ice", "Kapaʻa", "east", "shaveice", "Shave ice", 1, ["Snack"], "Highly rated east side shave ice with fresh-fruit syrups and toppings.", "Shave ice with fruit purées", ["kapaaRound", "hmKauaiShave"]);
  K("f-jo2", "JO2", "Kapaʻa", "east", "special", "Natural French-Asian", 4, ["Dinner"], "Chef Jean-Marie Josselin's seasonal fine dining, with a menu that changes often.", "Seasonal tasting dishes", ["kapaaRound"], { reservations: "Reservations recommended (verify)" });
  K("f-napalibrew", "Nāpali Brewing Company", "Kapaʻa", "east", "bars", "Brewpub", 2, ["Dinner", "Drinks"], "A Kapaʻa brewery with evening live music and a weekday happy hour.", "House beers at happy hour", ["barsKauai"]);
  K("f-wailuadrivein", "Wailua Drive Inn", "Kapaʻa", "east", "local", "Plate lunch", 1, ["Lunch"], "A roadside classic serving legit Hawaiian plate lunches at time-warp prices.", "Hawaiian plate lunch", ["plateKauai"]);
  // Līhuʻe
  K("f-dukes", "Duke's Kauaʻi", "Kalapakī Beach, Līhuʻe", "lihue", "bars", "Beachfront restaurant and bar", 3, ["Lunch", "Dinner", "Drinks"], "A beachfront bar and restaurant on Kalapakī Beach with tiered ocean-view seating.", "Fresh fish and hula pie", ["lihueRound"]);
  K("f-sushistation", "Kauaʻi Sushi Station", "Līhuʻe", "lihue", "seafood", "Sushi", 2, ["Lunch", "Dinner"], "One of the highest-rated sushi spots on the island, according to review round-ups.", "Sushi rolls and poke bowls", ["lihueRound", "trucksKauai"], { place: { type: "seafood", region: KAUAI.lihue, star: true, rank: 2 } });
  K("f-smileys", "Smiley's Local Grinds", "Līhuʻe", "lihue", "local", "Plate lunch", 1, ["Lunch"], "Big local plates to go; call your order in to skip the line.", "Chicken katsu plate", ["lihueRound", "plateKauai"], { place: { type: "local", region: KAUAI.lihue, star: true, rank: 2 } });
  K("f-konohiki", "Konohiki Seafoods", "Līhuʻe", "lihue", "seafood", "Poke and plates", 1, ["Lunch"], "Known for poke and seafood plates; popular enough that lines are common.", "Poke bowl", ["lihueRound", "plateKauai"], { place: { type: "seafood", region: KAUAI.lihue, star: true, rank: 1 } });
  K("f-kauaidiner", "Kauaʻi Diner", "Līhuʻe", "lihue", "local", "Diner", 2, ["Breakfast", "Lunch", "Dinner"], "A family-owned diner with local and American comfort food.", "Loco moco", ["lihueRound"]);
  K("f-okis", "Oki's Box Lunches", "Līhuʻe", "lihue", "local", "Box lunches", 1, ["Breakfast", "Lunch"], "A local favorite for box lunches with chicken katsu, musubi and pancakes.", "Bento box lunch", ["lihueRound"]);
  K("f-hualanis", "Hualani's", "Timbers Kauaʻi, Līhuʻe", "lihue", "special", "Farm-to-table", 4, ["Breakfast", "Dinner"], "Farm-to-table dining at Timbers Kauaʻi, cooking with produce from the resort's own farm.", "Farm vegetables and local fish", ["lihueRound"], { reservations: "Reservations recommended (verify)" });
  K("f-gaylords", "The Plantation House by Gaylord's", "Kilohana, Līhuʻe", "lihue", "special", "Restaurant", 3, ["Lunch", "Dinner"], "Dining at the historic Kilohana plantation estate.", "Fresh catch", ["lihueRound"]);
  K("f-lilikoi", "Lilikoi Bar & Grill", "Līhuʻe", "lihue", "bars", "Bar and grill", 2, ["Lunch", "Dinner", "Drinks"], "A casual Līhuʻe bar and grill that shows up on several local lists.", "Burger and a lilikoʻi cocktail", ["lihueRound"]);
  // Poʻipū & Kōloa
  K("f-tidepools", "Tidepools", "Grand Hyatt Kauaʻi, Poʻipū", "south", "special", "Fine dining", 4, ["Dinner"], "The south shore's most consistently recommended fine dining: thatched huts over koi ponds.", "Macadamia-crusted fish", ["poipuRound"], { reservations: "Reservations recommended (verify)", place: { type: "special", region: KAUAI.south, star: true, rank: 3 } });
  K("f-redsalt", "Red Salt", "Koʻa Kea, Poʻipū", "south", "special", "Fine dining", 4, ["Breakfast", "Dinner"], "An acclaimed restaurant led by Kauaʻi-born executive chef Noelani Planas.", "Chef's island tasting dishes", ["poipuRound"], { reservations: "Reservations recommended (verify)" });
  K("f-tableatpoipu", "Table at Poipu", "Kōloa", "south", "special", "Seafood", 3, ["Dinner"], "A quiet, casually elegant seafood restaurant rated highly on OpenTable.", "Local fish", ["poipuRound"]);
  K("f-laspezia", "La Spezia", "Kōloa", "south", "special", "Italian and wine bar", 3, ["Breakfast", "Dinner"], "An Italian wine bar that one reviewer calls the best fine dining on the south side.", "Housemade pasta", ["poipuRound"]);
  K("f-keokis", "Keoki's Paradise", "Poʻipū", "south", "special", "Island-style restaurant", 3, ["Lunch", "Dinner", "Drinks"], "A long-running Poʻipū favorite with Hawaiian-inspired dishes in a garden setting.", "Fresh fish and hula pie", ["poipuRound"]);
  K("f-brenneckes", "Brennecke's Beach Broiler", "Poʻipū Beach", "south", "bars", "Beach broiler", 2, ["Lunch", "Dinner", "Drinks"], "Open-air dining across from Poʻipū Beach Park, praised for burgers and nachos.", "Burgers, nachos and a sunset drink", ["poipuRound", "eatsKauai"]);
  K("f-rumfire", "RumFire Poʻipū Beach", "Sheraton Kauaʻi, Poʻipū", "south", "bars", "Bar and restaurant", 3, ["Dinner", "Drinks"], "Ocean views from every seat and a big rum list on the south shore.", "Sunset cocktails", ["poipuRound", "barsKauai"]);
  K("f-kiaweroots", "Kiawe Roots", "Poʻipū", "south", "bars", "Restaurant and bar", 2, ["Lunch", "Dinner", "Drinks"], "A top happy hour pick, with half-off signature cocktails and popular kalua pork sliders.", "Kalua pork sliders", ["barsKauai"]);
  K("f-muchoaloha", "Mucho Aloha Brewhouse", "Kōloa", "south", "bars", "Brewhouse", 2, ["Dinner", "Drinks"], "A Kōloa brewhouse with a weekday happy hour and live music some nights.", "Local beer flight", ["barsKauai"]);
  K("f-dacrack", "Da Crack", "Kukuiʻula / Kōloa", "south", "trucks", "Mexican", 1, ["Lunch", "Dinner"], "Burritos and fish tacos that one travel guide names the best Mexican food on Kauaʻi.", "Fish burrito", ["poipuRound", "eatsKauai"], { place: { type: "trucks", region: KAUAI.south, star: true, rank: 1 } });
  K("f-bigmonster", "Big Monster Sushi", "Kōloa", "south", "trucks", "Sushi truck", 2, ["Lunch", "Dinner"], "A sushi food truck praised for rolls, sushi burritos and salmon poke bowls.", "Sushi burrito", ["trucksKauai"]);
  K("f-kickshaws", "Kickshaws", "Kōloa", "south", "trucks", "Food truck", 2, ["Lunch", "Dinner"], "Chef Seth Peterson's truck for classic burgers and locally caught fish sandwiches.", "Fish sandwich", ["trucksKauai"]);
  K("f-littlefish", "Little Fish Coffee", "Poʻipū", "south", "coffee", "Coffee and açaí", 1, ["Breakfast", "Snack"], "Açaí bowls and fair-trade coffee close to the beach.", "Açaí bowl", ["breakfastKauai"]);
  K("f-anuenue", "Ānuenue Café", "Poʻipū", "south", "coffee", "Breakfast cafe", 2, ["Breakfast", "Lunch"], "A cozy family-run breakfast spot with island-inspired favorites.", "Island breakfast plate", ["breakfastKauai"]);
  // North shore
  K("f-avalon", "Avalon Gastropub", "Kīlauea", "north", "special", "Gastropub", 3, ["Dinner"], "One of the north shore's best-rated dinners on OpenTable; one diner called it the best restaurant on Kauaʻi.", "Seasonal plates", ["northRound"], { place: { type: "special", region: KAUAI.north, star: true, rank: 0 } });
  K("f-welina", "Welina Terrace", "1 Hotel Hanalei Bay, Princeville", "north", "special", "Resort restaurant", 4, ["Breakfast", "Dinner"], "Oceanfront terrace dining overlooking Hanalei Bay.", "Sunset dinner", ["northRound"]);
  K("f-1kitchen", "1 Kitchen", "1 Hotel Hanalei Bay, Princeville", "north", "special", "Resort restaurant", 4, ["Dinner"], "A highly rated, romantic restaurant with Hanalei Bay views.", "Farm and sea dishes", ["northRound"]);
  K("f-dolphin", "Dolphin Restaurant & Fish Market", "Hanalei", "north", "seafood", "Fish market and restaurant", 3, ["Lunch", "Dinner"], "Fresh catch, a fish market and a sushi lounge on the Hanalei River.", "Fresh catch", ["northRound"]);
  K("f-hanaleipoke", "Hanalei Poke", "Hanalei", "north", "seafood", "Poke", 2, ["Lunch"], "A popular quick lunch in Hanalei town, featured on Diners, Drive-Ins and Dives.", "Poke bowl", ["northRound"]);
  K("f-wakeupdelicious", "Wake Up Delicious", "Hanalei", "north", "local", "Walk-up window", 1, ["Breakfast", "Lunch"], "A tiny walk-up that one reviewer calls the best chicken katsu plate around.", "Chicken katsu plate", ["northRound"]);
  K("f-ama", "AMA", "Hanalei", "north", "local", "Ramen bar", 2, ["Dinner"], "Ramen, steamed buns and good cocktails in Hanalei; works for couples and families.", "Ramen and bao", ["northRound"]);
  K("f-hanaleibread", "Hanalei Bread Company", "Hanalei", "north", "coffee", "Bakery cafe", 2, ["Breakfast", "Lunch"], "Named the best all-round breakfast on the north shore, with fresh-baked goods and specialty coffee.", "Breakfast sandwich and pastry", ["breakfastKauai"], { place: { type: "coffee", region: KAUAI.north, star: true, rank: 2 } });
  K("f-hideaways", "Hideaways Pizza Pub", "Princeville", "north", "bars", "Pizza pub", 2, ["Lunch", "Dinner", "Drinks"], "Pizza and drinks with views toward Hanalei Bay.", "Pizza and a beer", ["northRound"]);
  // West side
  K("f-kalaheocafe", "Kalāheo Café & Coffee Co.", "Kalāheo", "west", "coffee", "Cafe", 2, ["Breakfast", "Lunch", "Dinner"], "The west side's most recommended cafe: big breakfasts, good coffee and vegan options. Closes early in the evening.", "Cinnamon bread French toast", ["westRound", "breakfastKauai"], { place: { type: "coffee", region: KAUAI.west, star: true, rank: 1 } });
  K("f-brickoven", "Brick Oven Pizza", "Kalāheo", "west", "bars", "Pizza", 2, ["Lunch", "Dinner"], "A low-key family pizza place; closed Mondays.", "Brick-oven pizza", ["westRound"]);
  K("f-bobbies", "Bobbie's", "Hanapēpē", "west", "local", "Plate lunch", 1, ["Lunch"], "A small Hanapēpē spot with a fantastic plate lunch, saimin and chicken katsu. Cash only.", "Chicken katsu plate", ["westRound", "plateKauai"], { place: { type: "local", region: KAUAI.west, star: true, rank: 1 } });
  K("f-daimu", "da Imu Hut", "Hanapēpē", "west", "hawaiian", "Hawaiian plates", 1, ["Lunch"], "Teriyaki pork and kalua pig plates; take them to go and watch the sunset at Salt Pond.", "Kalua pig plate", ["plateKauai"]);
  K("f-hanapepecafe", "Hanapēpē Café & Espresso", "Hanapēpē", "west", "coffee", "Cafe", 2, ["Breakfast", "Lunch", "Dinner"], "A cafe in historic Hanapēpē, recommended for dinner or dessert on Friday art night.", "Espresso and dessert", ["westRound"]);
  K("f-lapperts", "Lappert's Hawaii", "Hanapēpē", "west", "sweets", "Ice cream", 1, ["Snack"], "Ice cream made locally in small batches, born in Hanapēpē.", "Kauaʻi Pie ice cream", ["westRound"]);
  K("f-shrimpstation", "Shrimp Station", "Waimea", "west", "seafood", "Shrimp plates", 2, ["Lunch"], "Garlic shrimp and coconut shrimp plates; a natural stop after Waimea Canyon.", "Garlic shrimp plate", ["westRound"]);
  K("f-islandtaco", "Island Taco", "Waimea", "west", "trucks", "Tacos", 1, ["Lunch", "Dinner"], "Fish tacos in Waimea town, recommended for a post-canyon lunch.", "Fish tacos", ["westRound"]);
  K("f-kibc", "Kauaʻi Island Brewing Co.", "ʻEleʻele / Port Allen", "west", "bars", "Brewery and grill", 2, ["Lunch", "Dinner", "Drinks"], "The most-mentioned Kauaʻi brewery: pinball, sunset views and a daily happy hour.", "Beer flight at happy hour", ["barsKauai", "westRound"]);
})();

/* Extra mentions for places already listed */
["f-marksplace", "f-ponomarket"].forEach((id) => { const p = HWP.foodAdded.find((x) => x.id === id); if (p && !p.sources.includes("plateKauai")) p.sources.push("plateKauai"); });
