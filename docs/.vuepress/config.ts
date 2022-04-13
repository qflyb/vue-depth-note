import { defineConfig } from "vuepress/config";

export default defineConfig({
  // 站点配置
  title: "Vue深入学习",
  description: "Just playing around",

  // 主题和它的配置
  theme: "@vuepress/theme-default",
  themeConfig: {
    logo: "https://vuejs.org/images/logo.png",
    nav: [
      { text: "Vue2", link: "/vue2/" },
      { text: "Vue3", link: "/vue3/" },
    ],
    sidebar: {
      "/vue2/": [
        {
          title: "Vue2",
          path: "/vue2/",
          collapsable: false,
          sidebarDepth: 1,
          children: ["/vue2/new-vue"],
        },
      ],
    },
  },
});
