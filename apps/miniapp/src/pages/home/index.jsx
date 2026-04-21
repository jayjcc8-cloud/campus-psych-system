import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import AppointmentCard from "../../components/appointment-card";
import EmotionEntryCard from "../../components/emotion-entry-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getCounselors, getMyAppointments, getStudentBootstrap } from "../../lib/api";
import {
  appointmentsFixture,
  counselorsFixture,
  studentBootstrapFixture
} from "../../lib/fixtures";
import { savePendingIntent } from "../../lib/navigation-intent";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import {
  getRegistrationSummary,
  getSetupRoute
} from "../../lib/student-setup";
import { openCounselorsTab } from "../../lib/tabbar";

const entries = [
  { label: "最近压力很大", hint: "从学业、节奏或近期压力开始梳理。", issueType: "academic_pressure" },
  { label: "睡眠状态不好", hint: "先聊聊作息、疲惫感和持续紧绷。", issueType: "sleep" },
  { label: "情感上有些困扰", hint: "关系里的委屈、误解或失落都可以被看见。", issueType: "relationship" },
  { label: "想找人聊聊", hint: "不必先定义问题，先给自己一个表达出口。", issueType: "emotion" }
];

const activeStatuses = new Set(["pending", "confirmed"]);

export default function HomePage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [entryPrompted, setEntryPrompted] = useState(false);

  const loadHomeData = () => {
    setLoading(true);
    setLoadError("");

    Promise.allSettled([getMyAppointments(), getStudentBootstrap(), getCounselors()])
      .then(([appointmentsResult, bootstrapResult, counselorsResult]) => {
        if (appointmentsResult.status === "fulfilled") {
          setAppointments(appointmentsResult.value);
        }

        if (bootstrapResult.status === "fulfilled") {
          setBootstrap(bootstrapResult.value);
        }

        if (counselorsResult.status === "fulfilled") {
          setCounselors(counselorsResult.value);
        }

        if (
          appointmentsResult.status === "rejected" &&
          bootstrapResult.status === "rejected" &&
          counselorsResult.status === "rejected"
        ) {
          setLoadError("首页信息加载稍慢，下面的入口仍然可以正常使用。");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  useDidShow(() => {
    loadHomeData();

    const feedback = consumeRegistrationFeedback();
    if (feedback?.message) {
      Taro.showToast({ title: feedback.message, icon: "success" });
    }
  });

  const openCounselors = (issueType) => {
    openCounselorsTab(issueType);
  };

  const latestAppointment = appointments
    .filter((appointment) => activeStatuses.has(appointment.status))
    .sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt).getTime();

    return rightTime - leftTime;
    })[0];
  const registrationSummary = getRegistrationSummary(bootstrap);
  const registrationSteps = [
    {
      key: "profile",
      label: "姓名",
      completed: registrationSummary.displayNameCompleted
    },
    {
      key: "college",
      label: "学院",
      completed: registrationSummary.collegeCompleted
    },
    {
      key: "schoolId",
      label: "学号",
      completed: registrationSummary.schoolIdCompleted
    }
  ];

  const openPrimaryBookingEntry = () => {
    if (registrationSummary.blocking) {
      savePendingIntent("/pages/counselors/index");
      Taro.navigateTo({ url: getSetupRoute("binding") });
      return;
    }

    openCounselors();
  };

  useEffect(() => {
    if (loading || entryPrompted || !registrationSummary.blocking) {
      return;
    }

    setEntryPrompted(true);

    Taro.showModal({
      title: "先完成注册登录",
      content: "首次进入小程序，先完成注册登录后就能正常使用预约、查看记录等功能。",
      confirmText: "去注册",
      cancelText: "稍后"
    }).then((result) => {
      if (result.confirm) {
        Taro.navigateTo({ url: getSetupRoute("binding") });
      }
    });
  }, [entryPrompted, loading, registrationSummary.blocking]);

  return (
    <View className="page-shell">
      <PageHeader
        kicker="首页"
        title={registrationSummary.blocking ? "先完成注册登录，再开始使用" : "你好，今天可以从这里开始"}
        subtitle={
          registrationSummary.blocking
            ? "第一次进入先补齐必要信息，后面预约、查看记录和个人中心都会更顺。"
            : "先从最想处理的困扰开始，预约状态会清楚反馈。"
        }
      />

      {loading ? <Text className="inline-note">正在整理你的预约状态与服务公告...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      {registrationSummary.blocking ? (
        <View className="section-stack">
          <AppCard tone="accent" className="home-registration-card">
            <SectionHeader
              title="先完成注册登录"
              extra={<Text className="count-badge">首次必做</Text>}
            />
            <Text className="section-copy">完成姓名、学院和学号登记后，就可以正常使用预约、记录和个人中心功能。</Text>
            <View className="home-registration-step-row">
              {registrationSteps.map((step) => (
                <View
                  key={step.key}
                  className={step.completed ? "home-registration-step is-complete" : "home-registration-step"}
                >
                  <Text className="home-registration-step-title">{step.label}</Text>
                  <Text className="home-registration-step-status">{step.completed ? "已完成" : "待填写"}</Text>
                </View>
              ))}
            </View>
            <AppButton
              className="home-primary-action"
              onClick={() => {
                savePendingIntent("/pages/counselors/index");
                Taro.navigateTo({ url: getSetupRoute("binding") });
              }}
            >
              去注册登录
            </AppButton>
          </AppCard>

          <AppCard>
            <SectionHeader
              title="完成后你可以做什么"
              extra={
                <AppButton block={false} variant="ghost" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
                  紧急求助
                </AppButton>
              }
            />
            <View className="home-benefit-list">
              <View className="home-benefit-item">
                <Text className="home-benefit-title">预约校园心理支持</Text>
                <Text className="section-copy">完成注册后，可以正常进入咨询老师列表并提交预约。</Text>
              </View>
              <View className="home-benefit-item">
                <Text className="home-benefit-title">查看预约和状态变化</Text>
                <Text className="section-copy">后续的待确认、已确认、已取消状态都会同步更新。</Text>
              </View>
              <View className="home-benefit-item">
                <Text className="home-benefit-title">在个人中心统一管理</Text>
                <Text className="section-copy">说明、紧急求助和个人资料都会集中在“我的”里。</Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader title="服务说明" />
            <View className="service-note-list">
              <View className="service-note-item">
                <Text className="service-note-label">服务公告</Text>
                <Text className="section-copy">{bootstrap.publicConfig.announcement}</Text>
              </View>
              <View className="service-note-item">
                <Text className="service-note-label">预约规则</Text>
                <Text className="section-copy">{bootstrap.publicConfig.bookingPolicy}</Text>
              </View>
            </View>
          </AppCard>
        </View>
      ) : (
        <>
          <AppCard tone="accent">
            <SectionHeader
              title="最近更想聊什么"
              extra={
                <AppButton block={false} variant="ghost" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
                  紧急求助
                </AppButton>
              }
            />
            <Text className="hero-support-note">可以先从一个最接近当下感受的入口开始，不需要一次说清全部问题。</Text>
            <View className="mood-grid">
              {entries.map((entry) => (
                <EmotionEntryCard key={entry.label} title={entry.label} description={entry.hint} onClick={() => openCounselors(entry.issueType)} />
              ))}
            </View>
            <AppButton className="home-primary-action" onClick={openPrimaryBookingEntry}>
              开始预约
            </AppButton>
          </AppCard>

          <View className="section-stack">
            <AppCard>
              <SectionHeader title="最近预约" />
              {latestAppointment ? (
                <AppointmentCard appointment={latestAppointment} counselors={counselors} />
              ) : (
                <EmptyState title="当前没有进行中的预约" description="准备好时，可以直接开始预约。" />
              )}
            </AppCard>

            <AppCard>
              <SectionHeader title="服务说明" />
              <View className="service-note-list">
                <View className="service-note-item">
                  <Text className="service-note-label">服务公告</Text>
                  <Text className="section-copy">{bootstrap.publicConfig.announcement}</Text>
                </View>
                <View className="service-note-item">
                  <Text className="service-note-label">预约规则</Text>
                  <Text className="section-copy">{bootstrap.publicConfig.bookingPolicy}</Text>
                </View>
              </View>
            </AppCard>
          </View>
        </>
      )}
    </View>
  );
}
