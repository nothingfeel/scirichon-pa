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
};
exports.mysql = {
    client: {
        // host
        host: 'localhost',
        // 端口号
        port: '3306',
        // 用户名
        user: 'root',
        // 密码
        password: 'mysql',
        // 数据库名
        database: 'echo'

        //  // host
        // host: '192.168.2.231',
        // // 端口号
        // port: '3306',
        // // 用户名
        // user: 'Echo-MySQL',
        // // 密码
        // password: 'Echo-Ap1',
        // // 数据库名
        // database: 'echo'
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
};



exports.appConfig = {
    agent: {
        cron: "20s",
        host: "http://ip.zdaye.com",
        mainUrl: "http://ip.zdaye.com/dayProxy/2019/7/1.html"
    },
    jyeoo: {

    },
    apiHost: "http://192.168.2.231/echo_api",
    deleteBatchCount: 10,

    neo4jConfig: {
        "host": "192.168.2.231",
        "port": 7687,
        "user": "neo4j",
        "password": "echoecho"
    }

}