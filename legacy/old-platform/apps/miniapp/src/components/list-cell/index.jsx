import { Text, View } from "@tarojs/components";
import AppButton from "../app-button";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ListCell({
  title,
  description,
  value,
  actionText,
  onClick,
  className = ""
}) {
  return (
    <AppButton className={joinClasses("list-cell", className)} variant="soft" onClick={onClick}>
      <View className="list-cell-copy">
        <Text className="list-cell-title">{title}</Text>
        {description ? <Text className="list-cell-description">{description}</Text> : null}
      </View>
      <View className="list-cell-side">
        {value ? <Text className="list-cell-value">{value}</Text> : null}
        <Text className="list-cell-arrow">{actionText ?? "查看"}</Text>
      </View>
    </AppButton>
  );
}
