---
title: 从入口谈起
---

到了Vue3，入口从前文中的

```js
new Vue({
  render: h => h(App),
}).$mount('#app')
```

换成了

```js
const app = createApp(App);
app.mount("#app");
```

这一切都变得不大一样了。

[createApp](https://github.com/vuejs/core/blob/v3.2.32/packages/runtime-dom/src/index.ts#L66)

baseCreateRenderer

# 最后

通过本篇文章可以看出，在Vue3中，不光是用TypeScript重写了整个项目，并且还在很多地方进行了重构，比如diff算法相关的内容，现在完全被包含在baseCreateRenderer这个函数中。