<script>
import { VirtualScroller } from 'virtual-scroller/src/vue';
import DivPlaceholder from './div-placeholder.vue';
import OneItem from './one-item.vue';

export default {
    name: 'ExampleDiv',
    components: { VirtualScroller, DivPlaceholder },
    props: {
        controls: Object,
        data: Array,
        dataLen: Number,
        tag: String,
        vscrollController: Object
    },
    data() {
        return {};
    },
    computed: {
        childTag() {
            if (this.tag === 'div') return 'div';
            if (this.tag === 'ul') return 'li';
            if (this.tag === 'tbody') return 'tr';
            return 'div';
        },
        itemProps() {
            return {
                tag: this.childTag,
                others: { listLength: this.data.length }
            };
        }
    },
    created() {},
    mounted() {},
    methods: {
        renderItem(h, { row }) {
            const ChildTag = this.childTag;

            return (
                <ChildTag class={`list-item`} key={row.id} style={{ height: row.height }}>
                    <div class="progress-bar" style={{ width: `${(row.id / this.dataLen) * 100}%` }}></div>
                    id: {row.id} {row.isAppend === null ? '' : row.isAppend ? 'append' : 'prepend prepend prepend'}
                </ChildTag>
            );
        },
        getScrollElem() {
            return this.$refs.containerRef;
        }
    },
    render() {
        console.log('--- outer render');

        return (
            <section class="main row my-10 mx-10">
                <div ref="containerRef">
                    <VirtualScroller
                        class="container"
                        ref="vscrollerRef"
                        tag={this.tag}
                        data={this.data}
                        renderItem={this.renderItem}
                        itemComponent={OneItem}
                        itemProps={this.itemProps}
                        assistant={this.vscrollController}
                        // getScrollElem={this.getScrollElem}
                    >
                        {(() => {
                            return (
                                <input
                                    slot="before"
                                    style="height: 100px"
                                    class="input"
                                    type="number"
                                    vModel={this.controls.testNum}
                                />
                            );
                        })()}
                        {(() => {
                            return <DivPlaceholder slot="after"></DivPlaceholder>;
                            // return <input slot="after" class="input" type="number" vModel={this.controls.testNum} />;
                        })()}
                    </VirtualScroller>
                </div>
            </section>
        );
    }
};
</script>
<style scoped>
.container {
    width: 400px;
    height: 70vh;
    overflow: auto;
    border: 1px solid #ddd;
}
</style>
