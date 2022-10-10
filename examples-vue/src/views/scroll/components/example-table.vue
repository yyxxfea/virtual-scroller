<script>
// import { VirtualScroller } from '../../../../../src/vue';
import { VirtualScroller } from 'virtual-scroller/src/vue';
import DivPlaceholder from './div-placeholder.vue';

export default {
    name: 'ExampleTable',
    components: { VirtualScroller, DivPlaceholder },
    props: {
        controls: Object,
        data: Array,
        dataLen: Number,
        vscrollController: Object
    },
    data() {
        return {};
    },
    computed: {},
    created() {},
    mounted() {},
    methods: {
        renderItem(h, { row }) {
            return (
                <tr class={`list-item`} key={row.id} style={{ height: row.height }}>
                    <td>
                        <div class="progress-bar" style={{ width: `${(row.id / this.dataLen) * 100}%` }}></div>
                        id: {row.id} {row.isAppend === null ? '' : row.isAppend ? 'append' : 'prepend prepend prepend'}
                    </td>
                </tr>
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
                <div class="container" ref="containerRef">
                    <VirtualScroller
                        class="vscroller-table"
                        ref="vscrollerRef"
                        tag="tbody"
                        data={this.data}
                        renderItem={this.renderItem}
                        // scopedSlots={this.ss}
                        getScrollElem={this.getScrollElem}
                        assistant={this.vscrollController}
                    >
                        {(() => {
                            // return (
                            //     <tr slot="before" class="slot-ele">
                            //         <td>before</td>
                            //     </tr>
                            // );
                        })()}
                        {(() => {
                            return (
                                <tr slot="after" class="slot-ele">
                                    <td>after</td>
                                </tr>
                            );
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

.slot-ele {
    height: 100px;
    background: #ddd;
}

.vscroller-table {
    width: 100%;
}
</style>
