import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { markStudentSetupAccepted } from "../../lib/student-setup";

export default function AgreementPage() {
  const handleConfirm = () => {
    markStudentSetupAccepted("agreementAcceptedAt");
    Taro.showToast({ title: "已确认用户协议", icon: "success" });
    Taro.navigateBack({ delta: 1 });
  };

  return (
    <View className="page-shell">
      <PageHeader kicker="用户协议" title="用户协议" subtitle="本平台用于校园心理预约与支持，不替代医疗服务。" />

      <View className="section-stack">
        <AppCard tone="accent">
          <Text className="section-title">这是校内支持平台</Text>
          <Text className="section-copy">你可以在这里预约咨询老师、查看状态和获取紧急求助入口。</Text>
        </AppCard>

        <AppCard>
          <SectionHeader title="使用边界" />
          <View className="notice-stack">
            <Text className="section-copy">1. 平台用于校内心理支持预约和后续状态跟进。</Text>
            <Text className="section-copy">2. 平台不提供医疗诊断、处方或商业付费服务。</Text>
            <Text className="section-copy">3. 如遇紧急情况，请优先使用“紧急求助”页提供的校园资源。</Text>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="使用约定" />
          <View className="notice-stack">
            <Text className="section-copy">1. 请尽量提供真实、清晰的预约信息，便于老师理解当前困扰。</Text>
            <Text className="section-copy">2. 请留意预约状态变化，无法参加时及时取消。</Text>
            <Text className="section-copy">3. 涉及校内风险处置时，平台会保留必要审计记录。</Text>
          </View>
        </AppCard>

        <AppButton onClick={handleConfirm}>我同意并继续使用</AppButton>
      </View>
    </View>
  );
}
