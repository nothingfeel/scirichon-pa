
const Controller = require('egg').Controller;
const _ = require('lodash')

class TeachingMaterial extends Controller {
    async Add() {
        let result = await this.app.mongo.db.collection("TeachingMeterial").find().toArray();

        let recordCount = result.length;
        let successCount = 0
        for (let item of result) {
            let obj =
            {
                "data": {
                    "category": "TeachingMaterial",
                    fields:
                    {
                        "subject": item.subject,
                        "grade": item.nm,
                        "edition": item.pnm,
                        "ranking": "1",
                        "uuid": item.bk
                    }
                }
            }
            const res = await this.service.common.requestUri("/api/teaching_material", "POST", obj)

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