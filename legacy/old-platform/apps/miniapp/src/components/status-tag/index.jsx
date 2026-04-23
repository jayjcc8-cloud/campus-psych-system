import { Text } from "@tarojs/components";

const statusLabelMap = {
  pending: "待确认",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到场",
  expired: "已过期"
};

export default function StatusTag({ status }) {
  return <Text className={`status-tag status-tag-${status}`}>{statusLabelMap[status] ?? status}</Text>;
}
