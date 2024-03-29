const Subscription = require('egg').Subscription;
const cheerio = require('cheerio');
const _ = require("lodash")
const { ObjectId } = require('bson');

/**
 * 1、一个账号对应一个固定的代理IP
 */


class QuestionStem extends Subscription {
    static get schedule() {
        return {
            interval: "1.8s",
            type: 'worker', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        let task = await this.getTask();
        if (!task) {
            console.log("no task");
            return;
        }

        let userObj = await this.getUser();
        if (!userObj) {
            console.log("no user");
            return;
        }
        console.log("task = " + JSON.stringify(task))
        await this.getQuestionStem(task, userObj)
    }



    /**
     * 预处理一个任务
     * @param {Object} task 任务对象
     */
    async getQuestionStem(task, user) {
        let url = task.url.replace('search', 'partialques?f=0');
        //get请求题列表参数
        let requestData = {
            f: 0,
            q: task.pk, //目录&知识点id
            fg: task.fg,//题类
            so: task.so,//来源
            dg: task.dg,//难度
            ct: task.ct,//题型
            pd: 1,
            lbs: "",
            pi: task.pageCurrent,//分页
            r: Math.random()//随机数
        };
        //get请求的jyeoo账号cookie
        let cookieObj = {
            jy: user.jy,
            LF_Email: user.LF_Email,
            __RequestVerificationToken: user.__RequestVerificationToken,
            remind_check: 1
        }

        let cookieStr = _.join(_.map(_.toPairs(cookieObj), function (item) {
            return _.join(item, "=")
        }), ";");

        //let proxy = await this.getProxy();
        //if (!proxy)
        //  return null;
        let res = {};
        await this.ctx.curl(url, {
            headers: {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                "host": "www.jyeoo.com",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-language": "gzip, deflate",
                //"referer":"http://www.jyeoo.com/math/ques/search?f=0&q=6d7fced9-8023-40e7-81f7-763970f0b989~c999e505-4d5e-49bf-a1ac-dbe3e825c3f2~L2&lbs=&ct=1&dg=11&fg=8&so=1&pd=1",
                "cookie": cookieStr
            },
            data: requestData,
            method: "GET",
            dataType: "text",
            enableProxy: true,
            proxy: "http://" + user.ip
        }).then(r => {
            res = r;
        }).catch(e => {
            res = e.res;
        });
        console.log("预处理 请求url返回。 状态码：" + res.status)
        this.app.logger.debug("task = " + JSON.stringify(task))
        let htmlStr = res.data || "";
        this.app.logger.debug("HtmlStr " + htmlStr)
        if (res.status != 200 || htmlStr.length < 10) {
            this.app.logger.debug("请求无效");
            await this.updateProxy(user.ip, false);
            return;
        }


        let questionArr = {};
        try {
            questionArr = this.matchQuestionStem(htmlStr)
        } catch (e) {
            this.app.logger.debug("解析无效");
            return;
        }

        this.app.logger.debug("pageTotal =  " + questionArr.pageTotal + ",  questionTotal=" + questionArr.questionTotal)

        await this.saveQuestionStem(task, questionArr.questions)
        await this.updateProxy(user.ip, true);
        await this.updateTask(task, task.pageCurrent, questionArr.pageTotal, questionArr.questionTotal)

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

        console.log("本调解的总页数为： " + pageTotal + "  总题数为：" + questionTotal)
        return { questions: resultArr, pageCurrent: pageCurrent, pageTotal: pageTotal, questionTotal: questionTotal };
    }


    /**
     * 保存试题
     * @param {Object} task 任务对象
     * @param {Array} questions 试题数组
     */
    async saveQuestionStem(task, questions) {

        if (task.questionTotal > questions.length) {
            this.app.logger.debug(`no no no task.questionTotal=${task.questionTotal}  questions.length=${questions.length}`)
        }


        for (let question of questions) {
            await this.app.mongo.findOneAndUpdate("Question", {
                filter: { qid: question.id },
                update: {
                    $set: {
                        stem: question.stem,//题干
                        options: question.options,//选项
                        includeDate: question.includeDate,//收录时间
                        refTotal: question.refTotal,//组卷次数
                        quesTotal: question.quesTotal,//真题次数
                        difficutly: question.difficutly,//难度
                        stemTime: new Date(),
                        stemStatus:1,//抓取题干状态
                        answerStatus: 0,//抓取答案状态
                        answerTime: new Date(),//抓取答案时间
                        running:0
                    },
                    $push: {
                        catalogs: {
                            q: task.pk, //目录&知识点id
                            fg: task.fg,//题类
                            so: task.so,//来源
                            dg: task.dg,//难度
                            ct: task.ct,//题型
                        }
                    }
                },
                options: { upsert: true }
            });

        }
    }

    /**
     * 获取一个需要预处理的任务
     */
    async getTask() {
        //获得未预处理且处理不在处理中的任务。
        let taskRet = await this.app.mongo.findOneAndUpdate("Task", {
            filter: { preProcess: 1, complete: { $in: [0, -1] }, running: 0, questionTotal: { $gt: 0 } },
            update: { $set: { running: 1 } },
            options: { sort: { _id: 1 } }
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
    async updateTask(task, pageCurrent, success) {
        let complete = 0;
        if (!success)
            return;

        if (task.pageTotal <= pageCurrent)
            complete = 1;

        pageCurrent++;
        let mc = this.app.mongo.db.collection("Task");
        await mc.update({ _id: new ObjectId(task._id) }, {
            $set: {
                pageCurrent: pageCurrent,
                complete: complete,
                running: 0
            }
        });
    }

    /**
     * 获得一个jyeoo账号
     */
    async getUser() {
        let userRet1 = await this.app.mongo.findOneAndUpdate("User", {
            filter: { status: 1, count: { $lt: 10000 } },
            update: { $set: { lastUseTime: new Date() }, $inc: { count: 1 } },
            options: { sort: { lastUseTime: 1 } }
        });

        if (!userRet1.lastErrorObject.updatedExisting)
            return null;

        let user = userRet1.value;
        let proxy = await this.app.mongo.findOne("ProxyIP", { query: { _id: new ObjectId(user.proxyId) } });

        user.ip = proxy.ip;
        return user;
    }


    /**
     * 更新代理ip对象
     * @param {String} proxy ip+端口地址
     * @param {bool} success 是否请求成功
     */
    async updateProxy(ip, status) {

        let proxy = await this.app.mongo.findOne("ProxyIP", { query: { ip: ip } });

        let successCount = proxy.successCount;
        let count = proxy.count;
        let success = 0;
        if (status)
            success = 1;

        let successRatio = parseInt((successCount + success) / count * 100);
        let mc = this.app.mongo.db.collection("ProxyIP");
        await mc.update({ _id: new ObjectId(proxy._id) }, {
            $set: { successRatio: successRatio, lastUseTime: new Date(), running: 1 },
            $inc: { successCount: success }
        });

    }

}
module.exports = QuestionStem;