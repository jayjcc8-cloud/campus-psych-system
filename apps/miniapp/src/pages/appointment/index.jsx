import { View, Text, Button, Textarea } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { createAppointment, getCounselorDetail, getCounselors } from "../../lib/api";
import { counselorsFixture, scheduleFixture } from "../../lib/fixtures";

const issueOptions = [
  { value: "academic_pressure", label: "Academic pressure" },
  { value: "sleep", label: "Sleep" },
  { value: "relationship", label: "Relationship" },
  { value: "emotion", label: "Emotion" },
  { value: "career", label: "Career" },
  { value: "other", label: "Other" }
];

export default function AppointmentPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [selectedCounselorId, setSelectedCounselorId] = useState(router.params.counselorId ?? counselorsFixture[0]?.id ?? "");
  const [schedules, setSchedules] = useState(scheduleFixture);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [issueType, setIssueType] = useState(router.params.issueType ?? "academic_pressure");
  const [remark, setRemark] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCounselors()
      .then((response) => {
        setCounselors(response);
        if (!selectedCounselorId && response[0]) {
          setSelectedCounselorId(response[0].id);
        }
      })
      .catch(() => {
        return;
      });
  }, []);

  useDidShow(() => {
    const queryCounselorId = router.params.counselorId;
    const queryIssueType = router.params.issueType;

    if (queryCounselorId) {
      setSelectedCounselorId(queryCounselorId);
    }

    if (queryIssueType) {
      setIssueType(queryIssueType);
    }
  });

  useEffect(() => {
    if (!selectedCounselorId) {
      return;
    }

    setError("");
    getCounselorDetail(selectedCounselorId)
      .then((response) => {
        const availableSchedules = response.schedules.filter((slot) => slot.available);
        setSchedules(availableSchedules);
        setSelectedScheduleId((current) =>
          current && availableSchedules.some((slot) => slot.id === current)
            ? current
            : availableSchedules[0]?.id ?? ""
        );
      })
      .catch(() => {
        const fallback = scheduleFixture.filter(
          (slot) => slot.counselorId === selectedCounselorId && slot.available
        );
        setSchedules(fallback);
        setSelectedScheduleId(fallback[0]?.id ?? "");
      });
  }, [selectedCounselorId]);

  const selectedCounselor =
    counselors.find((counselor) => counselor.id === selectedCounselorId) ?? counselors[0] ?? null;

  const handleSubmit = async () => {
    if (!selectedCounselorId || !selectedScheduleId) {
      setError("Please choose a counselor and an available slot.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const appointment = await createAppointment({
        counselorId: selectedCounselorId,
        scheduleSlotId: selectedScheduleId,
        issueEntryType: issueType,
        remark: remark.trim() || undefined
      });

      setNotice(`Appointment ${appointment.id} submitted.`);
      Taro.showToast({
        title: "Submitted",
        icon: "success"
      });
      Taro.navigateTo({ url: "/pages/my/index" });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to submit appointment.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="page-shell">
      <View className="booking-card">
        <Text className="section-title">Book support</Text>
        <Text className="booking-meta">Choose a counselor, select an available offline slot, and add a short note if useful.</Text>
        <Text className="pill">Default mode: offline</Text>
        {selectedCounselor ? (
          <Text className="booking-meta">
            Selected counselor: {selectedCounselor.displayName}
          </Text>
        ) : null}
        {notice ? <Text className="success-banner">{notice}</Text> : null}
        {error ? <Text className="error-banner">{error}</Text> : null}

        <View className="form-stack">
          <Text className="field-label">Counselor</Text>
          <View className="chip-grid">
            {counselors.map((counselor) => (
              <Button
                key={counselor.id}
                className={counselor.id === selectedCounselorId ? "selector-chip is-active" : "selector-chip"}
                onClick={() => setSelectedCounselorId(counselor.id)}
              >
                {counselor.displayName}
              </Button>
            ))}
          </View>

          <Text className="field-label">Issue type</Text>
          <View className="chip-grid">
            {issueOptions.map((option) => (
              <Button
                key={option.value}
                className={option.value === issueType ? "selector-chip is-active" : "selector-chip"}
                onClick={() => setIssueType(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </View>

          <Text className="field-label">Available slot</Text>
          <View className="slot-stack">
            {schedules.length > 0 ? (
              schedules.map((slot) => (
                <Button
                  key={slot.id}
                  className={slot.id === selectedScheduleId ? "slot-card is-active" : "slot-card"}
                  onClick={() => setSelectedScheduleId(slot.id)}
                >
                  <Text>{slot.startTime}</Text>
                  <Text>{slot.endTime}</Text>
                </Button>
              ))
            ) : (
              <Text className="booking-meta">No available slots are published for this counselor yet.</Text>
            )}
          </View>

          <Text className="field-label">Remark</Text>
          <Textarea
            className="form-textarea"
            maxlength={300}
            placeholder="Optional note to help the counselor understand what brought you here."
            value={remark}
            onInput={(event) => setRemark(event.detail.value)}
          />
        </View>

        <Button className="primary-button" disabled={submitting || !selectedScheduleId} onClick={handleSubmit}>
          {submitting ? "Submitting..." : "Submit appointment"}
        </Button>
      </View>
    </View>
  );
}
