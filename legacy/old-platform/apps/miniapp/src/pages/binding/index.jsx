import { Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getStudentBootstrap, loginTeacher, phoneOneClickLogin } from "../../lib/api";
import { getAuthSession } from "../../lib/auth-session";
import { studentBootstrapFixture } from "../../lib/fixtures";
import { clearPendingIntent } from "../../lib/navigation-intent";
import { saveRegistrationFeedback } from "../../lib/registration-feedback";

export default function BindingPage() {
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [phoneLoggingIn, setPhoneLoggingIn] = useState(false);
  const [testLoggingInRole, setTestLoggingInRole] = useState("");
  const [teacherLoggingIn, setTeacherLoggingIn] = useState(false);
  const [showTeacherFallback, setShowTeacherFallback] = useState(false);
  const [teacherDisplayName, setTeacherDisplayName] = useState("");
  const [teacherWorkId, setTeacherWorkId] = useState("");
  const [teacherCollege, setTeacherCollege] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [loadError, setLoadError] = useState("");
  const [hasSession, setHasSession] = useState(Boolean(getAuthSession()));

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
    const normalizedDisplayName = teacherDisplayName.trim();
    const normalizedWorkId = teacherWorkId.trim();
    const normalizedCollege = teacherCollege.trim();

    if (normalizedDisplayName.length < 2) {
      Taro.showToast({ title: "请填写教师姓名", icon: "none" });
      return;
    }

    if (normalizedWorkId.length < 2) {
      Taro.showToast({ title: "请填写工号", icon: "none" });
      return;
    }

    if (normalizedCollege.length < 2) {
      Taro.showToast({ title: "请填写所属中心", icon: "none" });
      return;
    }

    if (teacherPhone.trim().length < 8) {
      Taro.showToast({ title: "请填写已登记手机号", icon: "none" });
      return;
    }

    setTeacherLoggingIn(true);

    try {
      const session = await loginTeacher({
        displayName: normalizedDisplayName,
        workId: normalizedWorkId,
        college: normalizedCollege,
        phone: teacherPhone.trim()
      });
      setHasSession(true);
      routeAfterLogin(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "教师登录失败，请稍后再试。";
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setTeacherLoggingIn(false);
    }
  };

  const routeAfterLogin = (session) => {
    if (session?.role === "teacher" || session?.role === "counselor") {
      saveRegistrationFeedback({ message: "教师身份已确认。" });
      Taro.showToast({ title: "登录成功", icon: "success" });
      Taro.switchTab({ url: "/pages/home/index" });
      return;
    }

    const profile = session?.profile ?? {};
    const completed = Boolean(profile.displayName?.trim() && profile.college?.trim() && profile.schoolId?.trim());

    if (completed) {
      saveRegistrationFeedback({ message: "欢迎回来。" });
      Taro.showToast({ title: "登录成功", icon: "success" });
      Taro.switchTab({ url: "/pages/home/index" });
      return;
    }

    saveRegistrationFeedback({ message: "登录完成，继续填写注册信息。" });
    Taro.showToast({ title: "登录成功", icon: "success" });
    openProfileStep();
  };

  const handlePhoneOneClickLogin = async (event, roleHint) => {
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
      const session = await phoneOneClickLogin(detail.code, { roleHint });
      setHasSession(true);
      routeAfterLogin(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "本机号码登录失败，请稍后再试。";
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setPhoneLoggingIn(false);
    }
  };

  const handleTestLogin = async (roleHint) => {
    setTestLoggingInRole(roleHint);

    try {
      const session = await phoneOneClickLogin(
        roleHint === "teacher" ? "mock-teacher-code" : "mock-student-code",
        { roleHint }
      );

      setHasSession(true);
      routeAfterLogin(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "测试身份进入失败，请稍后再试。";
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setTestLoggingInRole("");
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
        title="一键登录"
      />

      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent" className="registration-hero-card">
          <View className="hero-copy-block">
            <Text className="hero-eyebrow">校园身份</Text>
            <Text className="hero-title">用本机号码进入</Text>
            <Text className="hero-copy">系统会自动识别学生或咨询老师身份；未注册时再补齐必要资料。</Text>
          </View>
          <View className="registration-hero-head">
            <View className="registration-hero-copy">
              <Text className="section-title">登录流程</Text>
            </View>
            <Text className="count-badge">{hasSession ? "已登录" : "待登录"}</Text>
          </View>

          <View className="registration-step-row">
            <View className={hasSession ? "registration-step is-complete" : "registration-step is-active"}>
              <Text className="registration-step-index">1</Text>
              <Text className="registration-step-label">号码登录</Text>
            </View>
            <View className={hasSession ? "registration-step is-complete" : "registration-step"}>
              <Text className="registration-step-index">2</Text>
              <Text className="registration-step-label">识别身份</Text>
            </View>
            <View className={profileCompleted ? "registration-step is-complete" : "registration-step"}>
              <Text className="registration-step-index">3</Text>
              <Text className="registration-step-label">开始使用</Text>
            </View>
          </View>

          <Text className="section-copy">已注册用户会直接进入对应首页；首次使用才需要补充资料。</Text>
        </AppCard>

        <AppCard className="registration-login-card">
          <SectionHeader title="一键登录" description="无需先选择学生或老师身份。" />
          <View className="form-stack">
            <AppButton
              className="registration-login-button"
              loading={phoneLoggingIn}
              openType="phoneOneClickLogin"
              onPhoneOneClickLogin={handlePhoneOneClickLogin}
            >
              {phoneLoggingIn ? "登录中..." : "本机号码一键登录"}
            </AppButton>
            <AppButton
              className="registration-submit-button"
              variant="soft"
              onClick={() => setShowTeacherFallback((current) => !current)}
            >
              {showTeacherFallback ? "收起教师身份验证" : "教师身份未识别？"}
            </AppButton>
            <Text className="form-helper-text">如果已注册，登录后会直接进入对应首页。</Text>
          </View>
        </AppCard>

        <AppCard className="registration-login-card">
          <SectionHeader title="测试身份" description="微信本机号码能力未打通时用于本地验收。" />
          <View className="teacher-action-row">
            <AppButton
              block={false}
              loading={testLoggingInRole === "student"}
              variant="soft"
              onClick={() => handleTestLogin("student")}
            >
              {testLoggingInRole === "student" ? "进入中..." : "学生身份进入"}
            </AppButton>
            <AppButton
              block={false}
              loading={testLoggingInRole === "teacher"}
              variant="soft"
              onClick={() => handleTestLogin("teacher")}
            >
              {testLoggingInRole === "teacher" ? "进入中..." : "教师身份进入"}
            </AppButton>
          </View>
        </AppCard>

        {showTeacherFallback ? (
          <AppCard className="registration-login-card">
            <SectionHeader
              title="教师身份验证"
              description="仅用于核对后台已开通的教师名单。"
              extra={<Text className="count-badge">{teacherDisplayName.trim() ? "已填写姓名" : "待填写"}</Text>}
            />
            <View className="form-stack">
              <View className="registration-field-block">
                <Text className="field-label">教师姓名</Text>
                <Input
                  className="search-input"
                  placeholder="请输入教师姓名"
                  value={teacherDisplayName}
                  onInput={(event) => setTeacherDisplayName(event.detail.value)}
                />
              </View>
              <View className="registration-field-block">
                <Text className="field-label">工号</Text>
                <Input
                  className="search-input"
                  placeholder="请输入校内工号"
                  value={teacherWorkId}
                  onInput={(event) => setTeacherWorkId(event.detail.value)}
                />
              </View>
              <View className="registration-field-block">
                <Text className="field-label">所属中心</Text>
                <Input
                  className="search-input"
                  placeholder="例如：心理健康教育中心"
                  value={teacherCollege}
                  onInput={(event) => setTeacherCollege(event.detail.value)}
                />
              </View>
              <View className="registration-field-block">
                <Text className="field-label">已登记手机号</Text>
                <Input
                  className="search-input"
                  placeholder="请输入后台预留手机号"
                  type="number"
                  value={teacherPhone}
                  onInput={(event) => setTeacherPhone(event.detail.value)}
                />
              </View>
              <AppButton
                className="registration-login-button"
                loading={teacherLoggingIn}
                disabled={!teacherDisplayName.trim() || !teacherWorkId.trim() || !teacherCollege.trim() || !teacherPhone.trim()}
                onClick={handleTeacherLogin}
              >
                {teacherLoggingIn ? "登录中..." : "确认教师身份并进入"}
              </AppButton>
              <Text className="form-helper-text">只有后台已开通且手机号匹配的教师账号可以进入教师端。</Text>
            </View>
          </AppCard>
        ) : null}
      </View>
    </View>
  );
}
