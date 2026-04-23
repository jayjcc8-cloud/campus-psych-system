import { Text, Textarea, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../../components/app-button";
import AppCard from "../../../components/app-card";
import PageHeader from "../../../components/page-header";
import SectionHeader from "../../../components/section-header";
import { isTeacherSession } from "../../../lib/auth-session";
import { formatIssueType } from "../../../lib/display";
import {
  getTeacherWorkspace,
  updateTeacherProfile
} from "../../../lib/teacher-api";
import { teacherIssueOptions } from "../../../lib/teacher-workspace";

export default function TeacherProfilePage() {
  const [workspace, setWorkspace] = useState({ counselor: null, schedules: [] });
  const [intro, setIntro] = useState("");
  const [specialty, setSpecialty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = () => {
    if (!isTeacherSession()) {
      Taro.redirectTo({ url: "/pages/binding/index" });
      return;
    }

    setLoading(true);
    setLoadError("");

    getTeacherWorkspace()
      .then((response) => {
        setWorkspace(response);
        setIntro(response.counselor?.intro ?? "");
        setSpecialty(response.counselor?.specialty ?? []);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "展示信息暂时没有完全刷新。");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useDidShow(() => {
    loadProfile();
  });

  const toggleSpecialty = (issueType) => {
    setSpecialty((current) =>
      current.includes(issueType)
        ? current.filter((item) => item !== issueType)
        : [...current, issueType]
    );
  };

  const handleSaveProfile = async () => {
    if (intro.trim().length < 8 || specialty.length === 0) {
      Taro.showToast({ title: "请补充简介和擅长方向", icon: "none" });
      return;
    }

    setSaving(true);
    setLoadError("");

    try {
      const counselor = await updateTeacherProfile({
        intro: intro.trim(),
        specialty
      });

      setWorkspace((current) => ({
        ...current,
        counselor
      }));
      Taro.showToast({ title: "已同步学生端", icon: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "展示信息保存失败。";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="展示设置"
        title="展示设置"
      />

      {loading ? <Text className="inline-note">正在同步展示信息...</Text> : null}
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="section-stack">
        <AppCard tone="accent">
          <SectionHeader
            title={workspace.counselor?.displayName ? `${workspace.counselor.displayName} 的展示信息` : "我的展示信息"}
            extra={<Text className="count-badge">学生端可见</Text>}
          />
          <View className="form-stack">
            <Text className="field-label">简介</Text>
            <Textarea
              className="form-textarea"
              maxlength={300}
              placeholder="写一段学生能看到的简短介绍"
              value={intro}
              onInput={(event) => setIntro(event.detail.value)}
            />
            <Text className="field-label">擅长方向</Text>
            <View className="chip-grid">
              {teacherIssueOptions.map((issueType) => (
                <AppButton
                  className={specialty.includes(issueType) ? "selector-chip is-active" : "selector-chip"}
                  key={issueType}
                  variant="soft"
                  onClick={() => toggleSpecialty(issueType)}
                >
                  {formatIssueType(issueType)}
                </AppButton>
              ))}
            </View>
            <AppButton loading={saving} onClick={handleSaveProfile}>
              {saving ? "保存中..." : "保存展示信息"}
            </AppButton>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="学生端展示预览" />
          <View className="teacher-preview-card">
            <Text className="section-title">{workspace.counselor?.displayName || "咨询老师"}</Text>
            <Text className="section-copy">{intro || "暂无简介"}</Text>
            <View className="specialty-row">
              {specialty.map((issueType) => (
                <Text className="specialty-pill" key={issueType}>
                  {formatIssueType(issueType)}
                </Text>
              ))}
            </View>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
