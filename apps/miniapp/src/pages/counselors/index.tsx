import { counselorsFixture } from "@campus-psych/domain";
import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getCounselors } from "../../lib/api";

export default function CounselorsPage() {
  const [counselors, setCounselors] = useState(counselorsFixture);

  useEffect(() => {
    void getCounselors()
      .then(setCounselors)
      .catch(() => {
        return;
      });
  }, []);

  return (
    <View className="page-shell">
      <View className="section-card">
        <Text className="section-title">Counselors</Text>
        <Text className="section-copy">Show specialties and upcoming slots with minimal cognitive load.</Text>
      </View>

      <View className="list-stack">
        {counselors.map((counselor) => (
          <View className="counselor-row" key={counselor.id}>
            <Text className="counselor-name">{counselor.displayName}</Text>
            <Text className="counselor-meta">{counselor.intro}</Text>
            <Text className="pill">{counselor.specialty.join(" / ")}</Text>
            <Text className="counselor-meta">Next slot: {counselor.nextAvailableSlot ?? "Unavailable"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
