exports.keys = "my-cookie-secret-key";
exports.logger = {
    level: 'DEBUG',
};
exports.mongo = {
    client: {
        host: "localhost",
        port: "27017",
        name: "spider"
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
        mainUrl: "http://ip.zdaye.com/dayProxy/2019/7/2.html"
    },
    jyeoo:{
        
    }
}