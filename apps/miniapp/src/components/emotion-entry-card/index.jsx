import { Text, View } from "@tarojs/components";
import AppButton from "../app-button";

export default function EmotionEntryCard({ title, description, onClick }) {
  return (
    <AppButton className="emotion-entry-card" variant="soft" onClick={onClick}>
      <View className="emotion-entry-content">
        <Text className="emotion-entry-eyebrow">从这里开始</Text>
        <Text className="emotion-entry-title">{title}</Text>
        <Text className="emotion-entry-description">{description}</Text>
      </View>
    </AppButton>
  );
}
