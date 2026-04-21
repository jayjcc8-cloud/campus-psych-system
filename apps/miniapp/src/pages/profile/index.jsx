import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppCard from "../../components/app-card";
import ListCell from "../../components/list-cell";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getStudentBootstrap } from "../../lib/api";
import { studentBootstrapFixture } from "../../lib/fixtures";
import { clearLocalStudentSession } from "../../lib/logout";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import {
  getRegistrationSummary,
  getStudentSetupState
} from "../../lib/student-setup";
import { switchStudentTab } from "../../lib/tabbar";

export default function ProfilePage() {
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [setupState, setSetupState] = useState(getStudentSetupState());

  const loadBootstrap = () => {
    getStudentBootstrap()
      .then(setBootstrap)
      .catch(() => {
        return;
      })
      .finally(() => {
        setSetupState(getStudentSetupState());
      });
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  useDidShow(() => {
    loadBootstrap();

    const feedback = consumeRegistrationFeedback();
    if (feedback?.message) {
      Taro.showToast({ title: feedback.message, icon: "success" });
    }
  });

  const registrationSummary = getRegistrationSummary(bootstrap);
  const bindingCompleted = registrationSummary.completed;

  const handleLogout = async () => {
    const result = await Taro.showModal({
      title: "退出登录",
      content: "退出后会清除本机登录和注册引导状态，下次进入需要重新完成注册登录。本操作不会删除你的历史预约记录。",
      confirmText: "退出",
      cancelText: "取消"
    });

    if (!result.confirm) {
      return;
    }

    clearLocalStudentSession();
    setBootstrap(studentBootstrapFixture);
    setSetupState(getStudentSetupState());
    Taro.showToast({ title: "已退出登录", icon: "success" });
    switchStudentTab("/pages/home/index");
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="我的"
        title="我的"
        subtitle="常用设置、说明和紧急支持都集中在这里。"
      />

      <View className="section-stack">
        <AppCard tone="accent" className="profile-summary-card">
          <Text className="section-title">{bootstrap.profile.maskedDisplayName}</Text>
          <Text className="section-copy">
            {registrationSummary.blocking
              ? "当前还未完成注册登录，建议先补齐姓名、学院和学号后再继续使用。"
              : "你可以在这里查看说明、管理预约和检查当前绑定状态。"}
          </Text>
        </AppCard>

        <AppCard>
          <SectionHeader title="常用设置" />
          <View className="menu-stack">
            <ListCell
              title="我的预约"
              actionText="进入"
              onClick={() => switchStudentTab("/pages/my/index")}
            />
            <ListCell
              title="注册信息"
              value={
                bindingCompleted
                  ? `${bootstrap.profile.displayName} / ${bootstrap.profile.college || "学院待补充"}`
                  : "未绑定"
              }
              actionText={bindingCompleted ? "查看" : "前往"}
              onClick={() => Taro.navigateTo({ url: "/pages/binding/index" })}
            />
            <ListCell
              title="紧急求助"
              actionText="前往"
              onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}
            />
            <ListCell
              title="退出登录"
              value="清除本机状态"
              actionText="退出"
              onClick={handleLogout}
            />
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="服务说明" />
          <View className="menu-stack">
            <ListCell
              title="隐私说明"
              value={setupState.privacyAcceptedAt ? "已知晓" : "待确认"}
              actionText="查看"
              onClick={() => Taro.navigateTo({ url: "/pages/privacy/index" })}
            />
            <ListCell
              title="用户协议"
              value={setupState.agreementAcceptedAt ? "已确认" : "待确认"}
              actionText="查看"
              onClick={() => Taro.navigateTo({ url: "/pages/agreement/index" })}
            />
            <ListCell
              title="知情提示"
              value={setupState.consentAcceptedAt ? "已确认" : "待确认"}
              actionText="查看"
              onClick={() => Taro.navigateTo({ url: "/pages/consent/index" })}
            />
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="使用状态" />
          <View className="privacy-note">
            <Text className="privacy-line">预约详情默认仅本人可见。</Text>
            <Text className="privacy-line">
              {bindingCompleted ? `当前已绑定学号：${bootstrap.profile.schoolId}` : "当前还未绑定学号。"}
            </Text>
            <Text className="privacy-line">
              {bootstrap.profile.college
                ? `当前学院：${bootstrap.profile.college}`
                : "当前还未补充学院信息。"}
            </Text>
            <Text className="privacy-line">
              {bootstrap.publicConfig.forceStudentIdBinding
                ? "当前配置要求完成身份绑定。"
                : "当前配置未强制要求身份绑定。"}
            </Text>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
