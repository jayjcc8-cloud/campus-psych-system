import { View, Text } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import AppointmentCard from "../../components/appointment-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getCounselors, getMyAppointments } from "../../lib/api";
import { appointmentsFixture, counselorsFixture } from "../../lib/fixtures";

const statusSections = [
  { key: "all", title: "全部" },
  { key: "pending", title: "待确认" },
  { key: "confirmed", title: "已确认" },
  { key: "completed", title: "已完成" },
  { key: "cancelled", title: "已取消" },
  { key: "no_show", title: "未到场" },
  { key: "expired", title: "已过期" }
];

export default function MyPage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [activeStatus, setActiveStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadAppointments = () => {
    setLoading(true);
    setLoadError("");

    Promise.allSettled([getMyAppointments(), getCounselors()])
      .then(([appointmentsResult, counselorsResult]) => {
        if (appointmentsResult.status === "fulfilled") {
          setAppointments(appointmentsResult.value);
        }

        if (counselorsResult.status === "fulfilled") {
          setCounselors(counselorsResult.value);
        }

        if (appointmentsResult.status === "rejected") {
          setLoadError("预约列表暂时没有完全刷新，已展示当前可用记录。");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useDidShow(() => {
    loadAppointments();
  });

  const visibleAppointments =
    activeStatus === "all"
      ? appointments
      : appointments.filter((appointment) => appointment.status === activeStatus);

  return (
    <View className="page-shell">
      <PageHeader
        kicker="我的预约"
        title="把预约记录按状态整理好"
        subtitle="你可以更快看到哪一条还在等待确认，哪一条已经完成，也为后续取消预约入口预留了位置。"
      />

      <AppCard tone="accent">
        <SectionHeader title="状态筛选" description="先按状态看，再决定是否查看详情，减少所有记录堆在一起的负担。" />
        <View className="status-filter-grid">
          {statusSections.map((section) => {
            const count =
              section.key === "all"
                ? appointments.length
                : appointments.filter((appointment) => appointment.status === section.key).length;

            return (
              <AppButton
                className={section.key === activeStatus ? "status-filter-card is-active" : "status-filter-card"}
                key={section.key}
                variant="soft"
                onClick={() => setActiveStatus(section.key)}
              >
                <View className="status-filter-content">
                  <Text className="status-filter-title">{section.title}</Text>
                  <Text className="status-filter-count">{count}</Text>
                </View>
              </AppButton>
            );
          })}
        </View>
      </AppCard>

      <View className="tag-row list-meta-row">
        <Text className="inline-note">{loading ? "正在同步你的预约记录..." : `共 ${appointments.length} 条预约记录`}</Text>
        <Text className="inline-note">仅展示你自己的预约信息</Text>
      </View>
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        {visibleAppointments.length > 0 ? (
          visibleAppointments.map((appointment) => (
            <AppointmentCard
              appointment={appointment}
              counselors={counselors}
              key={appointment.id}
              showActions={activeStatus !== "cancelled" && activeStatus !== "expired"}
            />
          ))
        ) : (
          <EmptyState
            title={appointments.length === 0 ? "当前还没有预约记录" : "这个状态下还没有预约"}
            description={appointments.length === 0 ? "准备好时，可以从首页或咨询师页开始预约。" : "你可以切换到其他状态，看看已经提交或已完成的预约记录。"}
          />
        )}
      </View>
    </View>
  );
}
