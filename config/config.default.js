exports.keys = "my-cookie-secret-key";
exports.logger = {
    level: 'DEBUG',
};
exports.mongo = {
    client: {
        host: "localhost",
        port: "27017",
        name: "TsingDa_Question"
    }
    // client: {
    //     host: "127.0.0.1",
    //     port: "27017",
    //     name: "spider"
    // }
}

exports.appConfig = {
    agent: {
        cron: "20s",
        host: "http://ip.zdaye.com",
        mainUrl: "http://ip.zdaye.com/dayProxy/2019/7/1.html"
    },
    jyeoo: {

    },
    apiHost:"http://192.168.2.222:3006"
}