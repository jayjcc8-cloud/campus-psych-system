import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { markStudentSetupAccepted } from "../../lib/student-setup";

export default function ConsentPage() {
  const handleConfirm = () => {
    markStudentSetupAccepted("consentAcceptedAt");
    Taro.showToast({ title: "已确认知情提示", icon: "success" });
    Taro.navigateBack({ delta: 1 });
  };

  return (
    <View className="page-shell">
      <PageHeader kicker="知情提示" title="知情提示" subtitle="开始预约前，我们希望把支持方式和应急边界说明清楚。" />

      <View className="section-stack">
        <AppCard tone="accent">
          <Text className="section-title">咨询支持以预约状态为准</Text>
          <Text className="section-copy">提交预约后，请以待确认、已确认、已完成等状态变化为准，不要默认已经排上。</Text>
        </AppCard>

        <AppCard>
          <SectionHeader title="你需要知道" />
          <View className="notice-stack">
            <Text className="section-copy">1. 咨询老师会根据预约状态安排支持，不保证即时响应。</Text>
            <Text className="section-copy">2. 如你的情况涉及明显安全风险，平台会进入校内跟进流程。</Text>
            <Text className="section-copy">3. 如你一时说不清全部情况，也可以先从一个最接近当下感受的主题开始。</Text>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="何时优先使用紧急求助" />
          <View className="notice-stack">
            <Text className="section-copy">1. 当你需要立刻与校内支持资源取得联系时。</Text>
            <Text className="section-copy">2. 当你认为等待预约确认已经不适合当前情况时。</Text>
            <Text className="section-copy">3. 当你希望获得即时线下协助时。</Text>
          </View>
        </AppCard>

        <AppButton onClick={handleConfirm}>我已了解</AppButton>
      </View>
    </View>
  );
}
