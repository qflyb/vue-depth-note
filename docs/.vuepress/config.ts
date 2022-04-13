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
      { text: "Vue", link: "/vue/" },
    ],
    sidebar: {
      "/vue/": [
        {
          title: "Vue",
          path: "/vue/",
          collapsable: false,
          sidebarDepth: 1,
          children: ["/vue/new-vue"],
        },
      ],
    },
  },
});
