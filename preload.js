const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');


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
    url: "https://www.letpub.com.cn/index.php?page=journalapp&view=search&searchname=" + encodeURI(searchWord.trim()).replace(/%20/g, '+'),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  }).then(response => {
    const data = response.data;
    callbackSetList(parse_letpub_results(data));
  });
}

// code for ccf
let csv_path = path.join(__dirname, 'CCF-2019.CSV')

function class_map(class_number) {
  return {
    1: "计算机体系结构/并行与分布计算/存储系统",
    6: "计算机科学理论",
    2: "计算机网络",
    7: "计算机图形学与多媒体",
    3: "网络与信息安全",
    8: "人工智能",
    4: "软件工程/系统软件/程序设计语言",
    9: "人机交互与普适计算",
    5: "数据库/数据挖掘/内容检索",
    10: "交叉/综合/新兴"
  } [class_number]
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
  // 原本GBT中的[]中可能有两位字母作为标识的，但是可能会与Arxiv的[Cs]冲突。
  const gbt_match = /^(.*?)\.\s*(.*?)\[(.)\]\s*?[\.\/]\/?\s*((.*?)[,.]\s*.*\s*(\d{4}).*)$/i
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
  if (res && res.type === 'C') {
    let conf_text = found[5];
    // 去除括号中的内容
    conf_text = conf_text.replace(/\(.*\)/g, '').replace(/\{.*\}/g, '').replace(/\[.*\]/g, '');
    // 去除一些经常出现，但是可能导致错误的名词
    conf_text = conf_text.replace(/\d{4}/g, '').replace('IEEE', '').replace('ACM', '').replace('Workshops', '');
    // console.log(conf_text);
    res.conference = conf_text.trim();
  }
  return res;
}

// MLA
function mla_style(sentence) {
  sentence = sentence.replace(/Vol\.\s*\d{4}\./g, '')
  const mla_match = /^(.*?)\.\s*[“"](.*?)["”]\s*((.*?)(([,\.]\s+\d{4})|(\(\d{4}\))).*?)$/i
  const found = sentence.match(mla_match);
  // console.log(found);
  if (!found) return null;
  let years = found[5].replace(/[^\d]/g, '');
  let res = {
    cite: "MLA",
    author: found[1],
    year: years,
    title: found[2],
    info: found[3],
  }
  if (found[4].match(/^arxiv/ig)) {
    res.publisher = 'ArXiv';
    return res;
  }
  // Journal or Conference
  let text = found[4];
  // 去除括号中的内容
  text = text.replace(/\(.*\)/g, '').replace(/\{.*\}/g, '').replace(/\[.*\]/g, '');
  // 取前半截
  text = text.split(/[,\.]/g)[0];
  // 过滤标点符号
  text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\'\,\<\.\>\/\?]/g, "");
  // 过滤数字
  text = text.replace(/(In\s)?\d{4}/ig, '').replace(/\d/g, '');
  // 去除一些经常出现，但是可能导致错误的名词
  text = text.replace(/\d{4}/g, '').replace('IEEE', '').replace('ACM', '').replace('Workshops', '');
  if (text.includes('onference')) {
    res.conference = text.trim();
    return res;
  }
  res.unknown = text.trim();
  return res;
}

// APA
function apa_style(sentence) {
  sentence = sentence.replace(/Vol\.\s*\d{4}\./g, '')
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
  if (found[5].match(/^arxiv/ig)) {
    res.publisher = 'ArXiv';
    return res;
  }
  // Journal or Conference
  let text = found[5];
  // 去除括号中的内容
  text = text.replace(/\(.*\)/g, '').replace(/\{.*\}/g, '').replace(/\[.*\]/g, '');
  // 取前半截
  text = text.split(/[,\.]/g)[0];
  // 过滤标点符号
  text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\'\,\<\.\>\/\?]/g, "");
  // 过滤数字
  text = text.replace(/(In\s)?\d{4}/ig, '').replace(/\d/g, '');
  // 去除一些经常出现，但是可能导致错误的名词
  text = text.replace(/\d{4}/g, '').replace('IEEE', '').replace('ACM', '').replace('Workshops', '');
  if (text.includes('onference')) {
    res.conference = text.trim();
    return res;
  }
  res.unknown = text.trim();
  return res;
}

