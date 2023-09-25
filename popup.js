const btn = $('#btn')
const target = $('#address')

async function init() {
    chrome.storage.local.set({ _localStorage: null })
    chrome.storage.local.set({ _Cookies: null })
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
    // localStorageCheck展开项
    const { _localStorage } = await chrome.storage.local.get('_localStorage')
    let header = ''
    for (let i in _localStorage) {
        header += `<li> ${i} </li>`
    }
    $('#collapseLocalStorage .textarea-format-localstorage').before(`<ul class="collapse-header">${header}</ul>`)

    // 复制按钮
    let timer = {};
    $('#copy').on('click', async () => {
        function setToast(id) {
            for (const i in timer) {
                clearTimeout(timer[i])
                $(i).hide()
            }
            $(id).show()
            timer[id] = setTimeout(() => {
                $(id).hide()
            }, 2000)
        }
        async function setInfo(tab) {
            // 注入
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: setWindowInfo,
                args: [$('#cookieCheck:checked').val() || false, $('#localStorageCheck:checked').val() || false]
            });
            setToast('#toast-success')
        }
        let tabs = await chrome.tabs.query({});
        let notab = true;
        for (const tab of tabs) {
            if (tab.url.includes(target.val())) {
                notab = false;
                // 获取处理后的localStorage
                if ($('#localStorageCheck:checked').val() === 'on') {
                    const iframe = document.getElementById('sandbox');
                    const { textareaFormatLocalstorage } = await chrome.storage.local.get('textareaFormatLocalstorage')
                    iframe.contentWindow.postMessage([textareaFormatLocalstorage, _localStorage], '*');
                    window.addEventListener('message', async function (event) {
                        if (event.data instanceof Error) {
                            setToast('#toast-funcError')
                            return;
                        }
                        await chrome.storage.local.set({ _localStorage: event.data });
                        setInfo(tab);
                    });
                } else {
                    setInfo(tab);
                }
            }
        }
        if (!notab) return;
        setToast('#toast-notarget')
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

    getLocalStorage()
    getCookies()
}