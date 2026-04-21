import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getStudentBootstrap, phoneOneClickLogin } from "../../lib/api";
import { getAuthSession } from "../../lib/auth-session";
import { studentBootstrapFixture } from "../../lib/fixtures";
import { peekPendingIntent } from "../../lib/navigation-intent";
import { saveRegistrationFeedback } from "../../lib/registration-feedback";

export default function BindingPage() {
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [phoneLoggingIn, setPhoneLoggingIn] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasSession, setHasSession] = useState(Boolean(getAuthSession()));
  const [pendingIntent] = useState(peekPendingIntent());

  const loadBootstrap = () => {
    setLoadError("");
    setHasSession(Boolean(getAuthSession()));

    getStudentBootstrap()
      .then(setBootstrap)
      .catch(() => {
        setLoadError("注册信息暂时没有完全刷新，先按当前步骤继续。");
      });
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  useDidShow(() => {
    loadBootstrap();
  });

  const openProfileStep = () => {
    Taro.navigateTo({ url: "/pages/binding/profile/index" });
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
        title="先完成登录，再继续填写资料"
        subtitle="首次进入先走完这一步，后面预约、查看记录和个人中心都会顺很多。"
      />

      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent" className="registration-hero-card">
          <View className="registration-hero-head">
            <View className="registration-hero-copy">
              <Text className="section-title">注册流程</Text>
              <Text className="section-copy">
                先完成微信登录，再补齐姓名、学院和学号，后面就能正常使用功能。
              </Text>
            </View>
            <Text className="count-badge">第 1 步</Text>
          </View>

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

          {pendingIntent ? (
            <Text className="section-copy">完成后会自动回到你刚才想进入的功能页面。</Text>
          ) : null}
        </AppCard>

        <AppCard className="registration-login-card">
          <SectionHeader title="第 1 步：微信登录" />
          <Text className="section-copy">如果已经开通微信身份管理，可以直接用本机号码快速完成登录。</Text>
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
            <Text className="form-helper-text">
              登录成功后会自动进入下一步；如果当前开发环境还没开通，也可以先手动补齐资料。
            </Text>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
