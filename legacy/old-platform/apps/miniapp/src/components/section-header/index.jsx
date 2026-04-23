import { Text, View } from "@tarojs/components";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function SectionHeader({ title, description, extra, className = "" }) {
  return (
    <View className={joinClasses("section-header", className)}>
      <View className="section-header-copy">
        <Text className="section-title">{title}</Text>
        {description ? <Text className="section-copy">{description}</Text> : null}
      </View>
      {extra ? <View className="section-header-extra">{extra}</View> : null}
    </View>
  );
}
