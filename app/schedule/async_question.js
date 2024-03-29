const Subscription = require('egg').Subscription;
const { ObjectId } = require('bson');
const _ = require("lodash")
const cheerio = require('cheerio');
const UUID = require("uuid")
//const commonService = require('../service/common')

class AsyncQuestion extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "2.5s", // 1 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        console.log("begin " + new Date())
        // await this.app.mysql.delete("echo_question", {})
        // await this.app.mysql.delete("echo_question_catalog_rel", {})
        // await this.app.mysql.delete("echo_question_option_rel", {})
        // await this.app.mysql.delete("echo_question_point_rel", {})

        let batchCount = 20, index = 0;
        let tasks = await this.getTask();
        let processTasks = [];
        console.log("task length = " + tasks.length);

        try {
            let aaaaa = await this.addQuestions(tasks);
            // for (let task of tasks) {
            //     index++;
            //     processTasks.push(task);

            //     let sDate = new Date().getTime();
            //     // console.log("index=" + index + ", UUID=" + task.UUID)
            //     if ((index % batchCount) == 0 || (index + 1) > tasks.length) {
            //         let aaaaa = await this.addQuestions(processTasks);
            //         console.log("echo insert Time = " + parseInt(new Date().getTime() - sDate) / 1000 + "s  " + processTasks.length)
            //         processTasks = [];//清空一批任务
            //         //return;
            //         // console.log("aaaaaa = " + JSON.stringify(aaaaa))
            //     }
            // }
        } catch (e) {
            console.log("eee=>");
            this.app.logger.error(e);

        }
    }

    /**
     * 批量添加试题
     * @param {Array} processTasks Mongo的题数组
     */
    async addQuestions(processTasks) {
        let questions = [], questionCatalog = [], questionPoint = [], questionOption = [];
        let dt = new Date();
        let index = 0, largeContext = 0;
        for (let item of processTasks) {
            let  temp_questionCatalog = [];
            console.log(`index = ${index}`)

            index++;
            let catalogs = _.map(item.tPoint, function (mCatalog) {
                // if (mCatalog.pk1.length > 10)//取知识点的父级目录作为echo的题关联的目录
                return mCatalog.p_pk1
            });

            // let sDate = new Date().getTime();
            // var newCatalog = await this._getNewCatalog1(item.tPoint);
            //let newCatalog = { rCatalog: [], rPoints: [] };
            // console.log("getNewCatalog time = " + (new Date().getTime() - sDate) / 1000)

            //试题难度
            let difficulty_type = function (diff) {
                if (diff >= 0.81)
                    return 1;
                else if (diff >= 0.75)
                    return 2;
                else if (diff >= 0.6)
                    return 3;
                else if (diff >= 0.4)
                    return 4;
                else
                    return 5;
            }(item.DifficultyCoefficient)

            //试题类型
            let qType = function (qType) {
                if (qType == 1)
                    return 1;
                else if (qType == 2)
                    return 2;
                else if (qType == 3)
                    return 4;
                else if (qType == 4)
                    return 5;

            }(item.QuestionType)


            let $ = cheerio.load(item.Content, { decodeEntities: false });
            //题干
            let stem = "";
            if (item.ObjectiveFlag == 1)
                stem = $(".pt1").html();
            else
                stem = item.Content;
            stem = stem.replace(/<!--.{0,3}-->/g, "").replace(/（判断对错）/g, "").replace(/<br>/g, "<br />");

            //标准答案
            let answer = "";
            if (item.ObjectiveFlag == 1) {
                if (item.ObjectiveAnswer == "A")
                    answer = "1";
                else if (item.ObjectiveAnswer == "B")
                    answer = "2";
                else if (item.ObjectiveAnswer == "C")
                    answer = "4";
                else if (item.ObjectiveAnswer == "D")
                    answer = "8";
                else if (item.ObjectiveAnswer == "√")
                    answer = "1";
                else if (item.ObjectiveAnswer == "×")
                    answer = "2"
            }
            else
                answer = item.Answer.replace(/<!--.{0,3}-->/g, "").replace(/<br>/g, "<br />")
            //解析
            let analysis = item.Analys.replace(/<!--.{0,3}-->/g, "").replace(/<br>/g, "<br />");
            //解答
            let answer_des = item.Answer.replace(/<!--.{0,3}-->/g, "").replace(/<br>/g, "<br />");

            //试题选项-只有客观题才有
            let options = [];
            if (item.QuestionType == 1) {
                //console.log("UUID= " + item.UUID)
                options = this._matchOptions(item.Content)
            }
            else
                options = [];

            if (item.ObjectiveFlag == 1 && answer == "")//主观题 没有标准答案 就忽略
                continue;

            if ((item.QuestionType == 1) && options.length < 1)
                continue;

            let subjectObj = this.service.common.getSubjectId(item.CommonSection, item.CommonSubject)
            // if (subjectObj == null)
            //     continue
            console.log("uuid = " + item.UUID)

            let obj = {

                Id: item.UUID,
                subject_id: subjectObj.subject,
                subject_name: item.CommonSubject,
                stem: stem,
                question_type: qType,
                answer: answer,
                score: 0,
                analysis: analysis,
                answer_description: answer_des,
                difficulty_type: difficulty_type,
                difficulty_value: item.DifficultyCoefficient,
                create_user_id: "",
                objective: item.ObjectiveFlag,
                ref_course_total: 0,
                collection_total: 0,
                correct_total: 0,
                answer_total: 0,
                source_type: 1,
                create_time: dt,
                update_time: dt
            }
            questions.push(obj);

            // console.log(`options count = ${options.length}`)
            // console.log(`options = ${JSON.stringify(options)}`)
            //选择题选项
            let sequence_number = 0;
            for (let item1 of options) {
                questionOption.push({
                    Id: UUID.v1(),
                    question_id: item.UUID,
                    sequence_number: sequence_number,
                    item: item1
                });
                sequence_number++;
            }
            // console.log(`options = ${JSON.stringify(questionOption)}`)

            //目录
            for (let item1 of item.new_catalogs) {
                // console.log(`new_catalog = ${JSON.stringify(item1)}`)
                let catalogObj = {
                    question_id: item.UUID,
                    teaching_material_id: item1.m_id,
                    cid1: item1.cid1,
                    cid2: item1.cid2,
                    cid3: item1.cid3
                }
                temp_questionCatalog.push(catalogObj);
            }
            temp_questionCatalog = _.unionWith(temp_questionCatalog, _.isEqual)
            for (let item1 of temp_questionCatalog) {
                item1.Id = UUID.v1();
                questionCatalog.push(item1);
            }
            // console.log(`aa => ${JSON.stringify(questionCatalog)}`)

            //知识点
            for (let item1 of item.new_points) {
                // let mcPoint = this.app.mongo.db.collection("point");
                // let point3Obj = await mcPoint.findOne({ UUID: item1.pid3 });
                let pointObj = {
                    Id: UUID.v1(),
                    question_id: item.UUID,
                    pid1: item1.pid1,
                    pid2: item1.pid2,
                    pid3: item1.pid3
                    // pid3_name: point3Obj.nm
                }

                // console.log(JSON.stringify(point3Obj))
                // console.log(item1.pid3 + " == >" + point3Obj.nm);
                questionPoint.push(pointObj)
            }

            if (index % 200 == 0) {
                // if (questions.length > 0)
                //     await this.app.mysql.insert("echo_question", questions)
                // if (questionOption.length > 0)
                //     await this.app.mysql.insert("echo_question_option_rel", questionOption)

                if (questionCatalog.length > 0)
                    await this.app.mysql.insert("echo_question_catalog_rel", questionCatalog)
                // if (questionPoint.length > 0)
                //     await this.app.mysql.insert("echo_question_point_rel", questionPoint)

                questions = [];
                questionOption = [];
                questionCatalog = [];
                questionPoint = [];
            }
        }

        // console.log("question = " + JSON.stringify(questions))
        console.log("question count = " + questions.length)
        if (largeContext > 0)
            console.log(`large count = ${largeContext}`)

        // if (questions.length > 0)
        //     await this.app.mysql.insert("echo_question", questions)
        // if (questionOption.length > 0)
        //     await this.app.mysql.insert("echo_question_option_rel", questionOption)

        if (questionCatalog.length > 0)
            await this.app.mysql.insert("echo_question_catalog_rel", questionCatalog)
        // if (questionPoint.length > 0)
        //     await this.app.mysql.insert("echo_question_point_rel", questionPoint)

         await this.updateMongoQuestion(questions);
        console.log("duang!!!")
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

            // neo4j
            /*
            for (let item of questions) {
                item.new_catalogs = JSON.stringify(item.new_catalogs);
                item.new_points = JSON.stringify(item.new_points)
                let cql = `CREATE(n:Question {
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
                }) return n;`;
                // console.log("neo4j uuid " + item.uuid)
                let sDate = new Date().getTime();
                await this.service.common.runNeo4j(cql, { ...item });
                console.log("neo4j res time ==> " + (new Date().getTime() - sDate) / 1000)
                this.app.logger.info("neo4j res time ==> " + (new Date().getTime() - sDate) / 1000)
            }
            */

            for (let item of questions) {
                item.new_catalogs = JSON.stringify(item.new_catalogs);
                item.new_points = JSON.stringify(item.new_points);
            }

            // let batch = JSON.stringify(questions).replace(/\\\"/g, "");
            // {batch:${JSON.stringify(batch)}}
            let cql = `
            UNWIND {batch} as row
        CREATE(n:Question)
       set n.difficulty_value =  row.difficulty_value
       set n.difficulty_type =  row.difficulty_type
       set n.download_total = row.download_total
       set n.type = row.type
       set n.uuid = row.uuid
       set n.score = row.score
       set n.answer = row.answer
       set n.answer_des = row.answer_des
       set n.analysis = row.analysis
       set n.options = row.options
       set n.category = row.category
       set n.stem = row.stem
       set n.source_type = row.source_type
       set n.correct_total = row.correct_total
       set n.answer_total = row.answer_total
       set n.is_objective = row.is_objective
       set n.new_catalogs = row.new_catalogs 
       set n.new_points = row.new_points
            `;
            // console.log("neo4j uuid " + item.uuid)
            let sDate = new Date().getTime();

            let res = await this.service.common.runNeo4j(cql, { batch: questions });
            // console.log("neo4j res time ==> " + (new Date().getTime() - sDate) / 1000)
            this.app.logger.info("neo4j res time ==> " + (new Date().getTime() - sDate) / 1000)


            // console.log("sss ==> " + JSON.stringify(questions));


            //mongodb
            /*
            let bulks = [];
            for (let item of questions) {
                bulks.push({ insertOne: item });
            }
            await this.app.mongo.insertMany("echo_question", { docs: questions })
            */

        }
        catch (e) {
            this.app.logger.debug("saveQuestion catch ==> " + JSON.stringify(e));
            this.app.logger.debug("data  ==> " + JSON.stringify(data))
            return false;
        }
        return true;
    }

    /**
     * 
     * @param {Array} questions echo的题数组
     */
    async updateMongoQuestion(questions) {
        let mc = this.app.mongo.db.collection("M_Question_infoNew");
        let ids = _.map(questions, function (item) { return item.Id });
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
        let result = await mc.find({ UUID: { $gt: UUID }, ObjectiveFlag: 1 })
            .limit(1000).sort({ UUID: 1 }).toArray();
        // let result = await mc.find({UUID:"7551734c-2e26-cf0a-38a6-fb5db4bcb69e"}).toArray();
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
        if (!html || html.length < 1)
            return options;
        try {

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
                    let opHtml = $(this).html().replace(/^\s*<label class>.{0,2}/, "").replace(/\s*<.{0,1}label>/, "").replace(/<br>/g, "<br />")
                    //console.log("tr=>" + opHtml)
                    //console.log("op=>" + $(this).html())
                    options.push(opHtml);
                }
            })
        } catch (e) {
            console.log("errrr=>" + JSON.stringify(e));
            console.log("html=>" + html);
            return [];
        }
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