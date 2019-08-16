
const Controller = require('egg').Controller;
const _ = require('lodash')

class TeachingMaterial extends Controller {
    async Add() {
        let result = await this.app.mongo.db.collection("TeachingMaterial").find().sort({ _id: -1 }).toArray();

        let recordCount = result.length;
        let successCount = 0;
        let ranking = 1;


        for (let item of result) {
            let name = item.nm;
            if (/修/.test(name))
                name = item.section + name;
            let obj =
            {
                "data": {
                    "category": "TeachingMaterial",
                    fields:
                    {
                        "subject": item.subject,
                        "section": item.section,
                        "grade": name,
                        "edition": item.pnm,
                        "ranking": ranking.toString(),
                        "uuid": item.bk
                    }
                }
            }                                                      
            const res = await this.service.common.requestUri("/api/teaching_material", "POST", obj)

            ranking++;
            if (res.data.status == "ok")
                successCount++;
        }

        this.ctx.body = { successCount: successCount, recordCount: recordCount };

    }

    async Delete() {
        const res = await this.service.common.requestUri("/api/teaching_material", "GET", {})
        let arr = _.map(res.data.data, function (item) {
            return item.uuid;
        });
        arr.length = 10;
        let Objs = {
            "data": {
                "category": "TeachingMaterial",
                uuids: arr

            }
        };
        const delRes = await this.service.common.requestUri("/batch/api/teaching_material", "DELETE", Objs)
        this.ctx.body = delRes
    }
}

module.exports = TeachingMaterial;