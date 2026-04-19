import { View, Text } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppCard from "../../components/app-card";
import StatusTag from "../../components/status-tag";
import { getMyAppointments } from "../../lib/api";
import { appointmentsFixture } from "../../lib/fixtures";

const statusSections = [
  { key: "pending", title: "待确认" },
  { key: "confirmed", title: "已确认" },
  { key: "completed", title: "已完成" },
  { key: "cancelled", title: "已取消" },
  { key: "no_show", title: "未到场" },
  { key: "expired", title: "已过期" }
];

export default function MyPage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);

  const loadAppointments = () => {
    getMyAppointments()
      .then(setAppointments)
      .catch(() => {
        return;
      });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useDidShow(() => {
    loadAppointments();
  });

  return (
    <View className="page-shell">
      <AppCard tone="accent">
        <Text className="section-kicker">我的预约</Text>
        <Text className="section-title">你的预约记录会按状态整理。</Text>
        <Text className="section-copy">这样更容易确认哪一条还在等待、哪一条已经完成，也能减少信息混在一起带来的焦虑。</Text>
      </AppCard>

      <View className="section-stack">
        {statusSections.map((section) => {
          const sectionItems = appointments.filter((appointment) => appointment.status === section.key);

          if (sectionItems.length === 0) {
            return null;
          }

          return (
            <AppCard key={section.key}>
              <View className="tag-row">
                <Text className="section-title">{section.title}</Text>
                <Text className="count-badge">{sectionItems.length}</Text>
              </View>
              <View className="appointment-list">
                {sectionItems.map((appointment) => (
                  <View className="appointment-item" key={appointment.id}>
                    <View className="tag-row">
                      <Text className="brief-title">{appointment.id}</Text>
                      <StatusTag status={appointment.status} />
                    </View>
                    <Text className="section-copy">咨询师：{appointment.counselorId}</Text>
                    <Text className="section-copy">问题类型：{appointment.issueEntryType}</Text>
                    <Text className="section-copy">备注：{appointment.remark ?? "未填写"}</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          );
        })}
        {appointments.length === 0 ? <Text className="empty-state">当前还没有预约记录。</Text> : null}
      </View>
    </View>
  );
}
