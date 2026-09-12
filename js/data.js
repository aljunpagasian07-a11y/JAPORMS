
/* ==========================================
   JAPORMS — item catalog + SVG garment art
   ========================================== */
const JAPORMS_DATA = [
  { id: 'jp01', name: 'Tokyo Oversized Tee',      type: 'tee',    fit: 'baggy',  sizes: ['S','M','L','XL'],     chest: 118, length: 74, price: 32, stock: 6,  colors: ['rgba(139,92,246,0.45)',  'rgba(6,182,212,0.30)'] },
  { id: 'jp02', name: 'Osaka Slim Crewneck',      type: 'tee',    fit: 'fitted', sizes: ['XS','S','M','L'],     chest: 96,  length: 68, price: 28, stock: 9,  colors: ['rgba(6,182,212,0.40)',   'rgba(139,92,246,0.25)'] },
  { id: 'jp03', name: 'Kyoto Heavyweight Hoodie', type: 'hoodie', fit: 'baggy',  sizes: ['M','L','XL','XXL'],   chest: 126, length: 72, price: 68, stock: 4,  colors: ['rgba(217,70,239,0.35)',  'rgba(139,92,246,0.30)'] },
  { id: 'jp04', name: 'Shibuya Cropped Hoodie',   type: 'hoodie', fit: 'fitted', sizes: ['XS','S','M'],         chest: 100, length: 58, price: 62, stock: 7,  colors: ['rgba(16,185,129,0.30)',  'rgba(6,182,212,0.30)'] },
  { id: 'jp05', name: 'Hakone Wide Cargo Pants',  type: 'cargo',  fit: 'baggy',  sizes: ['S','M','L','XL'],     chest: 108, length: 104, price: 74, stock: 5,  colors: ['rgba(245,158,11,0.30)',  'rgba(217,70,239,0.20)'] },
  { id: 'jp06', name: 'Ginza Tapered Chinos',     type: 'pants',  fit: 'fitted', sizes: ['S','M','L'],          chest: 92,  length: 100, price: 58, stock: 8,  colors: ['rgba(6,182,212,0.35)',   'rgba(16,185,129,0.25)'] },
  { id: 'jp07', name: 'Sapporo Boxy Jacket',      type: 'jacket', fit: 'baggy',  sizes: ['M','L','XL'],         chest: 132, length: 70, price: 120, stock: 3, colors: ['rgba(239,68,68,0.30)',   'rgba(139,92,246,0.30)'] },
  { id: 'jp08', name: 'Nagoya Tailored Blazer',   type: 'jacket', fit: 'fitted', sizes: ['S','M','L'],          chest: 102, length: 72, price: 145, stock: 2, colors: ['rgba(139,92,246,0.40)',  'rgba(217,70,239,0.25)'] },
  { id: 'jp09', name: 'Fukuoka relaxed Shirt',    type: 'tee',    fit: 'baggy',  sizes: ['S','M','L'],          chest: 112, length: 76, price: 38, stock: 10, colors: ['rgba(16,185,129,0.35)',  'rgba(6,182,212,0.20)'] },
  { id: 'jp10', name: 'Yokohama Muscle Fit Tee',  type: 'tee',    fit: 'fitted', sizes: ['S','M'],              chest: 90,  length: 66, price: 26, stock: 5,  colors: ['rgba(217,70,239,0.40)',  'rgba(6,182,212,0.25)'] },
  { id: 'jp11', name: 'Nara Parachute Pants',     type: 'cargo',  fit: 'baggy',  sizes: ['M','L','XL','XXL'],   chest: 114, length: 106, price: 70, stock: 6,  colors: ['rgba(6,182,212,0.40)',   'rgba(139,92,246,0.35)'] },
  { id: 'jp12', name: 'Kanazawa Knit Polo',       type: 'tee',    fit: 'fitted', sizes: ['XS','S','M','L','XL'],chest: 98,  length: 69, price: 44, stock: 4,  colors: ['rgba(245,158,11,0.30)',  'rgba(16,185,129,0.25)'] },
];

/* Stylized garment silhouettes (placeholder fashion art) */
function artFor(item) {
  const gid = 'grad-' + item.id;
  const shapes = {
    tee:    '<path d="M34 40 L52 28 Q60 35 68 28 L86 40 L100 64 L84 72 L80 60 L80 124 L40 124 L40 60 L36 72 L20 64 Z"/>',
    hoodie: '<path d="M32 42 Q60 20 88 42 L102 70 L86 78 L82 62 L82 126 L38 126 L38 62 L34 78 L18 70 Z"/>' +
            '<path d="M46 30 Q60 20 74 30 Q70 42 60 42 Q50 42 46 30 Z"/>',
    jacket: '<path d="M32 42 Q60 22 88 42 L102 72 L86 80 L82 64 L82 126 L38 126 L38 64 L34 80 L18 72 Z"/>' +
            '<line x1="60" y1="48" x2="60" y2="126" stroke="rgba(0,0,0,0.35)" stroke-width="3"/>' +
            '<path d="M50 30 Q60 24 70 30 L66 44 L54 44 Z"/>',
    pants:  '<path d="M40 18 L80 18 L86 132 L64 132 L60 62 L56 132 L34 132 Z"/>',
    cargo:  '<path d="M40 18 L80 18 L86 132 L64 132 L60 62 L56 132 L34 132 Z"/>' +
            '<rect x="42" y="70" width="12" height="14" rx="2" stroke="rgba(0,0,0,0.3)" stroke-width="2" fill="none"/>' +
            '<rect x="66" y="70" width="12" height="14" rx="2" stroke="rgba(0,0,0,0.3)" stroke-width="2" fill="none"/>',
  };
  return '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#22d3ee"/>' +
    '</linearGradient></defs>' +
    '<g fill="url(#' + gid + ')" stroke="rgba(255,255,255,0.28)" stroke-width="2" stroke-linejoin="round">' +
    shapes[item.type] + '</g></svg>';
}
