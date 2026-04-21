import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../../components/app-button";
import AppCard from "../../../components/app-card";
import EmptyState from "../../../components/empty-state";
import PageHeader from "../../../components/page-header";
import SectionHeader from "../../../components/section-header";
import StatusTag from "../../../components/status-tag";
import { isTeacherSession } from "../../../lib/auth-session";
import {
  formatAppointmentHint,
  formatDateTime,
  formatIssueType
} from "../../../lib/display";
import {
  getTeacherAppointments,
  updateTeacherAppointmentStatus
} from "../../../lib/teacher-api";
import {
  formatTeacherStudentLine,
  getTeacherAppointmentActions
} from "../../../lib/teacher-workspace";
import { refreshRoleTabBar } from "../../../lib/tabbar";

const statusFilters = [
  { key: "pending", title: "待确认" },
  { key: "confirmed", title: "已确认" },
  { key: "all", title: "全部" }
];

export default function TeacherAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadAppointments = () => {
    if (!isTeacherSession()) {
      Taro.redirectTo({ url: "/pages/binding/index" });
      return;
    }

    setLoading(true);
    setLoadError("");

    getTeacherAppointments()
      .then((items) => {
        setAppointments(items);
        const hasPending = items.some((appointment) => appointment.status === "pending");
        const hasConfirmed = items.some((appointment) => appointment.status === "confirmed");

        if (hasPending) {
          setActiveStatus("pending");
          return;
        }

        setActiveStatus(hasConfirmed ? "confirmed" : "all");
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "预约信息暂时没有完全刷新。");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useDidShow(() => {
    refreshRoleTabBar();
    loadAppointments();
  });

  const handleUpdateStatus = async (appointment, nextStatus) => {
    if (nextStatus === "cancelled" || nextStatus === "completed") {
      const result = await Taro.showModal({
        title: nextStatus === "cancelled" ? "确认取消预约" : "确认标记完成",
        content:
          nextStatus === "cancelled"
            ? "取消后，学生端会同步显示为已取消。"
            : "标记完成后，这条预约会从进行中状态移出。"
      });

      if (!result.confirm) {
        return;
      }
    }

    setUpdatingId(appointment.id);
    setLoadError("");

    try {
      await updateTeacherAppointmentStatus(appointment.id, nextStatus);
      Taro.showToast({ title: "已更新状态", icon: "success" });
      loadAppointments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "状态更新失败。";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setUpdatingId("");
    }
  };

  const visibleAppointments =
    activeStatus === "all"
      ? appointments
      : appointments.filter((appointment) => appointment.status === activeStatus);
  const statusCountMap = statusFilters.reduce((result, filter) => {
    result[filter.key] =
      filter.key === "all"
        ? appointments.length
        : appointments.filter((appointment) => appointment.status === filter.key).length;
    return result;
  }, {});

  return (
    <View className="page-shell">
      <PageHeader
        kicker="预约管理"
        title="预约管理"
      />

      <AppCard tone="accent">
        <SectionHeader title="状态筛选" extra={<Text className="count-badge">{appointments.length} 条</Text>} />
        <View className="status-filter-grid">
          {statusFilters.map((filter) => (
            <AppButton
              className={filter.key === activeStatus ? "status-filter-card is-active" : "status-filter-card"}
              key={filter.key}
              variant="soft"
              onClick={() => setActiveStatus(filter.key)}
            >
              <View className="status-filter-content">
                <Text className="status-filter-title">{filter.title}</Text>
                <Text className="status-filter-count">{statusCountMap[filter.key]}</Text>
              </View>
            </AppButton>
          ))}
        </View>
      </AppCard>

      {loading ? <Text className="inline-note">正在同步预约信息...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        {visibleAppointments.length > 0 ? (
          visibleAppointments.map((appointment) => {
            const actions = getTeacherAppointmentActions(appointment.status);

            return (
              <AppCard className="teacher-appointment-panel" key={appointment.id}>
                <View className="appointment-card-head">
                  <View className="appointment-card-copy">
                    <Text className="appointment-card-title">{formatDateTime(appointment.scheduleStartTime)}</Text>
                    <Text className="appointment-card-subtitle">{formatTeacherStudentLine(appointment)}</Text>
                  </View>
                  <StatusTag status={appointment.status} />
                </View>
                <View className="appointment-detail-grid">
                  <View className="appointment-detail-item">
                    <Text className="appointment-detail-label">问题类型</Text>
                    <Text className="appointment-detail-value">{formatIssueType(appointment.issueEntryType)}</Text>
                  </View>
                  <View className="appointment-detail-item">
                    <Text className="appointment-detail-label">状态说明</Text>
                    <Text className="appointment-detail-value">{formatAppointmentHint(appointment.status)}</Text>
                  </View>
                </View>
                {appointment.remark ? <Text className="appointment-remark">{appointment.remark}</Text> : null}
                {actions.length > 0 ? (
                  <View className="appointment-card-actions">
                    {actions.map((action) => (
                      <AppButton
                        block={false}
                        key={action.nextStatus}
                        variant={action.variant}
                        loading={updatingId === appointment.id}
                        onClick={() => handleUpdateStatus(appointment, action.nextStatus)}
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
          <EmptyState title="当前没有预约" />
        )}
      </View>
    </View>
  );
}
