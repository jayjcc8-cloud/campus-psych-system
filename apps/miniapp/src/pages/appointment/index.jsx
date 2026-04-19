import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import { createAppointment, getCounselorDetail, getCounselors } from "../../lib/api";
import { counselorsFixture, scheduleFixture } from "../../lib/fixtures";
import { switchStudentTab } from "../../lib/tabbar";

const issueOptions = [
  { value: "academic_pressure", label: "Academic pressure" },
  { value: "sleep", label: "Sleep" },
  { value: "relationship", label: "Relationship" },
  { value: "emotion", label: "Emotion" },
  { value: "career", label: "Career" },
  { value: "other", label: "Other" }
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
        const fallback = scheduleFixture.filter(
          (slot) => slot.counselorId === selectedCounselorId && slot.available
        );
        setSchedules(fallback);
        setSelectedScheduleId(fallback[0]?.id ?? "");
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
      setError("Please choose a counselor and an available slot.");
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

      setNotice(`Appointment ${appointment.id} submitted.`);
      Taro.showToast({
        title: "预约成功",
        icon: "success"
      });
      switchStudentTab("/pages/my/index");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to submit appointment.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="page-shell">
      <AppCard tone="accent">
        <Text className="section-kicker">预约</Text>
        <Text className="section-title">一屏完成预约</Text>
        <Text className="section-copy">选择咨询师、日期偏好和时间段后，就可以直接提交，减少来回跳转。</Text>
      </AppCard>

      <AppCard className="booking-card">
        <Text className="section-title">预约信息</Text>
        <Text className="booking-meta">默认方式：线下面谈</Text>
        {selectedCounselor ? (
          <Text className="booking-meta">当前咨询师：{selectedCounselor.displayName}</Text>
        ) : null}
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
                {counselor.displayName}
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
          <View className="slot-stack">
            {visibleSchedules.length > 0 ? (
              visibleSchedules.map((slot) => (
                <AppButton
                  key={slot.id}
                  className={slot.id === selectedScheduleId ? "slot-card is-active" : "slot-card"}
                  variant="soft"
                  onClick={() => setSelectedScheduleId(slot.id)}
                >
                  <Text className="slot-time">{slot.startTime.slice(11, 16)}</Text>
                  <Text className="slot-subtitle">{slot.endTime.slice(11, 16)}</Text>
                </AppButton>
              ))
            ) : (
              <Text className="empty-state">当前日期筛选下暂无可预约时段，可以换一个日期试试。</Text>
            )}
          </View>

          <AppCard className="summary-card">
            <Text className="field-label">确认信息</Text>
            <View className="summary-grid">
              <View className="summary-item">
                <Text className="summary-label">咨询师</Text>
                <Text className="summary-value">{selectedCounselor?.displayName ?? "未选择"}</Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">问题类型</Text>
                <Text className="summary-value">{issueOptions.find((option) => option.value === issueType)?.label ?? issueType}</Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">时间段</Text>
                <Text className="summary-value">
                  {visibleSchedules.find((slot) => slot.id === selectedScheduleId)?.startTime.slice(0, 16) ?? "未选择"}
                </Text>
              </View>
            </View>
          </AppCard>

          <Text className="field-label">备注</Text>
          <Textarea
            className="form-textarea"
            maxlength={300}
            placeholder="可选填写，帮助咨询师提前了解你的情况。"
            value={remark}
            onInput={(event) => setRemark(event.detail.value)}
          />
        </View>

        <AppButton disabled={submitting || !selectedScheduleId} onClick={handleSubmit}>
          {submitting ? "提交中..." : "确认预约"}
        </AppButton>
      </AppCard>
    </View>
  );
}
