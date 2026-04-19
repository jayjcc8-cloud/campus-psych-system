import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import StatusTag from "../../components/status-tag";
import { getMyAppointments, getPublicConfig } from "../../lib/api";
import { appointmentsFixture, publicConfigFixture } from "../../lib/fixtures";
import { openCounselorsTab, switchStudentTab } from "../../lib/tabbar";

const entries = [
  { emoji: "🙂", label: "还可以", hint: "想提前聊聊学习与状态", issueType: "academic_pressure" },
  { emoji: "😐", label: "有点累", hint: "最近睡眠或节奏被打乱", issueType: "sleep" },
  { emoji: "😔", label: "有些难受", hint: "关系、情绪或压力想被看见", issueType: "emotion" }
];

export default function HomePage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);
  const [config, setConfig] = useState(publicConfigFixture);

  useEffect(() => {
    getMyAppointments()
      .then(setAppointments)
      .catch(() => {
        return;
      });

    getPublicConfig()
      .then(setConfig)
      .catch(() => {
        return;
      });
  }, []);

  const openCounselors = (issueType) => {
    openCounselorsTab(issueType);
  };

  const latestAppointment = appointments[0];

  return (
    <View className="page-shell">
      <View className="page-header">
        <Text className="section-kicker">首页</Text>
        <Text className="page-title">你好，今天感觉怎么样？</Text>
        <Text className="page-subtitle">用最少的信息负担，帮你完成一次私密、清晰的校园心理咨询预约。</Text>
      </View>

      <AppCard tone="accent">
        <Text className="section-title">情绪入口</Text>
        <Text className="section-copy">不需要先想清楚所有问题，只要从此刻的感受开始。</Text>
        <View className="mood-grid">
          {entries.map((entry) => (
            <AppButton className="mood-button" key={entry.label} variant="soft" onClick={() => openCounselors(entry.issueType)}>
              <View className="mood-button-content">
                <Text className="mood-emoji">{entry.emoji}</Text>
                <Text className="mood-title">{entry.label}</Text>
                <Text className="mood-hint">{entry.hint}</Text>
              </View>
            </AppButton>
          ))}
        </View>
      </AppCard>

      <View className="section-stack">
        <AppCard>
          <Text className="section-title">核心操作</Text>
          <Text className="section-copy">优先把最重要的事情放到最前面：预约、查看记录、紧急求助。</Text>
          <View className="shortcut-grid">
            <AppButton onClick={() => openCounselors()}>预约心理咨询</AppButton>
            <AppButton variant="secondary" onClick={() => switchStudentTab("/pages/counselors/index")}>
              咨询师列表
            </AppButton>
            <AppButton variant="secondary" onClick={() => switchStudentTab("/pages/my/index")}>
              我的预约
            </AppButton>
            <AppButton variant="ghost" onClick={() => switchStudentTab("/pages/profile/index")}>
              我的
            </AppButton>
            <AppButton variant="ghost" onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}>
              紧急求助
            </AppButton>
          </View>
        </AppCard>

        <AppCard>
          <Text className="section-title">最近预约</Text>
          {latestAppointment ? (
            <View className="appointment-brief">
              <View className="tag-row">
                <Text className="brief-title">{latestAppointment.id}</Text>
                <StatusTag status={latestAppointment.status} />
              </View>
              <Text className="section-copy">咨询师：{latestAppointment.counselorId}</Text>
              <Text className="section-copy">问题类型：{latestAppointment.issueEntryType}</Text>
            </View>
          ) : (
            <Text className="empty-state">你还没有预约记录，准备好时可以从上方入口开始。</Text>
          )}
        </AppCard>

        <AppCard>
          <Text className="section-title">服务公告</Text>
          <Text className="section-copy">{config.announcement}</Text>
          <Text className="inline-note">预约信息仅本人可见，敏感数据默认不在学生端公开展示。</Text>
        </AppCard>
      </View>
    </View>
  );
}
