<template>
    <div style="height: 200px; background: #ddd">测试组件 {{ renderingIsRun() }}</div>
</template>
<script>
export default {
    name: 'DivPlaceholder',
    components: {},
    data() {
        return {};
    },
    computed: {},
    created() {},
    methods: {
        renderingIsRun() {
            console.log('%c placeholder rendered', 'color: red;');
        }
    }
};
</script>
