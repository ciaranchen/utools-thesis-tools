const axios = require('axios');
const cheerio = require('cheerio');

let base_url = "https://www.letpub.com.cn/"
function parse_letpub_results(text) {
  let $ = cheerio.load(text);
  trs = $("#yxyz_content > table.table_yjfx > tbody > tr:gt(1)");
  let res = trs.map((i, e) => {
    if (i != trs.length - 1) {
      // console.log(e.children[1].children[0].attribs.href);
      let info = {
        title: e.children[1].children[0].children[0].data,
        index: e.children[3].children[0].data + ' ' + e.children[3].children[3].data,
        zone: e.children[4].children[0].data,
        class: e.children[5].children[0].data + ' ' + e.children[5].children[3].data,
        url: base_url + e.children[1].children[0].attribs.href
      }
      info['description'] = "中科院" + info.zone + "\t\t" + info.class + "\t\t" + info.index
      return info
    } else {
      let as = $("#yxyz_content > table.table_yjfx > tbody > tr:last-child > td > form");
      return {
        title: '更多内容',
        description: '打开浏览器查看',
        url: base_url + as.prev().prev().attr().href
      }
    }
  });
  return res.get();
}

window.exports = {
  'letpub': {
    mode: 'list',
    args: {
      search: (action, searchWord, callbackSetList) => {
        if (!searchWord) return callbackSetList()
        searchWord = searchWord.toLowerCase()
        axios({
          url: 'https://www.letpub.com.cn/index.php?page=journalapp&view=search',
          method: 'post',
          data: {
            searchname: searchWord,
            view: "search",
            searchsort: "relevance"
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          transformRequest: [function (data) {
            let ret = ''
            for (let it in data) {
              ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
            }
            return ret
          }],
        }).then(response => {
          const data = response.data;
          callbackSetList(parse_letpub_results(data));
        });
      },
      select: (action, itemData) => {
        window.utools.hideMainWindow()
        if (itemData.title != "更多内容") {
          window.utools.copyText(itemData.title);
        }
        require('electron').shell.openExternal(itemData.url)
        window.utools.outPlugin();
      }
    }
  },
  'article_replace': {
    mode: 'none',
    args: {
      enter: (action) => {
        window.utools.hideMainWindow();
        let res = '';
        let text = action.payload;
        let en_letter_match = text.match(/[a-zA-z]/g);
        let en_letter_cnt = en_letter_match?letter_match.length: 0;
        // console.log(letter_count);
        let isEnglish = en_letter_cnt > (text.length/2); // is English or not?
        if (isEnglish) {
          // TODO: 处理连字符
          res = text.replaceAll('\r\n', ' ').replaceAll('\n', ' ');
        } else {
          res = text.replaceAll('\r\n', '').replaceAll('\n', '');
        }
        window.utools.copyText(res);
        window.utools.outPlugin()
      }
    }
  }
}
