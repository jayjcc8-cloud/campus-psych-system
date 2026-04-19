import { View } from "@tarojs/components";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function AppCard({ children, className = "", tone = "default" }) {
  return <View className={joinClasses("app-card", tone !== "default" ? `app-card-${tone}` : "", className)}>{children}</View>;
}
