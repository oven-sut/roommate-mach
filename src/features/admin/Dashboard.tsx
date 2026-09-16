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
import { C, G } from "../../theme/colors";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type ReportTrendPoint = {
  monthIndex: number;
  year: number;
  profile: number;
  harassment: number;
  spam: number;
};

type Stats = {
  members: number;
  active: number;
  matches: number;
  messages: number;
  reports: number;
  pendingVerifications?: number;
  verifiedVerifications?: number;
  unverifiedVerifications?: number;
  swipes?: number;
  likes?: number;
  reportTrend?: ReportTrendPoint[];
  activityByHour?: number[];
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
  swipes: 4890,
  likes: 1420,
};

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const WEEKDAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

/** Fallback series shown only until the real 5-month report trend loads. */
const FALLBACK_REPORT_TREND = [
  { month: "พ.ค.", profile: 15, harassment: 8, spam: 12 },
  { month: "มิ.ย.", profile: 22, harassment: 14, spam: 18 },
  { month: "ก.ค.", profile: 30, harassment: 18, spam: 25 },
  { month: "ส.ค.", profile: 42, harassment: 25, spam: 32 },
  { month: "ก.ย.", profile: 55, harassment: 30, spam: 38 },
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Shown only until the real per-hour message activity loads.
const FALLBACK_PEAK_CURVE = [
  120, 90, 60, 40, 30, 25, 35, 55, 80, 100, 90, 70,
  50, 40, 45, 60, 90, 140, 220, 300, 360, 380, 340, 260,
];

function PeakTimeChart({ data }: { data?: number[] }) {
  const curve = data && data.length === 24 && data.some((v) => v > 0) ? data : FALLBACK_PEAK_CURVE;
  const W = 240;
  const H = 120;
  const max = Math.max(...curve, 1);
  const stepX = W / (curve.length - 1);
  const points = curve.map((v, i) => [i * stepX, H - (v / max) * H]);
  const linePath = `M${points.map((p) => p.join(",")).join(" L ")}`;
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.primary} stopOpacity={0.35} />
            <Stop offset="1" stopColor={C.primary} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#peakFill)" stroke="none" />
        <Path
          d={linePath}
          fill="none"
          stroke={C.primary}
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
    { label: "ปัดเลือกทั้งหมด", value: stats.swipes ?? 4890 },
    { label: "กดถูกใจ", value: stats.likes ?? 1420 },
    { label: "จับคู่สำเร็จ", value: stats.matches ?? 142 },
  ];
  const swipeBase = Math.max(...swipeStages.map((s) => s.value), 1);

  const reportTrend = useMemo(() => {
    if (!stats.reportTrend || stats.reportTrend.length === 0) return FALLBACK_REPORT_TREND;
    return stats.reportTrend.map((m) => ({
      month: THAI_MONTHS_SHORT[m.monthIndex],
      profile: m.profile,
      harassment: m.harassment,
      spam: m.spam,
    }));
  }, [stats.reportTrend]);
  const reportTrendMax = Math.max(
    1,
    ...reportTrend.map((m) => m.profile + m.harassment + m.spam),
  );

  /* ---- KPI Cards Row (4 cards in full width row on Desktop) ---- */
  const statsRowBlock = (
    <View style={styles.statsRow}>
      <LinearGradient colors={[...G.hero]} style={[styles.statCard, styles.statCardActive]}>
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

      <Pressable style={styles.statCardPressable} onPress={() => go("users")}>
        <LinearGradient colors={[...G.primary]} style={styles.usersCard}>
          <View style={styles.usersCardHeader}>
            <Text style={styles.usersCardValue}>{stats.members.toLocaleString()}</Text>
            <View style={styles.usersIconBadge}>
              <UsersIcon size={18} color={C.primary} />
            </View>
          </View>
          <Text style={styles.usersCardLabel}>ผู้ใช้งานทั้งหมด (USERS)</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  /* ---- KPI Cards 2x2 Grid (Mobile Layout Fix) ---- */
  const statsRowBlockMobile = (
    <View style={styles.statsMobileGrid}>
      <View style={styles.statsMobileRow}>
        <LinearGradient colors={[...G.hero]} style={[styles.statCardMobile, styles.statCardActive]}>
          <Text style={styles.statLabelActive}>รออนุมัติสิทธิ์</Text>
          <Text style={styles.statNumberActive}>{stats.pendingVerifications ?? 12}</Text>
          <View style={styles.statProgressTrack}>
            <View style={[styles.statProgressFill, { width: `${pendingPct}%` }]} />
          </View>
        </LinearGradient>

        <View style={[styles.statCardMobile, styles.statCardMuted]}>
          <Text style={styles.statLabelMuted}>จับคู่สำเร็จ</Text>
          <Text style={styles.statNumberMuted}>{stats.matches ?? 321}</Text>
        </View>
      </View>

      <View style={styles.statsMobileRow}>
        <View style={[styles.statCardMobile, styles.statCardMuted]}>
          <Text style={styles.statLabelMuted}>ยังไม่ยืนยันตัวตน</Text>
          <Text style={styles.statNumberMuted}>{stats.unverifiedVerifications ?? 12}</Text>
        </View>

        <Pressable style={styles.statCardPressableMobile} onPress={() => go("users")}>
          <LinearGradient colors={[...G.primary]} style={styles.usersCardMobile}>
            <View style={styles.usersCardHeader}>
              <Text style={styles.usersCardValue}>{stats.members.toLocaleString()}</Text>
              <View style={styles.usersIconBadge}>
                <UsersIcon size={18} color={C.primary} />
              </View>
            </View>
            <Text style={styles.usersCardLabel}>ผู้ใช้งานทั้งหมด (USERS)</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  /* ---- Safety Report Card ---- */
  const safetyBlock = (
    <LinearGradient colors={[C.cardWarm, C.card]} style={[styles.chartCard, { flex: 1.4 }]}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartHeaderLeft}>
          <ShieldCheck size={20} color={C.primary} />
          <Text style={styles.chartTitle}>รายงานความปลอดภัย</Text>
        </View>
        <View style={styles.legendCompact}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.blue }]} />
            <Text style={styles.legendText}>โปรไฟล์</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.ember }]} />
            <Text style={styles.legendText}>คุกคาม</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.amber }]} />
            <Text style={styles.legendText}>สแปม</Text>
          </View>
        </View>
      </View>
      <View style={styles.barChartContainer}>
        {reportTrend.map((item) => (
          <View key={item.month} style={styles.barGroup}>
            <View style={styles.barTrack}>
              <View
                style={{
                  width: "100%",
                  backgroundColor: C.blue,
                  height: `${(item.profile / reportTrendMax) * 100}%`,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
              <View
                style={{
                  width: "100%",
                  backgroundColor: C.ember,
                  height: `${(item.harassment / reportTrendMax) * 100}%`,
                }}
              />
              <View
                style={{
                  width: "100%",
                  backgroundColor: C.amber,
                  height: `${(item.spam / reportTrendMax) * 100}%`,
                }}
              />
            </View>
            <Text style={styles.barLabel}>{item.month}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );

  /* ---- Swipe & Match Funnel Card ---- */
  const swipeBlock = (
    <LinearGradient colors={[...G.hero]} style={[styles.chartCard, { flex: 1.4 }]}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartHeaderLeft}>
          <BarChart2 size={20} color={C.white} />
          <Text style={[styles.chartTitle, { color: C.white }]}>ปัดเลือก & จับคู่</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, flex: 1 }}>
        <View style={styles.funnelAxis}>
          {["100%", "75%", "50%", "25%", "0%"].map((l) => (
            <Text key={l} style={styles.funnelAxisLabel}>{l}</Text>
          ))}
        </View>
        <View style={styles.funnelContainer}>
          <View style={styles.funnelTrack}>
            {swipeStages.map((s) => (
              <View key={s.label} style={styles.funnelBarGroup}>
                <Text style={styles.funnelValue}>{s.value.toLocaleString()}</Text>
                <View style={styles.funnelBarTrack}>
                  <View
                    style={[
                      styles.funnelBar,
                      { height: `${Math.min(100, Math.max(6, (s.value / swipeBase) * 100))}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.funnelLabelsRow}>
            {swipeStages.map((s) => (
              <Text key={s.label} style={styles.funnelLabel}>{s.label}</Text>
            ))}
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  /* ---- Calendar Card ---- */
  const calendarBlock = (
    <View style={[styles.calendarWidget, { flex: 1 }]}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={() => setWeekOffset((o) => o - 1)} hitSlop={8}>
          <ChevronLeft size={18} color={C.white} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CalendarIcon size={16} color={C.white} />
          <Text style={styles.calendarTitle}>{monthText}</Text>
        </View>
        <Pressable onPress={() => setWeekOffset((o) => o + 1)} hitSlop={8}>
          <ChevronRight size={18} color={C.white} />
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

  /* ---- Peak Activity Time Card ---- */
  const peakBlock = (
    <View style={[styles.chartCard, { flex: 1 }]}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartHeaderLeft}>
          <Activity size={20} color={C.primary} />
          <Text style={styles.chartTitle}>ช่วงเวลาหนาแน่นที่สุด</Text>
        </View>
      </View>
      <PeakTimeChart data={stats.activityByHour} />
    </View>
  );

  return (
    <AdminLayout currentScreen="dashboard" go={go}>
      <View style={styles.dashboardContainer}>
        {/* Top KPI Cards Bar */}
        {isDesktop ? statsRowBlock : statsRowBlockMobile}

        {/* Charts & Widgets Rows */}
        {isDesktop ? (
          <View style={styles.flexRowsContainer}>
            {/* Row 2: Safety Chart + Calendar */}
            <View style={styles.gridRowSection}>
              {safetyBlock}
              {calendarBlock}
            </View>

            {/* Row 3: Swipe Funnel + Peak Activity */}
            <View style={styles.gridRowSection}>
              {swipeBlock}
              {peakBlock}
            </View>
          </View>
        ) : (
          <View style={{ gap: 16, width: "100%" }}>
            {safetyBlock}
            {calendarBlock}
            {swipeBlock}
            {peakBlock}
          </View>
        )}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: {
    width: "100%",
    gap: 16,
  },
  flexRowsContainer: {
    width: "100%",
    gap: 16,
  },
  gridRowSection: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
    width: "100%",
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 16,
    padding: 18,
    justifyContent: "center",
  },
  statCardPressable: {
    flex: 1,
    minWidth: 160,
  },
  statCardActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardMuted: {
    backgroundColor: C.cardWarm,
    borderWidth: 1,
    borderColor: C.line,
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
    color: C.white,
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
    backgroundColor: C.white,
    borderRadius: 2,
  },
  statLabelMuted: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.muted,
    marginBottom: 8,
  },
  statNumberMuted: {
    fontFamily: F.bold,
    fontSize: 28,
    color: C.ink,
  },

  calendarWidget: {
    backgroundColor: C.wine,
    borderRadius: 16,
    padding: 18,
    justifyContent: "space-between",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.white,
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
    paddingVertical: 6,
  },
  calendarDateCellActive: {
    backgroundColor: C.white,
    borderRadius: 14,
    marginHorizontal: 2,
  },
  calendarDatesLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.white,
  },
  calendarDatesLabelActive: {
    color: C.wine,
  },

  usersCard: {
    height: "100%",
    minHeight: 90,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
  },
  usersCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usersCardValue: {
    fontFamily: F.bold,
    fontSize: 26,
    color: C.white,
  },
  usersIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  usersCardLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.5,
    marginTop: 4,
  },

  chartCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.line,
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
    color: C.ink,
  },

  barChartContainer: {
    height: 150,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
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
    color: C.muted,
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
    color: C.muted,
  },

  peakAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  peakAxisLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.muted,
  },

  funnelAxis: {
    height: 100,
    marginBottom: 24,
    justifyContent: "space-between",
  },
  funnelAxisLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  funnelContainer: {
    flex: 1,
  },
  funnelTrack: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 135,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.25)",
  },
  funnelBarGroup: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  funnelBarTrack: {
    width: 44,
    height: 90,
    justifyContent: "flex-end",
  },
  funnelBar: {
    width: "100%",
    backgroundColor: C.amberLight,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  funnelValue: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.white,
    textAlign: "center",
  },
  funnelLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  funnelLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  statsMobileGrid: {
    width: "100%",
    gap: 12,
  },
  statsMobileRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statCardMobile: {
    flex: 1,
    minHeight: 105,
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
  },
  statCardPressableMobile: {
    flex: 1,
    minHeight: 105,
  },
  usersCardMobile: {
    minHeight: 105,
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
  },
});
