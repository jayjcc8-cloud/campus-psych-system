import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../../components/app-button";
import AppCard from "../../../components/app-card";
import EmptyState from "../../../components/empty-state";
import PageHeader from "../../../components/page-header";
import SectionHeader from "../../../components/section-header";
import { isTeacherSession } from "../../../lib/auth-session";
import { formatDateTime } from "../../../lib/display";
import { getTeacherRiskFlags, updateTeacherRiskFlag } from "../../../lib/teacher-api";

const riskLevelLabelMap = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

const riskStatusLabelMap = {
  pending: "待处理",
  in_progress: "跟进中",
  processed: "已处理",
  closed: "已关闭"
};

const riskFilters = [
  { key: "active", title: "进行中" },
  { key: "high", title: "高风险" },
  { key: "all", title: "全部" }
];

function getRiskActions(status) {
  if (status === "pending") {
    return [{ label: "开始跟进", status: "in_progress", variant: "primary" }];
  }

  if (status === "in_progress") {
    return [
      { label: "标记处理", status: "processed", variant: "primary" },
      { label: "关闭", status: "closed", variant: "ghost" }
    ];
  }

  if (status === "processed") {
    return [{ label: "关闭", status: "closed", variant: "ghost" }];
  }

  return [];
}

export default function TeacherRisksPage() {
  const [risks, setRisks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadRisks = () => {
    if (!isTeacherSession()) {
      Taro.redirectTo({ url: "/pages/binding/index" });
      return;
    }

    setLoading(true);
    setLoadError("");

    getTeacherRiskFlags()
      .then(setRisks)
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "风险信息暂时没有完全刷新。");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRisks();
  }, []);

  useDidShow(() => {
    loadRisks();
  });

  const handleUpdateRisk = async (risk, status) => {
    setUpdatingId(risk.id);
    setLoadError("");

    try {
      await updateTeacherRiskFlag(risk.id, { status });
      Taro.showToast({ title: "已更新", icon: "success" });
      loadRisks();
    } catch (error) {
      const message = error instanceof Error ? error.message : "风险状态更新失败。";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setUpdatingId("");
    }
  };

  const visibleRisks = risks.filter((risk) => {
    if (activeFilter === "high") {
      return risk.level === "high";
    }

    if (activeFilter === "active") {
      return risk.status !== "closed";
    }

    return true;
  });
  const countMap = {
    active: risks.filter((risk) => risk.status !== "closed").length,
    high: risks.filter((risk) => risk.level === "high").length,
    all: risks.length
  };

  return (
    <View className="page-shell">
      <PageHeader kicker="风险跟进" title="风险跟进" />

      <AppCard tone="accent">
        <SectionHeader title="状态筛选" extra={<Text className="count-badge">{visibleRisks.length} 条</Text>} />
        <View className="status-filter-grid">
          {riskFilters.map((filter) => (
            <AppButton
              className={filter.key === activeFilter ? "status-filter-card is-active" : "status-filter-card"}
              key={filter.key}
              variant="soft"
              onClick={() => setActiveFilter(filter.key)}
            >
              <View className="status-filter-content">
                <Text className="status-filter-title">{filter.title}</Text>
                <Text className="status-filter-count">{countMap[filter.key]}</Text>
              </View>
            </AppButton>
          ))}
        </View>
      </AppCard>

      {loading ? <Text className="inline-note">正在同步风险信息...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        {visibleRisks.length > 0 ? (
          visibleRisks.map((risk) => {
            const actions = getRiskActions(risk.status);

            return (
              <AppCard className="teacher-risk-card" key={risk.id}>
                <View className="appointment-card-head">
                  <View className="appointment-card-copy">
                    <Text className="appointment-card-title">{riskLevelLabelMap[risk.level] ?? risk.level}</Text>
                    <Text className="appointment-card-subtitle">{formatDateTime(risk.createdAt)}</Text>
                  </View>
                  <Text className={`risk-status-pill risk-status-${risk.status}`}>
                    {riskStatusLabelMap[risk.status] ?? risk.status}
                  </Text>
                </View>
                <Text className="appointment-remark">{risk.triggerReason}</Text>
                {risk.nextFollowUpAt ? (
                  <Text className="inline-note">下次跟进 {formatDateTime(risk.nextFollowUpAt)}</Text>
                ) : null}
                {actions.length > 0 ? (
                  <View className="appointment-card-actions">
                    {actions.map((action) => (
                      <AppButton
                        block={false}
                        key={action.status}
                        loading={updatingId === risk.id}
                        variant={action.variant}
                        onClick={() => handleUpdateRisk(risk, action.status)}
                      >
                        {action.label}
                      </AppButton>
                    ))}
                  </View>
                ) : null}
              </AppCard>
            );
          })
        ) : (
          <EmptyState title="暂无风险跟进" />
        )}
      </View>
    </View>
  );
}
