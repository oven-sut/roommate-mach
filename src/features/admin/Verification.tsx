import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Check, Clock, Eye, History, Search, ShieldAlert, ShieldCheck, X } from "lucide-react-native";
import { CenterModal } from "../../components/Sheet";
import { Button, Txt } from "../../components/ui";
import { api, formatImageUri } from "../../services/api";
import { shadow } from "../../theme/styles";
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<{
    name: string;
    url: string;
  } | null>(null);

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

  // Separate pending items (TOP) vs processed items (BOTTOM)
  const pendingItems = visible.filter((item) => item.status === "PENDING");
  const processedItems = visible.filter((item) => item.status !== "PENDING");

  const renderTableRows = (list: VerificationItem[], isPendingSection: boolean) => {
    if (!isDesktop) {
      return (
        <View style={{ gap: 10 }}>
          {list.map((item) => (
            <View key={item.id} style={styles.mobileVerificationCard}>
              <View style={styles.mobileCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{item.displayName ?? "—"}</Text>
                  <Text style={styles.emailText}>{item.email}</Text>
                </View>
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

              <View style={styles.mobileCardFooter}>
                <View style={{ gap: 6, flex: 1 }}>
                  <Text style={styles.mobileMetaLabel}>
                    SUT ID: <Text style={styles.sutIdText}>{item.sutId ?? "—"}</Text>
                  </Text>

                  {item.documentUrl ? (
                    <Pressable
                      style={styles.docThumbContainer}
                      onPress={() =>
                        setSelectedDoc({
                          name: item.displayName || "Student ID Card",
                          url: formatImageUri(item.documentUrl),
                        })
                      }
                    >
                      <Image
                        source={{ uri: formatImageUri(item.documentUrl) }}
                        style={styles.docThumb}
                      />
                      <View style={styles.docEyeOverlay}>
                        <Eye size={12} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  ) : (
                    <Text style={styles.noDocText}>No Document</Text>
                  )}
                </View>

                <View style={styles.tdRow}>
                  <Pressable
                    style={[styles.btnAction, styles.btnApprove]}
                    onPress={() => updateStatus(item.id, "VERIFIED")}
                    accessibilityLabel="Approve verification"
                  >
                    <Check size={16} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    style={[styles.btnAction, styles.btnReject]}
                    onPress={() => updateStatus(item.id, "REJECTED")}
                    accessibilityLabel="Reject verification"
                  >
                    <X size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>Student</Text>
          <Text style={[styles.th, { flex: 1 }]}>SUT ID</Text>
          <Text style={[styles.th, { flex: 1 }]}>Document Card</Text>
          <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>Action</Text>
        </View>

        {list.map((item) => (
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
                <Pressable
                  style={styles.docThumbContainer}
                  onPress={() =>
                    setSelectedDoc({
                      name: item.displayName || "Student ID Card",
                      url: formatImageUri(item.documentUrl),
                    })
                  }
                >
                  <Image
                    source={{ uri: formatImageUri(item.documentUrl) }}
                    style={styles.docThumb}
                  />
                  <View style={styles.docEyeOverlay}>
                    <Eye size={12} color="#FFFFFF" />
                  </View>
                </Pressable>
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
                accessibilityLabel="Approve verification"
              >
                <Check size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={[styles.btnAction, styles.btnReject]}
                onPress={() => updateStatus(item.id, "REJECTED")}
                accessibilityLabel="Reject verification"
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ))}
      </>
    );
  };

  return (
    <AdminLayout currentScreen="verification" go={go}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck size={22} color="#8B1E1E" />
          <Text style={styles.cardTitle}>Student ID Verification Management</Text>
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

        {/* ============================================================ */}
        {/* SECTION 1 (TOP): PENDING VERIFICATION REQUESTS */}
        {/* ============================================================ */}
        <View style={styles.pendingSectionBox}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <ShieldAlert size={20} color="#D97706" />
              <Text style={styles.pendingSectionTitle}>
                คำขอยืนยันตัวตนที่รอการอนุมัติ (Pending Verification Requests)
              </Text>
            </View>
            <View style={styles.pendingBadgePill}>
              <Clock size={12} color="#D97706" />
              <Text style={styles.pendingBadgeText}>
                {pendingItems.length} รายการรอนุมัติ
              </Text>
            </View>
          </View>

          {pendingItems.length > 0 ? (
            renderTableRows(pendingItems, true)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                🎉 ไม่มีคำขอยืนยันตัวตนที่ค้างรอนุมัติในขณะนี้ (All pending requests completed!)
              </Text>
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* SECTION 2 (BOTTOM): PROCESSED VERIFICATION HISTORY */}
        {/* ============================================================ */}
        <View style={styles.historySectionBox}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <History size={20} color="#4B5563" />
              <Text style={styles.historySectionTitle}>
                ประวัติการดำเนินการแล้ว (Verification History)
              </Text>
            </View>
            <View style={styles.historyBadgePill}>
              <Text style={styles.historyBadgeText}>
                {processedItems.length} รายการ
              </Text>
            </View>
          </View>

          {processedItems.length > 0 ? (
            renderTableRows(processedItems, false)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                ยังไม่มีประวัติการอนุมัติหรือปฏิเสธข้อมูล
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Document Preview Modal */}
      <CenterModal
        visible={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
      >
        {selectedDoc ? (
          <View style={{ gap: 14, alignItems: "center" }}>
            <Txt role="h3" style={{ fontSize: 16 }}>
              {selectedDoc.name}
            </Txt>
            <Image
              source={{ uri: selectedDoc.url }}
              style={styles.fullDocImage}
              resizeMode="contain"
            />
            <Button
              variant="subtle"
              style={{ width: "100%", marginTop: 8 }}
              onPress={() => setSelectedDoc(null)}
            >
              ปิดหน้าต่าง (Close)
            </Button>
          </View>
        ) : null}
      </CenterModal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    ...shadow(1),
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  },
  searchInput: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 14,
    color: "#111827",
  },

  // Section 1: Pending Box
  pendingSectionBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },

  mobileVerificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  mobileCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 10,
  },
  mobileMetaLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#6B7280",
  },
  sectionHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  pendingSectionTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#92400E",
  },
  pendingBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#B45309",
  },

  // Section 2: History Box
  historySectionBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  historySectionTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#374151",
  },
  historyBadgePill: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  historyBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#4B5563",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyCardText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#6B7280",
  },

  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
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
  docThumbContainer: {
    position: "relative",
    alignSelf: "flex-start",
  },
  docThumb: {
    width: 48,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  docEyeOverlay: {
    position: "absolute",
    right: 2,
    bottom: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 3,
    padding: 2,
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

  fullDocImage: {
    width: 320,
    height: 220,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
});
