import { createApp } from "vue";
import { Alert, Button, Space, Tag } from "tdesign-vue-next";
import App from "./App.vue";
import { router } from "./router";
import "./styles/global.css";

const app = createApp(App);

app.use(router);
app.use(Alert);
app.use(Button);
app.use(Space);
app.use(Tag);
app.mount("#app");
