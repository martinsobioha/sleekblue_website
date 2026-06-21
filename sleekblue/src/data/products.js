// Die Cut Sticker Price Tables — from official Sleekblue price list
// Pattern: 100pcs = base, 500pcs = 10% off unit, 1000pcs = 20% off unit
// Above 1000: 2000+ = 22.5%, 3000+ = 25% (max)

export const STICKER_SIZE_PRICES = {
  '1.5x1.5"': { p100: 3000, p500: 12500, p1000: 20000 },
  '2x2"':     { p100: 3000, p500: 12500, p1000: 20000 },
  '2.5x2.5"': { p100: 4500, p500: 20000, p1000: 35000 },
  '3x3"':     { p100: 5000, p500: 22500, p1000: 40000 },
  '3x4"':     { p100: 6500, p500: 30000, p1000: 55000 },
  '4x4"':     { p100: 9000, p500: 42500, p1000: 80000 },
  '2x8" Water Label': { p100: 9000, p500: 42500, p1000: 80000 },
}

export function calcStickerPrice(size, qty) {
  const s = STICKER_SIZE_PRICES[size] || STICKER_SIZE_PRICES['3x3"']
  const unitAt100  = s.p100  / 100
  const unitAt500  = s.p500  / 500
  const unitAt1000 = s.p1000 / 1000

  let unitPrice, discountRate

  if (qty >= 3000) {
    // Cap at 25% off the 100-piece base unit price
    unitPrice    = unitAt100 * 0.75
    discountRate = 0.25
  } else if (qty >= 2000) {
    unitPrice    = unitAt100 * 0.775
    discountRate = 0.225
  } else if (qty >= 1000) {
    // Use exact listed 1000-pcs unit price
    unitPrice    = unitAt1000
    discountRate = (unitAt100 - unitAt1000) / unitAt100
  } else if (qty >= 500) {
    // Use exact listed 500-pcs unit price
    unitPrice    = unitAt500
    discountRate = (unitAt100 - unitAt500) / unitAt100
  } else {
    unitPrice    = unitAt100
    discountRate = 0
  }

  return { total: Math.round(unitPrice * qty), unitPrice: Math.round(unitPrice * 100) / 100, discountRate }
}

export function getStickerPriceTable(size) {
  const s = STICKER_SIZE_PRICES[size] || STICKER_SIZE_PRICES['3x3"']
  const unitAt100 = s.p100 / 100
  return [
    { qty: 100,  label: '100',    total: s.p100,        unitPrice: unitAt100,          discountRate: 0 },
    { qty: 200,  label: '200',    total: unitAt100*200,  unitPrice: unitAt100,          discountRate: 0 },
    { qty: 500,  label: '500',    total: s.p500,         unitPrice: s.p500/500,         discountRate: (unitAt100 - s.p500/500)  / unitAt100 },
    { qty: 1000, label: '1,000',  total: s.p1000,        unitPrice: s.p1000/1000,       discountRate: (unitAt100 - s.p1000/1000)/ unitAt100 },
    { qty: 2000, label: '2,000',  ...calcStickerPrice(size, 2000) },
    { qty: 3000, label: '3,000+', ...calcStickerPrice(size, 3000) },
  ]
}

