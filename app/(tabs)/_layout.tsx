import { Tabs } from "expo-router";
import { View } from "react-native";
import type { ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#09090b",
        tabBarInactiveTintColor: "#a1a1aa",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e4e4e7",
          minHeight: 58,
          paddingTop: 6,
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