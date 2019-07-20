const Subscription = require('egg').Subscription;
const cheerio = require('cheerio');
const _ = require("lodash");
const { ObjectID } = require("mongodb")

class Catalog extends Subscription {
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

        let teachingMeterialArr = await this.app.mongo.find("TeachingMeterial", { query: { spiderStatus: 0 } });

        let index = 0;
        for (let teachingMeterial of teachingMeterialArr) {
            console.log((++index) + "  ==>  " + JSON.stringify(teachingMeterial));
            await this.SaveCatalog(teachingMeterial)
        }

        // await this.SaveCatalog({
        //     "url": "http://www.jyeoo.com/math/ques/search",
        //     "_id": "5d0a50ac349998893419acdc",
        //     "bk": "a246fec1-afbc-42c4-a872-0d5bfd5308fb",
        //     "gd": "7_1",
        //     "nm": "七年级上",
        //     "ek": "15",
        //     "pnm": "北师大新版",
        //     "section": "初中",
        //     "subject": "数学"
        // })
    }

    /**
     * 保存科目下的所有教材版本(科目-教材版本-年级)
     * @param {Object} subject 科目对象
     */
    async SaveCatalog(params) {

        let url = params.url.replace('search', '/partialcategory?q=');
        const res = await this.ctx.curl(url, {
            headers: {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                "host": "www.jyeoo.com",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-language": "gzip, deflate",
                "content-type": "application/x-www-form-urlencoded"

            },
            data: {
                a: params.bk,
                f: "0",
                cd: "_setQ",
                r: "0.05257125641172311"
            },
            method: "POST",
            dataType: "text"
        });
        let htmlStr = res.data;
        // this.app.logger.debug("catalog==> " + htmlStr)

        let $ = cheerio.load(htmlStr);
        let s = $("#JYE_POINT_TREE_HOLDER li");
        let result = [];
        s.each(function (i, elem) {
            // console.log(i + "   ==> ");
            // console.log(elem)
            let grande = elem.attribs;
            grande = JSON.parse(JSON.stringify(grande));
            if (grande && grande.hasOwnProperty("pk")) {

                let parent = elem.parent.parent.attribs;
                let pkArr = grande.pk.split("~");
                let pk = pkArr[2] ? pkArr[2] : pkArr[1];
                let p_pk = parent.pk ? parent.pk.split("~")[1] : "";
                grande.pk1 = pk;
                let level = 1;
                if (pk.length > 10 && p_pk != "")
                    level = 2;
                else if (pk.length < 10 && p_pk != "")
                    level = 3;

                let data = Object.assign({}, grande,
                    {
                        p_pk: parent.pk ? parent.pk : "",
                        p_pk1: p_pk,
                        p_nm: parent.nm ? parent.nm : "",
                        section: params.section,
                        subject: params.subject,
                        "t_bk": params.bk,
                        "t_gd": params.gd,
                        "t_nm": params.nm,
                        "t_ek": params.ek,
                        "t_pnm": params.pnm,
                        "level": level,
                        "taskRun": 0, //0 不抓取，  1作为任务抓取

                    });
                result.push(data);
            }
        });
        this.ctx.logger.debug("catalog data ==>  " + JSON.stringify(result))
        try {
            await this.app.mongo.insertMany("catalog", { docs: result })
        } catch (e) {
            this.ctx.logger.debug("mongo errro ==> " + JSON.stringify(e))
        }
        let ccc = this.app.mongo.db.collection('TeachingMeterial');
        await ccc.findOneAndUpdate({ bk: params.bk }, { "$set": { spiderStatus: 1 } })

    }
}

module.exports = Catalog;