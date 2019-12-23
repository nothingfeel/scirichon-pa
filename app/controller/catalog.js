
const Controller = require('egg').Controller;
const _ = require('lodash')
const UUID = require("uuid")

class Catalog extends Controller {
    async Add() {

        // let { section, subject } = this.ctx.query;

        // if (!section || !subject) {
        //     this.ctx.body = { status: "error" }
        //     return;
        // }

        await this.app.mysql.delete("echo_catalog")
        await this.app.mysql.delete("echo_catalog_point_rel")


        let result = await this.app.mongo.db.collection("catalog").find(
            { pk1: { "$regex": /^.{10,}$/ }})
            .sort({ _id: 1 }).toArray();

        let arr = [], arrr = [];
        let sort = 1;
        let dt = new Date();

        for (let item of result) {

            if (item.pk1.length < 30)
                continue;

            let points = await this.app.mongo.db.collection("catalog").find(
                { isPoint: true, p_pk: item.pk }).toArray();

            if (points.length > 0) {

                let point_ids = _.map(points, function (pointItem) {
                    return pointItem.pointUUID
                })

                for (let pointItemId of point_ids) {
                    arrr.push({ id: UUID.v4(), catalog_id: item.pk1, point_id: pointItemId })
                }
            }
            let subjectObj = this.service.common.getSubjectId(item.section, item.subject)
            if (subjectObj == null)
                continue
            let path = "", parentObj = item;
            for (let i = item.level; i > 1; i--) {
                if (parentObj.p_pk1 && parentObj.p_pk1.length>10) {
                    console.log(`sss => ${parentObj.p_pk1}`)
                    parentObj = _.find(result, { pk1: parentObj.p_pk1 });
                    if (parentObj)
                        path = parentObj.pk1 + "~" + path;
                    else
                        break;
                }
            }
            let obj =
            {
                id: item.pk1,
                parent_id: item.p_pk1,
                section: subjectObj.section,
                subject_id: subjectObj.subject,
                grade_code: item.t_gd,
                subject_name: item.subject,
                teaching_material_id: item.t_bk,
                level: item.level,
                leaf: item.lastLevel,
                catalog_name: item.nm,
                sort: sort,
                create_time: dt,
                update_time: dt,
                path: path == "" ? path : path.substr(0, path.length - 1)
            }
            sort++;
            arr.push(obj);

            console.log("sd ==> " + JSON.stringify(obj))
            if (sort % 2000 == 0 || sort + 2000 >= result.length) {
                // console.log(arr.length)
                // console.log(arr[0])
                // console.log(arrr.length)
                await this.app.mysql.insert("echo_catalog", arr)
                if (arrr.length > 0)
                    await this.app.mysql.insert("echo_catalog_point_rel", arrr)
                arr = []
                arrr = []
            }
        }
        console.log("duang!!!")

        this.ctx.body = {};
    }
}

module.exports = Catalog;