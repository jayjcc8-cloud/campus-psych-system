import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { getCounselors } from "../../lib/api";
import { counselorsFixture } from "../../lib/fixtures";

export default function CounselorsPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState(counselorsFixture);
  const preferredIssueType = router.params.issueType;

  useEffect(() => {
    getCounselors()
      .then(setCounselors)
      .catch(() => {
        return;
      });
  }, []);

  const openBooking = (counselorId) => {
    const issueParam = preferredIssueType ? `&issueType=${preferredIssueType}` : "";
    Taro.navigateTo({ url: `/pages/appointment/index?counselorId=${counselorId}${issueParam}` });
  };

  return (
    <View className="page-shell">
      <View className="section-card">
        <Text className="section-title">Counselors</Text>
        <Text className="section-copy">Show specialties and upcoming slots with minimal cognitive load.</Text>
        {preferredIssueType ? (
          <Text className="pill">Suggested issue type: {preferredIssueType}</Text>
        ) : null}
      </View>

      <View className="list-stack">
        {counselors.map((counselor) => (
          <View className="counselor-row" key={counselor.id}>
            <Text className="counselor-name">{counselor.displayName}</Text>
            <Text className="counselor-meta">{counselor.intro}</Text>
            <Text className="pill">{counselor.specialty.join(" / ")}</Text>
            <Text className="counselor-meta">Next slot: {counselor.nextAvailableSlot ?? "Unavailable"}</Text>
            <Button className="primary-button" disabled={!counselor.nextAvailableSlot} onClick={() => openBooking(counselor.id)}>
              Book with {counselor.displayName}
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}
