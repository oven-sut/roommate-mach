import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  Activity,
  AlertCircle,
  BarChart2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
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

export function Dashboard({ go }: { go: (x: Screen) => void }) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    api<Stats>("/api/admin/dashboard")
      .then((data) => setStats({ ...EMPTY_STATS, ...data }))
      .catch(() => setStats(EMPTY_STATS));
  }, []);

  return (
    <AdminLayout currentScreen="dashboard" go={go}>
      {/* Top Stat Cards & Calendar Section */}
      {isDesktop ? (
        /* Desktop Layout: 4 Cards Side-by-Side in 1 Row */
        <View style={styles.topRow}>
          {/* Card 1: Pending */}
          <View style={[styles.statCard, { borderTopColor: "#F59E0B" }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>รออนุมัติสิทธิ์</Text>
              <Clock size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statNumber, { color: "#D97706" }]}>
              {stats.pendingVerifications ?? 12}
            </Text>
            <Text style={styles.statSub}>รอแอดมินอนุมัติ</Text>
          </View>

          {/* Card 2: Verified */}
          <View style={[styles.statCard, { borderTopColor: "#10B981" }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>ยืนยันตัวตนแล้ว</Text>
              <CheckCircle2 size={20} color="#10B981" />
            </View>
            <Text style={[styles.statNumber, { color: "#059669" }]}>
              {stats.verifiedVerifications ?? 321}
            </Text>
            <Text style={styles.statSub}>ตรานักศึกษา มทส.</Text>
          </View>

          {/* Card 3: Unverified */}
          <View style={[styles.statCard, { borderTopColor: "#8B5CF6" }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>ยังไม่ยืนยันตัวตน</Text>
              <AlertCircle size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.statNumber, { color: "#6D28D9" }]}>
              {stats.unverifiedVerifications ?? 12}
            </Text>
            <Text style={styles.statSub}>สมาชิกทั่วไป</Text>
          </View>

          {/* Card 4: Calendar Widget */}
          <View style={styles.calendarWidget}>
            <View style={styles.calendarHeader}>
              <CalendarIcon size={18} color="#FFFFFF" />
              <Text style={styles.calendarTitle}>กันยายน 2569</Text>
            </View>
            <View style={styles.calendarBadge}>
              <UsersIcon size={14} color="#FFFFFF" />
              <Text style={styles.calendarBadgeText}>
                {stats.members.toLocaleString()} สมาชิก
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
              {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day) => (
                <Text key={day} style={styles.calendarDaysLabel}>{day}</Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              {["1", "2", "3", "4", "5", "6", "7"].map((date) => (
                <Text key={date} style={styles.calendarDatesLabel}>{date}</Text>
              ))}
            </View>
          </View>
        </View>
      ) : (
        /* Mobile Layout: Responsive Full-Width Centered Cards */
        <View style={{ gap: 12, marginBottom: 16, width: "100%" }}>
          {/* Row 1: Pending Card (Full Width) */}
          <View style={[styles.statCard, { width: "100%", borderTopColor: "#F59E0B" }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>รออนุมัติสิทธิ์</Text>
              <Clock size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.statNumber, { color: "#D97706" }]}>
              {stats.pendingVerifications ?? 12}
            </Text>
            <Text style={styles.statSub}>รอแอดมินอนุมัติ</Text>
          </View>

          {/* Row 2: Verified & Unverified Cards (Side-by-Side Pair) */}
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            {/* Card 2: Verified */}
            <View style={[styles.statCard, { flex: 1, borderTopColor: "#10B981" }]}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>ยืนยันตัวตนแล้ว</Text>
                <CheckCircle2 size={18} color="#10B981" />
              </View>
              <Text style={[styles.statNumber, { color: "#059669" }]}>
                {stats.verifiedVerifications ?? 321}
              </Text>
              <Text style={styles.statSub}>ตรา มทส.</Text>
            </View>

            {/* Card 3: Unverified */}
            <View style={[styles.statCard, { flex: 1, borderTopColor: "#8B5CF6" }]}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>ยังไม่ยืนยันตัวตน</Text>
                <AlertCircle size={18} color="#8B5CF6" />
              </View>
              <Text style={[styles.statNumber, { color: "#6D28D9" }]}>
                {stats.unverifiedVerifications ?? 12}
              </Text>
              <Text style={styles.statSub}>สมาชิกทั่วไป</Text>
            </View>
          </View>

          {/* Row 3: Calendar Widget (Full Width) */}
          <View style={[styles.calendarWidget, { width: "100%" }]}>
            <View style={styles.calendarHeader}>
              <CalendarIcon size={16} color="#FFFFFF" />
              <Text style={styles.calendarTitle}>กันยายน 2569</Text>
            </View>
            <View style={styles.calendarBadge}>
              <UsersIcon size={12} color="#FFFFFF" />
              <Text style={styles.calendarBadgeText}>
                {stats.members.toLocaleString()} สมาชิก
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day) => (
                <Text key={day} style={styles.calendarDaysLabel}>{day}</Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              {["1", "2", "3", "4", "5", "6", "7"].map((date) => (
                <Text key={date} style={styles.calendarDatesLabel}>{date}</Text>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Middle Section: Safety Report & Peak Time Charts */}
      <View style={[styles.middleRow, { flexDirection: isDesktop ? "row" : "column", marginTop: isDesktop ? 0 : 4, width: "100%" }]}>
        {/* Safety & Verification Report */}
        <View style={[styles.chartCard, { flex: isDesktop ? 2 : undefined, width: "100%" }]}>
          <View style={styles.chartHeader}>
            <ShieldCheck size={20} color="#8B1E1E" />
            <Text style={styles.chartTitle}>รายงานความปลอดภัย</Text>
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
                  {/* Blue: Profile */}
                  <View
                    style={{
                      width: "100%",
                      backgroundColor: "#3B82F6",
                      height: `${(item.profile / 130) * 100}%`,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  />
                  {/* Red: Harassment */}
                  <View
                    style={{
                      width: "100%",
                      backgroundColor: "#EF4444",
                      height: `${(item.harassment / 130) * 100}%`,
                    }}
                  />
                  {/* Yellow: Spam/Scam */}
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
          <View style={[styles.chartLegend, { flexWrap: "wrap", gap: 12, justifyContent: "center" }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.legendText}>รายงานโปรไฟล์</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.legendText}>รายงานแชทคุกคาม</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.legendText}>รายงานแชทสแปม/สแกมเมอร์</Text>
            </View>
          </View>
        </View>

        {/* Peak Time Activity Chart */}
        <View style={[styles.chartCard, { flex: isDesktop ? 1 : undefined, width: "100%" }]}>
          <View style={styles.chartHeader}>
            <Activity size={20} color="#3B82F6" />
            <Text style={styles.chartTitle}>ช่วงเวลาหนาแน่นที่สุด</Text>
          </View>
          <View style={styles.peakContainer}>
            <Text style={styles.peakValue}>21:00 - 23:30 น.</Text>
            <Text style={styles.peakSub}>ช่วงเวลาที่มีการใช้งานสูงสุด</Text>

            {/* Wave Line Visualization */}
            <View style={styles.waveVisual}>
              <View style={[styles.waveBar, { height: 30 }]} />
              <View style={[styles.waveBar, { height: 45 }]} />
              <View style={[styles.waveBar, { height: 75, backgroundColor: "#3B82F6" }]} />
              <View style={[styles.waveBar, { height: 95, backgroundColor: "#2563EB" }]} />
              <View style={[styles.waveBar, { height: 60 }]} />
              <View style={[styles.waveBar, { height: 40 }]} />
            </View>

            <View style={styles.peakFooter}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.peakFooterText}>+24.5% ใช้งานคึกคักช่วงค่ำ</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section: Swipes & Matched Chart */}
      <View style={[styles.bottomRow, { marginTop: 16, width: "100%" }]}>
        <View style={[styles.chartCard, { width: "100%" }]}>
          <View style={styles.chartHeader}>
            <BarChart2 size={20} color="#8B1E1E" />
            <Text style={styles.chartTitle}>สถิติการปัดเลือก & อัตราจับคู่</Text>
          </View>
          <View style={styles.swipeMetricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillVal}>4,890</Text>
              <Text style={styles.metricPillLab}>ปัดเลือกทั้งหมด</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillVal}>1,420</Text>
              <Text style={styles.metricPillLab}>กดถูกใจสนใจ</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillVal}>142</Text>
              <Text style={styles.metricPillLab}>จับคู่สำเร็จ</Text>
            </View>
          </View>
        </View>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: "#6B7280",
  },
  statNumber: {
    fontFamily: F.bold,
    fontSize: 28,
    marginBottom: 4,
  },
  statSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#9CA3AF",
  },

  calendarWidget: {
    flex: 1.2,
    minWidth: 220,
    backgroundColor: "#8B1E1E",
    borderRadius: 14,
    padding: 16,
    justifyContent: "space-between",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  calendarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  calendarBadgeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#FFFFFF",
  },
  calendarDaysLabel: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  calendarDatesLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },

  /* Middle Charts */
  middleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#111827",
  },

  barChartContainer: {
    height: 160,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  barGroup: {
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: 24,
    height: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFillVerified: {
    width: "100%",
    backgroundColor: "#10B981",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barFillPending: {
    width: "100%",
    backgroundColor: "#F59E0B",
  },
  barLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "#6B7280",
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#4B5563",
  },

  /* Peak Time Activity */
  peakContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  peakValue: {
    fontFamily: F.bold,
    fontSize: 22,
    color: "#1E3A8A",
  },
  peakSub: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 16,
  },
  waveVisual: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 100,
    marginBottom: 16,
  },
  waveBar: {
    width: 14,
    backgroundColor: "#93C5FD",
    borderRadius: 7,
  },
  peakFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  peakFooterText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#10B981",
  },

  /* Bottom Row */
  bottomRow: {
    width: "100%",
  },
  swipeMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  metricPill: {
    alignItems: "center",
  },
  metricPillVal: {
    fontFamily: F.bold,
    fontSize: 20,
    color: "#8B1E1E",
  },
  metricPillLab: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#6B7280",
  },
});
