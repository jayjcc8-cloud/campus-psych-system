import { appointmentsFixture } from "@campus-psych/domain";
import { View, Text } from "@tarojs/components";

export default function AppointmentPage() {
  const nextAppointment = appointmentsFixture[0];

  return (
    <View className="page-shell">
      <View className="booking-card">
        <Text className="section-title">Appointment draft</Text>
        <Text className="booking-meta">This page is reserved for slot selection, remarks, and consent confirmation.</Text>
        <Text className="pill">Default mode: offline</Text>
        {nextAppointment ? (
          <Text className="booking-meta">
            Fixture example: {nextAppointment.issueEntryType} / {nextAppointment.status}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

