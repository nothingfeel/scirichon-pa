
const Controller = require('egg').Controller;
const _ = require('lodash')

class Catalog extends Controller {
    async Add() {

        let { section, subject } = this.ctx.query;

        if (!section || !subject) {
            this.ctx.body = { status: "error" }
            return;
        }


        let result = await this.app.mongo.db.collection("catalog").find(
            { section: section, subject: subject, pk1: { "$regex": /^.{10,}$/ } })
            .sort({ _id: 1 }).toArray();

        let recordCount = result.length;
        let successCount = 0;
        let arr = [];
        let sort = 1;
        let beginDate = new Date().getTime();
        for (let item of result) {

            if (item.pk1.length < 30)
                continue;
            let obj =
            {
                "uuid": item.pk1,
                "p_id": item.p_pk1,
                "name": item.nm,
                "sort_num": sort.toString(),

                "t_m_id": item.t_bk,
            }
            sort++;
            arr.push(obj);

            if (sort % 20 == 0 || sort + 20 > result.length) {

                console.log(`total = ${result.length} current = ${sort}  time = ${parseInt(new Date().getTime() - beginDate) / 1000}s`)
                let data = { "data": { "category": "Catalog", fields: arr } }
                let res = null;
                res = await this.service.common.requestUri("/batch/api/catalog", "POST", data)
                arr = [];
                if (res && res.data.status == "ok")
                    successCount += res.data.data.length;
            }
        }
        console.log("done")
        this.ctx.body = { successCount: successCount, recordCount: recordCount };
    }

    async Delete() {
        let searchData = {
            "category": "Catalog",
            "body": { "query": { "bool": {} } }, 
            "source": ["uuid"],
            "page": 1, "per_page": 5
        }

        const res = await this.service.common.requestUri("/api/searchByEql", "POST", searchData)
        let arr = _.map(res.data.data.results, function (item) {
            return item.uuid;
        });
        let Objs = {
            "data": {
                "category": "Catalog",
                uuids: arr

            }
        };
        const delRes = await this.service.common.requestUri("/batch/api/catalog", "DELETE", Objs)
        this.ctx.body = delRes
    }
}

module.exports = Catalog;