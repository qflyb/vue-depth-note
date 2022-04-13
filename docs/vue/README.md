# 简介

我看了几天Vue2的源码，笔记做了不少，在整理成文章的时候发现一个非常恐怖的事情，我为什么要去学习Vue2，而不直接学习Vue3呢？

Vue3是现在，同样也是未来，Vue2的一些基本概念熟悉就差不多了，我们现在的学习重点还是应该放在Vue3上，（上一章仿佛显得有点多余）。

不过我们通过上一章的学习，大致也明白了

同样Vue3也会从入口开始谈及，同时探讨很多在Vue2没有讲到的很多内容，例如：双向绑定、composition-api的实现、State的初始化、生命周期等等。

如果要读Vue3的源码那么你需要会看TypeScript的代码，因为Vue3完全使用了TypeScript进行重写。

但是！做的笔记我也不能白做，来一起看看在Vue2中入口代码中藏着的那些事吧！就作为源码学习的引子。

## new Vue

这小小的一段代码背后的故事，分成两部分进行分析，分别是new Vue部分和.$mount部分

```JavaScript
new Vue({
  render: h => h(App),
}).$mount('#app')
```

代码

```JavaScript
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

src\core\instance\index.js

有5个Mixin函数：

- initMixin：创建相关。
- stateMixin：state相关。
- eventsMixin：事件相关。
- lifecycleMixin：生命周期相关。
- renderMixin：渲染相关。

initMixin是本篇文章主要讲解的函数，因为它涉及到初始化相关的内容。

## initMixin

该函数为Vue的原型上添加一个_init方法。

```js
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    ...省略内容
  }
}
```

[_init](https://github.com/vuejs/vue/blob/v2.6.14/src/core/instance/init.js#L16)

而在[new Vue](https://github.com/vuejs/vue/blob/v2.6.14/src/core/instance/index.js#L14)的时候会进行调用

```js
function Vue (options) {
  // 调用_init方法
  this._init(options)
}
```

所以我们要了解new Vue做了什么最主要的就是需要了解_init方法中做了什么。

_init方法，我删除了一些new Vue的时候并不会走的代码：

```js
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    // 如果有el参数，则调用.$mount方法
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

从源码中我们可以看出，下面两种写法是完全等价的：

```js
new Vue({
  render: h => h(App),
}).$mount('#app')

new Vue({
  render: (h) => h(App),
  el: "#app",
});
```

在_init方法中，会调用[mergeOptions](https://github.com/vuejs/vue/blob/v2.6.14/src/core/util/options.js#L388)函数，我们来看一下这个函数它做了什么：

```js
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }

  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirectives(child)

  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

然后会经过一系列的初始化内容：

- initLifecycle(vm)
- initEvents(vm)
- initRender(vm)
- callHook(vm, 'beforeCreate')
- initInjections(vm)
- initState(vm)
- initProvide(vm)
- callHook(vm, 'created')

这些内容不是本篇文章需要关注的重点，后面到生命周期，State的初始化等等内容的时候，会再来看这些初始化函数。

那么通过上面的探讨，new Vue中主要做了什么事情？

1. 调用_init方法。
2. 通过mergeOptions函数合并options并且赋值给Vue上的$options属性。
3. 初始化生命周期、事件、渲染、Inject、State等内容。

接下来就要来谈一下.$mount中做了些什么操作，因为new Vue中只是进行了一大堆的初始化操作，但是并没有涉及到如何将VNode节点渲染到界面上。

```js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

分别执行了两个非常重要的方法：

- vm._render：renderMixin
- vm._update：lifecycleMixin
- patch：diff算法

[$mount](https://github.com/vuejs/vue/blob/v2.6.14/src/platforms/web/runtime/index.js#L37)

```js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

可以看到`.$mount`其实是调用[mountComponent函数](https://github.com/vuejs/vue/blob/v2.6.14/src/core/instance/lifecycle.js#L141)

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

在上面的函数中，有3个点我们需要关注：

- `_update`方法
- `_render`方法
- `new Watcher`做了什么

因为_update方法和_render方法是在[new Watcher](https://github.com/vuejs/vue/blob/v2.6.14/src/core/observer/watcher.js#L27)中进行调用的，所以我们这里优先看一下new Watcher中做了什么操作。

由于代码比较多，而且在后面的内容中还会探讨new Watcher，所以本篇文章只关注new Watcher中与.$mount关系紧密的部分。

```js
get () {
  pushTarget(this)
  let value
  const vm = this.vm
  try {
    value = this.getter.call(vm, vm)
  } catch (e) {
    if (this.user) {
      handleError(e, vm, `getter for watcher "${this.expression}"`)
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value)
    }
    popTarget()
    this.cleanupDeps()
  }
  return value
}
```

`this.getter.call(vm, vm)`调用了[updateComponent](https://github.com/vuejs/vue/blob/v2.6.14/src/core/instance/lifecycle.js#L189)前面说的_update方法和_render方法

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
```

又将该方法赋值给了getter

```js
this.value = this.lazy
  ? undefined
  : this.get()
```

执行顺序为先执行_render方法，再执行_update方法，所以我们先看_render方法中做了什么处理。

前文中我们提到了lifecycleMixin这个函数，而[_update方法](https://github.com/vuejs/vue/blob/v2.6.14/src/core/instance/lifecycle.js#L59)就是在这个函数中被挂到原型上的，所以我们可以看一下源码：

_update中调用了一个非常重要的方法`vm.__patch__`这里就是Vue2中的diff算法，而关于diff算法，在后面的文章中会单独探讨，我们先找到这个方法所在的位置。

[`__patch__ `](https://github.com/vuejs/vue/blob/v2.6.14/src/platforms/web/runtime/index.js#L34)

```js
Vue.prototype.__patch__ = inBrowser ? patch : noop
```

[patch](https://github.com/vuejs/vue/blob/v2.6.14/src/platforms/web/runtime/patch.js#L12)

```js
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

[createPatchFunction](https://github.com/vuejs/vue/blob/v2.6.14/src/core/vdom/patch.js#L70)

记不住也没有关系，后面探讨diff算法的时候，会再次给出这个位置。

但是要理解_update方法做了什么的话，得了解diff算法中做了些什么：

1. 调用了patch
2. 调用了createElm
3. 调用了createComponent
4. 调用了init
5. 调用了Vue.prototype.$mount

等等，这里怎么又调用了一次Vue.prototype.$mount？

其实这里就涉及到虚拟DOM树，至于这个知识点，同样会在后面的文章中进行探讨。

这里总结一下初次渲染时，_update方法中做了哪些事情：

比起上面的`_update`方法做了一大堆diff算法，衍生出了各种方法来讲_render方法所做的事情就简单的多。

而是`_render`方法在`renderMixin`函数中被挂载在原型上的，所以我们可以在这里找到它的源码[_render方法源码](https://github.com/vuejs/vue/blob/v2.6.14/src/core/instance/render.js#L69)：

上面的每一处源码的链接我都给出来了，如果已经迫不及待的话可以先自行阅读一下对应的diff算法的源码。

这里总结一下初次渲染时，_render方法中做了哪些事情：

## 最后

我们总结一下在`new Vue().$mount()`时Vue做了哪些事情：



虽然我们大致明白了`new Vue`时的流程，但同时又引出了一大堆新的问题：

1. 虚拟DOM树。
2. diff算法。
3. 双向绑定原理。
4. 生命周期如何被触发。
5. State是如何被初始化的
6. ...

一口吃不成一个胖子，后面我们就开始对Vue3的源码进行分析。
