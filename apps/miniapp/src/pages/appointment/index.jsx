import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { createAppointment, getCounselorDetail, getCounselors } from "../../lib/api";
import {
  formatCounselorDisplayName,
  formatCounselorSummary,
  formatDateTime,
  formatIssueType
} from "../../lib/display";
import { counselorsFixture, scheduleFixture } from "../../lib/fixtures";
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
  const [datePreset, setDatePreset] = useState("today");
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");

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
  });

  useEffect(() => {
    if (!selectedCounselorId) {
      return;
    }

    setError("");
    setSlotError("");
    setSlotLoading(true);
    getCounselorDetail(selectedCounselorId)
      .then((response) => {
        const availableSchedules = response.schedules.filter((slot) => slot.available);
        setSchedules(availableSchedules);
        setSelectedScheduleId((current) =>
          current && availableSchedules.some((slot) => slot.id === current)
            ? current
            : availableSchedules[0]?.id ?? ""
        );
      })
      .catch(() => {
        setSlotError("可预约时段暂时没有完全刷新，已展示本地可用时间。");
        const fallback = scheduleFixture.filter(
          (slot) => slot.counselorId === selectedCounselorId && slot.available
        );
        setSchedules(fallback);
        setSelectedScheduleId(fallback[0]?.id ?? "");
      })
      .finally(() => {
        setSlotLoading(false);
      });
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

  const handleSubmit = async () => {
    if (!selectedCounselorId || !selectedScheduleId) {
      setError("请先选择咨询老师和可预约时段。");
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
      Taro.showToast({
        title: "预约成功",
        icon: "success"
      });
      switchStudentTab("/pages/my/index");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "预约提交失败，请稍后再试。";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="预约"
        title="一屏完成预约"
        subtitle="我们把选择信息、确认时间和提交反馈放在同一条路径里，尽量减少来回跳转。"
      />

      <AppCard tone="accent">
        <SectionHeader title="当前进度" description="先确认咨询老师和时间，再决定是否补充说明。" />
        <View className="progress-strip">
          <Text className="progress-chip is-active">1 选择信息</Text>
          <Text className="progress-chip is-active">2 确认时间</Text>
          <Text className="progress-chip">3 提交完成</Text>
        </View>
      </AppCard>

      {selectedCounselor ? (
        <AppCard className="selected-counselor-card">
          <SectionHeader title="已选咨询老师" description="你可以随时在下面切换其他咨询老师，不会丢失当前页面。" />
          <Text className="selected-counselor-name">{formatCounselorDisplayName(selectedCounselor.displayName)}</Text>
          <Text className="section-copy">{formatCounselorSummary(selectedCounselor)}</Text>
        </AppCard>
      ) : null}

      <AppCard className="booking-card">
        <SectionHeader title="预约信息" description="默认方式为线下面谈。补充说明是可选项，先完成预约更重要。" />
        {notice ? <Text className="success-banner">{notice}</Text> : null}
        {error ? <Text className="error-banner">{error}</Text> : null}

        <View className="form-stack">
          <Text className="field-label">咨询师</Text>
          <View className="chip-grid">
            {counselors.map((counselor) => (
              <AppButton
                key={counselor.id}
                className={counselor.id === selectedCounselorId ? "selector-chip is-active" : "selector-chip"}
                variant="soft"
                onClick={() => setSelectedCounselorId(counselor.id)}
              >
                {formatCounselorDisplayName(counselor.displayName)}
              </AppButton>
            ))}
          </View>

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
              <EmptyState title="当前筛选下暂无可预约时段" description="可以换一个日期试试，或者先切换到其他咨询老师。" />
            )}
          </View>

          <AppCard className="summary-card">
            <SectionHeader title="确认信息" description="提交前只看三项：咨询老师、问题类型和你选择的时间段。" />
            <View className="summary-grid">
              <View className="summary-item">
                <Text className="summary-label">咨询师</Text>
                <Text className="summary-value">
                  {selectedCounselor ? formatCounselorDisplayName(selectedCounselor.displayName) : "未选择"}
                </Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">问题类型</Text>
                <Text className="summary-value">{formatIssueType(issueType)}</Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">时间段</Text>
                <Text className="summary-value">
                  {formatDateTime(visibleSchedules.find((slot) => slot.id === selectedScheduleId)?.startTime) ?? "未选择"}
                </Text>
              </View>
            </View>
          </AppCard>

          <Text className="field-label">补充说明（可选）</Text>
          <Textarea
            className="form-textarea"
            maxlength={300}
            placeholder="如果你愿意，可以简单写下当前最想聊的情况，帮助咨询老师提前了解。"
            value={remark}
            onInput={(event) => setRemark(event.detail.value)}
          />
        </View>

        <AppButton disabled={submitting || !selectedScheduleId} loading={submitting} onClick={handleSubmit}>
          {submitting ? "提交中..." : "确认预约"}
        </AppButton>
      </AppCard>
    </View>
  );
}
