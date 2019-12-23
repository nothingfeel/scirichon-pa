
const Controller = require('egg').Controller;
const _ = require('lodash')

class Subject extends Controller {
    async Add() {
        let dt = new Date();

        await this.app.mysql.delete("echo_subject",{});
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

       let r = await this.app.mysql.insert("echo_subject",arr);
       this.ctx.body = r;
    }
}

module.exports = Subject;
