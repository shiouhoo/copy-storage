# copyTabStorage
将localstroage复制到目标窗口，并且可配置(默认复制所有)

- 目标地址：域名+（端口），域名相同时可用端口区分不同窗口，否则会复制到所有域名下的tab页
- localStorage开关，是否复制localStorage。展开可对localStorage进行更改后复制，比如：

```js
return {
	...obj,
    token: obj['token'].split(',')[0]
};

```
obj为当前页面的localStorage键值构成的对象，返回的结果也将以键值对的形式复制到目标窗口的localStorage中

- cookie开关，是否复制cookie
