import { Tabs } from "expo-router";
import { View, useWindowDimensions, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABLET_BREAKPOINT = 768;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_CONFIG: { name: string; icon: IoniconsName; label: string }[] = [
  { name: "index", icon: "grid-outline", label: "Dashboard" },
  { name: "inventory", icon: "phone-portrait-outline", label: "Inventory" },
  { name: "sales", icon: "receipt-outline", label: "Sales" },
  { name: "scan", icon: "scan-outline", label: "Scan" },
];

function CustomTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();

  return (
    <View
      className="inset-x-0 bottom-0 z-50 border-t border-zinc-200"
      style={{
        position: "absolute",
        left: isTablet ? "10%" : 0,
        right: isTablet ? "10%" : 0,
        bottom: isTablet ? 16 + insets.bottom : 0,
        zIndex: 1000,
        backgroundColor: "rgba(255,255,255,0.94)",
        borderRadius: isTablet ? 999 : 0,
        borderWidth: 1,
        borderColor: "#e4e4e7",
        marginHorizontal: isTablet ? 16 : 0,
        shadowColor: "#000",
        shadowOpacity: isTablet ? 0.08 : 0,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: isTablet ? 4 : 0,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      <View className="flex-1 flex-row items-center justify-around">
        {state.routes.map((route: any) => {
          const isFocused = state.index === state.routes.indexOf(route);
          const color = isFocused ? "#09090b" : "#71717a";
          const tabConfig = TAB_CONFIG.find((t) => t.name === route.name);

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="flex-1 flex-col items-center justify-center py-2 gap-1"
            >
              <Ionicons
                name={tabConfig?.icon ?? "ellipse-outline"}
                size={22}
                color={color}
              />
              <Text
                className={`${isTablet ? "text-xs" : "text-[10px]"}`}
                style={{ color, fontWeight: isFocused ? "600" : "500" }}
              >
                {tabConfig?.label ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
          }}
        />
      ))}
    </Tabs>
  );
}
