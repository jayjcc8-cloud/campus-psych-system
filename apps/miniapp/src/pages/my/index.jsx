import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import AppointmentCard from "../../components/appointment-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { cancelAppointment, getCounselors, getMyAppointments } from "../../lib/api";
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
  const [cancellingId, setCancellingId] = useState("");

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

  const formatCancelError = (cancelError) => {
    const message = cancelError instanceof Error ? cancelError.message : "";

    if (message.includes("Only pending or confirmed appointments")) {
      return "这条预约当前不能取消，请先查看最新状态。";
    }

    if (message.includes("Appointment not found")) {
      return "这条预约已不存在，列表已经为你刷新。";
    }

    return message || "取消预约失败，请稍后再试。";
  };

  const handleCancel = async (appointment) => {
    const result = await Taro.showModal({
      title: "确认取消预约",
      content: "取消后，这条预约会从进行中状态移到“已取消”，你之后仍然可以重新预约。"
    });

    if (!result.confirm) {
      return;
    }

    setCancellingId(appointment.id);
    setLoadError("");

    try {
      await cancelAppointment(appointment.id, {
        cancelReason: "学生在小程序中主动取消预约。"
      });

      Taro.showToast({
        title: "已取消预约",
        icon: "success"
      });
      loadAppointments();
    } catch (cancelError) {
      const message = formatCancelError(cancelError);

      setLoadError(message);
      Taro.showToast({
        title: message,
        icon: "none"
      });
      loadAppointments();
    } finally {
      setCancellingId("");
    }
  };

  const visibleAppointments =
    activeStatus === "all"
      ? appointments
      : appointments.filter((appointment) => appointment.status === activeStatus);

  return (
    <View className="page-shell">
      <PageHeader
        kicker="我的预约"
        title="把预约记录按状态整理好"
        subtitle="你可以更快看到哪一条还在等待确认，哪一条已经完成；进行中的预约也可以直接在这里取消。"
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
              showActions
              canCancel={appointment.status === "pending" || appointment.status === "confirmed"}
              cancelling={cancellingId === appointment.id}
              onCancel={() => handleCancel(appointment)}
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
