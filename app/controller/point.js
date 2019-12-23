

const Controller = require('egg').Controller;
const _ = require('lodash');
const UUID = require("uuid")

class PointController extends Controller {
    async Add() {
        await this.app.mysql.delete("echo_point", {})
        let result = await this.app.mongo.db.collection("point").find({})
            .sort({ _id: 1 }).toArray();


        let recordCount = result.length;
        let arr = [];
        let sort = 1;
        let dt = new Date();

        for (let item of result) {
            let code = item.fpk;
            let subjectObj = this.service.common.getSubjectId(item.section, item.subject)
            if (subjectObj == null)
                continue;
            let path = "", parentObj = item;
            for (let i = item.level; i > 1; i--) {
                if (parentObj.PUUID && parentObj.PUUID.length > 10) {
                    parentObj = _.find(result, { UUID: parentObj.PUUID });
                    if (parentObj)
                        path = parentObj.UUID + "~" + path;
                    else
                        break;
                }
            }
            let obj =
            {
                // "uuid": item.UUID,
                // "p_id": item.PUUID,
                // "name": item.nm,
                // "code": item.fpk,
                // "sort_num": sort.toString(),
                // "section": item.section,
                // "subject": item.subject,
                // level: item.level,
                // leaf: item.leaf,

                id: item.UUID,
                subject_id: subjectObj.subject,
                section: subjectObj.section,

                subject_name: item.subject,
                level: item.level,
                leaf: item.leaf,
                parent_id: item.PUUID,
                point_name: item.nm,
                point_code: code,
                sort: sort,
                create_time: dt,
                update_time: dt,
                path: path == "" ? path : path.substr(0, path.length - 1)
            }
            sort++;
            arr.push(obj);
        }
        let r = await this.app.mysql.insert("echo_point", arr)
        console.log("duang!!!")
        this.ctx.body = r;
    }
}

module.exports = PointController;