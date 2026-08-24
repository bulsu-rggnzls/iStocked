import { Tabs } from "expo-router";
import { View, useWindowDimensions, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  return (
    <View
      className={`fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-t border-zinc-200 ${
        isTablet
          ? "max-w-xl mx-auto mb-4 rounded-full border shadow-md"
          : "pb-safe"
      }`}
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
                className={`${
                  isTablet ? "text-xs" : "text-[10px]"
                } font-medium ${
                  isFocused ? "text-zinc-900 font-semibold" : "text-zinc-500"
                }`}
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
