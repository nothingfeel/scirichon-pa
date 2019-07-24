const Subscription = require('egg').Subscription;
const { ObjectId } = require('bson');

class Agent extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "300h", // 5 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {

        const agentConfig = this.config.appConfig.agent;
        const res = await this.ctx.curl(agentConfig.mainUrl, {
            headers: {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                "host": "ip.zdaye.com",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-language": "gzip, deflate",
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3"
            },
            dataType: "text"
        });
        let htmlStr = res.data;
        let headers = res.headers;

        this.ctx.logger.debug("res.headers===>" + JSON.stringify(res.headers));


        let dayListHtml = await this.MatchDayList(htmlStr);
        let dayList = await this.GetDayList(dayListHtml, headers);
        await this.app.mongo.insertMany("ProxyIP", { docs: dayList });
        console.log("ddddd")
    }

    /**
     * 匹配出里面的天的列表
     * @param {string} html 要抓取的代理主页html字符串
     */
    async MatchDayList(html) {
        let reg = /<H3 class=\"thread_title\"><a href=\"\/dayProxy\/ip\/(\d+)\.html\">(.*)<\/a>\s*<\/H3>/g;
        let regItem = /<H3 class=\"thread_title\"><a href=\"\/dayProxy\/ip\/(\d+)\.html\">(.*)<\/a>\s*<\/H3>/;
        let r = html.match(reg);
        let result = [];
        if (!(r && r.length > 0))
            return result;
        r.forEach(function (item) {
            let rItem = item.match(regItem);
            if (rItem && rItem.length > 0)
                result.push({ dayId: rItem[1], title: rItem[2] });
        });

        this.ctx.logger.debug("MatchDayList==========>")
        this.ctx.logger.debug(result);
        return result;
    }

    /**
     * 获得天的html字符串
     * @param {item,title} list 天对象列表
     */
    async GetDayList(list, headers) {
        let result = [];
        let self = this;
        // await list.forEach(async function (item) {
        for (let item of list) {
            let url = "http://ip.zdaye.com/dayProxy/ip/" + item.dayId + ".html";
            self.logger.debug(url);
            self.logger.debug(JSON.stringify(self.ctx))
            const res = await self.ctx.curl(url, {
                dataType: "text",
                headers: {
                    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                    "host": "ip.zdaye.com",
                    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                    "accept-language": "gzip, deflate",
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
                    "referer": "http://ip.zdaye.com/dayProxy/2019/7/1.html",
                    "set-cookie": headers["set-cookie"]
                }
            });
            //self.ctx.logger.debug("getDayList===> " + JSON.stringify(res));
            headers = res.headers;
            let html = res.data;
            let reg = /(\d+\.\d+\.\d+\.\d+:\d+)@(\w+)#\[(.{2,3})\]([\u4e00-\u9fa5|\s+]+)/g;
            let regItem = /(\d+\.\d+\.\d+\.\d+:\d+)@(\w+)#\[(.{2,3})\]([\u4e00-\u9fa5|\s+]+)/;
            let r = html.match(reg);
            if (!(r && r.length > 0))
                return result;
            r.forEach(function (mItem) {
                let rItem = mItem.match(regItem);
                if (rItem && rItem.length > 0) {
                    let proxyData = { ip: rItem[1], method: rItem[2], proxyType: rItem[3], address: rItem[4] };
                    let data = Object.assign({}, proxyData, 
                        { dayId: item.dayId, title: item.title, successCount: 0,
                             count: 1, successRatio: 100, lastUseTime: new Date(), running: 0 })
                    result.push(data);
                }
            });
        }
        self.ctx.logger.info("ips[]==>");
        self.ctx.logger.info(JSON.stringify(result));
        return result;
    }
}

module.exports = Agent;