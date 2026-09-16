import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  BookOpen,
  Layers,
  PieChart as PieIcon,
  Tag as TagIcon,
} from "lucide-react-native";
import { api } from "../../services/api";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

const DONUT_SIZE = 130;
const DONUT_STROKE = 12;

/** Ring whose filled arc actually reflects `percent`, unlike a static border trick. */
function MatchedRatioRing({ percent }: { percent: number }) {
  const radius = (DONUT_SIZE - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const center = DONUT_SIZE / 2;
  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={DONUT_STROKE}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#8B1E1E"
        strokeWidth={DONUT_STROKE}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        fill="none"
        rotation={-90}
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}

type AnalyticsData = {
  matchedRatio: { matchedPercent: number; singlePercent: number };
  yearDistribution: { year: number; count: number; percent: number }[];
  facultyDistribution: { major: string; count: number }[];
  lifestyleTags: { tag: string; count: number; percent: number }[];
};

const EMPTY_ANALYTICS: AnalyticsData = {
  matchedRatio: { matchedPercent: 0, singlePercent: 0 },
  yearDistribution: [],
  facultyDistribution: [],
  lifestyleTags: [],
};

const YEAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
const TAG_COLORS: Record<string, string> = {
  "Night Owl": "#8B1E1E",
  Spotless: "#10B981",
  "Quiet Hours": "#3B82F6",
  "AC 25°C": "#F59E0B",
  "Library Study": "#8B5CF6",
};
const FACULTY_COLORS = [
  "#8B1E1E",
  "#EC4899",
  "#3B82F6",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
];

const MAJOR_THAI_MAP: Record<string, string> = {
  "Computer Engineering": "วิศวกรรมคอมพิวเตอร์",
  "Chemical Engineering": "วิศวกรรมเคมี",
  "Civil Engineering": "วิศวกรรมโยธา",
  "Electrical Engineering": "วิศวกรรมไฟฟ้า",
  "Mechanical Engineering": "วิศวกรรมเครื่องกล",
  "Industrial Engineering": "วิศวกรรมอุตสาหการ",
  "Environmental Engineering": "วิศวกรรมสิ่งแวดล้อม",
  "Telecommunication Engineering": "วิศวกรรมโทรคมนาคม",
  "Logistics Engineering": "วิศวกรรมขนส่งและโลจิสติกส์",
  "Agricultural & Food Eng.": "วิศวกรรมเกษตรและอาหาร",
  "Agricultural and Food Engineering": "วิศวกรรมเกษตรและอาหาร",
  "Information Technology": "เทคโนโลยีสารสนเทศ",
  "Management Technology": "เทคโนโลยีการจัดการ",
  "Information Technology Management": "เทคโนโลยีการจัดการ",
  "การจัดการเทคโนโลยีสารสนเทศ": "เทคโนโลยีการจัดการ",
  "Computer Science": "วิทยาการคอมพิวเตอร์",
  "Medicine": "แพทยศาสตร์",
  "Nursing": "พยาบาลศาสตร์",
  "Dentistry": "ทันตแพทยศาสตร์",
  "Public Health": "สาธารณสุขศาสตร์",
  "Agricultural Technology": "เทคโนโลยีการเกษตร",
  "Food Technology": "เทคโนโลยีอาหาร",
  "Digital Communication": "นิเทศศาสตร์ดิจิทัล",
  "Digital Technology": "เทคโนโลยีดิจิทัล",
  "Business Administration": "บริหารธุรกิจ / บัญชี",
  "Business / Accounting": "บริหารธุรกิจ / บัญชี",
  "Business": "บริหารธุรกิจ / บัญชี",
  "Architecture": "สถาปัตยกรรมศาสตร์",
  "Physical Therapy": "กายภาพบำบัด",
  "Metallurgical Engineering": "วิศวกรรมโลหการ",
  "Biotechnology": "เทคโนโลยีชีวภาพ",
};

function normalizeMajorToThai(major: string): string {
  if (!major) return "ไม่ระบุสาขา";
  const trimmed = major.trim();
  return MAJOR_THAI_MAP[trimmed] ?? trimmed;
}

export function Analytics({ go }: { go: (x: Screen) => void }) {
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);

  useEffect(() => {
    api<AnalyticsData>("/api/admin/analytics")
      .then(setData)
      .catch(() => setData(EMPTY_ANALYTICS));
  }, []);

  const { matchedRatio, yearDistribution, facultyDistribution, lifestyleTags } = data;
  const maxYearPercent = Math.max(...yearDistribution.map((y) => y.percent), 1);
  const years = yearDistribution.map((y, i) => ({
    label: `ชั้นปีที่ ${y.year}`,
    percent: y.percent,
    barHeightPercent: (y.percent / maxYearPercent) * 100,
    count: y.count,
    color: YEAR_COLORS[i % YEAR_COLORS.length],
  }));
  const tags = lifestyleTags.map((t) => ({
    ...t,
    color: TAG_COLORS[t.tag] ?? "#8B1E1E",
  }));

  const faculties = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const f of facultyDistribution) {
      const thaiName = normalizeMajorToThai(f.major);
      map.set(thaiName, (map.get(thaiName) ?? 0) + f.count);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: FACULTY_COLORS[i % FACULTY_COLORS.length],
      }));
  }, [facultyDistribution]);

  return (
    <AdminLayout currentScreen="analytics" go={go}>
      {/* Top Section: Matched Ratio & Year Distribution */}
      <View style={styles.row}>
        {/* Card 1: Matched Ratio Donut Chart */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <PieIcon size={20} color="#8B1E1E" />
            <Text style={styles.cardTitle}>Matched Ratio</Text>
          </View>
          <View style={styles.donutContainer}>
            <View style={styles.donutWrap}>
              <MatchedRatioRing percent={matchedRatio.matchedPercent} />
              <View style={styles.donutCenter}>
                <Text style={styles.donutPercent}>{matchedRatio.matchedPercent}%</Text>
                <Text style={styles.donutLabel}>Matched</Text>
              </View>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#8B1E1E" }]} />
              <Text style={styles.legendText}>Matched ({matchedRatio.matchedPercent}%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#E5E7EB" }]} />
              <Text style={styles.legendText}>Single ({matchedRatio.singlePercent}%)</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Year Distribution */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <Layers size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>Year Distribution</Text>
          </View>
          <View style={styles.barsVerticalContainer}>
            {years.map((y) => (
              <View key={y.label} style={styles.yearBarCol}>
                <Text style={styles.yearPercentVal}>{y.percent}%</Text>
                <View style={styles.yearBarTrack}>
                  <View
                    style={[
                      styles.yearBarFill,
                      { height: `${y.barHeightPercent}%`, backgroundColor: y.color },
                    ]}
                  />
                </View>
                <Text style={styles.yearLabel}>{y.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Bottom Section: Lifestyle Tags & Faculty Distribution */}
      <View style={styles.row}>
        {/* Card 3: Lifestyle Tags Distribution */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <TagIcon size={20} color="#10B981" />
            <Text style={styles.cardTitle}>Lifestyle Tags Distribution</Text>
          </View>
          <View style={styles.tagsContainer}>
            {tags.map((item) => (
              <View key={item.tag} style={styles.tagProgressRow}>
                <Text style={styles.tagName}>{item.tag}</Text>
                <View style={styles.tagTrack}>
                  <View
                    style={[
                      styles.tagFill,
                      { width: `${item.percent}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
                <Text style={styles.tagVal}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card 4: Faculty / Major Distribution */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <BookOpen size={20} color="#F59E0B" />
            <Text style={styles.cardTitle}>Faculty Distribution</Text>
          </View>
          <View style={styles.facultyList}>
            {faculties.map((f) => (
              <View key={f.name} style={styles.facultyRow}>
                <View style={[styles.facultyDot, { backgroundColor: f.color }]} />
                <Text style={styles.facultyName}>{f.name}</Text>
                <Text style={styles.facultyCount}>{f.count} คน</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#111827",
  },

  /* Donut Chart */
  donutContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
  donutWrap: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
  },
  donutCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  donutPercent: {
    fontFamily: F.bold,
    fontSize: 24,
    color: "#8B1E1E",
  },
  donutLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#6B7280",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#4B5563",
  },

  /* Year Distribution */
  barsVerticalContainer: {
    height: 180,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 10,
  },
  yearBarCol: {
    alignItems: "center",
    gap: 6,
  },
  yearPercentVal: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#374151",
  },
  yearBarTrack: {
    width: 28,
    height: 130,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  yearBarFill: {
    width: "100%",
    borderRadius: 6,
  },
  yearLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#6B7280",
  },

  /* Lifestyle Tags */
  tagsContainer: {
    gap: 12,
  },
  tagProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagName: {
    width: 100,
    fontFamily: F.medium,
    fontSize: 13,
    color: "#374151",
  },
  tagTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    overflow: "hidden",
  },
  tagFill: {
    height: "100%",
    borderRadius: 5,
  },
  tagVal: {
    width: 36,
    fontFamily: F.bold,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },

  /* Faculty */
  facultyList: {
    gap: 12,
  },
  facultyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  facultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  facultyName: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    color: "#374151",
  },
  facultyCount: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#6B7280",
  },
});
