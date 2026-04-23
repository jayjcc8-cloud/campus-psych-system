import { Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../../components/app-button";
import AppCard from "../../../components/app-card";
import EmptyState from "../../../components/empty-state";
import PageHeader from "../../../components/page-header";
import SectionHeader from "../../../components/section-header";
import { getStudentBootstrap, updateStudentProfile } from "../../../lib/api";
import { studentBootstrapFixture } from "../../../lib/fixtures";
import {
  clearPendingIntent
} from "../../../lib/navigation-intent";
import { saveRegistrationFeedback } from "../../../lib/registration-feedback";
import { getPendingSetupItems } from "../../../lib/student-setup";

export default function BindingProfilePage() {
  const [bootstrap, setBootstrap] = useState(studentBootstrapFixture);
  const [displayName, setDisplayName] = useState(studentBootstrapFixture.profile.displayName ?? "");
  const [college, setCollege] = useState(studentBootstrapFixture.profile.college ?? "");
  const [schoolId, setSchoolId] = useState(studentBootstrapFixture.profile.schoolId ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadBootstrap = () => {
    setLoading(true);
    setLoadError("");

    getStudentBootstrap()
      .then((response) => {
        setBootstrap(response);
        setDisplayName(response.profile.displayName ?? "");
        setCollege(response.profile.college ?? "");
        setSchoolId(response.profile.schoolId ?? "");
      })
      .catch(() => {
        setLoadError("注册信息暂时没有完全刷新，先展示当前可用内容。");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    clearPendingIntent();
    loadBootstrap();
  }, []);

  useDidShow(() => {
    loadBootstrap();
  });

  const handleSubmit = async () => {
    const normalizedDisplayName = displayName.trim();
    const normalizedCollege = college.trim();
    const normalizedSchoolId = schoolId.trim();

    if (normalizedDisplayName.length < 2) {
      Taro.showToast({ title: "请填写真实姓名", icon: "none" });
      return;
    }

    if (normalizedCollege.length < 2) {
      Taro.showToast({ title: "请填写所在学院", icon: "none" });
      return;
    }

    if (normalizedSchoolId.length < 4) {
      Taro.showToast({ title: "请填写正确的学号", icon: "none" });
      return;
    }

    setSaving(true);

    try {
      const profile = await updateStudentProfile({
        displayName: normalizedDisplayName,
        college: normalizedCollege,
        schoolId: normalizedSchoolId
      });

      setBootstrap((current) => ({
        ...current,
        profile,
        requirements: {
          ...current.requirements,
          studentIdBindingRequired: false
        }
      }));

      Taro.showToast({ title: "注册完成", icon: "success" });

      clearPendingIntent();
      saveRegistrationFeedback({
        message: "注册完成，已回到首页。"
      });

      Taro.redirectTo({ url: "/pages/binding/notices/index" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "注册失败，请稍后再试。";
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setSaving(false);
    }
  };

  const pendingSetupItems = getPendingSetupItems(bootstrap).filter((item) => item !== "binding");

  return (
    <View className="page-shell">
      <PageHeader
        kicker="注册信息"
        title="补齐资料"
      />

      {loading ? <Text className="inline-note">正在同步你的注册信息...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent" className="registration-hero-card">
          <View className="registration-hero-head">
            <View className="registration-hero-copy">
              <Text className="section-title">注册资料</Text>
            </View>
            <Text className="count-badge">第 2 步</Text>
          </View>
          <Text className="section-copy">完成后回到首页，可从首页继续预约。</Text>
        </AppCard>

        <AppCard className="registration-form-card">
          <SectionHeader title="注册信息" />
          <View className="form-stack">
            <View className="registration-field-block">
              <Text className="section-kicker">姓名</Text>
              <Text className="field-label">姓名</Text>
              <Input
                className="search-input"
                placeholder="请输入真实姓名"
                value={displayName}
                onInput={(event) => setDisplayName(event.detail.value)}
              />
            </View>

            <View className="registration-field-block">
              <Text className="section-kicker">学院</Text>
              <Text className="field-label">学院</Text>
              <Input
                className="search-input"
                placeholder="请输入所在学院"
                value={college}
                onInput={(event) => setCollege(event.detail.value)}
              />
            </View>

            <View className="registration-field-block">
              <Text className="section-kicker">学号</Text>
              <Text className="field-label">学号</Text>
              <Input
                className="search-input"
                placeholder="请输入校内学号"
                value={schoolId}
                onInput={(event) => setSchoolId(event.detail.value)}
              />
            </View>

            <AppButton
              className="registration-submit-button"
              loading={saving}
              disabled={!displayName.trim() || !college.trim() || !schoolId.trim()}
              onClick={handleSubmit}
            >
              {saving ? "提交中..." : "完成注册"}
            </AppButton>
          </View>
        </AppCard>

        {pendingSetupItems.length > 0 ? (
          <EmptyState title="下一步：服务说明" />
        ) : (
          <EmptyState title="资料已完成" />
        )}
      </View>
    </View>
  );
}
