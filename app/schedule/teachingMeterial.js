const Subscription = require('egg').Subscription;
const fs = require('fs')
const { ObjectId } = require('bson');

class TestHTML extends Subscription {
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

        let mc = this.app.mongo.db.collection("M_Question_infoNew");
        var dataArr = await mc.find({
            CommonSection: "初中",
            CommonSubject:"地理"
            // qid: { $exists: true },
            // "catalogs.ct": { $in: ["1", "2"] }
        }).limit(100).toArray();
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
                 <div style="color:red;float:left">【 NO.${index} 】</div>   ${item.Content}
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


