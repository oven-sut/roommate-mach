import type { Language } from "../../i18n";
import type { MatchProfile } from "../../types/models";
import { MAJOR_OPTIONS, labelFor } from "../profile/profile.content";

/** The four score components the match profile breaks a percentage down into. */
export const BREAKDOWN_ROWS = [
  { key: "sleep", labelKey: "catSleep" },
  { key: "cleanliness", labelKey: "catClean" },
  { key: "guests", labelKey: "catGuests" },
  { key: "temperature", labelKey: "catTemp" },
] as const;

/** Year bands the feed filter offers, relative to the signed-in student. */
export const YEAR_BANDS = [
  { value: "under", key: "yearUnder" },
  { value: "peer", key: "yearPeer" },
  { value: "upper", key: "yearUpper" },
  { value: "everyone", key: "yearEveryone" },
] as const;

/** Categories a match can be required to agree on. */
export const MUST_MATCH = [
  { value: "sleep", key: "sleepSchedule" },
  { value: "cleanliness", key: "cleanlinessFilter" },
  { value: "guests", key: "guestsFilter" },
  { value: "acTemp", key: "acTempFilter" },
] as const;

export const BUDGET_MIN = 1500;
export const BUDGET_MAX = 15000;
export const BUDGET_STEP = 500;

/**
 * Second line of a discover card: "Computer ENG - Year 1 - wants double room".
 * Pieces that the API did not send are dropped rather than rendered blank.
 */
export function describe(
  person: MatchProfile | null | undefined,
  language: Language,
  t: (key: string) => string,
): string {
  const profile = person?.profile;
  if (!profile) return "";

  const parts: string[] = [];
  if (profile.major) parts.push(labelFor(MAJOR_OPTIONS, profile.major, language));
  if (profile.year) parts.push(`${t("year")} ${profile.year}`);
  if (profile.roomType) {
    parts.push(`${t("wantsRoom")} ${profile.roomType.toLowerCase()}`);
  }
  return parts.join(" - ");
}

/** Name and age as one string, tolerating either being missing. */
export function nameAndAge(person: MatchProfile | null | undefined): string {
  const name = person?.displayName?.trim() || "—";
  const age = person?.profile?.age;
  return age ? `${name}, ${age}` : name;
}

/**
 * Lifestyle chips for a card. The API returns them pre-computed when the other
 * student has finished the questionnaire; anything else falls back to the
 * housing preferences, so a card is never chip-less.
 */
export function cardTags(person: MatchProfile | null | undefined): string[] {
  if (person?.tags?.length) return Array.from(new Set(person.tags));
  const profile = person?.profile;
  if (!profile) return [];
  const tags: string[] = [];
  if (profile.roomType) tags.push(profile.roomType);
  if (profile.propertyType) tags.push(profile.propertyType);
  if (profile.zone) tags.push(profile.zone);
  if (profile.roommateGender) tags.push(profile.roommateGender);
  const result = tags.length > 0
    ? tags
    : ([profile.roomType, profile.propertyType].filter(Boolean) as string[]);
  return Array.from(new Set(result));
}

export function isVerified(person: MatchProfile | null | undefined): boolean {
  return person?.verification?.status === "VERIFIED";
}

