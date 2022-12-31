/**
 * author hans
 * 宁波市公共资源交易中心（鄞州）
 * Ningbo Yinzhou Public Resources Trading Center
 * http://yinzhou.nbggzy.cn/gcjsqtjy/index.jhtml?areaCode=330212
 */

const got = require('@/utils/got');
const cheerio = require('cheerio');
const timezone = require('@/utils/timezone');
const { parseDate } = require('@/utils/parse-date');
const logger = require('@/utils/logger');

module.exports = async (ctx) => {
    // const params = ctx.params[0] ?? 'kjzx/tzgg';

    const rootUrl = 'http://yinzhou.nbggzy.cn';
    const currentUrl = `${rootUrl}/gcjsqtjy/index.jhtml?areaCode=330212`;

    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = cheerio.load(response.data);
    let items = $('.table-box')
        .find('tr')
        .has('a')
        .toArray()
        .map((item) => {
            item = $(item);
            if ($(item).find('a').attr('target') == '_blank') {
                // logger.info($(item).find("a").text().trim());
                return {
                    title: item.find("a").text().trim(),
                    // context:item.('fa fa-caret-right'),
                    link: item.find("a").attr('href'),
                    addtime: item.find('span').parent().next().text().trim(),
                };
            } else {
                logger.info("skip");
            }

            // return {
            //
            //     title: item.children("a").text().trim(),
            //     //context:item.('fa fa-caret-right'),
            //     link: item.children("a").attr('href'),
            //     addtime: item.children(".addtime").text(),
            //     address: item.children(".address").text().trim().slice(1,-1).trim(),
            // }
        });

    delete items[20];

    // for(var key in items){
    //     logger.info("key名称是："+key+",key的值是："+items[key]);
    // }

    // throw Error(222);

    // logger.info(items.length);

    // for(var key in items){
    //     logger.info("key名称是："+key+",key的值是："+items[key]);
    // }

    ClearNullArr(items);

    // for(let i=0;i<items.length;i++){
    //     logger.info("title: "+items[i].title);
    //     logger.info("link: "+items[i].link);
    //     logger.info("addtime: "+items[i].addtime);
    //     // logger.info(items[i].address);
    // }

    items = await Promise.all(
        items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: `${rootUrl}${item.link}`,
                });
                const content = cheerio.load(detailResponse.data);
                // 正文内容
                item.description = content('.detailed').html();
                item.announcementNo = content('.addtime').find('p').text();
                // logger.info(item.code);
                // item.pubDate = timezone(parseDate(content('meta[name="PubDate"]').attr('content')), +8);
                return item;
            })
        )
    );

    ctx.state.data = {
        title: $('title').text(),
        link: currentUrl,
        item: items,
    };

    function ClearNullArr(arr) {
        for (let i = 0, len = arr.length;i < len;i++) {
            if (!arr[i] || arr[i] == '') {
                arr.splice(i, 1);
                len--;
                i--;
            }
        }
        return arr;
    }
};
