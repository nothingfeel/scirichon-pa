
const Controller = require('egg').Controller;
const _ = require('lodash')
var UUID = require('uuid');

class TeachingMaterial extends Controller {
    async Add() {
        await this.app.mysql.delete("echo_teaching_material", {})
        let result = await this.app.mongo.db.collection("TeachingMaterial").find().sort({ _id: -1 }).toArray();

        let ranking = 1,rr=[];
        let dt = new Date();
        let arr = [
            { id: 1, section: 1, name: "数学", sort: 1, create_time: dt, update_time: dt },
            { id: 2, section: 1, name: "语文", sort: 2, create_time: dt, update_time: dt },
            { id: 3, section: 1, name: "英语", sort: 3, create_time: dt, update_time: dt },

            { id: 4, section: 2, name: "数学", sort: 4, create_time: dt, update_time: dt },
            { id: 5, section: 2, name: "物理", sort: 5, create_time: dt, update_time: dt },
            { id: 6, section: 2, name: "化学", sort: 6, create_time: dt, update_time: dt },
            { id: 7, section: 2, name: "生物", sort: 7, create_time: dt, update_time: dt },
            { id: 8, section: 2, name: "地理", sort: 8, create_time: dt, update_time: dt },
            { id: 9, section: 2, name: "语文", sort: 9, create_time: dt, update_time: dt },
            { id: 10, section: 2, name: "英语", sort: 10, create_time: dt, update_time: dt },
            { id: 11, section: 2, name: "政治", sort: 11, create_time: dt, update_time: dt },
            { id: 12, section: 2, name: "历史", sort: 12, create_time: dt, update_time: dt },

            { id: 13, section: 3, name: "数学", sort: 13, create_time: dt, update_time: dt },
            { id: 14, section: 3, name: "物理", sort: 14, create_time: dt, update_time: dt },
            { id: 15, section: 3, name: "化学", sort: 15, create_time: dt, update_time: dt },
            { id: 16, section: 3, name: "生物", sort: 16, create_time: dt, update_time: dt },
            { id: 17, section: 3, name: "地理", sort: 17, create_time: dt, update_time: dt },
            { id: 18, section: 3, name: "语文", sort: 18, create_time: dt, update_time: dt },
            { id: 19, section: 3, name: "英语", sort: 19, create_time: dt, update_time: dt },
            { id: 20, section: 3, name: "政治", sort: 20, create_time: dt, update_time: dt },
            { id: 21, section: 3, name: "历史", sort: 21, create_time: dt, update_time: dt },
        ];

        for (let item of result) {

            let section = 1;
            if(item.section == "初中")
                section = 2;
            if(item.section == "高中")
                section = 3;

            let subject  =null;
            subject = _.find(arr,{name:item.subject,section:section})
            if(subject == null){

                console.log(`subject = ${item.subject} , section = ${item.section}`)
                continue;
                // throw new Error("没有找到科目")
            }

            let obj =
            {
                "id":item.bk,
                "section": section,
                "subject_id": subject.id,
                "grade_code": item.gd,
                "grade_name": item.nm,
                "name": item.pnm,
                "sort": ranking,
                "create_time": dt,
                "update_time": dt
            }
            rr.push(obj);
            ranking++;
        }

        let r = await this.app.mysql.insert("echo_teaching_material",rr)
        this.ctx.body = r;

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