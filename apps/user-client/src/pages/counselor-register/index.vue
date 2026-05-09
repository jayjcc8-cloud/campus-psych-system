<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">咨询师入驻申请</text>
      <text class="title">完成身份审核后启用账号</text>
      <text class="copy">咨询师账号需要强身份绑定。审核通过后，可在统一登录页使用工作邮箱登录。</text>
    </view>

    <view class="card stack">
      <view class="grid">
        <view class="field">
          <text class="label">真实姓名</text>
          <input v-model="form.legalName" placeholder="用于审核" />
        </view>
        <view class="field">
          <text class="label">工号/编号</text>
          <input v-model="form.staffId" placeholder="用于身份绑定" />
        </view>
      </view>
      <view class="field">
        <text class="label">所属单位/组织</text>
        <input v-model="form.organization" placeholder="例如 心理支持团队" />
      </view>
      <view class="field">
        <text class="label">工作邮箱</text>
        <input v-model="form.workEmail" placeholder="用于审核联系，也可用于登录" />
      </view>
      <view class="field">
        <text class="label">登录密码</text>
        <input v-model="form.password" password placeholder="至少 8 位" />
      </view>
      <view class="grid">
        <view class="field">
          <text class="label">公开称呼</text>
          <input v-model="form.displayName" placeholder="例如 周老师" />
        </view>
        <view class="field">
          <text class="label">职称/身份</text>
          <input v-model="form.title" placeholder="例如 心理咨询师" />
        </view>
      </view>
      <view class="field">
        <text class="label">简介</text>
        <textarea v-model="form.intro" maxlength="600" placeholder="用于审核和后续公开展示" />
      </view>
      <view class="field">
        <text class="label">擅长标签</text>
        <input v-model="specialtyText" placeholder="用顿号或逗号分隔" />
      </view>
      <text v-if="message" class="muted">{{ message }}</text>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="submit">{{ loading ? "提交中..." : "提交申请" }}</button>
      <button class="button-light" @click="goLogin">返回登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { counselorRegister } from "../../api/client";
import { relaunchPage } from "../../utils/navigation";

const form = reactive({
  password: "",
  legalName: "",
  staffId: "",
  organization: "",
  workEmail: "",
  displayName: "",
  title: "",
  intro: ""
});
const specialtyText = ref("");
const loading = ref(false);
const error = ref("");
const message = ref("");

async function submit() {
  error.value = "";
  message.value = "";
  loading.value = true;
  try {
    const result = await counselorRegister({
      ...form,
      specialties: specialtyText.value
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    });
    message.value = result.message;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "提交失败";
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  relaunchPage("/pages/login/index");
}
</script>
