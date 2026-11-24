import { Brand, Category, Glyph, Product, ProductSpec, ProductVariant, Review } from './models';

/** Demo catalog. Amounts are plain decimals (USD-style), like the backend seed data. */

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Laptops & PCs', nameAr: 'لابتوب وكمبيوتر', slug: 'computers', glyph: 'laptop', hue: 232 },
  { id: 2, name: 'Smartphones', nameAr: 'هواتف ذكية', slug: 'phones', glyph: 'phone', hue: 268 },
  { id: 3, name: 'Audio', nameAr: 'سماعات وصوتيات', slug: 'audio', glyph: 'headphones', hue: 330 },
  { id: 4, name: 'Wearables', nameAr: 'أجهزة قابلة للارتداء', slug: 'wearables', glyph: 'watch', hue: 172 },
  { id: 5, name: 'Fashion', nameAr: 'أزياء', slug: 'fashion', glyph: 'shirt', hue: 14 },
  { id: 6, name: 'Footwear', nameAr: 'أحذية', slug: 'footwear', glyph: 'shoe', hue: 38 },
  { id: 7, name: 'Home & Living', nameAr: 'المنزل والمعيشة', slug: 'home', glyph: 'sofa', hue: 150 },
  { id: 8, name: 'Sports & Fitness', nameAr: 'رياضة ولياقة', slug: 'sports', glyph: 'dumbbell', hue: 198 },
];

export const BRANDS: Brand[] = [
  { id: 1, name: 'Nova', nameAr: 'نوفا', slug: 'nova' },
  { id: 2, name: 'Aurora', nameAr: 'أورورا', slug: 'aurora' },
  { id: 3, name: 'Pulse', nameAr: 'بولس', slug: 'pulse' },
  { id: 4, name: 'Lumen', nameAr: 'لومن', slug: 'lumen' },
  { id: 5, name: 'Atlas', nameAr: 'أطلس', slug: 'atlas' },
  { id: 6, name: 'Verve', nameAr: 'فيرف', slug: 'verve' },
];

const COLORS: Record<string, [string, string, string]> = {
  midnight: ['Midnight', 'أسود ليلي', '#1f2937'],
  silver: ['Silver', 'فضي', '#c7cdd8'],
  ocean: ['Ocean', 'أزرق محيطي', '#0ea5e9'],
  rose: ['Rose', 'وردي', '#f43f5e'],
  forest: ['Forest', 'أخضر غابي', '#16a34a'],
  sand: ['Sand', 'رملي', '#d6b88a'],
  violet: ['Violet', 'بنفسجي', '#7c3aed'],
};

type VariantKind = 'color' | 'color-storage' | 'size' | 'shoe' | 'none';

/** [name, nameAr, categoryId, brandId, price, compareAt|0, rating, reviews, sold, featured, daysOld, kind, colors] */
type Seed = [string, string, number, number, number, number, number, number, number, 0 | 1, number, VariantKind, string[]];

