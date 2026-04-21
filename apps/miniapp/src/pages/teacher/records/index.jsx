import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppCard from "../../../components/app-card";
import EmptyState from "../../../components/empty-state";
import PageHeader from "../../../components/page-header";
import SectionHeader from "../../../components/section-header";
import { isTeacherSession } from "../../../lib/auth-session";
import { formatDateTime, formatIssueType } from "../../../lib/display";
import { getTeacherSessionRecords } from "../../../lib/teacher-api";

const riskLevelLabelMap = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

export default function TeacherRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadRecords = () => {
    if (!isTeacherSession()) {
      Taro.redirectTo({ url: "/pages/binding/index" });
      return;
    }

    setLoading(true);
    setLoadError("");

    getTeacherSessionRecords()
      .then(setRecords)
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "咨询记录暂时没有完全刷新。");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useDidShow(() => {
    loadRecords();
  });

  return (
    <View className="page-shell">
      <PageHeader kicker="咨询记录" title="咨询记录" />

      {loading ? <Text className="inline-note">正在同步记录...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent">
          <SectionHeader title="记录列表" extra={<Text className="count-badge">{records.length} 条</Text>} />
        </AppCard>

        {records.length > 0 ? (
          records.map((record) => (
            <AppCard className="teacher-record-card" key={record.id}>
              <View className="appointment-card-head">
                <View className="appointment-card-copy">
                  <Text className="appointment-card-title">{formatIssueType(record.issueType)}</Text>
                  <Text className="appointment-card-subtitle">{formatDateTime(record.createdAt)}</Text>
                </View>
                <Text className={`risk-level-pill risk-level-${record.riskLevel}`}>
                  {riskLevelLabelMap[record.riskLevel] ?? record.riskLevel}
                </Text>
              </View>
              <View className="appointment-detail-grid">
                <View className="appointment-detail-item">
                  <Text className="appointment-detail-label">情绪强度</Text>
                  <Text className="appointment-detail-value">{record.emotionLevel}/5</Text>
                </View>
                <View className="appointment-detail-item">
                  <Text className="appointment-detail-label">跟进</Text>
                  <Text className="appointment-detail-value">{record.needFollowUp ? "需要" : "无需"}</Text>
                </View>
              </View>
              <Text className="appointment-remark">{record.summaryNote}</Text>
            </AppCard>
          ))
        ) : (
          <EmptyState title="暂无咨询记录" />
        )}
      </View>
    </View>
  );
}
