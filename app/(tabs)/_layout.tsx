import { Tabs } from "expo-router";
import { View, useWindowDimensions } from "react-native";
import type { ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TABLET_BREAKPOINT = 768;

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: ColorValue;
  size: number;
  focused: boolean;
}) {
  return (
    <View
      className={`h-8 w-12 items-center justify-center rounded-full ${
        focused ? "bg-zinc-100" : ""
      }`}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#09090b",
        tabBarInactiveTintColor: "#a1a1aa",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e4e4e7",
          paddingTop: 8,
          paddingBottom: 4,
          ...(isTablet
            ? {
                width: "100%",
                maxWidth: 640,
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: 16,
                height: 64,
                paddingHorizontal: 24,
                borderRadius: 999,
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: "#e4e4e7",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }
            : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="grid-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="phone-portrait-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="receipt-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="scan-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}