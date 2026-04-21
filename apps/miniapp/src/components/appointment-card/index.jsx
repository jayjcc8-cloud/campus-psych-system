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
  showActions = false,
  canCancel = false,
  cancelling = false,
  onView,
  onCancel
}) {
  return (
    <AppCard className={`appointment-card ${className}`.trim()}>
      <View className="appointment-card-head">
        <View className="appointment-card-copy">
          <Text className="card-kicker">预约记录</Text>
          <Text className="appointment-card-title">{formatCounselorName(appointment.counselorId, counselors)}</Text>
          <Text className="appointment-card-subtitle">提交于 {formatDateTime(appointment.createdAt)}</Text>
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

      {showActions ? (
        <View className="appointment-card-actions">
          <AppButton block={false} variant="secondary" onClick={onView}>
            查看详情
          </AppButton>
          {canCancel ? (
            <AppButton
              block={false}
              variant="ghost"
              loading={cancelling}
              onClick={onCancel}
            >
              {cancelling ? "取消中..." : "取消预约"}
            </AppButton>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}
