import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getStudentBootstrap, phoneOneClickLogin } from "../../lib/api";
import { getAuthRole, getAuthSession } from "../../lib/auth-session";
import { studentBootstrapFixture } from "../../lib/fixtures";
import { clearPendingIntent } from "../../lib/navigation-intent";
import { saveRegistrationFeedback } from "../../lib/registration-feedback";
import { saveTeacherRoleSession } from "../../lib/role-mode";

export default function BindingPage() {
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [selectedRole, setSelectedRole] = useState(getAuthRole() === "teacher" ? "teacher" : "student");
  const [phoneLoggingIn, setPhoneLoggingIn] = useState(false);
  const [teacherLoggingIn, setTeacherLoggingIn] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasSession, setHasSession] = useState(Boolean(getAuthSession()));

  const loadBootstrap = () => {
    setLoadError("");
    setHasSession(Boolean(getAuthSession()));

    if (getAuthRole() === "teacher") {
      setSelectedRole("teacher");
    }

    getStudentBootstrap()
      .then(setBootstrap)
      .catch(() => {
        setLoadError("注册信息暂时没有完全刷新，先按当前步骤继续。");
      });
  };

  useEffect(() => {
    clearPendingIntent();
    loadBootstrap();
  }, []);

  useDidShow(() => {
    loadBootstrap();
  });

  const openProfileStep = () => {
    Taro.navigateTo({ url: "/pages/binding/profile/index" });
  };

  const handleTeacherLogin = async () => {
    setTeacherLoggingIn(true);

    try {
      saveTeacherRoleSession();
      saveRegistrationFeedback({ message: "已进入教师身份。" });
      Taro.showToast({ title: "教师登录成功", icon: "success" });
      Taro.switchTab({ url: "/pages/home/index" });
    } finally {
      setTeacherLoggingIn(false);
    }
  };

  const handlePhoneOneClickLogin = async (event) => {
    const detail = event?.detail ?? {};

    if (!detail?.code) {
      const message =
        detail?.errCode === 10001021
          ? "这个一键登录凭证已经使用过，请重新发起。"
          : detail?.errMsg || "本机号码一键登录没有成功，请稍后再试。";

      Taro.showToast({ title: message, icon: "none" });
      return;
    }

    setPhoneLoggingIn(true);

    try {
      await phoneOneClickLogin(detail.code);
      setHasSession(true);
      saveRegistrationFeedback({ message: "登录完成，继续填写注册信息。" });
      Taro.showToast({ title: "登录成功", icon: "success" });
      openProfileStep();
    } catch (error) {
      const message = error instanceof Error ? error.message : "本机号码登录失败，请稍后再试。";
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setPhoneLoggingIn(false);
    }
  };

  const profileCompleted = Boolean(
    bootstrap.profile.displayName?.trim() &&
      bootstrap.profile.college?.trim() &&
      bootstrap.profile.schoolId?.trim()
  );

  return (
    <View className="page-shell">
      <PageHeader
        kicker="注册登录"
        title="选择身份后继续"
      />

      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent" className="registration-hero-card">
          <View className="registration-hero-head">
            <View className="registration-hero-copy">
              <Text className="section-title">登录身份</Text>
            </View>
            <Text className="count-badge">{selectedRole === "teacher" ? "教师" : "学生"}</Text>
          </View>

          <View className="role-choice-grid">
            <AppButton
              className={selectedRole === "student" ? "role-choice-card is-active" : "role-choice-card"}
              variant="soft"
              onClick={() => setSelectedRole("student")}
            >
              <View className="role-choice-content">
                <Text className="role-choice-title">学生</Text>
                <Text className="role-choice-desc">预约咨询、查看记录</Text>
              </View>
            </AppButton>
            <AppButton
              className={selectedRole === "teacher" ? "role-choice-card is-active" : "role-choice-card"}
              variant="soft"
              onClick={() => setSelectedRole("teacher")}
            >
              <View className="role-choice-content">
                <Text className="role-choice-title">咨询老师</Text>
                <Text className="role-choice-desc">排期、预约和展示设置</Text>
              </View>
            </AppButton>
          </View>

          {selectedRole === "student" ? (
            <View className="registration-step-row">
              <View className={hasSession ? "registration-step is-complete" : "registration-step is-active"}>
                <Text className="registration-step-index">1</Text>
                <Text className="registration-step-label">微信登录</Text>
              </View>
              <View className={profileCompleted ? "registration-step is-complete" : "registration-step"}>
                <Text className="registration-step-index">2</Text>
                <Text className="registration-step-label">填写资料</Text>
              </View>
              <View className={profileCompleted ? "registration-step is-complete" : "registration-step"}>
                <Text className="registration-step-index">3</Text>
                <Text className="registration-step-label">开始使用</Text>
              </View>
            </View>
          ) : null}

          {selectedRole === "student" ? <Text className="section-copy">完成后回到首页，可从首页继续预约。</Text> : null}
        </AppCard>

        {selectedRole === "student" ? (
          <AppCard className="registration-login-card">
            <SectionHeader title="学生登录" />
            <View className="form-stack">
              <AppButton
                className="registration-login-button"
                loading={phoneLoggingIn}
                openType="phoneOneClickLogin"
                onPhoneOneClickLogin={handlePhoneOneClickLogin}
              >
                {phoneLoggingIn ? "登录中..." : "本机号码一键登录"}
              </AppButton>
              <AppButton className="registration-submit-button" variant="soft" onClick={openProfileStep}>
                {hasSession ? "继续填写注册信息" : "暂时跳过，直接填写资料"}
              </AppButton>
              <Text className="form-helper-text">开发环境可先手动填写资料。</Text>
            </View>
          </AppCard>
        ) : (
          <AppCard className="registration-login-card">
            <SectionHeader title="教师登录" />
            <View className="form-stack">
              <AppButton
                className="registration-login-button"
                loading={teacherLoggingIn}
                onClick={handleTeacherLogin}
              >
                {teacherLoggingIn ? "进入中..." : "进入老师端"}
              </AppButton>
              <Text className="form-helper-text">联调版使用本地教师身份。</Text>
            </View>
          </AppCard>
        )}
      </View>
    </View>
  );
}
