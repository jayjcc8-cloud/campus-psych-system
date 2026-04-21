import { Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../../components/app-button";
import AppCard from "../../../components/app-card";
import EmptyState from "../../../components/empty-state";
import PageHeader from "../../../components/page-header";
import SectionHeader from "../../../components/section-header";
import { isTeacherSession } from "../../../lib/auth-session";
import { formatDateTime } from "../../../lib/display";
import {
  createTeacherSchedule,
  getTeacherAppointments,
  getTeacherWorkspace,
  updateTeacherSchedule
} from "../../../lib/teacher-api";
import {
  formatTeacherTimeInput,
  normalizeTeacherTime,
  teacherActiveStatuses
} from "../../../lib/teacher-workspace";

export default function TeacherSchedulesPage() {
  const [workspace, setWorkspace] = useState({ counselor: null, schedules: [] });
  const [appointments, setAppointments] = useState([]);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleCapacity, setScheduleCapacity] = useState("1");
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const loadSchedules = () => {
    if (!isTeacherSession()) {
      Taro.redirectTo({ url: "/pages/binding/index" });
      return;
    }

    setLoading(true);
    setLoadError("");

    Promise.all([getTeacherWorkspace(), getTeacherAppointments()])
      .then(([workspaceResult, appointmentsResult]) => {
        setWorkspace(workspaceResult);
        setAppointments(appointmentsResult);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "排期信息暂时没有完全刷新。");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  useDidShow(() => {
    loadSchedules();
  });

  const resetScheduleForm = () => {
    setEditingScheduleId("");
    setScheduleStart("");
    setScheduleEnd("");
    setScheduleCapacity("1");
  };

  const handleEditSchedule = (slot) => {
    setEditingScheduleId(slot.id);
    setScheduleStart(formatTeacherTimeInput(slot.startTime));
    setScheduleEnd(formatTeacherTimeInput(slot.endTime));
    setScheduleCapacity(`${slot.capacity ?? 1}`);
  };

  const handleSaveSchedule = async () => {
    const startTime = normalizeTeacherTime(scheduleStart);
    const endTime = normalizeTeacherTime(scheduleEnd);
    const capacity = Number.parseInt(scheduleCapacity, 10);

    if (!startTime || !endTime || Number.isNaN(capacity) || capacity < 1) {
      Taro.showToast({ title: "请填写正确的排期信息", icon: "none" });
      return;
    }

    setScheduleSaving(true);
    setLoadError("");

    try {
      if (editingScheduleId) {
        await updateTeacherSchedule(editingScheduleId, {
          startTime,
          endTime,
          capacity
        });
      } else {
        await createTeacherSchedule({
          startTime,
          endTime,
          capacity,
          available: true
        });
      }

      Taro.showToast({ title: editingScheduleId ? "排期已更新" : "排期已新增", icon: "success" });
      resetScheduleForm();
      loadSchedules();
    } catch (error) {
      const message = error instanceof Error ? error.message : "排期保存失败。";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDisableSchedule = async (slot) => {
    const result = await Taro.showModal({
      title: "确认停用时段",
      content: "停用后，学生端将不再展示这个可约时段，历史预约不会受影响。"
    });

    if (!result.confirm) {
      return;
    }

    setScheduleSaving(true);
    setLoadError("");

    try {
      await updateTeacherSchedule(slot.id, { available: false });
      Taro.showToast({ title: "排期已停用", icon: "success" });
      loadSchedules();
    } catch (error) {
      const message = error instanceof Error ? error.message : "排期停用失败。";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setScheduleSaving(false);
    }
  };

  const activeSchedules = workspace.schedules
    .filter((slot) => slot.available)
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  const disabledSchedules = workspace.schedules.filter((slot) => !slot.available);
  const bookedScheduleIds = new Set(
    appointments
      .filter((appointment) => teacherActiveStatuses.has(appointment.status))
      .map((appointment) => appointment.scheduleSlotId)
  );

  return (
    <View className="page-shell">
      <PageHeader
        kicker="排期管理"
        title="排期管理"
      />

      {loading ? <Text className="inline-note">正在同步排期信息...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent">
          <SectionHeader
            title={editingScheduleId ? "编辑时段" : "新增时段"}
            extra={<Text className="count-badge">{activeSchedules.length} 个开放时段</Text>}
          />
          <View className="form-stack">
            <Input
              className="search-input"
              placeholder="开始时间，如 2026-04-22 10:00"
              value={scheduleStart}
              onInput={(event) => setScheduleStart(event.detail.value)}
            />
            <Input
              className="search-input"
              placeholder="结束时间，如 2026-04-22 11:00"
              value={scheduleEnd}
              onInput={(event) => setScheduleEnd(event.detail.value)}
            />
            <Input
              className="search-input"
              placeholder="容量，默认 1"
              type="number"
              value={scheduleCapacity}
              onInput={(event) => setScheduleCapacity(event.detail.value)}
            />
            <View className="teacher-action-row">
              <AppButton block={false} loading={scheduleSaving} onClick={handleSaveSchedule}>
                {scheduleSaving ? "保存中..." : editingScheduleId ? "保存修改" : "新增排期"}
              </AppButton>
              {editingScheduleId ? (
                <AppButton block={false} variant="ghost" onClick={resetScheduleForm}>
                  取消编辑
                </AppButton>
              ) : null}
            </View>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="开放时段" />
          <View className="slot-stack">
            {activeSchedules.length > 0 ? (
              activeSchedules.map((slot) => (
                <View className="teacher-schedule-card" key={slot.id}>
                  <View>
                    <Text className="slot-time">{formatDateTime(slot.startTime)}</Text>
                    <Text className="slot-subtitle">
                      结束于 {formatDateTime(slot.endTime)} / 容量 {slot.capacity}
                      {bookedScheduleIds.has(slot.id) ? " / 已有预约" : ""}
                    </Text>
                  </View>
                  <View className="teacher-action-row">
                    <AppButton
                      block={false}
                      disabled={bookedScheduleIds.has(slot.id)}
                      variant="soft"
                      onClick={() => handleEditSchedule(slot)}
                    >
                      编辑
                    </AppButton>
                    <AppButton block={false} variant="ghost" onClick={() => handleDisableSchedule(slot)}>
                      停用
                    </AppButton>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState title="暂无开放排期" />
            )}
          </View>
          {disabledSchedules.length > 0 ? (
            <Text className="form-helper-text">已停用 {disabledSchedules.length} 个历史时段</Text>
          ) : null}
        </AppCard>
      </View>
    </View>
  );
}
