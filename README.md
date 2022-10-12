# virtual-scroller

> 虚拟滚动，专用于解决长列表性能问题，即列表数据较多时，出现渲染时间过长、页面卡顿等问题。

## Exports

本库所暴露的可用的东西

| name                   | type      | description                      |
| ---------------------- | --------- | -------------------------------- |
| VirtualScroller        | Component | （默认导出值）主组件             |
| getComponentController | Function  | 辅助方法，用于接收组件的控制方法 |

### getComponentController(to: Object, from: Object)

里面用了 ` Object.assign`，不改变 `to` 的指向，只填充数据。用法见 Events.created。

### import

```js
import VirtualScroller from 'virtual-scroller/src/vue';
// or
import { VirtualScroller, getComponentController } from 'virtual-scroller/src/vue';
```

<br>

## 对外暴露的控制组件的方法 (controller)

下面这些方法或属性是本库的主组件对外暴露的，有几个是使用者使用组件时，必须主动调用的。

控制器需要使用 `Events.created` 或使用 `Props.assistant` 接收（见更后面的内容）。

| name           | type     | description                                                                                                                                                  |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ⭐**reassign** | Function | 对 data 重新赋值后调用，对应 `this.data = []`                                                                                                                |
| ⭐**append**   | Function | 往 data 后面插入数据后调用，对应 `this.data.push(...[])`                                                                                                     |
| ⭐**prepend**  | Function | 往 data 前面插入数据后调用，对应 `this.data.unshift(...[])`                                                                                                  |
| refresh        | Function | 刷新一下视图（重新计算了一次几页、页码）。适用场景：滚动时看到明显的空白区域，感觉视图有 bug，比如组件有一开始是隐藏时，可能会初始化时，内部计算数值不正确。 |
| scrollTo       | Function | 手动改变滚动距离                                                                                                                                             |
| toStart        | Function | 滚动条到最前                                                                                                                                                 |
| toEnd          | Function | 滚动条到最后                                                                                                                                                 |

### reassign(allDatas)

对 data 重新赋值后调用

参数：

-   `{Array} allDatas` 新的完整的数据

### append(newDatas)

往 data **_后面_**插入数据后调用

参数：

-   `{Array} newDatas` 新加入的那部分数据

### prepend(newDatas)

往 data **_前面_**插入数据后调用

参数：

-   `{Array} newDatas` 新加入的那部分数据

### scrollTo(scrollDistance)

参数：

-   `{Number} scrollDistance` 要到达的滚动距离

<br>

## 使用说明

### Props

| required/name    | type      | default   | description                                                 |
| ---------------- | --------- | --------- | ----------------------------------------------------------- |
| tag              | String    | 'div'     | 数据项的父元素标签名（非组件根元素）                        |
| \* data          | Array     | [ ]       | 数据列表                                                    |
| renderNoData     | Function  |           | 渲染方法：返回无数据时要显示的内容                          |
| \* renderItem    | Function  |           | 单条数据渲染 二选一：渲染方法                               |
| \* itemComponent | Component |           | 单条数据渲染 二选一：一个组件                               |
| \* itemKey       | String    | 'id'      | 使用 `itemComponent` 时需要，单项的唯一值的键名             |
| itemProps        | Object    |           | 使用 `itemComponent` 时需要，传给它的其他数据               |
| \* minItemSize   | Number    | 20        | 一个数据项的最小高度/宽度                                   |
| getScrollElem    | Function  | () => $el | 当组件根元素不是滚动层时，需传入返回滚动元素的方法          |
| assistant        | Object    |           | 若存在，初始化时将填充组件暴露的控制方法，见 Events.created |

#### data⚠⚠⚠

因为本组件的视图更新逻辑依赖于组件的内置方法，所以在改变此值后，必须手动调用对应的组件控制方法。

#### renderItem(h, { row, index })

一个方法，用于渲染一个数据项

参数:

