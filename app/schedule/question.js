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
            interval: "0.2s",
            type: 'worker', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        let task = await this.getTask();
        //task = { "_id": "5d283a6306e3106405111380", "pk": "24ee832a-4fb9-4a7b-9717-74675185918a~589da93d-577e-4315-999d-b28767f565bc~P4", "ct": "2", "dg": "12", "fg": "8", "so": "6", "pageCurrent": 1, "pageTotal": 1, "preProcess": 0, "questionTotal": 0, "complete": -1, "running": 0, "url": "http://www.jyeoo.com/math/ques/search" };
        if (!task) {
            console.log("no task");
            return;
        }
        await this.getQuestionStem(task)
    }


    /**
     * 预处理一个任务
     * @param {Object} task 任务对象
     */
    async getQuestionStem(task) {
        let url = task.url.replace('search', 'partialques?f=0');
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

        let proxy = await this.getProxy();
        if (!proxy)
            return null;

        let res = {};

        await this.ctx.curl(url, {
            headers: {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/137.76 (KHTML, like Gecko) Chrome/50.0.4563.90 Safari/137.76",
                "host": "www.jyeoo.com",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-language": "gzip, deflate",
                //"referer":"http://www.jyeoo.com/math/ques/search?f=0&q=6d7fced9-8023-40e7-81f7-763970f0b989~c999e505-4d5e-49bf-a1ac-dbe3e825c3f2~L2&lbs=&ct=1&dg=11&fg=8&so=1&pd=1",
                //"cookie": "jy=D6E80E3829994BD3A31B75CE7EB08EEDDBBC0607031F7B19CCE1B0964893D66E44DAACBC51EDD9BE472FD0EE557F3EB79D92E08DD7A76269CDDF1BCB74F3744881FD10342F7F20C6FF8EABF0ACECF79C400A449FCB4D0F10BB244AC083821A28B38F6032D8E7866E0656FDC1AF521CDEA568E0BC00C26D939B19DBD0D5C62E580546DC98FA882C65C32B9EC826C09FFC323D8E14B418BAAFC995F3792E2CE07F9E5941F90945E581C8BC551A152292305A11BA367367281B167539ECB4049B9882AB74865B7298174FD5C7E18E373154CCC4DB29E79F3A91F1ED834DEA395D5D71296564E34BCCC5084043EC05D1DCDA2372A1FBA95F976B27B032F7C8546EE89960994A1C39D7834DD0E517FE26F938B0150B5A0D1677A12F9F55C9DE668F8EB541E83698C8735C593EBFA588A8163538F1D9E30A821E334190820FCEC8C0D9A0BFA39B146676EE7C0BB1F3FCBB6FF9"
            },
            data: requestData,
            method: "GET",
            dataType: "text",
            enableProxy: true,
            proxy: "http://" + proxy.ip
        }).then(r => {
            res = r;
        }).catch(e => {
            res = e.res;
        });
        console.log("预处理 请求url返回。 状态码：" + res.status)
        this.app.logger.debug("task = " + JSON.stringify(task))
        //this.app.logger.debug("proxy =   " + JSON.stringify(proxy))
        let htmlStr = res.data || "";
        this.app.logger.debug("HtmlStr " + htmlStr)
        if (res.status != 200 || htmlStr.length < 10) {
            this.app.logger.debug("请求无效");
            console.log("htmlStr " + htmlStr)
            await this.updateProxy(proxy, false);
            await this.getQuestionStem(task);
            return;
        }

       

        let questionArr = {};
        try {
            questionArr = this.matchQuestionStem(htmlStr)
        } catch (e) {
            this.app.logger.debug("解析无效");
            await this.updateProxy(proxy, false);
            await this.getQuestionStem(task);
            return;
        }

        this.app.logger.debug("pageTotal =  " + questionArr.pageTotal + ",  questionTotal=" + questionArr.questionTotal)

        
        await this.saveQuestionStem(task, questionArr.questions)
        await this.updateProxy(proxy, true);
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

        if(questions.length <= 0)
            return;

        if (task.questionTotal > questions.length) {
            this.app.logger.debug(`no no no task.questionTotal=${task.questionTotal}  questions.length=${questions.length}`)
        }
        let { section, subject } = await this.app.mongo.findOne("TeachingMeterial", { query: { bk: task.pk.split("~")[0] } })
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

        await this.app.mongo.insertMany("Question", { docs: questions })
    }



    /**
     * 获取一个需要预处理的任务
     */
    async getTask() {
        //获得未预处理且处理不在处理中的任务。
        let taskRet = await this.app.mongo.findOneAndUpdate("Task", {
            filter: { preProcess: 0, running: 0 },
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
                    { count: { "$lt": 50 } }],
                "running": 0
            },
            update: {
                $set: { running: 1, lastUseTime: new Date() },
                $inc: { count: 1 },

            },
            options: { sort: { successRatio: -1 } }
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