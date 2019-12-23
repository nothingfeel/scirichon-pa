
const Controller = require('egg').Controller;
const _ = require('lodash')

class Question extends Controller {
    async Add() {
        let { section, subject } = this.ctx.query;

        if (!section || !subject) {
            this.ctx.body = { status: "error" }
            return;
        }

        let result = await this.app.mongo.db.collection("M_Question_infoNew").find
            ({ section: section, subject: subject })
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

                
            }
        }
        console.log("done")
        this.ctx.body = {  };
    }

    async Delete() {
        await this.app.mysql.delete("echo_question", {})
        await this.app.mysql.delete("echo_question_catalog_rel", {})
        await this.app.mysql.delete("echo_question_option_rel", {})
        await this.app.mysql.delete("echo_question_point_rel", {})
        this.ctx.body={};
    }

    async DeleteQuestionSet() {
        let searchData = {
            "category": "QuestionedSet",
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
                "category": "QuestionedSet",
                uuids: arr

            }
        };
        const delRes = await this.service.common.requestUri("/batch/api/questioned_set", "DELETE", Objs)
        this.ctx.body = delRes
    }

    async DeleteAnswer() {
        let searchData = {
            "category": "Answer",
            "body": { "query": { "bool": {} } },
            "source": ["uuid"],
            "page": 1, "per_page": this.config.appConfig.deleteBatchCount
        }

        const res = await this.service.common.requestUri("/api/searchByEql", "POST", searchData)
        let recordCount = res.data.data.count;
        console.log("record count = " + recordCount)
        let arr = _.map(res.data.data.results, function (item) {
            return item.uuid;
        });


        let Objs = {
            "data": {
                "category": "Answer",
                uuids: arr

            }
        };
        const delRes = await this.service.common.requestUri("/batch/api/answer", "DELETE", Objs)
        if (recordCount == 0)
            this.ctx.body = delRes
        else
            DeleteAnswer()
    }
}

module.exports = Question;