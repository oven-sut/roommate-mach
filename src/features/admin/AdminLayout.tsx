import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Grid,
  LogOut,
  Menu,
  PieChart,
  Settings,
  ShieldCheck,
  Flag,
  Users as UsersIcon,
  X,
} from "lucide-react-native";
import { LogoTile } from "../../components/ui";
import { resetAppState, saveToken } from "../../services/api";
import { C } from "../../theme/colors";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";

export type AdminTab =
  | "dashboard"
  | "analytics"
  | "users"
  | "verification"
  | "adminReports"
  | "config";

interface AdminLayoutProps {
  currentScreen: AdminTab;
  go: (x: Screen) => void;
  children: React.ReactNode;
}

export function AdminLayout({ currentScreen, go, children }: AdminLayoutProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: Grid },
    { id: "analytics", label: "Analytics", icon: PieChart },
    { id: "users", label: "Users", icon: UsersIcon },
    { id: "verification", label: "Verification", icon: ShieldCheck },
    { id: "adminReports", label: "Report", icon: Flag },
    { id: "config", label: "Setting", icon: Settings },
  ];

  const handleLogout = () => {
    saveToken(null);
    resetAppState();
    go("login");
  };

  const renderSidebarContent = () => (
    <View style={styles.sidebarInner}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <LogoTile size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>SUT Roommate</Text>
          <Text style={styles.brandSub}>Match Admin</Text>
        </View>
      </View>

      {/* Navigation List */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {navItems.map((item) => {
          const IconComp = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => {
                go(item.id);
                setMobileMenuOpen(false);
              }}
            >
              <IconComp
                size={20}
                color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.7)"}
                strokeWidth={1.8}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Logout Footer Button */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="rgba(255,255,255,0.8)" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Desktop Permanent Left Sidebar */}
      {isDesktop ? (
        <View style={styles.desktopSidebar}>{renderSidebarContent()}</View>
      ) : null}

      {/* Mobile Drawer */}
      {!isDesktop && mobileMenuOpen ? (
        <View style={styles.mobileDrawerOverlay}>
          <View style={styles.mobileDrawerContent}>
            <View style={styles.mobileDrawerHeader}>
              <Text style={styles.mobileDrawerTitle}>Menu</Text>
              <Pressable onPress={() => setMobileMenuOpen(false)}>
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            {renderSidebarContent()}
          </View>
        </View>
      ) : null}

      {/* Main Content View Area */}
      <View style={styles.mainContent}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          {!isDesktop ? (
            <Pressable
              onPress={() => setMobileMenuOpen(true)}
              style={styles.menuToggleBtn}
            >
              <Menu size={22} color={C.ink} />
            </Pressable>
          ) : null}

          <View style={{ flex: 1 }}>
            <Text style={styles.headerAdminName}>JEDWADAD JADWADED</Text>
            <Text style={styles.headerAdminRole}>System Administrator</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarInitial}>J</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Screen Body */}
        <ScrollView
          contentContainerStyle={styles.bodyScroll}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F5F7",
  },
  desktopSidebar: {
    width: 240,
    backgroundColor: "#8B1E1E",
    height: "100%",
  },
  sidebarInner: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  brandTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  brandSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  navList: {
    flex: 1,
    marginTop: 20,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  navItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  navLabel: {
    fontFamily: F.medium,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.75)",
  },
  navLabelActive: {
    fontFamily: F.bold,
    color: "#FFFFFF",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    marginTop: 10,
  },
  logoutText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },

  /* Mobile Drawer */
  mobileDrawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  mobileDrawerContent: {
    width: 260,
    height: "100%",
    backgroundColor: "#8B1E1E",
  },
  mobileDrawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  mobileDrawerTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },

  /* Main View Area */
  mainContent: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#F8F9FA",
  },
  topHeader: {
    height: 64,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 16,
  },
  menuToggleBtn: {
    padding: 6,
  },
  headerAdminName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#111827",
    letterSpacing: 0.5,
  },
  headerAdminRole: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#6B7280",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#8B1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  adminAvatarInitial: {
    fontFamily: F.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },

  bodyScroll: {
    padding: 24,
  },
});
