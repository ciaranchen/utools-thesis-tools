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

function do_search(searchWord, callbackSetList) {
  if (!searchWord) return callbackSetList();
  searchWord = searchWord.toLowerCase();
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
}

function dbc2sbc(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i);
      if ((charCode >= 65296 && charCode <= 65305) || //0~9
          (charCode >= 65313 && charCode <= 65338) || //A~Z
          (charCode >= 65345 && charCode <= 65370)) { //a~z
          result += String.fromCharCode(charCode - 65248)
      } else if (charCode == 12288) { //space
          result += String.fromCharCode(32);
      } else {
          result += str[i];
      }
  }
  return result;
}


let letpub_timeout;

window.exports = {
  'letpub': {
    mode: 'list',
    args: {
      search: (action, searchWord, callbackSetList) => {
        clearTimeout(letpub_timeout); // 等待0.5秒无后续输入后，再进行查询。
        letpub_timeout = setTimeout(do_search, 500, searchWord, callbackSetList);
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
        text = dbc2sbc(text); // 全半角转换
        let en_letter_match = text.match(/[a-zA-z]/g);
        let en_letter_cnt = en_letter_match ? letter_match.length : 0;
        // console.log(letter_count);
        let isEnglish = en_letter_cnt > (text.length / 2); // is English or not?
        if (isEnglish) { // English mode
          res = text.replaceAll(/\r?\n/, ' ').replaceAll('- ', '');
        } else { // Chinese mode
          res = text.replaceAll(/\r?\n/, '');
        }
        window.utools.copyText(res);
        window.utools.outPlugin()
      }
    }
  }
}
