import { View, Text } from "@tarojs/components";

const entries = [
  "Feeling academic pressure",
  "Sleep is getting worse",
  "Relationship difficulties",
  "Need someone to talk to"
];

export default function HomePage() {
  return (
    <View className="page-shell">
      <View className="hero-card">
        <Text className="eyebrow">Student miniapp</Text>
        <Text className="hero-title">Book support without heavy labels.</Text>
        <Text className="hero-copy">
          The MVP starts with guided emotional entry points, offline counseling slots, and visible emergency help.
        </Text>
        <View className="entry-grid">
          {entries.map((entry) => (
            <View className="entry-chip" key={entry}>
              <Text>{entry}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="section-card">
        <Text className="section-title">Primary shortcuts</Text>
        <Text className="section-copy">Book a counselor, review current appointments, or open emergency contacts.</Text>
      </View>
    </View>
  );
}

