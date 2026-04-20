import { Text, View } from "@tarojs/components";
import AppButton from "../app-button";
import AppCard from "../app-card";
import {
  formatAvailabilityHint,
  formatAvailabilityStatus,
  formatCounselorDisplayName,
  formatCounselorSummary,
  formatIssueType
} from "../../lib/display";

export default function CounselorCard({ counselor, onBook }) {
  return (
    <AppCard className="counselor-card">
      <View className="counselor-card-header">
        <View className="avatar-badge">{formatCounselorDisplayName(counselor.displayName).slice(0, 1)}</View>
        <View className="counselor-card-body">
          <View className="counselor-card-topline">
            <Text className="counselor-name">{formatCounselorDisplayName(counselor.displayName)}</Text>
            <Text className={counselor.nextAvailableSlot ? "availability-pill is-open" : "availability-pill"}>
              {formatAvailabilityStatus(counselor.nextAvailableSlot)}
            </Text>
          </View>
          <Text className="counselor-meta">{formatCounselorSummary(counselor)}</Text>
        </View>
      </View>

      <View className="specialty-row">
        {counselor.specialty.map((item) => (
          <Text className="specialty-pill" key={item}>
            {formatIssueType(item)}
          </Text>
        ))}
      </View>

      <View className="counselor-card-footer">
        <View className="info-panel">
          <Text className="section-copy">{formatAvailabilityHint(counselor.nextAvailableSlot)}</Text>
          <Text className="inline-note">先进入预约页，再确认时间和补充说明。</Text>
        </View>
        <View className="counselor-card-actions">
          <AppButton block={false} variant="ghost" onClick={onBook}>
            查看详情
          </AppButton>
          <AppButton block={false} disabled={!counselor.nextAvailableSlot} onClick={onBook}>
            预约
          </AppButton>
        </View>
      </View>
    </AppCard>
  );
}
