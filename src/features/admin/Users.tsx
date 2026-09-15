import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Search, Users as UsersIcon } from "lucide-react-native";
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

export function Users({ go }: { go: (x: Screen) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const load = useCallback(async () => {
    try {
      const data = await api<any>("/api/admin/users");
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setUsers(Array.isArray(list) ? list : []);
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

  const userList = Array.isArray(users) ? users : [];
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? userList.filter((u) =>
        `${u.displayName ?? ""}${u.email ?? ""}`.toLowerCase().includes(needle),
      )
    : userList;

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

        {/* Table View (Desktop) / Card View (Mobile) */}
        {isDesktop ? (
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.5 }]}>Student</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Email</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>Role</Text>
            <Text style={[styles.th, { flex: 1 }]}>Status</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: "right" }]}>Actions</Text>
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

                <View style={styles.mobileActionsRow}>
                  <Text style={styles.roleText}>Role: {user.role ?? "USER"}</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      style={[
                        styles.btnAction,
                        user.suspended ? styles.btnUnsuspend : styles.btnSuspend,
                      ]}
                      onPress={() => suspend(user.id, !user.suspended)}
                    >
                      <Text style={styles.btnActionText}>
                        {user.suspended ? "Unsuspend" : "Suspend"}
                      </Text>
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

              <View style={[styles.tdActions, { flex: 1.2, justifyContent: "flex-end" }]}>
                <Pressable
                  style={[
                    styles.btnAction,
                    user.suspended ? styles.btnUnsuspend : styles.btnSuspend,
                  ]}
                  onPress={() => suspend(user.id, !user.suspended)}
                >
                  <Text style={styles.btnActionText}>
                    {user.suspended ? "Unsuspend" : "Suspend"}
                  </Text>
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
  mobileActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
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
  btnSuspend: { backgroundColor: "#EF4444" },
  btnUnsuspend: { backgroundColor: "#10B981" },
  btnVerify: { backgroundColor: "#3B82F6" },
  btnActionText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
});