const PRODUCT_DETAILS = {
  'die-cut-stickers': {
    description: 'Premium waterproof die-cut stickers cut to any shape. Ideal for product labelling, branding zobo, yoghurt, parfait, bottled drinks, and more.',
    features: ['Waterproof & UV resistant', 'Strong permanent adhesive', 'Cut to any shape or design', 'High-resolution full-colour print', 'Easy to peel and apply', 'Bulk discounts from 500 pcs'],
    badge: 'Most Popular',
    minQty: 500,
  },
  'product-labels': {
    description: 'Professional product labels with vivid printing on premium glossy or matte stocks. Perfect for food products, cosmetics, beverages, and retail items.',
    features: ['Glossy or matte finish', 'Food-safe ink option', 'Custom sizes available', 'Waterproof variants', 'Vibrant full-colour print', 'Fast turnaround'],
    badge: 'Best Seller',
    minQty: 100,
  },
  'flex-banner': {
    description: 'High-quality flex banners for outdoor advertising, events, exhibitions, and promotions. Weather-resistant and long-lasting.',
    features: ['500gsm heavy-duty flex', 'UV resistant inks', 'Hemmed & eyeleted edges', 'Any custom size available', 'Vibrant colour output', 'Fast 24–48hr production'],
    badge: 'Best for Outdoors',
    minQty: 1,
  },
  'billboard': {
    description: 'Large-scale billboard printing for high-traffic outdoor advertising. Maximum visibility, premium print quality.',
    features: ['Heavy-duty material', 'Weather and UV resistant', 'High-resolution print', 'Any custom size', 'Professional installation guide', 'Durable for 12+ months'],
    badge: 'High Impact',
    minQty: 1,
  },
  'sav-printing': {
    description: 'Self-adhesive vinyl (SAV) printing for vehicle graphics, floor decals, walls, windows, and point-of-sale displays.',
    features: ['Pressure-sensitive adhesive', 'Removable or permanent options', 'Indoor and outdoor use', 'Vibrant print quality', 'Easy application', 'Custom cut shapes'],
    badge: 'Versatile',
    minQty: 1,
  },
  'window-graphics': {
    description: 'Eye-catching window graphics for retail shops, offices, restaurants, and vehicles. Perforated or solid vinyl options.',
    features: ['Perforated or frosted options', 'One-way vision available', 'UV resistant print', 'Easy to install & remove', 'Custom sizes & shapes', 'Interior & exterior use'],
    badge: 'Shop Front Ready',
    minQty: 1,
  },
  'reflective-flex': {
    description: 'Reflective flex banners for night-time visibility. Ideal for safety signage, road-facing ads, and 24-hour promotions.',
    features: ['High-visibility at night', 'Grade 1 reflective material', 'Full-colour printing', 'Durable all-weather use', 'Eyelets for easy hanging', 'Custom sizes'],
    badge: '24hr Visibility',
    minQty: 1,
  },
  'rollup-stand': {
    description: 'Portable rollup banner stands for trade shows, exhibitions, offices, and events. Print-ready, easy to set up.',
    features: ['Retractable aluminium stand', 'High-resolution print', '85cm wide standard size', 'Carry bag included', 'Full-colour gradient-friendly', 'Setup in under 60 seconds'],
    badge: 'Event Ready',
    minQty: 1,
  },
  'signage': {
    description: 'Custom signage and billboards for shops, offices, highways, and institutions. Durable, large-format, professional finish.',
    features: ['Aluminium composite or flex', 'Any custom size', 'Weather-resistant', 'High-resolution print', 'Mounting hardware options', 'Professional installation guidance'],
    badge: 'Permanent Signage',
    minQty: 1,
  },
  'letterhead': {
    description: 'Professionally designed and printed letterheads that establish your brand credibility. A4 size on premium 90gsm stock.',
    features: ['90gsm premium bond paper', 'Full-colour single or double-sided', 'Crisp laser-print quality', 'Custom design available', 'Fast production', 'Bulk discounts'],
    badge: 'Corporate Essential',
    minQty: 100,
  },
  'business-card': {
    description: 'Premium business cards that make a lasting first impression. Multiple finish options available.',
    features: ['350gsm art card', 'Glossy, matte, or spot UV', 'Standard 3.5x2" or custom sizes', 'Double-sided printing', 'Rounded corner option', 'Fast 24hr turnaround'],
    badge: 'First Impressions Matter',
    minQty: 100,
  },
  'brochure': {
    description: 'Folded brochures for marketing your products and services. Available in bi-fold, tri-fold, and z-fold formats.',
    features: ['170gsm or 250gsm art paper', 'Bi-fold, tri-fold, or z-fold', 'Full-colour both sides', 'Glossy or matte finish', 'Custom sizes available', 'Design service available'],
    badge: 'Marketing Powerhouse',
    minQty: 100,
  },
  'logo-branding': {
    description: 'Professional logo design and complete brand identity creation for businesses. Delivered in all file formats.',
    features: ['Unlimited concepts', 'PNG, JPG, SVG, PDF delivery', 'Brand colour palette', 'Typography selection', '3 rounds of revision', 'Full brand guidelines'],
    badge: 'Identity Package',
    minQty: 1,
  },
  'flyer': {
    description: 'Eye-catching promotional flyers for events, sales, and announcements. A4, A5, or custom sizes.',
    features: ['150gsm or 170gsm art paper', 'A4, A5, DL or custom', 'Single or double-sided', 'Vibrant full-colour', 'Quick 24hr production', 'Bulk rates available'],
    badge: 'Promo Ready',
    minQty: 100,
  },
  'flyers-posters': {
    description: 'High-impact flyers and posters for indoor and outdoor promotions. Vivid colours, sharp detail.',
    features: ['Multiple sizes: A4 to A0', 'Full-colour print', 'Glossy or matte', 'Event & burial brochures', 'Quick turnaround', 'Bulk order discounts'],
    badge: 'Promo Ready',
    minQty: 100,
  },
  'burial-brochure': {
    description: 'Dignified and tastefully designed burial/funeral programmes and brochures. Handled with care and respect.',
    features: ['Full-colour premium print', 'A4 or A5 size, folded', 'Photo-quality imagery', 'Respectful, elegant design', '24hr urgent production available', 'Design service included'],
    badge: 'Handled with Care',
    minQty: 50,
  },
  'vehicle-branding': {
    description: 'Full or partial vehicle wraps and branding. Turn your car, bus, or truck into a moving billboard.',
    features: ['Premium vinyl wraps', 'Cars, buses, trucks & vans', 'Full or partial wrap', 'UV and weather resistant', 'Professional installation service', 'Removes cleanly'],
    badge: 'Mobile Billboard',
    minQty: 1,
  },
  'paper-bag': {
    description: 'Branded kraft or white paper bags for retail, gifts, and shopping. Elevate your customer unboxing experience.',
    features: ['Kraft or white paper options', 'Custom sizes available', 'Rope or flat handles', 'Full-colour print or foil stamp', 'Eco-friendly material', 'Bulk pricing available'],
    badge: 'Retail Ready',
    minQty: 50,
  },
  'tote-bag': {
    description: 'Custom printed tote bags for events, retail, and corporate gifting. Durable and reusable.',
    features: ['Non-woven or canvas fabric', 'Full-colour screen/digital print', 'Custom sizes available', 'Reinforced handles', 'Eco-friendly choice', 'Great for corporate gifts'],
    badge: 'Eco-Friendly',
    minQty: 50,
  },
  'pen': {
    description: 'Branded ballpoint pens for corporate giveaways, events, and offices. Keeps your brand in hand every day.',
    features: ['Metal or plastic body', 'Screen-printed or laser-engraved', 'Black or blue ink', 'Click-action mechanism', 'Custom colour options', 'Bulk pricing'],
    badge: 'Everyday Branding',
    minQty: 50,
  },
  'mugs': {
    description: 'Custom printed ceramic mugs for corporate gifts, events, and retail. 11oz standard or 15oz large.',
    features: ['11oz or 15oz ceramic', 'Full-colour wrap print', 'Dishwasher-safe option', 'White or black body', 'Gift box option', 'Bulk order discounts'],
    badge: 'Gift-Ready',
    minQty: 10,
  },
  'umbrella': {
    description: 'Branded umbrellas for corporate gifting, events, and promotions. Full-colour canopy printing.',
    features: ['Auto-open mechanism', 'Full-colour panel print', 'Fibreglass frame', 'Various colour options', 'Telescopic or golf style', 'Carry pouch included'],
    badge: 'Premium Gift',
    minQty: 10,
  },
  'notepad': {
    description: 'Branded notepads for corporate meetings, conferences, and gifting. Keeps your brand visible.',
    features: ['50 or 100 sheets per pad', 'A5 or A4 size', 'Full-colour cover', 'Perforated tear-off sheets', 'Cardboard backing', 'Custom design available'],
    badge: 'Meeting Essential',
    minQty: 50,
  },
  'id-cards': {
    description: 'Professional ID cards for staff, events, and institutions. PVC card or printed laminate format.',
    features: ['PVC or laminated paper', 'Full-colour both sides', 'Photo ID ready', 'Custom size available', 'Fast production', 'With or without lanyard'],
    badge: 'Official',
    minQty: 10,
  },
  'lanyard': {
    description: 'Custom printed lanyards for events, offices, and schools. Logo and text printed on full length.',
    features: ['Full-colour sublimation print', '15mm or 20mm width', 'Snap hook or carabiner clip', 'Safety breakaway option', 'Various colours', 'Bulk pricing'],
    badge: 'Event Essential',
    minQty: 10,
  },
  'nylon-bag': {
    description: 'Custom printed nylon bags for retail, promotional giveaways, and corporate events. Durable and lightweight.',
    features: ['Polyester or nylon fabric', 'Screen or digital print', 'Various sizes available', 'Drawstring or zip closure', 'Light and reusable', 'Bulk order pricing'],
    badge: 'Promo Ready',
    minQty: 50,
  },
  'table-calendar': {
    description: 'Branded desktop calendars to keep your brand on every office desk through the year.',
    features: ['A5 or A4 desk stand', 'Full-colour monthly pages', '12 monthly pages + cover', 'Spiral bound', 'Custom photos per month', 'Bulk pricing'],
    badge: 'Year-Round Branding',
    minQty: 10,
  },
  'wall-calendar': {
    description: 'Branded wall calendars for corporate gifting and year-round brand visibility.',
    features: ['A2 or A3 size', 'Full-colour print', '12-month spiral bound', 'Custom imagery each month', 'Heavy paper stock', 'Hanging hole provided'],
    badge: 'Year-Round Branding',
    minQty: 10,
  },
  'cap': {
    description: 'Custom branded caps for events, uniforms, and corporate gifting. Embroidered or printed logo.',
    features: ['Cotton or polyester blend', 'Embroidery or print option', 'Adjustable strap', 'One size fits all', 'Various colour options', 'Bulk pricing'],
    badge: 'Wear Your Brand',
    minQty: 10,
  },
  't-shirts': {
    description: 'High-quality branded T-shirts for staff uniforms, events, and giveaways. Screen or digital print.',
    features: ['100% cotton or blend', 'Screen or DTF digital print', 'Sizes XS to 3XL', 'Various colour options', 'Single or double-sided', 'Bulk order discounts'],
    badge: 'Uniform Ready',
    minQty: 10,
  },
  't-shirt-cap': {
    description: 'T-shirt and cap combo branding package for events, teams, and corporate outfits. Best value bundle.',
    features: ['Matching T-shirt + cap set', '100% cotton quality', 'Embroidery or print', 'Full-colour branding', 'Various sizes & colours', 'Event packages available'],
    badge: 'Bundle Deal',
    minQty: 10,
  },
  'graphic-design': {
    description: 'Professional graphic design for all your branding needs — logos, social media, print materials, and more.',
    features: ['Experienced brand designers', 'Fast 24–48hr turnaround', 'Unlimited revisions (3 rounds)', 'Print & digital formats', 'Source files included', 'Social media graphics'],
    badge: 'Creative Studio',
    minQty: 1,
  },
  'consulting': {
    description: 'Brand consulting and print strategy sessions. We help you choose the right products and messaging for your business.',
    features: ['1-on-1 brand consultation', 'Print strategy planning', 'Budget-friendly recommendations', 'Product selection guidance', 'Marketing materials advice', '60-minute session'],
    badge: 'Expert Guidance',
    minQty: 1,
  },
  'hand-fan': {
    description: 'Custom printed hand fans for weddings, birthdays, church events, and corporate occasions. Printed double-sided with your design, photo, or logo on premium art card.',
    features: ['Double-sided full-colour print', 'Round or square fan shape', 'Sturdy plastic handle', 'Premium art card material', 'Ideal for events & giveaways', 'MOQ 108 pcs'],
    badge: 'Event Essential',
    minQty: 108,
  },
}

