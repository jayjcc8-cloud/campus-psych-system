import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import CounselorCard from "../../components/counselor-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import { getCounselors, getStudentBootstrap } from "../../lib/api";
import { formatIssueType } from "../../lib/display";
import { counselorsFixture, studentBootstrapFixture } from "../../lib/fixtures";
import { savePendingIntent } from "../../lib/navigation-intent";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import { getRegistrationSummary } from "../../lib/student-setup";
import { consumePreferredIssueType } from "../../lib/tabbar";

export default function CounselorsPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [keyword, setKeyword] = useState("");
  const [preferredIssueType, setPreferredIssueType] = useState(router.params.issueType ?? "");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    getCounselors()
      .then(setCounselors)
      .catch(() => {
        setLoadError("咨询师列表暂时没有完全刷新，已展示本地可用信息。");
      })
      .finally(() => {
        setLoading(false);
      });

    getStudentBootstrap()
      .then(setBootstrap)
      .catch(() => {
        return;
      });
  }, []);

  useDidShow(() => {
    const storedIssueType = consumePreferredIssueType();
    setPreferredIssueType(storedIssueType || router.params.issueType || "");

    const feedback = consumeRegistrationFeedback();
    if (feedback?.message) {
      Taro.showToast({ title: feedback.message, icon: "success" });
    }
  });

  const openBooking = (counselorId) => {
    const issueParam = preferredIssueType ? `&issueType=${preferredIssueType}` : "";
    const targetUrl = `/pages/appointment/index?counselorId=${counselorId}${issueParam}`;

    if (getRegistrationSummary(bootstrap).blocking) {
      savePendingIntent(targetUrl);
      Taro.navigateTo({ url: "/pages/binding/index" });
      return;
    }

    Taro.navigateTo({ url: targetUrl });
  };

  const filteredCounselors = counselors.filter((counselor) => {
    const query = keyword.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      counselor.displayName.toLowerCase().includes(query) ||
      counselor.specialty.some((item) => item.toLowerCase().includes(query))
    );
  });
  const registrationSummary = getRegistrationSummary(bootstrap);

  return (
    <View className="page-shell">
      <PageHeader
        kicker="咨询师"
        title="咨询老师"
        subtitle="按当前困扰和可预约时间，选择合适的咨询老师。"
      />

      <AppCard className="search-panel-card">
        <View className="search-panel-head">
          {preferredIssueType ? <Text className="inline-note">推荐主题：{formatIssueType(preferredIssueType)}</Text> : <Text className="inline-note">支持按姓名或擅长方向筛选。</Text>}
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
      </AppCard>

      {registrationSummary.blocking ? (
        <AppCard>
          <Text className="section-title">预约前请先完成注册登录</Text>
          <Text className="section-copy">你可以先浏览老师信息；真正开始预约前，先补齐姓名、学院和学号会更顺畅。</Text>
          <AppButton
            className="bootstrap-guide-button"
            variant="soft"
            onClick={() => {
              savePendingIntent("/pages/counselors/index");
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
          <EmptyState title="没有找到合适结果" description="换个关键词，或者直接浏览当前老师列表。" />
        ) : null}
      </View>
    </View>
  );
}
