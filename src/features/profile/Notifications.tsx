import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Bell, Heart, Sparkles } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import { Chevron, MotionPressable, ScreenShell, Txt } from "../../components/ui";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { relativeTime } from "../discovery/discovery.content";

type Notification = {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  readAt?: string | null;
  createdAt?: string;
};

function iconFor(type?: string) {
  if (type === "match") return Sparkles;
  if (type === "like") return Heart;
  return Bell;
}

/** In-app notification centre. */
export function Notifications({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Notification[]>("/api/notifications")
      .then((data) => setItems(data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    setItems((all) =>
      all.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    await api(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(
      () => undefined,
    );
  };

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("feed")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1">{t("notifications")}</Txt>
      </View>

      {loading ? (
        <View style={[s.center, { paddingVertical: 60 }]}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={[s.card, s.center, { paddingVertical: 40 }]}>
          <Txt role="subtitle">{t("empty")}</Txt>
        </View>
      ) : (
        items.map((item) => {
          const Icon = iconFor(item.type);
          const unread = !item.readAt;
          return (
            <MotionPressable
              key={item.id}
              onPress={() => markRead(item.id)}
              pressedScale={0.99}
              style={[s.card, s.row, { gap: 14 }]}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: C.pink,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={C.primary} strokeWidth={1.9} />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <Txt role="h3" style={{ fontSize: 15 }}>
                  {item.title ?? "—"}
                </Txt>
                {item.body ? <Txt role="small">{item.body}</Txt> : null}
                {item.createdAt ? (
                  <Txt role="tiny">{relativeTime(item.createdAt)}</Txt>
                ) : null}
              </View>

              {unread ? (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: C.primary,
                  }}
                >
                  <Txt
                    style={{ fontFamily: F.bold, fontSize: 10, color: C.white }}
                  >
                    NEW
                  </Txt>
                </View>
              ) : (
                <Chevron direction="right" size={8} />
              )}
            </MotionPressable>
          );
        })
      )}
    </ScreenShell>
  );
}
