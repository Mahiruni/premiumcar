export type Listing={id:string;title:string;price:number;city:string;region:string;category:string;image:string;condition:string;time:string;verified?:boolean;description:string;seller_id?:string};

// Marketplace taxonomy/configuration only. Listing records and images come exclusively from Supabase.
export const categories=[['🚗','მან?','መኪናዎች','Cars'],['🏠','ቤቶች','ቤት እና መሬት','Real estate'],['💻','ኤሌክትሮኒክስ','ኤሌክትሮኒክስ','Electronics'],['🛋️','የቤት ዕቃ','የቤት ዕቃ','Furniture'],['💼','ስራ','ስራ እና አገልግሎት','Jobs'],['🛠️','አገልግሎት','አገልግሎት','Services'],['🐕','እንስሳት','እንስሳት','Animals'],['📱','ስልኮች','ስልኮች','Phones']];
export const cities=['Addis Ababa','Bahir Dar','Hawassa','Dire Dawa','Mekelle','Adama','Jimma','Gondar','Bishoftu','Dessie'];
export const money=(n:number)=>new Intl.NumberFormat('en-US').format(n)+' ETB';
