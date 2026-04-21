import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { markStudentSetupAccepted } from "../../lib/student-setup";

export default function PrivacyPage() {
  const handleConfirm = () => {
    markStudentSetupAccepted("privacyAcceptedAt");
    Taro.showToast({ title: "已知晓隐私说明", icon: "success" });
    Taro.navigateBack({ delta: 1 });
  };

  return (
    <View className="page-shell">
      <PageHeader kicker="隐私说明" title="隐私说明" subtitle="我们只收集完成校内心理支持预约所必需的信息。" />

      <View className="section-stack">
        <AppCard tone="accent">
          <Text className="section-title">预约信息默认仅本人可见</Text>
          <Text className="section-copy">只有在校内授权支持流程需要时，工作人员才会按照权限查看相应记录。</Text>
        </AppCard>

        <AppCard>
          <SectionHeader title="我们会使用哪些信息" />
          <View className="notice-stack">
            <Text className="section-copy">1. 预约时间、咨询老师、问题类型和补充说明，用于安排咨询支持。</Text>
            <Text className="section-copy">2. 学号绑定信息仅用于校内身份校验，不会在学生端页面额外展示。</Text>
            <Text className="section-copy">3. 高风险流程涉及的处理记录仅用于校内跟进与审计留痕。</Text>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="不会做什么" />
          <View className="notice-stack">
            <Text className="section-copy">1. 不提供医疗诊断、药物建议或商业化咨询推荐。</Text>
            <Text className="section-copy">2. 不在学生端公开展示敏感身份字段或无关个人信息。</Text>
            <Text className="section-copy">3. 不将预约记录用于与校内支持无关的用途。</Text>
          </View>
        </AppCard>

        <AppButton onClick={handleConfirm}>我已知晓</AppButton>
      </View>
    </View>
  );
}
