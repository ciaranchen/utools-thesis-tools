# utools-thesis-tools

**学术工具集** 一些解决在查看论文中可能产生的诡异需求的 [uTools](u.tools) 工具。

感谢 [@Dorence](https://github.com/Dorence/) 对此项目的代码进行了重构。

## Features 功能

【Letpub】

在Letpub网站查询期刊的中科院分区情况。使用方法：
- 输入关键字 `letpub` 或 `lp`。

【CCF查询】

查询期刊/会议在CCF 2022年发布的目录中的分区情况。使用方法：
- 输入关键字 `ccf` 查询期刊/会议在《中国计算机学会推荐国际学术会议和期刊目录（2022年）》的等级。
- 输入关键字 `ccfc` 或 `ccfz` 查询期刊在《计算领域高质量科技期刊分级目录（2022年）》的等级。

【PDF换行替换】

从pdf中复制时，常常句子被换行分开了。这个功能可以替换全半角、换行；在英文的情况下，替换连字符。使用方法：
- 从pdf正常复制，呼出uTools菜单。
- 选择"替换pdf换行"。
- 正常粘贴。

【解析引用格式】

基于正则表达式拆解论文的引用格式。可能不准确，但是在大多数情况下（从谷歌学术中拷贝的引用）都能用。使用方法：
- 复制论文的引用，呼出uTools菜单。
- 如有识别：“APA引用”、“MLA引用”、“GB/T 7714引用”；
- 如无识别：“未知引用”。
- 选择内容以复制。

【Zotero查询】

查询Zotero数据库中的文献资料，匹配标题。使用方法：
- 在uTools中使用关键字 `zotero` 或 `zs`。

## Issues 建议

您的建议非常宝贵。如果您有任何新功能或者改进的建议，可以在uTools的评论区留言，我会尽力回复。

Open source at [github.com/ciaranchen](https://github.com/ciaranchen/utools-thesis-tools) & [github.com/dorence](https://github.com/Dorence/utools-thesis-tools).

## More 说明

【CCF查询】

参考： https://www.ccf.org.cn/Academic_Evaluation/By_category/

修改了以下条目：
- HotSec: USENIX Workshop on Hot Topics in Security @ https://dblp.org/db/conf/uss
- dblp 网址链接统一采用 dblp.org
- 会议 ECML-PKDD 链接仅使用 https://dblp.org/db/conf/ecml
- 出版社 Association for Computational Linguistics 缩写为 ACL

增加了部分期刊会议的缩写：
- PARCO: Parallel Computing
- PEVA: Performance Evaluation
- CPE: Concurrency and Computation: Practice and Experience
- AdHoc: Ad Hoc Networks
- JOC: Journal of Cryptology
- CompSec: Computers & Security
- INS: Information Sciences
- CADE/IJCAR: International Conference on Automated Deduction/International Joint Conference on Automated Reasoning
- CoLi: Computational Linguistics
- EC: Evolutionary Computation
- JAR: Journal of Automated Reasoning

移除了部分会议期刊的缩写：
- Algorithmica
- Cognition

【解析引用格式】

测试用例可以参见本项目下的 [regexp_test.js](src/regexp_test.js) 文件。

## Development 开发

```bash
# 下载源代码
git clone https://github.com/ciaranchen/utools-thesis-tools.git
cd utools-thesis-tools
# 安装依赖，环境 NodeJS > 16.x
npm i
# 打包代码
npm run build      # 开发版代码
npm run build:prod # 发布版代码
npm run build:drop # 去掉 console 的开发版
# 调试，监听 5000 端口
./tests/server.js
```

## Todo 待办

- [ ] 知网查是否为中科院核心
- [ ] Engineering Village查是否为EI
- [ ] 统一的期刊、会议查询口
- [ ] 常见引用格式转换
- [ ] pdf处理uTools插件中来自应用的情况。
- [ ] Zotero-Search 搜索线上可同步的内容
- [ ] 从引用文献直接向 Zotero 添加内容
