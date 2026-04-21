const authSessionKey = "miniapp_auth_session_v1";
const roleModeKey = "miniapp_role_mode_v1";

const studentTabs = [
  {
    pagePath: "/pages/home/index",
    text: "首页",
    iconPath: "/assets/tabbar/home.png",
    selectedIconPath: "/assets/tabbar/home-active.png"
  },
  {
    pagePath: "/pages/counselors/index",
    text: "预约",
    iconPath: "/assets/tabbar/counselors.png",
    selectedIconPath: "/assets/tabbar/counselors-active.png"
  },
  {
    pagePath: "/pages/my/index",
    text: "我的预约",
    iconPath: "/assets/tabbar/appointments.png",
    selectedIconPath: "/assets/tabbar/appointments-active.png"
  },
  {
    pagePath: "/pages/profile/index",
    text: "我的",
    iconPath: "/assets/tabbar/profile.png",
    selectedIconPath: "/assets/tabbar/profile-active.png"
  }
];

const teacherTabs = [
  {
    pagePath: "/pages/home/index",
    text: "工作台",
    iconPath: "/assets/tabbar/home.png",
    selectedIconPath: "/assets/tabbar/home-active.png"
  },
  {
    pagePath: "/pages/teacher/appointments/index",
    text: "预约管理",
    iconPath: "/assets/tabbar/appointments.png",
    selectedIconPath: "/assets/tabbar/appointments-active.png"
  },
  {
    pagePath: "/pages/profile/index",
    text: "我的",
    iconPath: "/assets/tabbar/profile.png",
    selectedIconPath: "/assets/tabbar/profile-active.png"
  }
];

function getRole() {
  const roleMode = wx.getStorageSync(roleModeKey);

  if (roleMode === "teacher") {
    return "teacher";
  }

  const session = wx.getStorageSync(authSessionKey);

  return session && (session.role === "teacher" || session.role === "counselor") ? "teacher" : "student";
}

function getCurrentPath() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];

  return current && current.route ? `/${current.route}` : "";
}

Component({
  data: {
    activePath: "",
    role: "student",
    tabs: []
  },
  lifetimes: {
    attached() {
      this.refresh();
    }
  },
  pageLifetimes: {
    show() {
      this.refresh();
    }
  },
  methods: {
    refresh() {
      const role = getRole();

      this.setData({
        activePath: getCurrentPath(),
        role,
        tabs: role === "teacher" ? teacherTabs : studentTabs
      });
    },
    switchTab(event) {
      const path = event.currentTarget.dataset.path;

      if (!path || path === this.data.activePath) {
        return;
      }

      wx.switchTab({ url: path });
    }
  }
});
