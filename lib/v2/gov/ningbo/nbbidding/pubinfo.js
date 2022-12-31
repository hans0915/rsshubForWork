const got = require('@/utils/got');
const cheerio = require('cheerio');
const timezone = require('@/utils/timezone');
const { parseDate } = require('@/utils/parse-date');
const logger = require('@/utils/logger');

module.exports = async (ctx) => {
    // const params = ctx.params[0] ?? 'kjzx/tzgg';

    const rootUrl = 'http://www.nbbidding.com';
    const currentUrl = `${rootUrl}/Home/Notice/index?is_open=1`;

    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = cheerio.load(response.data);

    const itemsdemo = $('.newsDiv .currM');
    logger.info(itemsdemo.length);
    //      .find('li').toArray();
    // itemsdemo.forEach(function(val, index) {
    //     logger.info(val.toString(), index);
    // });
    // logger.info(itemsdemo.length);

    // throw  Error(111);

    let items = $('.one-news-list')
        .find('li')
        .toArray()
        .map((item) => {
            item = $(item);
            // logger.info($(item).children("a").text().trim());
            return {

                // context:item.('fa fa-caret-right'),
                title: item.children("a").attr('title').text(),
                addtime: item.children("a").find('span').text(),
                // address: item.children(".address").text().trim().slice(1,-1).trim(),
            };
        });


    logger.info("start log");


    for (let i = 0;i < items.length;i++) {
        logger.info(items[i].title);
        // logger.info(items[i].link);
        logger.info(items[i].addtime);
        // logger.info(items[i].address);
    }

    logger.info("end log");


    items = await Promise.all(
        items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: `${rootUrl}${item.link}`,
                });

                const content = cheerio.load(detailResponse.data);
                // 正文内容
                item.description = content('.content-box').html();
                item.announcementNo = content('.release').text();
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
};
