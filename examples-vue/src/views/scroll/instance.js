class Example {
    autoId = 0;
    keyId = 0;
    list = [];
    listLen = 0;
    controls = {
        type: 'div',
        isAsync: true,
        asyncDuration: 300,
        initNum: 290,
        assignNum: 300,
        prependNum: 30,
        appendNum: 30,
        testNum: 1,
        randomBaseH: 40
    };
    vscrollController = {};

    constructor(assignProps) {
        Object.assign(this, assignProps);
    }

    reassign(num = this.controls.assignNum) {
        this.autoId = 0;
        this.listLen = num;
        this.list = this.createDatas(num, null);

        return this.list;
    }

    append(num = this.controls.appendNum) {
        const newRows = this.createDatas(num, true);

        this.listLen += newRows.length;
        this.list.push(...newRows);

        return newRows;
    }

    prepend(num = this.controls.prependNum) {
        const newRows = this.createDatas(num, false).reverse();

        this.listLen += newRows.length;
        this.list.unshift(...newRows);

        return newRows;
    }

    createDatas(len = 50, isAppend) {
        const arr = [];
        const randomBaseH = this.controls.randomBaseH;

        for (let index = 0; index < len; index++) {
            const id = ++this.autoId;
            arr.push({
                keyId: ++this.keyId,
                id,
                isAppend,
                // percent: `${(id / this.listLen) * 100}%`,
                height: `${Math.ceil(Math.random() * randomBaseH + 20)}px`
                // height: `20px`
            });
        }

        return arr;
    }
}

export { Example };
