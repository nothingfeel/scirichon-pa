
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
            data: data||{t:new Date().getTime()},
            method: method
        });
        return res;
    }
}
module.exports = CommonService;