const SEEDS: Seed[] = [
  ['Nova Book Pro 14', 'نوفا بوك برو 14', 1, 1, 1099, 1299, 4.8, 412, 2310, 1, 12, 'color-storage', ['silver', 'midnight']],
  ['Aurora Slim 13 Ultrabook', 'أورورا سليم 13 ألترابوك', 1, 2, 849, 0, 4.5, 186, 940, 0, 40, 'color-storage', ['silver', 'sand']],
  ['Atlas Tower Gaming PC', 'أطلس تاور كمبيوتر ألعاب', 1, 5, 1499, 1799, 4.7, 98, 410, 1, 75, 'color', ['midnight']],
  ['Pulse Creator Monitor 27"', 'بولس شاشة المبدعين 27"', 1, 3, 429, 499, 4.6, 143, 780, 0, 21, 'none', []],
  ['Nova One 5G', 'نوفا ون 5G', 2, 1, 799, 899, 4.7, 620, 4210, 1, 9, 'color-storage', ['midnight', 'ocean', 'rose']],
  ['Aurora Edge Smartphone', 'أورورا إيدج هاتف ذكي', 2, 2, 599, 0, 4.4, 301, 2150, 0, 58, 'color-storage', ['forest', 'silver']],
  ['Lumen Lite Phone', 'لومن لايت هاتف', 2, 4, 249, 299, 4.2, 512, 5100, 0, 130, 'color', ['midnight', 'ocean']],
  ['Pulse Fold Flip', 'بولس فولد فليب', 2, 3, 999, 1199, 4.6, 77, 320, 1, 18, 'color', ['violet', 'sand']],
  ['Pulse Wireless ANC Headphones', 'بولس سماعات لاسلكية بعزل الضوضاء', 3, 3, 189, 249, 4.8, 934, 6120, 1, 30, 'color', ['midnight', 'sand', 'ocean']],
  ['Lumen Buds Air', 'لومن بدز اير', 3, 4, 79, 99, 4.3, 1210, 9800, 0, 95, 'color', ['silver', 'rose']],
  ['Atlas Soundbar 2.1', 'أطلس ساوند بار 2.1', 3, 5, 229, 0, 4.5, 164, 880, 0, 52, 'none', []],
  ['Verve Portable Speaker', 'فيرف سماعة محمولة', 3, 6, 69, 89, 4.4, 402, 3300, 0, 14, 'color', ['forest', 'rose', 'midnight']],
  ['Nova Watch S9', 'نوفا ووتش S9', 4, 1, 349, 399, 4.7, 540, 2890, 1, 16, 'color', ['midnight', 'silver', 'rose']],
  ['Aurora Fit Band 5', 'أورورا فيت باند 5', 4, 2, 59, 79, 4.3, 876, 7400, 0, 44, 'color', ['midnight', 'ocean']],
  ['Verve Trail GPS Watch', 'فيرف ساعة جي بي إس للمسارات', 4, 6, 279, 0, 4.6, 121, 690, 0, 33, 'color', ['forest', 'midnight']],
  ['Atlas Linen Shirt', 'أطلس قميص كتان', 5, 5, 54, 69, 4.4, 238, 1520, 0, 25, 'size', ['sand', 'ocean']],
  ['Verve Performance Hoodie', 'فيرف هودي رياضي', 5, 6, 74, 0, 4.6, 312, 2040, 1, 10, 'size', ['midnight', 'forest', 'rose']],
  ['Lumen Everyday Jacket', 'لومن جاكيت يومي', 5, 4, 129, 169, 4.5, 145, 760, 0, 62, 'size', ['sand', 'midnight']],
  ['Pulse Runner Elite', 'بولس رانر إيليت', 6, 3, 139, 169, 4.8, 689, 4470, 1, 20, 'shoe', ['midnight', 'rose', 'ocean']],
  ['Atlas Leather Sneakers', 'أطلس سنيكرز جلد', 6, 5, 119, 0, 4.5, 254, 1330, 0, 70, 'shoe', ['sand', 'silver']],
  ['Verve Trail Boots', 'فيرف بوت للمسارات', 6, 6, 159, 189, 4.4, 88, 410, 0, 36, 'shoe', ['forest', 'sand']],
  ['Aurora Lounge Chair', 'أورورا كرسي استرخاء', 7, 2, 289, 349, 4.6, 112, 530, 1, 28, 'color', ['sand', 'forest', 'rose']],
  ['Lumen Smart Desk Lamp', 'لومن مصباح مكتب ذكي', 7, 4, 49, 0, 4.5, 468, 3650, 0, 48, 'color', ['midnight', 'silver']],
  ['Nova Robot Vacuum', 'نوفا مكنسة روبوت', 7, 1, 379, 449, 4.5, 207, 1240, 0, 15, 'none', []],
  ['Verve Adjustable Dumbbells', 'فيرف دمبل قابل للتعديل', 8, 6, 199, 249, 4.7, 356, 1980, 1, 22, 'none', []],
  ['Atlas Yoga Mat Pro', 'أطلس سجادة يوجا برو', 8, 5, 39, 0, 4.6, 702, 5400, 0, 60, 'color', ['violet', 'forest', 'ocean']],
  ['Pulse Smart Jump Rope', 'بولس حبل قفز ذكي', 8, 3, 29, 39, 4.1, 143, 1210, 0, 8, 'color', ['rose', 'midnight']],
];

