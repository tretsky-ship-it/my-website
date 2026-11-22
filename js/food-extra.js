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

HWP.photos = {
  "loco-moco": { src: "images/food/loco-moco.jpg", alt: "Loco moco: rice topped with a hamburger patty, brown gravy and a fried egg", author: "Ocdp", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Loco_moco_001.jpg" },
  "ahi-poke": { src: "images/food/ahi-poke.jpg", alt: "Ahi poke: cubes of raw tuna with onion and seaweed", author: "Janine from Mililani, Hawaii", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Ahi_poke_(poh-kay).jpg" },
  "plate-lunch": { src: "images/food/plate-lunch.jpg", alt: "Plate lunch with rice, poke, laulau and lomi salmon in a takeout box", author: "christian razukas", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", page: "https://commons.wikimedia.org/wiki/File:Wardsplatelunch.jpg" },
  "laulau": { src: "images/food/laulau.jpg", alt: "Laulau wrapped in leaves, served with fried rice and salad", author: "Neeta Lind", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Laulau.jpg" },
  "saimin": { src: "images/food/saimin.jpg", alt: "A bowl of saimin with noodles, sliced ham, green onion and kamaboko", author: "Honolulu Noodz", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:Classic_Saimin.jpg" },
  "garlic-shrimp": { src: "images/food/garlic-shrimp-giovannis.jpg", alt: "Spicy shrimp with rice and lemon from Giovanni's shrimp truck", author: "Daniel Ramirez", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Spicy_Shrimp_from_Giovanni%27s_shrimp_truck_(16774638669).jpg", at: "f-giovannis" },
  "spam-musubi": { src: "images/food/spam-musubi.jpg", alt: "Spam musubi: grilled Spam on rice wrapped with nori", author: "Ocdp", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Spam_musubi_001.jpg" },
  "poi": { src: "images/food/poi.jpg", alt: "A bowl of purple-grey poi with a spoon", author: "Bshams", license: "Public domain", licenseUrl: "", page: "https://commons.wikimedia.org/wiki/File:Bowl_of_poi.jpg" },
  "haupia": { src: "images/food/haupia.jpg", alt: "Squares of white haupia coconut pudding on a plate", author: "Arnold Gatilao", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Haupia.jpg" },
};

/* Signature dishes and where to try them (place ids). */
HWP.dishes = [
  { id: "loco-moco", name: "Loco moco", what: "Rice, a hamburger patty, a fried egg and brown gravy. Born in Hilo.", photo: "loco-moco", places: ["f-cafe100", "f-rainbow", "f-kens"] },
  { id: "poke", name: "Poke", what: "Cubed raw fish, usually ahi, seasoned with shoyu, limu, onion or chili.", photo: "ahi-poke", places: ["f-onoseafood", "f-dapoke", "f-southmauifish", "f-koloafish"] },
  { id: "plate-lunch", name: "Plate lunch", what: "Two scoops rice, mac salad and a main: the islands' everyday lunch.", photo: "plate-lunch", places: ["f-rainbow", "f-tinroof", "f-alohamixed", "f-marksplace"] },
  { id: "saimin", name: "Saimin", what: "Noodle soup in a light dashi broth; Maui's dry mein serves the broth on the side.", photo: "saimin", places: ["f-hamura", "f-samsato", "f-shiges"] },
  { id: "laulau", name: "Laulau", what: "Pork and butterfish wrapped in lūʻau leaves and steamed until tender.", photo: "laulau", places: ["f-helenas", "f-highwayinn", "f-superjs"] },
  { id: "garlic-shrimp", name: "Garlic shrimp", what: "Kahuku's buttery, garlicky shrimp over rice, eaten at a truck.", photo: "garlic-shrimp", places: ["f-giovannis"] },
  { id: "spam-musubi", name: "Spam musubi", what: "Grilled Spam on rice wrapped in nori. Sold at nearly every market and convenience store.", photo: "spam-musubi", places: [] },
  { id: "poi", name: "Poi", what: "Pounded taro, a Hawaiian staple. Try it fresh alongside kalua pig.", photo: "poi", places: ["f-helenas", "f-highwayinn"] },
  { id: "haupia", name: "Haupia", what: "Coconut pudding, served in squares or in chocolate haupia pie.", photo: "haupia", places: ["f-helenas", "f-leodas"] },
];
