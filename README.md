# copyTabStorage
将localstroage复制到目标窗口，并且可配置

- 目标地址：域名+（端口），域名相同时可用端口区分不同窗口，否则会复制到所有域名下的tab页
- localStorage开关，是否复制localStorage。展开可对localStorage进行更改后复制 (obj为localStorage键值对象)，比如：

```js
return {
	...obj,
    token: obj['token'].split(',')[0]
};
```

- cookie开关，是否复制cookie
