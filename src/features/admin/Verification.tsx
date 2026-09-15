import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, Search, ShieldCheck, X } from "lucide-react-native";
import { api, formatImageUri } from "../../services/api";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type VerificationItem = {
  id: string;
  sutId?: string;
  displayName?: string;
  email?: string;
  documentUrl?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt?: string;
};

export function Verification({ go }: { go: (x: Screen) => void }) {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [query, setQuery] = useState("");

  const loadVerifications = useCallback(async () => {
    try {
      const data = await api<VerificationItem[]>("/api/admin/verifications");
      setItems(data ?? []);
    } catch {
      // Fallback mock items for demo
      setItems([
        {
          id: "1",
          sutId: "B6612345",
          displayName: "Nut Chaiyaphum",
          email: "student101@g.sut.ac.th",
          documentUrl:
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
          status: "PENDING",
        },
        {
          id: "2",
          sutId: "B6654321",
          displayName: "Ploy Siriwan",
          email: "student102@g.sut.ac.th",
          documentUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
          status: "PENDING",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const updateStatus = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await api(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      loadVerifications();
    } catch (reason) {
      Alert.alert(
        "Verification",
        reason instanceof Error ? reason.message : "Action failed",
      );
    }
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? items.filter((item) =>
        `${item.displayName ?? ""}${item.sutId ?? ""}${item.email ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : items;

  return (
    <AdminLayout currentScreen="verification" go={go}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck size={20} color="#8B1E1E" />
          <Text style={styles.cardTitle}>Student ID Verification Requests</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, SUT ID, or email..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Verification Requests List Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>Student</Text>
          <Text style={[styles.th, { flex: 1 }]}>SUT ID</Text>
          <Text style={[styles.th, { flex: 1 }]}>Document Card</Text>
          <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>Action</Text>
        </View>

        {visible.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={[styles.td, { flex: 1.2 }]}>
              <Text style={styles.nameText}>{item.displayName ?? "—"}</Text>
              <Text style={styles.emailText}>{item.email}</Text>
            </View>
            <View style={[styles.td, { flex: 1 }]}>
              <Text style={styles.sutIdText}>{item.sutId ?? "—"}</Text>
            </View>
            <View style={[styles.td, { flex: 1 }]}>
              {item.documentUrl ? (
                <Image
                  source={{ uri: formatImageUri(item.documentUrl) }}
                  style={styles.docThumb}
                />
              ) : (
                <Text style={styles.noDocText}>No Doc</Text>
              )}
            </View>
            <View style={[styles.td, { flex: 1 }]}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "VERIFIED"
                    ? styles.badgeVerified
                    : item.status === "REJECTED"
                    ? styles.badgeRejected
                    : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === "VERIFIED"
                      ? styles.textVerified
                      : item.status === "REJECTED"
                      ? styles.textRejected
                      : styles.textPending,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View style={[styles.tdRow, { flex: 1, justifyContent: "flex-end" }]}>
              <Pressable
                style={[styles.btnAction, styles.btnApprove]}
                onPress={() => updateStatus(item.id, "VERIFIED")}
              >
                <Check size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={[styles.btnAction, styles.btnReject]}
                onPress={() => updateStatus(item.id, "REJECTED")}
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 14,
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
  tdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#111827",
  },
  emailText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#6B7280",
  },
  sutIdText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#374151",
  },
  docThumb: {
    width: 48,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noDocText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#9CA3AF",
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeVerified: { backgroundColor: "#D1FAE5" },
  badgeRejected: { backgroundColor: "#FEE2E2" },
  statusBadgeText: { fontFamily: F.bold, fontSize: 11 },
  textPending: { color: "#D97706" },
  textVerified: { color: "#059669" },
  textRejected: { color: "#DC2626" },

  btnAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnApprove: { backgroundColor: "#10B981" },
  btnReject: { backgroundColor: "#EF4444" },
});
