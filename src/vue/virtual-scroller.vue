<script>
import { getParentTagName, getSpaceTagName, getPageSize, getComponentController } from './utils';
import ItemList from './components/item-list.vue';

const BASE_CSS_CLASS = 'vscroll'; // 行的基础 css 类名
const PAGE_SIZE = 30; // 一页几条

let autoId = 0;

function defaultGetScrollElem() {
    return this.$refs.containerRef;
}

export default {
    name: 'VirtualScroller',
    components: { ItemList },
    props: {
        /** 数据项的父元素标签名（非组件根元素） */
        tag: { type: String, default: 'div' },

        /** 所有数据 */
        data: { type: Array, default: () => [] },

        /** 无数据时渲染方法 */
        renderNoData: { type: Function },

        /** （单项渲染 二选一）渲染方法 */
        renderItem: { type: Function },

        /** （单项渲染 二选一）一个组件
         *
         * 可用 props：
         * - data: 数据项本身
         * - index: 下标
         * - 其他: 传入 itemProps ，用扩展运算符展开后传入
         * */
        itemComponent: undefined,

        /** 单项的唯一值的键名 */
        itemKey: { type: String, default: 'id' },

        /** 使用 itemComponent 渲染单项时，传给它的其他数据 */
        itemProps: Object,

        /** 一项最小高度/宽度 */
        minItemSize: { type: Number, default: 20 },

        /** 当不是根元素是滚动层时，需传入返回滚动元素的方法 */
        getScrollElem: { type: Function, default: defaultGetScrollElem },

        /** 助手，初始化时将会填充方法，供外面调用该组件方法（因使用本组件需主动调用特定的组件方法）。
         *
         * 可用方法：
         * - reassign
         * - append
         * - prepend
         */
        assistant: Object
    },
    data() {
        return {
            updateTimer: null,
            pages: [],
            pageOptions: {
                minItemSize: this.minItemSize, // 一行最小高度
                pageSize: PAGE_SIZE,
                totalPageCount: 0, // 总共有多少页
                renderingPageCount: 3, // 一次展示多少页在 DOM，会自动计算
                bufferPageCount: 2, // 作为多余的缓冲页面，让滚动不至于频繁触发更新，应该 >= 1
                mutatedRatio: 0.15 // 滚动到达多少（比例）改变 pageNum
            },
            cache: {
                dataLength: 0,
                pageNum: 0, // 当前展示的`开始页码`
                endPageNum: 0, // 当前展示的`结束页码`
                startIndex: 0, // 当前展示的`开始下标`
                endIndex: 0, // 当前展示的`结束下标`
                scrollTop: 0, // 记录滚动容器的滚动高度
                frontOffset: 0,
                endOffset: 0
            },
            prependRepairman: {
                isWorking: false,
                isStopScrollUpdate: false,
                offsetPage: 0,
                oldFirstPageHeight: 0,
                shouldKeepViewStable: false, // 向前加载时，若页面高度变化过，需调整滚动距离使视图相对不变

                reset() {
                    this.offsetPage = 0;
                    this.oldFirstPageHeight = 0;
                    this.isWorking = false;
                },
                prepare(offsetPage, oldFirstPageHeight) {
                    this.offsetPage = offsetPage;
                    this.oldFirstPageHeight = oldFirstPageHeight;
                    this.isWorking = true;
                }
            },
            cssClass: {
                container: `${BASE_CSS_CLASS}-container`,
                parent: `${BASE_CSS_CLASS}-list`,
                frontSpace: `${BASE_CSS_CLASS}-front-space`,
                endSpace: `${BASE_CSS_CLASS}-end-space`
            }
        };
    },
    created() {
        this.exposeInner();
    },
    mounted() {
        this.updateRenderingPageCount();
        this.reassign();
        this.bindScrollEvt();
        this.bindRisizeEvt();
    },
    activated() {
        this.updateRenderingPageCount();
        this.bindScrollEvt();
        this.bindRisizeEvt();
        this.changeScrollDistance(this.cache.scrollTop);
    },
    deactivated() {
        this.destroyScrollEvt();
        this.destroyRisizeEvt();
    },
    beforeDestroy() {
        this.destroyScrollEvt();
        this.destroyRisizeEvt();
        clearTimeout(this.updateTimer);
    },
    methods: {
        /** 把内部方法暴露到外面 */
        exposeInner() {
            const controller = {
                reassign: this.reassign,
                append: this.append,
                prepend: this.prepend
            };
            if (this.assistant) getComponentController(this.assistant, controller);
            this.$emit('created', controller);
        },
        /** 重新赋值
         *
         * **注意，此方法涉及外面调用**
         */
        reassign(data = this.data, isToTop = true) {
            const pages = [];
            const dataLength = data.length;

            this.appendData(pages, 0, dataLength);
            this.pages = pages;
            this.pageOptions.totalPageCount = pages.length;
            this.cache.dataLength = dataLength;

            if (isToTop) {
                this.updatePageNum(true);
                this.changeScrollDistance(0, true);
            } else {
                this.updatePageNum();
            }
        },
        /** 往后插入数据
         *
         * **注意，此方法涉及外面调用**
         */
        append(moreDatas) {
            const pages = this.pages;
            const insertingLen = moreDatas.length;

            if (insertingLen === 0) return;

            if (pages.length === 0) {
                this.reassign();
                return;
            }

            const theLastPage = pages.splice(pages.length - 1, 1)[0]; // 剪掉最后一页，从它开始往后，重新分页
            const theLastPageSize = getPageSize(theLastPage);

            this.appendData(pages, theLastPage.index[0], insertingLen + theLastPageSize);
            this.pageOptions.totalPageCount = pages.length;
            this.cache.dataLength += insertingLen;
            this.updatePageNum();
            // fix #1
            // this.$nextTick(() => {
            //     this.changeScrollDistance(this.cache.scrollTop);
            // });
        },
        /** 往前插入数据
         *
         * **注意，此方法涉及外面调用**
         */
        prepend(moreDatas) {
            const pages = this.pages;
            const oldPageLen = this.pages.length;
            const insertingLen = moreDatas.length;

            if (insertingLen === 0) return;

            if (pages.length === 0) {
                this.reassign();
                return;
            }

            // 把原有的下标延后
            for (const page of pages) {
                page.index[0] += insertingLen;
                page.index[1] += insertingLen;
            }

            const firstPage = pages.splice(0, 1)[0]; // 剪掉第一页，从它开始往前，重新分页
            const firstPageSize = getPageSize(firstPage);
            const oldFirstPageHeight = firstPage.height;

            this.prependData(pages, firstPage.index[0] + firstPageSize - 1, insertingLen + firstPageSize);

            const offsetPageCount = pages.length - oldPageLen; // 总页数可能变化

            this.pageOptions.totalPageCount = pages.length;
            this.cache.dataLength += insertingLen;
            this.cache.pageNum += offsetPageCount; // 保持当前页码相对不变
            this.cache.endPageNum += offsetPageCount; // 保持当前页码相对不变
            this.prependRepairman.prepare(offsetPageCount, oldFirstPageHeight);
        },
        changeScrollDistance(val, changeCacheImmediately) {
            this.getScrollElem().scrollTop = val;
            // 马上改变 cache.scrollTop
            // 因为 scroll 事件的回调不是立即触发的，有时候会触发不了。
            // 比如把 data 置空，并执行本方法时，回调触发前时候其实 DOM 已经更新了，滚动高度已经不存在
            if (changeCacheImmediately) this.cache.scrollTop = val;
        },
        appendData(pages, startIndex, addend) {
            const { minItemSize, pageSize } = this.pageOptions;
            const onePageMinHeight = minItemSize * pageSize;

            for (let index = startIndex; index < startIndex + addend; index += pageSize) {
                pages.push({
                    index: [index, index + pageSize - 1], // 在 data 中的位置
                    height: onePageMinHeight // 初始高度
                });
            }

            // 若最后一页不满页，进行修正
            if (pages.length > 0) {
                this.fixEdgePage(pages[pages.length - 1], addend, true);
            }
        },
        prependData(pages, startIndex, addend) {
            const { minItemSize, pageSize } = this.pageOptions;
            const onePageMinHeight = minItemSize * pageSize;

            for (let index = startIndex; index >= 0; index -= pageSize) {
                pages.unshift({
                    index: [index - pageSize + 1, index],
                    height: onePageMinHeight
                });
            }

            if (pages.length > 0) {
                this.fixEdgePage(pages[0], addend, false);
            }
        },
        /** 修正不满页时数据不对，针对头页和尾页 */
        fixEdgePage(page, addend, isEnd) {
            const { minItemSize, pageSize } = this.pageOptions;
            const edgePageLength = addend % pageSize;

            if (edgePageLength !== 0) {
                if (isEnd) {
                    page.index[1] = page.index[0] + edgePageLength - 1;
                } else {
                    page.index[0] = page.index[1] - edgePageLength + 1;
                }
                page.height = minItemSize * edgePageLength;
            }
        },
        /** 修正前面插入数据时，调整滚动距离，让当前视图相对不变 */
        fixPrependScrollOffset() {
            const { scrollTop, pageNum } = this.cache;
            const { offsetPage, oldFirstPageHeight } = this.prependRepairman;
            let scrollOffset = 0;

            for (let index = 0; index < offsetPage + 1; index++) {
                scrollOffset += this.pages[index].height;
            }
            scrollOffset -= oldFirstPageHeight; // 旧第一页的数据可能是由数量不饱和变成饱和

            this.prependRepairman.isStopScrollUpdate = true;
            this.changeScrollDistance(scrollTop + scrollOffset);

            // 页码变了 && 偏向前的变动
            if (this.updatePageNum() && this.cache.pageNum < pageNum) {
                this.prependRepairman.shouldKeepViewStable = true;
            }
        },
        /** 获取要渲染的数据坐标范围 */
        updateRenderingDataRange() {
            const { pageNum, endPageNum } = this.cache;
            const startIndex = this.pages[pageNum]?.index[0] || 0;
            const endIndex = this.pages[endPageNum]?.index[1] || 0;

            this.cache.startIndex = startIndex;
            this.cache.endIndex = endIndex;

            return { startIndex, endIndex };
        },
        /** 更新应渲染的页数量 */
        updateRenderingPageCount() {
            const scrollElem = this.getScrollElem();
            const { minItemSize, pageSize, bufferPageCount } = this.pageOptions;
            // 当前展示的数据最小总高度，应大于容器的高度
            // 展示多少页 = (容器高度 / 一页高度) + 缓冲页数
            const newPageCount = Math.ceil(scrollElem.clientHeight / minItemSize / pageSize) + bufferPageCount;

            if (newPageCount !== this.pageOptions.renderingPageCount) {
                this.pageOptions.renderingPageCount = newPageCount;

                return true;
            }
            return false;
        },
        /** 用一页首尾的行，计算出该页的高度 */
        getPageHeight(startIndex, endIndex) {
            const startItemElem = this.getItemElem(startIndex);
            const endItemElem = this.getItemElem(endIndex);

            return endItemElem.getBoundingClientRect().bottom - startItemElem.getBoundingClientRect().top;
        },
        /** 计算当前渲染中的`页总高度` */
        getRenderingTotalPagesHeight() {
            const { startIndex, endIndex } = this.cache;

            if (this.pages.length === 0) {
                return 0;
            } else {
                return this.getPageHeight(startIndex, endIndex);
            }
        },
        /** 更新当前渲染中的`各页高度` */
        updateRenderingPagesHeight() {
            const pages = this.pages;

            if (pages.length === 0) return 0;

            const { pageNum, endPageNum } = this.cache;
            let heightOffset = 0;

            for (let index = pageNum; index <= endPageNum; index++) {
                const page = pages[index];
                const newHeight = this.getPageHeight(page.index[0], page.index[1]);
                if (page.height !== newHeight) {
                    heightOffset += newHeight - page.height;
                    page.height = newHeight;
                }
            }

            return heightOffset;
        },
        /** 用页的高度，算出前后留白的大小 */
        getFillingOffset() {
            const { pageNum, endPageNum } = this.cache;

            let frontOffset = 0;
            let endOffset = 0;

            this.pages.forEach((iPage, iPageNum) => {
                if (iPageNum < pageNum) {
                    frontOffset += iPage.height;
                } else if (iPageNum > endPageNum) {
                    endOffset += iPage.height;
                }
            });

            return { frontOffset, endOffset };
        },
        /** 更新前后留白的大小 */
        updateFillingOffset() {
            const res = this.getFillingOffset();
            this.cache.frontOffset = res.frontOffset;
            this.cache.endOffset = res.endOffset;
            return res;
        },

        /** 根据滚动距离，计算第一个页码 */
        getPageNumByScrollOffset(isReset, scrollOffset) {
            const { totalPageCount, renderingPageCount, bufferPageCount } = this.pageOptions;
            const oldPageNum = this.cache.pageNum;
            let pageNum;
            let endPageNum;

            if (isReset) {
                pageNum = 0;
            } else {
                // 有 bufferPageCount 的影响在，减 x 让 bufferPage 在前方也有
                pageNum = this.getUnsolvedPageNumByScrollOffset(scrollOffset) - Math.floor(bufferPageCount / 2);
                pageNum = Math.min(pageNum, totalPageCount - renderingPageCount); // 触底
                pageNum = Math.max(0, pageNum); // 避免上一步触底小于 0，比如只有一页时
            }

            endPageNum = Math.max(Math.min(pageNum + renderingPageCount, totalPageCount) - 1, 0); // 不超过最大页，不少于 0

            return {
                pageNum,
                endPageNum,
                isChange: pageNum !== oldPageNum
            };
        },
        /** 根据滚动距离，计算第一个页码（纯计算、未考虑边缘情况时） */
        getUnsolvedPageNumByScrollOffset(scrollOffset) {
            const pages = this.pages;
            let accumulatedSize = 0; // 页累计高度/宽度
            let pageNum = 0;

            // 避免 slot.before 影响
            scrollOffset -= this.domQuery(`.${this.cssClass.frontSpace}`).offsetTop;

            for (; pageNum < pages.length; pageNum++) {
                accumulatedSize += pages[pageNum].height;
                // 最靠前的、可见的页码
                if (accumulatedSize > scrollOffset) {
                    break;
                }
            }

            return pageNum;
        },
        /** 重新计算开始页码，若有变动将使组件重新渲染 */
        updatePageNum(isReset) {
            const { scrollTop } = this.getScrollElem();
            const { pageNum, endPageNum, isChange } = this.getPageNumByScrollOffset(isReset, scrollTop);

            Object.assign(this.cache, { pageNum, endPageNum });

            return isChange;
        },

        // 滚动事件 绑定
        bindScrollEvt() {
            const scrollElem = this.getScrollElem();
            scrollElem.addEventListener('scroll', this.scrollHandle, { passive: true });
        },
        // 滚动事件 解绑
        destroyScrollEvt() {
            const scrollElem = this.getScrollElem();
            scrollElem && scrollElem.removeEventListener('scroll', this.scrollHandle);
        },
        scrollHandle(e) {
            if (this.pages.length === 0) return; // 某些浏览器（火狐）刷新页面时可能会触发滚动（若刷新前滚动了）

            const { mutatedRatio } = this.pageOptions;
            const { startIndex, endIndex, scrollTop, dataLength } = this.cache;
            const { clientHeight, scrollTop: newScrollTop } = e.target;
            const isUpward = newScrollTop - scrollTop < 0;
            const isEqual = newScrollTop === scrollTop;

            this.cache.scrollTop = newScrollTop;

            if (this.prependRepairman.isStopScrollUpdate) {
                this.prependRepairman.isStopScrollUpdate = false;
            } else {
                if (isEqual) return;

                const scrollerBounding = e.target.getBoundingClientRect();

                // 做法一：
                // 计算临界点，快没内容了就重新计算页码。画一下图即可理解计算逻辑
                if (isUpward) {
                    const firstElemBounding = this.getItemElem(startIndex).getBoundingClientRect();

                    if (
                        startIndex !== 0 &&
                        (scrollerBounding.top - firstElemBounding.top) / clientHeight <= mutatedRatio
                    ) {
                        if (this.updatePageNum()) {
                            this.prependRepairman.shouldKeepViewStable = true;
                        }
                    }
                } else if (!isUpward) {
                    const endElemBounding = this.getItemElem(endIndex).getBoundingClientRect();

                    if (
                        endIndex !== dataLength - 1 &&
                        (endElemBounding.bottom - scrollerBounding.bottom) / clientHeight <= mutatedRatio
                    ) {
                        this.updatePageNum();
                    }
                }

                // 做法二：
                // 直接调用 updatePageNum
                // 可以再加个节流，但拖动太快会有白屏现象
                // 不节流，则会是较为连续和频繁的更新
                /* if (!this.updateTimer) {
                    this.updateTimer = setTimeout(() => {
                        this.updatePageNum();
                        this.updateTimer = null;
                    }, 20);
                } */
            }
        },

        // resize 事件 绑定
        bindRisizeEvt() {
            window.addEventListener('resize', this.resizeHandle, { passive: true });
        },
        // resize 事件 解绑
        destroyRisizeEvt() {
            window.removeEventListener('resize', this.resizeHandle);
        },
        resizeHandle() {
            this.updateRenderingPageCount();
            this.updatePageNum();
        },

        /** DOM 改变后，校正一些数据 */
        revise() {
            const { scrollTop } = this.getScrollElem();
            const pagesHeightOffset = this.updateRenderingPagesHeight();

            // 获取页面的高度后，若发现和记录的有偏差，可能需要处理滚动距离，使视图相对不变
            if (this.prependRepairman.shouldKeepViewStable && pagesHeightOffset) {
                this.changeScrollDistance(scrollTop + pagesHeightOffset);
            }
            this.prependRepairman.shouldKeepViewStable = false;

            if (this.prependRepairman.isWorking) {
                this.fixPrependScrollOffset(pagesHeightOffset);
                this.prependRepairman.reset();
            }
        },

        /** 获取`行`的特定类名 */
        getItemClassByIndex(index) {
            return `.${BASE_CSS_CLASS}-item-${index}`;
        },
        /** 通过下标，利用 css 选择器获取`行`的 DOM 元素 */
        getItemElem(index) {
            return this.domQuery(this.getItemClassByIndex(index));
        },
        domQuery(selector) {
            return this.$refs.containerRef.querySelector(selector);
        }
    },
    render(h) {
        const ListTag = this.tag;
        const ContainerTag = getParentTagName(ListTag);
        const SpaceTag = getSpaceTagName(ListTag);
        const { frontOffset, endOffset } = this.updateFillingOffset();
        const { startIndex, endIndex } = this.updateRenderingDataRange();

        this.$nextTick(() => {
            this.revise();
        });

        return (
            <ContainerTag style="position: relative;" class={this.cssClass.container} ref="containerRef">
                {(() => {
                    // 无数据时
                    if (this.renderNoData && this.pages.length === 0) {
                        return this.renderNoData(h);
                    }

                    return [
                        // slot.before
                        this.$scopedSlots.before?.(),
                        // 前占位
                        // 加 key 是因为组件行为和谷歌的 scrollTop 自适应冲突，导致一直往下滚一直触发 pageNum 更新，所以阻断此行为
                        <SpaceTag
                            key={autoId++}
                            class={this.cssClass.frontSpace}
                            style={{ borderWidth: 0, margin: 0, padding: 0, height: `${frontOffset}px` }}
                        ></SpaceTag>,
                        // 主内容
                        <ItemList
                            class={this.cssClass.parent}
                            tag={ListTag}
                            baseClass={BASE_CSS_CLASS}
                            data={this.data}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            renderItem={this.renderItem}
                            itemComponent={this.itemComponent}
                            itemKey={this.itemKey}
                            itemProps={this.itemProps}
                        ></ItemList>,
                        // 后占位
                        <SpaceTag
                            key={autoId++}
                            class={this.cssClass.endSpace}
                            style={{ borderWidth: 0, margin: 0, padding: 0, height: `${endOffset}px` }}
                        ></SpaceTag>,
                        // slot.after
                        this.$scopedSlots.after?.(),
                        // fix #1
                        <div key={autoId++} style="height: 0; visibility: hidden;"></div>
                    ];
                })()}
            </ContainerTag>
        );
    }
};
</script>
