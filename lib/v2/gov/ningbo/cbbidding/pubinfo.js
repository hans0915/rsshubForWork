const got = require('@/utils/got');
const cheerio = require('cheerio');
const timezone = require('@/utils/timezone');
const { parseDate } = require('@/utils/parse-date');
const logger = require('@/utils/logger');

module.exports = async (ctx) => {
    // const params = ctx.params[0] ?? 'kjzx/tzgg';

    const rootUrl = 'https://cbbidding.com';
    const currentUrl = `${rootUrl}/Index/cms/mid/22.html`;

    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = cheerio.load(response.data);

    // let itemsdemo = $('.notice-list')
    //      .find('li').toArray();
    // itemsdemo.forEach(function(val, index) {
    //     logger.info(val.toString(), index);
    // });
    // logger.info(itemsdemo.length);


    let items = $('.notice-list')
        .find('li')
        .toArray()
        .map((item) => {
            item = $(item);
            // logger.info($(item).children("a").text().trim());
            return {
                title: item.children("a").text().trim(),
                // context:item.('fa fa-caret-right'),
                link: item.children("a").attr('href'),
                addtime: item.children(".addtime").text(),
                address: item.children(".address").text().trim().slice(1, -1).trim(),
            };
        });

    // for(let i=0;i<items.length;i++){
    //     logger.info(items[i].title);
    //     logger.info(items[i].link);
    //     logger.info(items[i].addtime);
    //     logger.info(items[i].address);
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
};
