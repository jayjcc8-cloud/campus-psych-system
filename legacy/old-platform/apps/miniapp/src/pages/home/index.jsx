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
import { getAuthRole } from "../../lib/auth-session";
import {
  formatAppointmentHint,
  formatDateTime,
  formatIssueType
} from "../../lib/display";
import {
  appointmentsFixture,
  counselorsFixture,
  studentBootstrapFixture
} from "../../lib/fixtures";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import {
  getRegistrationSummary,
  getSetupRoute
} from "../../lib/student-setup";
import { openCounselorsTab, openTeacherAppointmentsTab, refreshRoleTabBar } from "../../lib/tabbar";
import {
  getTeacherAppointments,
  getTeacherWorkspace,
  updateTeacherAppointmentStatus
} from "../../lib/teacher-api";
import {
  formatTeacherStudentLine,
  getTeacherAppointmentActions,
  pickCurrentTeacherAppointment
} from "../../lib/teacher-workspace";
import StatusTag from "../../components/status-tag";

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
  const [authRole, setAuthRole] = useState(getAuthRole());
  const [teacherWorkspace, setTeacherWorkspace] = useState({ counselor: null, schedules: [] });
  const [teacherAppointments, setTeacherAppointments] = useState([]);
  const [teacherUpdatingId, setTeacherUpdatingId] = useState("");

  const loadHomeData = () => {
    const currentRole = getAuthRole();
    setAuthRole(currentRole);

    if (currentRole === "teacher") {
      setLoadError("");
      setLoading(true);
      Promise.all([getTeacherWorkspace(), getTeacherAppointments()])
        .then(([workspaceResult, appointmentsResult]) => {
          setTeacherWorkspace(workspaceResult);
          setTeacherAppointments(appointmentsResult);
        })
        .catch((error) => {
          setLoadError(error instanceof Error ? error.message : "预约处理信息暂时没有完全刷新。");
        })
        .finally(() => setLoading(false));
      return;
    }

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
    refreshRoleTabBar();
    loadHomeData();
    setAuthRole(getAuthRole());

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
  const isTeacher = authRole === "teacher";
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
      Taro.navigateTo({ url: getSetupRoute("binding") });
      return;
    }

    openCounselors();
  };

  const handleTeacherUpdateStatus = async (appointment, nextStatus) => {
    if (nextStatus === "cancelled" || nextStatus === "completed") {
      const result = await Taro.showModal({
        title: nextStatus === "cancelled" ? "确认取消预约" : "确认标记完成",
        content:
          nextStatus === "cancelled"
            ? "取消后，学生端会同步显示为已取消。"
            : "标记完成后，这条预约会从今日处理里移出。"
      });

      if (!result.confirm) {
        return;
      }
    }

    setTeacherUpdatingId(appointment.id);
    setLoadError("");

    try {
      await updateTeacherAppointmentStatus(appointment.id, nextStatus);
      Taro.showToast({ title: "已更新状态", icon: "success" });
      loadHomeData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "状态更新失败。";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setTeacherUpdatingId("");
    }
  };

  useEffect(() => {
    if (isTeacher || loading || entryPrompted || !registrationSummary.blocking) {
      return;
    }

    setEntryPrompted(true);

    Taro.showModal({
      title: "先完成注册登录",
      content: "完成注册后即可预约和查看记录。",
      confirmText: "去注册",
      cancelText: "稍后"
    }).then((result) => {
      if (result.confirm) {
        Taro.navigateTo({ url: getSetupRoute("binding") });
      }
    });
  }, [entryPrompted, isTeacher, loading, registrationSummary.blocking]);

  const teacherCurrentAppointment = pickCurrentTeacherAppointment(teacherAppointments);
  const teacherPendingCount = teacherAppointments.filter((item) => item.status === "pending").length;
  const teacherConfirmedCount = teacherAppointments.filter((item) => item.status === "confirmed").length;
  const teacherActiveSchedules = teacherWorkspace.schedules
    .filter((slot) => slot.available)
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  const teacherCurrentActions = teacherCurrentAppointment
    ? getTeacherAppointmentActions(teacherCurrentAppointment.status)
    : [];

  return (
    <View className="page-shell">
      <PageHeader
        kicker="首页"
        title={isTeacher ? "工作台" : registrationSummary.blocking ? "先完成注册登录" : "今天想从哪里开始"}
        subtitle={
          isTeacher
            ? ""
            : registrationSummary.blocking
            ? "补齐身份信息后即可使用预约。"
            : ""
        }
      />

      {loading ? <Text className="inline-note">正在同步...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      {isTeacher ? (
        <View className="section-stack">
          <AppCard tone="accent" className="teacher-dash-hero">
            <View className="hero-copy-block">
              <Text className="hero-eyebrow">今日工作</Text>
              <Text className="hero-title">{teacherPendingCount > 0 ? "有预约需要确认" : "当前节奏稳定"}</Text>
              <Text className="hero-copy">
                {teacherPendingCount > 0
                  ? "优先处理待确认预约，再查看今日时段与跟进事项。"
                  : "可以维护排期、更新展示信息，或查看近期预约。"}
              </Text>
            </View>
            <SectionHeader
              title={teacherCurrentAppointment?.status === "pending" ? "待确认预约" : "当前预约提醒"}
              extra={<Text className="count-badge">{teacherPendingCount} 条待确认</Text>}
            />
            {teacherCurrentAppointment ? (
              <View className="teacher-current-card">
                <View className="appointment-card-head">
                  <View className="appointment-card-copy">
                    <Text className="card-kicker">{teacherCurrentAppointment.status === "pending" ? "需要确认" : "即将进行"}</Text>
                    <Text className="appointment-card-title">{formatDateTime(teacherCurrentAppointment.scheduleStartTime)}</Text>
                    <Text className="appointment-card-subtitle">{formatTeacherStudentLine(teacherCurrentAppointment)}</Text>
                  </View>
                  <StatusTag status={teacherCurrentAppointment.status} />
                </View>
                <View className="appointment-detail-grid">
                  <View className="appointment-detail-item">
                    <Text className="appointment-detail-label">问题类型</Text>
                    <Text className="appointment-detail-value">{formatIssueType(teacherCurrentAppointment.issueEntryType)}</Text>
                  </View>
                  <View className="appointment-detail-item">
                    <Text className="appointment-detail-label">状态说明</Text>
                    <Text className="appointment-detail-value">{formatAppointmentHint(teacherCurrentAppointment.status)}</Text>
                  </View>
                </View>
                {teacherCurrentAppointment.remark ? <Text className="appointment-remark">{teacherCurrentAppointment.remark}</Text> : null}
                {teacherCurrentActions.length > 0 ? (
                  <View className="appointment-card-actions">
                    {teacherCurrentActions.map((action) => (
                      <AppButton
                        block={false}
                        key={action.nextStatus}
                        variant={action.variant}
                        loading={teacherUpdatingId === teacherCurrentAppointment.id}
                        onClick={() => handleTeacherUpdateStatus(teacherCurrentAppointment, action.nextStatus)}
                      >
                        {action.label}
                      </AppButton>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <EmptyState title="暂无待处理预约" />
            )}
          </AppCard>

          <AppCard className="teacher-overview-card">
            <SectionHeader title="今日概览" />
            <View className="teacher-metric-grid">
              <View className="teacher-metric-card">
                <Text className="teacher-metric-value">{teacherPendingCount}</Text>
                <Text className="teacher-metric-label">待确认</Text>
              </View>
              <View className="teacher-metric-card">
                <Text className="teacher-metric-value">{teacherConfirmedCount}</Text>
                <Text className="teacher-metric-label">已确认</Text>
              </View>
              <View className="teacher-metric-card">
                <Text className="teacher-metric-value">{teacherActiveSchedules.length}</Text>
                <Text className="teacher-metric-label">开放时段</Text>
              </View>
            </View>
            {teacherActiveSchedules[0] ? (
              <View className="teacher-next-schedule">
                <View>
                  <Text className="card-kicker">下一时段</Text>
                  <Text className="slot-time">{formatDateTime(teacherActiveSchedules[0].startTime)}</Text>
                  <Text className="slot-subtitle">至 {formatDateTime(teacherActiveSchedules[0].endTime)}</Text>
                </View>
                <AppButton
                  block={false}
                  variant="soft"
                  onClick={() => Taro.navigateTo({ url: "/pages/teacher/schedules/index" })}
                >
                  管理
                </AppButton>
              </View>
            ) : (
              <EmptyState title="暂无开放排期" />
            )}
          </AppCard>

          <View className="teacher-entry-grid">
            <AppButton
              className="teacher-entry-card"
              variant="soft"
              onClick={() => Taro.navigateTo({ url: "/pages/teacher/schedules/index" })}
            >
              <View className="teacher-entry-content">
                <Text className="teacher-entry-icon">排</Text>
                <Text className="teacher-entry-title">排期管理</Text>
                <Text className="teacher-entry-desc">可约时间</Text>
              </View>
            </AppButton>
            <AppButton
              className="teacher-entry-card"
              variant="soft"
              onClick={openTeacherAppointmentsTab}
            >
              <View className="teacher-entry-content">
                <Text className="teacher-entry-icon">约</Text>
                <Text className="teacher-entry-title">预约管理</Text>
                <Text className="teacher-entry-desc">确认与状态</Text>
              </View>
            </AppButton>
            <AppButton
              className="teacher-entry-card"
              variant="soft"
              onClick={() => Taro.navigateTo({ url: "/pages/teacher/records/index" })}
            >
              <View className="teacher-entry-content">
                <Text className="teacher-entry-icon">记</Text>
                <Text className="teacher-entry-title">咨询记录</Text>
                <Text className="teacher-entry-desc">摘要与跟进</Text>
              </View>
            </AppButton>
            <AppButton
              className="teacher-entry-card"
              variant="soft"
              onClick={() => Taro.navigateTo({ url: "/pages/teacher/risks/index" })}
            >
              <View className="teacher-entry-content">
                <Text className="teacher-entry-icon">跟</Text>
                <Text className="teacher-entry-title">风险跟进</Text>
                <Text className="teacher-entry-desc">重点关注</Text>
              </View>
            </AppButton>
            <AppButton
              className="teacher-entry-card"
              variant="soft"
              onClick={() => Taro.navigateTo({ url: "/pages/teacher/profile/index" })}
            >
              <View className="teacher-entry-content">
                <Text className="teacher-entry-icon">设</Text>
                <Text className="teacher-entry-title">展示设置</Text>
                <Text className="teacher-entry-desc">学生端信息</Text>
              </View>
            </AppButton>
          </View>
        </View>
      ) : registrationSummary.blocking ? (
        <View className="section-stack">
          <AppCard tone="accent" className="home-registration-card home-welcome-card">
            <View className="hero-copy-block">
              <Text className="hero-eyebrow">校园心理支持</Text>
              <Text className="hero-title">先完成身份确认</Text>
              <Text className="hero-copy">只需补齐必要信息，之后就能预约、查看状态和管理记录。</Text>
            </View>
            <SectionHeader
              title="先完成注册登录"
              extra={<Text className="count-badge">首次必做</Text>}
            />
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
                Taro.navigateTo({ url: getSetupRoute("binding") });
              }}
            >
              去注册登录
            </AppButton>
            <AppButton block={false} variant="ghost" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
              紧急求助
            </AppButton>
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
          <AppCard tone="accent" className="home-welcome-card">
            <View className="hero-copy-block">
              <Text className="hero-eyebrow">校园心理支持</Text>
              <Text className="hero-title">今天想从哪里开始？</Text>
              <Text className="hero-copy">选择一个更接近当前状态的入口，系统会帮你带到合适的预约方向。</Text>
            </View>
            <SectionHeader
              title="最近更想聊什么"
              extra={
                <AppButton block={false} variant="ghost" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
                  紧急求助
                </AppButton>
              }
            />
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
                <EmptyState title="暂无进行中预约" />
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
