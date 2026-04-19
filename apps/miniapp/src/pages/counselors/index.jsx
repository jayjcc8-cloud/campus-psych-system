import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import { getCounselors } from "../../lib/api";
import { counselorsFixture } from "../../lib/fixtures";
import { consumePreferredIssueType } from "../../lib/tabbar";

export default function CounselorsPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [keyword, setKeyword] = useState("");
  const [preferredIssueType, setPreferredIssueType] = useState(router.params.issueType ?? "");

  useEffect(() => {
    getCounselors()
      .then(setCounselors)
      .catch(() => {
        return;
      });
  }, []);

  useDidShow(() => {
    const storedIssueType = consumePreferredIssueType();
    setPreferredIssueType(storedIssueType || router.params.issueType || "");
  });

  const openBooking = (counselorId) => {
    const issueParam = preferredIssueType ? `&issueType=${preferredIssueType}` : "";
    Taro.navigateTo({ url: `/pages/appointment/index?counselorId=${counselorId}${issueParam}` });
  };

  const filteredCounselors = counselors.filter((counselor) => {
    const query = keyword.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      counselor.displayName.toLowerCase().includes(query) ||
      counselor.specialty.some((item) => item.toLowerCase().includes(query))
    );
  });

  return (
    <View className="page-shell">
      <AppCard tone="accent">
        <Text className="section-kicker">咨询师列表</Text>
        <Text className="section-title">选择一位让你更安心的咨询师。</Text>
        <Text className="section-copy">先看擅长方向和可预约状态，再决定下一步，减少反复比较的负担。</Text>
        {preferredIssueType ? (
          <Text className="inline-note">推荐问题类型：{preferredIssueType}</Text>
        ) : null}
      </AppCard>

      <View className="search-box">
        <Input
          className="search-input"
          placeholder="搜索姓名或擅长领域"
          value={keyword}
          onInput={(event) => setKeyword(event.detail.value)}
        />
      </View>

      <View className="list-stack">
        {filteredCounselors.map((counselor) => (
          <AppCard key={counselor.id} className="counselor-card">
            <View className="counselor-card-header">
              <View className="avatar-badge">{counselor.displayName.slice(0, 1)}</View>
              <View className="counselor-card-body">
                <Text className="counselor-name">{counselor.displayName}</Text>
                <Text className="counselor-meta">{counselor.intro}</Text>
              </View>
            </View>
            <View className="specialty-row">
              {counselor.specialty.map((item) => (
                <Text className="specialty-pill" key={item}>
                  {item}
                </Text>
              ))}
            </View>
            <Text className="section-copy">可预约状态：{counselor.nextAvailableSlot ? "可预约" : "暂未开放"}</Text>
            <Text className="section-copy">最近可用时间：{counselor.nextAvailableSlot ?? "暂无排班"}</Text>
            <AppButton disabled={!counselor.nextAvailableSlot} onClick={() => openBooking(counselor.id)}>
              预约 {counselor.displayName}
            </AppButton>
          </AppCard>
        ))}
        {filteredCounselors.length === 0 ? <Text className="empty-state">没有找到匹配的咨询师，可以换个关键词试试。</Text> : null}
      </View>
    </View>
  );
}
