const btn = $('#btn')
const init = async () => {
    // 获取当前打开的标签页面
    // 因为需要先准确地获取当前的页面才能注入js，所以这里需要使用同步函数，await
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // 向目标页面里注入js方法
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getTargetPageIframe
    });
    chrome.storage.sync.get('iframeSrcArray', ({ iframeSrcArray }) => {
        for (let src of iframeSrcArray) {
            const htmlStr = `<button type="button" class="list-group-item list-group-item-action">${src}</button>`
            const dom = $(htmlStr).on('click', function () {
                let target = $('#address').val()
                function changeBackgroundColor() {
                    document.body.style.backgroundColor = getUserColor();
                }
                chrome.tabs.create(
                    {
                        url: this.innerText.replace(/http:\/\/[0-9]{0,4}\.[0-9]{0,4}\.[0-9]{0,4}\.[0-9]{0,4}[:\d]{0,5}/, 'http://' + target),
                        active: false,
                    },
                    async function (tab) {
                        // 向目标页面里注入js方法
                        alert(tab.id)
                        chrome.storage.sync.set({
                            setLocalStorageId: tab.id
                        });
                    }
                )
            })
            $('.iframe-list').append(dom);
        }
    })
};
init()
// 注入的方法
function getWindowInfo() {
    getTargetPageIframe()
    getLocalStorage()
}

function getLocalStorage() {
    chrome.storage.sync.set({ ai_token: JSON.stringify(localStorage.getItem('ai_token')) })
    chrome.storage.sync.set({ author_token: JSON.stringify(localStorage.getItem('author_token')) })
}

function getTargetPageIframe() {
    // 获取所有的iframe元素
    var iframes = document.querySelectorAll('iframe');
    // 遍历所有的iframe并打印出它们的src
    var iframeSrcArray = []; // 创建一个空数组来保存src属性值
    function getAllIframeSrc(iframes) {
        iframes.forEach(function (iframe) {
            var src = iframe.contentDocument.location.href;

            src && !src.includes('404') && !src.includes('about:blank') && iframeSrcArray.push(src); // 将src添加到数组中

            // 获取嵌套iframe
            var nestedIframes = iframe.contentDocument.querySelectorAll('iframe');

            // 递归调用获取嵌套iframe的src
            if (nestedIframes.length > 0) {
                getAllIframeSrc(nestedIframes);
            }
        });
    }

    // 获取页面上所有的iframe元素
    var topLevelIframes = document.querySelectorAll('iframe');

    // 调用函数开始获取src
    getAllIframeSrc(topLevelIframes);

    chrome.storage.sync.set({ iframeSrcArray });
};