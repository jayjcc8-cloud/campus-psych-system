import { Text, View } from "@tarojs/components";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function PageHeader({ kicker, title, subtitle, className = "" }) {
  return (
    <View className={joinClasses("page-header", className)}>
      {kicker ? <Text className="section-kicker">{kicker}</Text> : null}
      <Text className="page-title">{title}</Text>
      {subtitle ? <Text className="page-subtitle">{subtitle}</Text> : null}
    </View>
  );
}
