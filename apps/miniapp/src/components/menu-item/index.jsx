import { Button, Text, View } from "@tarojs/components";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function MenuItem({ title, description, onClick, className = "" }) {
  return (
    <Button className={joinClasses("menu-item", className)} onClick={onClick}>
      <View className="menu-item-content">
        <Text className="menu-item-title">{title}</Text>
        {description ? <Text className="menu-item-description">{description}</Text> : null}
      </View>
      <Text className="menu-item-arrow">›</Text>
    </Button>
  );
}