export const ALL_PRODUCTS = [
  { id: 1, name: 'Flex Banner', category: 'Flex Printing/Large Format', slug: 'flex-banner', price: 5000, priceTable: [{qty:1,unitPrice:5000},{qty:5,unitPrice:4800},{qty:10,unitPrice:4500}], sizes: ['3x6ft','4x6ft','4x8ft','6x8ft','Custom'] },
  { id: 2, name: 'Billboard', category: 'Flex Printing/Large Format', slug: 'billboard', price: 50000, priceTable: [{qty:1,unitPrice:50000},{qty:3,unitPrice:46000}], sizes: ['10x20ft','12x24ft','14x24ft','Custom'] },
  { id: 3, name: 'SAV Printing', category: 'Flex Printing/Large Format', slug: 'sav-printing', price: 8000, priceTable: [{qty:1,unitPrice:8000},{qty:5,unitPrice:7000}], sizes: ['A4','A3','A2','A1','Custom'] },
  { id: 4, name: 'Window Graphics', category: 'Flex Printing/Large Format', slug: 'window-graphics', price: 6000, priceTable: [{qty:1,unitPrice:6000},{qty:5,unitPrice:5500}], sizes: ['Small','Medium','Large','Full Window'] },
  { id: 5, name: 'Reflective Flex', category: 'Flex Printing/Large Format', slug: 'reflective-flex', price: 9000, priceTable: [{qty:1,unitPrice:9000},{qty:5,unitPrice:8000}], sizes: ['3x6ft','4x6ft','4x8ft','Custom'] },
  { id: 31, name: 'Rollup Stand', category: 'Flex Printing/Large Format', slug: 'rollup-stand', price: 25000, priceTable: [{qty:1,unitPrice:25000},{qty:3,unitPrice:23000},{qty:5,unitPrice:21000}], sizes: ['85cm Standard','100cm Wide'] },
  { id: 33, name: 'Signage & Billboard', category: 'Flex Printing/Large Format', slug: 'signage', price: 35000, priceTable: [{qty:1,unitPrice:35000},{qty:3,unitPrice:30000}], sizes: ['Custom'] },
  { id: 6,  name: 'Die Cut Stickers',       category: 'Label Stickers', slug: 'die-cut-stickers',       price: 5000,  priceTable: [], sizes: [...Object.keys(STICKER_SIZE_PRICES), 'Custom'], isDieCut: true },
  { id: 7,  name: 'Product Labels',          category: 'Label Stickers', slug: 'product-labels',          price: 4000,  priceTable: [{qty:100,unitPrice:40},{qty:500,unitPrice:35},{qty:1000,unitPrice:30}], sizes: ['3x3"','4x4"','3x4"','Round 3"','Custom'] },
  { id: 35, name: 'Transparent Stickers',    category: 'Label Stickers', slug: 'transparent-stickers',    price: 5500,  priceTable: [{qty:100,unitPrice:55},{qty:500,unitPrice:45},{qty:1000,unitPrice:38}], sizes: ['3x3"','4x4"','3x4"','Round 3"','Custom'] },
  { id: 36, name: 'Holographic Stickers',    category: 'Label Stickers', slug: 'holographic-stickers',    price: 7000,  priceTable: [{qty:100,unitPrice:70},{qty:500,unitPrice:60},{qty:1000,unitPrice:50}], sizes: ['3x3"','4x4"','3x4"','Round 3"','Custom'] },
  { id: 37, name: 'Chrome Metallic Stickers',category: 'Label Stickers', slug: 'chrome-stickers',         price: 8000,  priceTable: [{qty:100,unitPrice:80},{qty:500,unitPrice:68},{qty:1000,unitPrice:58}], sizes: ['3x3"','4x4"','3x4"','Custom'] },
  { id: 38, name: 'Vinyl Roll Labels',       category: 'Label Stickers', slug: 'vinyl-roll-labels',       price: 6000,  priceTable: [{qty:500,unitPrice:12},{qty:1000,unitPrice:10},{qty:5000,unitPrice:8}], sizes: ['Round 2"','Round 3"','Square 2"','Oval 3x2"','Custom'] },
  { id: 39, name: 'Seal Stickers',           category: 'Label Stickers', slug: 'seal-stickers',           price: 3500,  priceTable: [{qty:100,unitPrice:35},{qty:500,unitPrice:28},{qty:1000,unitPrice:22}], sizes: ['Round 1"','Round 1.5"','Round 2"','Custom'] },
  { id: 40, name: 'Bumper Stickers',         category: 'Label Stickers', slug: 'bumper-stickers',         price: 4500,  priceTable: [{qty:50,unitPrice:90},{qty:100,unitPrice:75},{qty:500,unitPrice:60}], sizes: ['3x9"','4x10"','3x11"','Custom'] },
  { id: 41, name: 'Barcode Labels',          category: 'Label Stickers', slug: 'barcode-labels',          price: 3000,  priceTable: [{qty:500,unitPrice:6},{qty:1000,unitPrice:5},{qty:5000,unitPrice:4}], sizes: ['25x15mm','38x25mm','50x25mm','Custom'] },
  { id: 42, name: 'Paper Stickers',          category: 'Label Stickers', slug: 'paper-stickers',          price: 3500,  priceTable: [{qty:100,unitPrice:35},{qty:500,unitPrice:28},{qty:1000,unitPrice:22}], sizes: ['A4 Sheet','A5 Sheet','3x3"','4x4"','Custom'] },
  { id: 8, name: 'Letterhead', category: 'Corporate Branding', slug: 'letterhead', price: 15000, priceTable: [{qty:100,unitPrice:150},{qty:500,unitPrice:130},{qty:1000,unitPrice:110}], sizes: ['A4','A5'] },
  { id: 9, name: 'Business Card', category: 'Corporate Branding', slug: 'business-card', price: 5000, priceTable: [{qty:100,unitPrice:50},{qty:500,unitPrice:40},{qty:1000,unitPrice:35}], sizes: ['Standard 3.5x2"','Square 2x2"','Slim'] },
  { id: 10, name: 'Brochure', category: 'Corporate Branding', slug: 'brochure', price: 8000, priceTable: [{qty:100,unitPrice:80},{qty:500,unitPrice:65},{qty:1000,unitPrice:55}], sizes: ['A4 Bi-fold','A4 Tri-fold','A5 Bi-fold','DL Tri-fold'] },
  { id: 11, name: 'Logo Branding', category: 'Corporate Branding', slug: 'logo-branding', price: 25000, priceTable: [{qty:1,unitPrice:25000}], sizes: ['Basic','Standard','Premium'] },
  { id: 12, name: 'Flyer', category: 'Corporate Branding', slug: 'flyer', price: 3000, priceTable: [{qty:100,unitPrice:30},{qty:500,unitPrice:25},{qty:1000,unitPrice:20}], sizes: ['A4','A5','DL','A3'] },
  { id: 13, name: 'Vehicle Branding', category: 'Corporate Branding', slug: 'vehicle-branding', price: 80000, priceTable: [{qty:1,unitPrice:80000}], sizes: ['Car Partial','Car Full','Bus/Truck','Motorcycle'] },
  { id: 14, name: 'Paper Bag', category: 'Corporate Branding', slug: 'paper-bag', price: 2500, priceTable: [{qty:50,unitPrice:50},{qty:100,unitPrice:45},{qty:500,unitPrice:38}], sizes: ['Small','Medium','Large','XL'] },
  { id: 15, name: 'Tote Bag', category: 'Corporate Branding', slug: 'tote-bag', price: 3500, priceTable: [{qty:50,unitPrice:70},{qty:100,unitPrice:60},{qty:500,unitPrice:50}], sizes: ['Standard','Large','XL'] },
  { id: 16, name: 'Pen', category: 'Corporate Branding', slug: 'pen', price: 1500, priceTable: [{qty:50,unitPrice:30},{qty:100,unitPrice:25},{qty:500,unitPrice:20}], sizes: ['Plastic Ballpoint','Metal Executive'] },
  { id: 17, name: 'Mugs', category: 'Corporate Branding', slug: 'mugs', price: 4000, priceTable: [{qty:10,unitPrice:400},{qty:50,unitPrice:350},{qty:100,unitPrice:300}], sizes: ['11oz White','15oz Large','Black Inner'] },
  { id: 18, name: 'Umbrella', category: 'Corporate Branding', slug: 'umbrella', price: 6000, priceTable: [{qty:10,unitPrice:600},{qty:50,unitPrice:550},{qty:100,unitPrice:480}], sizes: ['Compact 21"','Standard 23"','Golf 30"'] },
  { id: 19, name: 'Notepad', category: 'Corporate Branding', slug: 'notepad', price: 3000, priceTable: [{qty:50,unitPrice:60},{qty:100,unitPrice:55},{qty:500,unitPrice:45}], sizes: ['A5 (50 sheets)','A4 (50 sheets)','A5 (100 sheets)'] },
  { id: 20, name: 'ID Cards', category: 'Corporate Branding', slug: 'id-cards', price: 2000, priceTable: [{qty:10,unitPrice:200},{qty:50,unitPrice:180},{qty:100,unitPrice:150}], sizes: ['PVC Card','Laminated Paper'] },
  { id: 21, name: 'Lanyard', category: 'Corporate Branding', slug: 'lanyard', price: 1500, priceTable: [{qty:10,unitPrice:150},{qty:50,unitPrice:130},{qty:100,unitPrice:110}], sizes: ['15mm Polyester','20mm Polyester','20mm+Breakaway'] },
  { id: 22, name: 'Nylon Bag Printing', category: 'Corporate Branding', slug: 'nylon-bag', price: 2000, priceTable: [{qty:50,unitPrice:40},{qty:100,unitPrice:35},{qty:500,unitPrice:28}], sizes: ['A5','A4','A3','Custom'] },
  { id: 23, name: 'Table Calendar', category: 'Corporate Branding', slug: 'table-calendar', price: 5000, priceTable: [{qty:10,unitPrice:500},{qty:50,unitPrice:450},{qty:100,unitPrice:400}], sizes: ['A5 Desk Stand','A4 Desk Stand'] },
  { id: 24, name: 'Wall Calendar', category: 'Corporate Branding', slug: 'wall-calendar', price: 4000, priceTable: [{qty:10,unitPrice:400},{qty:50,unitPrice:360},{qty:100,unitPrice:320}], sizes: ['A3','A2'] },
  { id: 25, name: 'Cap', category: 'Corporate Branding', slug: 'cap', price: 3500, priceTable: [{qty:10,unitPrice:350},{qty:50,unitPrice:300},{qty:100,unitPrice:260}], sizes: ['Cotton Plain','Polyester','Trucker Cap'] },
  { id: 26, name: 'T-Shirts', category: 'Corporate Branding', slug: 't-shirts', price: 5000, priceTable: [{qty:10,unitPrice:500},{qty:50,unitPrice:450},{qty:100,unitPrice:400}], sizes: ['XS','S','M','L','XL','2XL','3XL'] },
  { id: 27, name: 'Graphic Design', category: 'Corporate Branding', slug: 'graphic-design', price: 10000, priceTable: [{qty:1,unitPrice:10000}], sizes: ['Flyer/Poster','Social Media','Logo','Full Branding'] },
  { id: 28, name: 'Consulting Services', category: 'Corporate Branding', slug: 'consulting', price: 20000, priceTable: [{qty:1,unitPrice:20000}], sizes: ['60-min Session','Brand Package'] },
  { id: 29, name: 'Burial Brochure', category: 'Corporate Branding', slug: 'burial-brochure', price: 6000, priceTable: [{qty:50,unitPrice:120},{qty:100,unitPrice:100},{qty:500,unitPrice:80}], sizes: ['A5 Bi-fold','A4 Bi-fold','A5 Tri-fold'] },
  { id: 30, name: 'Flyers & Posters', category: 'Corporate Branding', slug: 'flyers-posters', price: 3500, priceTable: [{qty:100,unitPrice:35},{qty:500,unitPrice:30},{qty:1000,unitPrice:25}], sizes: ['A4','A3','A2','A5'] },
  { id: 32, name: 'T-Shirt & Cap Branding', category: 'Corporate Branding', slug: 't-shirt-cap', price: 5000, priceTable: [{qty:10,unitPrice:500},{qty:50,unitPrice:450},{qty:100,unitPrice:400}], sizes: ['S','M','L','XL','2XL'] },
  { id: 34, name: 'Hand Fan', category: 'Corporate Branding', slug: 'hand-fan', price: 113400, priceTable: [{qty:108,unitPrice:1050}], sizes: ['Round Shape','Square Shape','Customized Shape'] },
]

