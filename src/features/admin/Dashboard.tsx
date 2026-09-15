import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import {
  Activity,
  BarChart2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react-native";
import { api } from "../../services/api";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type Stats = {
  members: number;
  active: number;
  matches: number;
  messages: number;
  reports: number;
  pendingVerifications?: number;
  verifiedVerifications?: number;
  unverifiedVerifications?: number;
};

const EMPTY_STATS: Stats = {
  members: 1256,
  active: 321,
  matches: 142,
  messages: 890,
  reports: 5,
  pendingVerifications: 12,
  verifiedVerifications: 321,
  unverifiedVerifications: 12,
};

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const WEEKDAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Decorative usage curve (hourly buckets) — no hourly breakdown exists in Stats yet.
const PEAK_CURVE = [
  120, 90, 60, 40, 30, 25, 35, 55, 80, 100, 90, 70,
  50, 40, 45, 60, 90, 140, 220, 300, 360, 380, 340, 260,
];

function PeakTimeChart() {
  const W = 240;
  const H = 120;
  const max = Math.max(...PEAK_CURVE);
  const stepX = W / (PEAK_CURVE.length - 1);
  const points = PEAK_CURVE.map((v, i) => [i * stepX, H - (v / max) * H]);
  const linePath = `M${points.map((p) => p.join(",")).join(" L ")}`;
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#B53C3C" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#B53C3C" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#peakFill)" stroke="none" />
        <Path
          d={linePath}
          fill="none"
          stroke="#B53C3C"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.peakAxisRow}>
        <Text style={styles.peakAxisLabel}>00:00</Text>
        <Text style={styles.peakAxisLabel}>06:00</Text>
        <Text style={styles.peakAxisLabel}>12:00</Text>
        <Text style={styles.peakAxisLabel}>18:00</Text>
        <Text style={styles.peakAxisLabel}>24:00</Text>
      </View>
    </View>
  );
}

