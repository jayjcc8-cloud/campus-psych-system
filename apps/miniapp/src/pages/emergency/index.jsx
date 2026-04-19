import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import AppCard from "../../components/app-card";
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

  return (
    <View className="page-shell">
      <AppCard tone="accent">
        <Text className="section-kicker">紧急求助</Text>
        <Text className="section-title">如果你现在需要更及时的支持，请优先联系下面的校园资源。</Text>
        <Text className="section-copy">这个入口会始终保留在学生端，帮助用户在高压力时刻快速找到人。</Text>
      </AppCard>

      <View className="list-stack">
        {config.emergencyContacts.map((contact) => (
          <AppCard className="contact-card" key={contact.phone}>
            <Text className="counselor-name">{contact.label}</Text>
            <Text className="contact-copy">{contact.phone}</Text>
          </AppCard>
        ))}
      </View>
    </View>
  );
}
