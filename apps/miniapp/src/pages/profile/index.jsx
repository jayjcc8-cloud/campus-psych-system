import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import AppCard from "../../components/app-card";
import ListCell from "../../components/list-cell";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { switchStudentTab } from "../../lib/tabbar";

export default function ProfilePage() {
  return (
    <View className="page-shell">
      <PageHeader
        kicker="我的"
        title="把常用入口集中到这里"
        subtitle="保持轻量、私密和清晰，让你需要的时候能快速找到预约、说明和校园支持资源。"
      />

      <AppCard tone="accent" className="profile-hero">
        <View className="profile-avatar">心</View>
        <Text className="section-title">为自己保留一个温和、私密的支持入口。</Text>
        <Text className="section-copy">
          预约信息仅本人可见，页面默认不展示敏感身份字段，减少在公共场景下的暴露风险。
        </Text>
      </AppCard>

      <View className="section-stack">
        <AppCard>
          <SectionHeader title="常用入口" description="先放最常用的入口，避免把页面做得像运营中心。" />
          <View className="menu-stack">
            <ListCell
              title="我的预约"
              description="查看已提交预约与当前状态"
              actionText="进入"
              onClick={() => switchStudentTab("/pages/my/index")}
            />
            <ListCell
              title="身份绑定"
              description="后续会接入更完整的校内身份绑定流程"
              value="预留"
              actionText="待开放"
              onClick={() => Taro.showToast({ title: "身份绑定后续接入", icon: "none" })}
            />
            <ListCell
              title="隐私说明"
              description="了解预约信息如何被保护与展示"
              actionText="查看"
              onClick={() =>
                Taro.showModal({
                  title: "隐私说明",
                  content:
                    "预约信息仅用于校内心理咨询服务，默认仅本人和授权工作人员可见；页面不展示额外敏感身份字段。"
                })
              }
            />
            <ListCell
              title="用户协议"
              description="了解学生端预约、展示和服务边界"
              actionText="查看"
              onClick={() =>
                Taro.showModal({
                  title: "用户协议",
                  content:
                    "本平台用于校内心理预约与支持，不提供医疗诊断、药物建议或商业化咨询服务。请按页面提示完成预约并留意状态反馈。"
                })
              }
            />
            <ListCell
              title="紧急求助"
              description="查看校园心理中心与医院联系方式"
              actionText="前往"
              onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}
            />
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="隐私保护" description="默认只展示学生端真正需要看到的信息，不额外暴露敏感字段。" />
          <View className="privacy-note">
            <Text className="privacy-line">• 预约详情默认仅本人可见。</Text>
            <Text className="privacy-line">• 页面不展示额外敏感身份信息。</Text>
            <Text className="privacy-line">• 每次提交都会给出明确反馈，避免重复操作。</Text>
          </View>
        </AppCard>

        <AppCard>
          <SectionHeader title="当前服务体验" description="目前先把最核心的预约和说明链路做清楚，后续再补更多能力。" />
          <View className="privacy-note">
            <Text className="privacy-line">• 已支持查看预约、提交预约、取消预约和查看隐私说明。</Text>
            <Text className="privacy-line">• 页面保持校园支持场景，不使用医疗化表达。</Text>
            <Text className="privacy-line">• 后续会继续补协议确认与身份绑定。</Text>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
