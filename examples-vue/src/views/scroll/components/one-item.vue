<script>
export default {
    name: 'OneItem',
    inheritAttrs: false, // 建议写上
    props: {
        tag: { type: String, default: 'div' },
        data: Object,
        others: Object
    },
    components: {},
    data() {
        return {};
    },
    computed: {},
    created() {},
    methods: {},
    render() {
        const Tag = this.tag;
        const data = this.data;

        return (
            <Tag class={`list-item`} style={{ height: data.height }}>
                <div class="progress-bar" style={{ width: `${(data.id / this.others.listLength) * 100}%` }}></div>
                id: {data.id} {data.isAppend === null ? '' : data.isAppend ? 'append' : 'prepend prepend prepend'}
            </Tag>
        );
    }
};
</script>
