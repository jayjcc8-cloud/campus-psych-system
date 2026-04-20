import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppCard from "../../components/app-card";
import CounselorCard from "../../components/counselor-card";
import EmptyState from "../../components/empty-state";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getCounselors } from "../../lib/api";
import { formatIssueType } from "../../lib/display";
import { counselorsFixture } from "../../lib/fixtures";
import { consumePreferredIssueType } from "../../lib/tabbar";

export default function CounselorsPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [keyword, setKeyword] = useState("");
  const [preferredIssueType, setPreferredIssueType] = useState(router.params.issueType ?? "");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    getCounselors()
      .then(setCounselors)
      .catch(() => {
        setLoadError("咨询师列表暂时没有完全刷新，已展示本地可用信息。");
      })
      .finally(() => {
        setLoading(false);
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
      <PageHeader
        kicker="咨询师"
        title="选择一位让你更安心的咨询老师"
        subtitle="先看擅长方向和可预约状态，再进入预约页确认时间，不需要反复比较太多信息。"
      />

      <AppCard tone="accent">
        <SectionHeader
          title="简洁浏览"
          description="这里不会出现评分、价格或商业化信息，只保留和校园心理支持最相关的内容。"
        />
        {preferredIssueType ? <Text className="inline-note">当前推荐主题：{formatIssueType(preferredIssueType)}</Text> : null}
      </AppCard>

      <View className="search-box">
        <Input
          className="search-input"
          placeholder="搜索姓名或擅长领域"
          value={keyword}
          onInput={(event) => setKeyword(event.detail.value)}
        />
      </View>

      <View className="tag-row list-meta-row">
        <Text className="inline-note">{loading ? "正在获取咨询师信息..." : `共 ${filteredCounselors.length} 位咨询师`}</Text>
        {preferredIssueType ? <Text className="inline-note">已按推荐问题类型辅助筛选</Text> : null}
      </View>
      {loadError ? <Text className="error-banner">{loadError}</Text> : null}

      <View className="list-stack">
        {filteredCounselors.map((counselor) => (
          <CounselorCard counselor={counselor} key={counselor.id} onBook={() => openBooking(counselor.id)} />
        ))}
        {!loading && filteredCounselors.length === 0 ? (
          <EmptyState title="暂时没有匹配结果" description="没有找到匹配的咨询师，可以换个关键词，或者直接浏览全部咨询老师。" />
        ) : null}
      </View>
    </View>
  );
}
