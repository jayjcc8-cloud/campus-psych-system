import { View, Text } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { getMyAppointments } from "../../lib/api";
import { appointmentsFixture } from "../../lib/fixtures";

export default function MyPage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);

  const loadAppointments = () => {
    getMyAppointments()
      .then(setAppointments)
      .catch(() => {
        return;
      });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useDidShow(() => {
    loadAppointments();
  });

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
            <Text className="booking-meta">Counselor: {appointment.counselorId}</Text>
            <Text className="booking-meta">Status: {appointment.status}</Text>
            <Text className="booking-meta">Issue: {appointment.issueEntryType}</Text>
            <Text className="booking-meta">Remark: {appointment.remark ?? "None"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
