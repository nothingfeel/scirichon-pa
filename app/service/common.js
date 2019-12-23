const neo4j = require('neo4j-driver').v1
const Service = require('egg').Service;
const _ = require("lodash")


class CommonService extends Service {



    /**
     * 请求ES服务
     * @param {string} path es路径
     * @param {string} method 方法
     * @param {object} data 参数
     */
    async requestUri(path, method, data) {
        const res = await this.ctx.curl(`${this.config.appConfig.apiHost}${path}`, {
            headers: { token: "qwe!@#", "content-type": "application/json" },
            dataType: "json",
            data: data || { t: new Date().getTime() },
            method: method
        });
        return res;
    }

    async runNeo4j(cql, params) {
        /*
                return new Promise((resolve, reject) => {
                    
                    const neo4jConfig = this.app.config.appConfig.neo4jConfig;
                    const connStr = "bolt://" + neo4jConfig.host + ":" + neo4jConfig.port;
                    const neo4jDriver = neo4j.driver(connStr, neo4j.auth.basic(neo4jConfig.user, neo4jConfig.password))
                    const session = neo4jDriver.session()
                    // console.log(`cypher to executed:${JSON.stringify({ cql, params }, null, '\t')}`)
                    session.run(cql, params)
                        .then(result => {
                            session.close()
                            resolve(parse(result))
                        })
                        .catch(error => {
                            session.close()
                            error = error.fields ? JSON.stringify(error.fields[0]) : String(error)
                            reject(`error while executing Cypher: ${error}`)
                        })
                })
                */

        const neo4jConfig = this.app.config.appConfig.neo4jConfig;
        const connStr = "bolt://" + neo4jConfig.host + ":" + neo4jConfig.port;
        const neo4jDriver = neo4j.driver(connStr, neo4j.auth.basic(neo4jConfig.user, neo4jConfig.password))
        const session = neo4jDriver.session()
        // console.log(`cypher to executed:${JSON.stringify({ cql, params }, null, '\t')}`)
        let result = null;
        try {
            result = await session.run(cql, params);
            session.close();
        }
        catch (e) {
            this.app.logger.info("common neo4j error ==>" + JSON.stringify(e))
        }
        finally {
            session.close();
        }
        return result;
    }

    getSubjectId(sectionName, subjectName) {
        let section = 1;
        let arr = [
            { id: 1, section: 1, name: "数学", sort: 1 },
            { id: 2, section: 1, name: "语文", sort: 2 },
            { id: 3, section: 1, name: "英语", sort: 3 },

            { id: 4, section: 2, name: "数学", sort: 4 },
            { id: 5, section: 2, name: "物理", sort: 5 },
            { id: 6, section: 2, name: "化学", sort: 6 },
            { id: 7, section: 2, name: "生物", sort: 7 },
            { id: 8, section: 2, name: "地理", sort: 8 },
            { id: 9, section: 2, name: "语文", sort: 9 },
            { id: 10, section: 2, name: "英语", sort: 10 },
            { id: 11, section: 2, name: "政治", sort: 11 },
            { id: 12, section: 2, name: "历史", sort: 12 },

            { id: 13, section: 3, name: "数学", sort: 13 },
            { id: 14, section: 3, name: "物理", sort: 14 },
            { id: 15, section: 3, name: "化学", sort: 15 },
            { id: 16, section: 3, name: "生物", sort: 16 },
            { id: 17, section: 3, name: "地理", sort: 17 },
            { id: 18, section: 3, name: "语文", sort: 18 },
            { id: 19, section: 3, name: "英语", sort: 19 },
            { id: 20, section: 3, name: "政治", sort: 20 },
            { id: 21, section: 3, name: "历史", sort: 21 },
        ];
        if (sectionName == "小学")
            section = 1;
        if (sectionName == "初中")
            section = 2;
        if (sectionName == "高中")
            section = 3;

        let subjectObj = _.find(arr, { name:subjectName, section: section })
        if (subjectObj == null) {
            return null;
        }
        return { section: section, subject: subjectObj.id }
    }
}
module.exports = CommonService;