function generate_info(res, cite_style, cb) {
  console.log(res);
  let info = [{
    title: res.title,
    description: "跳转谷歌学术搜索...",
    url: "https://scholar.google.com/scholar?q=" + encodeURI(res.title.trim()).replace(/%20/g, '+'),
    cite: cite_style
  }, {
    title: '选择此项复制标题',
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
  }];
  if (res.type) {
    let cite_content_type = res.type === "J" ? "期刊" : res.type === "C" ? "会议" : "其它";
    info.push({
      title: '类型',
      description: cite_content_type,
      cite: cite_style
    });
  }
  if (res.publisher) {
    if (res.publisher === 'ArXiv') {
      info.push({
        title: "出版商: " + res.publisher,
        description: res.publisher,
        cite: cite_style
      });
    } else {
      info.push({
        title: "期刊: " + res.publisher,
        description: "跳转Letpub编辑和搜索...",
        cite: cite_style,
        url: "https://www.letpub.com.cn/index.php?page=journalapp&view=search&searchname=" + encodeURI(res.publisher.trim()).replace(/%20/g, '+')
      })
      let text = res.publisher;
      let regexp = new RegExp(text.trim().replace(/\s+/ig, '\\s'), 'i');
      let ccf_content = []
      fs.createReadStream(csv_path)
        .pipe(csv())
        .on('data', (row) => {
          ccf_content.push(row);
        })
        .on('end', () => {
          // console.log(regexp);
          let data = ccf_content.filter(row => row['刊物全称'].match(regexp) || row['刊物名称'].match(regexp))
          let res = data.map(row => ({
              title: row['刊物名称'] + "(" + row['刊物全称'] + ")",
              description: class_map(row['类别']) + "  " + "CCF-" + row['等级'] + "  " + (row['期刊/会议'] === "Meeting" ? "会议" : "期刊"),
              url: row['地址']
          }));
          if (res.length > 0) {
            res = res[0];
            res.title += " (CCF GUESS)";
            info.push(res);
          }
          console.log(info);
          axios({
            url: "https://www.letpub.com.cn/index.php?page=journalapp&view=search&searchname=" + encodeURI(text.trim()).replace(/%20/g, '+'),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
          }).then(response => {
            const data = response.data;
            // console.log(data);
            let res = parse_letpub_results(data);
            console.log(res);
            if (res.length > 1) {
              res = res[0];
              res.title += " (LETPUB GUESS)";
              info.push(res);
            }
            console.log(info);
            cb(info);
          });
        });
    }
  } else if (res.conference) {
    info.push({
      title: "会议: " + res.conference,
      cite: cite_style
    })
    // check CCF
    let text = res.conference;
    let regexp = new RegExp(text.trim().replace(/\s+/ig, '\\s'), 'i');
    let ccf_content = [];
    fs.createReadStream(csv_path)
        .pipe(csv())
        .on('data', (row) => {
          ccf_content.push(row);
        })
        .on('end', () => {
          // console.log(regexp);
          let data = ccf_content.filter(row => row['刊物全称'].match(regexp) || row['刊物名称'].match(regexp))
          let res = data.map(row => ({
              title: row['刊物名称'] + "(" + row['刊物全称'] + ")",
              description: class_map(row['类别']) + "  " + "CCF-" + row['等级'] + "  " + (row['期刊/会议'] === "Meeting" ? "会议" : "期刊"),
              url: row['地址']
          }));
          if (res.length > 0) {
            res = res[0];
            res.title += " (CCF GUESS)";
            info.push(res);
          }
          cb(info);
        });
  } else {
    info.push({
      title: '未知类型: ' + res.unknown,
      description: "抱歉无法识别此文献为期刊或会议。如果您认为这是一个BUG，请在插件评论区反馈。"
    })
    return cb(info);
  }
}

function select_cite_information(itemData) {
  window.utools.hideMainWindow();
  if (itemData.url) { // if itemData 中存在url,那么跳转到URL。
    window.utools.shellOpenExternal(itemData.url);
  } else {
    window.utools.copyText(itemData.description);
  }
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
      // console.log(text);
      // console.log(code);
      let res = cite_map[code](text);
      // console.log(res);
      generate_info(res, code, callbackSetList);
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
  "ccf": {
    mode: 'list',
    args: {
      enter: function (action, callbackSetList) {
        let ccf_content = []
        fs.createReadStream(csv_path)
          .pipe(csv())
          .on('data', (row) => {
            ccf_content.push(row);
          })
          .on('end', () => {
            let res = ccf_content.map(row => {
              return {
                title: row['刊物名称'] + "(" + row['刊物全称'] + ")",
                description: class_map(row['类别']) + "  " + "CCF-" + row['等级'] + "  " + (row['期刊/会议'] === "Meeting" ? "会议" : "期刊"),
                url: row['地址']
              }
            });
            callbackSetList(res);
          });
      },
      search: (action, searchWord, callbackSetList) => {
        let text = searchWord;
        // 是否需要真的构建一个正则表达式呢？
        let regexp = new RegExp(text.trim().replace(/\s+/ig, '\\s'), 'i');
        let ccf_content = []
        fs.createReadStream(csv_path)
          .pipe(csv())
          .on('data', (row) => {
            ccf_content.push(row);
          })
          .on('end', () => {
            // console.log(regexp);
            let data = ccf_content.filter(row => row['刊物全称'].match(regexp) || row['刊物名称'].match(regexp))
            let res = data.map(row => {
              return {
                title: row['刊物名称'] + "(" + row['刊物全称'] + ")",
                description: class_map(row['类别']) + "  " + "CCF-" + row['等级'] + "  " + (row['期刊/会议'] === "Meeting" ? "会议" : "期刊"),
                url: row['地址']
              }
            });
            callbackSetList(res);
          });
      },
      select: (action, itemData) => {
        window.utools.hideMainWindow()
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
        if (infos.length === 0) {
          infos = [{
            title: "未检出引用, 可能的原因如下："
          }, {
            title: "未支持的引用类型",
            description: "可能您查询的引用类型不是MLA、APA、GB/T 7714类型的。后期将尝试添加更多支持的引用类型。"
          }, {
            title: "出现了BUG（更可能的情况）",
            description: "出现问题也是难免的啦，首先为带来的不便向您卖个萌。如果您希望帮助我修复此问题，可以在插件评论区提出反馈。"
          }]
        }
        callbackSetList(infos);
      },
      select: (action, itemData, callbackSetList) => {
        console.log(itemData);
        if (itemData.cite === "unknown") {
          generate_info(itemData.title, itemData.description, callbackSetList);
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
