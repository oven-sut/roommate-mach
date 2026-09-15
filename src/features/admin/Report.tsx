import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  CheckCircle,
  Clock,
  Flag,
  UserX,
  XCircle,
} from "lucide-react-native";
import { api } from "../../services/api";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type ReportItem = {
  id: string;
  reporter?: { displayName?: string; email?: string };
  reported?: { id: string; displayName?: string; email?: string; suspended?: boolean };
  reason: string;
  details?: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt?: string;
};

export function Report({ go }: { go: (x: Screen) => void }) {
  const [reports, setReports] = useState<ReportItem[]>([]);

  const loadReports = useCallback(async () => {
    try {
      const data = await api<ReportItem[]>("/api/admin/reports");
      setReports(data ?? []);
    } catch {
      // Demo mock reports
      setReports([
        {
          id: "1",
          reporter: { displayName: "Ploy Siriwan", email: "student102@g.sut.ac.th" },
          reported: {
            id: "user-99",
            displayName: "Spam Bot",
            email: "spambot@g.sut.ac.th",
            suspended: false,
          },
          reason: "Spamming commercial messages in chat",
          details: "Sent multiple external links in chatroom",
          status: "PENDING",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleAction = async (id: string, action: "resolve" | "dismiss") => {
    try {
      await api(`/api/admin/reports/${id}/${action}`, { method: "PATCH" });
      loadReports();
    } catch (reason) {
      Alert.alert(
        "Report Action",
        reason instanceof Error ? reason.message : "Action failed",
      );
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      await api(`/api/admin/users/${userId}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({ suspended: true }),
      });
      loadReports();
    } catch (reason) {
      Alert.alert(
        "Suspend User",
        reason instanceof Error ? reason.message : "Action failed",
      );
    }
  };

  return (
    <AdminLayout currentScreen="adminReports" go={go}>
      {/* Metric Cards Top Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: "#F59E0B" }]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Pending Reviews</Text>
            <Clock size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.metricVal, { color: "#D97706" }]}>5</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: "#10B981" }]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Resolved</Text>
            <CheckCircle size={18} color="#10B981" />
          </View>
          <Text style={[styles.metricVal, { color: "#059669" }]}>28</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: "#6B7280" }]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Dismissed</Text>
            <XCircle size={18} color="#6B7280" />
          </View>
          <Text style={[styles.metricVal, { color: "#4B5563" }]}>3</Text>
        </View>
      </View>

      {/* Reports Table */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Flag size={20} color="#8B1E1E" />
          <Text style={styles.cardTitle}>User Reports & Safety Moderation</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>Reported User</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Reporter</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Reason & Details</Text>
          <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: "right" }]}>Actions</Text>
        </View>

        {reports.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={[styles.td, { flex: 1.2 }]}>
              <Text style={styles.reportedName}>
                {item.reported?.displayName ?? "—"}
              </Text>
              <Text style={styles.subText}>{item.reported?.email}</Text>
            </View>

            <View style={[styles.td, { flex: 1.2 }]}>
              <Text style={styles.reporterName}>
                {item.reporter?.displayName ?? "—"}
              </Text>
              <Text style={styles.subText}>{item.reporter?.email}</Text>
            </View>

            <View style={[styles.td, { flex: 1.5 }]}>
              <Text style={styles.reasonText}>{item.reason}</Text>
              {item.details ? (
                <Text style={styles.subText}>{item.details}</Text>
              ) : null}
            </View>

            <View style={[styles.td, { flex: 1 }]}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "RESOLVED"
                    ? styles.badgeResolved
                    : item.status === "DISMISSED"
                    ? styles.badgeDismissed
                    : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>

            <View style={[styles.tdActions, { flex: 1.2, justifyContent: "flex-end" }]}>
              {item.reported?.id ? (
                <Pressable
                  style={styles.btnBan}
                  onPress={() => handleSuspend(item.reported!.id)}
                >
                  <UserX size={14} color="#FFFFFF" />
                  <Text style={styles.btnBanText}>Suspend</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={styles.btnResolve}
                onPress={() => handleAction(item.id, "resolve")}
              >
                <CheckCircle size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricTitle: {
    fontFamily: F.medium,
    fontSize: 13,
    color: "#6B7280",
  },
  metricVal: {
    fontFamily: F.bold,
    fontSize: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
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
    fontSize: 16,
    color: "#111827",
  },

  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  th: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#4B5563",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  td: {
    justifyContent: "center",
  },
  tdActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportedName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#DC2626",
  },
  reporterName: {
    fontFamily: F.medium,
    fontSize: 13,
    color: "#111827",
  },
  subText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#6B7280",
  },
  reasonText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: "#374151",
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeResolved: { backgroundColor: "#D1FAE5" },
  badgeDismissed: { backgroundColor: "#F3F4F6" },
  badgeText: { fontFamily: F.bold, fontSize: 11, color: "#374151" },

  btnBan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnBanText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  btnResolve: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
});
