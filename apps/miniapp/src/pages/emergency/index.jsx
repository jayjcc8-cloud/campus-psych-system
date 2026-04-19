import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
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
      <View className="section-card">
        <Text className="section-title">Emergency contacts</Text>
        <Text className="section-copy">This entry should stay visible and configurable in every release.</Text>
      </View>

      <View className="list-stack">
        {config.emergencyContacts.map((contact) => (
          <View className="contact-card" key={contact.phone}>
            <Text className="counselor-name">{contact.label}</Text>
            <Text className="contact-copy">{contact.phone}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
