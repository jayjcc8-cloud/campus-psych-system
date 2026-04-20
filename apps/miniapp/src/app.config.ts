export default defineAppConfig({
  pages: [
    "pages/home/index",
    "pages/counselors/index",
    "pages/my/index",
    "pages/profile/index",
    "pages/appointment/index",
    "pages/emergency/index"
  ],
  window: {
    navigationBarTitleText: "校园心理支持",
    navigationBarBackgroundColor: "#F6FAFA",
    navigationBarTextStyle: "black",
    backgroundTextStyle: "light"
  },
  tabBar: {
    color: "#86A9A8",
    selectedColor: "#2E8F8C",
    backgroundColor: "#FFFFFF",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/home/index",
        text: "首页",
        iconPath: "assets/tabbar/home.png",
        selectedIconPath: "assets/tabbar/home-active.png"
      },
      {
        pagePath: "pages/counselors/index",
        text: "咨询师",
        iconPath: "assets/tabbar/counselors.png",
        selectedIconPath: "assets/tabbar/counselors-active.png"
      },
      {
        pagePath: "pages/my/index",
        text: "我的预约",
        iconPath: "assets/tabbar/appointments.png",
        selectedIconPath: "assets/tabbar/appointments-active.png"
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/tabbar/profile.png",
        selectedIconPath: "assets/tabbar/profile-active.png"
      }
    ]
  }
});
