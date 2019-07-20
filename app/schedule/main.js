const Subscription = require('egg').Subscription;
const cheerio = require('cheerio');

class Main extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置

    static get schedule() {
        return {
            interval: "300s", // 5 分钟间隔
            type: 'all', // 指定所有的 worker 都需要执行
            immediate: true,
            disable:true
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        /*
                const res = await this.ctx.curl("http://www.jyeoo.com", {
                    headers: {
                        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36",
                        "host": "www.jyeoo.com",
                        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                        "accept-language": "gzip, deflate",
                    },
                    dataType: "text"
                });
                let htmlStr = res.data;
                this.ctx.logger.debug(htmlStr);
                */
        let htmlStr = `<!DOCTYPE html>
       <html lang="zh-cn">
       <head>
           <meta charset="utf-8" />
           <meta name="renderer" content="webkit" />
           <title>菁优网:菁于教,优于学</title>
           <meta name="keywords" content="初中数学,初中物理,初中化学,高中数学,在线学习,在线训练,学习诊断,全解全析,菁优网" />
           <meta name="description" content="菁优网以推动国内网络教育发展为己任,秉承严谨细致的工作作风,以诚信为本,致力于打造未来学习&amp;教研平台" />
           <meta name="baidu-site-verification" content="mshZUoGKJy" /><!--更新快照logo 小汤-->
           <link rel="canonical" href="http://www.jyeoo.com/" />
           <meta name="copyright" content="www.jyeoo.com" />
           <link href="http://img.jyeoo.net/favicon.ico" rel="shortcut icon" /><link href="http://img.jyeoo.net/jye-root-3.0.css?v=2019.5.30" rel="stylesheet" type="text/css" /><link href="http://img.jyeoo.net/images/formula/style.css?v=2019.5.8" rel="stylesheet" type="text/css" />
           <style type="text/css">
               .banner .wrapper { height: 380px; background: url(http://img.jyeoo.net/images/root/banner-index.png) 280px center no-repeat; }  
           </style>
       </head>
       <body>
           <script type="text/javascript" src="http://img.jyeoo.net/scripts/jquery1.7.2.js?v=20181112"></script><script type="text/javascript" src="http://img.jyeoo.net/scripts/jquery/jquery.unobtrusive-ajax.min.js"></script><script type="text/javascript" src="http://img.jyeoo.net/scripts/jye.min.js?v=20190423"></script><script type="text/javascript">var imageRootUrl="http://img.jyeoo.net/",wwwRootUrl="http://www.jyeoo.com/",blogRootUrl="http://blog.jyeoo.com/",spaceRootUrl="http://space.jyeoo.com/",loginUrl="http://www.jyeoo.com/",logoutUrl="http://www.jyeoo.com/account/logoff",scriptsUrl="http://img.jyeoo.net/scripts/",isMobile=false;var mustyleAttr={color:"#000000",fontsize:"13px",fontfamily:"arial",displaystyle:"true"};document.domain="jyeoo.com";$.ajaxSetup({cache:true});</script><script type="text/javascript" src="http://img.jyeoo.net/scripts/MLCore.min.new.js?v=20190513"></script><script type="text/javascript" src="http://www.jyeoo.com/content/scripts/tinyedit/core.js?v=20140703"></script><script type="text/javascript" src="http://img.jyeoo.net/scripts/jplugins-2012.03.16.min.js"></script>
           
                   <div id="ja045" style="width: 100%;position: relative; overflow: hidden;"></div>
               <script type="text/javascript">
                   $(function () {
                       $.getScript("http://a.jyeoo.com/js?sb=0&pt=&cb=&ps=45");
                   });
               </script>
       
       
           <div class="top">
               <div class="tr">
                   <a href="http://www.jyeoo.com/home/positiondetail?k=a1902c81-1bd5-4c7b-bba7-40daa7710684" target="_blank" style="color: red; font-size: 16px; font-weight: bolder;">兼职招聘</a>
                   
                   <em class="m6">|</em>
                   <a href="/recharge" target="_blank" rel="nofollow"><em>充值</em></a><em class="m6">|</em>
                   <a href="http://www.jyeoo.com/home/enter" rel="nofollow"><em>走进菁优</em></a><em class="m6">|</em>
                       <a href="javascript:void(0)" onclick="openLoginUI();" class="btn-ui user" rel="nofollow">登录</a><em class="m6">|</em>
                       <a href="javascript:void(0)" onclick="openRegisterUI();" rel="nofollow">注册</a>
               </div>
           </div>
           <div class="home-header">
               <div class="wrapper clearfix">
                   <div class="logo">
                       <a href="http://www.jyeoo.com/">
                           <img src="http://img.jyeoo.net/images/root/home-logo.png" />
                       </a>
                   </div>
                   
       <div class="search fright" id="JYE-SEARCH-FORM">
           <form action="/search" method="post">
               <label class="active">试题<input type="radio" name="c" value="0" checked="checked" /></label>
               <label>试卷<input type="radio" name="c" value="1" /></label>
               <input type="text" id="JYE-SEARCH" name="qb" autocomplete="off" />
               <img src="http://img.jyeoo.net/images/root/home-keyboard.png" id="mathmlHelper" />
               <input type="submit" value="搜一搜" />
           </form>
       </div>
       <style>
           .jye_auto_report { position: absolute; text-align: left; line-height: 150%; background-color: white; border: solid 1px #ccc; padding: 0px; z-index: 9999; background: white; }
           .jye_auto_report ul { display: block; margin: 0px; background: #fff; list-style: none; padding: 0; }
           .jye_auto_report ul li { display: block; list-style: none; line-height: 30px; cursor: pointer; margin: 0 10px; word-wrap: break-word; white-space: nowrap; overflow: hidden; }
           .jye_auto_report ul li:hover { background: #eee; }
           .jye_auto_report ul li.cur { background: #eee; }
           .jye_auto_report del { text-decoration: none; color: #f00; font-style: normal; font-weight: bold; }
       </style>
       <script type="text/javascript">
           $(function () {
               var formSearch = $("#JYE-SEARCH-FORM");
               $("input[name=c]", formSearch).click(function () {
                   $(this).closest("label").addClass("active").siblings().removeClass("active");
               });
       
               try {
                   var txtSearch = $("#JYE-SEARCH", formSearch);
                   txtSearch.focus();
                   $("#mathmlHelper").MathSearch(null, function (str) { txtSearch.val(txtSearch.val() + str); });
               } catch (e) { }
       
               $("form", formSearch).submit(function () {
                   var v = $("#JYE-SEARCH", formSearch).val();
                   if (!/[0-9a-z\u4E00-\u9FA5]/ig.test(v)) {
                       alert("请输入正确的查询内容！");
                       return false;
                   }
                   if (v.length > 100) {
                       $("#JYE-SEARCH", formSearch).val(v.substr(0, 99));
                   }
       
                   var stp = $("input[name=c]:checked").val();
                   var stpName = stp == "1" ? "试卷" : "试题";
                   _czc.push(['_trackEvent', "菁优搜索_首页", stpName, '匿名用户', '', 'jyeSearch']);
       
                   return true;
               });
       
               $("#JYE-SEARCH", formSearch).serchSuggest({ cd: function () { return $("input[name=c]:checked", formSearch).val() == "1"; } });
           });
       </script>
       <script type="text/javascript">
           $.fn.serchSuggest = function (options) {
               var defaults = {
                   url: "/api/searchsuggest",
                   ke: "s",//提交字段
                   cd: function () { return true; },//符合条件才执行下面一系列事件
                   num: 10,//显示的最大个数限制
                   minstart: 1,//开始匹配最小字符数限制
                   minchange: 1//重新请求最小改变字符数限制
               };
               var op = $.extend({}, defaults, options || {});
               var _self = $(this);
               var sLeft = _self.offset().left - _self.closest("div").offset().left, sW = _self.outerWidth(), sH = _self.outerHeight();
               var listbox = $('<div class=\"jye_auto_report\"></div>').insertAfter(_self).css({ left: sLeft, top: sH, width: sW }).hide();;
               var lastinput = "", issuggesting = false;
               window.suggestHistory = {};//历史搜索
               _self.keyup(function (e) {
                   if (!op.cd()) return;
                   var keyword = _self.val();
                   keyword = $.trim(keyword.replace(/[a-z]/ig, ""));
                   if (keyword.length < op.minstart) { listbox.hide(); return; }
                   switch (e.keyCode) {
                       case 38:
                           {
                               var ei = listbox.find('li'), eic = listbox.find('li.cur'), eip;
                               if (ei.length == 0) { return; }
                               if (eic.length == 0 || eic.prev('li').size()==0) { eip = ei.last(); } else { eip = eic.prev(); }
                               ei.removeClass('cur'); eip.addClass('cur'); _self.val(eip.text());
                           }
                           break;
                       case 40:
                           {
                               var ei = listbox.find('li'), eic = listbox.find('li.cur'), ein;
                               if (ei.length == 0) { return; }
                               if (eic.length == 0 || eic.next('li').size()==0) { ein = ei.first(); } else { ein = eic.next(); }
                               ei.removeClass('cur'); ein.addClass('cur'); _self.val(ein.text());
                           }
                           break;
                       default:
                           if (Math.abs($.trim(lastinput).length - keyword.length) >= op.minchange) {
                               var postdata = {}; postdata[op.ke] = keyword; postdata["r"] = Math.random();
                               if (window.suggestHistory[keyword]) {
                                   listbox.html(window.suggestHistory[keyword]).show();
                                   listbox.find("li").bind("click", function () {
                                       _self.val($(this).data("in"));
                                       listbox.find("li").removeClass("cur");
                                       $(this).addClass("cur");
                                       listbox.hide();
                                   });
                                   lastinput = keyword;
                               }
                               else {
                                   if (!issuggesting) {
                                       issuggesting = true;
                                       $.post(op.url, postdata, function (data) {
                                           issuggesting = false;
                                           if (data.length == 0) { listbox.hide(); return; }
                                           var html = "<ul>";
                                           var nn = op.num < data.length ? op.num : data.length;
                                           for (var i = 0; i < nn; i++) {
                                               if (data[i].length >= 2) {
                                                   html += "<li data-in=\"" + data[i][1] + "\">" + data[i][0] + "</li>";
                                               }
                                           }
                                           html += "</ul>";
                                           window.suggestHistory[keyword] = html;//历史搜索
                                           listbox.html(html).show();
                                           listbox.find("li").bind("click", function () {
                                               _self.val($(this).data("in"));
                                               listbox.find("li").removeClass("cur");
                                               $(this).addClass("cur");
                                               listbox.hide();
                                           });//.bind("mouseover", function () {_self.val($(this).text());});
                                       }, "json");
                                       lastinput = keyword;
                                   }
                               }
                           }
                           break;
                   }
               }).focus(function () {
                   if (!op.cd()) return;
                   var keyword = _self.val();
                   if (keyword != "") {
                       if (listbox.is(":visible")) {
                           listbox.hide();
                       } else if (listbox.find("li").length > 0) {
                           listbox.show();
                       }
                   }
               }).blur(function () {
                   if (!op.cd()) return;
                   setTimeout(function () { listbox.hide() }, 300);
               });
           }
       </script>
               </div>
           </div>
       
           <div class="banner">
               <div class="wrapper clearfix">
                   <div class="bannerL ">
                       <h2>菁于教 优于学</h2>
                       <div>
                           <span>用户多：2000万+</span>
                           <span>组卷快：平均10-20min</span>
                           <span>今日更新试题：<em>4999</em>道</span>
                       </div>
                       <div>
                           <span>试题多：800万+道</span>
                           <span>排版好：还原教材格式</span>
                           <span>今日更新试卷：<em>227</em>套</span>
                       </div>
                       <div class="btn-box">
                           <button class="btn-enter" onclick="window.location.href='/ques/search'">进入组卷中心</button>
                           <button class="btn-enter" onclick="window.location.href='/report/index'" style="margin-left:30px;">进入试卷中心</button>
                       </div>
                   </div>
                   <div class="bannerR">
                       <div class="BRBhead clearfix cfff">
                           <div class="f16 fleft">最新试卷</div>
                           <div class="fright">
                               <span id="spanCurSubject">初中数学</span>
                               <em class="nav-subject"><i class="icon i-down"></i></em>
                               <div class="tip-pop" style="width:370px;right:0;">
                                   <dl>
                                       <dt>小学</dt>
                                       <dd><em></em></dd>
                                           <dd><a href="javascript:void(0)" data-name="小学数学" class=""  onclick="_loadReportsNew(this,'math3')">数</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="小学语文" class=""  onclick="_loadReportsNew(this,'chinese3')">语</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="小学英语" class=""  onclick="_loadReportsNew(this,'english3')">英</a></dd>
                                   </dl>
                                   <dl>
                                       <dt>初中</dt>
                                       <dd><em></em></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中数学" class="active" onclick="_loadReportsNew(this,'math')">数</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中物理" class="" onclick="_loadReportsNew(this,'physics')">物</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中化学" class="" onclick="_loadReportsNew(this,'chemistry')">化</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中生物" class="" onclick="_loadReportsNew(this,'bio')">生</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中地理" class="" onclick="_loadReportsNew(this,'geography')">地</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中语文" class="" onclick="_loadReportsNew(this,'chinese')">语</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中英语" class="" onclick="_loadReportsNew(this,'english')">英</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中政治" class="" onclick="_loadReportsNew(this,'politics')">政</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="初中历史" class="" onclick="_loadReportsNew(this,'history')">历</a></dd>
                                   </dl>
                                   <dl>
                                       <dt>高中</dt>
                                       <dd><em></em></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中数学" class="" onclick="_loadReportsNew(this,'math2')">数</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中物理" class="" onclick="_loadReportsNew(this,'physics2')">物</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中化学" class="" onclick="_loadReportsNew(this,'chemistry2')">化</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中生物" class="" onclick="_loadReportsNew(this,'bio2')">生</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中地理" class="" onclick="_loadReportsNew(this,'geography2')">地</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中语文" class="" onclick="_loadReportsNew(this,'chinese2')">语</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中英语" class="" onclick="_loadReportsNew(this,'english2')">英</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中政治" class="" onclick="_loadReportsNew(this,'politics2')">政</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中历史" class="" onclick="_loadReportsNew(this,'history2')">历</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中信息" class="" onclick="_loadReportsNew(this,'tech1')">信</a></dd>
                                           <dd><a href="javascript:void(0)" data-name="高中通用" class="" onclick="_loadReportsNew(this,'tech2')">通</a></dd>
                                   </dl>
                               </div>
                           </div>
                       </div>
       
                       <div id="divReportsNew"></div>
       
                       <div class="enter clearfix">
                           <div class="fleft">
                               <a href="javascript:void(0)" onclick="return reportStatClick(this,-1)" title="立即进入" style="position:relative;">
                                   <img src="http://img.jyeoo.net/images/root/zhonggaokao-zhenti20190218.png" />
                                   <img src="http://img.jyeoo.net/images/root/icon-vip.png" style="position:absolute;top:-24px;right:0px;">
                               </a>
                               <a href="/special/gaokao2019" target="_blank" title="立即进入" style="position:relative;">
                                   <img src="http://img.jyeoo.net/images/root/gaokao-zhuanti2019.png" />
                                   <img src="http://img.jyeoo.net/images/root/icon-new.png" style="position:absolute;top:-24px;right:32px;">
                               </a>
                               <a href="/special/zhongkao2019" target="_blank" title="立即进入" style="position:relative;">
                                   <img src="http://img.jyeoo.net/images/root/zhongkao-zhuanti2019.png" />
                                   <img src="http://img.jyeoo.net/images/root/icon-new.png" style="position:absolute;top:-24px;right:32px;">
                               </a>
       
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       
           <div class="channel">
               <div class="wrapper">
                   <table>
                       <tr>
                           <td>
                               <a href="http://xyh.jyeoo.com/" target="_blank">
                                   <i class="i-xyh"></i>
                                   <h3>校园号</h3>
                                   <div></div>
                                   <p>集体尊享服务，更多特权</p>
                               </a>
                           </td>
                           <td>
                               <a href="http://www.51banyin.com/" target="_blank">
                                   <i class="i-banyin"></i>
                                   <h3>伴印</h3>
                                   <div></div>
                                   <p>错题管理，精准教学</p>
                               </a>
                           </td>
                           <td>
                               <a href="/homework" target="_blank">
                                   <i class="i-training"></i>
                                   <h3>在线作业</h3>
                                   <div></div>
                                   <p>在线作业，提供个性化报告</p>
                               </a>
                           </td>
                           <td>
                               <a href="/wenda" target="_blank">
                                   <i class="i-ask"></i>
                                   <h3>问答</h3>
                                   <div></div>
                                   <p>疑难问题轻松解答</p>
                               </a>
                           </td>
                           <td>
                               <a href="http://yuejuan.jyeoo.com/" target="_blank">
                                   <i class="i-yuejuan"></i>
                                   <h3>阅卷</h3>
                                   <div></div>
                                   <p>阅卷从未如此简单</p>
                               </a>
                           </td>
                           <td>
                               <a href="/open" target="_blank" style="border-right:1px solid #f3f3f3;">
                                   <i class="i-api"></i>
                                   <h3>题库开放平台</h3>
                                   <div></div>
                                   <p>解决企业/机构资源匮乏</p>
                               </a>
                           </td>
                       </tr>
                   </table>
               </div>
           </div>
       
           <div class="sub-group wrapper">
               <div>
                   <div class="sub-tab">学科导航</div>
                   <ul class="sub-cont">
                       <li>
                           <div class="sub-tlt">
                               <b>初中</b>
                               <i>&gt;</i>
                           </div>
                           <div class="sub-list">
                               <ul>
                                   <li>
                                       <span>数学</span>
                                       <a href="/math/ques/search" target="_blank" title="初中数学试题">试题</a>
                                       <em></em>
                                       <a href="/math/report/index" target="_blank" title="初中数学试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>物理</span>
                                       <a href="/physics/ques/search" target="_blank" title="初中物理试题">试题</a>
                                       <em></em>
                                       <a href="/physics/report/index" target="_blank" title="初中物理试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>化学</span>
                                       <a href="/chemistry/ques/search" target="_blank" title="初中化学试题">试题</a>
                                       <em></em>
                                       <a href="/chemistry/report/index" target="_blank" title="初中化学试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>生物</span>
                                       <a href="/bio/ques/search" target="_blank" title="初中生物试题">试题</a>
                                       <em></em>
                                       <a href="/bio/report/index" target="_blank" title="初中生物试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>地理</span>
                                       <a href="/geography/ques/search" target="_blank" title="初中地理试题">试题</a>
                                       <em></em>
                                       <a href="/geography/report/index" target="_blank" title="初中地理试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>英语</span>
                                       <a href="/english/ques/search" target="_blank" title="初中英语试题">试题</a>
                                       <em></em>
                                       <a href="/english/report/index" target="_blank" title="初中英语试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>语文</span>
                                       <a href="/chinese/ques/search" target="_blank" title="初中语文试题">试题</a>
                                       <em></em>
                                       <a href="/chinese/report/index" target="_blank" title="初中语文试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>政治</span>
                                       <a href="/politics/ques/search" target="_blank" title="初中政治试题">试题</a>
                                       <em></em>
                                       <a href="/politics/report/index" target="_blank" title="初中政治试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>历史</span>
                                       <a href="/history/ques/search" target="_blank" title="初中历史试题">试题</a>
                                       <em></em>
                                       <a href="/history/report/index" target="_blank" title="初中历史试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>科学</span>
                                       <a href="http://www2.jyeoo.com/science/ques/search" target="_blank" title="初中科学试题">试题</a>
                                   </li>
                               </ul>
                           </div>
                       </li>
                       <li>
                           <div class="sub-tlt">
                               <b>高中</b>
                               <i>&gt;</i>
                           </div>
                           <div class="sub-list">
                               <ul>
                                   <li>
                                       <span>数学</span>
                                       <a href="/math2/ques/search" target="_blank" title="高中数学试题">试题</a>
                                       <em></em>
                                       <a href="/math2/report/index" target="_blank" title="高中数学试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>物理</span>
                                       <a href="/physics2/ques/search" target="_blank" title="高中物理试题">试题</a>
                                       <em></em>
                                       <a href="/physics2/report/index" target="_blank" title="高中物理试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>化学</span>
                                       <a href="/chemistry2/ques/search" target="_blank" title="高中化学试题">试题</a>
                                       <em></em>
                                       <a href="/chemistry2/report/index" target="_blank" title="高中化学试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>生物</span>
                                       <a href="/bio2/ques/search" target="_blank" title="高中生物试题">试题</a>
                                       <em></em>
                                       <a href="/bio2/report/index" target="_blank" title="高中生物试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>地理</span>
                                       <a href="/geography2/ques/search" target="_blank" title="高中地理试题">试题</a>
                                       <em></em>
                                       <a href="/geography2/report/index" target="_blank" title="高中地理试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>英语</span>
                                       <a href="/english2/ques/search" target="_blank" title="高中英语试题">试题</a>
                                       <em></em>
                                       <a href="/english2/report/index" target="_blank" title="高中英语试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>语文</span>
                                       <a href="/chinese2/ques/search" target="_blank" title="高中语文试题">试题</a>
                                       <em></em>
                                       <a href="/chinese2/report/index" target="_blank" title="高中语文试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>政治</span>
                                       <a href="/politics2/ques/search" target="_blank" title="高中政治试题">试题</a>
                                       <em></em>
                                       <a href="/politics2/report/index" target="_blank" title="高中政治试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>历史</span>
                                       <a href="/history2/ques/search" target="_blank" title="高中历史试题">试题</a>
                                       <em></em>
                                       <a href="/history2/report/index" target="_blank" title="高中历史试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>信息</span>
                                       <a href="/tech1/ques/search" target="_blank" title="高中信息试题">试题</a>
                                       <em></em>
                                       <a href="/tech1/report/index" target="_blank" title="高中信息试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>通用</span>
                                       <a href="/tech2/ques/search" target="_blank" title="高中通用试题">试题</a>
                                       <em></em>
                                       <a href="/tech2/report/index" target="_blank" title="高中通用试卷">试卷</a>
                                   </li>
                               </ul>
                           </div>
                       </li>
                       <li>
                           <div class="sub-tlt">
                               <b>小学</b>
                               <i>&gt;</i>
                           </div>
                           <div class="sub-list">
                               <ul>
                                   <li>
                                       <span>数学</span>
                                       <a href="/math3/ques/search" target="_blank" title="小学数学试题">试题</a>
                                       <em></em>
                                       <a href="/math3/report/index" target="_blank" title="小学数学试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>奥数</span>
                                       <a href="/math0/ques/search?f=1" target="_blank" title="小学奥数试题">试题</a>
                                       <em></em>
                                       <a href="/math0/report/search" target="_blank" title="小学奥数试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>语文</span>
                                       <a href="/chinese3/ques/search" target="_blank" title="小学语文试题">试题</a>
                                       <em></em>
                                       <a href="/chinese3/report/index" target="_blank" title="小学语文试卷">试卷</a>
                                   </li>
                                   <li>
                                       <span>英语</span>
                                       <a href="/english3/ques/search" target="_blank" title="小学英语试题">试题</a>
                                       <em></em>
                                       <a href="/english3/report/index" target="_blank" title="小学英语试卷">试卷</a>
                                   </li>
                               </ul>
                           </div>
                       </li>
                   </ul>
               </div>
           </div>
       
           <div class="foot wrapper" style="margin-top:40px;">
               <div style=" width:700px;height:80px;margin:0 auto"><div class="fl"><a target="_blank" href="http://www.jyeoo.com/open" rel="nofollow">商务合作</a><em class="m5">|</em><a target="_blank" href="http://www.jyeoo.com/home/note" rel="nofollow">服务条款</a><em class="m5">|</em><a target="_blank" href="http://www.jyeoo.com/home/enter" rel="nofollow">走进菁优</a><em class="m5">|</em><a target="_blank" href="http://www.jyeoo.com/support" rel="nofollow">帮助中心</a><em class="m5">|</em><a id="aCNZZ" title="站长统计" href="http://www.cnzz.com/stat/website.php?web_id=2018550" target="_blank">站长统计</a><script type="text/javascript">$(function(){$.getScript('http://s94.cnzz.com/stat.php?id=2018550&web_id=2018550', function () { $('#aCNZZ').prop('title', '菁优网站长统计'); });});</script><em class="m5">|</em><a target="_blank" href="http://www.jyeoo.com/home/suggest" rel="nofollow">意见反馈</a><div style="clear:both"></div><a target="_blank" href="http://gd.beian.miit.gov.cn/publish/query/indexFirst.action" rel="noreferrer">粤ICP备10006842号</a> <a target="_blank" href="http://www.gdca.gov.cn/">粤B2-20100319</a> &nbsp;&copy;2010-2019&nbsp;&nbsp;jyeoo.com 版权所有，V3.26648</div><div class="fr"><a href="http://szcert.ebs.org.cn/f7a0b4d9-32ae-46a1-918f-877f98f71a58" target="_blank">深圳市市场监管<br/>主体身份认证</a></div></div>
       <script type="text/javascript">
           var pageProtocol = document.location.protocol;
           if (pageProtocol == "https:" || pageProtocol == "https") {
               location.href = 'http://www.jyeoo.com/';
           }
       </script>
           </div>
       
           <div class="side-tip">
               <a href="/appstore" target="_blank" class="app">
                   <i></i>
                   <div style="margin-top:-94px;">
                       <img src="http://img.jyeoo.net/images/root/APP-code.png" />
                       <p>扫码下载APP</p>
                   </div>
                   <em><b></b></em>
               </a>
               <a href="javascript:void(0)" class="service">
                   <i></i>
                   <div style="margin-top:-59px;">
                       <p>
                           <span>客服热线：</span>
                           <span>400-863-9889</span>
                       </p>
                       <p>
                           <span>上班时间：</span>
                               <span>9:00-12:30<br />14:00-22:30</span>
                       </p>
                   </div>
                   <em><b></b></em>
               </a>
               <a href="javascript:void(0)" class="wechat">
                   <i></i>
                   <div style="margin-top:-94px;">
                       <img src="http://img.jyeoo.net/images/root/service-code.png" />
                       <p>扫码关注服务号</p>
                   </div>
                   <em><b></b></em>
               </a>
               <a href="javascript:void(0)" class="users">
                   <i></i>
                   <div style="margin-top:-82px;">
                       <p>学生Q群：480112476</p>
                       <p>教师Q群：488131139</p>
                       <p>家长Q群：486765070</p>
                       <p>咨询Q群：548707308</p>
                       <p>VIP专属群：330881880</p>
                   </div>
                   <em><b></b></em>
       
               </a>
               <a href="http://weibo.com/jyeoo" class="weibo" target="_blank">
                   <i></i>
               </a>
           </div>
       
           <script type="text/javascript">
               //事件统计
               var _czc = _czc || [];
               _czc.push(["_setAccount", "2018550"]);
           </script>
           <script type="text/javascript">
               $(function () {
                   $(".sub-list li:nth-child(5n)").css("margin-right", 0);
       
                   _loadReportsNew(null, 'math');
       
                   delLoginCookie();
       
                   var qp = new QP(window.document.location.href), r = qp['ReturnUrl'];
                   if (r && r.length > 0) { openLoginUI(r); }
       
                   if (jyeoo.isLogin()) { getCampusSaleInfo(); }
               });
       
               function _showTab(i) {
                   $(".bannerR-tab span").removeClass("active").eq(i).addClass("active");
                   $(".BRbox ul.report-index-list").hide().eq(i).show();
               }
               function _loadReportsNew(el, s) {
                   if (el) {
                       el = $(el);
                       $("#spanCurSubject").html(el.data("name"));
                       $(".BRBhead a").removeClass("active");
                       el.addClass("active");
                   }            
                   $("#divReportsNew").empty().load("/" + s + "/report/getnormals", { r: Math.random() }, function () {
                       $(this).loaded();
                   });
               }
       
               function addMask() {
                   var dmt = $(document);
                   $("<div class=\"message-mask\"></div>").css({ "height": dmt.height(), "width": dmt.width(), "background-color": "#000", "opacity": 0.5, "position": "fixed", "left": 0, "top": 0, "z-index": 9 }).appendTo($("body"));
               }
               function openLoginUI(u, t) {
                   $('<div class="box-overlay"></div>').css({ zIndex: 1001, width: '100%', height: $(document).height(), display: 'block' }).appendTo(document.body);
                   var box = $("#loginwrap");
                   if (box.size() == 0) {
                       box = $("<div class=\"loginwrap\" id=\"loginwrap\" style=\"position: fixed; z-index: 1003; top: 50%; margin-top: -270px; left: 50%; margin-left: -360px;\"><div>");
                   }
                   var pu = typeof (u) != 'undefined' ? encodeURIComponent(u) : '', pt = typeof (t) != 'undefined' ? encodeURIComponent(t) : '';
                   var loginUrl = "/api/iframelogin?t=" + pt + '&u=' + pu + "&r=" + Math.random();
                   box.appendTo(document.body).empty().load(loginUrl);
               }
               function openRegisterUI(id, e, r) {
                   $('<div class="box-overlay"></div>').css({ zIndex: 1001, width: '100%', height: $(document).height(), display: 'block' }).appendTo(document.body);
                   var box = $("#loginwrap");
                   if (box.size() == 0) {
                       box = $("<div class=\"loginwrap\" id=\"loginwrap\" style=\"position: fixed; z-index: 1003; top: 50%; margin-top: -270px; left: 50%; margin-left: -360px;\"><div>");
                   }
                   var pid = typeof (id) != 'undefined' ? encodeURIComponent(id) : '', pe = typeof (e) != 'undefined' ? encodeURIComponent(e) : '',
                       pr = typeof (r) != 'undefined' ? encodeURIComponent(r) : '';
                   var registerUrl = "/api/iframeregister?id=" + id + "&e=" + pe + "&r=" + pr + "&rm=" + Math.random();
                   box.appendTo(document.body).empty().load(registerUrl);
       
               }
               function showMessage(content, b, w) {
                   hideMessage();
                   var width = 400;
                   if (w) width = w;
                   var left = -(width / 2 + 40);
                   var msgBar = $('<div style="width:' + width + 'px;margin-left:' + left + 'px;"><p></p><div><a href="javascript:void(0)" onclick="hideMessage(this)" class="btn btn-blue btn-lg">我知道了</a></div></div>').attr('id', '_message').addClass('msgtip').appendTo('body');
                   b = typeof (b) === 'undefined' ? true : b;
                   if (b) {
                       msgBar.prepend('<h2><i class="icon i-success"></i><span>操作成功</span></h2>');
                   } else {
                       msgBar.prepend('<h2><i class="icon i-fail"></i><span>操作失败</span></h2>');
                   }
                   msgBar.find('p').html(content).slideDown('slow');
                   g_msgtimeout = window.setTimeout(hideMessage, 5000);
               }
               function showMessageTip(content, w) {
                   hideMessage();
                   addMask();
                   var width = 300;
                   if (w) width = w;
                   var msgBar = $('<div style="width:' + width + 'px;"><h2 class="head">温馨提示</h2><i class="close" onclick="hideMessage(this)">×</i><p class="tip-txt"></p><div><button class="btn-index" onclick="hideMessage(this)">知道了</button></div></div>').attr('id', '_message').addClass('msgtip msgtip-box').appendTo('body');
                   msgBar.find('p.tip-txt').html(content).slideDown('slow');
                   g_msgtimeout = window.setTimeout(hideMessage, 5000);
               }
               function hideMessage() {
                   $('#_message').slideUp('slow').remove();
                   if ($(".message-mask").size() > 0) {
                       $(".message-mask").remove();
                   }
                   if (g_msgtimeout != null) { window.clearTimeout(g_msgtimeout); g_msgtimeout = null; }
               }
               function loginSuccess(id, r) {
                   showMessage("恭喜您登录成功，系统正在处理相应请求或跳转.");
       
                   jyeoo.user.ID = id;
       
                   var ru = $("#ReturnUrl");
       
                   var u0 = ru.size() == 1 && ru.val().length > 0 ? ru.val() : "";
                   if (r != "") {
                       u0 = r;
                   }
                   var u1 = $.cookie('JYE_LB_URL');
                   var o0 = $.cookie('JYE_LB_OPTIONS');
       
                   delLoginCookie();
       
                   closeBox();
       
                   if (u0 != "") {
                       window.location.href = decodeURIComponent(u0);
                   } else if (u1 != null && o0 != null) {
                       u1 = decodeURIComponent(u1); o0 = JSON.parse(decodeURIComponent(o0));
       
                       openBox(o0, u1);
                   } else if (u1 != null) {
                       u1 = decodeURIComponent(u1);
                       window.location.href = u1;
                   } else if (typeof (loginCallback) != 'undefined') {
                       loginCallback();
                   } else if (window.location.href == wwwRootUrl) {
                       window.location.href = window.location.href;
                   } else {
                       window.location.href = window.location.href;
                   }
               }
               function feedback() {
                   if (!jyeoo.isLogin()) return;
       
                   var option = { width: "540", height: "340", draggable: true, title: "新增建议" };
                   var box = openBox(option, "/home/feedback", {}, function () {
                       $(this).loaded();
                   });
               }
       
               function reportStatClick(el,tp) {
                   addCzcByRole(tp, '首页真题分析图表', '点击', 'reportStatHome');
       
                   el = $(el);
                   var url = "/math/report/stat";
                   el.attr("href", url).attr("target", "_blank");
                   return true;
               }
       
               function reportMoreClick(el, s, so1, tp) {
                   _czc.push(['_trackEvent', '首页最新试卷更多', '点击', tp, '', 'reportMoreHome']);
       
                   el = $(el);
                   var url = "/" + s + "/report/search";
                   if (so1 == 1) {
                       url += "?so=101";
                   } else {
                       url += "?so1=" + so1;
                   }
       
                   el.attr("href", url).attr("target", "_blank");
                   return true;
               }
       
               function addCzcByRole(tp, tt, enm, nm) {
                   if (tp == -1) {
                       _czc.push(['_trackEvent', tt, enm, '匿名用户', '', nm]);
                   } else if (tp == 1) {
                       _czc.push(['_trackEvent', tt, enm, 'VIP用户', '', nm]);
                   } else if (tp == 2) {
                       _czc.push(['_trackEvent', tt, enm, '校园号用户', '', nm]);
                   } else {
                       _czc.push(['_trackEvent', tt, enm, '普通用户', '', nm]);
                   }
               }
       
           </script>
       </body>
       </html>
       
       `
        let reg = /<a href=\"(.+)\" target=\"_blank\" title=\"(.{2})(.{2})试题\">试题<\/a>/g;
        let reg1 = /<a href=\"(.+)\" target=\"_blank\" title=\"(.{2})(.{2})试题\">试题<\/a>/;
        let r = htmlStr.match(reg);
        let result = [];
        for (let item of r) {
            let rItem = item.match(reg1);
            console.log(JSON.stringify(rItem));
            result.push({ url: "http://www.jyeoo.com" + rItem[1], section: rItem[2], subject: rItem[3] })

        }
        let db = this.app.mongo.db;
        await db.collection('Subject').remove({});
        await this.app.mongo.insertMany("Subject", { docs: result })

    }

}

module.exports = Main;