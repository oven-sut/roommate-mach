import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Search, Users as UsersIcon } from "lucide-react-native";
import { CenterModal } from "../../components/Sheet";
import { api } from "../../services/api";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type AdminUser = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
  suspended?: boolean;
  verification?: { status?: string };
  _count?: { reportsReceived?: number };
};

type UserActivity = {
  displayName?: string;
  email?: string;
  joinedAt: string;
  suspended: boolean;
  verificationStatus: string;
  swipesSent: number;
  likesSent: number;
  swipesReceived: number;
  likesReceived: number;
  matches: number;
  messagesSent: number;
  reportsMade: number;
  reportsReceived: number;
  recentReportsReceived: { reason: string; status: string; createdAt: string }[];
};

type PageSizeOption = 10 | 30 | 50 | "all";
/** Admin/users caps pageSize at 100, so "load everything" fetches in batches of this size. */
const FETCH_BATCH_SIZE = 100;

export function Users({ go }: { go: (x: Screen) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const load = useCallback(async () => {
    try {
      const first = await api<any>(
        `/api/admin/users?page=1&pageSize=${FETCH_BATCH_SIZE}`,
      );
      const items: AdminUser[] = Array.isArray(first)
        ? [...first]
        : Array.isArray(first?.items)
          ? [...first.items]
          : [];
      const total: number = Array.isArray(first) ? items.length : (first?.total ?? items.length);

      let nextPage = 2;
      while (items.length < total) {
        const more = await api<any>(
          `/api/admin/users?page=${nextPage}&pageSize=${FETCH_BATCH_SIZE}`,
        );
        const batch: AdminUser[] = Array.isArray(more?.items) ? more.items : [];
        if (batch.length === 0) break;
        items.push(...batch);
        nextPage += 1;
      }

      setUsers(items);
    } catch (reason) {
      Alert.alert(
        "Users",
        reason instanceof Error ? reason.message : "Unable to load",
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A new search or page-size change should always land back on page 1.
  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const suspend = async (id: string, value: boolean) => {
    await api(`/api/admin/users/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ suspended: value }),
    }).catch(() => undefined);
    load();
  };

  const verify = async (id: string) => {
    await api(`/api/admin/users/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ status: "VERIFIED" }),
    }).catch(() => undefined);
    load();
  };

  /** Same confirm-then-act flow AdminLayout's logout button uses. */
  const confirmAction = (message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
      if (window.confirm(message)) onConfirm();
      return;
    }
    Alert.alert("ยืนยันการทำรายการ", message, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ยืนยัน", style: "destructive", onPress: onConfirm },
    ]);
  };

  const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
  const [historyData, setHistoryData] = useState<UserActivity | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = async (user: AdminUser) => {
    const name = user.displayName ?? user.email ?? "—";
    setHistoryUser({ id: user.id, name });
    setHistoryData(null);
    setHistoryLoading(true);
    try {
      const data = await api<UserActivity>(`/api/admin/users/${user.id}/activity`);
      setHistoryData(data);
    } catch (reason) {
      Alert.alert(
        "ประวัติผู้ใช้",
        reason instanceof Error ? reason.message : "โหลดประวัติไม่สำเร็จ",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetPassword = (user: AdminUser) => {
    const name = user.displayName ?? user.email ?? "ผู้ใช้นี้";
    confirmAction(
      `รีเซ็ตรหัสผ่านของ ${name}? ระบบจะสร้างรหัสผ่านชั่วคราวใหม่ทันที`,
      async () => {
        try {
          const res = await api<{ tempPassword: string }>(
            `/api/admin/users/${user.id}/reset-password`,
            { method: "POST" },
          );
          Alert.alert(
            "รีเซ็ตรหัสผ่านสำเร็จ",
            `รหัสผ่านชั่วคราวของ ${name}:\n${res.tempPassword}\n\nกรุณาแจ้งผู้ใช้ให้เปลี่ยนรหัสผ่านทันที`,
          );
        } catch (reason) {
          Alert.alert(
            "รีเซ็ตรหัสผ่าน",
            reason instanceof Error ? reason.message : "ทำรายการไม่สำเร็จ",
          );
        }
      },
    );
  };

  const deleteAccount = (user: AdminUser) => {
    const name = user.displayName ?? user.email ?? "ผู้ใช้นี้";
    confirmAction(`ลบบัญชีของ ${name}? การลบไม่สามารถย้อนกลับได้`, async () => {
      try {
        await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
        load();
      } catch (reason) {
        Alert.alert(
          "ลบบัญชี",
          reason instanceof Error ? reason.message : "ทำรายการไม่สำเร็จ",
        );
      }
    });
  };

  const userList = Array.isArray(users) ? users : [];
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? userList.filter((u) =>
        `${u.displayName ?? ""}${u.email ?? ""}`.toLowerCase().includes(needle),
      )
    : userList;

  const pageCount = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible =
    pageSize === "all"
      ? filtered
      : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * (pageSize === "all" ? filtered.length : pageSize) + 1;
  const rangeEnd = pageSize === "all" ? filtered.length : Math.min(currentPage * pageSize, filtered.length);

  const paginationBar = (
    <View style={styles.paginationBar}>
      <Text style={styles.paginationInfo}>
        {filtered.length === 0
          ? "ไม่พบผู้ใช้"
          : `แสดง ${rangeStart}-${rangeEnd} จาก ${filtered.length} คน`}
      </Text>

      <View style={styles.pageSizeGroup}>
        <Text style={styles.pageSizeLabel}>แสดงต่อหน้า</Text>
        {([10, 30, 50, "all"] as PageSizeOption[]).map((opt) => (
          <Pressable
            key={String(opt)}
            style={[styles.pageSizeBtn, pageSize === opt && styles.pageSizeBtnActive]}
            onPress={() => setPageSize(opt)}
          >
            <Text
              style={[
                styles.pageSizeBtnText,
                pageSize === opt && styles.pageSizeBtnTextActive,
              ]}
            >
              {opt === "all" ? "ทั้งหมด" : opt}
            </Text>
          </Pressable>
        ))}
      </View>

      {pageSize !== "all" && pageCount > 1 ? (
        <View style={styles.pageNavGroup}>
          <Pressable
            disabled={currentPage <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            style={[styles.pageNavBtn, currentPage <= 1 && styles.pageNavBtnDisabled]}
          >
            <Text
              style={[
                styles.pageNavBtnText,
                currentPage <= 1 && styles.pageNavBtnTextDisabled,
              ]}
            >
              ก่อนหน้า
            </Text>
          </Pressable>
          <Text style={styles.pageIndicator}>
            หน้า {currentPage} / {pageCount}
          </Text>
          <Pressable
            disabled={currentPage >= pageCount}
            onPress={() => setPage((p) => Math.min(pageCount, p + 1))}
            style={[styles.pageNavBtn, currentPage >= pageCount && styles.pageNavBtnDisabled]}
          >
            <Text
              style={[
                styles.pageNavBtnText,
                currentPage >= pageCount && styles.pageNavBtnTextDisabled,
              ]}
            >
              ถัดไป
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <AdminLayout currentScreen="users" go={go}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <UsersIcon size={20} color="#8B1E1E" />
          <Text style={styles.cardTitle}>User Management & Moderation</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name or email…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Pagination (top) so the page-size and page controls don't require scrolling past the whole list */}
        {paginationBar}

        {/* Table View (Desktop) / Card View (Mobile) */}
        {isDesktop ? (
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.5 }]}>Student</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Email</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>Role</Text>
            <Text style={[styles.th, { flex: 1 }]}>Status</Text>
            <Text style={[styles.th, { flex: 2.2, textAlign: "right" }]}>Actions</Text>
          </View>
        ) : null}

        {(Array.isArray(visible) ? visible : []).map((user) => {
          const reports = user._count?.reportsReceived ?? 0;
          if (!isDesktop) {
            {/* Mobile Responsive Card */}
            return (
              <View key={user.id} style={styles.mobileUserCard}>
                <View style={styles.mobileUserHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user.displayName ?? "—"}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      user.suspended ? styles.badgeSuspended : styles.badgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        user.suspended ? styles.textSuspended : styles.textActive,
                      ]}
                    >
                      {user.suspended ? "Suspended" : "Active"}
                    </Text>
                  </View>
                </View>

                {reports > 0 ? (
                  <Text style={styles.reportBadge}>⚠️ Reported {reports} times</Text>
                ) : null}

                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={styles.roleText}>Role: {user.role ?? "USER"}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Pressable
                      style={[styles.btnAction, styles.btnHistory]}
                      onPress={() => openHistory(user)}
                    >
                      <Text style={styles.btnActionText}>ประวัติผู้ใช้</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.btnAction, styles.btnReset]}
                      onPress={() => resetPassword(user)}
                    >
                      <Text style={styles.btnActionText}>รีเซ็ตรหัสผ่าน</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.btnAction,
                        user.suspended ? styles.btnUnsuspend : styles.btnSuspend,
                      ]}
                      onPress={() => suspend(user.id, !user.suspended)}
                    >
                      <Text style={styles.btnActionText}>
                        {user.suspended ? "เปิดใช้งาน" : "ระงับบัญชี"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.btnAction, styles.btnDelete]}
                      onPress={() => deleteAccount(user)}
                    >
                      <Text style={styles.btnActionText}>ลบบัญชี</Text>
                    </Pressable>

                    {user.verification?.status === "PENDING" ? (
                      <Pressable
                        style={[styles.btnAction, styles.btnVerify]}
                        onPress={() => verify(user.id)}
                      >
                        <Text style={styles.btnActionText}>Verify</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }

          {/* Desktop Table Row */}
          return (
            <View key={user.id} style={styles.tableRow}>
              <View style={[styles.td, { flex: 1.5 }]}>
                <Text style={styles.userName}>{user.displayName ?? "—"}</Text>
                {reports > 0 ? (
                  <Text style={styles.reportBadge}>{reports} reports</Text>
                ) : null}
              </View>

              <View style={[styles.td, { flex: 1.5 }]}>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>

              <View style={[styles.td, { flex: 0.8 }]}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>

              <View style={[styles.td, { flex: 1 }]}>
                <View
                  style={[
                    styles.statusBadge,
                    user.suspended ? styles.badgeSuspended : styles.badgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      user.suspended ? styles.textSuspended : styles.textActive,
                    ]}
                  >
                    {user.suspended ? "Suspended" : "Active"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.tdActions,
                  { flex: 2.2, flexWrap: "wrap", justifyContent: "flex-end" },
                ]}
              >
                <Pressable
                  style={[styles.btnAction, styles.btnHistory]}
                  onPress={() => openHistory(user)}
                >
                  <Text style={styles.btnActionText}>ประวัติผู้ใช้</Text>
                </Pressable>

                <Pressable
                  style={[styles.btnAction, styles.btnReset]}
                  onPress={() => resetPassword(user)}
                >
                  <Text style={styles.btnActionText}>รีเซ็ตรหัสผ่าน</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.btnAction,
                    user.suspended ? styles.btnUnsuspend : styles.btnSuspend,
                  ]}
                  onPress={() => suspend(user.id, !user.suspended)}
                >
                  <Text style={styles.btnActionText}>
                    {user.suspended ? "เปิดใช้งาน" : "ระงับบัญชี"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.btnAction, styles.btnDelete]}
                  onPress={() => deleteAccount(user)}
                >
                  <Text style={styles.btnActionText}>ลบบัญชี</Text>
                </Pressable>

                {user.verification?.status === "PENDING" ? (
                  <Pressable
                    style={[styles.btnAction, styles.btnVerify]}
                    onPress={() => verify(user.id)}
                  >
                    <Text style={styles.btnActionText}>Verify</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}

        {/* Pagination */}
        <View style={styles.paginationBar}>
          <Text style={styles.paginationInfo}>
            {filtered.length === 0
              ? "ไม่พบผู้ใช้"
              : `แสดง ${rangeStart}-${rangeEnd} จาก ${filtered.length} คน`}
          </Text>

          <View style={styles.pageSizeGroup}>
            <Text style={styles.pageSizeLabel}>แสดงต่อหน้า</Text>
            {([10, 30, 50, "all"] as PageSizeOption[]).map((opt) => (
              <Pressable
                key={String(opt)}
                style={[styles.pageSizeBtn, pageSize === opt && styles.pageSizeBtnActive]}
                onPress={() => setPageSize(opt)}
              >
                <Text
                  style={[
                    styles.pageSizeBtnText,
                    pageSize === opt && styles.pageSizeBtnTextActive,
                  ]}
                >
                  {opt === "all" ? "ทั้งหมด" : opt}
                </Text>
              </Pressable>
            ))}
          </View>

          {pageSize !== "all" && pageCount > 1 ? (
            <View style={styles.pageNavGroup}>
              <Pressable
                disabled={currentPage <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={[styles.pageNavBtn, currentPage <= 1 && styles.pageNavBtnDisabled]}
              >
                <Text
                  style={[
                    styles.pageNavBtnText,
                    currentPage <= 1 && styles.pageNavBtnTextDisabled,
                  ]}
                >
                  ก่อนหน้า
                </Text>
              </Pressable>
              <Text style={styles.pageIndicator}>
                หน้า {currentPage} / {pageCount}
              </Text>
              <Pressable
                disabled={currentPage >= pageCount}
                onPress={() => setPage((p) => Math.min(pageCount, p + 1))}
                style={[styles.pageNavBtn, currentPage >= pageCount && styles.pageNavBtnDisabled]}
              >
                <Text
                  style={[
                    styles.pageNavBtnText,
                    currentPage >= pageCount && styles.pageNavBtnTextDisabled,
                  ]}
                >
                  ถัดไป
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {/* User Activity / History Modal */}
      <CenterModal visible={Boolean(historyUser)} onClose={() => setHistoryUser(null)}>
        {historyUser ? (
          <View style={{ gap: 14 }}>
            <Text style={styles.historyTitle}>ประวัติผู้ใช้: {historyUser.name}</Text>

            {historyLoading ? (
              <Text style={styles.historyLoading}>กำลังโหลด...</Text>
            ) : historyData ? (
              <>
                <View style={styles.historyStatsGrid}>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{historyData.swipesSent}</Text>
                    <Text style={styles.historyStatLabel}>ปัดทั้งหมด</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{historyData.likesSent}</Text>
                    <Text style={styles.historyStatLabel}>กดถูกใจ</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{historyData.matches}</Text>
                    <Text style={styles.historyStatLabel}>จับคู่สำเร็จ</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{historyData.messagesSent}</Text>
                    <Text style={styles.historyStatLabel}>ข้อความที่ส่ง</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{historyData.reportsReceived}</Text>
                    <Text style={styles.historyStatLabel}>ถูกรายงาน</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{historyData.reportsMade}</Text>
                    <Text style={styles.historyStatLabel}>รายงานผู้อื่น</Text>
                  </View>
                </View>

                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyMetaText}>
                    เข้าร่วมเมื่อ {new Date(historyData.joinedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.historyMetaText}>
                    ยืนยันตัวตน: {historyData.verificationStatus}
                  </Text>
                </View>

                {historyData.recentReportsReceived.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <Text style={styles.historySectionTitle}>รายงานล่าสุดที่ถูกแจ้ง</Text>
                    {historyData.recentReportsReceived.map((r, i) => (
                      <View key={i} style={styles.historyReportRow}>
                        <Text style={styles.historyReportReason}>{r.reason}</Text>
                        <Text style={styles.historyReportMeta}>
                          {r.status} · {new Date(r.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.historyLoading}>ไม่พบข้อมูล</Text>
            )}

            <Pressable
              style={[styles.btnAction, styles.btnClose]}
              onPress={() => setHistoryUser(null)}
            >
              <Text style={[styles.btnActionText, { textAlign: "center" }]}>ปิดหน้าต่าง</Text>
            </Pressable>
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

  mobileUserCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  mobileUserHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
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
  userName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#111827",
  },
  userEmail: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#4B5563",
  },
  roleText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#6B7280",
  },
  reportBadge: {
    fontFamily: F.bold,
    fontSize: 11,
    color: "#DC2626",
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeActive: { backgroundColor: "#D1FAE5" },
  badgeSuspended: { backgroundColor: "#FEE2E2" },
  statusBadgeText: { fontFamily: F.bold, fontSize: 11 },
  textActive: { color: "#059669" },
  textSuspended: { color: "#DC2626" },

  btnAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnSuspend: { backgroundColor: "#F97316" },
  btnUnsuspend: { backgroundColor: "#10B981" },
  btnVerify: { backgroundColor: "#3B82F6" },
  btnHistory: { backgroundColor: "#6B7280" },
  btnReset: { backgroundColor: "#6366F1" },
  btnDelete: { backgroundColor: "#EF4444" },
  btnClose: { backgroundColor: "#6B7280" },
  btnActionText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },

  historyTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: "#111827",
  },
  historyLoading: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 12,
  },
  historyStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  historyStat: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  historyStatValue: {
    fontFamily: F.bold,
    fontSize: 18,
    color: "#8B1E1E",
  },
  historyStatLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  historyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  historyMetaText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#4B5563",
  },
  historySectionTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#111827",
  },
  historyReportRow: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  historyReportReason: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#111827",
  },
  historyReportMeta: {
    fontFamily: F.regular,
    fontSize: 11,
    color: "#9CA3AF",
  },

  paginationBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  paginationInfo: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#6B7280",
  },
  pageSizeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageSizeLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#6B7280",
    marginRight: 2,
  },
  pageSizeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  pageSizeBtnActive: {
    backgroundColor: "#8B1E1E",
  },
  pageSizeBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#4B5563",
  },
  pageSizeBtnTextActive: {
    color: "#FFFFFF",
  },
  pageNavGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pageNavBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#111827",
  },
  pageNavBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  pageNavBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  pageNavBtnTextDisabled: {
    color: "#9CA3AF",
  },
  pageIndicator: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "#4B5563",
  },
});