const SPECS: Record<number, [string, string, string[]][]> = {
  1: [['Processor', 'المعالج', ['8-core, 3.4 GHz', '10-core, 3.8 GHz']], ['Memory', 'الذاكرة', ['16 GB', '32 GB']], ['Display', 'الشاشة', ['14" 2.8K OLED', '13.3" 2K IPS']], ['Battery', 'البطارية', ['Up to 18 h']]],
  2: [['Display', 'الشاشة', ['6.7" AMOLED 120 Hz', '6.4" OLED 120 Hz']], ['Camera', 'الكاميرا', ['50 MP main + 12 MP ultra-wide']], ['Battery', 'البطارية', ['5,000 mAh, 45 W']], ['Connectivity', 'الاتصال', ['5G, Wi-Fi 7, NFC']]],
  3: [['Driver', 'السماعة', ['40 mm dynamic']], ['Battery', 'البطارية', ['Up to 40 h']], ['Bluetooth', 'بلوتوث', ['5.3, multipoint']], ['Noise control', 'العزل', ['Active + transparency']]],
  4: [['Display', 'الشاشة', ['1.9" AMOLED']], ['Battery', 'البطارية', ['Up to 7 days']], ['Water resistance', 'مقاومة الماء', ['5 ATM']], ['Sensors', 'المستشعرات', ['HR, SpO₂, GPS, temperature']]],
  5: [['Material', 'الخامة', ['100% organic cotton', 'Linen blend']], ['Fit', 'القصة', ['Regular']], ['Care', 'العناية', ['Machine wash 30°C']], ['Origin', 'بلد الصنع', ['Egypt']]],
  6: [['Upper', 'الجزء العلوي', ['Breathable knit', 'Full-grain leather']], ['Sole', 'النعل', ['Cushioned rubber']], ['Drop', 'الارتفاع', ['8 mm']], ['Weight', 'الوزن', ['280 g']]],
  7: [['Dimensions', 'الأبعاد', ['Compact, space-saving']], ['Material', 'الخامة', ['Recycled fabric & steel']], ['Warranty', 'الضمان', ['2 years']], ['Assembly', 'التركيب', ['Tool-free']]],
  8: [['Material', 'الخامة', ['Non-slip eco rubber']], ['Weight', 'الوزن', ['Lightweight']], ['Warranty', 'الضمان', ['1 year']], ['Use', 'الاستخدام', ['Indoor & outdoor']]],
};

