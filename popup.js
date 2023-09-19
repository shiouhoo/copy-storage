const btn = $('#btn')
chrome.storage.sync.get('target', ({ target }) => {
    if (target) {
        $('#address').val(target)
    }
})
$('#address').on('change', () => {
    chrome.storage.sync.set({ target: $('#address').val() });
})
const init = async () => {
    // 获取当前打开的标签页面
    // 因为需要先准确地获取当前的页面才能注入js，所以这里需要使用同步函数，await
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // 向目标页面里注入js方法
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getWindowInfo
    });
    chrome.storage.sync.get('iframeSrcArray', ({ iframeSrcArray }) => {
        for (let iframe of iframeSrcArray) {
            const src = iframe.src
            const htmlStr = `<button type="button" class="list-group-item list-group-item-action">${src}</button>`
            const dom = $(htmlStr).on('click', function () {
                let target = $('#address').val()
                function changeBackgroundColor() {
                    document.body.style.backgroundColor = getUserColor();
                }
                chrome.tabs.create(
                    {
                        url: this.innerText.replace('jzzsweb', 'jzzs_web_yingkou').replace('rwsc-web-chengdu', 'rwscweb').replace(/http:\/\/[0-9]{0,4}\.[0-9]{0,4}\.[0-9]{0,4}\.[0-9]{0,4}[:\d]{0,5}/, 'http://' + target),
                        active: false,
                    },
                    function (tab) {
                        // 向目标页面里注入js方法
                        chrome.storage.sync.set({
                            setLocalStorageId: tab.id
                        });
                    }
                )
            }).on('mouseenter', function () {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: setIfromeHover,
                    args: [iframe.id, true]
                });
            }).on('mouseleave', function () {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: setIfromeHover,
                    args: [iframe.id, false]
                });
            });
            $('.iframe-list').append(dom);
        }
    })
};
init()


function setIfromeHover(id, isHover) {

    function getAllIframeSrc(iframes, docu) {
        iframes.forEach(function (iframe) {
            if (!iframe.id) return;
            if (id === iframe.id) {
                if (isHover) {
                    const dom = docu.createElement('div')
                    dom.setAttribute('id', 'mask')
                    dom.style = 'width:100%;height:100%;background-color:rgba(85,125,171,0.6);position: fixed;z-index:999999;top:0;left:0'
                    docu.querySelector(`#${id}`).contentDocument.querySelector('body').append(dom)
                } else {
                    docu.querySelector(`#${id}`).contentDocument.querySelector('body>#mask').remove()
                }
                return;
            }

            // 获取嵌套iframe
            var nestedIframes = iframe.contentDocument.querySelectorAll('iframe');

            // 递归调用获取嵌套iframe的src
            if (nestedIframes.length > 0) {
                getAllIframeSrc(nestedIframes, iframe.contentDocument);
            }
        });
    }

    // 获取页面上所有的iframe元素
    var topLevelIframes = document.querySelectorAll('iframe');
    getAllIframeSrc(topLevelIframes, document);
}

// 注入的方法
function getWindowInfo() {

    function getLocalStorage() {
        chrome.storage.sync.set({ AI_token: localStorage.getItem('AI_token') || '' })
        chrome.storage.sync.set({ Author_token: localStorage.getItem('Author_token') || '' })
    }

    function getTargetPageIframe() {
        // 获取所有的iframe元素
        var iframes = document.querySelectorAll('iframe');
        // 遍历所有的iframe并打印出它们的src
        var iframeSrcArray = []; // 创建一个空数组来保存src属性值
        function getAllIframeSrc(iframes) {
            iframes.forEach(function (iframe) {
                var src = iframe.contentDocument.location.href;

                src && !src.includes('404') && !src.includes('about:blank') && iframeSrcArray.push({
                    id: iframe.id,
                    src: src
                }); // 将src添加到数组中

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
    getLocalStorage()
    getTargetPageIframe()
}