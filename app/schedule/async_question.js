const Subscription = require('egg').Subscription;
const { ObjectId } = require('bson');
const _ = require("lodash")
const cheerio = require('cheerio');

class AsyncQuestion extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "60s", // 5 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: false
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        console.log("begin " + new Date())
        let batchCount = 20, index = 0;
        let tasks = await this.getTask();
        let processTasks = [];

        for (let task of tasks) {
            index++;
            processTasks.push(task);
            if (index % batchCount == 0 || index + 1 > tasks.length) {
                await this.addQuestions(processTasks);

                processTasks = [];//清空一批任务
            }
        }
    }

    /**
     * 批量添加试题
     * @param {Array} processTasks Mongo的题数组
     */
    async addQuestions(processTasks) {
        let questions = [];
        for (let item of processTasks) {
            let catalogs = _.map(item.tPoint, function (mCatalog) {
                // if (mCatalog.pk1.length > 10)//取知识点的父级目录作为echo的题关联的目录
                return mCatalog.p_pk1
            });

            //试题难度
            let difficulty_value = function (diff) {
                if (diff > 0.75)
                    return 1;
                else if (diff > 0.5)
                    return 2;
                else if (diff > 0.25)
                    return 3;
                else
                    return 4;
            }(item.DifficultyCoefficient)

            //试题类型
            let qType = function (qType) {
                if (qType == 1)
                    return "choice";
                else if (qType == 3)
                    return "fill";
                else if (qType == 4)
                    return "qa";

            }(item.QuestionType)


            let $ = cheerio.load(item.Content, { decodeEntities: false });
            //题干
            let stem = "";
            if (item.ObjectiveFlag == 1)
                stem = $(".pt1").html();
            else
                stem = item.Content;
            stem = stem.replace(/<!--.{0,3}-->/g, "")
            //标准答案
            let answer = [];
            if (item.ObjectiveFlag == 1) {
                if (item.ObjectiveAnswer == "A")
                    answer = ["0"];
                else if (item.ObjectiveAnswer == "B")
                    answer = ["1"];
                else if (item.ObjectiveAnswer == "C")
                    answer = ["2"];
                else if (item.ObjectiveAnswer == "D")
                    answer = ["3"];
            }
            else
                answer = [item.Answer.replace(/<!--.{0,3}-->/g, "")]
            //解析
            let analysis = "";
            if (item.ObjectiveFlag == 1) {
                analysis = item.Answer.replace(/<!--.{0,3}-->/g, "") +
                    "<br />" +
                    item.Analys.replace(/<!--.{0,3}-->/g, "")
            }
            else
                analysis = item.Analys.replace(/<!--.{0,3}-->/g, "");

            //试题选项-只有客观题才有
            let options = [];
            if (item.ObjectiveFlag == 1) {
                console.log("UUID= " + item.UUID)
                options = this.matchOptions(item.Content)
            }
            else
                options = [];

            if (answer.length < 1)//主观题 没有标准答案 就忽略
                continue;

            let obj = {
                difficulty_value: difficulty_value,
                catalog: catalogs,
                download_total: 0,
                type: qType,
                analysis: analysis,
                uuid: item.UUID,
                score: 1,
                answer: answer,
                options: options,
                category: "Question",
                stem: stem,
                source_type: 0,
                correct_total: 0,
                answer_total: 0,
                is_objective: item.ObjectiveFlag == 1 ? 0 : 1
            }

            //console.log("question ==> " + JSON.stringify(obj))
            //return;
            questions.push(obj);

        }

        await this.saveQuestion(questions);
        await this.updateMongoQuestion(questions);
        return questions;
    }

    /**
     * 批量保存题目
     * @param {Array} questions echo的题数组
     */
    async saveQuestion(questions) {
        let data = { "data": { "category": "Question", fields: questions } }
        let res = null;
        res = await this.service.common.requestUri("/batch/api/question", "POST", data)

    }

    /**
     * 
     * @param {Array} questions echo的题数组
     */
    async updateMongoQuestion(questions){
        let mc = this.app.mongo.db.collection("M_Question_infoNew");
        let ids = _.map(questions, function (item) { return item.uuid });
        await mc.updateMany({ UUID: { $in: ids } }, { $set: { asyncStatus: 1 } })
    }

    matchOptions(html) {

        let options = []
        let $ = cheerio.load(html, { decodeEntities: false });

        let pt2Html = $(".pt2 table").html().replace(/<.{0,2}tbody>/g, "");
        let $$ = cheerio.load("<table id='opts'>" + pt2Html + "</table>", { decodeEntities: false });

        //console.log("html= " + $$.html())
        let tr = $$("#opts tbody tr").children("td")
        let trCount = 0, mCount = 0;
        tr.each(function (i, trElem) {

            mCount++;
            let tagName = trElem.parentNode.parentNode.parentNode.parentNode.tagName;
            if (tagName == "body") {

                trCount++;
                // let o = Object.assign({},trElem);
                let opHtml = $(this).html().replace(/^\s*<label class>.{0,2}/, "").replace(/\s*<.{0,1}label>/, "")
                //console.log("tr=>" + opHtml)
                //console.log("op=>" + $(this).html())
                options.push(opHtml);
            }
        })
        //console.log("tr count=>" + trCount + "  mCount=" + mCount)
        return options;
    }

    async getTask() {

        let flag = true;
        let taskUUID = null, UUID = "";
        while (flag) {
            taskUUID = await this.getTaskUUID();
            if (taskUUID != null) {
                flag = false;
                UUID = taskUUID.UUID;
            }
        }

        let mc = this.app.mongo.db.collection("M_Question_infoNew");
        let result = await mc.find({ UUID: { $gt: UUID }, Status: 1, asyncStatus: 0 })
            .limit(100).sort({ UUID: 1 }).toArray();
        let ids = _.map(result, function (item) { return item.UUID });
        await mc.updateMany({ UUID: { $in: ids } }, { $set: { asyncStatus: 2 } })
        await this.updateTaskUUID(UUID, ids[ids.length - 1])
        return result;
    }

    async getTaskUUID() {
        let result = await this.app.mongo.findOneAndUpdate("asyncQuestion", {
            filter: { Status: 0 },
            update: { $set: { Status: 1 } }
        });
        return result.value;
    }

    async updateTaskUUID(oldUUID, newUUID) {
        let result = await this.app.mongo.findOneAndUpdate("asyncQuestion", {
            filter: { UUID: oldUUID },
            update: { $set: { Status: 0, UUID: newUUID }, $inc: { count: 1 } }
        })
        console.log("updateTaskUUID ==> " + JSON.stringify(result))
        return result;
    }
}

module.exports = AsyncQuestion;