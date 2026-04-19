import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";

const entries = [
  { label: "Feeling academic pressure", issueType: "academic_pressure" },
  { label: "Sleep is getting worse", issueType: "sleep" },
  { label: "Relationship difficulties", issueType: "relationship" },
  { label: "Need someone to talk to", issueType: "emotion" }
];

export default function HomePage() {
  const openCounselors = (issueType) => {
    const suffix = issueType ? `?issueType=${issueType}` : "";
    Taro.navigateTo({ url: `/pages/counselors/index${suffix}` });
  };

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
            <Button className="entry-chip entry-button" key={entry.label} onClick={() => openCounselors(entry.issueType)}>
              <Text>{entry.label}</Text>
            </Button>
          ))}
        </View>
      </View>

      <View className="section-card">
        <Text className="section-title">Primary shortcuts</Text>
        <Text className="section-copy">Book a counselor, review current appointments, or open emergency contacts.</Text>
        <View className="shortcut-grid">
          <Button className="shortcut-button" onClick={() => openCounselors()}>
            Book support
          </Button>
          <Button className="shortcut-button shortcut-button-secondary" onClick={() => Taro.navigateTo({ url: "/pages/my/index" })}>
            My appointments
          </Button>
          <Button className="shortcut-button shortcut-button-secondary" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
            Emergency help
          </Button>
        </View>
      </View>
    </View>
  );
}
