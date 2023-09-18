
// 首次安装插件、插件更新、chrome浏览器更新时触发
chrome.runtime.onInstalled.addListener(() => {
});

chrome.tabs.onCreated.addListener(function (tab) {
    chrome.storage.sync.get('setLocalStorageId', async ({ setLocalStorageId }) => {
        // if (tabId === tab.id) {
        await chrome.scripting.executeScript({
            target: { tabId: setLocalStorageId },
            function: () => {
                alert(12)
            }
        });
        // }
    })
});