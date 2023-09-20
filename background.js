
// 首次安装插件、插件更新、chrome浏览器更新时触发
chrome.runtime.onInstalled.addListener(() => {
});

chrome.tabs.onCreated.addListener(function (tab) {
    chrome.storage.local.get('setLocalStorageId', alocal({ setLocalStorageId }) => {
        if(setLocalStorageId === tab.id) {
        chrome.scripting.executeScript({
            target: { tabId: setLocalStorageId },
            func: alocal() => {
            const { AI_token } = await chrome.storage.local.get('AI_token')
                    const { Author_token } = await chrome.storage.local.get('Author_token')
                    localStorage.setItem('AI_token', AI_token)
                    localStorage.setItem('Author_token', Author_token)
                    location.reload()
        }
            });
        }
    })
});