-   `{Function} h` vue 的渲染函数，不解释
-   `{*} row` data 中的一项，里面有什么由用户数据决定
-   `{Number} index` 在列表中的下标

#### itemComponent

一个组件，用于渲染一个数据项。和 `renderItem` 二选一使用

可用 props：

-   `data`: 一个数据项本身 (item)
-   `index`: 在列表中的下标
-   `其他`: 来自 `itemProps`

#### itemProps

传给 `itemComponent` 的其他 props，将被 `...` 扩展运算符展开后传入

使用示例：

```js
computed: {
    itemProps() {
        return {
            name: 'Jack',
            age: 18
        };
    }
}
```

#### assistant

可参考 Events.created。

实际就是把这个过程内置到一个参数行为。简洁，但行为显得比较隐蔽，破坏了 vue 建议的数据流动方向。

源码大概是这样：

```js
if (this.assistant) {
    getComponentController(this.assistant, controller);
}
this.$emit('created', controller);
```

### Events

#### created

将在组件 created 时触发，

可用参数:

-   `{Object} controller ` 对外暴露的组件控制方法

例子：

```js
// 自定义一个事件回调
createdHandle(controller) {
    // 把组件的控制器存起来
    this.vscrollerController = controller
}
```

或者使用辅助方法 `getComponentController`：

```js
import { VirtualScroller, getComponentController } from 'virtual-scroller/src/vue';

export default {
    data() {
        return {
            vscrollerController: {},
            createdHandle: getComponentController
        };
    }
};
```

```html
<VirtualScroller @created="createdHandle(vscrollerController, $event)"></VirtualScroller>
```

### Slots

主组件的结构大概这样：

```html
<Container>
    <slot name="before"></slot>

    <ItemList desc="数据列表"></ItemList>

    <slot name="after"></slot>
</Container>
```

### CSS Name

-   基础类名前缀: `vscroll-`
-   数据项：`vscroll-item` `vscroll-item-XXX`，`XXX` 为数据项在列表中的下标 (index)

### 注意事项

-   需要为组件或其父元素设置滚动样式，若滚动容器不是组件本身，则需添加 `Props.getScrollElem`
-   切记在操作完 `Props.data` 后，调用组件控制器的对应方法。
-   当组件初始状态是隐藏时，需要使用者看时机（一般是在出现时），手动调用 `refresh` 方法。
-   组件没有对外传递 `scroll` 事件，有自定义需求可自行绑定 `@scroll.native`

### Simple Demo

详细的 demo 在仓库的带 examples 前缀的文件夹中。下面只是伪代码 demo。

#### demo1：使用 `Props.itemComponent`

例子中有 slot

```html
<VirtualScroller
    style="height: 500px; overflow: auto;"
    :data="data"
    :itemComponent="OneDiv"
    :itemProps="{ listLength: data.length, isTest: true }"
    :minItemSize="35"
    @created="getComponentController"
>
    <button slot="before">请求 前面 更多</button>
    <button slot="after">请求 后面 更多</button>
</VirtualScroller>
```

组件 `one-div.vue`：

```js
export default {
    name: 'OneDiv',
    inheritAttrs: false, // 看需要
    props: {
        data: Object,
        index: Number,
        listLength: Number,
        isTest: Boolean
    },
    render(h) {
        return h('div', {}, `name: ${this.data.name}, age: ${this.data.age}`)
    }
};
</script>
```

#### demo2：使用 `Props.renderItem`

例子中写了操作 data 要调用相关的控制方法

```html
<VirtualScroller
    style="height: 500px; overflow: auto;"
    :data="data"
    :renderItem="renderOneDiv"
    :minItemSize="35"
    @created="getComponentController(vscrollerController, $event)"
    @created="(val) => { vscrollerController = val }"
    @created="(val) => { Object.assign(vscrollerController, val) }"
></VirtualScroller>

若使用 Props.assistant 获取组件控制器：

<VirtualScroller
    style="height: 500px; overflow: auto;"
    :data="data"
    :renderItem="renderOneDiv"
    :minItemSize="35"
    :assistant="vscrollerController"
></VirtualScroller>
```

