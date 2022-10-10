<script>
export default {
    name: 'ItemList',
    props: {
        tag: String,
        baseClass: String,
        data: Array,
        startIndex: Number,
        endIndex: Number,
        renderItem: Function,
        itemComponent: undefined,
        itemKey: String,
        itemProps: Object
    },
    data() {
        return {};
    },
    computed: {},
    created() {},
    methods: {
        getItemClass(index) {
            return `${this.baseClass}-item ${this.baseClass}-item-${index}`;
        },
        /** 为`行`加上内置 css 类名 */
        addItemClass(cssClass, index) {
            const itemClass = this.getItemClass(index);

            if (!cssClass) return itemClass;

            if (typeof cssClass === 'string') {
                cssClass = `${cssClass} ${itemClass}`;
            } else if (Array.isArray(cssClass)) {
                cssClass.push(itemClass);
            } else {
                cssClass[itemClass] = true;
            }

            return cssClass;
        },
        /**
         * 当前处于**禁用**状态
         *
         * 渲染一行（主组件用 slot 的方式）
         * */
        renderItemBySlot(h, params) {
            const { index } = params;
            const vnodes = this.$scopedSlots.default(params);

            if (!vnodes[0].data) vnodes[0].data = {};
            vnodes[0].data.class = this.addItemClass(vnodes[0].data.class, index);
            return vnodes;
        },
        /** 渲染一行（主组件用 prop 传入方法的方式）*/
        renderItemByPropFunc(h, params) {
            const { index } = params;
            const vnode = this.renderItem(h, params);

            if (!vnode.data) vnode.data = {};
            vnode.data.class = this.addItemClass(vnode.data.class, index);
            return vnode;
        }
    },
    render(h) {
        const ParentTag = this.tag;
        const startIndex = this.startIndex;
        const endIndex = this.endIndex;
        const renderItem = this.renderItemByPropFunc;
        let itemsVNodes;

        if (this.data.length !== 0) {
            const ItemComponent = this.itemComponent;

            if (ItemComponent) {
                itemsVNodes = this.data.slice(startIndex, endIndex + 1).map((row, index) => {
                    const itemIndex = index + startIndex;

                    return (
                        <ItemComponent
                            class={this.getItemClass(itemIndex)}
                            key={row[this.itemKey]}
                            {...{ props: { ...this.itemProps } }}
                            data={row}
                            index={itemIndex}
                        ></ItemComponent>
                    );
                });
            } else {
                itemsVNodes = this.data.slice(startIndex, endIndex + 1).map((row, index) => {
                    return renderItem(h, {
                        row,
                        index: index + startIndex
                    });
                });
            }
        }

        return <ParentTag>{itemsVNodes}</ParentTag>;
    }
};
</script>
