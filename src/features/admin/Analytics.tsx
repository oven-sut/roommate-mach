import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BookOpen,
  Layers,
  PieChart as PieIcon,
  Tag as TagIcon,
} from "lucide-react-native";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

export function Analytics({ go }: { go: (x: Screen) => void }) {
  const years = [
    { label: "Year 1", percent: 45, color: "#3B82F6" },
    { label: "Year 2", percent: 30, color: "#10B981" },
    { label: "Year 3", percent: 15, color: "#F59E0B" },
    { label: "Year 4", percent: 10, color: "#EC4899" },
  ];

  const lifestyleTags = [
    { tag: "Night Owl", count: 890, percent: 85, color: "#8B1E1E" },
    { tag: "Spotless", count: 720, percent: 70, color: "#10B981" },
    { tag: "Quiet Hours", count: 640, percent: 62, color: "#3B82F6" },
    { tag: "AC 25°C", count: 950, percent: 92, color: "#F59E0B" },
    { tag: "Library Study", count: 510, percent: 50, color: "#8B5CF6" },
  ];

  const faculties = [
    { name: "Computer Eng.", count: 340, color: "#8B1E1E" },
    { name: "Nursing", count: 280, color: "#EC4899" },
    { name: "Information Tech", count: 210, color: "#3B82F6" },
    { name: "Civil Eng.", count: 180, color: "#F59E0B" },
    { name: "Medicine", count: 150, color: "#10B981" },
    { name: "Agriculture", count: 96, color: "#8B5CF6" },
  ];

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
            <View style={styles.donutCircle}>
              <Text style={styles.donutPercent}>78%</Text>
              <Text style={styles.donutLabel}>Matched</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#8B1E1E" }]} />
              <Text style={styles.legendText}>Matched (78%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#E5E7EB" }]} />
              <Text style={styles.legendText}>Single (22%)</Text>
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
                      { height: `${y.percent * 1.8}%`, backgroundColor: y.color },
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
            {lifestyleTags.map((item) => (
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
                <Text style={styles.facultyCount}>{f.count} students</Text>
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
  donutCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 12,
    borderColor: "#8B1E1E",
    borderRightColor: "#E5E7EB",
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
