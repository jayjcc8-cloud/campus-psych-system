import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppCard from "../../components/app-card";
import AppButton from "../../components/app-button";
import PageHeader from "../../components/page-header";
import SectionHeader from "../../components/section-header";
import { getPublicConfig } from "../../lib/api";
import { publicConfigFixture } from "../../lib/fixtures";

export default function EmergencyPage() {
  const [config, setConfig] = useState(publicConfigFixture);

  useEffect(() => {
    getPublicConfig()
      .then(setConfig)
      .catch(() => {
        return;
      });
  }, []);

  const handleCall = (phone) => {
    Taro.makePhoneCall({ phoneNumber: phone }).catch(() => {
      Taro.showToast({ title: "当前无法直接拨号", icon: "none" });
    });
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="紧急求助"
        title="如果你现在需要更及时的支持"
        subtitle="请优先联系下面的校园支持资源。这个页面会保持清晰和直接，帮助你尽快找到人。"
      />

      <AppCard tone="accent">
        <SectionHeader title="优先联系校园资源" description="如果你感到非常难受、失去控制，或者需要立刻有人回应，请直接使用下面的联系方式。" />
        <Text className="inline-note">若情况紧急，请优先联系身边可信任的老师、同学或当地急救资源。</Text>
      </AppCard>

      <View className="list-stack">
        {config.emergencyContacts.map((contact) => (
          <AppCard className="contact-card" key={contact.phone}>
            <SectionHeader title={contact.label} description={contact.phone} />
            <AppButton onClick={() => handleCall(contact.phone)}>一键拨号</AppButton>
          </AppCard>
        ))}
      </View>
    </View>
  );
}
