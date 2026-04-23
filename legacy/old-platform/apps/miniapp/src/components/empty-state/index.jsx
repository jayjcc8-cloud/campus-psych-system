import { Text, View } from "@tarojs/components";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function EmptyState({ title, description, className = "" }) {
  return (
    <View className={joinClasses("empty-state-panel", className)}>
      <Text className="empty-state-title">{title}</Text>
      {description ? <Text className="empty-state-copy">{description}</Text> : null}
    </View>
  );
}
