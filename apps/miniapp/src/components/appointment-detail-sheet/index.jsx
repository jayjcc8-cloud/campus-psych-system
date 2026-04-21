import { Text, View } from "@tarojs/components";
import AppButton from "../app-button";
import AppCard from "../app-card";
import StatusTag from "../status-tag";
import {
  formatAppointmentHint,
  formatAppointmentStatus,
  formatConsultMode,
  formatCounselorName,
  formatDateTime,
  formatIssueType,
  formatOptionalText
} from "../../lib/display";

function DetailRow({ label, value }) {
  return (
    <View className="detail-row">
      <Text className="detail-row-label">{label}</Text>
      <Text className="detail-row-value">{value}</Text>
    </View>
  );
}

export default function AppointmentDetailSheet({ appointment, counselors = [], open = false, onClose }) {
  if (!open || !appointment) {
    return null;
  }

  return (
    <View className="detail-sheet-mask">
      <View className="detail-sheet-panel">
        <AppCard className="detail-sheet-card">
          <View className="detail-sheet-head">
            <View className="detail-sheet-copy">
              <Text className="section-kicker">预约详情</Text>
              <Text className="section-title">查看预约信息</Text>
            </View>
            <AppButton block={false} variant="ghost" onClick={onClose}>
              关闭
            </AppButton>
          </View>

          <View className="detail-sheet-summary">
            <View className="detail-sheet-summary-copy">
              <Text className="detail-sheet-primary">{formatCounselorName(appointment.counselorId, counselors)}</Text>
              <Text className="detail-sheet-secondary">{formatIssueType(appointment.issueEntryType)}</Text>
            </View>
            <StatusTag status={appointment.status} />
          </View>

          <View className="detail-sheet-section">
            <Text className="detail-sheet-section-title">预约信息</Text>
            <View className="detail-sheet-grid">
              <DetailRow label="预约编号" value={appointment.id} />
              <DetailRow label="当前状态" value={formatAppointmentStatus(appointment.status)} />
              <DetailRow label="开始时间" value={formatDateTime(appointment.scheduleStartTime)} />
              <DetailRow label="结束时间" value={formatDateTime(appointment.scheduleEndTime)} />
              <DetailRow label="支持方式" value={formatConsultMode(appointment.consultMode)} />
              <DetailRow label="提交时间" value={formatDateTime(appointment.createdAt)} />
              <DetailRow label="最近更新" value={formatDateTime(appointment.updatedAt)} />
              <DetailRow label="状态说明" value={formatAppointmentHint(appointment.status)} />
            </View>
          </View>

          <View className="detail-sheet-section">
            <Text className="detail-sheet-section-title">补充说明</Text>
            <View className="detail-sheet-note-panel">
              <Text className="detail-sheet-note">{formatOptionalText(appointment.remark)}</Text>
            </View>
          </View>

          {appointment.cancelReason ? (
            <View className="detail-sheet-section">
              <Text className="detail-sheet-section-title">取消原因</Text>
              <View className="detail-sheet-note-panel detail-sheet-note-panel-warning">
                <Text className="detail-sheet-note">{formatOptionalText(appointment.cancelReason)}</Text>
              </View>
            </View>
          ) : null}

          <View className="detail-sheet-footer">
            <AppButton onClick={onClose}>我知道了</AppButton>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
