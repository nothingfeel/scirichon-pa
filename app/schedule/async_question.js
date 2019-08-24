const Subscription = require('egg').Subscription;
const { ObjectId } = require('bson');
const _ = require("lodash")
const cheerio = require('cheerio');
//const commonService = require('../service/common')

class AsyncQuestion extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "10s", // 1 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: false
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        console.log("begin " + new Date())


        let batchCount = 10, index = 0;
        let tasks = await this.getTask();
        let processTasks = [];
        console.log("task length = " + tasks.length);

        for (let task of tasks) {
            index++;
            processTasks.push(task);
            let sDate = new Date().getTime();
            if (index % batchCount == 0 || index + 1 > tasks.length) {

                let aaaaa = await this.addQuestions(processTasks);
                console.log("echo insert Time = " + parseInt(new Date().getTime() - sDate) / 1000 + "s")
                processTasks = [];//清空一批任务

                // console.log("aaaaaa = " + JSON.stringify(aaaaa))
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

            var newCatalog = await this._getNewCatalog(item.tPoint);

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
            let analysis = item.Analys.replace(/<!--.{0,3}-->/g, "");
            //解答
            let answer_des = item.Answer.replace(/<!--.{0,3}-->/g, "");

            //试题选项-只有客观题才有
            let options = [];
            if (item.ObjectiveFlag == 1) {
                //console.log("UUID= " + item.UUID)
                options = this._matchOptions(item.Content)
            }
            else
                options = [];

            if (item.ObjectiveFlag == 1 && answer.length < 1)//主观题 没有标准答案 就忽略
                continue;

            let obj = {
                difficulty_value: difficulty_value,
                //catalog: catalogs,
                download_total: 0,
                type: qType,
                uuid: item.UUID,
                score: 1,
                answer: answer,
                answer_des: answer_des,
                analysis: analysis,
                options: options,
                category: "Question",
                stem: stem,
                source_type: 0,
                correct_total: 0,
                answer_total: 0,
                is_objective: item.ObjectiveFlag == 1 ? 0 : 1,
                new_catalogs: newCatalog.rCatalogs,
                new_points: newCatalog.rPoints
            }

            //console.log("question ==> " + JSON.stringify(obj))
            //return;
            questions.push(obj);
            // return questions;
        }

        await this.saveQuestion(questions);
        await this.updateMongoQuestion(questions);
        return questions;
    }

    /**
     * 获取目录的父级对象
     * @param {Array} catalogs 目录集合
     */
    async _getNewCatalog(catalogs) {

        let rCatalogs = [], rPoints = [];
        let sort = 1;
        for (let catalog of catalogs) {

            let r = await this._getCatalogParents(catalog)
            let rCatalog = { sort_num: 1, m_id: "", cid1: "", cid2: "", cid3: "" };
            let rPoint = { sort_num: 1, pid1: "", pid2: "", pid3: "" }

            let c1 = _.find(r.catalogs, { level: 1 });
            let c2 = _.find(r.catalogs, { level: 2 });
            let c3 = _.find(r.catalogs, { level: 3 });

            if (c1) {
                rCatalog.sort_num = sort;
                rCatalog.m_id = c1.t_bk;
                rCatalog.cid1 = c1.pk1;
            }

            if (c2)
                rCatalog.cid2 = c2.pk1;
            if (c3)
                rCatalog.cid3 = c3.pk1;



            let p1 = _.find(r.points, { level: 1 });
            let p2 = _.find(r.points, { level: 2 });
            let p3 = _.find(r.points, { level: 3 });

            if (p1)
                rPoint.pid1 = p1.UUID;
            if (p2)
                rPoint.pid2 = p2.UUID;
            if (p3)
                rPoint.pid3 = p3.UUID;

            rCatalogs.push(rCatalog);
            rPoints.push(rPoint);
            sort++;

            // console.log("rCatalog = " + JSON.stringify(rCatalog))
            // console.log("rPoint = " + JSON.stringify(rPoint))
        }
        // console.log("sssssssssd = " + JSON.stringify(rCatalogs))
        // console.log("sssssssssf = " + JSON.stringify(rPoints))
        //去重知识点。
        rPoints = _.uniqBy(rPoints, 'pid3');

        return { rCatalogs, rPoints }
    }


    /**
     * 获得目录和知识点的父
     * @param {string} catalog 末级目录id
     * @param {number} level 目录层级
     */
    async _getCatalogParents(catalog) {
        let mcCatalog = this.app.mongo.db.collection("catalog");

        let mcPoint = this.app.mongo.db.collection("point");
        let catalogs = [], points = [], catalogRoot = false, pointRoot = false;
        let questionCatalog = await mcCatalog.findOne({ _id: new ObjectId(catalog._id) }); //题挂的是知识点
        // console.log("getCatalog " + JSON.stringify(catalog))
        // console.log("catalog_id  = " + catalog._id)
        // console.log("questionCatalog = " + JSON.stringify(questionCatalog))
        let questionPoint = await mcPoint.findOne({ UUID: questionCatalog.pointUUID });

        // console.log("questionPoint = " + JSON.stringify(questionPoint))

        if (questionCatalog.isPoint == false)
            catalogs.push(questionCatalog);
        points.push(questionPoint);

        let catalog_p_pk = questionCatalog.p_pk;
        let point_p_pk = questionPoint.PUUID
        while (!catalogRoot) {
            questionCatalog = await mcCatalog.findOne({ pk: catalog_p_pk });
            catalogs.push(questionCatalog);
            if (questionCatalog && questionCatalog.level > 1)
                catalogRoot = false;
            else
                catalogRoot = true;
            catalog_p_pk = questionCatalog.p_pk;
        }
        // console.log("catalogs = " + JSON.stringify(catalogs))

        while (!pointRoot) {
            questionPoint = await mcPoint.findOne({ UUID: point_p_pk })
            points.push(questionPoint);
            if (questionPoint && questionPoint.level > 1)
                pointRoot = false;
            else
                pointRoot = true;
            point_p_pk = questionPoint.PUUID;
        }
        // console.log("points = " + JSON.stringify(points))
        return { catalogs, points }
    }

    /**
     * 批量保存题目
     * @param {Array} questions echo的题数组
     */
    async saveQuestion(questions) {
        let data = { "data": { "category": "Question", fields: questions } }

        try {
            /*
            //batch api
            let res = null;
            res = await this.service.common.requestUri("/batch/api/question", "POST", data)
            console.log("saveQuestion res = " + JSON.stringify(res));
*/
            /*
            // neo4j
            for (let item of questions) {
                item.new_catalogs = JSON.stringify(item.new_catalogs);
                item.new_points = JSON.stringify(item.new_points)
                let cql = `CREATE(n:Test1 {
                    difficulty_value:{difficulty_value},
                    download_total:{download_total},
                    type:{type},
                    uuid:{uuid},
                    score:{score},
                    answer:{answer},
                    answer_des:{answer_des},
                    analysis:{analysis},
                    options:{options},
                    category:{category},
                    stem:{stem},
                    source_type:{source_type},
                    correct_total:{correct_total},
                    answer_total:{answer_total},
                    is_objective:{is_objective},
                    new_catalogs:{new_catalogs},
                    new_points:{new_points}
                });`;
                let sDate = new Date().getTime();
                await this.service.common.runNeo4j(cql, { ...item });
                console.log("neo4j res ==> " + (new Date().getTime() - sDate) / 1000)
            }
            */

            //mongodb
            this.app.mongo.insertMany("echo_question", { docs: questions })

        }
        catch (e) {
            this.app.logger.debug("saveQuestion catch ==> " + JSON.stringify(e));
            this.app.logger.debug("data  ==> " + JSON.stringify(data))
        }
    }

    /**
     * 
     * @param {Array} questions echo的题数组
     */
    async updateMongoQuestion(questions) {
        let mc = this.app.mongo.db.collection("M_Question_infoNew");
        let ids = _.map(questions, function (item) { return item.uuid });
        await mc.updateMany({ UUID: { $in: ids } }, { $set: { asyncStatus: 1 } })
    }


    /**
     * 获得一批要导入的试题任务
     */
    async getTask() {
        let flag = true;
        let taskUUID = null, UUID = "";
        while (flag) {
            taskUUID = await this._getTaskUUID();
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
        await this._updateTaskUUID(UUID, ids[ids.length - 1])
        return result;
    }

    /**
     * 主观题，从题干里匹配出选项
     * @param {string} html 题干HTML
     */
    _matchOptions(html) {

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

    /**
     * 获得任务开始的试题UUID
     */
    async _getTaskUUID() {
        let result = await this.app.mongo.findOneAndUpdate("asyncQuestion", {
            filter: { Status: 0 },
            update: { $set: { Status: 1 } }
        });
        return result.value;
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

module.exports = AsyncQuestion;