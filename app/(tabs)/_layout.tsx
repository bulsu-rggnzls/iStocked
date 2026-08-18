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
        focused ? "bg-emerald-50" : ""
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
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#8a958d",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#E3E8E2",
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