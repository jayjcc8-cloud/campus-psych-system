import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import AppointmentCard from "../../components/appointment-card";
import EmotionEntryCard from "../../components/emotion-entry-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getCounselors, getMyAppointments, getPublicConfig } from "../../lib/api";
import { appointmentsFixture, counselorsFixture, publicConfigFixture } from "../../lib/fixtures";
import { openCounselorsTab, switchStudentTab } from "../../lib/tabbar";

const entries = [
  { label: "最近压力很大", hint: "从学业、节奏或近期压力开始梳理。", issueType: "academic_pressure" },
  { label: "睡眠状态不好", hint: "先聊聊作息、疲惫感和持续紧绷。", issueType: "sleep" },
  { label: "情感上有些困扰", hint: "关系里的委屈、误解或失落都可以被看见。", issueType: "relationship" },
  { label: "想找人聊聊", hint: "不必先定义问题，先给自己一个表达出口。", issueType: "emotion" }
];

export default function HomePage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [config, setConfig] = useState(publicConfigFixture);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");

    Promise.allSettled([getMyAppointments(), getPublicConfig(), getCounselors()])
      .then(([appointmentsResult, configResult, counselorsResult]) => {
        if (appointmentsResult.status === "fulfilled") {
          setAppointments(appointmentsResult.value);
        }

        if (configResult.status === "fulfilled") {
          setConfig(configResult.value);
        }

        if (counselorsResult.status === "fulfilled") {
          setCounselors(counselorsResult.value);
        }

        if (
          appointmentsResult.status === "rejected" &&
          configResult.status === "rejected" &&
          counselorsResult.status === "rejected"
        ) {
          setLoadError("首页信息加载稍慢，下面的入口仍然可以正常使用。");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const openCounselors = (issueType) => {
    openCounselorsTab(issueType);
  };

  const latestAppointment = appointments[0];

  return (
    <View className="page-shell">
      <PageHeader
        kicker="首页"
        title="你好，今天想从哪里开始？"
        subtitle="这是一个面向校园支持场景的预约入口。页面会尽量少一点负担，多一点清晰和私密感。"
      />

      {loading ? <Text className="inline-note">正在整理你的预约状态与服务公告...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <AppCard tone="accent">
        <SectionHeader title="从此刻的感受开始" description="不需要先解释完整原因，先选一个更接近你当前状态的入口就好。" />
        <View className="mood-grid">
          {entries.map((entry) => (
            <EmotionEntryCard key={entry.label} title={entry.label} description={entry.hint} onClick={() => openCounselors(entry.issueType)} />
          ))}
        </View>
      </AppCard>

      <View className="section-stack">
        <AppCard>
          <SectionHeader title="快捷服务" description="保留最常用的几个入口，不把首页做成资讯页，也不打断你当前的节奏。" />
          <View className="shortcut-grid">
            <AppButton onClick={() => openCounselors()}>预约心理咨询</AppButton>
            <AppButton variant="secondary" onClick={() => switchStudentTab("/pages/counselors/index")}>
              咨询师列表
            </AppButton>
            <AppButton variant="secondary" onClick={() => switchStudentTab("/pages/my/index")}>
              我的预约
            </AppButton>
            <AppButton variant="ghost" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
              紧急求助
            </AppButton>
            <AppButton variant="ghost" onClick={() => switchStudentTab("/pages/profile/index")}>
              我的
            </AppButton>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="最近预约" description="如果你已经提交过预约，可以从这里快速确认当前状态。" />
          {latestAppointment ? (
            <AppointmentCard appointment={latestAppointment} counselors={counselors} />
          ) : (
            <EmptyState title="还没有预约记录" description="准备好时，可以从上方入口开始；系统会在提交后明确告诉你当前状态。" />
          )}
        </AppCard>

        <AppCard>
          <SectionHeader title="咨询须知" description="先把和预约直接相关的信息说清楚，减少来回确认。" />
          <View className="notice-stack">
            <Text className="section-copy">{config.announcement}</Text>
            <Text className="section-copy">{config.bookingPolicy}</Text>
            <Text className="inline-note">预约信息仅本人可见，学生端默认不展示额外敏感字段。</Text>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
