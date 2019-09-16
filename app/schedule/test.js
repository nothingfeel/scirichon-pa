const Subscription = require('egg').Subscription;
const fs = require('fs')
const { ObjectId } = require('bson');
const _ = require('lodash')

class TestHTML extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "300h", // 5 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable: false
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {

        let mc = this.app.mongo.db.collection("M_Question_infoNew");
        var dataArr = await mc.find({
            "UUID": { $lt: "03367291-ca21-4223-a89d-5ea5fd5b4c3f" }
            , "eH": 0
            // CommonSection: "初中",
            // CommonSubject: "数学",

            // qid: { $exists: true },
            // "catalogs.ct": { $in: ["1", "2"] }
        }).limit(1000).toArray();

        let ids = _.map(dataArr, function (item) { return item.UUID });
        console.log("ids ==> " + JSON.stringify(ids))
         await mc.updateMany({ UUID: { $in: ids } }, { $set: { eH: 1 } });




        let str = "";
        //console.log(JSON.stringify(dataArr))
        /*
                <div class="pt1">
                <div>序号：${index}</div>   ${item.stem}
              </div>
              <div class="pt2">
                  ${item.options ? item.options : ""}
              </div>
              <div class="pt6" style="display:none"></div>
        */
        let index = 0;
        for (let item of dataArr) {
            index++;
            let li = `    <li class="QUES_LI">
            <fieldset id="b5f5e108-c158-1515-5e76-dba3f25b8ef3" class="quesborder" s="physics"
                data-cate="1">
                 <div style="float:left">【 序号：${index}  ID:${item.UUID} 学科:${item.CommonSubject}  学段:${item.CommonSection} 难度：${item.DifficultyCoefficient} 】</div> 
                   ${item.Content}
                <div class="pt3">

                </div>
                <div class="pt4">

                </div>
                <div class="pt5">
                <div style="color:red;float:left">【分析】</div>  ${item.Analys}
                </div>
                <div class="pt6">
                <div style="color:red;float:left">【解答】</div>  ${item.Answer}
                </div>
                <div class="pt7">
                <div style="color:red;float:left">【点评】</div> ${item.Appraisement}
            </div>
            </fieldset>

        </li>
        `;

            str += li;

        }

        this.app.logger.info("li= " + str)
        console.log("end  " + index)

    }

}

module.exports = TestHTML;