/** "matched 2 h ago" — coarse on purpose; exact times add no value here. */
export function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 60) return `${minutes} m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

const FEMALE_NAMES = [
  "พลอย ศิริวรรณ (Ploy)", "น้องฟ้า นภัสสร (Fah)", "แพรว ชนิดา (Praew)", "มิ้นท์ นพวรรณ (Mint)",
  "สิรินทร์ วงศ์ไทย (Sirin)", "อรนิชา สุขเจริญ (Orn)", "รินรดา พงษ์ศิริ (Rin)", "พิมพ์มาดา รัตนกุล (Pim)",
  "วริศรา ใจดี (Grace)", "กัญญาพัชร เลิศรัตน์ (Kanya)", "นลิน สุวรรณ (Nalin)", "ภัทรวดี คงมั่น (Pat)",
  "ชลธิชา ศรีสุข (Fern)", "เมทินี อัครเดช (May)", "ณิชาภัทร วโรดม (Nicha)", "ปัณฑ์นารี ชัยชนะ (Pan)",
  "ชัญญา วิเศษ (Chanya)", "กุลนันท์ พรหมดี (Kookai)", "ศศิภา ศิริผล (Sasi)", "นัทธมน สุขสมบูรณ์ (Nat)",
  "พิชญาดา วงศ์สวัสดิ์ (Pang)", "สุชานันท์ คำหวาน (Nan)", "ธนัชชา บุญรอด (Ice)", "วรินทร์ธร ใจกว้าง (Baitong)",
  "ชนิกานต์ เลิศปัญญา (Mind)"
];

const MALE_NAMES = [
  "เต้ ณัฐพงษ์ (Tae)", "มาร์ค ชัยภูมิ (Mark)", "วิน ภัทรดนัย (Win)", "บอส กิตติพงษ์ (Boss)",
  "กวิน วรเมธ (Kawin)", "พิชญะ ธนกฤต (Pitch)", "ปริญญา ธีรภัทร์ (Prin)", "ชานนท์ ศุภโชค (Non)",
  "ฐิติกร อภิสิทธิ์ (Tee)", "ธนกร ปณิธาน (Gunn)", "ธนัท เลิศไพศาล (Nat)", "ศุภกิตติ์ สุวรรณ (Kit)",
  "ภัทรพล ใจกล้า (Pat)", "อัครวินท์ เด่นดวง (Win)", "ชยุตม์ กิตติภูมิ (Earth)", "ณกร วิเศษ (Nack)",
  "ปัณณทัต ศรีทอง (Pun)", "ภูริณัฐ ชัยเจริญ (Phu)", "กษิดิศ สุขเกษม (Kasidit)", "วรภพ รุ่งเรือง (Pop)",
  "ธนวรรธน์ พรหมวิหาร (Tan)", "ศรัณย์ เด่นประเสริฐ (Sun)", "ณัฐดนัย สมบูรณ์ (Nath)", "จิรภัทร ชาญชัย (Jirath)",
  "กิตติศักดิ์ ศรีวิไล (Golf)"
];

const MAJORS_LIST = [
  "วิศวกรรมคอมพิวเตอร์", "วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "แพทยศาสตร์",
  "พยาบาลศาสตร์", "เทคโนโลยีการจัดการ", "สถาปัตยกรรมศาสตร์", "นิเทศศาสตร์ดิจิทัล",
  "วิศวกรรมเครื่องกล", "วิศวกรรมโยธา", "วิศวกรรมเคมี", "วิศวกรรมไฟฟ้า",
  "ภาษาอังกฤษ", "วิทยาศาสตร์การกีฬา", "เทคโนโลยีการเกษตร", "เทคโนโลยีอาหาร",
  "การจัดการการท่องเที่ยว", "สาธารณสุขศาสตร์"
];

const FEMALE_PHOTOS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80",
];

const MALE_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1492446845049-9c50cc313f00?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
];

const TAG_POOL = [
  ["Early Riser 22:30", "Spotless 5/5", "Quiet Hours", "AC 25°C"],
  ["Night Owl 01:00", "Gamer", "Dishes Same Day", "Tidy & Clean"],
  ["Non-smoker", "Equal Budget", "Senior Year 4", "Spotless"],
  ["Med Student", "No Guests", "Study Mode", "Quiet Hours"],
  ["Chill Vibe", "Study Group", "AC 23°C", "Weekly Clean"],
  ["Freshy Year 1", "Sports & Gym", "Easy Going", "Double Room"],
  ["Creative", "Non-binary Friendly", "Social", "Group Room"],
  ["Shift Work", "Flexible Sleep", "Respect Privacy", "On-campus"],
  ["Coffee Lover", "Cooking OK", "Clean Room", "Gate 1"],
  ["Music & Headphones", "Minimalist", "AC 24°C", "Off-campus"],
  ["Cat Friendly", "Quiet at Night", "Study Hard", "Gate 2"],
  ["Early Bird", "No Smoking", "Clean Freak", "On-campus"],
];

const BIO_TEMPLATES = [
  "ชอบความเป็นระเบียบเรียบร้อย เข้านอนไว อ่านหนังสือเงียบๆ ชวนติวได้เสมอค่ะ/ครับ!",
  "ปี 4 กำลังทำโปรเจกต์จบ เงียบสงบ ไม่สูบบุหรี่ ช่วยหารค่าหอพักคนละครึ่งครับ/ค่ะ",
  "เด็กคอม IT เล่นเกมตอนค่ำใส่หูฟังเสมอ ล้างจานทุกวัน ไม่กวนเวลาพักผ่อนแน่นอนครับ",
  "เรียนหมอค่ะ อ่านหนังสือหนักช่วงสอบ สภาพห้องสะอาด ไม่พาเพื่อนภายนอกมาค้างคืน",
  "สายชิล ชอบเปิดแอร์เย็นๆ 23°C มีพาเพื่อนกลุ่มติวมาห้องสัปดาห์ละครั้งล่วงหน้าครับ",
  "เฟรชชี่ชอบออกกำลังกาย นิสัยอยู่ง่ายสบายๆ รักษาความสะอาดห้องเสมอครับ/ค่ะ",
  "สายครีเอทีฟ ทำงานกราฟิกตอนกลางคืน เปิดรับเพื่อนร่วมห้องทุกเพศ เฟรนลี่พูดคุยง่ายค่ะ",
  "เรียนพยาบาลปี 3 ขึ้นตึกฝึกงานเปลี่ยนตามเวรกะ พักผ่อนไม่เป็นเวลา เคารพความเป็นส่วนตัวสูงค่ะ",
  "ชอบทำอาหารทานเอง รักความสะอาด เปิดแอร์ 24-25 องศา หาเพื่อนหารค่าหอพักระยะยาวครับ",
  "ตื่นเช้า 6 โมง อ่านหนังสือเงียบๆ ไม่พาคนนอกมาห้อง หาเพื่อนหอพักประตู 1 ครับ",
  "เด็กวิศวะสายกิจกรรม ชอบเล่นกีฬา ฟิตเนส พูดคุยง่าย ไม่เรื่องมากครับ",
  "ชอบแต่งห้องสไตล์มินิมอล ล้างจานทันทีหลังกินเสร็จ ไม่ส่งเสียงดังหลัง 23:00 น."
];

function generate100DemoProfiles(): MatchProfile[] {
  const list: MatchProfile[] = [];
  const zones = ["Gate 1", "Gate 2", "Gate 3", "Gate 4", "Off-campus"];
  const roomTypes = ["Double", "Single", "Group"];
  const propertyTypes = ["Off-campus", "On-campus"];

  for (let i = 1; i <= 100; i++) {
    const isFemale = i % 2 === 1;
    const names = isFemale ? FEMALE_NAMES : MALE_NAMES;
    const nameIndex = Math.floor((i - 1) / 2) % names.length;
    const name = names[nameIndex];
    
    // Spread scores smoothly from 99% down to 52%
    const score = Math.max(52, Math.min(99, Math.round(99 - ((i - 1) * 47) / 99)));
    
    // Slightly randomize breakdown components around the total score
    const sleep = Math.min(100, Math.max(45, score + ((i % 5) - 2) * 3));
    const cleanliness = Math.min(100, Math.max(45, score + (((i + 2) % 5) - 2) * 3));
    const guests = Math.min(100, Math.max(45, score + (((i + 1) % 5) - 2) * 3));
    const temperature = Math.min(100, Math.max(45, score + (((i + 3) % 5) - 2) * 3));

    const photos = isFemale ? FEMALE_PHOTOS : MALE_PHOTOS;
    const photoUrl = photos[(i - 1) % photos.length];
    const tags = TAG_POOL[(i - 1) % TAG_POOL.length];
    const major = MAJORS_LIST[(i - 1) % MAJORS_LIST.length];
    const bio = BIO_TEMPLATES[(i - 1) % BIO_TEMPLATES.length];

    const age = 18 + (i % 6); // 18-23
    const year = 1 + (i % 4); // 1-4
    const zone = zones[i % zones.length];
    const roomType = roomTypes[i % roomTypes.length];
    const propertyType = propertyTypes[i % propertyTypes.length];

    const budgetMin = 2000 + (i % 5) * 500; // 2000 - 4000
    const budgetMax = budgetMin + 2500 + (i % 4) * 500; // 4500 - 7000

    list.push({
      id: `demo-${i}`,
      displayName: name,
      score,
      breakdown: { sleep, cleanliness, guests, temperature },
      tags,
      verification: { status: i % 4 === 0 ? "NOT_SUBMITTED" : "VERIFIED" },
      profile: {
        age,
        gender: isFemale ? "หญิง" : "ชาย",
        major,
        year,
        bio,
        roomType,
        propertyType,
        zone,
        budgetMin,
        budgetMax,
        photos: [photoUrl],
        completed: true,
      },
    });
  }

  return list;
}

/**
 * Rich set of 100 diverse demo profiles with varied lifestyle questionnaire scores,
 * majors, room types, and match percentages (52% - 99%).
 */
export const DEMO_PROFILES: MatchProfile[] = generate100DemoProfiles();

