/** A question as served by `GET /api/questionnaire`, before localisation. */
export type QuestionData = { id: string; key: string; step: number; title: string; sub: string; groups: { label: string; items: string[]; active: number[] }[]; note?: string };
export type AnswerData = { questionId: string; selections: string[][] };

export function localizeQuestion(d: QuestionData, lang: "th" | "en"): QuestionData {
  const translations: Record<string, {
    title: { th: string; en: string };
    sub: { th: string; en: string };
    note?: { th: string; en: string };
    groups: {
      label: { th: string; en: string };
      items: Record<string, { th: string; en: string }>;
    }[];
  }> = {
    q1: {
      title: { th: "เวลานอนและจังหวะชีวิต", en: "Sleep & Wake Rhythm" },
      sub: { th: "ระบุเวลาที่คุณมักจะเข้านอนและเริ่มต้นวันใหม่", en: "Tell us when you usually sleep and start your day." },
      note: { th: "พฤติกรรมเหล่านี้ช่วยให้ระบบจับคู่เพื่อนที่มีจังหวะชีวิตตรงกัน", en: "These habits help us match students with similar daily rhythms." },
      groups: [
        {
          label: { th: "เวลาเข้านอนปกติ", en: "Usual Bedtime" },
          items: {
            "21:00 – 22:30": { th: "21:00 – 22:30 น.", en: "9:00 PM – 10:30 PM" },
            "23:00 – 00:30": { th: "23:00 – 00:30 น.", en: "11:00 PM – 12:30 AM" },
            "01:00+": { th: "01:00 น. ขึ้นไป", en: "1:00 AM or later" },
          },
        },
        {
          label: { th: "เวลาตื่นนอนปกติ", en: "Usual Wake-up Time" },
          items: {
            "06:00 – 07:00": { th: "06:00 – 07:00 น.", en: "6:00 AM – 7:00 AM" },
            "07:00 – 08:00": { th: "07:00 – 08:00 น.", en: "7:00 AM – 8:00 AM" },
            "09:00+": { th: "09:00 น. ขึ้นไป", en: "9:00 AM or later" },
          },
        },
      ],
    },
    q2: {
      title: { th: "ความสะอาดและระดับความเรียบร้อย", en: "Cleanliness & Routines" },
      sub: { th: "เลือกระดับความสะอาดยอมรับได้ในห้องนอนและพื้นที่ส่วนรวม", en: "Choose the habits that matter most in a shared room." },
      note: { th: "เรื่องความสะอาดเป็นหนึ่งในปัจจัยหลักของการอยู่ร่วมกันอย่างมีความสุข", en: "Cleanliness is a key factor for comfortable room sharing." },
      groups: [
        {
          label: { th: "เกณฑ์ความสะอาดที่สำคัญ", en: "Key Cleanliness Rules" },
          items: {
            "Spotless": { th: "สะอาดเป็นระเบียบเสมอ", en: "Spotless & tidy always" },
            "Dishes same day": { th: "ล้างจานภายในวันที่กินเสร็จ", en: "Wash dishes on the same day" },
            "Shoes off inside": { th: "ถอดรองเท้าไว้หน้าห้อง", en: "Shoes off inside room" },
            "Make the bed": { th: "เก็บที่นอนทุกเช้า", en: "Make the bed every morning" },
            "Shared cleaning schedule": { th: "มีตารางแบ่งกันทำความสะอาด", en: "Shared cleaning schedule" },
          },
        },
        {
          label: { th: "ระดับความเจ้าระเบียบ (1-5)", en: "Tidiness Rating (1-5)" },
          items: {
            "1/5": { th: "1/5 (สบาย ๆ ไม่ซีเรียส)", en: "1/5 (Very relaxed)" },
            "2/5": { th: "2/5 (พอประมาณ)", en: "2/5 (Moderate)" },
            "3/5": { th: "3/5 (ปานกลางทั่วไป)", en: "3/5 (Balanced)" },
            "4/5": { th: "4/5 (ค่อนข้างเจ้าระเบียบ)", en: "4/5 (Quite tidy)" },
            "5/5": { th: "5/5 (เป๊ะเนี๊ยบทุกจุด)", en: "5/5 (Extremely neat)" },
          },
        },
      ],
    },
    q3: {
      title: { th: "การรับแขกและความเงียบสงบ", en: "Guests & Social Energy" },
      sub: { th: "กำหนดข้อตกลงเกี่ยวกับการพาเพื่อนมาห้องและระดับเสียง", en: "Set expectations for visitors and shared social time." },
      note: { th: "ช่วยป้องกันข้อขัดแย้งเรื่องความเป็นส่วนตัวและเวลาพักผ่อน", en: "Prevents conflicts regarding privacy and quiet rest hours." },
      groups: [
        {
          label: { th: "การพาเพื่อนหรือแขกมาที่ห้อง", en: "Guests in the Room" },
          items: {
            "Rarely": { th: "นาน ๆ ครั้ง / แทบไม่มี", en: "Rarely / Almost never" },
            "Sometimes": { th: "ปานกลาง (แจ้งล่วงหน้า)", en: "Sometimes (Notify in advance)" },
            "Often": { th: "บ่อยครั้ง / เป็นประจำ", en: "Often / Frequently" },
          },
        },
        {
          label: { th: "บุคคลที่มักจะพามาห้อง", en: "Who Might Visit?" },
          items: {
            "Close friends": { th: "เพื่อนสนิท", en: "Close friends" },
            "Study group": { th: "เพื่อนกลุ่มติวหนังสือ", en: "Study group" },
            "Family": { th: "ครอบครัว / ญาติ", en: "Family" },
            "Partner": { th: "แฟน / คนคุย", en: "Partner" },
          },
        },
        {
          label: { th: "ระดับพลังงานในการสังสรรค์", en: "Social Energy" },
          items: {
            "Quiet": { th: "ชอบความสงบเป็นส่วนตัว", en: "Quiet & introverted" },
            "Balanced": { th: "ปานกลาง ปรับตามโอกาส", en: "Balanced & adaptable" },
            "Very social": { th: "ชอบพูดคุยสังสรรค์เฮฮา", en: "Very social & extroverted" },
          },
        },
      ],
    },
    q4: {
      title: { th: "บรรยากาศการเรียนและอุณหภูมิห้อง", en: "Temperature & Study Setup" },
      sub: { th: "ตั้งค่าสภาพแวดล้อมที่ชอบสำหรับอ่านหนังสือและการปรับแอร์", en: "Help us understand how you work best in your room." },
      note: { th: "ปรับตั้งค่าให้เหมาะกับไลฟ์สไตล์การอ่านหนังสือและการนอนของคุณ", en: "Helps match study atmosphere and air conditioning preferences." },
      groups: [
        {
          label: { th: "อุณหภูมิเครื่องปรับอากาศที่ชอบ", en: "Preferred AC Temperature" },
          items: {
            "22–24°": { th: "22–24 °C (ชอบเย็นฉ่ำ)", en: "22–24 °C (Cool)" },
            "25–26°": { th: "25–26 °C (กำลังดีสบายตัว)", en: "25–26 °C (Standard)" },
            "27°+": { th: "27 °C ขึ้นไป / พัดลม", en: "27 °C+ / Fan" },
          },
        },
        {
          label: { th: "ความต้องการความเงียบตอนอ่านหนังสือ", en: "Need for Quiet While Studying" },
          items: {
            "1/5": { th: "1/5 (เปิดเพลงฟังได้สบาย)", en: "1/5 (Music/Background noise ok)" },
            "2/5": { th: "2/5 (เสียงดังพอประมาณ)", en: "2/5 (Mild noise ok)" },
            "3/5": { th: "3/5 (ปานกลาง)", en: "3/5 (Moderate)" },
            "4/5": { th: "4/5 (ค่อนข้างต้องการความสงบ)", en: "4/5 (Quite quiet)" },
            "5/5": { th: "5/5 (เงียบกริบ 100%)", en: "5/5 (Absolute silence)" },
          },
        },
        {
          label: { th: "สถานที่อ่านหนังสือหลัก", en: "Best Study Location" },
          items: {
            "In room": { th: "อ่านหนังสือในห้องนอน", en: "In the bedroom" },
            "Library": { th: "หอสมุดมหาวิทยาลัย", en: "University library" },
            "Cafe / outside room": { th: "ร้านกาแฟ / พื้นที่ส่วนกลาง", en: "Cafe or outdoor study space" },
          },
        },
      ],
    },
    q5: {
      title: { th: "ความสนใจและพฤติกรรมส่วนตัว", en: "Lifestyle Boundaries" },
      sub: { th: "เลือกพฤติกรรมและเงื่อนไขการใช้ชีวิตในห้องพัก", en: "A few practical preferences for daily living." },
      groups: [
        {
          label: { th: "การสูบบุหรี่ / บุหรี่ไฟฟ้า (พอด)", en: "Smoking / Vaping Policy" },
          items: {
            "No": { th: "ไม่สูบเด็ดขาด", en: "Non-smoker strictly" },
            "Okay outdoors only": { th: "สูบนอกห้อง / ระเบียงได้", en: "Outdoors / balcony only" },
            "Okay indoors": { th: "สูบในห้องได้", en: "Okay indoors" },
          },
        },
        {
          label: { th: "การดื่มแอลกอฮอล์", en: "Alcohol Consumption" },
          items: {
            "Never": { th: "ไม่ดื่มเลย", en: "Never drink" },
            "Socially": { th: "ดื่มตามโอกาส / สังสรรค์", en: "Socially on occasions" },
            "Often": { th: "ดื่มบ่อยครั้ง", en: "Drink regularly" },
          },
        },
        {
          label: { th: "สัตว์เลี้ยงในห้อง", en: "Pet Preferences" },
          items: {
            "No pets": { th: "ไม่เลี้ยง / แพ้ขนสัตว์", en: "No pets allowed / allergic" },
            "Okay with some": { th: "เลี้ยงได้บางชนิด", en: "Okay with certain pets" },
            "Love them": { th: "รักสัตว์ เลี้ยงได้สบาย", en: "Pet friendly / love pets" },
          },
        },
      ],
    },
    q6: {
      title: { th: "ข้อตกลงเรื่องค่าใช้จ่ายและการปรับตัว", en: "Money & Shared Expectations" },
      sub: { th: "ตั้งเป้าหมายข้อตกลงร่วมกันกับเพื่อนร่วมห้อง", en: "Align on shared costs and willingness to compromise." },
      groups: [
        {
          label: { th: "การหารค่าใช้จ่ายส่วนกลาง (ค่าน้ำ/ค่าไฟ/ของใช้)", en: "Shared Expense Agreement" },
          items: {
            "Split equally": { th: "หารเท่ากันทุกอย่าง 50/50", en: "Split equally 50/50" },
            "Pay by usage": { th: "จ่ายตามการใช้งานจริง", en: "Pay by actual usage" },
            "Flexible / discuss": { th: "ยืดหยุ่น พูดคุยกันได้", en: "Flexible / discuss together" },
          },
        },
        {
          label: { th: "ระดับความยืดหยุ่นในการปรับตัวเข้าหากัน", en: "Flexibility & Compromise Level" },
          items: {
            "Low": { th: "มีระเบียบชัดเจน ค่อนข้างตายตัว", en: "Low (Strict rules)" },
            "Moderate": { th: "ยืดหยุ่นปานกลาง พออลุ่มอล่วยได้", en: "Moderate (Reasonable)" },
            "High": { th: "ยืดหยุ่นสูง ปรับตัวง่ายเข้ากับทุกคน", en: "High (Very adaptable)" },
          },
        },
      ],
    },
  };

  const tr = translations[d.key];
  if (!tr) return d;

  const currentLang = lang === "th" ? "th" : "en";

  return {
    ...d,
    title: tr.title[currentLang] || d.title,
    sub: tr.sub[currentLang] || d.sub,
    note: tr.note?.[currentLang] || d.note,
    groups: d.groups.map((group, gIdx) => {
      const trGroup = tr.groups[gIdx];
      return {
        ...group,
        label: trGroup?.label[currentLang] || group.label,
        items: group.items.map((item) => {
          const itemTranslation = trGroup?.items?.[item];
          return itemTranslation ? itemTranslation[currentLang] : item;
        }),
      };
    }),
  };
}