```js
import { VirtualScroller, getComponentController } from 'virtual-scroller/src/vue';
export default {
    name: 'Demo',
    components: { VirtualScroller },
    data() {
        return {
            data: [],
            getComponentController,
            vscrollerController: {}
        };
    },
    methods: {
        renderOneDiv(h, { row, index }) {
            return h('div', {}, `name: ${row.name}, age: ${row.age}`);
        },
        getData(newDatas) {
            this.data = newDatas;
            this.vscrollerController.reassign(this.data);
        },
        appendData(newDatas) {
            this.data.push(...newDatas);
            this.vscrollerController.append(newDatas);
        },
        prependData(newDatas) {
            this.data.unshift(...newDatas);
            this.vscrollerController.prepend(newDatas);
        }
    }
};
```

<br>

## 组件内部逻辑说明

-   组件根元素必须有 css 定位属性（内置了 relative）
-   有滚动条时，通过前后插入带高度的空白区域来撑大，只渲染一部分数据。
    -   别的方式，可以通过绝对定位 + translateY(frontOffset) 来，但这样的结构适配不了表格。
    -   前后项的空白高度初始是用 `一项的最小高度 × 数量` 来计算，并在加载后保存起实际高度
-   加入了分页的概念，n 个数据为一页
    -   保存实际高度时是以“**页**”为单位
    -   滚动距离变化时，以“**页**”为单位变化视图
-   列表有一个包裹层，来保证奇偶性正确
-   浏览器机制：scrollTop 在前部分插入东西会自适应，使视图相不变（浏览器之间表现不一样，比如原 Edge 是不行的）
    -   DOM 某些破坏性更新时，此机制不生效
    -   事实上这里的实现，没有利用并需要避开这个机制
-   prepend（前插）数据时，为了让旧的分页范围相对不变，将向前延伸而不是全部重新分页
    -   是为了实现前插数据后，保持视图相对不动
    -   所以前插数据后，第一页可能数量不饱和（最后一页也是）

<br>

## todo/issues

-   写使用文档
-   写 types 描述文件

-   #1(fixed) 当 slot.after 存在时，滚动条在最底时，appendData 时浏览器会尝试自适应保持在最底
    1.  在 slot.after 上加动态 key 也能避免，但会使其每次 render 都重新跑，也不可行。所以换成在最底部加一个不停更新 key 值的空元素。
    2.  曾试过另一种方案：更新完手动控制 scrollTop 回到原本的位置，正常是可行的。但谷歌浏览器（假如不做步骤 1，不论是否使用方案 2）有神奇的 bug，拖到最后加下加载完，竟然会影响到外部的滚动条，在客服中心的聊天监控能重现。具体表现：本组件上部分出现在可视区域外，滚动条拖到最后并向下加载，数据出现后，外面不关事的主容器滚动条向下滚了。
-   #2 如何实现 scrollTo(固定高度) scrollToIndex(下标)
-   #3 为了性能考虑，是否应该把行的内置 css 添加逻辑，移到外部传入的 renderItem 中（强制性，内部逻辑依赖此类名）
-   #4 若中途删除了一条、几条、未知数量的数据，怎么办？若同时希望保留恰当的滚动距离？
-   #5 若**持续拖动滚动条**，向前加载未加载过的数据（即未曾保存实际高度）时，因实际高度变更，为了使视图相对不变，理论上做了视图偏移兼容，但实际上还是会出现滚动距离突变
    -   以 scrollTop 为例，数值变化依次是：2758 -> 2656 -> 2579 -> 2477 -> 3142(页码变更，偏移计算后主动改变了 scrollTop) -> 2458(但由于连续拖动滚动条，这次依然是根据上上次的滚动距离来表现) -> 2403
    -   向后滚动来加载未加载过的数据时也会（火狐）
-   #6 未兼容横向滚动
