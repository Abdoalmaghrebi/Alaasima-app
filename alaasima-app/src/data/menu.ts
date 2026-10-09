export interface MenuItem {
  id: string;
  name: string;
  category: "shawarma" | "broasted" | "western" | "fatteh" | "appetizers" | "beverages";
  price: number; // السيرة بالسوري
  description?: string;
}

export const MENU_DATA: MenuItem[] = [
  // الشاورما
  { id: "sw-1", name: "ساندويش شاورما دبل", category: "shawarma", price: 25000, description: "خبز صاج مع ثوم ومخلل" },
  { id: "sw-2", name: "وجبة شاورما عربي دبل", category: "shawarma", price: 35000, description: "وجبة مقطعة مع بطاطا وثوم ومخلل" },
  { id: "sw-3", name: "وجبة شاورما عربي اكسترا", category: "shawarma", price: 42000, description: "وجبة مشبعة مع إضافة ثوم ومخلل وبطاطا" },
  { id: "sw-4", name: "كيلو شاورما دجاج", category: "shawarma", price: 140000, description: "مع السرافيس الكاملة (ثوم، مخلل، خبز)" },

  // البروستد والدجاج
  { id: "br-1", name: "وجبة بروستد 4 قطع", category: "broasted", price: 65000, description: "مع بطاطا وثوم ومخلل وخبز" },
  { id: "br-2", name: "فروج مشوي على الفحم", category: "broasted", price: 110000, description: "مع ثوم ومخلل وخبز وسرافيس" },

  // الغربي
  { id: "ws-1", name: "ساندويش زنجر", category: "western", price: 28000, description: "دجاج حار مع خس وصوس وكوتسلو" },
  { id: "ws-2", name: "ساندويش كريسبي", category: "western", price: 27000, description: "قطع كريسبي مع صوص ومخلل" },
  { id: "ws-3", name: "ساندويش اسكالوب", category: "western", price: 26000, description: "صدر دجاج مقلي مع صوص خاص" },

  // الفتات والمقبلات والمشروبات
  { id: "ft-1", name: "صحن فتة بالسمنة", category: "fatteh", price: 30000 },
  { id: "app-1", name: "صحن بطاطا مقلية", category: "appetizers", price: 15000 },
  { id: "app-2", name: "علبة ثوم إضافية", category: "appetizers", price: 5000 },
  { id: "bev-1", name: "مشروب كينزا (Kinza)", category: "beverages", price: 7000 },
  { id: "bev-2", name: "لبن عيران", category: "beverages", price: 6000 }
  ,
];
