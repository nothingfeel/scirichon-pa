
const Controller = require('egg').Controller;
const _ = require('lodash')

class Point extends Controller {
    async Add() {


        let result = await this.app.mongo.db.collection("point").find({})
            .sort({ _id: 1 }).toArray();

        let recordCount = result.length;
        let successCount = 0;
        let arr = [];
        let sort = 1;
        let beginDate = new Date().getTime();

        for (let item of result) {
            let obj =
            {
                "uuid": item.UUID,
                "p_id": item.PUUID,
                "name": item.nm,
                "code": item.fpk,
                "sort_num": sort.toString(),
                "section": item.section,
                "subject": item.subject,

                level: item.level,
                leaf: item.leaf
            }
            sort++;
            arr.push(obj);


            if (sort % 10 == 0 || sort + 1 > result.length) {

                let data = { "data": { "category": "KnowledgePoint", fields: arr } }
                let res = null;
                res = await this.service.common.requestUri("/batch/api/knowledge_point", "POST", data)
                let insertCount = 0;

                if (res && res.data && res.data.data)
                    insertCount = res.data.data.length;
                console.log(`total = ${result.length} current = ${sort}  insertCount = ${insertCount}  time = ${parseInt(new Date().getTime() - beginDate) / 1000}s`)
                if (insertCount == 0) {
                    console.log("res = " + JSON.stringify(res))
                    console.log("err = " + JSON.stringify(arr))
                }
                arr = [];
                if (res && res.data.status == "ok")
                    successCount += res.data.data.length;
                // else
                //     console.log(" pp " + JSON.stringify(res))

            }
        }
        console.log("duang!!!")
        this.ctx.body = { successCount: successCount, recordCount: recordCount };
    }

    async Delete() {
        let searchData = {
            "category": "KnowledgePoint",
            "body": { "query": { "bool": {} } },
            "source": ["uuid"],

        }

        const res = await this.service.common.requestUri("/api/searchByEql", "POST", searchData)
        let arr = _.map(res.data.results, function (item) {
            return item.uuid;
        });

        console.log(JSON.stringify(arr));

        let Objs = {
            "data": {
                "category": "KnowledgePoint",
                uuids: arr

            }
        };
        const delRes = await this.service.common.requestUri("/batch/api/knowledge_point", "DELETE", Objs)
        this.ctx.body = delRes
    }
}

module.exports = Point;