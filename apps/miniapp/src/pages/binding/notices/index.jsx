import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import AppButton from "../../../components/app-button";
import AppCard from "../../../components/app-card";
import PageHeader from "../../../components/page-header";
import {
  consumePendingIntent
} from "../../../lib/navigation-intent";
import { saveRegistrationFeedback } from "../../../lib/registration-feedback";
import { markStudentSetupAccepted } from "../../../lib/student-setup";

const noticeSteps = [
  {
    key: "privacyAcceptedAt",
    title: "隐私说明",
    subtitle: "我们只收集完成校内心理支持预约所必需的信息。",
    points: [
      "预约信息默认仅本人可见。",
      "学号、姓名和学院仅用于校内身份校验。",
      "必要工作人员会按照权限查看相应记录。"
    ]
  },
  {
    key: "agreementAcceptedAt",
    title: "用户协议",
    subtitle: "本平台用于校园心理预约与支持，不替代医疗服务。",
    points: [
      "平台用于预约咨询老师、查看状态和获取校园支持资源。",
      "平台不提供医疗诊断、处方或商业付费服务。",
      "请留意预约状态，无法参加时及时取消。"
    ]
  },
  {
    key: "consentAcceptedAt",
    title: "知情提示",
    subtitle: "开始预约前，请先了解支持方式和应急边界。",
    points: [
      "提交预约后，请以待确认、已确认等状态变化为准。",
      "如涉及明显安全风险，平台会进入校内跟进流程。",
      "需要即时帮助时，请优先使用紧急求助入口。"
    ]
  }
];

export default function BindingNoticesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = noticeSteps[activeIndex];
  const isLastStep = activeIndex === noticeSteps.length - 1;

  const completeRegistration = () => {
    consumePendingIntent();
    saveRegistrationFeedback({
      message: "注册完成，已回到首页。"
    });

    Taro.switchTab({ url: "/pages/home/index" });
  };

  const handleNext = () => {
    markStudentSetupAccepted(activeStep.key);

    if (isLastStep) {
      Taro.showToast({ title: "注册完成", icon: "success" });
      completeRegistration();
      return;
    }

    setActiveIndex((current) => current + 1);
  };

  return (
    <View className="page-shell">
      <PageHeader
        kicker="服务说明"
        title="服务说明"
      />

      <View className="section-stack">
        <AppCard tone="accent" className="registration-hero-card">
          <View className="registration-hero-head">
            <View className="registration-hero-copy">
              <Text className="section-title">第 3 步：{activeStep.title}</Text>
              <Text className="section-copy">{activeStep.subtitle}</Text>
            </View>
            <Text className="count-badge">{activeIndex + 1} / {noticeSteps.length}</Text>
          </View>
          <View className="registration-step-row">
            {noticeSteps.map((step, index) => (
              <View
                key={step.key}
                className={
                  index < activeIndex
                    ? "registration-step is-complete"
                    : index === activeIndex
                      ? "registration-step is-active"
                      : "registration-step"
                }
              >
                <Text className="registration-step-index">{index + 1}</Text>
                <Text className="registration-step-label">{step.title}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <View className="notice-stack">
            {activeStep.points.map((point) => (
              <Text className="section-copy" key={point}>• {point}</Text>
            ))}
          </View>
        </AppCard>

        <AppButton onClick={handleNext}>
          {isLastStep ? "完成注册并开始使用" : "我已了解，继续"}
        </AppButton>
      </View>
    </View>
  );
}