export function getProductDetails(slug) {
  return PRODUCT_DETAILS[slug] || {
    description: 'Professional print and branding solution from Sleekblue Media Houz. High quality output, fast turnaround.',
    features: ['Premium quality materials', 'Fast production turnaround', 'Vibrant full-colour print', 'Custom sizes available', 'Bulk order discounts', 'Free design consultation'],
    badge: 'Quality Guaranteed',
    minQty: 1,
  }
}

export const BEST_SELLING = [
  { id: 6,  name: 'Die Cut Stickers',    slug: 'die-cut-stickers',  price: 'From ₦22,500', unit: 'per 500pcs' },
  { id: 1,  name: 'Flex Banner',         slug: 'flex-banner',        price: 'From ₦5,000',  unit: 'per piece' },
  { id: 29, name: 'Burial Brochure',     slug: 'burial-brochure',    price: 'From ₦6,000',  unit: 'per 50pcs' },
  { id: 30, name: 'Flyers & Posters',    slug: 'flyers-posters',     price: 'From ₦3,500',  unit: 'per 100pcs' },
  { id: 31, name: 'Rollup Stand',        slug: 'rollup-stand',       price: 'From ₦25,000', unit: 'per piece' },
  { id: 32, name: 'T-Shirt & Cap',       slug: 't-shirt-cap',        price: 'From ₦5,000',  unit: 'per 10pcs' },
  { id: 33, name: 'Signage & Billboard', slug: 'signage',            price: 'From ₦35,000', unit: 'per piece' },
  { id: 27, name: 'Corporate Branding',  slug: 'graphic-design',     price: 'From ₦10,000', unit: 'per design' },
  { id: 9,  name: 'Business Card',       slug: 'business-card',      price: 'From ₦5,000',  unit: 'per 100pcs' },
  { id: 26, name: 'T-Shirts',            slug: 't-shirts',           price: 'From ₦5,000',  unit: 'per 10pcs' },
]

