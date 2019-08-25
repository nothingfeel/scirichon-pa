const neo4j = require('neo4j-driver').v1
const Service = require('egg').Service;


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
        }
        catch (e) {
            this.app.logger.info("common neo4j error ==>" + JSON.stringify(e))
        }
        finally {
            session.close();
        }
        return result;
    }
}
module.exports = CommonService;