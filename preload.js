const axios = require('axios');
const cheerio = require('cheerio');


// code for letpub
let letpub_timeout;
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

// code for pdf_replace
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


// code for cite_parse
// 暂时不考虑使用机器学习方法。
String.prototype.trim = function () {
  return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

// Harvard style
function harvard_style(sentence) {
  const harvard_match = /^(.*),\s*(\d{4})\.(.*?)\.(.*)$/i
  const found = sentence.match(harvard_match);
  // console.log(found);
  return found ? {
    author: found[1],
    year: found[2],
    title: found[3],
    info: found[4]
  } : null;
}

// GB/T 7714
function gbt_style(sentence) {
  const gbt_match = /^(.*?)\.\s*(.*?)\[(.{1,2})\]\s*?[\.\/]\/?\s*((.*?),\s*(\d{4}).*)$/i
  const found = sentence.match(gbt_match);
  // console.log(found);
  let res = found ? {
    cite: "GBT 7714",
    author: found[1],
    year: found[6],
    title: found[2],
    info: found[4],
    type: found[3],
  } : null;
  if (res && res.type === 'J') {
    res.publisher = found[5];
    if (res.publisher.match(/^arxiv/ig)) {
      res.publisher = 'ArXiv';
    }
  }
  return res;
}

// MLA
function mla_style(sentence) {
  const mla_match = /^(.*?)\.\s*[“"](.*?)["”]\s*(.*?(([\,\.]\s*\d{4})|(\(\d{4}\))).*?)$/i
  const found = sentence.match(mla_match);
  // console.log(found);
  if (!found) return null;
  let years = found[4].replace(/,\s+/, '').replace(/[\(\)]/g, '');
  let res = {
    cite: "MLA",
    author: found[1],
    year: years,
    title: found[2],
    info: found[3],
  }
  if (!found[3].includes('onference')) {
    res.publisher = found[3].replace(/[\(\d\):-]/g, '')
    if (res.publisher.match(/^arxiv/ig)) {
      res.publisher = 'ArXiv';
    }
  }
  return res;
}

// APA
function apa_style(sentence) {
  const apa_match = /^(.*)\.\s*\((\d{4})(,\s*\w+)?\)\.\s*(.*?)\.\s*(.*)$/i
  const found = sentence.match(apa_match);
  // console.log(found);
  if (!found) return null;
  let res = {
    cite: "APA",
    author: found[1],
    year: found[2],
    title: found[4],
    info: found[5],
  };
  if (!res.info.includes('onference')) {
    res.publisher = res.info.split(',')[0];
    if (res.publisher.match(/^arxiv/ig)) {
      res.publisher = 'ArXiv';
    }
  }
  return res;
}

function generate_info(res, cite_style) {
  return [{
    title: '标题',
    description: res.title,
    cite: cite_style
  }, {
    title: '作者',
    description: res.author,
    cite: cite_style
  }, {
    title: '年份',
    description: res.year,
    cite: cite_style
  }, {
    title: '其他信息',
    description: res.info,
    cite: cite_style
  }]
}

function select_cite_information(itemData) {
  window.utools.hideMainWindow();
  window.utools.copyText(itemData.description);
  window.utools.outPlugin();
}

// cite_parse windows_export_function
let style_functions = [harvard_style, gbt_style, mla_style, apa_style];
let cite_map = {
  harvard_cite: harvard_style,
  gbt_cite: gbt_style,
  mla_cite: mla_style,
  apa_cite: apa_style
};
let cite_parse_export = {
  mode: 'list',
  args: {
    enter: function (action, callbackSetList) {
      let code = action.code;
      let text = action.payload;
      console.log(text);
      console.log(code);
      let res = cite_map[code](text);
      console.log(res);
      callbackSetList(generate_info(res, code));
    },
    select: function (action, itemData) {
      select_cite_information(itemData);
    }
  }
}

// window export.
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
        window.utools.shellOpenExternal(itemData.url);
        window.utools.outPlugin();
      }
    }
  },
  'pdf_replace': {
    mode: 'none',
    args: {
      enter: (action) => {
        window.utools.hideMainWindow();
        let res = '';
        let text = action.payload;
        text = dbc2sbc(text); // 全半角转换
        let en_letter_match = text.match(/[a-zA-z]/g);
        let en_letter_cnt = en_letter_match ? en_letter_match.length : 0;
        // console.log(letter_count);
        let isEnglish = en_letter_cnt > (text.length / 2); // is English or not?
        if (isEnglish) { // English mode
          res = text.replaceAll(/\r?\n/g, ' ').replaceAll('- ', '');
        } else { // Chinese mode
          res = text.replaceAll(/\r?\n/g, '');
        }
        window.utools.copyText(res);
        window.utools.outPlugin()
      }
    }
  },
  "unknown_cite": {
    mode: 'list',
    args: {
      enter: function (action, callbackSetList) {
        let text = action.payload;
        text = text.replaceAll('．', '.').replaceAll('。', '.').replaceAll('，', ', ');
        text = text.replaceAll('［', '[').replaceAll('］', ']');
        text = text.replace(/^[\(\[]\d+[\(\]]/, '');
        console.log(text);
        let infos = style_functions.map((element, i) => {
          let res = element(text);
          return res ? {
            title: element.name.slice(0, element.name.length - 6).toUpperCase() + " 引用格式",
            description: res.title,
            res: res,
            cite: "unknown"
          } : null;
        });
        infos = infos.filter((element) => element !== null);
        console.log(infos);
        callbackSetList(infos);
      },
      select: (action, itemData, callbackSetList) => {
        console.log(itemData);
        if (itemData.cite === "unknown") {
          callbackSetList(generate_info(itemData.res, itemData.title));
        } else {
          // do same as cite_parse_export
          select_cite_information(itemData)
        }
      }
    }
  },
  "gbt_cite": cite_parse_export,
  "apa_cite": cite_parse_export,
  "mla_cite": cite_parse_export,
}
