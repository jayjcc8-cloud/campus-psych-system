import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import AppButton from "../../components/app-button";
import AppCard from "../../components/app-card";
import PageHeader from "../../components/page-header";
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
        title="紧急求助"
        subtitle="如情况紧急，请优先联系校园资源并及时求助。"
      />

      <AppCard tone="accent" className="emergency-intro-card">
        <Text className="section-title">需要立即帮助时</Text>
        <Text className="section-copy">优先拨打下方电话，或直接联系校内支持资源。</Text>
      </AppCard>

      <View className="list-stack">
        {config.emergencyContacts.map((contact) => (
          <AppCard className="contact-card" key={contact.phone}>
            <Text className="section-title">{contact.label}</Text>
            <Text className="section-copy">{contact.phone}</Text>
            <AppButton onClick={() => handleCall(contact.phone)}>一键拨号</AppButton>
          </AppCard>
        ))}
      </View>
    </View>
  );
}