export function Dashboard({ go }: { go: (x: Screen) => void }) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [weekOffset, setWeekOffset] = useState(0);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    api<Stats>("/api/admin/dashboard")
      .then((data) => setStats({ ...EMPTY_STATS, ...data }))
      .catch(() => setStats(EMPTY_STATS));
  }, []);

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => {
    const base = startOfWeek(today);
    base.setDate(base.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [today, weekOffset]);
  const monthLabel = weekDays[3];
  const monthText = `${THAI_MONTHS[monthLabel.getMonth()]} ${monthLabel.getFullYear() + 543}`;

  const totalVerificationBucket =
    (stats.pendingVerifications ?? 0) +
    (stats.verifiedVerifications ?? 0) +
    (stats.unverifiedVerifications ?? 0);
  const pendingPct =
    totalVerificationBucket > 0
      ? Math.min(100, Math.max(8, ((stats.pendingVerifications ?? 0) / totalVerificationBucket) * 100))
      : 8;

  const swipeStages = [
    { label: "ปัดเลือกทั้งหมด", value: 4890 },
    { label: "กดถูกใจ", value: 1420 },
    { label: "จับคู่สำเร็จ", value: stats.matches ?? 142 },
  ];
  const swipeBase = swipeStages[0].value;

  /* ---- Left column blocks ---- */
  const statsBlock = (
    <View style={styles.statsRow}>
      <LinearGradient colors={["#8B1E1E", "#6B1620"]} style={[styles.statCard, styles.statCardActive]}>
        <Text style={styles.statLabelActive}>รออนุมัติสิทธิ์</Text>
        <Text style={styles.statNumberActive}>{stats.pendingVerifications ?? 12}</Text>
        <View style={styles.statProgressTrack}>
          <View style={[styles.statProgressFill, { width: `${pendingPct}%` }]} />
        </View>
      </LinearGradient>

      <View style={[styles.statCard, styles.statCardMuted]}>
        <Text style={styles.statLabelMuted}>จับคู่สำเร็จ</Text>
        <Text style={styles.statNumberMuted}>{stats.matches ?? 321}</Text>
      </View>

      <View style={[styles.statCard, styles.statCardMuted]}>
        <Text style={styles.statLabelMuted}>ยังไม่ยืนยันตัวตน</Text>
        <Text style={styles.statNumberMuted}>{stats.unverifiedVerifications ?? 12}</Text>
      </View>
    </View>
  );

  const safetyBlock = (
    <LinearGradient colors={["#FDEEEE", "#FFFFFF"]} style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartHeaderLeft}>
          <ShieldCheck size={20} color="#8B1E1E" />
          <Text style={styles.chartTitle}>รายงานความปลอดภัย</Text>
        </View>
        <View style={styles.legendCompact}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
            <Text style={styles.legendText}>โปรไฟล์</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.legendText}>คุกคาม</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
            <Text style={styles.legendText}>สแปม</Text>
          </View>
        </View>
      </View>
      <View style={styles.barChartContainer}>
        {[
          { month: "พ.ค.", profile: 15, harassment: 8, spam: 12 },
          { month: "มิ.ย.", profile: 22, harassment: 14, spam: 18 },
          { month: "ก.ค.", profile: 30, harassment: 18, spam: 25 },
          { month: "ส.ค.", profile: 42, harassment: 25, spam: 32 },
          { month: "ก.ย.", profile: 55, harassment: 30, spam: 38 },
        ].map((item) => (
          <View key={item.month} style={styles.barGroup}>
            <View style={styles.barTrack}>
              <View
                style={{
                  width: "100%",
                  backgroundColor: "#3B82F6",
                  height: `${(item.profile / 130) * 100}%`,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
              <View
                style={{
                  width: "100%",
                  backgroundColor: "#EF4444",
                  height: `${(item.harassment / 130) * 100}%`,
                }}
              />
              <View
                style={{
                  width: "100%",
                  backgroundColor: "#F59E0B",
                  height: `${(item.spam / 130) * 100}%`,
                }}
              />
            </View>
            <Text style={styles.barLabel}>{item.month}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );

  const swipeBlock = (
    <LinearGradient colors={["#8B1E1E", "#6B1620"]} style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartHeaderLeft}>
          <BarChart2 size={20} color="#FFFFFF" />
          <Text style={[styles.chartTitle, { color: "#FFFFFF" }]}>ปัดเลือก & จับคู่</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
        <View style={styles.funnelAxis}>
          {["100%", "75%", "50%", "25%", "0%"].map((l) => (
            <Text key={l} style={styles.funnelAxisLabel}>{l}</Text>
          ))}
        </View>
        <View style={styles.funnelTrack}>
          {swipeStages.map((s) => (
            <View key={s.label} style={styles.funnelBarGroup}>
              <Text style={styles.funnelValue}>{s.value.toLocaleString()}</Text>
              <View
                style={[
                  styles.funnelBar,
                  { height: `${Math.max(6, (s.value / swipeBase) * 100)}%` },
                ]}
              />
              <Text style={styles.funnelLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  /* ---- Right column blocks ---- */
  const calendarBlock = (
    <View style={styles.calendarWidget}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={() => setWeekOffset((o) => o - 1)} hitSlop={8}>
          <ChevronLeft size={18} color="#FFFFFF" />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CalendarIcon size={16} color="#FFFFFF" />
          <Text style={styles.calendarTitle}>{monthText}</Text>
        </View>
        <Pressable onPress={() => setWeekOffset((o) => o + 1)} hitSlop={8}>
          <ChevronRight size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
        {WEEKDAY_LABELS.map((day) => (
          <Text key={day} style={styles.calendarDaysLabel}>{day}</Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        {weekDays.map((d) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <View
              key={d.toISOString()}
              style={[styles.calendarDateCell, isToday && styles.calendarDateCellActive]}
            >
              <Text style={[styles.calendarDatesLabel, isToday && styles.calendarDatesLabelActive]}>
                {d.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const usersBlock = (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <LinearGradient colors={["#6F97CC", "#3F5F8F"]} style={styles.usersCard}>
        <Text style={styles.usersCardValue}>{stats.members.toLocaleString()}</Text>
        <Text style={styles.usersCardLabel}>USERS</Text>
      </LinearGradient>
      <Pressable style={styles.usersIconBtn} onPress={() => go("users")}>
        <UsersIcon size={22} color="#3F5F8F" />
      </Pressable>
    </View>
  );

  const peakBlock = (
    <View style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartHeaderLeft}>
          <Activity size={20} color="#3B82F6" />
          <Text style={styles.chartTitle}>ช่วงเวลาหนาแน่นที่สุด</Text>
        </View>
      </View>
      <PeakTimeChart />
    </View>
  );

  return (
    <AdminLayout currentScreen="dashboard" go={go}>
      {isDesktop ? (
        <View style={styles.gridRow}>
          <View style={styles.leftCol}>
            {statsBlock}
            {safetyBlock}
            {swipeBlock}
          </View>
          <View style={styles.rightCol}>
            {calendarBlock}
            {usersBlock}
            {peakBlock}
          </View>
        </View>
      ) : (
        <View style={{ gap: 16, width: "100%" }}>
          {statsBlock}
          {calendarBlock}
          {usersBlock}
          {safetyBlock}
          {peakBlock}
          {swipeBlock}
        </View>
      )}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    width: "100%",
  },
  leftCol: {
    flex: 2.2,
    gap: 16,
  },
  rightCol: {
    flex: 1,
    minWidth: 260,
    gap: 16,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    borderRadius: 16,
    padding: 16,
  },
  statCardActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardMuted: {
    backgroundColor: "#F3F4F6",
  },
  statLabelActive: {
    fontFamily: F.medium,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 8,
  },
  statNumberActive: {
    fontFamily: F.bold,
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  statProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  statProgressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  statLabelMuted: {
    fontFamily: F.medium,
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  statNumberMuted: {
    fontFamily: F.bold,
    fontSize: 28,
    color: "#374151",
  },

  calendarWidget: {
    backgroundColor: "#8B1E1E",
    borderRadius: 16,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  calendarDaysLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: F.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  calendarDateCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  calendarDateCellActive: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 2,
  },
  calendarDatesLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  calendarDatesLabelActive: {
    color: "#8B1E1E",
  },

  usersCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
  },
  usersCardValue: {
    fontFamily: F.bold,
    fontSize: 22,
    color: "#FFFFFF",
  },
  usersCardLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  usersIconBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#DCE7F5",
    alignItems: "center",
    justifyContent: "center",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  chartHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chartTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#111827",
  },

  barChartContainer: {
    height: 150,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  barGroup: {
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: 22,
    height: 110,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "#6B7280",
  },
  legendCompact: {
    gap: 4,
    alignItems: "flex-end",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: "#4B5563",
  },

  peakAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  peakAxisLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: "#9CA3AF",
  },

  funnelAxis: {
    height: 140,
    justifyContent: "space-between",
  },
  funnelAxisLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  funnelTrack: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 140,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.25)",
  },
  funnelBarGroup: {
    alignItems: "center",
    gap: 6,
    height: "100%",
    justifyContent: "flex-end",
  },
  funnelBar: {
    width: 40,
    backgroundColor: "#BFDBFE",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  funnelValue: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  funnelLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
  },
});
