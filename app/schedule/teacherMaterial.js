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

        let $ = cheerio.load(htmlStr);
        let s = $("#JYE_BOOK_TREE_HOLDER li");
        // this.ctx.logger.debug(s.innerHTML);
        let result = [];
        s.each(function (i, elem) {
            let grande = elem.attribs;
            grande = JSON.parse(JSON.stringify(grande));
            /*
            console.log(JSON.stringify(grande));
            console.log(typeof (grande));
            console.log(i)
            */
            if (grande.hasOwnProperty("bk")) {
                let parent = elem.parent.parent.attribs;
                let data = Object.assign({}, grande,
                    {
                        ek: parent.ek,
                        pnm: parent.nm,
                        section: subject.section,
                        subject: subject.subject,
                        url: subject.url,
                        spiderStatus:0
                    });
                result.push(data);
            }
        });

        this.ctx.logger.debug(JSON.stringify(result));
        await this.app.mongo.insertMany("TeachingMeterial", { docs: result });
    }
}

module.exports = TeachingMaterial;