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
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react-native";
import { CenterModal } from "../../components/Sheet";
import { api } from "../../services/api";
import { shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type ReportItem = {
  id: string;
  reporter?: { id?: string; displayName?: string; email?: string };
  reported?: { id: string; displayName?: string; email?: string; suspended?: boolean };
  reason: string;
  details?: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt?: string;
};

type StatusFilter = "ALL" | "PENDING" | "RESOLVED" | "DISMISSED";

export function Report({ go }: { go: (x: Screen) => void }) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  }>({ total: 0, pending: 0, resolved: 0, dismissed: 0 });
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const loadReports = useCallback(async () => {
    try {
      const [data, sumData] = await Promise.all([
        api<any>("/api/admin/reports"),
        api<any>("/api/admin/reports/summary").catch(() => null),
      ]);
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setReports(Array.isArray(list) ? list : []);
      if (sumData) {
        setSummary({
          total: sumData.total ?? 0,
          pending: sumData.pending ?? 0,
          resolved: sumData.resolved ?? 0,
          dismissed: sumData.dismissed ?? 0,
        });
      }
    } catch (reason) {
      Alert.alert(
        "รายงานปัญหา",
        reason instanceof Error ? reason.message : "ไม่สามารถโหลดข้อมูลรายงานได้",
      );
      setReports([]);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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

  const handleUpdateStatus = async (
    id: string,
    nextStatus: "RESOLVED" | "DISMISSED" | "PENDING",
    statusLabel: string,
  ) => {
    setActionLoading(true);
    try {
      await api(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      Alert.alert("อัปเดตสถานะ", `เปลี่ยนสถานะรายงานเป็น "${statusLabel}" เรียบร้อยแล้ว`);
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      loadReports();
    } catch (reason) {
      Alert.alert(
        "ข้อผิดพลาด",
        reason instanceof Error ? reason.message : "ทำรายการไม่สำเร็จ",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveAndSuspend = (item: ReportItem) => {
    const reportedName = item.reported?.displayName ?? item.reported?.email ?? "ผู้ใช้นี้";
    confirmAction(
      `อนุมัติรายงานและระงับบัญชีของ ${reportedName}? ผู้ใช้จะไม่สามารถเข้าใช้งานระบบได้`,
      async () => {
        setActionLoading(true);
        try {
          // 1. Resolve report
          await api(`/api/admin/reports/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "RESOLVED" }),
          });
          // 2. Suspend user if reported user ID exists
          if (item.reported?.id) {
            await api(`/api/admin/users/${item.reported.id}/suspend`, {
              method: "PATCH",
              body: JSON.stringify({ suspended: true }),
            });
          }
          Alert.alert(
            "สำเร็จ",
            `อนุมัติรายงานและระงับบัญชีของ ${reportedName} เรียบร้อยแล้ว`,
          );
          if (selectedReport?.id === item.id) {
            setSelectedReport(null);
          }
          loadReports();
        } catch (reason) {
          Alert.alert(
            "ข้อผิดพลาด",
            reason instanceof Error ? reason.message : "ทำรายการไม่สำเร็จ",
          );
        } finally {
          setActionLoading(false);
        }
      },
    );
  };

  const handleSuspendUser = async (userId: string, nextSuspended: boolean, userName: string) => {
    confirmAction(
      nextSuspended
        ? `ต้องการระงับบัญชีของ ${userName}?`
        : `ต้องการปลดการระงับและเปิดใช้งานบัญชีของ ${userName}?`,
      async () => {
        setActionLoading(true);
        try {
          await api(`/api/admin/users/${userId}/suspend`, {
            method: "PATCH",
            body: JSON.stringify({ suspended: nextSuspended }),
          });
          Alert.alert(
            nextSuspended ? "ระงับบัญชี" : "เปิดใช้งานบัญชี",
            nextSuspended
              ? `ระงับบัญชีของ ${userName} เรียบร้อยแล้ว`
              : `เปิดใช้งานบัญชีของ ${userName} เรียบร้อยแล้ว`,
          );
          if (selectedReport?.reported?.id === userId) {
            setSelectedReport((prev) =>
              prev
                ? {
                    ...prev,
                    reported: prev.reported
                      ? { ...prev.reported, suspended: nextSuspended }
                      : undefined,
                  }
                : null,
            );
          }
          loadReports();
        } catch (reason) {
          Alert.alert(
            "ข้อผิดพลาด",
            reason instanceof Error ? reason.message : "ทำรายการไม่สำเร็จ",
          );
        } finally {
          setActionLoading(false);
        }
      },
    );
  };

  const reportList = Array.isArray(reports) ? reports : [];
  const needle = query.trim().toLowerCase();

  const filtered = reportList.filter((item) => {
    const matchStatus = activeFilter === "ALL" || item.status === activeFilter;
    if (!matchStatus) return false;
    if (!needle) return true;
    const searchTarget = `${item.reported?.displayName ?? ""} ${item.reported?.email ?? ""} ${item.reporter?.displayName ?? ""} ${item.reporter?.email ?? ""} ${item.reason} ${item.details ?? ""}`.toLowerCase();
    return searchTarget.includes(needle);
  });

  const pendingCount = summary.pending || reportList.filter((r) => r.status === "PENDING").length;
  const resolvedCount = summary.resolved || reportList.filter((r) => r.status === "RESOLVED").length;
  const dismissedCount = summary.dismissed || reportList.filter((r) => r.status === "DISMISSED").length;

  return (
    <AdminLayout currentScreen="adminReports" go={go}>
      {/* Overview Info Banner */}
      <View style={styles.banner}>
        <AlertTriangle size={20} color="#8B1E1E" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>ศูนย์จัดการรายงานปัญหา & ความปลอดภัย (Safety Moderation)</Text>
          <Text style={styles.bannerText}>
            หน้านี้ใช้สำหรับแอดมินในการตรวจสอบปัญหาที่ผู้ใช้รายงานเข้ามา (เช่น รูปโปรไฟล์ไม่เหมาะสม, พฤติกรรมไม่เหมาะสม, บัญชีปลอม) คุณสามารถอนุมัติรายงาน, ยกเลิกรายงาน หรือสั่งระงับใช้งานบัญชีผู้ถูกรายงานได้ทันที
          </Text>
        </View>
      </View>

      {/* Metric Cards Top Row */}
      <View style={styles.metricsRow}>
        <Pressable
          style={[
            styles.metricCard,
            { borderLeftColor: "#F59E0B" },
            activeFilter === "PENDING" && styles.metricCardActive,
          ]}
          onPress={() => setActiveFilter(activeFilter === "PENDING" ? "ALL" : "PENDING")}
        >
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>รอตรวจสอบ (Pending)</Text>
            <Clock size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.metricVal, { color: "#D97706" }]}>{pendingCount}</Text>
        </Pressable>

        <Pressable
          style={[
            styles.metricCard,
            { borderLeftColor: "#10B981" },
            activeFilter === "RESOLVED" && styles.metricCardActive,
          ]}
          onPress={() => setActiveFilter(activeFilter === "RESOLVED" ? "ALL" : "RESOLVED")}
        >
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>ดำเนินการแล้ว (Resolved)</Text>
            <CheckCircle size={18} color="#10B981" />
          </View>
          <Text style={[styles.metricVal, { color: "#059669" }]}>{resolvedCount}</Text>
        </Pressable>

        <Pressable
          style={[
            styles.metricCard,
            { borderLeftColor: "#6B7280" },
            activeFilter === "DISMISSED" && styles.metricCardActive,
          ]}
          onPress={() => setActiveFilter(activeFilter === "DISMISSED" ? "ALL" : "DISMISSED")}
        >
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>ยกเลิกรายงาน (Dismissed)</Text>
            <XCircle size={18} color="#6B7280" />
          </View>
          <Text style={[styles.metricVal, { color: "#4B5563" }]}>{dismissedCount}</Text>
        </Pressable>
      </View>

      {/* Main Content Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Flag size={20} color="#8B1E1E" />
          <Text style={styles.cardTitle}>รายการรายงานปัญหาทั้งหมด ({filtered.length})</Text>
        </View>

        {/* Filter Controls Bar */}
        <View style={styles.filterBar}>
          <View style={styles.searchBox}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ค้นหาชื่อผู้รายงาน, ผู้ถูกรายงาน หรือสาเหตุ…"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.filterTabs}>
            {(
              [
                { id: "ALL", label: "ทั้งหมด" },
                { id: "PENDING", label: `รอตรวจสอบ (${pendingCount})` },
                { id: "RESOLVED", label: `ดำเนินการแล้ว (${resolvedCount})` },
                { id: "DISMISSED", label: `ยกเลิก (${dismissedCount})` },
              ] as { id: StatusFilter; label: string }[]
            ).map((tab) => (
              <Pressable
                key={tab.id}
                style={[styles.tabBtn, activeFilter === tab.id && styles.tabBtnActive]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeFilter === tab.id && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Table View (Desktop) / Mobile Responsive Cards */}
        {isDesktop ? (
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.5 }]}>ผู้ถูกรายงาน (Reported)</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>ผู้แจ้งรายงาน (Reporter)</Text>
            <Text style={[styles.th, { flex: 2 }]}>สาเหตุ & รายละเอียด</Text>
            <Text style={[styles.th, { flex: 1 }]}>สถานะ</Text>
            <Text style={[styles.th, { flex: 2.2, textAlign: "right" }]}>จัดการรายการ</Text>
          </View>
        ) : null}

        {filtered.length === 0 ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: "#6B7280" }}>
              ไม่พบรายการรายงานที่ตรงตามเงื่อนไข
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const reportedName = item.reported?.displayName ?? "—";
            const reporterName = item.reporter?.displayName ?? "—";
            const isSuspended = item.reported?.suspended ?? false;

            if (!isDesktop) {
              {/* Mobile Card */}
              return (
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportedName}>🚨 {reportedName}</Text>
                      <Text style={styles.subText}>{item.reported?.email}</Text>
                      {isSuspended ? (
                        <Text style={styles.suspendedTag}>⛔ บัญชีถูกระงับอยู่</Text>
                      ) : null}
                    </View>
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
                      <Text style={styles.badgeText}>
                        {item.status === "RESOLVED"
                          ? "ดำเนินการแล้ว"
                          : item.status === "DISMISSED"
                          ? "ยกเลิกรายงาน"
                          : "รอตรวจสอบ"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.reporterLabel}>ผู้แจ้ง: <Text style={{ fontFamily: F.regular }}>{reporterName} ({item.reporter?.email})</Text></Text>
                    <Text style={styles.reasonTitle}>สาเหตุ: <Text style={styles.reasonText}>{item.reason}</Text></Text>
                    {item.details ? <Text style={styles.subText}>รายละเอียด: {item.details}</Text> : null}
                    {item.createdAt ? (
                      <Text style={styles.timeText}>
                        วันที่แจ้ง: {new Date(item.createdAt).toLocaleString("th-TH")}
                      </Text>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    <Pressable
                      style={[styles.btnAction, styles.btnDetail]}
                      onPress={() => setSelectedReport(item)}
                    >
                      <Eye size={14} color="#FFFFFF" />
                      <Text style={styles.btnActionText}>ดูข้อมูล</Text>
                    </Pressable>

                    {item.status === "PENDING" ? (
                      <>
                        <Pressable
                          style={[styles.btnAction, styles.btnResolve]}
                          onPress={() => handleResolveAndSuspend(item)}
                        >
                          <CheckCircle size={14} color="#FFFFFF" />
                          <Text style={styles.btnActionText}>อนุมัติ + ระงับ</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.btnAction, styles.btnDismiss]}
                          onPress={() => handleUpdateStatus(item.id, "DISMISSED", "ยกเลิกรายงาน")}
                        >
                          <XCircle size={14} color="#FFFFFF" />
                          <Text style={styles.btnActionText}>ยกเลิกรายงาน</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        style={[styles.btnAction, styles.btnReopen]}
                        onPress={() => handleUpdateStatus(item.id, "PENDING", "รอตรวจสอบ")}
                      >
                        <RefreshCw size={14} color="#FFFFFF" />
                        <Text style={styles.btnActionText}>ดึงกลับเป็นรอตรวจสอบ</Text>
                      </Pressable>
                    )}

                    {item.reported?.id ? (
                      <Pressable
                        style={[
                          styles.btnAction,
                          isSuspended ? styles.btnUnsuspend : styles.btnSuspend,
                        ]}
                        onPress={() =>
                          handleSuspendUser(item.reported!.id, !isSuspended, reportedName)
                        }
                      >
                        {isSuspended ? (
                          <UserCheck size={14} color="#FFFFFF" />
                        ) : (
                          <UserX size={14} color="#FFFFFF" />
                        )}
                        <Text style={styles.btnActionText}>
                          {isSuspended ? "เปิดใช้งาน" : "ระงับบัญชี"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            }

            {/* Desktop Table Row */}
            return (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.td, { flex: 1.5 }]}>
                  <Text style={styles.reportedName}>{reportedName}</Text>
                  <Text style={styles.subText}>{item.reported?.email}</Text>
                  {isSuspended ? (
                    <Text style={styles.suspendedTag}>⛔ บัญชีถูกระงับอยู่</Text>
                  ) : null}
                </View>

                <View style={[styles.td, { flex: 1.5 }]}>
                  <Text style={styles.reporterName}>{reporterName}</Text>
                  <Text style={styles.subText}>{item.reporter?.email}</Text>
                </View>

                <View style={[styles.td, { flex: 2 }]}>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                  {item.details ? <Text style={styles.subText}>{item.details}</Text> : null}
                  {item.createdAt ? (
                    <Text style={styles.timeText}>
                      {new Date(item.createdAt).toLocaleDateString("th-TH")}
                    </Text>
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
                    <Text style={styles.badgeText}>
                      {item.status === "RESOLVED"
                        ? "ดำเนินการแล้ว"
                        : item.status === "DISMISSED"
                        ? "ยกเลิกรายงาน"
                        : "รอตรวจสอบ"}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tdActions, { flex: 2.2, justifyContent: "flex-end", flexWrap: "wrap" }]}>
                  <Pressable
                    style={[styles.btnAction, styles.btnDetail]}
                    onPress={() => setSelectedReport(item)}
                  >
                    <Eye size={13} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>รายละเอียด</Text>
                  </Pressable>

                  {item.status === "PENDING" ? (
                    <>
                      <Pressable
                        style={[styles.btnAction, styles.btnResolve]}
                        onPress={() => handleResolveAndSuspend(item)}
                      >
                        <CheckCircle size={13} color="#FFFFFF" />
                        <Text style={styles.btnActionText}>อนุมัติ + ระงับ</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.btnAction, styles.btnDismiss]}
                        onPress={() => handleUpdateStatus(item.id, "DISMISSED", "ยกเลิกรายงาน")}
                      >
                        <XCircle size={13} color="#FFFFFF" />
                        <Text style={styles.btnActionText}>ยกเลิก</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={[styles.btnAction, styles.btnReopen]}
                      onPress={() => handleUpdateStatus(item.id, "PENDING", "รอตรวจสอบ")}
                    >
                      <RefreshCw size={13} color="#FFFFFF" />
                      <Text style={styles.btnActionText}>รีเซ็ต</Text>
                    </Pressable>
                  )}

                  {item.reported?.id ? (
                    <Pressable
                      style={[
                        styles.btnAction,
                        isSuspended ? styles.btnUnsuspend : styles.btnSuspend,
                      ]}
                      onPress={() =>
                        handleSuspendUser(item.reported!.id, !isSuspended, reportedName)
                      }
                    >
                      <Text style={styles.btnActionText}>
                        {isSuspended ? "เปิดใช้งาน" : "ระงับบัญชี"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Report Detail & Management Modal */}
      <CenterModal visible={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} maxWidth={520}>
        {selectedReport ? (
          <View style={{ gap: 16, width: "100%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Flag size={20} color="#8B1E1E" />
              <Text style={styles.modalTitle}>รายละเอียดรายงานปัญหา</Text>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>ผู้ถูกรายงาน:</Text>
                <Text style={styles.modalValRed}>
                  {selectedReport.reported?.displayName ?? "—"} ({selectedReport.reported?.email})
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>สถานะบัญชีปัจจุบัน:</Text>
                <Text
                  style={[
                    styles.modalVal,
                    selectedReport.reported?.suspended ? { color: "#DC2626" } : { color: "#059669" },
                  ]}
                >
                  {selectedReport.reported?.suspended ? "⛔ ถูกระงับการใช้งาน (Suspended)" : "✅ ใช้งานปกติ (Active)"}
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>ผู้แจ้งรายงาน:</Text>
                <Text style={styles.modalVal}>
                  {selectedReport.reporter?.displayName ?? "—"} ({selectedReport.reporter?.email})
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>หัวข้อปัญหา:</Text>
                <Text style={styles.modalValBold}>{selectedReport.reason}</Text>
              </View>

              {selectedReport.details ? (
                <View style={{ gap: 4 }}>
                  <Text style={styles.modalLabel}>รายละเอียดเพิ่มเติม:</Text>
                  <View style={styles.detailsQuote}>
                    <Text style={styles.detailsQuoteText}>{selectedReport.details}</Text>
                  </View>
                </View>
              ) : null}

              {selectedReport.createdAt ? (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>วันที่แจ้งปัญหา:</Text>
                  <Text style={styles.modalVal}>
                    {new Date(selectedReport.createdAt).toLocaleString("th-TH")}
                  </Text>
                </View>
              ) : null}

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>สถานะรายงาน:</Text>
                <Text style={styles.modalValBold}>
                  {selectedReport.status === "RESOLVED"
                    ? "🟢 ดำเนินการแล้ว (Resolved)"
                    : selectedReport.status === "DISMISSED"
                    ? "⚪ ยกเลิกรายงาน (Dismissed)"
                    : "🟡 รอตรวจสอบ (Pending)"}
                </Text>
              </View>
            </View>

            {/* Action Buttons inside Modal */}
            <Text style={styles.actionSectionTitle}>คำสั่งดำเนินการสำหรับแอดมิน</Text>

            <View style={{ gap: 10 }}>
              {selectedReport.reported?.id ? (
                <Pressable
                  style={[styles.modalActionBtn, styles.btnResolve]}
                  disabled={actionLoading}
                  onPress={() => handleResolveAndSuspend(selectedReport)}
                >
                  <CheckCircle size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>
                    อนุมัติรายงาน + ระงับบัญชีผู้ถูกรายงานทันที
                  </Text>
                </Pressable>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <Pressable
                  style={[styles.modalActionBtn, { flex: 1, backgroundColor: "#10B981" }]}
                  disabled={actionLoading}
                  onPress={() =>
                    handleUpdateStatus(selectedReport.id, "RESOLVED", "ดำเนินการแล้ว")
                  }
                >
                  <CheckCircle size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>มาร์คว่าดำเนินการแล้ว</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalActionBtn, { flex: 1, backgroundColor: "#6B7280" }]}
                  disabled={actionLoading}
                  onPress={() =>
                    handleUpdateStatus(selectedReport.id, "DISMISSED", "ยกเลิกรายงาน")
                  }
                >
                  <XCircle size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>ยกเลิกรายงานนี้</Text>
                </Pressable>
              </View>

              {selectedReport.status !== "PENDING" ? (
                <Pressable
                  style={[styles.modalActionBtn, styles.btnReopen]}
                  disabled={actionLoading}
                  onPress={() =>
                    handleUpdateStatus(selectedReport.id, "PENDING", "รอตรวจสอบ")
                  }
                >
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>
                    รีเซ็ตสถานะเป็น "รอตรวจสอบ"
                  </Text>
                </Pressable>
              ) : null}

              {selectedReport.reported?.id ? (
                <Pressable
                  style={[
                    styles.modalActionBtn,
                    selectedReport.reported.suspended ? styles.btnUnsuspend : styles.btnSuspend,
                  ]}
                  disabled={actionLoading}
                  onPress={() =>
                    handleSuspendUser(
                      selectedReport.reported!.id,
                      !selectedReport.reported!.suspended,
                      selectedReport.reported?.displayName ?? "ผู้ใช้นี้",
                    )
                  }
                >
                  {selectedReport.reported.suspended ? (
                    <UserCheck size={16} color="#FFFFFF" />
                  ) : (
                    <UserX size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.modalActionBtnText}>
                    {selectedReport.reported.suspended
                      ? "ปลดระงับ / เปิดใช้งานบัญชีผู้ใช้"
                      : "ระงับใช้งานบัญชีผู้ถูกรายงาน"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={[styles.modalActionBtn, { backgroundColor: "#374151", marginTop: 6 }]}
              onPress={() => setSelectedReport(null)}
            >
              <Text style={[styles.modalActionBtnText, { textAlign: "center", flex: 1 }]}>
                ปิดหน้าต่าง
              </Text>
            </Pressable>
          </View>
        ) : null}
      </CenterModal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bannerTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#8B1E1E",
    marginBottom: 4,
  },
  bannerText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
  },

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
    ...shadow(1),
  },
  metricCardActive: {
    backgroundColor: "#FFFBEB",
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
    ...shadow(1),
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

  filterBar: {
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 14,
    color: "#111827",
  },
  filterTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  tabBtnActive: {
    backgroundColor: "#8B1E1E",
  },
  tabBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#4B5563",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
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
  mobileCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
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
  suspendedTag: {
    fontFamily: F.bold,
    fontSize: 11,
    color: "#DC2626",
    marginTop: 2,
  },
  reasonTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#111827",
  },
  reasonText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#111827",
  },
  reporterLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#4B5563",
  },
  timeText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  detailBox: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    gap: 4,
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

  btnAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnDetail: { backgroundColor: "#4B5563" },
  btnResolve: { backgroundColor: "#059669" },
  btnDismiss: { backgroundColor: "#6B7280" },
  btnReopen: { backgroundColor: "#3B82F6" },
  btnSuspend: { backgroundColor: "#EF4444" },
  btnUnsuspend: { backgroundColor: "#10B981" },
  btnActionText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },

  modalTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: "#111827",
  },
  modalContent: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  modalLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#4B5563",
  },
  modalVal: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#111827",
  },
  modalValBold: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#111827",
  },
  modalValRed: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#DC2626",
  },
  detailsQuote: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 3,
    borderLeftColor: "#8B1E1E",
    padding: 10,
    borderRadius: 6,
  },
  detailsQuoteText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#111827",
  },

  actionSectionTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#111827",
    marginTop: 4,
  },
  modalActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalActionBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },
});
