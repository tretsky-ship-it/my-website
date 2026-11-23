/* Oʻahu, Maui, Hawaiʻi Island and Lānaʻi food listings, added 2026-11-23.
   Each place is a readers' choice in one of these polls (read in full on 2026-11-23):
   - HAWAIʻI Magazine 2026 Readers' Choice Awards (Oʻahu, Maui, Hawaiʻi Island, Lānaʻi, All Islands)
   - HONOLULU Magazine 2026 Hale ʻAina Awards
   Areas come from those pages, the restaurants' own listings or well-known locations.
   Hours are not listed here: check before you go. */
(function () {
  Object.assign(HWP.foodSources, {
    hm2026oahu: { label: "HAWAIʻI Magazine 2026 Readers' Choice: Oʻahu", url: "https://www.hawaiimagazine.com/2026-readers-choice-awards-oahu/" },
    hm2026big: { label: "HAWAIʻI Magazine 2026 Readers' Choice: Hawaiʻi Island", url: "https://www.hawaiimagazine.com/2026-readers-choice-hawaii-island/" },
    hm2026lanai: { label: "HAWAIʻI Magazine 2026 Readers' Choice: Molokaʻi and Lānaʻi", url: "https://www.hawaiimagazine.com/2026-readers-choice-awards-molokai-and-lanai/" },
    haleAina2026: { label: "HONOLULU Magazine 2026 Hale ʻAina Awards", url: "https://www.honolulumagazine.com/hale-aina-award-winners-the-best-restaurants-in-hawaii/" },
  });
  if (!HWP.foodSources.hm2026all) HWP.foodSources.hm2026all = { label: "HAWAIʻI Magazine 2026 Readers' Choice: All Islands", url: "https://www.hawaiimagazine.com/2026-readers-choice-awards-all-islands/" };
  if (!HWP.foodSources.hm2026maui) HWP.foodSources.hm2026maui = { label: "HAWAIʻI Magazine 2026 Readers' Choice: Maui", url: "https://www.hawaiimagazine.com/2026-readers-choice-awards-maui/" };

  const SRC = { o: "hm2026oahu", m: "hm2026maui", h: "hm2026big", l: "hm2026lanai", a: "hm2026all", ha: "haleAina2026" };
  const POLL_NAME = { o: "HAWAIʻI Magazine readers (Oʻahu)", m: "HAWAIʻI Magazine readers (Maui)", h: "HAWAIʻI Magazine readers (Hawaiʻi Island)", l: "HAWAIʻI Magazine readers (Lānaʻi)", a: "HAWAIʻI Magazine readers (all islands)", ha: "Hale ʻAina Awards" };

  /* Food types used by the new listings */
  const addType = (after, t) => { if (!HWP.foodTypes.some((x) => x.id === t.id)) HWP.foodTypes.splice(HWP.foodTypes.findIndex((x) => x.id === after) + 1, 0, t); };
  addType("thai", { id: "global", label: "Japanese, Asian & world", blurb: "Sushi, ramen, dim sum, Korean, Vietnamese, Italian and more" });
  addType("global", { id: "burgers", label: "Burgers & pizza", blurb: "Local beef burgers, pizza and pub food" });

  /* Towns: [area label, region (shown as the area filter), lat, lon] */
  const T = {
    // Oʻahu
    downtown: ["Downtown Honolulu", "Honolulu", 21.309, -157.862], chinatown: ["Chinatown, Honolulu", "Honolulu", 21.312, -157.862],
    kakaako: ["Kakaʻako, Honolulu", "Honolulu", 21.296, -157.858], alamoana: ["Ala Moana, Honolulu", "Honolulu", 21.291, -157.843],
    kalihi: ["Kalihi, Honolulu", "Honolulu", 21.33, -157.875], moiliili: ["Mōʻiliʻili, Honolulu", "Honolulu", 21.293, -157.823],
    manoa: ["Mānoa, Honolulu", "Honolulu", 21.305, -157.812], kapahulu: ["Kapahulu, Honolulu", "Waikīkī", 21.279, -157.814],
    waikiki: ["Waikīkī", "Waikīkī", 21.279, -157.829], diamondhead: ["Diamond Head end of Waikīkī", "Waikīkī", 21.264, -157.818],
    kaimuki: ["Kaimukī, Honolulu", "East Honolulu", 21.278, -157.802], kahala: ["Kāhala, Honolulu", "East Honolulu", 21.272, -157.776],
    kailua: ["Kailua", "Windward side", 21.397, -157.74], kaneohe: ["Kāneʻohe", "Windward side", 21.41, -157.8], waiahole: ["Waiāhole", "Windward side", 21.48, -157.85],
    haleiwa: ["Haleʻiwa", "North Shore", 21.593, -158.103], sunset: ["Sunset Beach", "North Shore", 21.665, -158.05],
    aiea: ["ʻAiea", "Central & west side", 21.385, -157.93], pearlcity: ["Pearl City", "Central & west side", 21.392, -157.97],
    waipahu: ["Waipahu", "Central & west side", 21.386, -158.01], koolina: ["Ko Olina", "Central & west side", 21.335, -158.122],
    oahuwide: ["Many locations around Oʻahu", "Honolulu", 21.3, -157.85],
    // Maui
    kahului: ["Kahului", "Kahului", 20.889, -156.47], wailuku: ["Wailuku", "Wailuku", 20.887, -156.505], kihei: ["Kīhei", "Kīhei", 20.75, -156.455],
    wailea: ["Wailea", "Wailea & Mākena", 20.69, -156.44], maalaea: ["Māʻalaea", "Kīhei", 20.792, -156.51],
    lahaina: ["Lahaina", "West Maui", 20.876, -156.678], kaanapali: ["Kāʻanapali", "West Maui", 20.925, -156.695], honokowai: ["Honokōwai", "West Maui", 20.955, -156.69],
    napili: ["Nāpili", "West Maui", 20.995, -156.665], kapalua: ["Kapalua", "West Maui", 21.0, -156.65], kahakuloa: ["Kahakuloa (northwest Maui)", "West Maui", 21.0, -156.56],
    paia: ["Pāʻia", "Pāʻia", 20.91, -156.38], pukalani: ["Pukalani", "Upcountry", 20.837, -156.337], kula: ["Kula", "Upcountry", 20.73, -156.33],
    keanae: ["Keʻanae, Road to Hāna", "Hāna Highway", 20.86, -156.15], haiku: ["Haʻikū, Road to Hāna", "Hāna Highway", 20.91, -156.3],
    // Hawaiʻi Island
    kona: ["Kailua-Kona", "Kona", 19.64, -155.995], southkona: ["Captain Cook (South Kona)", "South Kona", 19.5, -155.92],
    waikoloa: ["Waikoloa", "Kohala Coast", 19.92, -155.88], maunalani: ["Mauna Lani", "Kohala Coast", 19.95, -155.86], hualalai: ["Hualālai (north of Kona)", "Kohala Coast", 19.83, -156.0],
    waimea: ["Waimea", "Waimea", 20.02, -155.67], honokaa: ["Honokaʻa", "Hāmākua Coast", 20.08, -155.47],
    hilo: ["Hilo", "Hilo", 19.72, -155.085], pahoa: ["Pāhoa", "Puna", 19.49, -154.95],
    // Lānaʻi
    lanaicity: ["Lānaʻi City", "Lānaʻi City", 20.827, -156.92], manele: ["Mānele", "Mānele", 20.743, -156.887],
  };
  Object.assign(T, {
    makawao: ["Makawao", "Upcountry", 20.856, -156.312], kahana: ["Kahana", "West Maui", 20.97, -156.68],
    hana: ["Hāna", "Hāna Highway", 20.758, -155.99], nahiku: ["Nāhiku, Road to Hāna", "Hāna Highway", 20.80, -156.12], koki: ["Koki Beach, Hāna", "Hāna Highway", 20.735, -155.98],
    keauhou: ["Keauhou", "Kona", 19.56, -155.96], kealakekua: ["Kealakekua & Honalo", "South Kona", 19.52, -155.92],
    volcano: ["Volcano Village", "Puna & Volcano", 19.43, -155.24], pepeekeo: ["Pepeʻekeo, north of Hilo", "Hilo", 19.84, -155.10],
  });
  T.pahoa[1] = "Puna & Volcano";
  const MAUI_T = ["kahului", "wailuku", "kihei", "wailea", "maalaea", "lahaina", "kaanapali", "honokowai", "napili", "kapalua", "kahakuloa", "paia", "pukalani", "kula", "keanae", "haiku", "makawao", "kahana", "hana", "nahiku", "koki"];
  const BIG_T = ["kona", "southkona", "waikoloa", "maunalani", "hualalai", "waimea", "honokaa", "hilo", "pahoa", "keauhou", "kealakekua", "volcano", "pepeekeo"];
  const ISLAND_OF = (town) => MAUI_T.includes(town) ? "maui" : BIG_T.includes(town) ? "hawaii" : ["lanaicity", "manele"].includes(town) ? "lanai" : "oahu";
  const jit = (id, salt) => { let h = salt; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 9973; return (h / 9973 - .5) * .008; };
  const ordinal = (n) => ["", "#1", "#2", "#3", "#4", "#5"][n] || "a finalist";
  const HA_RANK = ["", "gold", "silver", "bronze", "finalist"];
  const awardsText = (aw) => {
    const by = {};
    aw.forEach(([k, cat, n]) => { (by[k] = by[k] || []).push(k === "ha" ? `${cat} (${HA_RANK[n] || "finalist"})` : `${cat} (${ordinal(n)})`); });
    return "Voted " + Object.entries(by).map(([k, v]) => `${v.join(", ")} by ${POLL_NAME[k]}`).join("; ") + " in 2026.";
  };
  const MEALS = { B: "Breakfast", L: "Lunch", D: "Dinner", S: "Snack", X: "Drinks" };

  /* P(id, name, town, type, kind, price, meals, signature, description, awards, extra)
     awards: [[poll, category, place 1-5], ...]; a #1 finish makes it a must-try pick. */
  const P = (id, name, town, type, kind, price, meals, signature, desc, awards, extra) => {
    const [area, region, lat, lon] = T[town];
    const isl = ISLAND_OF(town);
    const sources = [...new Set(awards.map(([k]) => SRC[k]))];
    const star = awards.some(([k, , n]) => n === 1 && k !== "a") || awards.filter(([k]) => k !== "a").length >= 3;
    const best = Math.min(...awards.map(([, , n]) => n));
    HWP.foodAdded.push(Object.assign({
      id: "f-" + id, name, island: isl, area, lat: lat + jit(id, 3), lon: lon + jit(id, 11), kind, cuisine: kind, price,
      meals: meals.split("").map((c) => MEALS[c]), why: (desc ? desc + " " : "") + awardsText(awards), signature, setting: "",
      web: null, webLabel: "No official website confirmed", reservations: type === "special" ? "Reservations recommended" : "Walk-in",
      tags: [], sources, awards, place: { type, region, star, rank: best * 10 + (star ? 0 : 5) },
    }, extra || {}));
  };

  /* ───────── Oʻahu ───────── */
  P("dukes-waikiki", "Duke's Waikīkī", "waikiki", "seafood", "Beachfront restaurant and bar", 3, "BLDX", "Fresh fish, then hula pie", "Open-air restaurant right on Waikīkī Beach, named for surfer Duke Kahanamoku.", [["o", "Best Restaurant", 1], ["o", "Best Hotel Restaurant", 1], ["o", "Best Seafood", 1], ["o", "Best Bar", 1], ["o", "Best Happy Hour", 1], ["a", "Best Restaurant", 2], ["a", "Best Mai Tai", 2]], { reservations: "Reservations recommended" });
  P("roys-waikiki", "Roy's Waikīkī", "waikiki", "special", "Hawaiian fusion", 4, "LD", "Misoyaki butterfish and the chocolate soufflé", "Chef Roy Yamaguchi's Hawaiian fusion restaurant in central Waikīkī.", [["o", "Best Restaurant", 2], ["o", "Best Seafood", 3]]);
  P("pig-lady", "The Pig and The Lady", "chinatown", "global", "Vietnamese-inspired", 3, "LD", "Pho French dip", "Modern Vietnamese cooking in Chinatown.", [["o", "Best Restaurant", 3], ["a", "Best Restaurant", 5], ["ha", "Best Vietnamese", 3]]);
  P("merrimans-honolulu", "Merriman's Honolulu", "kakaako", "special", "Farm-to-table", 4, "LD", "Island fish with Hawaiʻi-grown produce", "Peter Merriman's Kakaʻako restaurant.", [["o", "Best Restaurant", 4], ["o", "Best Farm-to-Table", 2], ["ha", "Best Business Lunch", 1], ["ha", "Best Local Chain", 1]]);
  P("hys", "Hy's Steak House", "waikiki", "special", "Steak house", 4, "D", "Kiawe-broiled steak", "A clubby, old-school Waikīkī steak house.", [["o", "Best Restaurant", 5], ["o", "Best Steak House", 2], ["ha", "Best Steak", 1]]);
  P("house-without-a-key", "House Without a Key", "waikiki", "bars", "Hotel restaurant and bar", 3, "BLDX", "A sunset mai tai with hula under the kiawe tree", "Oceanfront at the Halekūlani, with live music and hula in the evening.", [["o", "Best Hotel Restaurant", 2], ["o", "Best Bar", 3], ["a", "Best Bar", 5], ["ha", "Best Ambiance", 2], ["ha", "Best Outdoor Dining", 3]]);
  P("plumeria-beach-house", "Plumeria Beach House", "kahala", "special", "Hotel restaurant", 4, "BLD", "The breakfast buffet", "Beachside at The Kāhala Hotel & Resort.", [["o", "Best Hotel Restaurant", 3], ["ha", "Best Hotel Brunch", 1], ["ha", "Best Buffet", 1]]);
  P("beachhouse-moana", "The Beachhouse at the Moana", "waikiki", "special", "Steak and seafood", 4, "BD", "Steak and seafood by the banyan tree", "At the Moana Surfrider, Waikīkī's oldest hotel.", [["o", "Best Hotel Restaurant", 4]]);
  P("morimoto-waikiki", "Morimoto Asia Waikīkī", "waikiki", "global", "Japanese and pan-Asian", 4, "BLD", "Sushi and Iron Chef Morimoto's signatures", "At the ʻAlohilani Resort.", [["o", "Best Hotel Restaurant", 5]]);
  P("monkeypod-koolina", "Monkeypod Kitchen Ko Olina", "koolina", "bars", "Farm-to-table restaurant and bar", 3, "LDX", "Mai tai with honey-lilikoʻi foam, and wood-fired pizza", "Peter Merriman's casual farm-to-table spot.", [["o", "Best Farm-to-Table", 1], ["o", "Best Happy Hour", 3], ["a", "Best Restaurant", 3], ["a", "Best Bar", 2], ["a", "Best Mai Tai", 1]], { note: "Check the official site for other Oʻahu locations." });
  P("moku-kitchen", "Moku Kitchen", "kakaako", "special", "Farm-to-table", 3, "LDX", "Wood-fired dishes and a happy hour", "", [["o", "Best Farm-to-Table", 3]]);
  P("mud-hen-water", "Mud Hen Water", "kaimuki", "special", "Local-inspired small plates", 3, "D", "Shared plates built on local ingredients", "", [["o", "Best Farm-to-Table", 4]]);
  P("fete", "Fête", "chinatown", "special", "American bistro", 3, "LD", "The burger and seasonal plates", "", [["o", "Best Farm-to-Table", 5], ["ha", "Best Business Lunch", 3]]);
  P("nicos-pier38", "Nico's Pier 38", "kalihi", "seafood", "Fish market and restaurant", 2, "BLDX", "Furikake-crusted ʻahi plate", "On the working harbor at Pier 38, next to the fish auction.", [["o", "Best Seafood", 2], ["o", "Best Plate Lunch", 3], ["ha", "Best Seafood", 2]]);
  P("haleiwa-joes", "Haleʻiwa Joe's", "haleiwa", "seafood", "Seafood restaurant", 3, "LD", "Fresh fish", "", [["o", "Best Seafood", 4]], { note: "Also has a Kāneʻohe location at Haʻikū Gardens." });
  P("53-by-the-sea", "53 By The Sea", "kakaako", "special", "Fine dining with ocean views", 4, "LD", "Seafood with a Diamond Head view", "On the Kakaʻako waterfront.", [["o", "Best Seafood", 5], ["ha", "Most Romantic", 1], ["ha", "Best Seafood", 3]]);
  P("waiahole-poi", "Waiāhole Poi Factory", "waiahole", "hawaiian", "Hawaiian food", 2, "L", "Kalua pig plate with fresh poi, then the sweet lady of Waiāhole", "In a historic country store on the windward side.", [["o", "Best Traditional Hawaiian", 2], ["ha", "Best Hawaiian", 3]]);
  P("yamas", "Yama's Fish Market", "moiliili", "hawaiian", "Hawaiian plates and poke", 2, "L", "Laulau plate", "", [["o", "Best Traditional Hawaiian", 4]]);
  P("youngs", "Young's Fish Market", "kalihi", "hawaiian", "Hawaiian plates", 2, "L", "Laulau and squid lūʻau", "", [["o", "Best Traditional Hawaiian", 5], ["ha", "Best Hawaiian", 4]]);
  P("ll-oahu", "L&L Hawaiian Barbecue", "oahuwide", "local", "Plate lunch chain", 1, "LD", "Chicken katsu or BBQ mix plate", "Hawaiʻi's plate lunch chain, with locations across the islands.", [["o", "Best Plate Lunch", 2], ["o", "Best Cheap Eats", 2], ["h", "Best Cheap Eats", 1], ["ha", "Best Local Chain", 4]]);
  P("konos", "Kono's", "haleiwa", "local", "Breakfast and plate lunch", 1, "BL", "12-hour kalua pig 'bomber' burrito", "", [["o", "Best Plate Lunch", 4]]);
  P("alicias", "Alicia's Market", "kalihi", "local", "Market with poke and plates", 1, "L", "Poke and roast pork", "", [["o", "Best Plate Lunch", 5]]);
  P("foodland", "Foodland (poke counter)", "oahuwide", "seafood", "Supermarket poke counter", 1, "LS", "A poke bowl from the counter", "Locals' go-to for poke; most stores have a full poke counter.", [["o", "Best Poke", 1], ["m", "Best Poke", 2]]);
  P("tamuras-oahu", "Tamura's (poke counter)", "kaimuki", "seafood", "Poke counter", 1, "LS", "Poke by the pound", "", [["o", "Best Poke", 3]]);
  P("taniokas", "Tanioka's Seafoods & Catering", "waipahu", "seafood", "Poke and deli", 1, "LS", "Poke and musubi", "", [["o", "Best Poke", 4], ["ha", "Best Restaurant That Caters", 4]]);
  P("fresh-catch", "Fresh Catch", "kapahulu", "seafood", "Poke counter", 1, "LS", "Poke bowl", "", [["o", "Best Poke", 5]]);
  P("island-vintage-shave", "Island Vintage Shave Ice", "waikiki", "shaveice", "Shave ice", 1, "S", "Shave ice with fresh-fruit syrups", "At the Royal Hawaiian Center.", [["o", "Best Shave Ice", 2]]);
  P("waiola", "Waiola Shave Ice", "moiliili", "shaveice", "Shave ice", 1, "S", "Shave ice with azuki beans and mochi", "", [["o", "Best Shave Ice", 3]]);
  P("island-snow", "Island Snow", "kailua", "shaveice", "Shave ice", 1, "S", "Shave ice after Kailua Beach", "", [["o", "Best Shave Ice", 4]]);
  P("marukame", "Marukame Udon", "waikiki", "global", "Udon counter", 1, "BLD", "Fresh-cut udon with tempura", "Expect a line out the door; it moves fast.", [["o", "Best Noodle", 1], ["o", "Best Cheap Eats", 5]]);
  P("ramen-bario", "Ramen Bario", "waikiki", "global", "Ramen shop", 2, "LD", "Jirō-style ramen", "", [["o", "Best Noodle", 2]]);
  P("shiros", "Shiro's Saimin Haven", "aiea", "local", "Saimin shop", 1, "BLD", "Saimin", "", [["o", "Best Noodle", 3]]);
  P("palace-saimin", "Palace Saimin", "kalihi", "local", "Saimin shop", 1, "LD", "Saimin and BBQ sticks", "", [["o", "Best Noodle", 5]]);
  P("giovanni-pastrami", "Giovanni Pastrami", "waikiki", "burgers", "Deli and pizza", 2, "LDX", "New York-style pizza and pastrami", "", [["o", "Best Pizza", 1]]);
  P("jdolans", "J. Dolan's", "chinatown", "burgers", "Pub and pizza", 2, "LDX", "Pizza and a pint", "", [["o", "Best Pizza", 5]]);
  P("cheeseburger-paradise", "Cheeseburger in Paradise", "waikiki", "burgers", "Burger restaurant", 2, "BLD", "Cheeseburger", "", [["o", "Best Burger", 1]]);
  P("teddys", "Teddy's Bigger Burgers", "kapahulu", "burgers", "Burger restaurant", 2, "LD", "Burger and shake", "A Hawaiʻi burger chain; the original is on Kapahulu Ave.", [["o", "Best Burger", 2], ["m", "Best Burger", 3]]);
  P("kua-aina", "Kua ʻĀina Burger", "haleiwa", "burgers", "Burger restaurant", 2, "LD", "Avocado or pineapple burger", "", [["o", "Best Burger", 4]]);
  P("ruths-waikiki", "Ruth's Chris Steak House Waikīkī", "waikiki", "special", "Steak house", 4, "D", "Steak", "", [["o", "Best Steak House", 1], ["ha", "Best Steak", 4]]);
  P("wolfgangs-waikiki", "Wolfgang's Steakhouse Waikīkī", "waikiki", "special", "Steak house", 4, "LD", "Porterhouse for two", "At the Royal Hawaiian Center.", [["o", "Best Steak House", 3]]);
  P("signature-prime", "The Signature Prime Steak & Seafood", "alamoana", "special", "Steak house with a view", 4, "D", "Steak with a city view", "On the top floor of the Ala Moana Hotel.", [["o", "Best Steak House", 5], ["ha", "Best Steak", 3]]);
  P("eggs-n-things", "Eggs 'n Things", "waikiki", "coffee", "Breakfast restaurant", 2, "BL", "Pancakes with whipped cream and coconut syrup", "", [["o", "Best Breakfast", 1], ["ha", "Best Breakfast", 3]]);
  P("koko-head-cafe", "Koko Head Café", "kaimuki", "coffee", "Brunch restaurant", 2, "BL", "Cornflake French toast and kimchi bacon fried rice", "", [["o", "Best Breakfast", 3], ["a", "Best Loco Moco", 3]]);
  P("cinnamons", "Cinnamon's Restaurant", "kailua", "coffee", "Breakfast restaurant", 2, "BL", "Red velvet pancakes", "", [["o", "Best Breakfast", 4]]);
  P("waioli", "Waiʻoli Kitchen & Bake Shop", "manoa", "coffee", "Bakery cafe", 2, "BL", "Breakfast and pastries in a garden setting", "", [["o", "Best Breakfast", 5]]);
  P("cafe-kaila", "Café Kaila", "kapahulu", "coffee", "Breakfast cafe", 2, "BL", "Pancakes and waffles piled with fruit", "In Market City Shopping Center.", [["ha", "Best Breakfast", 1], ["ha", "Best Brunch", 1], ["ha", "Best Service", 2]]);
  P("over-easy", "Over Easy", "kailua", "coffee", "Breakfast restaurant", 2, "BL", "Breakfast plates", "", [["ha", "Best Breakfast", 2], ["ha", "Best Brunch", 3]]);
  P("tango", "Tangö Contemporary Café", "kakaako", "coffee", "Brunch cafe", 2, "BLD", "Brunch", "", [["ha", "Best Brunch", 2], ["ha", "Best Breakfast", 4]]);
  P("halekulani-bakery", "Halekūlani Bakery", "waikiki", "sweets", "Bakery", 2, "BS", "Pastries and coffee", "", [["o", "Best Bakery", 3]]);
  P("kamehameha-bakery", "Kamehameha Bakery", "kalihi", "sweets", "Bakery", 1, "BS", "Poi glazed donut", "", [["o", "Best Bakery", 4]]);
  P("teds-bakery", "Ted's Bakery", "sunset", "sweets", "Bakery and plate lunch", 1, "BLS", "Chocolate haupia pie", "", [["o", "Best Bakery", 5]]);
  P("pipeline-bake", "Pipeline Bake Shop & Creamery", "kaimuki", "sweets", "Bakery", 1, "S", "Malasadas", "", [["a", "Best Malasada", 5]]);
  P("island-vintage-coffee", "Island Vintage Coffee", "waikiki", "coffee", "Coffee and açaí", 2, "BS", "Kona coffee and an açaí bowl", "", [["o", "Best Coffee Shop", 1]]);
  P("kona-coffee-purveyors", "Kona Coffee Purveyors", "waikiki", "coffee", "Coffee shop", 2, "BS", "Kona coffee and a kouign-amann", "At the International Market Place.", [["o", "Best Coffee Shop", 2]]);
  P("kai-coffee", "Kai Coffee Hawaiʻi", "waikiki", "coffee", "Coffee shop", 2, "BS", "Island coffee", "", [["o", "Best Coffee Shop", 4]]);
  P("sunrise-shack", "Sunrise Shack", "sunset", "coffee", "Coffee and açaí", 2, "BS", "Açaí bowl", "", [["o", "Best Coffee Shop", 5]]);
  P("rumfire-waikiki", "RumFire Waikīkī", "waikiki", "bars", "Oceanfront bar", 3, "DX", "Cocktails by the fire pits", "At the Sheraton Waikīkī.", [["o", "Best Bar", 4]]);
  P("aloha-beer", "Aloha Beer Co.", "kakaako", "bars", "Brewpub", 2, "LDX", "House beer and pub food", "", [["o", "Best Bar", 5], ["ha", "Best Brew Pub", 1]]);
  P("maui-brewing-waikiki", "Maui Brewing Co. Waikīkī", "waikiki", "bars", "Brewpub", 2, "LDX", "Local beer and pub food", "", [["o", "Best Bar", 2], ["o", "Best Happy Hour", 5]]);
  P("tikis", "Tiki's Grill & Bar", "waikiki", "bars", "Bar and grill", 2, "LDX", "Happy hour with an ocean view", "", [["o", "Best Happy Hour", 4]]);
  P("zippys", "Zippy's", "oahuwide", "local", "Local diner chain", 1, "BLD", "Chili, loco moco and a Zip Pac", "Hawaiʻi's best-known diner chain, open long hours.", [["o", "Best Cheap Eats", 1], ["a", "Best Loco Moco", 1], ["ha", "Best Local Chain", 2]]);
  P("giovedi", "Giovedì", "chinatown", "global", "Italian-Asian", 3, "D", "Italian with Asian touches", "", [["ha", "Best Oʻahu Restaurant", 1]]);
  P("arancino-kahala", "Arancino at The Kāhala", "kahala", "global", "Italian", 4, "BLD", "Pasta and a deep wine list", "", [["ha", "Best Oʻahu Restaurant", 2], ["ha", "Best Wine Program", 1], ["ha", "Best Italian", 1], ["ha", "Best Dessert", 4]]);
  P("kapa-hale", "Kapa Hale", "kahala", "special", "Local-inspired restaurant", 3, "LD", "Local-inspired plates", "", [["ha", "Best Oʻahu Restaurant", 3], ["ha", "Best Business Lunch", 2], ["ha", "Best Service", 4]]);
  P("yohei-sushi", "Yohei Sushi", "kalihi", "global", "Sushi restaurant", 4, "LD", "Omakase sushi", "", [["ha", "Best Sushi", 1], ["ha", "Best Overall Japanese", 1], ["ha", "Best Oʻahu Restaurant", 4]]);
  P("chao", "Chao Hawaiʻi", "downtown", "global", "Modern Vietnamese", 3, "LD", "Playful Vietnamese plates", "On Nuʻuanu Avenue, next to Chinatown.", [["ha", "Best New Restaurant", 1], ["ha", "Best Vietnamese", 1]]);
  P("anna-millers", "Anna Miller's", "pearlcity", "local", "Old-school diner", 2, "BLD", "Pie", "A 1970s-era diner famous for its pies.", [["ha", "Old-School Restaurant We Love", 1]]);
  P("orchids", "Orchids", "waikiki", "special", "Hotel restaurant", 4, "BLD", "Sunday brunch", "At the Halekūlani, facing Diamond Head.", [["ha", "Best Hotel Brunch", 2], ["ha", "Best Buffet", 2]]);
  P("hau-tree", "Hau Tree", "diamondhead", "special", "Beachfront restaurant", 3, "BLD", "Breakfast under the hau tree", "At the Kaimana Beach Hotel.", [["ha", "Best Outdoor Dining", 1], ["ha", "Best Hotel Brunch", 3], ["ha", "Most Romantic", 3]]);
  P("100-sails", "100 Sails Restaurant & Bar", "waikiki", "special", "Hotel restaurant", 4, "BDX", "Buffet with harbor views", "At the Prince Waikīkī.", [["ha", "Best Buffet", 3], ["ha", "Best Hotel Brunch", 4]]);
  P("bar-leather-apron", "Bar Leather Apron", "downtown", "bars", "Cocktail bar", 3, "X", "Craft cocktails", "", [["ha", "Best Cocktail Program", 2]]);
  P("side-street-inn", "Side Street Inn", "kapahulu", "bars", "Local bar food", 2, "DX", "Pork chops and fried rice", "", [["ha", "Best Bar Food", 3]]);
  P("la-mer", "La Mer", "waikiki", "special", "French fine dining", 4, "D", "Tasting menu", "At the Halekūlani.", [["ha", "Most Romantic", 2]]);
  P("michels", "Michel's at the Colony Surf", "diamondhead", "special", "French fine dining", 4, "D", "Oceanfront dinner", "", [["ha", "Most Romantic", 3]]);
  P("mw-restaurant", "MW Restaurant", "alamoana", "special", "Local-inspired fine dining", 4, "LD", "Dessert", "", [["ha", "Best Dessert", 1]]);
  P("pai", "Pai Honolulu", "downtown", "special", "Contemporary", 4, "D", "Tasting menu", "", [["ha", "Best Dessert", 2], ["ha", "Best Wine Program", 3], ["ha", "Best Service", 3], ["ha", "Best Vegetarian", 3]]);
  P("azure", "Azure Restaurant", "waikiki", "seafood", "Seafood fine dining", 4, "D", "Local fish", "At The Royal Hawaiian.", [["ha", "Best Seafood", 1]]);
  P("da-seafood-cartel", "Da Seafood Cartel", "aiea", "seafood", "Mexican seafood", 2, "LD", "Aguachile and seafood tacos", "Started in ʻAiea.", [["ha", "Best Mexican", 1], ["ha", "Best Seafood", 4]], { note: "There is also a Haleʻiwa location." });
  P("peace-cafe", "Peace Café", "moiliili", "global", "Vegan cafe", 1, "LD", "Vegan plate lunch", "An all-vegan cafe.", [["ha", "Best Vegetarian", 1]], { cuisine: "Vegan" });
  P("jade-dynasty", "Jade Dynasty Seafood Restaurant", "alamoana", "global", "Chinese and dim sum", 2, "LD", "Dim sum", "In Ala Moana Center.", [["ha", "Best Dim Sum", 1], ["ha", "Best Chinese", 1]], { cuisine: "Chinese" });
  P("tim-ho-wan", "Tim Ho Wan", "waikiki", "global", "Chinese dim sum", 2, "LD", "Baked BBQ pork buns", "", [["ha", "Best Dim Sum", 2], ["ha", "Best Chinese", 2]], { cuisine: "Chinese" });
  P("tonkatsu-tamafuji", "Tonkatsu Tamafuji", "kapahulu", "global", "Japanese tonkatsu", 2, "D", "Pork katsu", "", [["ha", "Best Tonkatsu", 1]]);
  P("goma-tei", "Goma Tei Ramen", "alamoana", "global", "Japanese ramen", 2, "LD", "Tantan ramen", "", [["ha", "Best Ramen", 2]]);
  P("yanagi-sushi", "Yanagi Sushi", "alamoana", "global", "Japanese sushi", 3, "LD", "Sushi, open late", "", [["ha", "Best Sushi", 3], ["ha", "Best Late-Night Eats", 4]]);
  P("taormina", "Taormina Sicilian Cuisine", "waikiki", "global", "Italian", 3, "LD", "Sicilian pasta", "", [["ha", "Best Italian", 2]]);
  P("istanbul", "Istanbul Hawaiʻi", "kakaako", "global", "Mediterranean", 3, "LD", "Turkish mezze", "", [["ha", "Best Mediterranean", 1]], { cuisine: "Mediterranean" });
  P("olive-tree", "Olive Tree Café", "kahala", "global", "Mediterranean", 1, "LD", "Souvlaki and falafel", "", [["ha", "Best Mediterranean", 2]], { cuisine: "Mediterranean, Greek" });
  P("noi-thai", "Noi Thai Cuisine", "waikiki", "thai", "Thai restaurant", 3, "LD", "Thai curries", "", [["ha", "Best Thai", 2]], { cuisine: "Thai" });
  P("buzzs", "Buzz's Original Steak House", "kailua", "special", "Steak house", 3, "LDX", "Steak near Kailua Beach", "", [["ha", "Best Outdoor Dining", 2]]);

  /* ───────── Maui ───────── */
  P("gather", "Gather on Maui", "wailea", "special", "Restaurant on the golf course", 3, "BLD", "Island dinner with ocean views", "At the Wailea golf courses.", [["m", "Best Restaurant", 5]]);
  P("koast", "Koast", "wailea", "special", "Family-style shared plates", 4, "D", "Kampachi collar", "From chef Chris Cosentino; opened January 2025.", [["a", "Best New Restaurant", 1]], { note: "Dinner only; closed Sundays when last reported." });
  P("monkeypod-maui", "Monkeypod Kitchen Wailea", "wailea", "bars", "Farm-to-table restaurant and bar", 3, "LDX", "Mai tai with honey-lilikoʻi foam, and wood-fired pizza", "", [["m", "Best Restaurant", 2], ["m", "Best Pizza", 1], ["m", "Best Bar", 2], ["m", "Best Happy Hour", 2], ["ha", "Best Maui Restaurant", 4]], { note: "There is also a Kāʻanapali location." });
  P("hula-grill", "Hula Grill Kāʻanapali", "kaanapali", "seafood", "Beachfront restaurant and bar", 3, "LDX", "Fresh fish, burger at the Barefoot Bar", "At Whalers Village.", [["m", "Best Restaurant", 3], ["m", "Best Seafood", 3], ["m", "Best Burger", 1], ["m", "Best Bar", 4]]);
  P("merrimans-kapalua", "Merriman's Kapalua", "kapalua", "special", "Farm-to-table", 4, "D", "Sunset dinner on the point", "", [["m", "Best Restaurant", 4], ["m", "Best Farm-to-Table", 3], ["ha", "Best Maui Restaurant", 3]]);
  P("mala", "Māla Ocean Tavern", "lahaina", "special", "Oceanfront restaurant", 3, "LDX", "Seafood on the water", "Survived the 2023 Lahaina fire and reopened.", [["ha", "Best Maui Restaurant", 1]]);
  P("dukes-maui", "Duke's Beach House", "kaanapali", "seafood", "Beachfront restaurant", 3, "BLDX", "Breakfast on the beach", "At Honua Kai Resort.", [["m", "Best Hotel Restaurant", 1], ["m", "Best Breakfast", 2]]);
  P("humuhumu", "Humuhumunukunukuāpuaʻa", "wailea", "special", "Hotel restaurant", 4, "D", "Seafood over a saltwater lagoon", "At the Grand Wailea.", [["m", "Best Hotel Restaurant", 2]]);
  P("nicks", "Nick's Fishmarket", "wailea", "special", "Seafood fine dining", 4, "D", "Fresh fish", "At the Fairmont Kea Lani.", [["m", "Best Hotel Restaurant", 3], ["m", "Best Seafood", 4]]);
  P("banyan-tree", "The Banyan Tree", "kapalua", "special", "Hotel restaurant", 4, "D", "Farm-to-table dinner", "At The Ritz-Carlton Maui, Kapalua.", [["m", "Best Hotel Restaurant", 4], ["m", "Best Farm-to-Table", 4]]);
  P("restaurant-hotel-wailea", "The Restaurant at Hotel Wailea", "wailea", "special", "Fine dining", 4, "D", "Tasting menu", "", [["m", "Best Hotel Restaurant", 5]]);
  P("lineage", "Lineage", "wailea", "special", "Modern local", 4, "D", "Modern takes on local food", "At The Shops at Wailea.", [["m", "Best Farm-to-Table", 5]]);
  P("paia-fish-market", "Pāʻia Fish Market", "paia", "seafood", "Fish restaurant", 2, "LD", "Fish burger or fish plate", "", [["m", "Best Seafood", 2]]);
  P("seascape", "Seascape Māʻalaea Restaurant", "maalaea", "seafood", "Seafood restaurant", 3, "L", "Seafood lunch", "At the Maui Ocean Center.", [["m", "Best Seafood", 5]]);
  P("kaleis", "Kalei's Lunchbox", "kahului", "local", "Plate lunch", 1, "BL", "Plate lunch", "", [["m", "Best Plate Lunch", 4], ["m", "Best Cheap Eats", 3]], { note: "Confirm the address before you go." });
  P("tikehau", "Tikehau Lounge", "kihei", "bars", "Lounge with poke", 2, "DX", "Poke and cocktails", "", [["m", "Best Poke", 1], ["m", "Best Bar", 1], ["m", "Best Happy Hour", 1], ["a", "Best Bar", 4]]);
  P("fish-market-maui", "Fish Market Maui", "honokowai", "seafood", "Fish market", 2, "LS", "Poke and fish tacos", "", [["m", "Best Poke", 4]]);
  P("tamuras-maui", "Tamura's Market", "kahului", "seafood", "Market poke counter", 1, "LS", "Poke by the pound", "", [["m", "Best Poke", 5]]);
  P("aunty-sandys", "Aunty Sandy's Banana Bread", "keanae", "sweets", "Banana bread stand", 1, "S", "Fresh banana bread", "A classic stop on the Road to Hāna.", [["m", "Best Banana Bread", 1]]);
  P("halfway-to-hana", "Halfway to Hāna", "keanae", "sweets", "Snack stand", 1, "S", "Banana bread and shave ice", "", [["m", "Best Banana Bread", 2], ["m", "Best Shave Ice", 2]]);
  P("julias", "Julia's Best Banana Bread", "kahakuloa", "sweets", "Banana bread stand", 1, "S", "Coconut-candy banana bread", "On the narrow road around northwest Maui.", [["m", "Best Banana Bread", 5]]);
  P("star-noodle", "Star Noodle", "lahaina", "global", "Asian noodle house", 2, "LD", "Garlic noodles and steamed pork buns", "Reopened in 2024 on Front Street, one door from its old spot.", [["m", "Best Noodle", 1]]);
  P("pizza-madness", "Pizza Madness Maui", "kihei", "burgers", "Pizza", 2, "LD", "Pizza", "", [["m", "Best Pizza", 2]]);
  P("flatbread", "Flatbread Company", "paia", "burgers", "Wood-fired pizza", 2, "LD", "Wood-fired flatbread", "", [["m", "Best Pizza", 3]]);
  P("marlow", "Marlow", "pukalani", "burgers", "Pizza and small plates", 3, "D", "Wood-fired pizza", "", [["m", "Best Pizza", 4]]);
  P("dollies", "Dollie's Pub & Café", "kaanapali", "burgers", "Pub and pizza", 2, "LDX", "Pizza and a beer", "", [["m", "Best Pizza", 5]]);
  P("cool-cat", "Cool Cat Café", "kihei", "burgers", "Burger diner", 2, "LD", "Burgers", "Moved to Kīhei after the Lahaina fire.", [["m", "Best Burger", 2], ["m", "Best Cheap Eats", 1]], { note: "A Cool Cat Express also runs at Whalers Village, Kāʻanapali." });
  P("roys-kaanapali", "Roy's Kāʻanapali", "kaanapali", "special", "Hawaiian fusion", 4, "LDX", "Misoyaki butterfish", "At the Kāʻanapali Golf Courses.", [["m", "Best Steak House", 1], ["m", "Best Happy Hour", 4]]);
  P("ruths-maui", "Ruth's Chris Steak House Wailea", "wailea", "special", "Steak house", 4, "D", "Steak", "", [["m", "Best Steak House", 2]]);
  P("duo", "DUO Steak and Seafood", "wailea", "special", "Steak and seafood", 4, "BD", "Steak and seafood", "At the Four Seasons Maui at Wailea.", [["m", "Best Steak House", 4]]);
  P("thai-mee-up", "Thai Mee Up", "kahului", "thai", "Thai food truck", 1, "LD", "Pad Thai", "", [["m", "Best Food Truck", 1]], { cuisine: "Thai" });
  P("kinaole-grill", "Kinaʻole Grill Food Truck", "kihei", "trucks", "Food truck", 1, "LD", "Seafood plates", "", [["m", "Best Food Truck", 3]]);
  P("geste-shrimp", "Geste Shrimp Truck", "kahului", "trucks", "Shrimp truck", 1, "L", "Garlic shrimp plate", "", [["m", "Best Food Truck", 4]]);
  P("kihei-caffe", "Kīhei Caffe", "kihei", "coffee", "Breakfast cafe", 1, "BL", "Breakfast before the beach", "", [["m", "Best Breakfast", 1]]);
  P("grandmas", "Grandma's Coffee House", "kula", "coffee", "Coffee house", 1, "BL", "Maui-grown coffee and breakfast", "In Keokea, high on Haleakalā's slopes.", [["m", "Best Breakfast", 3]]);
  P("paia-bay-coffee", "Pāʻia Bay Coffee & Bar", "paia", "coffee", "Coffee and cafe", 2, "BLX", "Coffee in a garden courtyard", "", [["m", "Best Breakfast", 5], ["m", "Best Coffee Shop", 3]]);
  P("sugar-beach-bake", "Sugar Beach Bake Shop", "kihei", "sweets", "Bakery", 1, "BS", "Malasadas and pastries", "", [["m", "Best Bakery", 4]]);
  P("maui-coffee-roasters", "Maui Coffee Roasters", "kahului", "coffee", "Coffee roaster and cafe", 1, "BS", "Island coffee", "", [["m", "Best Coffee Shop", 1]]);
  P("wailuku-coffee", "Wailuku Coffee Co.", "wailuku", "coffee", "Coffee shop", 1, "BLS", "Coffee and sandwiches", "", [["m", "Best Coffee Shop", 2]]);
  P("maui-brewing-kihei", "Maui Brewing Co.", "kihei", "bars", "Brewery and restaurant", 2, "LDX", "Local beer and pub food", "", [["m", "Best Bar", 3], ["m", "Best Happy Hour", 3], ["a", "Best Local Beer", 2], ["ha", "Best Brew Pub", 2]]);
  P("south-shore-tiki", "South Shore Tiki Lounge", "kihei", "bars", "Tiki bar", 2, "X", "Tiki cocktails", "", [["m", "Best Bar", 5]]);
  P("sea-house", "Sea House Restaurant", "napili", "seafood", "Oceanfront restaurant", 3, "BLDX", "Happy hour on Nāpili Bay", "At the Nāpili Kai Beach Resort.", [["m", "Best Happy Hour", 5]]);
  P("808-deli", "808 Deli", "kihei", "local", "Sandwich deli", 1, "BL", "Sandwiches for the beach", "", [["m", "Best Cheap Eats", 4]]);

  /* ───────── Hawaiʻi Island ───────── */
  P("dons-mai-tai", "Don's Mai Tai Bar & Restaurant", "kona", "bars", "Oceanfront bar and restaurant", 3, "BLDX", "A mai tai over the water", "At the Royal Kona Resort.", [["h", "Best Restaurant", 2], ["h", "Best Hotel Restaurant", 1], ["h", "Best Bar", 1], ["h", "Best Happy Hour", 1]]);
  P("roys-waikoloa", "Roy's Waikoloa Bar & Grill", "waikoloa", "special", "Hawaiian fusion", 4, "LDX", "Misoyaki butterfish", "", [["h", "Best Restaurant", 3], ["h", "Best Steak House", 2]]);
  P("island-lava-java", "Island Lava Java", "kona", "coffee", "Oceanfront cafe", 2, "BLD", "Breakfast facing the ocean", "", [["h", "Best Restaurant", 4], ["h", "Best Breakfast", 2], ["h", "Best Bakery", 2]]);
  P("chubbys", "Chubby's Diner", "kona", "local", "Diner", 2, "LD", "Loco moco and plate lunch", "Inside the KBXtreme bowling center on Palani Road.", [["h", "Best Restaurant", 5], ["h", "Best Loco Moco", 3], ["h", "Best Plate Lunch", 4], ["h", "Best Burger", 4], ["h", "Best Breakfast", 5], ["h", "Best Cheap Eats", 4]]);
  P("canoehouse", "CanoeHouse", "maunalani", "special", "Oceanfront fine dining", 4, "D", "Sunset dinner", "At Mauna Lani, Auberge Resorts.", [["h", "Best Hotel Restaurant", 2]]);
  P("browns", "Brown's Beach House", "maunalani", "special", "Oceanfront fine dining", 4, "D", "Seafood at sunset", "At the Fairmont Orchid.", [["h", "Best Hotel Restaurant", 3]]);
  P("ulu-ocean-grill", "ʻUlu Ocean Grill", "hualalai", "special", "Oceanfront restaurant", 4, "BD", "Island fish", "At the Four Seasons Resort Hualālai.", [["h", "Best Hotel Restaurant", 4], ["h", "Best Seafood", 5]]);
  P("hilo-bay-cafe", "Hilo Bay Café", "hilo", "special", "Farm-to-table", 3, "LD", "Local fish and sushi on the bay", "", [["h", "Best Farm-to-Table", 2]]);
  P("moon-and-turtle", "Moon and Turtle", "hilo", "special", "Small plates", 3, "D", "Seasonal small plates", "", [["h", "Best Farm-to-Table", 3], ["ha", "Best Hawaiʻi Island Restaurant", 2]]);
  P("fosters", "Foster's Kitchen", "kona", "special", "Farm-to-table", 3, "LDX", "Island-sourced dinner on Aliʻi Drive", "", [["h", "Best Farm-to-Table", 4]]);
  P("umekes", "ʻUmeke's Fish Market Bar & Grill", "kona", "seafood", "Poke and fish market", 2, "LDX", "Poke bowl", "", [["h", "Best Seafood", 1], ["h", "Best Poke", 2], ["h", "Best Cheap Eats", 2]]);
  P("fish-hopper", "The Fish Hopper", "kona", "seafood", "Seafood restaurant", 3, "BLD", "Fish and chips on Aliʻi Drive", "", [["h", "Best Seafood", 2]]);
  P("jackie-reys", "Jackie Rey's ʻOhana Grill", "kona", "seafood", "Island restaurant", 3, "LDX", "Fresh fish", "", [["h", "Best Seafood", 3], ["h", "Best Steak House", 4], ["h", "Best Happy Hour", 5]]);
  P("seaside", "The Seaside Restaurant", "hilo", "seafood", "Fishpond restaurant", 3, "D", "Fish raised in their own ponds", "", [["h", "Best Seafood", 4]]);
  P("big-island-grill", "Big Island Grill", "kona", "local", "Local diner", 2, "BLD", "Loco moco", "", [["h", "Best Loco Moco", 1], ["h", "Best Plate Lunch", 1]]);
  P("hawaiian-style-cafe", "Hawaiian Style Café", "waimea", "local", "Local diner", 2, "BL", "Giant pancakes and loco moco", "There's also a Hilo location.", [["h", "Best Loco Moco", 2], ["h", "Best Plate Lunch", 3], ["h", "Best Breakfast", 1], ["a", "Best Loco Moco", 4]]);
  P("broke-da-mouth", "Broke Da Mouth Grindz", "kona", "local", "Plate lunch", 1, "BL", "Garlic chicken plate", "", [["h", "Best Plate Lunch", 2]]);
  P("suisan", "Suisan Fish Market", "hilo", "seafood", "Fish market poke counter", 1, "LS", "Poke by the bay", "", [["h", "Best Poke", 3]]);
  P("tk-noodle", "TK Noodle House", "kona", "global", "Noodle house", 2, "LD", "Noodle bowls", "", [["h", "Best Noodle", 1]]);
  P("noris", "Nori's Saimin and Snacks", "hilo", "local", "Saimin shop", 1, "LD", "Saimin and chocolate mochi cake", "", [["h", "Best Noodle", 3]]);
  P("kona-brewing", "Kona Brewing Co.", "kona", "bars", "Brewpub", 2, "LDX", "Pizza and a local beer", "", [["h", "Best Pizza", 1], ["h", "Best Bar", 2], ["a", "Best Local Beer", 1]]);
  P("cafe-pesto", "Café Pesto", "hilo", "burgers", "Pizza and pasta", 2, "LD", "Wood-fired pizza", "", [["h", "Best Pizza", 3]]);
  P("hilo-burger-joint", "Hilo Burger Joint", "hilo", "burgers", "Burger bar", 2, "LDX", "Burger", "", [["h", "Best Burger", 1]]);
  P("village-burger", "Village Burger Waimea", "waimea", "burgers", "Burger counter", 2, "LD", "Burger with local ranch beef", "", [["h", "Best Burger", 2]]);
  P("ultimate-burger", "Ultimate Burger", "kona", "burgers", "Burger restaurant", 2, "LD", "Burger", "", [["h", "Best Burger", 3]]);
  P("cronies", "Cronies Bar & Grill", "hilo", "bars", "Bar and grill", 2, "LDX", "Burger", "", [["h", "Best Burger", 5]]);
  P("waimea-butcher", "Waimea Butcher Shop", "waimea", "special", "Steak and butcher", 3, "LD", "Steak", "", [["h", "Best Steak House", 3]]);
  P("coffee-shack", "The Coffee Shack", "southkona", "coffee", "Coffee and breakfast", 2, "BL", "Breakfast with a view down to Kealakekua Bay", "", [["h", "Best Breakfast", 4], ["h", "Best Coffee Shop", 2]]);
  P("two-ladies", "Two Ladies Kitchen", "hilo", "sweets", "Mochi shop", 1, "S", "Strawberry mochi", "", [["h", "Best Bakery", 3]]);
  P("tex-drive-in", "Tex Drive-In", "honokaa", "sweets", "Drive-in and malasadas", 1, "BLS", "Hot malasadas", "", [["h", "Best Bakery", 4]]);
  P("puna-chocolate", "Puna Chocolate Company & Cafe", "hilo", "sweets", "Chocolate cafe", 2, "S", "Island chocolate", "", [["h", "Best Coffee Shop", 3]]);
  P("lava-lava", "Lava Lava Beach Club", "waikoloa", "bars", "Beach bar and restaurant", 3, "LDX", "Toes-in-the-sand sunset", "", [["h", "Best Bar", 3]]);
  P("huggos-rocks", "Huggo's On the Rocks", "kona", "bars", "Oceanfront bar", 2, "LDX", "Happy hour on the water", "", [["h", "Best Bar", 4], ["h", "Best Happy Hour", 2]]);
  P("humpys", "Humpy's Big Island Alehouse", "kona", "bars", "Alehouse", 2, "LDX", "Happy hour", "", [["h", "Best Happy Hour", 3]]);
  P("808-grindz", "808 Grindz Café", "kona", "local", "Local cafe", 1, "BL", "Local breakfast", "", [["h", "Best Cheap Eats", 5]]);
  P("kaleos", "Kaleo's Bar & Grill", "pahoa", "local", "Bar and grill", 2, "LDX", "Island comfort food", "", [["ha", "Best Hawaiʻi Island Restaurant", 4]]);

  /* ───────── Lānaʻi ───────── */
  P("no-ka-oi-grindz", "Nō Ka ʻOi Grindz Lānaʻi", "lanaicity", "local", "Local plates", 1, "LD", "Plate lunch", "", [["l", "Best Restaurant", 2], ["l", "Best Cheap Eats", 4]]);
  P("malibu-farm-lanai", "Malibu Farm", "manele", "special", "Farm-to-table", 4, "BLD", "Farm-fresh lunch with an ocean view", "At the Four Seasons Resort Lānaʻi.", [["l", "Best Restaurant", 3]]);
  P("manele-store", "Mānele General Store", "manele", "local", "General store and deli", 2, "BLS", "Grab-and-go food", "", [["l", "Best Cheap Eats", 2]]);
  P("coffee-works", "Coffee Works", "lanaicity", "coffee", "Coffee shop", 1, "BS", "Coffee on the porch", "", [["l", "Best Cheap Eats", 5]]);

  /* ───────── More Maui and Hawaiʻi Island places from area guides (read 2026-11-23) ───────── */
  Object.assign(HWP.foodSources, {
    hm2025maui: { label: "HAWAIʻI Magazine 2025 Readers' Choice: Maui", url: "https://www.hawaiimagazine.com/?p=134721" },
    hm2025big: { label: "HAWAIʻI Magazine 2025 Readers' Choice: Hawaiʻi Island", url: "https://www.hawaiimagazine.com/2025-readers-choice-hawaii-island/" },
    hmNew2025: { label: "HAWAIʻI Magazine: the 5 best new restaurants in Hawaiʻi (2025)", url: "https://www.hawaiimagazine.com/best-new-restaurants-in-hawaii-in-2025/" },
    aipono2025: { label: "Maui Nō Ka ʻOi Magazine: 2025 ʻAipono Award winners", url: "https://www.mauimagazine.net/2025-aipono-award-winners/" },
    lahainaNow: { label: "Frolic Hawaiʻi: where 90-plus Lahaina eateries are now (Aug. 2026)", url: "https://www.honolulumagazine.com/where-they-are-now-lahaina-restaurants-bars-snack-shops-food-trucks/" },
    prideLocal: { label: "Pride of Maui: top places for local food on Maui", url: "https://www.prideofmaui.com/blog/dining/top-20-places-local-food-maui/" },
    upcountryMaui: { label: "Bike Maui: favorite Upcountry restaurants", url: "https://www.bikemaui.com/favorite-upcountry-maui-restaurants/" },
    northShoreMaui: { label: "Where to eat on Maui's north shore (Haʻikū and Pāʻia)", url: "https://haikuvacationcottage.com/places-to-eat-haiku-paia/" },
    appetitesMaui: { label: "Appetites Abroad: Maui food guide", url: "https://www.appetitesabroad.com/maui-food-guide/" },
    kiheiLocal: { label: "Island Spree Maui: local favorites in Kīhei and Wailea", url: "https://www.islandspreemaui.com/localfavoriteskihei.html" },
    waileaGuide: { label: "Ribbon Rock Maui: best Wailea restaurants (2026)", url: "https://www.ribbonrockmaui.com/blog/wailea-restaurants/" },
    westMauiGuide: { label: "Best restaurants in West Maui (2026)", url: "https://cultivatetraveling.com/best-kaanapali-restaurants-dining-guide/" },
    hanaFood: { label: "Means to Explore: best restaurants on the Road to Hāna", url: "https://www.meanstoexplore.com/best-restaurants-on-the-road-to-hana/" },
    mauiThai: { label: "Pride of Maui: best Thai food on Maui (2026)", url: "https://www.prideofmaui.com/blog/dining/best-thai-food-maui/" },
    hiloLove: { label: "Love Big Island: best restaurants in Hilo", url: "https://www.lovebigisland.com/hilo/restaurants-and-cafes/" },
    volcanoLove: { label: "Love Big Island: favorite restaurants in Volcano Village", url: "https://www.lovebigisland.com/volcano-village/restaurants/" },
    punaGuide: { label: "Big Island Guide: affordable dining in Puna", url: "https://bigislandguide.com/affordable-dining-puna" },
    bigTrucks: { label: "Aloha Calendar: best food trucks on the Big Island", url: "https://alohacalendar.com/blog/best-food-trucks-big-island" },
    konaLove: { label: "Love Big Island: best restaurants in Kailua-Kona", url: "https://www.lovebigisland.com/kailua-kona/restaurants-and-cafes/" },
    konaTacos: { label: "Big Island Guide: favorite fish tacos around Kona", url: "https://bigislandguide.com/favorite-fish-tacos-kona" },
  });
  /* G(id, name, town, type, kind, price, meals, signature, description, sources, extra) */
  const G = (id, name, town, type, kind, price, meals, signature, desc, sources, extra) => {
    const [area, region, lat, lon] = T[town];
    HWP.foodAdded.push(Object.assign({
      id: "f-" + id, name, island: ISLAND_OF(town), area, lat: lat + jit(id, 3), lon: lon + jit(id, 11), kind, cuisine: kind, price,
      meals: meals.split("").map((c) => MEALS[c]), why: desc || "Recommended in the guide below.", signature, setting: "", web: null, webLabel: "No official website confirmed",
      reservations: type === "special" ? "Reservations recommended" : "Walk-in", tags: [], sources, place: { type, region, rank: 60 },
    }, extra || {}));
  };

  // Maui: Kahului & Wailuku
  G("my-thai-maui", "My Thai Maui", "kahului", "thai", "Thai restaurant", 2, "LD", "Thai curries and noodles", "Named 2025 ʻAipono Restaurant of the Year (gold) by Maui Nō Ka ʻOi readers. In a warehouse building near the airport.", ["aipono2025", "mauiThai"], { place: { type: "thai", region: "Kahului", star: true, rank: 5 } });
  G("tasty-crust", "Tasty Crust", "wailuku", "local", "Local diner", 1, "BLD", "Dry mein and giant pancakes", "A Wailuku diner known for dry mein and pancakes.", ["appetitesMaui", "prideLocal"]);
  G("tiffanys", "Tiffany's Bar & Restaurant", "wailuku", "local", "Local bar and restaurant", 2, "LDX", "Saimin with pork belly", "A Wailuku local favorite for saimin and bar food.", ["appetitesMaui"]);
  G("like-poke", "Like Poke", "kahului", "seafood", "Poke counter", 1, "LS", "Wasabi shoyu and kim chee poke", "A Kahului poke counter food writers rate among the best on Maui.", ["appetitesMaui"]);
  G("takamiya", "Takamiya Market", "wailuku", "seafood", "Market poke and deli", 1, "BLS", "Poke and okazuya-style deli", "A family market in Wailuku with a poke and deli counter.", ["hm2025maui"]);
  G("bistro-casanova", "Bistro Casanova", "kahului", "global", "Mediterranean bistro", 3, "LDX", "Tapas at happy hour", "A Kahului bistro voted for its happy hour.", ["hm2025maui"], { cuisine: "Mediterranean" });
  G("ramen-ya", "Ramen Ya", "kahului", "global", "Ramen shop", 2, "LD", "Ramen", "Voted one of Maui's best noodle spots. In Queen Kaʻahumanu Center.", ["hm2026maui", "hm2025maui"]);
  G("lindas-kitchen", "Linda's Kitchen", "kahului", "local", "Local plates", 1, "BL", "Local-style plates", "A Lahaina favorite that reopened at 70 Lono Ave. in Kahului after the fire.", ["lahainaNow"]);
  G("pho-huong-nam", "Pho Huong Nam", "kahului", "global", "Vietnamese", 1, "LD", "Pho", "Formerly Huong Nam in Lahaina; reopened in the Maui Marketplace food court.", ["lahainaNow"], { cuisine: "Vietnamese" });
  G("da-soriano", "Da-Soriano Grindz", "kahului", "trucks", "Food truck", 1, "L", "Local plates", "A Lahaina truck that reopened at 70 Lono Ave. in Kahului.", ["lahainaNow"]);
  G("sparkys", "Sparky's Food Co.", "kahului", "local", "Local food", 1, "LD", "Local plates", "Started as a Lahaina food truck; now a Kahului restaurant plus a truck in Kīhei.", ["lahainaNow"]);
  // Maui: Kīhei, Wailea & Māʻalaea
  G("havens-harborside", "Havens Harborside Fish & Chophouse", "maalaea", "seafood", "Fish and chophouse", 3, "LD", "Fish and chips", "Named Best New Restaurant at the 2025 ʻAipono Awards. At Māʻalaea Harbor, by the Maui Ocean Center.", ["aipono2025"]);
  G("ko-kea-lani", "Ko", "wailea", "special", "Plantation-inspired fine dining", 4, "LD", "Plantation-era dishes", "At the Fairmont Kea Lani; an ʻAipono winner for Pacific Rim cuisine in 2025.", ["aipono2025"]);
  G("nalus-kihei", "Nalu's South Shore Grill", "kihei", "local", "Casual island grill", 2, "BLDX", "Local plates and fish tacos", "A relaxed Kīhei favorite with local food.", ["kiheiLocal"]);
  G("maui-thai-bistro", "Maui Thai Bistro", "kihei", "thai", "Thai restaurant", 2, "LD", "Thai curry", "Called the best Thai food in Kīhei by local guides.", ["kiheiLocal", "mauiThai"], { cuisine: "Thai" });
  G("miso-phat", "Miso Phat Sushi", "kihei", "global", "Sushi bar", 3, "LD", "Sushi rolls", "A Kīhei local favorite for sushi.", ["kiheiLocal"]);
  G("freds-mexican", "Fred's Mexican Cafe", "kihei", "global", "Mexican restaurant", 2, "BLDX", "Tacos and margaritas across from the beach", "Casual Mexican on South Kīhei Road.", ["kiheiLocal"], { cuisine: "Mexican" });
  G("south-maui-gardens", "South Maui Gardens food trucks", "kihei", "trucks", "Food truck park", 1, "LD", "Pick from several trucks", "A garden in Kīhei with a cluster of food trucks, much cheaper than resort dining.", ["kiheiLocal"]);
  G("huli-huli-kihei", "Huli Huli Chicken and Ribs", "kihei", "trucks", "Roadside chicken stand", 1, "LD", "Huli huli chicken", "Rotisserie huli huli chicken on South Kīhei Road.", ["kiheiLocal"]);
  G("pho-noodle-bar", "Pho Noodle Bar", "kihei", "global", "Vietnamese", 1, "LD", "Pho", "Formerly Noodle Bar Lahaina; reopened in Kīhei after the fire.", ["lahainaNow"], { cuisine: "Vietnamese" });
  G("paniolos", "Paniolo's Steak & Seafood Bar & Grill", "kihei", "special", "Steak and seafood", 3, "D", "Steak and seafood", "Opened in 2025 by the owner of Lahaina's Smokehouse BBQ.", ["lahainaNow"]);
  G("matteos", "Matteo's Osteria", "wailea", "global", "Italian", 4, "D", "Pasta", "Wailea's top Italian pick in local guides.", ["waileaGuide"]);
  G("lahaina-brewing", "Lahaina Brewing Co.", "wailea", "bars", "Brewery", 2, "LDX", "Local beer", "Formerly Koholā Brewery of Lahaina; reopened in Wailea.", ["lahainaNow"]);
  G("lehua-lounge", "Lehua Lounge", "wailea", "bars", "Resort lounge", 3, "X", "Cocktails at sunset", "At the Andaz Maui at Wailea.", ["hm2025maui"]);
  // Maui: West Maui
  G("honu-oceanside", "Honu Oceanside", "lahaina", "seafood", "Oceanfront restaurant", 3, "LD", "Wood-fired pizza and fresh catch", "Reopened on the water in Lahaina.", ["lahainaNow", "westMauiGuide"]);
  G("sale-pepe", "Sale Pepe Pizzeria e Cucina", "lahaina", "global", "Italian and pizza", 3, "D", "Neapolitan pizza and pasta", "The first fire-destroyed restaurant to reopen, now in Emerald Plaza.", ["lahainaNow", "westMauiGuide"]);
  G("coco-deck", "Coco Deck Lahaina Kitchen + Bar", "lahaina", "bars", "Restaurant and bar", 3, "BLDX", "Breakfast and cocktails on Front Street", "The former Duckine, reopened on Front Street. Best New Restaurant honoree at the 2025 ʻAipono Awards.", ["lahainaNow", "westMauiGuide"]);
  G("indian-grill", "Indian Grill N Curry", "lahaina", "global", "Indian", 2, "LD", "Curry", "Reopened at 1165 Keawe St. in Lahaina.", ["lahainaNow"], { cuisine: "Indian" });
  G("lahaina-sushi-ko", "Lahaina Sushi Ko", "lahaina", "global", "Sushi", 2, "LD", "Sushi", "Reopened in the dining lot at Lahaina Cannery Mall.", ["lahainaNow"]);
  G("las-islitas", "Tacos y Mariscos Las Islitas", "lahaina", "trucks", "Mexican seafood truck", 1, "LD", "Seafood tacos", "Reopened at 56 Kupuohi St. in Lahaina.", ["lahainaNow"], { cuisine: "Mexican" });
  G("old-lahaina-luau", "Old Lahaina Lūʻau", "lahaina", "hawaiian", "Lūʻau", 4, "D", "Imu-cooked kalua pig with hula", "Maui's best-known lūʻau; reopened after the fire. Book well ahead.", ["lahainaNow"], { reservations: "Book ahead" });
  G("lahaina-gelato", "Lahaina Gelato", "lahaina", "sweets", "Gelato", 1, "S", "Gelato", "Formerly Hawaiʻi Gelato; reopened at Lahaina Cannery Mall.", ["lahainaNow"]);
  G("ono-gelato", "Ono Gelato", "kaanapali", "sweets", "Gelato", 1, "S", "Tropical fruit gelato", "Reopened at Whalers Village.", ["lahainaNow"]);
  G("sonz", "Son'z Steakhouse", "kaanapali", "special", "Steak house", 4, "D", "Steak by a lagoon", "At the Hyatt Regency Maui.", ["hm2026maui", "hm2025maui"]);
  G("amigos-napili", "Amigo's", "napili", "global", "Mexican", 1, "BLD", "Burritos", "Moved from Lahaina to Nāpili Plaza.", ["lahainaNow", "westMauiGuide"], { cuisine: "Mexican" });
  G("penne-pasta", "Penne Pasta Café", "napili", "trucks", "Italian food truck", 2, "LD", "Pasta", "The Lahaina restaurant now runs as a food truck in Nāpili.", ["lahainaNow"], { cuisine: "Italian" });
  G("napili-market", "Nāpili Market", "napili", "seafood", "Market poke counter", 1, "LS", "Poke", "One West Maui guide calls its poke the best on the west side.", ["westMauiGuide"]);
  G("captain-jacks", "Captain Jack's Island Grill", "kahana", "seafood", "Island grill", 2, "BLDX", "Fish and burgers", "Reopened at the Sands of Kahana resort.", ["lahainaNow"]);
  // Maui: Upcountry, Pāʻia & Haʻikū
  G("makawao-public-house", "Makawao Public House", "makawao", "special", "Gastropub", 3, "LDX", "Pub food in Makawao town", "Readers' #1 best new restaurant in Hawaiʻi for 2025.", ["hmNew2025"], { place: { type: "special", region: "Upcountry", star: true, rank: 5 } });
  G("kula-bistro", "Kula Bistro", "kula", "global", "Italian", 2, "BLD", "Panini, pizza and pasta", "Casual, affordable Italian with a mostly local crowd.", ["upcountryMaui"]);
  G("serpicos", "Serpico's Maui Pizzeria", "pukalani", "burgers", "Pizzeria", 2, "LD", "Pizza", "Shares an owner with Lahaina's Prison Street Pizza; ask and they'll make some of its pies.", ["lahainaNow"]);
  G("moku-roots", "Moku Roots", "kula", "global", "Plant-based farm dinners", 3, "BD", "Plant-based farm dinners", "The Lahaina restaurant now hosts Friday dinners and Sunday brunches at its Kula farm.", ["lahainaNow"], { cuisine: "Vegan, plant-based", note: "Friday dinners and Sunday brunches only." });
  G("cafe-des-amis", "Café des Amis", "paia", "global", "Mediterranean and Indian", 2, "BLDX", "Crêpes and curries", "In the heart of Pāʻia town; most popular for breakfast and happy hour.", ["northShoreMaui"], { cuisine: "Mediterranean, Indian" });
  G("only-ono-bbq", "Only Ono BBQ", "paia", "local", "Drive-in", 1, "LD", "BBQ plate lunch", "A Pāʻia drive-in for local plates.", ["northShoreMaui"]);
  G("belle-surf", "Belle Surf Café and Lounge", "paia", "coffee", "Cafe and lounge", 2, "BLX", "Breakfast and coffee", "Sister to the Front Street café lost in the fire.", ["lahainaNow"]);
  G("colleens", "Colleen's at the Cannery", "haiku", "coffee", "Cafe", 2, "BLD", "Breakfast burrito, fish tacos and burgers", "A Haʻikū go-to for locals and visitors.", ["northShoreMaui"]);
  G("nuka", "Nuka", "haiku", "global", "Sushi and Japanese", 3, "D", "Sushi", "Small, sleek Haʻikū spot known for sushi and seafood.", ["northShoreMaui"]);
  // Maui: Road to Hāna & Hāna
  G("nahiku-cafe", "Nāhiku Café", "nahiku", "trucks", "Roadside stand", 1, "LS", "Fish tacos", "Locals rave about the fish tacos at this Road to Hāna stop.", ["hanaFood"]);
  G("hana-farms", "Hāna Farms", "hana", "markets", "Farm stand and restaurant", 2, "LDS", "Wood-fired ʻulu and pesto pizza", "The most-recommended sit-down meal on the Road to Hāna, with a farm stand.", ["hanaFood"]);
  G("thai-pranee", "Thai Food by Pranee", "hana", "thai", "Thai food truck", 1, "L", "Curry with fresh vegetables", "A Hāna food truck with seating, big portions and fresh vegetables.", ["hanaFood"], { cuisine: "Thai" });
  G("braddah-hutts", "Braddah Hutts BBQ Grill", "hana", "trucks", "BBQ stand", 1, "L", "BBQ plate", "A popular Hāna barbecue stop.", ["hanaFood"]);
  G("hana-ranch", "Hāna Ranch Restaurant", "hana", "local", "Casual restaurant", 2, "LD", "Lunch with an ocean view", "An informal Hāna restaurant open daily; one of few dinner options in town.", ["hanaFood"]);
  G("huli-huli-koki", "Huli Huli Chicken at Koki Beach", "koki", "trucks", "Roadside chicken stand", 1, "L", "Huli huli chicken", "A very popular stand next to Koki Beach.", ["hanaFood"]);

  // Hawaiʻi Island: Hilo & north
  G("hilo-lunch-shop", "Hilo Lunch Shop", "hilo", "local", "Okazuya", 1, "BL", "Bento and plate lunch", "Tiny, cash-only and often sold out early.", ["hiloLove"], { note: "Cash only." });
  G("kojis", "Koji's Bento Korner", "hilo", "local", "Bento shop", 1, "BL", "Bento", "A small downtown Hilo takeout for lunch plates.", ["hiloLove"]);
  G("papaa-palaoa", "Papaʻa Palaoa Bakery", "hilo", "sweets", "Bakery", 1, "BS", "Hawaiian pastries", "", ["hiloLove"]);
  G("eds-bakery", "Ed's Bakery", "pepeekeo", "sweets", "Bakery", 1, "S", "Hawaiian pastries and jams", "A small bakery on the scenic drive north of Hilo.", ["hiloLove"]);
  G("short-n-sweet", "Short N Sweet Bakery & Café", "hilo", "sweets", "Bakery cafe", 2, "BLS", "Pastries", "Family-owned, in downtown Hilo.", ["hiloLove", "hm2025big"]);
  G("miyos", "Miyo's", "hilo", "global", "Home-style Japanese", 2, "LD", "Japanese set meals", "Home-style Japanese cooking.", ["hiloLove"]);
  G("kamana-kitchen", "Kamana Kitchen", "hilo", "global", "Indian", 2, "LD", "Curry", "Hilo's Indian restaurant.", ["hiloLove"], { cuisine: "Indian" });
  G("forc", "FORC", "hilo", "special", "Farm-to-table", 3, "LD", "Farm-to-table plates", "Voted a top farm-to-table restaurant on the island.", ["hm2025big"]);
  // Hawaiʻi Island: Volcano & Puna
  G("kilauea-lodge", "Kīlauea Lodge Restaurant", "volcano", "special", "Lodge restaurant", 3, "BLD", "Dinner by the fireplace after the park", "The nicest restaurant in Volcano Village; open for breakfast, lunch and dinner.", ["volcanoLove"]);
  G("lava-rock-cafe", "Lava Rock Café", "volcano", "local", "Casual cafe", 2, "BLD", "Local plates", "Volcano's budget-friendly option with a long menu.", ["volcanoLove"]);
  G("ohelo-cafe", "ʻŌhelo Café", "volcano", "special", "Cafe and dinner", 3, "LD", "Dinner", "Lunch takeout and dinner in Volcano Village.", ["volcanoLove"], { note: "Has been closed Tuesdays and Wednesdays." });
  G("cafe-ono", "Café Ono", "volcano", "coffee", "Vegetarian cafe", 1, "L", "Vegetarian lunch in a garden", "A lunch-only vegetarian-leaning cafe.", ["volcanoLove"], { cuisine: "Vegetarian" });
  G("aunty-pons", "Aunty Pon's Thai Food Truck", "volcano", "thai", "Thai food truck", 1, "L", "Thai plate", "A locals' lunch favorite at Cooper Center.", ["volcanoLove"], { cuisine: "Thai" });
  G("ricos-tacos", "Rico's Taco Shop", "volcano", "trucks", "Taco shop", 1, "LD", "Tacos", "Recommended for tacos in Volcano.", ["volcanoLove"], { cuisine: "Mexican" });
  G("nings-thai", "Ning's Thai Cuisine", "pahoa", "thai", "Thai restaurant", 2, "LD", "Thai curry", "Described as one of the best Thai spots in Puna.", ["punaGuide"], { cuisine: "Thai" });
  G("peles-kitchen", "Pele's Kitchen", "pahoa", "coffee", "Cafe", 2, "BL", "Breakfast with vegan options", "A lively cafe in historic Pāhoa town.", ["punaGuide"]);
  G("pahoa-fresh-fish", "Pāhoa Fresh Fish", "pahoa", "seafood", "Fish and chips", 1, "LD", "Fish and chips", "", ["punaGuide"]);
  // Hawaiʻi Island: Waimea, Honokaʻa & north
  G("red-barn", "Red Barn", "waimea", "trucks", "Grilled cheese", 1, "L", "Gourmet grilled cheese on sourdough", "From a former Four Seasons Hualālai chef; uses herbs grown in Waimea.", ["bigTrucks"]);
  G("big-island-brewhaus", "Big Island Brewhaus", "waimea", "bars", "Brewpub", 2, "LDX", "Craft beer and island-style food", "Voted one of Hawaiʻi's best local beers by readers in 2026.", ["hm2026all"]);
  G("manuela-malasada", "Manuela Malasada", "waimea", "sweets", "Malasada truck", 1, "S", "Guava and mango filled malasadas", "One guide's top Big Island food truck pick.", ["bigTrucks"]);
  G("litchon", "Litchon Food Truck", "honokaa", "trucks", "Filipino food truck", 1, "L", "Filipino lechon", "Farm-to-table Filipino lechon in Honokaʻa and Hilo.", ["bigTrucks"], { cuisine: "Filipino" });
  G("island-style-grindz", "Island Style Grindz", "waimea", "trucks", "Roaming food truck", 1, "L", "Island-style comfort food", "A blue trailer that rotates between Waimea, Hāwī, Kona and Hilo, usually Wednesday to Friday.", ["bigTrucks"], { note: "Check its schedule for the day's town." });
  // Hawaiʻi Island: Kona & Kohala
  G("paakai-poke", "Paʻakai Poke", "kona", "seafood", "Poke counter", 1, "LS", "Poke bowl", "A well-reviewed takeout poke spot on Hualālai Road.", ["konaLove"]);
  G("shaka-tacoz", "Shaka Tacoz", "southkona", "trucks", "Taco truck", 1, "LD", "Fish tacos with an ocean view", "Started as a Captain Cook truck with an ocean-view patio; now also in Kailua-Kona.", ["konaTacos"], { cuisine: "Mexican" });
  G("los-habaneros", "Los Habaneros", "keauhou", "global", "Mexican", 2, "LD", "Burritos", "In Keauhou Shopping Center.", ["konaTacos"], { cuisine: "Mexican" });
  G("da-braddahz", "Da Braddahz Grindz", "kona", "trucks", "Local food truck", 1, "L", "Local plates", "Voted the best food truck on Hawaiʻi Island by readers in 2026.", ["hm2026big"], { place: { type: "trucks", region: "Kona", star: true, rank: 5 } });
  G("rendezvous", "Rendezvous Hawaiʻi Food Truck", "kona", "trucks", "Food truck", 1, "BL", "Breakfast and lunch plates", "Voted #2 food truck on the island in 2026.", ["hm2026big"]);
  G("pine-tree-cafe", "Pine Tree Café", "kona", "local", "Local cafe", 2, "BLD", "Loco moco", "Handy for quick takeout near the airport.", ["konaLove"]);
  G("peaberry-galette", "Peaberry & Galette", "keauhou", "coffee", "Crêpe cafe", 2, "BL", "Crêpes and Kona coffee", "", ["konaLove"]);
  G("teshimas", "Teshima's", "kealakekua", "local", "Japanese-local diner", 2, "BLD", "Teishoku and shrimp tempura", "A family-run South Kona institution.", ["konaLove"]);
  G("theatery", "The Theatery", "kealakekua", "special", "Farm-to-table", 3, "D", "Farm-to-table dinner", "Voted a top farm-to-table restaurant on the island in 2026.", ["hm2026big", "konaLove"]);
  G("bianellis", "Bianelli's Gourmet Pizza & Pasta", "kona", "burgers", "Pizza and pasta", 2, "LD", "Pizza", "", ["hm2025big", "hm2026big"]);
  G("scandinavian-shave", "Scandinavian Shave Ice", "kona", "shaveice", "Shave ice", 1, "S", "Huge shave ice", "On Aliʻi Drive.", ["hm2025big", "hm2026big"]);
  G("kamuela-provision", "Kamuela Provision Co.", "waikoloa", "special", "Steak and seafood", 4, "D", "Sunset dinner over the ocean", "At the Hilton Waikoloa Village.", ["hm2025big"]);
  G("beach-tree", "Beach Tree", "hualalai", "special", "Beachside restaurant", 4, "LD", "Lunch by the beach", "At the Four Seasons Resort Hualālai.", ["hm2025big"]);

  /* Poll results for places already on the site */
  const EXISTING = {
    "f-helenas": [["o", "Best Traditional Hawaiian", 1], ["ha", "Best Hawaiian", 1]],
    "f-highwayinn": [["o", "Best Traditional Hawaiian", 3], ["ha", "Best Hawaiian", 2]],
    "f-rainbow": [["o", "Best Plate Lunch", 1], ["o", "Best Burger", 3], ["o", "Best Cheap Eats", 3], ["a", "Best Loco Moco", 2]],
    "f-onoseafood": [["o", "Best Poke", 2]],
    "f-matsumoto": [["o", "Best Shave Ice", 1]],
    "f-shiges": [["o", "Best Noodle", 4]],
    "f-giovannis": [["o", "Best Food Truck", 1]],
    "f-liliha": [["o", "Best Breakfast", 2], ["o", "Best Bakery", 2], ["o", "Best Cheap Eats", 4], ["ha", "Best Local Chain", 3]],
    "f-leonards": [["o", "Best Bakery", 1], ["a", "Best Malasada", 1]],
    "f-mamas": [["m", "Best Restaurant", 1], ["m", "Best Farm-to-Table", 1], ["m", "Best Seafood", 1], ["a", "Best Restaurant", 1], ["ha", "Best Maui Restaurant", 2]],
    "f-tinroof": [["m", "Best Plate Lunch", 2], ["m", "Best Noodle", 2], ["m", "Best Cheap Eats", 2]],
    "f-dakitchen": [["m", "Best Plate Lunch", 3]],
    "f-samsato": [["m", "Best Plate Lunch", 5], ["m", "Best Noodle", 3], ["m", "Best Cheap Eats", 5]],
    "f-alohamixed": [["m", "Best Plate Lunch", 1]],
    "f-southmauifish": [["m", "Best Poke", 3]],
    "f-komoda": [["m", "Best Bakery", 3], ["a", "Best Malasada", 4]],
    "f-leodas": [["m", "Best Bakery", 1], ["m", "Best Banana Bread", 3]],
    "f-ululanis": [["m", "Best Shave Ice", 1], ["h", "Best Shave Ice", 2]],
    "f-tobis": [["m", "Best Shave Ice", 4]],
    "f-haliimaile": [["m", "Best Farm-to-Table", 2]],
    "f-merrimans": [["h", "Best Restaurant", 1], ["h", "Best Farm-to-Table", 1], ["h", "Best Steak House", 1], ["ha", "Best Hawaiʻi Island Restaurant", 1]],
    "f-dapoke": [["h", "Best Poke", 1], ["h", "Best Cheap Eats", 3]],
    "f-kens": [["h", "Best Loco Moco", 4], ["h", "Best Noodle", 4], ["h", "Best Breakfast", 3]],
    "f-cafe100": [["h", "Best Loco Moco", 5], ["a", "Best Loco Moco", 5]],
    "f-superjs": [["h", "Best Plate Lunch", 5]],
    "f-punaluu": [["h", "Best Bakery", 1], ["a", "Best Malasada", 3]],
    "f-blueginger": [["l", "Best Restaurant", 1], ["l", "Best Cheap Eats", 3]],
    "f-nobu": [["l", "Best Restaurant", 5]],
  };
  const findPlace = (id) => HWP.food.find((p) => p.id === id) || HWP.foodAdded.find((p) => p.id === id);
  Object.entries(EXISTING).forEach(([id, aw]) => {
    const p = findPlace(id); if (!p) return;
    p.sources = [...new Set([...(p.sources || []), ...aw.map(([k]) => SRC[k])])];
    p.awards = aw;
    p.why = p.why + " " + awardsText(aw);
    const pl = HWP.foodPlacement[id] || p.place;
    if (pl && aw.some(([k, , n]) => n === 1 && k !== "a")) pl.star = true;
  });

  /* Hotel Lānaʻi's restaurant appears in the 2026 poll as Lānaʻi City Bar & Grill */
  const grill = findPlace("f-lcgrille");
  if (grill) {
    const aw = [["l", "Best Restaurant", 4], ["l", "Best Cheap Eats", 1]];
    grill.name = "Lānaʻi City Bar & Grill";
    grill.sources = [...new Set([...(grill.sources || []), SRC.l])];
    grill.why = grill.why + " " + awardsText(aw);
  }
})();
