const Subscription = require('egg').Subscription;
const cheerio = require('cheerio');

class TeachingMaterial extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "300s", // 5 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        //获得所有科目数据  K12 共25个
        let subjects = await this.app.mongo.find("Subject", {});
        for (let item of subjects) {
            console.log("subject==>" + JSON.stringify(item))
            await this.SaveTeachingMaterial(item)
        }
    }

    /**
     * 保存科目下的所有教材版本(科目-教材版本-年级)
     * @param {Object} subject 科目对象
     */
    async SaveTeachingMaterial(subject) {

        //科目的页面包含教材版本及里面的年级信息，解析该页面 能获得该科目的教程版本和年级信息。
        const res = await this.ctx.curl(subject.url, {
            headers: {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                "host": "www.jyeoo.com",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-language": "gzip, deflate",
            },
            dataType: "text"
        });
        let htmlStr = res.data;
        this.app.logger.debug("ttt==> " + htmlStr)


        let TeachingMeterialArr = this.matchTeachingMeterialByHtml(htmlStr, subject);
        let condition = this.matchConditionByHtml(htmlStr);
        this.ctx.logger.debug(JSON.stringify(TeachingMeterialArr));
        //await this.app.mongo.insertMany("TeachingMeterial", { docs: TeachingMeterialArr });
        await this.app.mongo.findOneAndUpdate("Subject", {
            filter: {
                subject: subject.subject,
                section: subject.section
            },
            update: {
                $set: { condition: condition }
            }

        })
    }

    matchConditionByHtml(htmlStr) {
        let $ = cheerio.load(htmlStr, { decodeEntities: false });
        let tt = $(".degree tr th");
        let processData = [];
        let getType = function (elem, text, key) {
            let ct = { des: text, keyName: key, keyValues: [], keyDes: [], currentIndex: 0 }
            let a = cheerio.load(elem.next.next, { decodeEntities: false });
            a("ul li a").each(function (ii, item) {
                let keyValue = item.attribs.onclick.match(/\'(\d+)\'/)[1];
                let keyDes = item.children[0].data;
                if (keyValue != '0') {
                    ct.keyValues.push(keyValue);
                    ct.keyDes.push(keyDes)
                }
            })
            processData.push(ct);
        }

        tt.each(function (i, elem) {
            if (elem.children[0].data == "题型")
                getType(elem, "题型", "ct")
            if (elem.children[0].data == "难度")
                getType(elem, "难度", "dg")
            if (elem.children[0].data == "题类")
                getType(elem, "题类", "fg")
            if (elem.children[0].data == "来源")
                getType(elem, "来源", "so")
        })
        console.log(JSON.stringify(processData))
        return processData;

    }

    matchTeachingMeterialByHtml(htmlStr, subject) {

        let $ = cheerio.load(htmlStr);
        let s = $("#JYE_BOOK_TREE_HOLDER li");
        // this.ctx.logger.debug(s.innerHTML);
        let result = [];
        s.each(function (i, elem) {
            let grande = elem.attribs;
            grande = JSON.parse(JSON.stringify(grande));

            if (grande.hasOwnProperty("bk")) {
                let parent = elem.parent.parent.attribs;
                let data = Object.assign({}, grande,
                    {
                        ek: parent.ek,
                        pnm: parent.nm,
                        section: subject.section,
                        subject: subject.subject,
                        url: subject.url,
                        spiderStatus: 0
                    });
                result.push(data);
            }
        });
        return result;
    }
}

module.exports = TeachingMaterial;