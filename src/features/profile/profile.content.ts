import type { Language } from "../../i18n";

export type Option = { value: string; label: Record<Language, string> };

export const GENDER_OPTIONS: Option[] = [
  { value: "ชาย", label: { th: "ชาย", en: "Male" } },
  { value: "หญิง", label: { th: "หญิง", en: "Female" } },
  { value: "LGBTQ+", label: { th: "LGBTQ+", en: "LGBTQ+" } },
  { value: "ไม่ระบุ", label: { th: "ไม่ระบุ", en: "Prefer not to say" } },
];

/** Programmes offered at SUT, used by the major picker and the feed filter. */
export const MAJOR_OPTIONS: Option[] = [
  { value: "วิศวกรรมคอมพิวเตอร์", label: { th: "วิศวกรรมคอมพิวเตอร์", en: "Computer Engineering" } },
  { value: "วิศวกรรมเคมี", label: { th: "วิศวกรรมเคมี", en: "Chemical Engineering" } },
  { value: "วิศวกรรมโยธา", label: { th: "วิศวกรรมโยธา", en: "Civil Engineering" } },
  { value: "วิศวกรรมไฟฟ้า", label: { th: "วิศวกรรมไฟฟ้า", en: "Electrical Engineering" } },
  { value: "วิศวกรรมเครื่องกล", label: { th: "วิศวกรรมเครื่องกล", en: "Mechanical Engineering" } },
  { value: "วิศวกรรมอุตสาหการ", label: { th: "วิศวกรรมอุตสาหการ", en: "Industrial Engineering" } },
  { value: "วิศวกรรมสิ่งแวดล้อม", label: { th: "วิศวกรรมสิ่งแวดล้อม", en: "Environmental Engineering" } },
  { value: "วิศวกรรมโทรคมนาคม", label: { th: "วิศวกรรมโทรคมนาคม", en: "Telecommunication Engineering" } },
  { value: "วิศวกรรมขนส่งและโลจิสติกส์", label: { th: "วิศวกรรมขนส่งและโลจิสติกส์", en: "Logistics Engineering" } },
  { value: "วิศวกรรมเกษตรและอาหาร", label: { th: "วิศวกรรมเกษตรและอาหาร", en: "Agricultural & Food Eng." } },
  { value: "เทคโนโลยีสารสนเทศ", label: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" } },
  { value: "เทคโนโลยีการจัดการ", label: { th: "เทคโนโลยีการจัดการ", en: "Management Technology" } },
  { value: "วิทยาการคอมพิวเตอร์", label: { th: "วิทยาการคอมพิวเตอร์", en: "Computer Science" } },
  { value: "แพทยศาสตร์", label: { th: "แพทยศาสตร์", en: "Medicine" } },
  { value: "พยาบาลศาสตร์", label: { th: "พยาบาลศาสตร์", en: "Nursing" } },
  { value: "ทันตแพทยศาสตร์", label: { th: "ทันตแพทยศาสตร์", en: "Dentistry" } },
  { value: "สาธารณสุขศาสตร์", label: { th: "สาธารณสุขศาสตร์", en: "Public Health" } },
  { value: "เทคโนโลยีการเกษตร", label: { th: "เทคโนโลยีการเกษตร", en: "Agricultural Technology" } },
  { value: "เทคโนโลยีอาหาร", label: { th: "เทคโนโลยีอาหาร", en: "Food Technology" } },
  { value: "นิเทศศาสตร์ดิจิทัล", label: { th: "นิเทศศาสตร์ดิจิทัล", en: "Digital Communication" } },
  { value: "บริหารธุรกิจ / บัญชี", label: { th: "บริหารธุรกิจ / บัญชี", en: "Business / Accounting" } },
];

/** Values are stored verbatim, so keep them stable — the API matches on them. */
export const ROOM_TYPES = ["Single", "Double", "Either"] as const;
export const PROPERTY_TYPES = [
  "On-campus",
  "Off-campus",
  "House",
  "Condo",
] as const;
export const ROOMMATE_GENDERS = [
  "Same gender",
  "Any",
  "Non-binary friendly",
] as const;

/** i18n keys for the fixed option sets above, in the same order. */
export const ROOM_TYPE_KEYS = ["single", "double", "either"] as const;
export const PROPERTY_TYPE_KEYS = [
  "onCampus",
  "offCampus",
  "house",
  "condo",
] as const;
export const ROOMMATE_GENDER_KEYS = [
  "sameGender",
  "anyGender",
  "nonBinaryFriendly",
] as const;

export function labelFor(options: Option[], value: string, language: Language) {
  return options.find((o) => o.value === value)?.label[language] ?? value;
}