export const NAV_MENUS = {
  'Flex Printing/Large format': [
    { name: 'Billboard', slug: 'billboard' },
    { name: 'Flex Banner', slug: 'flex-banner' },
    { name: 'Reflective Flex', slug: 'reflective-flex' },
    { name: 'Rollup Stand', slug: 'rollup-stand' },
    { name: 'SAV Printing', slug: 'sav-printing' },
    { name: 'Signage & Billboard', slug: 'signage' },
    { name: 'Window Graphics', slug: 'window-graphics' },
  ],
  'Label Stickers': [
    { name: 'Die Cut Stickers', slug: 'die-cut-stickers' },
    { name: 'Product Labels', slug: 'product-labels' },
  ],
  'Corporate Branding': [
    { name: 'Brochure', slug: 'brochure' },
    { name: 'Burial Brochure', slug: 'burial-brochure' },
    { name: 'Business Card', slug: 'business-card' },
    { name: 'Cap', slug: 'cap' },
    { name: 'Consulting Services', slug: 'consulting' },
    { name: 'Flyer', slug: 'flyer' },
    { name: 'Flyers & Posters', slug: 'flyers-posters' },
    { name: 'Graphic Design', slug: 'graphic-design' },
    { name: 'Hand Fan', slug: 'hand-fan' },
    { name: 'ID Cards', slug: 'id-cards' },
    { name: 'Lanyard', slug: 'lanyard' },
    { name: 'Letterhead', slug: 'letterhead' },
    { name: 'Logo Branding', slug: 'logo-branding' },
    { name: 'Mugs', slug: 'mugs' },
    { name: 'Notepad', slug: 'notepad' },
    { name: 'Nylon Bag Printing', slug: 'nylon-bag' },
    { name: 'Paper Bag', slug: 'paper-bag' },
    { name: 'Pen', slug: 'pen' },
    { name: 'T-Shirt & Cap Branding', slug: 't-shirt-cap' },
    { name: 'T-Shirts', slug: 't-shirts' },
    { name: 'Table Calendar', slug: 'table-calendar' },
    { name: 'Tote Bag', slug: 'tote-bag' },
    { name: 'Umbrella', slug: 'umbrella' },
    { name: 'Vehicle Branding', slug: 'vehicle-branding' },
    { name: 'Wall Calendar', slug: 'wall-calendar' },
  ],
}
