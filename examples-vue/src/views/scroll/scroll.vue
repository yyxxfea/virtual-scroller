<template>
    <div class="main row my-10 mx-10 justify-content-center">
        <Controls
            class="mr-20"
            :example="example"
            :controls="example.controls"
            @reassign="reassign"
            @append="append"
            @prepend="prepend"
        ></Controls>

        <ExampleDiv
            v-if="['div', 'ul'].includes(example.controls.type)"
            ref="ex1Ref"
            :controls="example.controls"
            :data="example.list"
            :dataLen="example.listLen"
            :tag="example.controls.type"
            :vscrollController="example.vscrollController"
        ></ExampleDiv>
        <ExampleTable
            v-else-if="example.controls.type === 'table'"
            ref="ex1Ref"
            :controls="example.controls"
            :data="example.list"
            :dataLen="example.listLen"
            :vscrollController="example.vscrollController"
        ></ExampleTable>
    </div>
</template>
<script>
import { Example } from './instance';

import ExampleDiv from './components/example-div.vue';
import ExampleTable from './components/example-table.vue';
import Controls from './components/controls.vue';

export default {
    name: 'Scroll',
    components: { ExampleDiv, ExampleTable, Controls },
    data() {
        return {
            example: new Example()
        };
    },
    computed: {
        isAsync() {
            return this.example.controls.isAsync;
        }
    },
    created() {},
    mounted() {
        setTimeout(() => {
            // this.initPage();
        }, 200);
    },
    methods: {
        // getScrollerInstance() {
        //     return this.$refs.ex1Ref.$refs.vscrollerRef;
        // },
        initPage() {
            this.reassign(this.example.controls.initNum);
        },
        async reassign(num) {
            if (this.isAsync) {
                await this.pretendAsync();
            }
            this.example.reassign(num);
            this.example.vscrollController.reassign(this.example.list);
        },
        async append(num) {
            if (this.isAsync) {
                await this.pretendAsync();
            }
            const newRows = this.example.append(num);
            this.example.vscrollController.append(newRows);
        },
        async prepend(num) {
            if (this.isAsync) {
                await this.pretendAsync();
            }
            const newRows = this.example.prepend(num);
            this.example.vscrollController.prepend(newRows);
        },
        pretendAsync() {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, this.example.controls.asyncDuration);
            });
        }
    }
};
</script>
