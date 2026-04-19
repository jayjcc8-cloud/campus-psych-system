import { appointmentsFixture } from "@campus-psych/domain";
import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getMyAppointments } from "../../lib/api";

export default function MyPage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);

  useEffect(() => {
    void getMyAppointments()
      .then(setAppointments)
      .catch(() => {
        return;
      });
  }, []);

  return (
    <View className="page-shell">
      <View className="section-card">
        <Text className="section-title">My appointments</Text>
        <Text className="section-copy">Separate records by pending, confirmed, completed, cancelled, and no-show.</Text>
      </View>

      <View className="list-stack">
        {appointments.map((appointment) => (
          <View className="booking-card" key={appointment.id}>
            <Text className="counselor-name">{appointment.id}</Text>
            <Text className="booking-meta">Status: {appointment.status}</Text>
            <Text className="booking-meta">Issue: {appointment.issueEntryType}</Text>
            <Text className="booking-meta">Remark: {appointment.remark ?? "None"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
