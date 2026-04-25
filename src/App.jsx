import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Download, RotateCcw, Star, AlertCircle, X, Edit3, Check, ExternalLink, Leaf, Ban, Sparkles, Shield, Flame, Bookmark } from 'lucide-react';

const STORAGE_KEY = 'ventuno_menu_v3';

const STATUS = {
  pending:  { label: 'Pending review', dot: 'bg-stone-400',     pill: 'bg-stone-100 text-stone-700 border-stone-300' },
  aligned:  { label: 'On theme',       dot: 'bg-emerald-600',   pill: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  tweak:    { label: 'Needs tweak',    dot: 'bg-amber-500',     pill: 'bg-amber-50 text-amber-800 border-amber-300' },
  drop:     { label: 'Drop',           dot: 'bg-rose-500',      pill: 'bg-rose-50 text-rose-800 border-rose-300' },
  hero:     { label: 'Hero / keep',    dot: 'bg-indigo-600',    pill: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
};

const CUISINE = {
  jp:     { label: 'Japanese',          color: 'bg-rose-50 text-rose-700 border-rose-200' },
  latam:  { label: 'Latin American',    color: 'bg-orange-50 text-orange-700 border-orange-200' },
  it:     { label: 'Italian',           color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  eu:     { label: 'European steak.',   color: 'bg-stone-100 text-stone-700 border-stone-300' },
  fusion: { label: 'Fusion',            color: 'bg-violet-50 text-violet-700 border-violet-200' },
  me:     { label: 'Middle East',       color: 'bg-teal-50 text-teal-700 border-teal-200' },
  none:   { label: 'Untagged',          color: 'bg-white text-stone-500 border-stone-200' },
};

const ALT_LEVELS = {
  safe:     { label: 'Safe tweak',  border: 'border-emerald-300', soft: 'bg-emerald-50/40', text: 'text-emerald-800', Icon: Shield },
  medium:   { label: 'Medium',      border: 'border-amber-300',   soft: 'bg-amber-50/40',   text: 'text-amber-800',   Icon: Sparkles },
  creative: { label: 'Creative',    border: 'border-rose-300',    soft: 'bg-rose-50/40',    text: 'text-rose-800',    Icon: Flame },
};

const CAND_TYPES = {
  'new-safe':     { label: 'New idea (safe)',     pill: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  'new-creative': { label: 'New idea (creative)', pill: 'bg-rose-50 text-rose-800 border-rose-300' },
  'kaji':         { label: 'From Kaji menu',      pill: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  'inspired':     { label: 'Inspired by',         pill: 'bg-violet-50 text-violet-800 border-violet-300' },
};

const REFERENCES = [
  { name: 'Matsuhisa Limassol (full menu PDF)', url: 'https://www.amarahotel.com/wp-content/uploads/media/website/Matsuhisa-Menu-1.pdf', note: 'Direct competitor in Limassol. Nobu pricing benchmark.' },
  { name: 'Matsuhisa Limassol (overview)', url: 'https://www.amarahotel.com/service/matsuhisa-limassol-restaurant/', note: 'Restaurant page' },
  { name: 'Nobu Marbella', url: 'https://www.noburestaurants.com/marbella/', note: 'Nikkei in a Mediterranean setting' },
  { name: 'Mi AlmaZara, Jávea', url: 'https://www.spainlifeexclusive.com/nikkei-meets-the-mediterranean-flavors-at-mi-almazara-hotel/', note: 'Explicit Nikkei × Mediterranean precedent' },
  { name: 'Panko, Charlotte NC', url: 'https://www.opentable.com/r/panko-charlotte', note: 'Markets as Asian-Mediterranean Nikkei' },
  { name: 'Maido, Lima', url: 'https://maido.pe', note: 'World-renowned Nikkei reference' },
];

let _id = 0;
const uid = (p = 'x') => `${p}_${++_id}_${Math.random().toString(36).slice(2, 6)}`;

const THEMES = [
  { id: 'undecided', name: 'Theme not chosen yet',         desc: 'Use this until you and the owner pick a direction.' },
  { id: 'nikkei_cy', name: 'Nikkei foundation + Cypriot signature line', desc: 'Kaji recipes the kitchen knows, plus a small named Cypriot line as the differentiator against Matsuhisa Limassol.' },
  { id: 'nikkei',    name: 'Direction 1: Full Nikkei',      desc: 'Japanese × Latin American.' },
  { id: 'izakaya',   name: 'Direction 2: Modern Izakaya',   desc: 'Strip back Latin influences, double down on Japan.' },
  { id: 'asiamed',   name: 'Direction 3: Asia × Mediterranean', desc: 'Japanese technique, Cypriot and Med ingredients.' },
];

const A = (level, name, desc, opts = {}) => ({
  id: uid('alt'),
  level, name, desc,
  cypriot: !!opts.cy,
  vegan: !!opts.v,
});

const C = (type, name, desc, opts = {}) => ({
  id: uid('cand'),
  type, name, desc,
  price: opts.price || null,
  source: opts.source || null,
  cypriot: !!opts.cy,
  vegan: !!opts.v,
  added: false,
});

const initialMenu = [
  { section: 'Nigiri (3pcs)', items: [
    { name: 'Salmon (Sake)', price: 7, ingredients: 'Salmon nigiri', cuisine: 'jp', alternatives: [
      A('safe',     'Sake nigiri with yuzu kosho',                  'Brushed with yuzu kosho soy. Tiny lift, no kitchen change.'),
      A('medium',   'Aburi salmon nigiri, truffle ponzu',           'Torch-finished, truffle ponzu, chives. Kaji-style.'),
      A('creative', 'Sake nigiri with anari and lemon zest',        'Shaved Cypriot anari ricotta and Lefkara lemon zest on top.', { cy: true }),
    ]},
    { name: 'Tuna (Maguro)', price: 6, ingredients: 'Tuna nigiri', cuisine: 'jp', alternatives: [
      A('safe',     'Maguro nigiri, nikiri and Cyprus sea salt',    'Brushed nikiri, finished with Akrotiri sea salt.', { cy: true }),
      A('medium',   'Spicy crispy rice tuna nigiri',                'Crispy rice base, spicy tuna tartare on top. Matsuhisa riff.'),
      A('creative', 'Maguro with Kalamata tapenade and capers',     'Black olive tapenade dot, brined caper. Surprisingly Med.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Toro nigiri (2pcs)',           'Premium fatty tuna belly. A must-have if competing on quality.', { price: 18 }),
    C('new-creative', 'Sea bream nigiri (2pcs)',      'Local Cypriot sea bream, lightly cured, nikiri brushed.', { price: 8, cy: true }),
    C('kaji',         'Black Angus Striploin Nigiri (2pcs)', 'Seared striploin on rice, tomato confit. Crowd favourite.', { price: 8, source: 'Kaji' }),
    C('kaji',         'Wagyu Striploin Nigiri (2pcs)', 'Seared wagyu, truffle mayo. The Kaji luxury opener.', { price: 9, source: 'Kaji' }),
    C('kaji',         'Sea Bass Nigiri (2pcs)',        'Nikiri sauce, tobiko orange. Kaji proven seller.', { price: 7, source: 'Kaji' }),
  ]},

  { section: 'Sashimi (3pcs)', items: [
    { name: 'Salmon (Sake)', price: 9, ingredients: 'Salmon sashimi', cuisine: 'jp', alternatives: [
      A('safe',     'Sake sashimi, sake-citrus dressing',     'Plate-finished with sake dressing. Existing on the menu, just elevated.'),
      A('medium',   'Salmon tiradito, leche de tigre',        'Peruvian citrus marinade, jalapeño, coriander. Maido style.'),
      A('creative', 'Salmon sashimi, Cyprus EVOO and capers', 'Drizzle of Lemesos extra virgin and salty capers. Med-Nikkei.', { cy: true }),
    ]},
    { name: 'Tuna (Maguro)', price: 8, ingredients: 'Tuna sashimi', cuisine: 'jp', alternatives: [
      A('safe',     'Maguro sashimi, sesame ponzu',           'Sesame oil, ponzu, micro herbs. Clean upgrade.'),
      A('medium',   'Tuna tiradito, aji amarillo',            'Yellow Peruvian chilli emulsion, lime. Nikkei classic.'),
      A('creative', 'Tuna sashimi with grilled fig and ponzu', 'Charred fig wedges, aged ponzu, sesame. Bridge dish.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Octopus carpaccio',         'Thinly sliced octopus, ponzu, smoked paprika.', { price: 14 }),
    C('new-creative', 'Sea bream tiradito',        'Local sea bream, leche de tigre, Cypriot lemon zest. Med-Nikkei signature.', { price: 13, cy: true }),
    C('kaji',         'Fish Carpaccio',            'Seabass, passion fruit, chilli. Kaji bestseller.', { price: 15, source: 'Kaji' }),
    C('kaji',         'Ceviche C.O.D',             'Cod ceviche, tigers milk, basil oil, citrus. Kaji classic.', { price: 12, source: 'Kaji' }),
    C('inspired',     'Yellowtail sashimi jalapeño', 'Nobu signature dish. Yellowtail with jalapeño, soy, coriander.', { price: 22, source: 'Matsuhisa Limassol' }),
    C('inspired',     'Tomato ceviche with quinoa', 'Vegetarian ceviche. Cypriot tomatoes work perfectly here.', { price: 14, source: 'Matsuhisa Limassol', v: true }),
  ]},

  { section: 'Sushi Platters', items: [
    { name: 'Fusion Platter', price: 52, ingredients: 'Beef taco (2pcs), tuna taco (2pcs), chicken yakitori (2pcs), prawns tempura (2pcs), tuna nigiri (2pcs), Fuji roll', cuisine: 'fusion', alternatives: [
      A('safe',     'Same composition, renamed Nikkei platter', 'Just rename and tighten plating. Zero kitchen impact.'),
      A('medium',   'Anticucho-Nikkei Platter',                'Wagyu nigiri (2), sea bass nigiri (2), 2 anticucho skewers, ceviche cup, Fuji roll.'),
      A('creative', '21 Cyprus Tasting',                       'Halumiyaki, Cyprus sea bream nigiri, halloumi taco, octopus tataki, anari roll. The signature platter.', { cy: true, price: 58 }),
    ]},
    { name: 'Sushi Platter', price: 58, ingredients: '3pc sashimi tuna, 3pc sashimi salmon, 2pc nigiri tuna, 2pc nigiri salmon, vegetable roll, ebi tempura roll, aburi salmon', cuisine: 'jp', alternatives: [
      A('safe',     'Premium Nikkei selection',                'Same dishes, refreshed with truffle ponzu finish.'),
      A('medium',   'Nikkei Premium with Wagyu',               'Add wagyu striploin nigiri (Kaji), aburi torched salmon. Charge €68.'),
      A('creative', 'Local Catch Platter',                     'All sushi from Cyprus waters: sea bream, sea bass, octopus, plus Cyprus vegetable roll.', { cy: true, price: 62 }),
    ]},
  ], candidates: [
    C('new-safe',     'Vegan Tasting Platter',     'Cyprus garden roll, vegetable nigiri, mushroom ceviche, edamame. Big underserved audience.', { price: 42, v: true }),
    C('new-creative', 'Anticucho Platter',         'Six skewers: halumiyaki, iberico, octopus, chicken thigh, asparagus, wild mushroom. Sharing.', { price: 32, cy: true }),
  ]},

  { section: 'Special Rolls (8pcs)', items: [
    { name: 'Vegetable Roll', price: 12, ingredients: 'Cucumber, avocado, mango, kanpyo. Topped with wakame salad and sesame seeds.', cuisine: 'jp', vegan: true, alternatives: [
      A('safe',     'Same with umeboshi accent',               'Add a touch of pickled plum for depth. Still fully vegan.', { v: true }),
      A('medium',   'Smoked mushroom roll, tahini-ponzu',      'Oyster mushrooms, smoked, tahini-ponzu drizzle, crispy onions.', { v: true }),
      A('creative', 'Cyprus garden roll',                       'Halloumi tempura inside, mint, courgette ribbon, sumac sesame top. Vegetarian, not vegan.', { cy: true }),
    ]},
    { name: 'California Roll', price: 12, ingredients: 'King crab, avocado, Japanese mayo. Topped with orange masago.', cuisine: 'jp', alternatives: [
      A('safe',     'California roll, kombu-cured crab',       'Same roll, slightly elevated by kombu curing the crab.'),
      A('medium',   'Crab and mango, jalapeño crema',          'Spicier, brighter, in the Maido idiom.'),
      A('creative', 'Loukoumades crab roll',                   'Honey-ponzu glaze, sesame crunch, mint. A doughnut nod, may be too far.', { cy: true }),
    ]},
    { name: 'Ebi Tempura Roll', price: 14, ingredients: 'Tempura prawn, mango, cucumber, teriyaki sauce. Topped with tempura flakes.', cuisine: 'jp', alternatives: [
      A('safe',     'Same with chipotle mayo finish',           'Chipotle drizzle and lime. Subtle Mexican accent.'),
      A('medium',   'Volcano dynamite ebi roll',                'Torched dynamite cheese top, sriracha, scallion.'),
      A('creative', 'Kataifi-tempura ebi roll',                 'Shredded kataifi instead of panko on the prawns. Crunchier and more Cypriot.', { cy: true }),
    ]},
    { name: 'Fuji Roll', price: 14, ingredients: 'Cucumber, truffle mayo, asparagus, salmon. Topped with fresh salmon.', cuisine: 'fusion', alternatives: [
      A('safe',     'Truffle Fuji, chives, ikura',              'Add ikura beads on top for visual punch.'),
      A('medium',   'Wagyu cap Fuji',                           'Top with seared wagyu, tobiko, truffle ponzu instead of mayo.'),
      A('creative', 'Pistachio Fuji',                           'Roasted Aegina pistachio dust, truffle ponzu. Med-Nikkei luxe.', { cy: true }),
    ]},
    { name: 'Dynamite', price: 14, ingredients: 'Prawns tempura, dynamite sauce, kanpyo. Topped with avocado, teriyaki, tempura flakes.', cuisine: 'jp', alternatives: [
      A('safe',     'Dynamite, refreshed sauce',                'Cleaner dynamite sauce recipe, less heavy.'),
      A('medium',   'Volcano dynamite',                         'Torched cream cheese top, sriracha, microgreens.'),
      A('creative', 'Cyprus dynamite',                          'Yellow Cyprus chilli pepper, halloumi sour cream cap. Bold.', { cy: true }),
    ]},
    { name: 'Tempura Roll', price: 16, ingredients: 'Grilled salmon, ebi tempura, mango, teriyaki mayonnaise.', cuisine: 'jp', alternatives: [
      A('safe',     'Same roll, plate refresh',                 'Tighten plating, add micro coriander.'),
      A('medium',   'Surf and turf tempura',                    'Add seared wagyu strip on top, truffle ponzu.'),
      A('creative', 'Kataifi-wrapped tempura roll',             'Wrapped in toasted kataifi instead of nori-out.', { cy: true }),
    ]},
    { name: 'Maguro Roll', price: 16, ingredients: 'King crab, mango, cucumber. Topped with fresh tuna, chives, spicy mayo.', cuisine: 'jp', alternatives: [
      A('safe',     'Same with truffle ponzu drizzle',          'Light truffle ponzu over the tuna.'),
      A('medium',   'Spicy Tuna Uramaki (Kaji style)',          'Tuna belly, sesame, avocado, spicy sauce. Kaji had this and it sold.'),
      A('creative', 'Maguro and feta roll',                     'White feta inside, ponzu drizzle. Polarising, so test it first.', { cy: true }),
    ]},
    { name: 'Aburi Salmon', price: 16, ingredients: 'Cream cheese, cucumber, avocado, teriyaki sauce. Topped with fresh salmon and sesame seeds.', cuisine: 'jp', alternatives: [
      A('safe',     'Replace cream cheese with anari',          'Cypriot anari ricotta is lighter and fresher than cream cheese.', { cy: true }),
      A('medium',   'Aburi salmon, truffle mayo, ikura',        'More luxe top finish, ikura caviar.'),
      A('creative', 'Aburi salmon and halloumi',                'Torched halloumi cap, kataifi crunch, mint oil.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Spicy Tuna Roll',           'Classic, missing from current menu. Easy seller.', { price: 14 }),
    C('new-creative', 'Anari and asparagus roll',  'Fresh anari, blanched asparagus, lemon ponzu, sesame. Light vegetarian option.', { price: 12, cy: true }),
    C('kaji',         'Shrimp Tempura Uramaki',    'Avocado, kimchi mayo, negi, fried onion. Kaji premium roll.', { price: 17, source: 'Kaji' }),
    C('kaji',         'Sea Bass Uramaki',          'Orange tobiko, sesame, torched kimchi sauce.', { price: 15, source: 'Kaji' }),
    C('inspired',     'Crispy rice with spicy tuna (6pc)', 'Iconic Matsuhisa item. Crispy rice cube, spicy tuna tartare on top.', { price: 22, source: 'Matsuhisa Limassol' }),
  ]},

  { section: 'Salad', items: [
    { name: 'Kaji Garden Salad', price: 10, ingredients: 'Seasonal veggies, pickled citrus, sake dressing.', cuisine: 'jp', vegan: true, alternatives: [
      A('safe',     'Same, expand seasonal vegetables',         'Lean on Cyprus seasonal produce week to week.', { v: true, cy: true }),
      A('medium',   'Add quinoa for substance',                 'Peruvian touch, makes it a fuller starter.', { v: true }),
      A('creative', 'Cyprus garden salad with grilled halloumi', 'Same dressing, add grilled halloumi cubes. Vegetarian.', { cy: true }),
    ]},
    { name: 'Burrata', price: 16, ingredients: 'Guacamole, mushrooms, tortilla, peppers.', cuisine: 'fusion', recommendRemove: true, alternatives: [
      A('safe',     'Burrata with miso dressing',               'Strip the tortilla and guac, replace with miso-soy dressing and shiso.'),
      A('medium',   'Anari and avocado tartare',                'Swap burrata for Cyprus anari, plate as tartare with avocado, citrus.', { cy: true }),
      A('creative', 'Halloumi tataki',                          'Replace burrata entirely with halloumi seared like tataki, ponzu, furikake.', { cy: true }),
    ]},
    { name: 'Ventuno Salad', price: 15, ingredients: 'Beetroot, mushroom, green vegetables.', cuisine: 'eu', alternatives: [
      A('safe',     'Beetroot, mushroom, sesame-ponzu',         'Same vegetables, dressing reset to sesame-ponzu and yuzu.', { v: true }),
      A('medium',   'Beetroot and yuzu salad with shiso',       'Pickled beets, yuzu, shiso, sesame praline.', { v: true }),
      A('creative', 'Beetroot and anari salad',                 'Roasted beets, fresh anari ricotta, capers, sake-citrus dressing.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Mushroom salad with yuzu dressing', 'Clean, simple. Matsuhisa price benchmark €18.', { price: 12, v: true }),
    C('new-creative', 'Octopus and Cyprus potato salad',   'Grilled octopus, baby Cyprus potatoes, ponzu vinaigrette.', { price: 16, cy: true }),
    C('kaji',         'Ensalada',                          'Broccoli, harricot, red beans, zucchini vinaigrette. Vegan starter from Kaji.', { price: 8.5, source: 'Kaji', v: true }),
    C('inspired',     'Spicy lobster salad',               'Premium luxury salad, spicy lemon dressing.', { price: 38, source: 'Matsuhisa Limassol' }),
  ]},

  { section: 'To Start', items: [
    { name: 'Tuna Spicy Tataki', price: 12, ingredients: 'Crispy tostadas, truffle cape mayo.', cuisine: 'fusion', alternatives: [
      A('safe',     'Same, plating refresh',                    'Already on theme. Tighten the truffle cape mayo recipe.'),
      A('medium',   'Tuna tataki on crispy rice',               'Swap tostada base for crispy rice cube. Matsuhisa idiom.'),
      A('creative', 'Tuna tataki on kataifi nest',              'Crispy kataifi base instead of tostada. Cyprus crunch.', { cy: true }),
    ]},
    { name: 'Beef Devesa Tataki', price: 12, ingredients: 'Truffle, ponzu, sesame furikake, caviar.', cuisine: 'jp', alternatives: [
      A('safe',     'Same dish, hero of the section',           'Already excellent. Mark this as a hero, do not change.'),
      A('medium',   'Beef tataki anticucho style',              'Same flavours, served as 2 mini skewers instead of slices.'),
      A('creative', 'Beef tataki with carob molasses',          'Cyprus carob molasses glaze, sesame, ponzu. Sweet-savoury.', { cy: true }),
    ]},
    { name: 'Beef Tartare', price: 18, ingredients: 'Crispy rice, sriracha, Japanese mayo, quail egg.', cuisine: 'fusion', alternatives: [
      A('safe',     'Same dish, presentation upgrade',          'Already strong. Plate it more dramatically.'),
      A('medium',   'Tartare with tsukemono pickles (Kaji)',    'Kaji had this with pickles and cured yolk. Different texture profile.'),
      A('creative', 'Tartare with Cyprus pickles and koji oil', 'Cypriot pickled vegetables and aged soy oil. Bridge.', { cy: true }),
    ]},
    { name: 'Fried Calamari', price: 14, ingredients: 'Chimichurri, chipotle.', cuisine: 'latam', alternatives: [
      A('safe',     'Same with togarashi salt',                 'Add Japanese 7-spice salt to the dust. Tiny lift.'),
      A('medium',   'Calamari katsu, ginger chimichurri',       'Panko coated, served with chimichurri-ginger dip.'),
      A('creative', 'Calamari with halloumi crumb',             'Crushed halloumi in the dredge, lemon-ponzu mayo.', { cy: true }),
    ]},
    { name: 'Prawns Tempura (4pcs)', price: 12, ingredients: 'Sweet chilli.', cuisine: 'jp', alternatives: [
      A('safe',     'Same with yuzu-chilli sauce',              'Slightly sharper than sweet chilli.'),
      A('medium',   'Rock shrimp tempura',                      'Smaller, popcorn-style, creamy sauce. Nobu staple.'),
      A('creative', 'Prawns kataifi',                           'Wrapped in kataifi instead of tempura batter. Cypriot crunch.', { cy: true }),
    ]},
    { name: 'Pork Quesadillas', price: 10, ingredients: 'Mole, cheddar.', cuisine: 'latam', alternatives: [
      A('safe',     'Carnitas Quesadillas (Kaji recipe)',       'Replace with Kaji original: pulled pork, mole roja, cheese. Same idea, better recipe.'),
      A('medium',   'Pork belly quesadilla, miso glaze',        'Miso glazed pork belly instead of mole. More Nikkei.'),
      A('creative', 'Souvla pork quesadilla',                   'Cyprus souvla pork, halloumi, mole. Pure bridge dish.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Edamame two ways',          'Salt and spicy. Filler that costs nothing.', { price: 6, v: true }),
    C('new-creative', 'Halloumi tataki',           'Halloumi seared like tataki, ponzu, sesame, microherbs. Strong Cyprus signature.', { price: 12, cy: true }),
    C('kaji',         'Seafood Harumaki',          'Shrimp, scallops, cream cheese, ponzu aioli. Kaji.', { price: 7, source: 'Kaji' }),
    C('kaji',         'Aguachile',                 'Shrimps, cucumber, jalapeño, soaked onion. Mexican-Nikkei.', { price: 9, source: 'Kaji' }),
    C('inspired',     'Black cod butter lettuce',  'Iconic Nobu dish, eaten in lettuce cups. The bestseller everywhere Nobu has opened.', { price: 28, source: 'Matsuhisa Limassol' }),
    C('inspired',     'Shimeji tacos with spicy lemon dressing', 'Mushroom tacos, fully vegetarian. Easy upsell.', { price: 15, source: 'Matsuhisa Limassol', v: true }),
  ]},

  { section: 'Tacos', items: [
    { name: 'Vegan Tacos (2pcs)', price: 12.5, ingredients: 'Oyster mushrooms, umami glaze, tahini.', cuisine: 'fusion', vegan: true, alternatives: [
      A('safe',     'Same, drop the tahini',                    'Tahini fights with the umami glaze. Replace with sesame oil drizzle.', { v: true }),
      A('medium',   'Smoked mushroom tacos, miso crema',        'Cashew-miso crema instead of tahini. Cleaner profile.', { v: true }),
      A('creative', 'Cyprus mushroom tacos',                    'Local wild mushrooms, carob glaze, fennel. Vegan.', { cy: true, v: true }),
    ]},
    { name: 'Tuna Tartare Tacos (2pcs)', price: 14, ingredients: 'Cilantro, sesame, crispy onions.', cuisine: 'fusion', alternatives: [
      A('safe',     'Same dish, hero',                          'Already a flagship Kaji-style dish. Do not touch.'),
      A('medium',   'Tuna tartare tacos with avocado mousse',   'Add avocado mousse base. Kaji used this.'),
      A('creative', 'Tuna tartare in kataifi taco shell',       'Replace nori taco with crispy kataifi nest.', { cy: true }),
    ]},
    { name: 'Salmon Tacos (2pcs)', price: 12.5, ingredients: 'Radish, citrus, chives, ginger mayo.', cuisine: 'fusion', alternatives: [
      A('safe',     'Same with yuzu-citrus emulsion',           'Sharper citrus profile.'),
      A('medium',   'Aburi salmon tacos',                       'Torched salmon, ginger mayo, ikura.'),
      A('creative', 'Salmon tacos with Cyprus citrus salsa',    'Bitter orange salsa from Cyprus.', { cy: true }),
    ]},
    { name: 'Beef Devesa Tacos (2pcs)', price: 15, ingredients: 'Asian slaw, ginger, cilantro.', cuisine: 'fusion', alternatives: [
      A('safe',     'Same dish, hero',                          'Already excellent. Mark hero.'),
      A('medium',   'Wagyu tacos with onion-soy',               'Upgrade beef to wagyu. Matsuhisa price benchmark €85 for 8pc.'),
      A('creative', 'Souvla beef taco with halloumi crema',     'Cyprus souvla style beef, halloumi crema, mint.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Chicken anticucho tacos',   'Easy crowd item, simpler than tartare tacos.', { price: 11 }),
    C('new-creative', 'Halloumi tacos',            'Crispy halloumi, mango salsa, ginger mayo. Vegetarian Cyprus signature.', { price: 12, cy: true }),
    C('kaji',         'Tuna Crispy Tacos',         'Tuna tartare, cilantro, sesame, crispy onion. Kaji original.', { price: 14, source: 'Kaji' }),
    C('kaji',         'DIY Tortillas',             'Sharing plate: smoked pork, cilantro salad, avocado mousse, tomatillo verde, salsa roja, pico de gallo. Theatrical Kaji centrepiece.', { price: 38, source: 'Kaji' }),
    C('inspired',     'Tacos with chicken and anticucho (4pc)', 'Matsuhisa Limassol staple. Direct competitive item.', { price: 16, source: 'Matsuhisa Limassol' }),
  ]},

  { section: 'Anticucho and Yakitori', items: [
    { name: 'Grilled Asparagus (1pc)', price: 6.5, ingredients: 'Sesame praline, roasted almonds.', cuisine: 'jp', vegan: true, alternatives: [
      A('safe',     'Same dish, hero',                          'Already on the Kaji menu and on the current menu. Keep.', { v: true }),
      A('medium',   'Asparagus with miso butter',               'Miso butter glaze, sesame praline, lemon zest.'),
      A('creative', 'Asparagus with Cyprus carob molasses',     'Carob molasses-soy glaze, almond crumble.', { cy: true, v: true }),
    ]},
    { name: 'Grilled Shrimps (1pc)', price: 6.5, ingredients: 'Yuzu kosho, chives.', cuisine: 'jp', alternatives: [
      A('safe',     'Same dish, hero',                          'Already excellent.'),
      A('medium',   'Shrimps with den miso',                    'Den miso glaze, scallion. Robata style.'),
      A('creative', 'Shrimps with Cyprus pepper sauce',         'Roasted Cyprus chilli pepper paste, lime.', { cy: true }),
    ]},
    { name: 'Chicken Yakitori (2pcs)', price: 8, ingredients: 'Sesame seeds, cilantro.', cuisine: 'jp', alternatives: [
      A('safe',     'Tare-glazed yakitori (Kaji style)',        'Move from sesame to tare glaze. More authentic.'),
      A('medium',   'Negima yakitori (chicken and leek)',       'Classic combo with leek between pieces.'),
      A('creative', 'Chicken yakitori with halloumi crumble',   'Halloumi crumble dust on top.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Wild mushroom skewer',      'Ponzu butter glaze. Crowd vegetarian.', { price: 5, v: true }),
    C('new-creative', 'Halumiyaki (halloumi yakitori)', 'Halloumi, teriyaki glaze, kimchi sesame. The Cyprus bridge dish that already worked at Kaji.', { price: 4, cy: true, source: 'Kaji' }),
    C('kaji',         'Iberico Neck',              'Oyster sauce glaze, onion crumble. Kaji premium skewer.', { price: 6, source: 'Kaji' }),
    C('kaji',         'Octopus skewer',            'Den miso, negi. Kaji classic.', { price: 6, source: 'Kaji' }),
    C('kaji',         'Striploin anticucho',       'Dry aged striploin, pico de gallo. Kaji.', { price: 8.5, source: 'Kaji' }),
    C('kaji',         'Rib-eye anticucho',         'Citrus dressing, sunflower seeds. Kaji premium.', { price: 9.5, source: 'Kaji' }),
    C('kaji',         'Chicken wings (Kaji)',      'Shisho dressing. Crowd item.', { price: 3.2, source: 'Kaji' }),
    C('kaji',         'Calamari skewer',           'Squid, ginger, chilli dipper.', { price: 4.8, source: 'Kaji' }),
  ]},

  { section: 'Gyoza', items: [
    { name: 'Prawn Gyoza (4pcs)', price: 12, ingredients: 'Prawn, celeriac, soy yuzu sauce, sesame.', cuisine: 'jp', alternatives: [
      A('safe',     'Same, plating refresh',                    'Strong already.'),
      A('medium',   'Crispy-skirt prawn gyoza',                 'Pan fried with the crispy lace skirt connecting them.'),
      A('creative', 'Prawn gyoza with anari and dill',          'Anari ricotta and dill in the filling. Cypriot pelmeni vibe.', { cy: true }),
    ]},
    { name: 'Beef Gyoza (4pcs)', price: 12, ingredients: 'Sirloin, celeriac, soy yuzu sauce, chives.', cuisine: 'jp', alternatives: [
      A('safe',     'Same, plating refresh',                    'Strong already.'),
      A('medium',   'Wagyu gyoza',                              'Upgrade beef to wagyu, charge €16.'),
      A('creative', 'Souvla beef gyoza',                        'Cyprus souvla seasoning in the filling, mint dipping sauce.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Vegetable gyoza',           'Mushroom and cabbage, ginger ponzu. Vegetarian gap.', { price: 10, v: true }),
    C('new-creative', 'Halloumi and spinach gyoza', 'Halloumi and wilted spinach filling, lemon ponzu.', { price: 11, cy: true }),
  ]},

  { section: 'Mains (Ventuno Special)', items: [
    { name: 'Baby Calamari Risotto', price: 18, ingredients: 'Roasted pepper coulis, lime.', cuisine: 'it', alternatives: [
      A('safe',     'Risotto with dashi base',                  'Replace stock with dashi. Same plate, more umami.'),
      A('medium',   'Squid ink risotto, miso butter',           'Black risotto, calamari on top, miso butter finish.'),
      A('creative', 'Cyprus seafood arroz Nikkei',              'Saffron-dashi arroz with calamari, prawn, mussels. Med-Nikkei.', { cy: true }),
    ]},
    { name: 'Beef Angus Sirloin (160gr)', price: 28, ingredients: 'Oyster mushrooms, chimichurri.', cuisine: 'eu', alternatives: [
      A('safe',     'Same with yuzu chimichurri',               'Add yuzu juice to chimichurri. Tiny shift, big effect.'),
      A('medium',   'Sirloin with truffle ponzu and ponzu butter', 'Replace chimichurri with truffle ponzu glaze.'),
      A('creative', 'Sirloin with Cyprus tahini-miso glaze',    'Cypriot tahini blended with white miso for a lacquer.', { cy: true }),
    ]},
    { name: 'Beef Angus Mini Burgers (2pcs)', price: 12, ingredients: 'Caramelised onion, cheddar cheese.', cuisine: 'eu', alternatives: [
      A('safe',     "3B's burger (Kaji recipe)",                'Replace with Kaji original: angus, cheddar, secret sauce.'),
      A('medium',   'Wagyu sliders, kewpie aioli',              'Upgrade beef to wagyu, kewpie-yuzu aioli.'),
      A('creative', 'Halloumi-glazed sliders',                  'Halloumi cap melted on top, miso ketchup.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Black cod miso (small portion)', 'The single most copied Nikkei dish on earth. Smaller portion at €22 is a competitive entry point.', { price: 22, source: 'Matsuhisa Limassol' }),
    C('new-creative', 'Cyprus sea bream donabe',   'Whole local sea bream, dashi-tomato broth, anari dumplings.', { price: 32, cy: true }),
    C('kaji',         'Duck Mazemen',              'Egg noodles, truffle, burned panko. Kaji signature pasta substitute. Solves the pasta question.', { price: 16, source: 'Kaji' }),
    C('inspired',     'Wagyu beef tacos',          'Onion soy sauce, 100gr wagyu in 8 pieces. Matsuhisa Limassol charges €85.', { price: 65, source: 'Matsuhisa Limassol' }),
  ]},

  { section: 'Pinsa', items: [
    { name: 'Margarita', price: 12, ingredients: 'Tomato salsa, mozzarella, parmesan.', cuisine: 'it', recommendRemove: true, alternatives: [
      A('safe',     'Replace mozzarella with anari',            'Cypriot anari instead of mozzarella, same style.', { cy: true }),
      A('medium',   'Miso butter and tomato pinsa',             'Tomato salsa, miso butter, basil. Vegetarian.'),
      A('creative', 'Halumi-pinsa with sumac and mint',         'Halloumi, sumac, mint, lemon. Pure Cyprus.', { cy: true }),
    ]},
    { name: 'Wild Mushrooms', price: 15, ingredients: 'Tomato salsa, truffle, mozzarella.', cuisine: 'it', recommendRemove: true, alternatives: [
      A('safe',     'Same, drop tomato',                        'Mushroom-truffle pinsa, no tomato. Cleaner.'),
      A('medium',   'Mushroom and miso butter pinsa',           'Replace mozzarella with miso butter and shiitake.'),
      A('creative', 'Cyprus mushroom and anari pinsa',          'Local wild mushrooms, anari, truffle.', { cy: true }),
    ]},
    { name: 'Diavola', price: 14, ingredients: 'Chilli, mozzarella, spianata.', cuisine: 'it', recommendRemove: true, alternatives: [
      A('safe',     'Diavola with togarashi',                   'Add Japanese 7-spice on top.'),
      A('medium',   'Spicy nduja and yuzu pinsa',               'Nduja, yuzu zest, mozzarella.'),
      A('creative', 'Loukaniko pinsa',                          'Cyprus loukaniko sausage, kimchi, mozzarella.', { cy: true }),
    ]},
    { name: 'Prosciutto', price: 15, ingredients: 'Tomato salsa, mozzarella, arugula, prosciutto.', cuisine: 'it', recommendRemove: true, alternatives: [
      A('safe',     'Iberico ham pinsa',                        'Swap prosciutto for iberico (Kaji used iberico).'),
      A('medium',   'Lountza pinsa',                            'Cyprus lountza cured pork instead of prosciutto.', { cy: true }),
      A('creative', 'Aburi salmon pinsa',                       'Torched salmon, kewpie, scallion.', { cy: false }),
    ]},
  ], candidates: [
    C('new-safe',     'Anari and honey pinsa',     'Cypriot anari, thyme honey, walnuts. Light vegetarian.', { price: 13, cy: true }),
    C('new-creative', 'Okonomiyaki-style pinsa',   'Cabbage, bonito, kewpie, takoyaki sauce on pinsa base. Bridge between pinsa and Japanese.', { price: 14 }),
  ]},

  { section: 'Sides and Dips', items: [
    { name: 'Steamed Rice', price: 5, ingredients: '', cuisine: 'jp', vegan: true, alternatives: [
      A('safe',     'Steamed rice with negi oil (Kaji)',        'Slight upgrade: scallion oil drizzle.', { v: true }),
      A('medium',   'Garlic fried rice',                        'Classic Nikkei side, more substantial.', { v: true }),
      A('creative', 'Cyprus pourgouri pilafi',                  'Cracked wheat pilaf instead of rice. Cyprus staple.', { cy: true, v: true }),
    ]},
    { name: 'Mexican Wedges', price: 5, ingredients: '', cuisine: 'latam', recommendRemove: true, alternatives: [
      A('safe',     'Cyprus potato wedges, togarashi',          'Cypriot potatoes, Japanese 7-spice, lemon. Less generic.', { cy: true, v: true }),
      A('medium',   'Furikake fries',                           'Crispy fries with furikake and kewpie.', { v: true }),
      A('creative', 'Loaded fries with halumiyaki',             'Fries topped with diced halumiyaki, kimchi mayo.', { cy: true }),
    ]},
    { name: 'Tostadas Chips', price: 12, ingredients: 'Guacamole and sour cream.', cuisine: 'latam', alternatives: [
      A('safe',     'Same with smoked paprika dust (Kaji)',     'Kaji had this with smoked paprika.'),
      A('medium',   'Tostadas with avocado mousse and salsa roja', 'Replace sour cream with avocado mousse (Kaji style).', { v: true }),
      A('creative', 'Pita chips with tahini and tomatillo',     'Cypriot pita instead of tortilla.', { cy: true, v: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Edamame',                   'Salt or spicy. Cheap to add, never on the wrong table.', { price: 6, v: true }),
    C('new-creative', 'Halloumi fries',            'Halloumi sticks, panko, miso aioli.', { price: 8, cy: true }),
    C('kaji',         'Avocado mousse',            'Smooth, served with everything. Kaji had this as a €2.5 side.', { price: 3, source: 'Kaji', v: true }),
  ]},

  { section: 'Dessert', items: [
    { name: 'Lemon Tart', price: 8, ingredients: 'Butter crumble, mint, meringues.', cuisine: 'eu', alternatives: [
      A('safe',     'Same, refresh plating',                    'Already pleasant. Just plate it cleaner.'),
      A('medium',   'Yuzu tart',                                'Replace lemon with yuzu, miso crumble. Same tart, Japanese accent.'),
      A('creative', 'Lemon-anari tart with mastiha',            'Cyprus lemon, anari ricotta filling, mastiha (Greek/Cypriot resin) glaze.', { cy: true }),
    ]},
    { name: 'Dubai Churros', price: 9, ingredients: 'Pistachio ice cream, kataifi, caramel, chocolate.', cuisine: 'me', alternatives: [
      A('safe',     'Same, hero',                               'Already on theme and a bestseller. Keep as is, mark hero.'),
      A('medium',   'Churros with miso caramel',                'Add miso to the caramel for depth.'),
      A('creative', 'Loukoumades with miso caramel and matcha', 'Cypriot loukoumades instead of churros.', { cy: true }),
    ]},
    { name: 'Tiramisu', price: 8, ingredients: '', cuisine: 'it', recommendRemove: true, alternatives: [
      A('safe',     'Hojicha tiramisu',                         'Replace coffee with roasted green tea. Same dessert, Japanese soul.'),
      A('medium',   'Matcha tiramisu',                          'Bolder. Matcha and mascarpone.'),
      A('creative', 'Mahalepi tiramisu',                        'Cypriot mahalepi rosewater pudding layered like tiramisu.', { cy: true }),
    ]},
    { name: 'Choco Cremeux', price: 9, ingredients: 'Strawberries, soya caramel, caramelised nuts (Kaji recipe).', cuisine: 'eu', alternatives: [
      A('safe',     'Same, hero (Kaji original)',               'Kaji had this exactly. Keep, mark hero.'),
      A('medium',   'Cremeux with miso caramel',                'Adapt the soy caramel to a miso caramel.'),
      A('creative', 'Carob cremeux',                            'Cyprus carob instead of chocolate. Distinctively local.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Mochi ice cream selection', 'Three mochi: matcha, sesame, mango. Easy crowdpleaser.', { price: 8, v: true }),
    C('new-creative', 'Anari cheesecake with carob', 'Anari ricotta cheesecake, carob caramel, sesame crunch. Cyprus star dessert.', { price: 10, cy: true }),
    C('kaji',         'Churros (Kaji recipe)',     'Dulce de leche, choco chipotle ganache. Kaji original recipe.', { price: 6, source: 'Kaji' }),
  ]},

  { section: 'Platters (sharing)', items: [
    { name: 'Meat and Cheese', price: 29, ingredients: '', cuisine: 'eu', recommendRemove: true, alternatives: [
      A('safe',     'Replace with anticucho platter',           'Six skewer mixed platter, much more on theme.'),
      A('medium',   'Cyprus meze platter, Nikkei style',        'Halumiyaki, Cyprus pickles, lountza, anari, miso aubergine.', { cy: true }),
      A('creative', 'Drop entirely, redirect to Anticucho Platter (see Sushi Platters)', 'This is the cheese platter you flagged. Best to remove.'),
    ]},
    { name: 'Second Platter (TBC)', price: 29, ingredients: 'Menu was cut off in the photo, fill in.', cuisine: 'none', recommendRemove: true, alternatives: [
      A('safe',     'Sashimi sharing platter',                  'Mixed sashimi 18pcs.'),
      A('medium',   'Robata sharing platter',                   'Mixed grilled seafood and meats.'),
      A('creative', '21 Cyprus Tasting',                        'Halumiyaki, sea bream nigiri, halloumi taco, octopus tataki, anari roll. The signature platter.', { cy: true }),
    ]},
  ], candidates: [
    C('new-safe',     'Sashimi sharing 18pcs',     'Standard.', { price: 38 }),
    C('new-creative', 'Robata mixed grill platter', 'Wagyu, octopus, halumiyaki, asparagus, mushroom. Sharing.', { price: 48, cy: true }),
  ]},

  { section: 'New: Ceviche and Tiradito (proposed section)', items: [], candidates: [
    C('new-safe',     'Classic ceviche',           'White fish, tigers milk, sweet potato, corn. Peruvian textbook.', { price: 13 }),
    C('new-creative', 'Anari ceviche',             'Vegetarian: anari ricotta, leche de tigre, jalapeño, sweet potato.', { price: 12, cy: true, v: true }),
    C('kaji',         'Ceviche C.O.D',             'Cod, tigers milk, basil oil, citrus. Kaji had this.', { price: 12, source: 'Kaji' }),
    C('kaji',         'Aguachile',                 'Shrimps, cucumber, jalapeño, soaked onion.', { price: 9, source: 'Kaji' }),
    C('inspired',     'Lobster ceviche with quinoa', 'Premium tier ceviche.', { price: 38, source: 'Matsuhisa Limassol' }),
    C('inspired',     'Tomato ceviche with quinoa', 'Vegan. Cyprus tomatoes shine here.', { price: 14, source: 'Matsuhisa Limassol', v: true }),
  ]},

  { section: 'New: Robata and Donburi (proposed section)', items: [], candidates: [
    C('new-safe',     'Salmon teriyaki donburi',   'Rice bowl, glazed salmon, pickles, egg.', { price: 16 }),
    C('new-creative', 'Anticucho donburi',         'Rice bowl with mixed Kaji-style anticucho on top.', { price: 18 }),
    C('kaji',         'Duck Mazemen',              'The pasta substitute. Egg noodles, truffle, burned panko.', { price: 16, source: 'Kaji' }),
    C('inspired',     'Black cod donburi',         'Cheaper way to put black cod on the menu.', { price: 24, source: 'Matsuhisa Limassol' }),
  ]},
];

const seed = () => initialMenu.map((s) => ({
  id: uid('sec'),
  section: s.section,
  items: s.items.map((it) => ({
    id: uid('it'),
    status: 'pending',
    notes: '',
    tweak: '',
    vegan: !!it.vegan,
    recommendRemove: !!it.recommendRemove,
    selectedAlt: null,
    ...it,
  })),
  candidates: s.candidates || [],
}));

export default function MenuWorkshop() {
  const [data, setData] = useState(seed());
  const [theme, setTheme] = useState('nikkei_cy');
  const [filter, setFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [veganOnly, setVeganOnly] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.data && Array.isArray(parsed.data) && parsed.data.every(s =>
          s && Array.isArray(s.items) && s.items.every(it =>
            it && typeof it.cuisine === 'string' && CUISINE[it.cuisine]
          )
        )) {
          setData(parsed.data);
        }
        if (parsed.theme && THEMES.find(t => t.id === parsed.theme)) {
          setTheme(parsed.theme);
        }
      }
    } catch (e) {
      // first run or corrupt data, use seed
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, theme }));
    } catch (e) {
      console.error('Save failed', e);
    }
  }, [data, theme, loaded]);

  const stats = useMemo(() => {
    const counts = { total: 0, pending: 0, aligned: 0, tweak: 0, drop: 0, hero: 0 };
    const cuisines = { jp: 0, latam: 0, it: 0, eu: 0, fusion: 0, me: 0, none: 0 };
    let removeCount = 0, veganCount = 0, cypriotAlts = 0, addedCands = 0, picked = 0;
    data.forEach((s) => {
      s.items.forEach((it) => {
        counts.total++;
        counts[it.status] = (counts[it.status] || 0) + 1;
        cuisines[it.cuisine] = (cuisines[it.cuisine] || 0) + 1;
        if (it.recommendRemove) removeCount++;
        if (it.vegan) veganCount++;
        if (it.selectedAlt) picked++;
        (it.alternatives || []).forEach((a) => { if (a.cypriot) cypriotAlts++; });
      });
      (s.candidates || []).forEach((c) => { if (c.added) addedCands++; });
    });
    return { counts, cuisines, removeCount, veganCount, cypriotAlts, addedCands, picked };
  }, [data]);

  const updateItem = (sectionId, itemId, patch) => {
    setData((prev) => prev.map((s) =>
      s.id !== sectionId ? s : { ...s, items: s.items.map((it) => it.id !== itemId ? it : { ...it, ...patch }) }
    ));
  };

  const deleteItem = (sectionId, itemId) => {
    setData((prev) => prev.map((s) =>
      s.id !== sectionId ? s : { ...s, items: s.items.filter((it) => it.id !== itemId) }
    ));
  };

  const updateCandidate = (sectionId, candId, patch) => {
    setData((prev) => prev.map((s) =>
      s.id !== sectionId ? s : { ...s, candidates: s.candidates.map((c) => c.id !== candId ? c : { ...c, ...patch }) }
    ));
  };

  const addItem = (sectionId) => {
    const newItem = {
      id: uid('it'),
      name: 'New item',
      price: 0,
      ingredients: '',
      cuisine: 'none',
      status: 'pending',
      notes: '',
      tweak: '',
      vegan: false,
      recommendRemove: false,
      selectedAlt: null,
      alternatives: [],
    };
    setData((prev) => prev.map((s) =>
      s.id !== sectionId ? s : { ...s, items: [...s.items, newItem] }
    ));
    setEditingId(newItem.id);
  };

  const reset = () => {
    if (window.confirm('Wipe all changes and reload original menu plus suggestions? This cannot be undone.')) {
      setData(seed());
      setTheme('nikkei_cy');
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ theme, data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventuno_menu_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const matchFilters = (it) =>
    (filter === 'all' || it.status === filter) &&
    (cuisineFilter === 'all' || it.cuisine === cuisineFilter) &&
    (!veganOnly || it.vegan);

  const toggleCollapsed = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-500" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Loading workshop…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; font-feature-settings: "ss01", "ss02"; }
        .ink-rule { background: linear-gradient(90deg, transparent, #1c1917 30%, #1c1917 70%, transparent); height: 1px; }
        .paper { background-color: #faf7f2; background-image: radial-gradient(circle at 20% 10%, rgba(132, 130, 100, 0.06), transparent 40%), radial-gradient(circle at 80% 90%, rgba(132, 130, 100, 0.06), transparent 40%); }
        select, input, textarea { font-family: inherit; }
        textarea { resize: vertical; }
        .hairline { border-top: 1px dashed rgba(28, 25, 23, 0.2); }
      `}</style>

      <header className="paper border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="text-xs tracking-[0.3em] text-emerald-800 uppercase mb-2">Kaimakki Studio · Menu Workshop</div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-stone-900 leading-none">21 Ventuno</h1>
              <p className="font-display italic text-emerald-800 mt-2 text-base sm:text-lg">Nikkei foundation + Cypriot touches</p>
            </div>
            <div className="flex flex-col gap-3 items-stretch sm:items-end w-full sm:w-auto">
              <div className="flex gap-2 flex-wrap">
                <button onClick={exportData} className="flex items-center gap-2 px-3 py-2 bg-stone-900 text-stone-50 text-sm hover:bg-stone-700 transition rounded">
                  <Download size={14}/> Export JSON
                </button>
                <button onClick={reset} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-300 text-stone-700 text-sm hover:bg-stone-100 transition rounded">
                  <RotateCcw size={14}/> Reset
                </button>
              </div>
              <div className="bg-white border border-stone-300 rounded-lg p-3 w-full sm:max-w-md">
                <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1">
                  <ExternalLink size={10}/> Reference menus
                </div>
                <ul className="space-y-1">
                  {REFERENCES.map((r) => (
                    <li key={r.url} className="text-xs">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-emerald-800 hover:text-emerald-900 hover:underline">
                        {r.name}
                      </a>
                      {r.note && <span className="text-stone-500"> · {r.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <StatCard label="Items total" value={stats.counts.total} accent="bg-stone-900"/>
            <StatCard label="On theme" value={stats.counts.aligned || 0} accent="bg-emerald-600"/>
            <StatCard label="Needs tweak" value={stats.counts.tweak || 0} accent="bg-amber-500"/>
            <StatCard label="Marked remove" value={stats.removeCount} accent="bg-rose-600"/>
            <StatCard label="Hero" value={stats.counts.hero || 0} accent="bg-indigo-600"/>
            <StatCard label="Alts picked" value={stats.picked} accent="bg-violet-600"/>
            <StatCard label="Cands. added" value={stats.addedCands} accent="bg-teal-600"/>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-widest text-stone-500 mr-1">Cuisine mix:</span>
            {Object.entries(stats.cuisines).filter(([, v]) => v > 0).map(([k, v]) => {
              const meta = CUISINE[k] || CUISINE.none;
              return (
                <span key={k} className={`text-xs px-2 py-1 border rounded-full ${meta.color}`}>
                  {meta.label} · {v}
                </span>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-widest text-stone-500 mr-1">Filter:</span>
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All status</FilterChip>
            {Object.entries(STATUS).map(([k, v]) => (
              <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>
                <span className={`inline-block w-2 h-2 rounded-full ${v.dot} mr-1.5`}/>{v.label}
              </FilterChip>
            ))}
            <span className="w-px h-5 bg-stone-300 mx-2"/>
            <FilterChip active={cuisineFilter === 'all'} onClick={() => setCuisineFilter('all')}>All cuisines</FilterChip>
            {Object.entries(CUISINE).map(([k, v]) => (
              stats.cuisines[k] > 0 ? (
                <FilterChip key={k} active={cuisineFilter === k} onClick={() => setCuisineFilter(k)}>{v.label}</FilterChip>
              ) : null
            ))}
            <span className="w-px h-5 bg-stone-300 mx-2"/>
            <FilterChip active={veganOnly} onClick={() => setVeganOnly(!veganOnly)}>
              <Leaf size={11} className="inline mr-1"/> Vegan only
            </FilterChip>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-10">
        {data.map((section) => {
          const visibleItems = section.items.filter(matchFilters);
          const isCollapsed = collapsed[section.id];
          if ((filter !== 'all' || cuisineFilter !== 'all' || veganOnly) && visibleItems.length === 0 && (section.candidates || []).length === 0) return null;
          return (
            <section key={section.id} className="bg-white border border-stone-300 rounded-lg overflow-hidden">
              <button onClick={() => toggleCollapsed(section.id)} className="w-full flex items-center justify-between px-5 py-4 bg-emerald-800 text-stone-50 hover:bg-emerald-900 transition">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-xl tracking-wide">{section.section}</span>
                  <span className="text-xs uppercase tracking-widest opacity-70">
                    {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
                    {section.candidates?.length > 0 && ` · ${section.candidates.length} candidates`}
                  </span>
                </div>
                <span className="text-xs">{isCollapsed ? '▼ show' : '▲ hide'}</span>
              </button>
              {!isCollapsed && (
                <div className="divide-y divide-stone-200">
                  {visibleItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      editing={editingId === item.id}
                      onEditStart={() => setEditingId(item.id)}
                      onEditEnd={() => setEditingId(null)}
                      onUpdate={(patch) => updateItem(section.id, item.id, patch)}
                      onDelete={() => deleteItem(section.id, item.id)}
                    />
                  ))}
                  {visibleItems.length === 0 && section.items.length === 0 && (
                    <div className="px-5 py-8 text-center text-stone-500 italic font-display">
                      Empty section. Pick from candidates below to populate.
                    </div>
                  )}
                  <CandidateGroup
                    section={section}
                    onUpdate={(candId, patch) => updateCandidate(section.id, candId, patch)}
                  />
                  <div className="p-3 bg-stone-50">
                    <button onClick={() => addItem(section.id)} className="text-sm text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5">
                      <Plus size={14}/> Add custom item
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        <footer className="text-center py-12">
          <div className="ink-rule mx-auto w-32 mb-4"/>
          <p className="font-display italic text-stone-500">
            All edits autosave. Pick alternatives to transform items, mark candidates to add new ones.
          </p>
        </footer>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-stone-300 rounded p-3 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`}/>
      <div className="text-3xl font-display font-medium ml-2">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-stone-500 ml-2 mt-0.5">{label}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`text-xs px-2.5 py-1 rounded-full border transition ${active ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'}`}>
      {children}
    </button>
  );
}

function VeganPill() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-50 text-green-800 border border-green-300">
      <Leaf size={9}/> Vegan
    </span>
  );
}

function CypriotFlag({ size = 12 }) {
  return <span title="Cypriot signature" style={{ fontSize: size + 'px' }}>🇨🇾</span>;
}

function RemovePill() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
      <Ban size={9}/> Recommend remove
    </span>
  );
}

function ItemCard({ item, sectionId, editing, onEditStart, onEditEnd, onUpdate, onDelete }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => { setDraft(item); }, [item.id, editing]);

  const status = STATUS[item.status] || STATUS.pending;
  const cuisine = CUISINE[item.cuisine] || CUISINE.none;

  return (
    <div className={`p-4 sm:p-5 transition ${item.recommendRemove ? 'bg-rose-50/30' : 'hover:bg-stone-50/50'}`}>
      <div className="space-y-4">

        {editing ? (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="flex-1 min-w-[200px] font-display text-lg border-b border-stone-300 pb-1 focus:outline-none focus:border-emerald-700 bg-transparent" placeholder="Dish name"/>
              <div className="flex items-center gap-1">
                <span className="text-stone-500">€</span>
                <input type="number" step="0.5" value={draft.price} onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })} className="w-16 font-display text-lg border-b border-stone-300 pb-1 focus:outline-none focus:border-emerald-700 bg-transparent text-right"/>
              </div>
            </div>
            <textarea value={draft.ingredients} onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} rows={2} className="w-full text-sm text-stone-600 border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-700" placeholder="Ingredients and preparation notes"/>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
              <h3 className="font-display text-xl text-stone-900">{item.name}</h3>
              <span className="font-display text-xl text-stone-500">€{item.price}</span>
              {item.vegan && <VeganPill/>}
              {item.recommendRemove && <RemovePill/>}
              {item.selectedAlt && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-800 border border-violet-300 inline-flex items-center gap-1">
                  <Sparkles size={9}/> Alt picked
                </span>
              )}
            </div>
            {item.ingredients && <p className="text-sm text-stone-600 italic mt-1">{item.ingredients}</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <select value={item.status} onChange={(e) => onUpdate({ status: e.target.value })} className={`text-xs px-2 py-1 rounded-full border focus:outline-none ${status.pill}`}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={item.cuisine} onChange={(e) => onUpdate({ cuisine: e.target.value })} className={`text-xs px-2 py-1 rounded-full border focus:outline-none ${cuisine.color}`}>
            {Object.entries(CUISINE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button
            onClick={() => onUpdate({ vegan: !item.vegan })}
            title="Toggle vegan"
            className={`text-xs px-2 py-1 rounded-full border ${item.vegan ? 'bg-green-50 text-green-800 border-green-300' : 'bg-white text-stone-500 border-stone-300'}`}
          >
            <Leaf size={11} className="inline"/>
          </button>
          <button
            onClick={() => onUpdate({ recommendRemove: !item.recommendRemove })}
            title="Toggle recommend remove"
            className={`text-xs px-2 py-1 rounded-full border ${item.recommendRemove ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-white text-stone-500 border-stone-300'}`}
          >
            <Ban size={11} className="inline"/>
          </button>
          <div className="flex-1"/>
          {editing ? (
            <>
              <button onClick={() => { onUpdate(draft); onEditEnd(); }} className="text-emerald-800 hover:text-emerald-900 p-1" title="Save"><Check size={16}/></button>
              <button onClick={onEditEnd} className="text-stone-500 hover:text-stone-700 p-1" title="Cancel"><X size={16}/></button>
            </>
          ) : (
            <>
              <button onClick={onEditStart} className="text-stone-500 hover:text-stone-900 p-1" title="Edit"><Edit3 size={14}/></button>
              <button onClick={onDelete} className="text-stone-400 hover:text-rose-600 p-1" title="Delete"><Trash2 size={14}/></button>
            </>
          )}
        </div>

        {item.alternatives && item.alternatives.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
              <span className="hairline flex-1"/>
              <span>Alternatives</span>
              <span className="hairline flex-1"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {item.alternatives.map((alt) => (
                <AlternativeCard
                  key={alt.id}
                  alt={alt}
                  selected={item.selectedAlt === alt.id}
                  onSelect={() => onUpdate({ selectedAlt: item.selectedAlt === alt.id ? null : alt.id })}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-1 flex items-center gap-1">
              <AlertCircle size={10}/> Notes
            </label>
            <textarea value={item.notes} onChange={(e) => onUpdate({ notes: e.target.value })} rows={2} placeholder="Why is this on the menu? Bestseller? Cost concern?" className="w-full text-sm border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-700 bg-stone-50/50"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-1 flex items-center gap-1">
              <Star size={10}/> Custom tweak
            </label>
            <textarea value={item.tweak} onChange={(e) => onUpdate({ tweak: e.target.value })} rows={2} placeholder="Your own idea, beyond the three above" className="w-full text-sm border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-700 bg-stone-50/50"/>
          </div>
        </div>

      </div>
    </div>
  );
}

function AlternativeCard({ alt, selected, onSelect }) {
  const meta = ALT_LEVELS[alt.level] || ALT_LEVELS.safe;
  const Icon = meta.Icon;
  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-lg border-2 p-3 transition ${selected ? `${meta.border} ${meta.soft} ring-2 ring-offset-1 ring-emerald-400` : `border-stone-200 bg-white hover:border-stone-500`}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1 ${meta.text}`}>
          <Icon size={11}/> {meta.label}
        </span>
        <div className="flex items-center gap-1">
          {alt.cypriot && <CypriotFlag size={12}/>}
          {alt.vegan && <VeganPill/>}
          {selected && <Check size={14} className="text-emerald-700"/>}
        </div>
      </div>
      <div className="font-display text-base text-stone-900 leading-tight mb-1">
        {alt.name}
      </div>
      <div className="text-xs text-stone-600 leading-snug">
        {alt.desc}
      </div>
    </button>
  );
}

function CandidateGroup({ section, onUpdate }) {
  const candidates = section.candidates || [];
  if (candidates.length === 0) return null;

  const grouped = {};
  candidates.forEach((c) => {
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type].push(c);
  });

  const orderedTypes = ['new-safe', 'new-creative', 'kaji', 'inspired'];

  return (
    <div className="bg-stone-50/60 px-5 py-5 border-t border-stone-200">
      <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
        <span className="hairline flex-1"/>
        <Bookmark size={11}/>
        <span>Candidates to add to this section</span>
        <span className="hairline flex-1"/>
      </div>
      {orderedTypes.map((type) => {
        const list = grouped[type];
        if (!list) return null;
        const meta = CAND_TYPES[type] || { label: type, pill: 'bg-stone-50 text-stone-700 border-stone-300' };
        return (
          <div key={type} className="mb-3 last:mb-0">
            <div className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border mb-2 ${meta.pill}`}>
              {meta.label}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((c) => (
                <CandidateCard key={c.id} cand={c} onToggle={() => onUpdate(c.id, { added: !c.added })}/>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CandidateCard({ cand, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`text-left rounded-lg border p-3 transition ${cand.added ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200' : 'border-stone-200 bg-white hover:border-stone-400'}`}
    >
      <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap mb-1">
        <span className="font-display text-base text-stone-900 leading-tight flex-1 min-w-0">
          {cand.name}
        </span>
        {cand.cypriot && <CypriotFlag/>}
        {cand.vegan && <VeganPill/>}
        {cand.price !== null && cand.price !== undefined && (
          <span className="font-display text-sm text-stone-600">€{cand.price}</span>
        )}
        {cand.added
          ? <Check size={14} className="text-emerald-700 self-center"/>
          : <Bookmark size={14} className="text-stone-400 self-center"/>}
      </div>
      <div className="text-xs text-stone-600 leading-snug">
        {cand.desc}
      </div>
      {cand.source && (
        <div className="text-[10px] text-violet-700 mt-2 italic">
          via {cand.source}
        </div>
      )}
    </button>
  );
}
