import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import AppCard from "../../components/app-card";
import MenuItem from "../../components/menu-item";
import { switchStudentTab } from "../../lib/tabbar";

export default function ProfilePage() {
  return (
    <View className="page-shell">
      <AppCard tone="accent" className="profile-hero">
        <View className="profile-avatar">心</View>
        <Text className="section-kicker">我的</Text>
        <Text className="section-title">为自己保留一个温和、私密的支持入口。</Text>
        <Text className="section-copy">
          预约信息仅本人可见，页面默认不展示敏感身份字段，减少在公共场景下的暴露风险。
        </Text>
      </AppCard>

      <View className="section-stack">
        <AppCard>
          <Text className="section-title">常用入口</Text>
          <View className="menu-stack">
            <MenuItem
              title="我的预约"
              description="查看已提交预约与当前状态"
              onClick={() => switchStudentTab("/pages/my/index")}
            />
            <MenuItem
              title="隐私说明"
              description="了解预约信息如何被保护与展示"
              onClick={() =>
                Taro.showModal({
                  title: "隐私说明",
                  content:
                    "预约信息仅用于校内心理咨询服务，默认仅本人和授权工作人员可见；页面不展示额外敏感身份字段。"
                })
              }
            />
            <MenuItem
              title="紧急求助"
              description="查看校园心理中心与医院联系方式"
              onClick={() => Taro.navigateTo({ url: "/pages/emergency/index" })}
            />
            <MenuItem
              title="设置"
              description="当前 MVP 暂未开放更多个性化设置"
              onClick={() => Taro.showToast({ title: "敬请期待", icon: "none" })}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text className="section-title">隐私保护</Text>
          <View className="privacy-note">
            <Text className="privacy-line">• 预约详情默认仅本人可见。</Text>
            <Text className="privacy-line">• 页面不展示额外敏感身份信息。</Text>
            <Text className="privacy-line">• 每次提交都会给出明确反馈，避免重复操作。</Text>
          </View>
        </AppCard>
      </View>
    </View>
  );
}
