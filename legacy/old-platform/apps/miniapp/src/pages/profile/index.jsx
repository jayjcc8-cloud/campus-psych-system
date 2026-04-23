import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppCard from "../../components/app-card";
import ListCell from "../../components/list-cell";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getStudentBootstrap } from "../../lib/api";
import { getAuthRole } from "../../lib/auth-session";
import { studentBootstrapFixture } from "../../lib/fixtures";
import { clearLocalStudentSession } from "../../lib/logout";
import { consumeRegistrationFeedback } from "../../lib/registration-feedback";
import { getCurrentRoleProfile, getRoleMode } from "../../lib/role-mode";
import {
  getRegistrationSummary,
  getStudentSetupState
} from "../../lib/student-setup";
import { refreshRoleTabBar, switchStudentTab } from "../../lib/tabbar";

export default function ProfilePage() {
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [setupState, setSetupState] = useState(getStudentSetupState());
  const [roleMode, setRoleModeState] = useState(getRoleMode());
  const [roleProfile, setRoleProfile] = useState(getCurrentRoleProfile());

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
    refreshRoleTabBar();
    loadBootstrap();
    setRoleModeState(getRoleMode());
    setRoleProfile(getCurrentRoleProfile());

    const feedback = consumeRegistrationFeedback();
    if (feedback?.message) {
      Taro.showToast({ title: feedback.message, icon: "success" });
    }
  });

  const registrationSummary = getRegistrationSummary(bootstrap);
  const bindingCompleted = registrationSummary.completed;
  const isTeacher = roleMode === "teacher";
  const titleName = isTeacher
    ? roleProfile?.displayName ?? "老师"
    : bootstrap.profile.maskedDisplayName;

  const handleLogout = async () => {
    const roleLabel = getAuthRole() === "teacher" ? "教师身份" : "学生身份";
    const result = await Taro.showModal({
      title: "退出登录",
      content: `退出后会清除本机${roleLabel}登录状态，下次进入需要重新登录。本操作不会删除历史记录。`,
      confirmText: "退出",
      cancelText: "取消"
    });

    if (!result.confirm) {
      return;
    }

    clearLocalStudentSession();
    setBootstrap(studentBootstrapFixture);
    setSetupState(getStudentSetupState());
    setRoleModeState(getRoleMode());
    setRoleProfile(getCurrentRoleProfile());
    Taro.showToast({ title: "已退出登录", icon: "success" });
    switchStudentTab("/pages/home/index");
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="我的"
        title="我的"
      />

      <View className="section-stack">
        <AppCard tone="accent" className={isTeacher ? "profile-summary-card teacher-profile-summary" : "profile-summary-card"}>
          <Text className="hero-eyebrow">{isTeacher ? "咨询老师" : "当前账号"}</Text>
          <Text className="section-title">{titleName}</Text>
          <Text className="section-copy">
            {isTeacher
              ? "咨询老师"
              : registrationSummary.blocking
              ? "未完成注册"
              : `${bootstrap.profile.college || "学院待补充"} / ${bootstrap.profile.schoolId || "学号待补充"}`}
          </Text>
        </AppCard>

        <AppCard>
          <SectionHeader title={isTeacher ? "账号设置" : "常用设置"} />
          <View className="menu-stack">
            {isTeacher ? (
              <>
                <ListCell
                  title="展示设置"
                  value="学生端可见"
                  actionText="进入"
                  onClick={() => Taro.navigateTo({ url: "/pages/teacher/profile/index" })}
                />
                <ListCell
                  title="身份信息"
                  value="咨询老师"
                  actionText="查看"
                  onClick={() => Taro.showToast({ title: "当前为教师身份", icon: "none" })}
                />
              </>
            ) : (
              <>
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
              </>
            )}
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
          <SectionHeader title="当前身份" />
          <View className="privacy-note">
            {isTeacher ? (
              <>
                <Text className="privacy-line">咨询老师</Text>
                <Text className="privacy-line">如需使用学生功能，请退出后重新登录。</Text>
              </>
            ) : (
              <>
                <Text className="privacy-line">
                  {bindingCompleted ? `学号：${bootstrap.profile.schoolId}` : "未绑定学号"}
                </Text>
                <Text className="privacy-line">
                  {bootstrap.profile.college ? `学院：${bootstrap.profile.college}` : "未补充学院"}
                </Text>
              </>
            )}
          </View>
        </AppCard>
      </View>
    </View>
  );
}
