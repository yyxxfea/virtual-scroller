<template>
    <div>
        <div class="mb-10">rows: {{ example.listLen }}</div>
        <div class="mb-10">
            类型：
            <label v-for="item in types" :key="item.value">
                <input type="radio" name="a18gdd7Radio" :value="item.value" v-model="controls.type" />
                {{ item.label }}
            </label>
        </div>
        <div class="mb-10">
            <label>
                数据来源是否异步：
                <input type="checkbox" v-model="controls.isAsync" />
            </label>
        </div>
        <div class="mb-10" v-if="controls.isAsync">
            异步时间：
            <input class="input w-100px mr-5" type="number" v-model.number="controls.asyncDuration" />
            <button class="button mr-5" @click="changeAsyncDuration(300)">300</button>
            <button class="button mr-5" @click="changeAsyncDuration(500)">500</button>
            <button class="button mr-5" @click="changeAsyncDuration(5000)">5000</button>
            <button class="button mr-5" @click="changeAsyncDuration(10000)">10000</button>
            <button class="button mr-5" @click="changeAsyncDuration(99999)">99999</button>
        </div>
        <div class="mb-10">
            生成行随机高度的基数
            <input class="input w-100px mr-5" type="number" v-model.number="controls.randomBaseH" />
        </div>
        <div class="mb-10">
            滚动距离：
            <input class="input w-100px mr-5" type="number" v-model.number="controls.scrollDistance" />
            <button class="button mr-5" @click="scrollTo(controls.scrollDistance)">go</button>
            <button class="button mr-5" @click="scrollTo(0)">置顶</button>
            <button class="button mr-5" @click="scrollTo(500)">500</button>
            <button class="button mr-5" @click="scrollTo(1000)">1000</button>
            <button class="button mr-5" @click="scrollTo(5000)">5000</button>
            <button class="button mr-5" @click="toEnd()">置底</button>
        </div>

        <h3 class="mt-20">变更数据：</h3>
        <hr class="mb-10" />

        <div class="mb-10">
            重置：
            <input class="input w-100px mr-5" type="number" v-model.number="controls.assignNum" />
            <button class="button mr-5" @click="reassign()">reassign</button>
            <button class="button mr-5" @click="reassign(0)">0</button>
            <button class="button mr-5" @click="reassign(1)">1</button>
            <button class="button mr-5" @click="reassign(3000)">3k</button>
            <button class="button mr-5" @click="reassign(10000)">1w</button>
            <button class="button mr-5" @click="reassign(100000)">10w</button>
        </div>
        <div class="mb-10">
            前插入：
            <input class="input w-100px mr-5" type="number" v-model.number="controls.prependNum" />
            <button class="button mr-5" @click="prependData(1)">1</button>
            <button class="button mr-5" @click="prependData(300)">300</button>
            <button class="button mr-5" @click="prependData(1000)">1k</button>
            <button class="button mr-5" @click="prependData()">prepend</button>
        </div>
        <div class="mb-10">
            后插入：
            <input class="input w-100px mr-5" type="number" v-model.number="controls.appendNum" />
            <button class="button mr-5" @click="appendData(1)">1</button>
            <button class="button mr-5" @click="appendData(300)">300</button>
            <button class="button mr-5" @click="appendData(1000)">1k</button>
            <button class="button mr-5" @click="appendData()">append</button>
        </div>
    </div>
</template>
<script>
export default {
    name: 'Controls',
    components: {},
    props: {
        example: Object,
        controls: Object
    },
    data() {
        return {
            types: [
                { label: 'div', value: 'div' },
                { label: 'ul', value: 'ul' },
                { label: 'table', value: 'table' }
            ]
        };
    },
    computed: {},
    created() {},
    methods: {
        changeAsyncDuration(val) {
            this.controls.asyncDuration = val;
        },
        reassign(num = this.controls.assignNum) {
            this.$emit('reassign', num);
        },
        appendData(num = this.controls.appendNum) {
            this.$emit('append', num);
        },
        prependData(num = this.controls.prependNum) {
            this.$emit('prepend', num);
        },
        scrollTo(val) {
            this.$emit('scrollTo', val);
        },
        toEnd() {
            this.$emit('toEnd');
        }
    }
};
</script>
