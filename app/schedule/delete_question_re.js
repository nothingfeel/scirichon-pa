const Subscription = require('egg').Subscription;
const { ObjectId } = require('bson');
const _ = require("lodash")
const cheerio = require('cheerio');
//const commonService = require('../service/common')

class ReQuestion extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "30s", // 1 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        console.log("begin " + new Date())


        let batchCount = 20, index = 0;
        let tasks = await this.getTask();
        tasks = _.map(tasks.records, function (item) {
            return item._fields[0];
        });
        let processTasks = [];
        if (tasks.length < 1) {
            console.log("duang!!!!");
            return;
        }
        // console.log("task length = " + tasks.length);
        // console.log("ss ==> " + JSON.stringify(tasks))

        for (let task of tasks) {
            index++;
            processTasks.push(task);
            let sDate = new Date().getTime();
             console.log("index=" + index + ", UUID=" + task)
            if ((index % batchCount) == 0 || (index + 1) > tasks.length) {
                let aaaaa = await this.addQuestions(processTasks);
                console.log("echo insert Time = " + parseInt(new Date().getTime() - sDate) / 1000 + "s  " + processTasks.length)
                processTasks = [];//清空一批任务
                //return;
                // console.log("aaaaaa = " + JSON.stringify(aaaaa))
            }
        }
    }

    /**
     * 批量添加试题
     * @param {Array} processTasks Mongo的题数组
     */
    async addQuestions(processTasks) {
        for (let item of processTasks) {

            let cql = `MATCH (n:Question {uuid: "${item}"})
        WITH n
        SKIP 1
        DELETE n`
            // console.log(cql);
            await this.service.common.runNeo4j(cql)
        }
    }


    /**
     * 获得一批要导入的试题任务
     */
    async getTask() {
        let cql = `match (n:Question) with n.uuid as uuid, count(n.uuid) as total where total>1 return uuid, total limit 100;`;
        let r = await this.service.common.runNeo4j(cql);
        return r;
    }



    /**
     * 更新任务的试题UUID
     * 当前进行到的试题UUID
     * @param {string} oldUUID 老的试题UUID
     * @param {string} newUUID 新的试题UUID
     */
    async _updateTaskUUID(oldUUID, newUUID) {
        let result = await this.app.mongo.findOneAndUpdate("asyncQuestion", {
            filter: { UUID: oldUUID },
            update: { $set: { Status: 0, UUID: newUUID }, $inc: { count: 1 } }
        })
        console.log("updateTaskUUID ==> " + JSON.stringify(result))
        return result;
    }
}

module.exports = ReQuestion;