const HIGHLIGHTS: Record<number, [string[], string[]]> = {
  1: [['Fast, quiet performance', 'All-day battery life', 'Bright, color-accurate display'], ['أداء سريع وهادئ', 'بطارية تدوم طوال اليوم', 'شاشة ساطعة بألوان دقيقة']],
  2: [['Pro-grade camera system', 'Smooth 120 Hz screen', 'Fast charging'], ['نظام كاميرا احترافي', 'شاشة سلسة 120 هرتز', 'شحن سريع']],
  3: [['Rich, balanced sound', 'Long battery life', 'Seamless pairing'], ['صوت غني ومتوازن', 'بطارية تدوم طويلاً', 'اقتران سلس']],
  4: [['Accurate health tracking', 'Multi-day battery', 'Swim-proof design'], ['تتبع صحي دقيق', 'بطارية لعدة أيام', 'تصميم مقاوم للماء']],
  5: [['Soft, breathable fabric', 'Easy everyday style', 'Built to last'], ['قماش ناعم يسمح بالتهوية', 'أناقة يومية سهلة', 'مصنوع ليدوم']],
  6: [['Comfort for all-day wear', 'Grippy, durable sole', 'Lightweight build'], ['راحة طوال اليوم', 'نعل متين بقبضة قوية', 'وزن خفيف']],
  7: [['Designed for small spaces', 'Easy to clean', 'Modern look'], ['مصمم للمساحات الصغيرة', 'سهل التنظيف', 'مظهر عصري']],
  8: [['Train anywhere', 'Durable materials', 'Beginner friendly'], ['تمرّن في أي مكان', 'خامات متينة', 'مناسب للمبتدئين']],
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildVariants(id: number, kind: VariantKind, colors: string[], base: number): ProductVariant[] {
  const out: ProductVariant[] = [];
  let vid = id * 100;
  const stock = (n: number) => {
    const v = (id * 7 + n * 13) % 23;
    return v < 3 ? 0 : v < 7 ? v - 1 : v + 4; // a few sold-out / low-stock options for realism
  };
  const colorVariant = (key: string) => {
    const [color, colorAr, colorHex] = COLORS[key];
    return { color, colorAr, colorHex };
  };

  if (kind === 'none') {
    out.push({ id: ++vid, sku: `SKU-${id}-STD`, stock: 12 + (id % 9) });
  } else if (kind === 'color') {
    colors.forEach((c, i) => out.push({ id: ++vid, sku: `SKU-${id}-${c.toUpperCase().slice(0, 3)}`, ...colorVariant(c), stock: Math.max(stock(i), i === 0 ? 8 : 0) }));
  } else if (kind === 'color-storage') {
    const storages: [string, number][] = [['256 GB', 0], ['512 GB', Math.round(base * 0.12)], ['1 TB', Math.round(base * 0.25)]];
    colors.forEach((c, ci) =>
      storages.forEach(([size, delta], si) =>
        out.push({
          id: ++vid,
          sku: `SKU-${id}-${c.toUpperCase().slice(0, 3)}-${size.replace(' ', '')}`,
          ...colorVariant(c),
          size,
          priceOverride: delta ? base + delta : undefined,
          stock: ci === 0 && si === 0 ? 14 : stock(ci * 3 + si),
        }),
      ),
    );
  } else {
    const sizes = kind === 'size' ? ['S', 'M', 'L', 'XL'] : ['40', '41', '42', '43', '44', '45'];
    colors.forEach((c, ci) =>
      sizes.forEach((size, si) =>
        out.push({
          id: ++vid,
          sku: `SKU-${id}-${c.toUpperCase().slice(0, 3)}-${size}`,
          ...colorVariant(c),
          size,
          stock: ci === 0 && si === 1 ? 20 : stock(ci * 7 + si),
        }),
      ),
    );
  }
  return out;
}

function buildProduct(seed: Seed, index: number): Product {
  const [name, nameAr, categoryId, brandId, price, compare, rating, reviews, sold, featured, daysOld, kind, colors] = seed;
  const id = index + 1;
  const cat = CATEGORIES.find((c) => c.id === categoryId)!;
  const brand = BRANDS.find((b) => b.id === brandId)!;
  const specRows = SPECS[categoryId] ?? [];
  const specs: ProductSpec[] = specRows.map(([n, nAr, values], i) => ({
    name: n,
    nameAr: nAr,
    value: values[(id + i) % values.length],
  }));
  specs.unshift({ name: 'Brand', nameAr: 'العلامة', value: brand.name });
  const [hl, hlAr] = HIGHLIGHTS[categoryId] ?? [[], []];

  return {
    id,
    name,
    nameAr,
    slug: slugify(name),
    description: `${name} from ${brand.name}: thoughtfully engineered, tested for everyday use and backed by a 30-day return guarantee. ${hl.join('. ')}.`,
    descriptionAr: `${nameAr} من ${brand.nameAr}: تصميم مدروس، مُختبر للاستخدام اليومي ومدعوم بضمان استرجاع خلال 30 يومًا. ${hlAr.join('. ')}.`,
    basePrice: price,
    compareAtPrice: compare || undefined,
    isFeatured: featured === 1,
    totalSold: sold,
    averageRating: rating,
    reviewCount: reviews,
    categoryId,
    categorySlug: cat.slug,
    categoryName: cat.name,
    categoryNameAr: cat.nameAr,
    brandId,
    brandSlug: brand.slug,
    brandName: brand.name,
    brandNameAr: brand.nameAr,
    createdAt: new Date(Date.now() - daysOld * 86_400_000).toISOString(),
    hue: (cat.hue + ((id * 17) % 36) - 18 + 360) % 360,
    glyph: cat.glyph as Glyph,
    variants: buildVariants(id, kind, colors, price),
    specifications: specs,
    highlights: hl,
    highlightsAr: hlAr,
  };
}

export const PRODUCTS: Product[] = SEEDS.map(buildProduct);

const REVIEW_POOL: [number, string, string][] = [
  [5, 'Exactly what I hoped for', 'Arrived quickly, packaged well and works perfectly. I have been using it daily for weeks and it still feels great.'],
  [5, 'Worth every penny', 'Build quality is far better than the price suggests. Easy setup and really good value.'],
  [4, 'Very good, small nitpicks', 'Great overall. The only thing I would change is the instruction leaflet, which is a bit thin. Product itself is excellent.'],
  [5, 'منتج ممتاز', 'وصل بسرعة والجودة فوق التوقعات. أنصح به بشدة.'],
  [4, 'Solid choice', 'Does everything it promises. Delivery was a day early, and support answered my question within minutes.'],
  [3, 'Good but not perfect', 'Works well, though I expected slightly better battery or finish at this price. Still happy overall.'],
  [5, 'Bought a second one', 'So happy with the first that I ordered another as a gift. Highly recommended.'],
  [4, 'جودة جيدة وسعر مناسب', 'التغليف ممتاز والتوصيل كان سريعًا. المنتج مطابق للوصف.'],
];

const AUTHORS = ['Sara M.', 'Omar K.', 'Layla H.', 'Daniel R.', 'Nour A.', 'Youssef T.', 'Mina S.', 'Hana F.'];

export function reviewsFor(product: Product): Review[] {
  const n = Math.min(6, Math.max(3, Math.round(product.reviewCount / 120)));
  return Array.from({ length: n }, (_, i) => {
    const [rating, title, comment] = REVIEW_POOL[(product.id + i * 3) % REVIEW_POOL.length];
    return {
      id: product.id * 100 + i,
      productId: product.id,
      author: AUTHORS[(product.id + i) % AUTHORS.length],
      rating,
      title,
      comment,
      isVerifiedPurchase: (product.id + i) % 4 !== 0,
      createdAt: new Date(Date.now() - (i * 9 + product.id) * 86_400_000).toISOString(),
    };
  });
}
