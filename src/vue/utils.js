/** 获取上一级的标签名 */
function getParentTagName(childTag) {
    if (childTag === 'tbody') return 'table';

    return 'div';
}

/** 获取下一级的标签名 */
function getSpaceTagName(parentTag) {
    if (parentTag === 'tbody') return 'tr';
    return 'div';
}

function getPageSize(page) {
    return page.index[1] - page.index[0] + 1;
}

/**  获取虚拟滚动组件的控制方法 */
function getComponentController(to, from) {
    Object.assign(to, from);
}

export { getParentTagName, getSpaceTagName, getPageSize, getComponentController };
