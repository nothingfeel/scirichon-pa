const Subscription = require('egg').Subscription;
const cheerio = require('cheerio');
const _ = require("lodash")
const { ObjectId } = require('bson');

/**
 * 
 */


class Answer extends Subscription {
    static get schedule() {
        return {
            interval: "10s",
            type: 'worker', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        }
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {


        let question = await this.getQuestion();
        if (!question || !question.qid) {
            console.log("no question task");
            return;
        }

        let userObj = await this.getUser();
        if (!userObj) {
            console.log("no user");
            return;
        }
        console.log("question task id = " + JSON.stringify(question.qid))

        await this.getQuestionAnswer(question, userObj)
    }

    /**
     * 预处理一个任务
     * @param {Object} task 任务对象
     */
    async getQuestionAnswer(question, user) {

        let url = question.url.replace('search', 'quesanswer');
        //get请求题列表参数
        let requestData = {
            id: question.qid,
            r: Math.random()//随机数
        };
        //get请求的jyeoo账号cookie
        let cookieObj = {
            jy: user.jy,
            LF_Email: user.LF_Email,
            jyean: user.jyean,

            __RequestVerificationToken: user.__RequestVerificationToken,
            remind_check: 1
        }

        let cookieStr = _.join(_.map(_.toPairs(cookieObj), function (item) {
            return _.join(item, "=")
        }), ";");


        let res = {};
        await this.ctx.curl(url, {
            headers: {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                "host": "www.jyeoo.com",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-language": "gzip, deflate",
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
        this.app.logger.debug("question id = " + JSON.stringify(question.qid))
        let htmlStr = res.data || "";
        this.app.logger.debug("HtmlStr " + htmlStr)
        if (res.status != 200 || htmlStr.length < 10) {
            this.app.logger.debug("请求无效");
            await this.updateProxy(user.ip, false);
            return;
        }
        let questionObj = {};
        try {
            questionObj = this.matchQuestionAnswer(htmlStr)
        } catch (e) {
            this.app.logger.debug("解析无效");
            return;
        }
        //questionObj.id = question.qid;

        await this.saveQuestionAnswer(questionObj)
        await this.updateProxy(user.ip, true);

    }


    /**
     * 解析html
     * @param {string} htmlStr 
     * @returns {Object} { questions, pageCurrentIndex, pageTotal }
     */
    matchQuestionAnswer(htmlStr) {
        let $ = cheerio.load(htmlStr, { decodeEntities: false });

        let stem = $(".QUES_LI fieldset div.pt1").html();
        let answerHtml = $(".QUES_LI fieldset div.pt2").html();
        let examPoint = $(".QUES_LI fieldset div.pt3").html();
        let subject = $(".QUES_LI fieldset div.pt4").html();
        let analyze = $(".QUES_LI fieldset div.pt5").html();
        let explain = $(".QUES_LI fieldset div.pt6").html();
        let evaluation = $(".QUES_LI fieldset div.pt7").html();
        let questionId = $(".QUES_LI fieldset")[0].attribs["id"];

        console.log("real questionId = " + JSON.stringify(questionId))

        return {
            answerHTML: answerHtml,
            examPoint: examPoint,
            subject: subject,
            analyze: analyze,
            explain: explain,
            evaluation: evaluation,
            stem: stem,
            id: questionId
        };
    }


    /**
     * 保存试题答案
     * @param {Object} question 试题对象 
     */
    async saveQuestionAnswer(question) {
        await this.app.mongo.findOneAndUpdate("Question", {
            filter: { qid: question.id },
            update: {
                $set: {
                    answerHtml_analyze: question.answerHtml,//答案html
                    examPoint: question.examPoint,//考点
                    subject: question.subject,//专题
                    analyze: question.analyze,//分析
                    explain: question.explain,//解答
                    evaluation: question.evaluation,//点评
                    stem_analyze: question.stem,//题干

                    running: 0,
                    answerStatus: 1,//抓取答案状态
                    answerTime: new Date(),//抓取答案时间
                }
            },
            options: { upsert: true }
        });
    }

    /**
     * 获取一个需要预处理的任务
     */
    async getQuestion() {

        let questionRet = await this.app.mongo.findOneAndUpdate("Question", {
            filter: { answerStatus: 0, running: 0 },
            update: { $set: { answerTime: new Date(), answerStatus: -1 } },
            options: { sort: { _id: 1 } }
        });

        let question = null;
        if (!questionRet.lastErrorObject.updatedExisting)
            return question;
        question = questionRet.value;
        //console.log("get task = " + JSON.stringify(task))
        let { section, subject } = await this.app.mongo.findOne("TeachingMeterial", { query: { bk: question.catalogs[0].q.split("~")[0] } })
        let subjectData = await this.app.mongo.findOne("Subject", { query: { subject: subject, section: section } })
        return Object.assign(question, { url: subjectData.url });
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
module.exports = Answer;