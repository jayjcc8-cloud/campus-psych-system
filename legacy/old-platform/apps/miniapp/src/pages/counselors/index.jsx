import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import CounselorCard from "../../components/counselor-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import { getCounselors, getStudentBootstrap } from "../../lib/api";
import { isTeacherSession } from "../../lib/auth-session";
import { formatCounselorDisplayName, formatIssueType } from "../../lib/display";
import { counselorsFixture, studentBootstrapFixture } from "../../lib/fixtures";
import { clearPendingIntent } from "../../lib/navigation-intent";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import { getRegistrationSummary } from "../../lib/student-setup";
import { consumePreferredIssueType, openTeacherAppointmentsTab, refreshRoleTabBar } from "../../lib/tabbar";

const counselorFilters = [
  { value: "", label: "全部" },
  { value: "academic_pressure", label: "学业" },
  { value: "sleep", label: "睡眠" },
  { value: "relationship", label: "关系" },
  { value: "emotion", label: "情绪" }
];

export default function CounselorsPage() {
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [keyword, setKeyword] = useState("");
  const [preferredIssueType, setPreferredIssueType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadCounselorPage = () => {
    if (isTeacherSession()) {
      setLoading(false);
      openTeacherAppointmentsTab();
      return;
    }

    setLoading(true);
    setLoadError("");

    Promise.allSettled([getCounselors(), getStudentBootstrap()])
      .then(([counselorsResult, bootstrapResult]) => {
        if (counselorsResult.status === "fulfilled") {
          setCounselors(counselorsResult.value);
        } else {
          setLoadError("咨询师列表暂时没有完全刷新，已展示本地可用信息。");
        }

        if (bootstrapResult.status === "fulfilled") {
          setBootstrap(bootstrapResult.value);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCounselorPage();
  }, []);

  useDidShow(() => {
    refreshRoleTabBar();

    if (isTeacherSession()) {
      openTeacherAppointmentsTab();
      return;
    }

    const storedIssueType = consumePreferredIssueType();
    setPreferredIssueType(storedIssueType);
    loadCounselorPage();

    const feedback = consumeRegistrationFeedback();
    if (feedback?.message) {
      Taro.showToast({ title: feedback.message, icon: "success" });
    }
  });

  const openBooking = (counselorId) => {
    const issueParam = preferredIssueType ? `&issueType=${preferredIssueType}` : "";
    const targetUrl = `/pages/appointment/index?counselorId=${counselorId}${issueParam}`;

    if (getRegistrationSummary(bootstrap).blocking) {
      clearPendingIntent();
      Taro.navigateTo({ url: "/pages/binding/index" });
      return;
    }

    Taro.navigateTo({ url: targetUrl });
  };

  const filteredCounselors = counselors.filter((counselor) => {
    const query = keyword.trim().toLowerCase();
    const matchesIssueType = preferredIssueType
      ? counselor.specialty.includes(preferredIssueType)
      : true;

    if (!matchesIssueType) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      counselor.displayName.toLowerCase().includes(query) ||
      formatCounselorDisplayName(counselor.displayName).toLowerCase().includes(query) ||
      counselor.specialty.some((item) => item.toLowerCase().includes(query)) ||
      counselor.specialty.some((item) => formatIssueType(item).toLowerCase().includes(query))
    );
  });
  const registrationSummary = getRegistrationSummary(bootstrap);

  if (isTeacherSession()) {
    return (
      <View className="page-shell">
        <PageHeader
          kicker="预约管理"
          title="正在进入预约管理"
          subtitle="教师身份不会展示学生端咨询师列表。"
        />
        <Text className="inline-note">正在打开教师端预约管理...</Text>
      </View>
    );
  }

  return (
    <View className="page-shell">
      <PageHeader
        kicker="咨询师"
        title="咨询老师"
      />

      <AppCard className="search-panel-card counselor-search-hero">
        <View className="hero-copy-block">
          <Text className="hero-eyebrow">预约入口</Text>
          <Text className="hero-title">找到适合的咨询老师</Text>
          <Text className="hero-copy">可以按姓名、擅长方向或当前困扰快速筛选。</Text>
        </View>
        <View className="search-panel-head">
          {preferredIssueType ? (
            <AppButton block={false} variant="ghost" onClick={() => setPreferredIssueType("")}>
              {formatIssueType(preferredIssueType)} · 清除
            </AppButton>
          ) : (
            <Text className="inline-note">按姓名或擅长方向筛选</Text>
          )}
          <Text className="count-badge">{loading ? "同步中" : `${filteredCounselors.length} 位咨询师`}</Text>
        </View>
        <View className="search-box">
          <Input
            className="search-input"
            placeholder="搜索姓名或擅长领域"
            value={keyword}
            onInput={(event) => setKeyword(event.detail.value)}
          />
        </View>
        <View className="quick-filter-row">
          {counselorFilters.map((filter) => (
            <AppButton
              block={false}
              className={filter.value === preferredIssueType ? "quick-filter-chip is-active" : "quick-filter-chip"}
              key={filter.value || "all"}
              variant="soft"
              onClick={() => setPreferredIssueType(filter.value)}
            >
              {filter.label}
            </AppButton>
          ))}
        </View>
      </AppCard>

      {registrationSummary.blocking ? (
        <AppCard>
          <Text className="section-title">预约前请先完成注册登录</Text>
          <AppButton
            className="bootstrap-guide-button"
            variant="soft"
            onClick={() => {
              clearPendingIntent();
              Taro.navigateTo({ url: "/pages/binding/index" });
            }}
          >
            <View className="bootstrap-guide-content">
              <Text className="bootstrap-guide-title">前往注册登录</Text>
              <Text className="bootstrap-guide-arrow">完成后再预约</Text>
            </View>
          </AppButton>
        </AppCard>
      ) : null}

      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="list-stack">
        {filteredCounselors.map((counselor) => (
          <CounselorCard
            counselor={counselor}
            key={counselor.id}
            onBook={() => openBooking(counselor.id)}
            actionLabel={registrationSummary.blocking ? "先去注册" : "预约咨询"}
          />
        ))}
        {!loading && filteredCounselors.length === 0 ? (
          <EmptyState title="没有找到合适结果" />
        ) : null}
      </View>
    </View>
  );
}
