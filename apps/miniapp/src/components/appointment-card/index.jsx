import Taro from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
import AppButton from "../app-button";
import AppCard from "../app-card";
import StatusTag from "../status-tag";
import {
  formatAppointmentHint,
  formatCounselorName,
  formatDateTime,
  formatIssueType
} from "../../lib/display";

export default function AppointmentCard({
  appointment,
  counselors = [],
  className = "",
  showActions = false
}) {
  const handleView = () => {
    Taro.showModal({
      title: "预约详情",
      content: `咨询老师：${formatCounselorName(appointment.counselorId, counselors)}\n问题类型：${formatIssueType(
        appointment.issueEntryType
      )}\n提交时间：${formatDateTime(appointment.createdAt)}\n补充说明：${appointment.remark ?? "未填写"}`
    });
  };

  return (
    <AppCard className={`appointment-card ${className}`.trim()}>
      <View className="appointment-card-head">
        <View className="appointment-card-copy">
          <Text className="appointment-card-title">{formatCounselorName(appointment.counselorId, counselors)}</Text>
          <Text className="appointment-card-subtitle">{formatDateTime(appointment.createdAt)}</Text>
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

      <Text className="appointment-remark">补充说明：{appointment.remark ?? "未填写"}</Text>

      {showActions ? (
        <View className="appointment-card-actions">
          <AppButton block={false} variant="secondary" onClick={handleView}>
            查看详情
          </AppButton>
          <AppButton block={false} variant="ghost" disabled>
            取消预约待开放
          </AppButton>
        </View>
      ) : null}
    </AppCard>
  );
}
