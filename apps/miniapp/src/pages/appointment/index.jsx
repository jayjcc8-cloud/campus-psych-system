import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import {
  createAppointment,
  getCounselorDetail,
  getCounselors,
  getStudentBootstrap
} from "../../lib/api";
import {
  formatAvailabilityHint,
  formatCounselorDisplayName,
  formatCounselorSummary,
  formatDateTime,
  formatIssueType
} from "../../lib/display";
import {
  counselorsFixture,
  scheduleFixture,
  studentBootstrapFixture
} from "../../lib/fixtures";
import { saveAppointmentFocus } from "../../lib/appointment-focus";
import { clearPendingIntent } from "../../lib/navigation-intent";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import {
  getRegistrationSummary,
  getSetupRoute
} from "../../lib/student-setup";
import { switchStudentTab } from "../../lib/tabbar";

const issueOptions = [
  { value: "academic_pressure", label: "学业压力" },
  { value: "sleep", label: "睡眠状态" },
  { value: "relationship", label: "关系困扰" },
  { value: "emotion", label: "情绪波动" },
  { value: "career", label: "发展方向" },
  { value: "other", label: "其他" }
];

export default function AppointmentPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [selectedCounselorId, setSelectedCounselorId] = useState(router.params.counselorId ?? counselorsFixture[0]?.id ?? "");
  const [schedules, setSchedules] = useState(scheduleFixture);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [issueType, setIssueType] = useState(router.params.issueType ?? "academic_pressure");
  const [remark, setRemark] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [datePreset, setDatePreset] = useState("week");
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);

  const loadSchedulesForCounselor = async (counselorId, { staleSelectionMessage = "" } = {}) => {
    if (!counselorId) {
      return;
    }

    setSlotLoading(true);

    try {
      const response = await getCounselorDetail(counselorId);
      const availableSchedules = response.schedules.filter((slot) => slot.available);

      setSchedules(availableSchedules);
      setSelectedScheduleId((current) =>
        current && availableSchedules.some((slot) => slot.id === current)
          ? current
          : availableSchedules[0]?.id ?? ""
      );
      setSlotError(staleSelectionMessage);
    } catch {
      const fallback = scheduleFixture.filter(
        (slot) => slot.counselorId === counselorId && slot.available
      );

      setSchedules(fallback);
      setSelectedScheduleId(fallback[0]?.id ?? "");
      setSlotError("可预约时段暂时没有完全刷新，已展示本地可用时间。");
    } finally {
      setSlotLoading(false);
    }
  };

  const formatSubmitError = (submitError) => {
    const message = submitError instanceof Error ? submitError.message : "";

    if (message.includes("already been booked")) {
      return "这个时间段刚刚被约走了，我们已经为你刷新了最新可选时间。";
    }

    if (message.includes("is unavailable")) {
      return "这个时间段当前不可用，我们已经为你刷新了最新可选时间。";
    }

    if (message.includes("active booking limit")) {
      return "你当前已有 2 条进行中的预约，请先等待确认或完成后再继续预约。";
    }

    return message || "预约提交失败，请稍后再试。";
  };

  useEffect(() => {
    getCounselors()
      .then((response) => {
        setCounselors(response);
        if (!selectedCounselorId && response[0]) {
          setSelectedCounselorId(response[0].id);
        }
      })
      .catch(() => {
        return;
      });

    getStudentBootstrap()
      .then(setBootstrap)
      .catch(() => {
        return;
      });
  }, []);

  useDidShow(() => {
    const queryCounselorId = router.params.counselorId;
    const queryIssueType = router.params.issueType;

    if (queryCounselorId) {
      setSelectedCounselorId(queryCounselorId);
    }

    if (queryIssueType) {
      setIssueType(queryIssueType);
    }

    getStudentBootstrap()
      .then(setBootstrap)
      .catch(() => {
        return;
      });

    const feedback = consumeRegistrationFeedback();
    if (feedback?.message) {
      Taro.showToast({ title: feedback.message, icon: "success" });
    }
  });

  useEffect(() => {
    if (!selectedCounselorId) {
      return;
    }

    setError("");
    setSlotError("");
    loadSchedulesForCounselor(selectedCounselorId);
  }, [selectedCounselorId]);

  const selectedCounselor =
    counselors.find((counselor) => counselor.id === selectedCounselorId) ?? counselors[0] ?? null;

  const visibleSchedules = schedules.filter((slot) => {
    const currentDate = new Date(slot.startTime);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const isSameDay =
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getDate() === now.getDate();
    const isTomorrow =
      currentDate.getFullYear() === tomorrow.getFullYear() &&
      currentDate.getMonth() === tomorrow.getMonth() &&
      currentDate.getDate() === tomorrow.getDate();

    if (datePreset === "today") {
      return isSameDay;
    }

    if (datePreset === "tomorrow") {
      return isTomorrow;
    }

    return true;
  });

  useEffect(() => {
    if (!visibleSchedules.some((slot) => slot.id === selectedScheduleId)) {
      setSelectedScheduleId(visibleSchedules[0]?.id ?? "");
    }
  }, [datePreset, selectedScheduleId, visibleSchedules]);

  const selectedSchedule = visibleSchedules.find((slot) => slot.id === selectedScheduleId) ?? null;
  const registrationSummary = getRegistrationSummary(bootstrap);

  const continueBindingBeforeBooking = async () => {
    if (!registrationSummary.blocking) {
      return false;
    }

    const modalResult = await Taro.showModal({
      title: "请先完成注册登录",
      content: "提交预约前，请先完成姓名、学院和学号登记。注册完成后就能正常使用预约功能。",
      confirmText: "去注册",
      cancelText: "稍后再说"
    });

    if (modalResult.confirm) {
      clearPendingIntent();
      Taro.navigateTo({ url: getSetupRoute("binding") });
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedCounselorId || !selectedScheduleId) {
      setError("请先选择咨询老师和可预约时段。");
      return;
    }

    if (registrationSummary.blocking) {
      setError("提交前请先完成注册登录。");
      await continueBindingBeforeBooking();
      return;
    }

    const confirmResult = await Taro.showModal({
      title: "确认预约",
      content: [
        `咨询老师：${selectedCounselor ? formatCounselorDisplayName(selectedCounselor.displayName) : "未选择"}`,
        `问题类型：${formatIssueType(issueType)}`,
        `开始时间：${selectedSchedule ? formatDateTime(selectedSchedule.startTime) : "未选择"}`,
        `结束时间：${selectedSchedule ? formatDateTime(selectedSchedule.endTime) : "未选择"}`
      ].join("\n")
    });

    if (!confirmResult.confirm) {
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const appointment = await createAppointment({
        counselorId: selectedCounselorId,
        scheduleSlotId: selectedScheduleId,
        issueEntryType: issueType,
        remark: remark.trim() || undefined
      });

      setNotice(`预约已提交，编号 ${appointment.id}。`);
      saveAppointmentFocus({
        status: "pending",
        appointmentId: appointment.id,
        message: "预约已提交，已为你切到待确认记录。"
      });
      Taro.showToast({
        title: "预约成功",
        icon: "success"
      });
      switchStudentTab("/pages/my/index");
    } catch (submitError) {
      const message = formatSubmitError(submitError);
      setError(message);

      if (
        message.includes("刷新了最新可选时间") &&
        selectedCounselorId
      ) {
        await loadSchedulesForCounselor(selectedCounselorId, {
          staleSelectionMessage: "可预约时段已更新，请重新确认一个时间段。"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="预约"
        title="预约咨询"
      />

      <AppCard tone="accent">
        <View className="progress-strip">
          <Text className="progress-chip is-active">信息</Text>
          <Text className={selectedSchedule ? "progress-chip is-active" : "progress-chip"}>时间</Text>
          <Text className={selectedSchedule ? "progress-chip is-active" : "progress-chip"}>提交</Text>
        </View>
      </AppCard>

      {selectedCounselor ? (
        <AppCard className="selected-counselor-card">
          <SectionHeader title="已选老师" />
          <Text className="selected-counselor-name">{formatCounselorDisplayName(selectedCounselor.displayName)}</Text>
          <Text className="section-copy">{formatCounselorSummary(selectedCounselor)}</Text>
          <Text className="inline-note">{formatAvailabilityHint(selectedCounselor.nextAvailableSlot)}</Text>
        </AppCard>
      ) : null}

      {registrationSummary.blocking ? (
        <AppCard>
          <SectionHeader
            title="提交前请先完成注册登录"
            extra={<Text className="count-badge">必做</Text>}
          />
          <AppButton className="home-primary-action" onClick={() => Taro.navigateTo({ url: getSetupRoute("binding") })}>
            去注册登录
          </AppButton>
        </AppCard>
      ) : null}

      <AppCard className="booking-card">
        <SectionHeader title="填写预约信息" />
        {notice ? <Text className="success-banner">{notice}</Text> : null}
        {error ? <Text className="error-banner">{error}</Text> : null}
        <View className="form-stack">
          <Text className="field-label">日期</Text>
          <View className="segmented-grid">
            <AppButton className={datePreset === "today" ? "selector-chip is-active" : "selector-chip"} variant="soft" onClick={() => setDatePreset("today")}>
              今天
            </AppButton>
            <AppButton className={datePreset === "tomorrow" ? "selector-chip is-active" : "selector-chip"} variant="soft" onClick={() => setDatePreset("tomorrow")}>
              明天
            </AppButton>
            <AppButton className={datePreset === "week" ? "selector-chip is-active" : "selector-chip"} variant="soft" onClick={() => setDatePreset("week")}>
              本周
            </AppButton>
          </View>

          <Text className="field-label">问题类型</Text>
          <View className="chip-grid">
            {issueOptions.map((option) => (
              <AppButton
                key={option.value}
                className={option.value === issueType ? "selector-chip is-active" : "selector-chip"}
                variant="soft"
                onClick={() => setIssueType(option.value)}
              >
                {option.label}
              </AppButton>
            ))}
          </View>

          <Text className="field-label">时间段</Text>
          {slotLoading ? <Text className="inline-note">正在加载可预约时段...</Text> : null}
          {slotError ? <Text className="error-banner">{slotError}</Text> : null}
          <View className="slot-stack">
            {visibleSchedules.length > 0 ? (
              visibleSchedules.map((slot) => (
                <AppButton
                  key={slot.id}
                  className={slot.id === selectedScheduleId ? "slot-card is-active" : "slot-card"}
                  variant="soft"
                  onClick={() => setSelectedScheduleId(slot.id)}
                >
                  <Text className="slot-time">{formatDateTime(slot.startTime)}</Text>
                  <Text className="slot-subtitle">结束于 {formatDateTime(slot.endTime)}</Text>
                </AppButton>
              ))
            ) : (
              <EmptyState title="暂无可预约时段" />
            )}
          </View>

          <Text className="field-label">补充说明（可选）</Text>
          <Textarea
            className="form-textarea"
            maxlength={300}
            placeholder="简单写下你想聊的内容"
            value={remark}
            onInput={(event) => setRemark(event.detail.value)}
          />
          <Text className="form-helper-text">{remark.trim() ? `${remark.trim().length}/300` : "选填"}</Text>
        </View>

        <View className="submit-panel">
          <Text className="submit-summary-text">
            {registrationSummary.blocking
              ? "还需先完成注册登录"
              : selectedSchedule
                ? `已选 ${formatDateTime(selectedSchedule.startTime)}`
                : "请先选择一个时间段"}
          </Text>
          <AppButton
            disabled={submitting || !selectedScheduleId}
            loading={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "提交中..." : "提交预约"}
          </AppButton>
        </View>
      </AppCard>
    </View>
  );
}
