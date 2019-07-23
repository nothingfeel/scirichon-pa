const Subscription = require('egg').Subscription;
const cheerio = require('cheerio');
const _ = require("lodash")
const { ObjectId } = require('bson');
var UUID = require('uuid');

/**
 * 1、分页请求试题列表
 * 2、分页数据回写task 
 * 3、判断搜索条件是否完成Task.completeStatus = 1,   pageCurrent == pageTotal
 * 4|$("#TotalQuesN").html("共计<em style='color:red' ondbclick='fixbox()'>1000</em>道相关试题");
 */


class Question extends Subscription {
    static get schedule() {
        return {
            interval: "10s",
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: false
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        let task = await this.getTask();
        if (!task) {
            this.app.logger.info("no task " + new Date());
            return;
        }
        this.app.logger.info(task.pk)
        await this.getQuestionStem(task)
    }


    /**
     * 预处理一个任务
     * @param {Object} task 任务对象
     */
    async getQuestionStem(task) {

        task = await this.analyzeQuestionCondition(task);
        // console.log("analyze  result  " + JSON.stringify(task))

        let questionArr = await this.getResponsDataByTask(task);
        let conditionResult = task.condition;
        let questionResult = [];

        //重新计算Task的condition
        for (let conditionItem of task.condition) {
            let question = _.find(questionArr, function (o) {
                return o.requestData.ct == conditionItem.ct &&
                    o.requestData.dg == conditionItem.dg &&
                    o.requestData.fg == conditionItem.fg &&
                    o.requestData.so == conditionItem.so
            })
            delete conditionItem.pk;
            // console.log("dd   " + JSON.stringify(question))
            if (question) {
                let complete = -1;
                let questionTotal = question.questionArr.questionTotal || 0;
                let pageTotal = question.questionArr.pageTotal || 1;
                let pageCurrent = question.questionArr.pageCurrent || 0;
                if (questionTotal == 0 || pageTotal == 1)
                    complete = 1

                conditionItem.complete = complete;
                conditionItem.preProcess = 1;
                conditionItem.pageCurrent = pageCurrent;
                conditionItem.pageTotal = pageTotal;
                conditionItem.questionTotal = questionTotal;
            }
        }

        // console.log(JSON.stringify(questionArr))

        for (let item of questionArr) {
            for (let question of item.questionArr.questions) {
                let requestData = item.requestData;

                question.id = UUID.v1();
                question.stemTime = new Date();
                question.running = 0
                question.catalogs = [{
                    q: task.pk, //目录&知识点id
                    fg: requestData.fg,//题类
                    so: requestData.so,//来源
                    dg: requestData.dg,//难度
                    ct: requestData.ct,//题型

                }];
                question.section = task.section;
                question.subject = task.subject;
                questionResult.push(question)
            }
        }

        //set Task.condition
        let preProcess = 0;
        let proProcessSuccessCount = _.filter(task.condition, { preProcess: 1 }).length;
        if (proProcessSuccessCount >= task.condition.length)
            preProcess = 1;
        let mc = this.app.mongo.db.collection("Task");
        await mc.update(
            { pk: task.pk },
            { $set: { condition: conditionResult, running: 0, preProcess: preProcess, analyzeQC: 1, t: new Date() } }
        )
        //save Question
        if (questionResult.length > 0)
            await this.app.mongo.insertMany("Question", { docs: questionResult })
        console.log("End..........................")
    }

    /**
     * 分析空的任务
     * @param {Object} task 任务对象
     */
    async analyzeQuestionCondition(task) {

        if (task.analyzeQC && task.analyzeQC == 1)
            return task;

        let condition = _.uniqWith(
            _.map(task.condition, function (item) { return { ct: item.ct, dg: item.dg } }),
            _.isEqual
        );

        let taskTemp = _.cloneDeep(task);
        taskTemp.condition = _.map(condition, function (item) {
            return {
                "ct": item.ct,
                "dg": item.dg,
                "fg": "0",
                "so": "0",
                "complete": 0,
                "pageCurrent": 1,
                "pageTotal": 1,
                "preProcess": 0,
                "running": 0,
                "questionTotal": 0
            }
        });
        let questionArr = await this.getResponsDataByTask(taskTemp);

        for (let item of questionArr) {
            if (item.questionArr.questionTotal >= 1)
                continue;

            for (let condition of task.condition) {
                if (item.requestData.ct == condition.ct && item.requestData.dg == condition.dg) {
                    condition.complete = 1;
                    condition.preProcess = 1;
                }
            }
        }
        return task;
    }

    async stay(m) {
        return new Promise(function (resolve, reject) {
            setTimeout(() => { resolve() }, m)
        });
    }

    async getResponsDataByTask(task) {
        let url = task.url.replace('search', 'partialques');

        let conditionArr = _.filter(task.condition, { preProcess: 0 });
        if (conditionArr.length > 200)
            conditionArr.length = 200;
        console.log("condition length = " + conditionArr.length)

        let questionPromiceArr = [];
        for (let condition of conditionArr) {
            await this.stay(parseInt(Math.random() * 10) + 10);
            condition.pk = task.pk;
            let question = this.sendConditionItem(condition, url)
            questionPromiceArr.push(question)
        }
        let questionArr = [];
        await Promise.all(questionPromiceArr)
            .then((que) => {
                questionArr = que;
                // console.log(` questionTotal=${JSON.stringify(que)}`)
            }).catch((e) => {
                console.log(`condition err = ${JSON.stringify(e)}  `)
            });

        return questionArr;
    }

    /**
     * 发起一个条件的http请求
     * @param {Object} task 任务对象
     * @param {string} url url
     */
    async sendConditionItem(task, url) {
        let proxy = await this.getProxy();
        if (!proxy)
            return null;

        let that = this;
        return new Promise(function (resolve, reject) {

            let requestData = {
                q: task.pk, //目录&知识点id
                ct: task.ct || 0,//题型
                dg: task.dg || 0,//难度
                fg: task.fg || 0,//题类
                so: task.so || 0,//来源

                pd: 1,
                lbs: "",
                pi: task.pageCurrent || 1,//分页
                r: Math.random()//随机数
            };
            that.app.logger.info(JSON.stringify(requestData))
            that.ctx.curl(url, {
                headers: {
                    "user-agent": that.getUserAgent(),
                    "host": "www.jyeoo.com",
                    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                    //"accept-language": "gzip, deflate",
                },
                data: requestData,
                method: "GET",
                dataType: "text",
                enableProxy: true,
                proxy: "http://" + proxy.ip
            }).then(r => {
                let htmlStr = r.data || "";
                let questionArr = {};
                try {
                    questionArr = that.matchQuestionStem(htmlStr)
                } catch (e) {
                    e.mmm = "解析无效";
                    e.requestData = requestData;
                    reject(e);
                }
                let resultData = { questionArr: questionArr, requestData: requestData };
                resolve(resultData)
            }, e => {
                e.requestData = requestData
                reject(e)
            });

        });


    }

    /**
     * 解析html
     * @param {string} htmlStr 
     * @returns {Object} { questions, pageCurrentIndex, pageTotal }
     */
    matchQuestionStem(htmlStr) {
        let $ = cheerio.load(htmlStr, { decodeEntities: false });

        let questions = Array.from($(".ques-list li"));
        let resultArr = [];
        for (let item of questions) {//题
            let questionDataItem = {};
            for (let c of item.children) {//题里的子元素
                if (c && c.name == "fieldset") {//题干和题选项
                    let fieldset = cheerio.load(c, { decodeEntities: false });
                    questionDataItem.stem = fieldset(".pt1").html()
                    questionDataItem.options = fieldset(".pt2").html()
                    questionDataItem.id = c.attribs["id"];
                }

                if (c && c.name == "div" && c.attribs["class"] == "fieldtip") {
                    let fieldtip = cheerio.load(c);
                    let fieldtipChilren = Array.from(fieldtip(".fieldtip-left").children());
                    fieldtipChilren.forEach(function (tip) {
                        let temp = tip.children[0].data || "";
                        let tempArr = temp.split("：");
                        if (tempArr.length > 0) {
                            switch (tempArr[0]) {
                                case "收录":
                                    questionDataItem.includeDate = tempArr[1];
                                    break;
                                case "组卷":
                                    questionDataItem.refTotal = tempArr[1];
                                    break;
                                case "真题":
                                    questionDataItem.quesTotal = tempArr[1];
                                    break;
                                case "难度":
                                    questionDataItem.difficutly = tempArr[1];
                                    break;
                            }
                        }
                    })
                }//end 题的tip
            }
            resultArr.push(questionDataItem);
        }

        //提取题的分页
        let pageText = $(".page select option[selected]").html() || ""
        let pageArr = pageText.split(" / ");
        let pageCurrent = 1, pageTotal = 1, questionTotal = 0;
        if (pageArr.length > 1) {
            pageCurrent = parseInt(pageArr[0]);
            pageTotal = parseInt(pageArr[1]);
        }

        let questionTotalMatch = htmlStr.match(/.+'>(\d+)<\/em>道相关试题\".+/);
        if (questionTotalMatch && questionTotalMatch.length >= 2) {
            questionTotal = parseInt(questionTotalMatch[1]);
        }

        this.app.logger.info("本调解的总页数为： " + pageTotal + "  总题数为：" + questionTotal)
        return { questions: resultArr, pageCurrent: pageCurrent, pageTotal: pageTotal, questionTotal: questionTotal };
    }


    /**
     * 保存试题
     * @param {Object} task 任务对象
     * @param {Array} questions 试题数组
     */
    async saveQuestionStem(questions) {

        if (questions.length <= 0)
            return;


        //let { section, subject } = await this.app.mongo.findOne("TeachingMeterial", { query: { bk: task.pk.split("~")[0] } })
        for (let question of questions) {
            question.id = UUID.v1();
            question.catalogs = [{
                q: task.pk, //目录&知识点id
                fg: task.fg,//题类
                so: task.so,//来源
                dg: task.dg,//难度
                ct: task.ct,//题型
                section: section,
                subject: subject
            }];
        }

    }

    getUserAgent() {
        let user_agent_list = ['Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1464.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.16 Safari/537.36',
            'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.3319.102 Safari/537.36',
            'Mozilla/5.0 (X11; CrOS i686 3912.101.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36',
            'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36',
            'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36',
            'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:17.0) Gecko/20100101 Firefox/17.0.6',
            'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1468.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2224.3 Safari/537.36',
            'Mozilla/5.0 (X11; CrOS i686 3912.101.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36']

        return user_agent_list[parseInt(Math.random() * (user_agent_list.length - 1))]
    }


    /**
     * 获取一个需要预处理的任务
     */
    async getTask() {
        //获得未预处理且处理不在处理中的任务。
        let taskRet = await this.app.mongo.findOneAndUpdate("Task", {
            filter: { section: "初中", subject: "物理", preProcess: 0, running: 0 },
            update: { $set: { running: 1 } },
            options: { sort: { pk: 1 } }
        });

        let task = null;
        if (!taskRet.lastErrorObject.updatedExisting)
            return task;
        task = taskRet.value;
        //console.log("get task = " + JSON.stringify(task))
        let { section, subject } = await this.app.mongo.findOne("TeachingMeterial", { query: { bk: task.pk.split("~")[0] } })
        let subjectData = await this.app.mongo.findOne("Subject", { query: { subject: subject, section: section } })
        return Object.assign(task, { url: subjectData.url });
    }

    /**
     * 更新任务对象
     * @param {Object} task 任务对象
     * @param {number} pageCurrent 当前分页
     * @param {number} pageTotal 总页数
     * @param {number} questionTotal 总题数
     */
    async updateTask(task, pageCurrent, pageTotal, questionTotal) {
        let mc = this.app.mongo.db.collection("Task");
        let complete = -1;
        if (questionTotal == 0 || pageTotal == 1)
            complete = 1
        await mc.update({ _id: new ObjectId(task._id) }, {
            $set: {
                preProcess: 1,
                pageCurrent: pageCurrent,
                pageTotal: pageTotal,
                questionTotal: questionTotal,
                complete: complete,
                running: 0
            }
        });
        //console.log("updateTask result = " + JSON.stringify(rr))
    }

    /**
     * 获得一个代理ip对象
     */
    async getProxy() {
        let proxyRet = await this.app.mongo.findOneAndUpdate("ProxyIP", {
            filter: {
                "$or": [
                    { successRatio: { "$gte": 66 } },
                    { count: { "$lt": 50 } }]
            },
            update: {
                $set: { running: 1, lastUseTime: new Date() },
                $inc: { count: 1 },

            },
            options: { sort: { lastUseTime: -1 } }
        });
        if (!proxyRet.lastErrorObject.updatedExisting)
            return null;
        return proxyRet.value;
    }

    /**
     * 更新代理ip对象
     * @param {Object} proxy 代理ip对象
     * @param {bool} success 是否请求成功
     */
    async updateProxy(proxy, status) {

        let successCount = proxy.successCount;
        let count = proxy.count;
        let success = 0;
        if (status)
            success = 1;

        let successRatio = parseInt((successCount + success) / count * 100);
        let mc = this.app.mongo.db.collection("ProxyIP");
        await mc.update({ _id: new ObjectId(proxy._id) }, {
            $set: { successRatio: successRatio, running: 0 },
            $inc: { successCount: success }
        });

        //每1000次 重新评估其代理ip健康情况
        if (count > 1000)
            await mc.update({ _id: new ObjectId(proxy._id) }, { $set: { successCount: 0, failCount: 0 } });
    }
}
module.exports = Question;