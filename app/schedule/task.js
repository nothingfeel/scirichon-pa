const Subscription = require('egg').Subscription;


class Task extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置
    static get schedule() {
        return {
            interval: "300s", // 5 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    async subscribe() {
        let subject = "数学", section = "初中";
        let searchConditionArr = this.getSearchCondition();
        let catalogDataArr = await this.app.mongo.aggregate("catalog", {
            pipeline: [
                { "$match": { subject: subject, section: section, pk1: { $regex: /^.{2}$/ } } }
                , { "$group": { _id: { subject: "$subject", section: "$section", "nm": "$nm" }, count: { "$sum": 1 }, pk: { $first: "$pk" } } }
                , { "$project": { _id: 0, nm: "$_id.nm", pk: "$pk", count: "$count" } }
            ]
        })
        for (let catalogData of catalogDataArr) {

            let taskArr = [];
            for (let searchCondition of searchConditionArr) {

                let task = Object.assign({}, { pk: catalogData.pk }, searchCondition, {
                    complete: -1, //  -1 未开始   0进行中  1完成
                    pageCurrent: 1,
                    pageTotal: 1,
                    preProcess:0,//是否预处理 1已经预处理

                    running:0,
                    questionTotal:0,
                })
                taskArr.push(task)
            }
            await this.app.mongo.insertMany('Task', { docs: taskArr });
        }
    }

    getSearchCondition() {
        let processData = [
            { des: "题型", keyName: "ct", keyValues: ["1", "2", "9"], keyDes: ["选择题", "填空题", "解答题"], currentIndex: 0 }
            , { des: "难度", keyName: "dg", keyValues: ["11", "12", "13", "14", "15"], keyDes: ["易", "较易", "中档", "较难", "难"], currentIndex: 0 }
            , { des: "题类", keyName: "fg", keyValues: ["8", "4", "2", "16"], keyDes: ["常考题", "易错题", "好题", "压轴题"], currentIndex: 0 }
            , { des: "来源", keyName: "so", keyValues: ["1", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "20"], keyDes: ["中考真题", "自主招生", "中考模拟", "中考复习", "期末试题", "期中试题", "月考试题", "单元测验", "同步练习", "竞赛试题", "假期作业", "好题集"], currentIndex: 0 }
        ];
        let sArr = [];
        let p1 = processData[0];
        let p2 = processData[1];
        let p3 = processData[2];
        let p4 = processData[3];

        let ii = 0;
        for (let i1 = p1.currentIndex; i1 < p1.keyValues.length; i1++) {
            for (let i2 = 0; i2 < p2.keyValues.length; i2++) {
                if (i1 <= p1.currentIndex && i2 < p2.currentIndex)
                    continue;
                for (let i3 = 0; i3 < p3.keyValues.length; i3++) {
                    if (i1 <= p1.currentIndex && i2 <= p2.currentIndex && i3 < p3.currentIndex)
                        continue;
                    for (let i4 = 0; i4 < p4.keyValues.length; i4++) {
                        if (i1 <= p1.currentIndex && i2 <= p2.currentIndex && i3 <= p3.currentIndex && i4 < p4.currentIndex)
                            continue;
                        let p1Value = p1.keyValues[i1];
                        let p2Value = p2.keyValues[i2];
                        let p3Value = p3.keyValues[i3];
                        let p4Value = p4.keyValues[i4];
                        let d = { ct: p1Value, dg: p2Value, fg: p3Value, so: p4Value }
                        sArr.push(d);
                        this.ctx.logger.debug(`${++ii} ${JSON.stringify(d)}`)
                    }
                }
            }
        }
        return sArr;
    }


}

module.exports = Task;