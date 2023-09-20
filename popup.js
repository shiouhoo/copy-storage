const btn = $('#btn')
const pageZS = $('#pageZS')
const target = $('#address')

async function init() {
    // chrome.storage.local.set({ _localStorage: null })
    // chrome.storage.local.set({ _Cookies: null })
    // chrome.storage.local.set({ iframeSrcArray: null })
    // 因为需要先准确地获取当前的页面才能注入js，所以这里需要使用同步函数，await
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url === 'edge://newtab/') {
        $('.main').html('空标签页无法操作')
        return;
    }
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getWindowInfo,
        args: [true]
    });
    if (tab.url.includes('http://192.168.211.166/') || tab.url.includes('http://192.168.210.166/')) {
        chrome.storage.local.get('iframeSrcArray', ({ iframeSrcArray }) => {
            if (!iframeSrcArray.length) return;
            pageZS.show()
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
                            url: this.innerText.replace('jzzsweb', 'jzzs_web_yingkou').replace('rwsc-web-chengdu', 'rwscweb').replace(/http:\/\/[0-9]{0,4}\.[0-9]{0,4}\.[0-9]{0,4}\.[0-9]{0,4}[:\d]{0,5}/, target),
                            active: false,
                        },
                        async function (tab) {
                            // 注入
                            chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                function: setWindowInfo,
                                args: [$('#cookieCheck:checked').val() || false, $('#localStorageCheck:checked').val() || false]
                            });
                            chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                function: () => location.reload(),
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
    } else {
        pageZS.hide();
    }
    // localStorageCheck展开项
    const { _localStorage } = await chrome.storage.local.get('_localStorage')
    let header = ''
    for (let i in _localStorage) {
        header += `<li> ${i} </li>`
    }
    $('#collapseLocalStorage .textarea-format-localstorage').before(`<ul class="collapse-header">${header}</ul>`)

    const { textareaFormatLocalstorage } = await chrome.storage.local.get('textareaFormatLocalstorage')
    const func = new Function(_localStorage, textareaFormatLocalstorage)
    console.log(func(_localStorage));

    // 复制按钮
    let timer = [];
    $('#copy').on('click', async () => {
        let tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url.includes(target.val())) {
                // 注入
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: setWindowInfo,
                    args: [$('#cookieCheck:checked').val() || false, $('#localStorageCheck:checked').val() || false]
                });
                if (timer[0]) clearTimeout(timer[0])
                $('#toast-success').show()
                timer[0] = setTimeout(() => {
                    $('#toast-success').hide()
                }, 3000)
                return;
            }
        }
        if (timer[1]) clearTimeout(timer[1])
        $('#toast-notarget').show()
        timer[1] = setTimeout(() => {
            $('#toast-notarget').hide()
        }, 3000)
    });
}
init();

async function setWindowInfo(setCookie, setLocalStorage) {
    if (setLocalStorage === 'on') {
        const { _localStorage } = await chrome.storage.local.get('_localStorage')
        for (const key in _localStorage) {
            localStorage.setItem(key, _localStorage[key])
        }
    }
    if (setCookie === 'on') {
        const { _Cookies } = await chrome.storage.local.get('_Cookies')
        document.cookie = _Cookies
    }
}

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
async function getWindowInfo(isZs = false) {

    function getLocalStorage() {
        const obj = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            obj[key] = localStorage.getItem(key);
        }
        chrome.storage.local.set({ _localStorage: obj })
    }

    function getCookies() {
        chrome.storage.local.set({ _Cookies: document.cookie })
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

        chrome.storage.local.set({ iframeSrcArray });
    };
    getLocalStorage()
    getCookies()
    isZs && getTargetPageIframe()
}