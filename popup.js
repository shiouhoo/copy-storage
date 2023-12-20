const btn = $('#btn')
const target = $('#address')

async function getStorage(storageName) {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise(async (resolve) => {
        if ($(`#${storageName}Check:checked`).val() === 'on') {
            const iframe = document.getElementById('sandbox');
            const textareaname = `textareaFormat${storageName.charAt(0).toUpperCase() + storageName.slice(1)}`
            const { [textareaname]: textareaFormat } = await chrome.storage.local.get(textareaname)
            const { ['_' + storageName]: storage } = await chrome.storage.local.get(`_${storageName}`)
            iframe.contentWindow.postMessage([textareaFormat?.[currentTab.url.split('/')[2]] || 'return obj;', storage, storageName], '*');
            async function listener(event) {
                if (event.data[1] !== storageName) return;
                if (event.data[0] instanceof Error) {
                    await chrome.storage.local.set({ ['_' + storageName]: event.data[0] });
                    window.removeEventListener('message', listener);
                }
                resolve(event);
            }
            window.addEventListener('message', listener);
        } else {
            resolve(null);
        }
    })
}

async function init() {
    chrome.storage.local.set({ _localStorage: null })
    chrome.storage.local.set({ _sessionStorage: null })
    chrome.storage.local.set({ _Cookies: null })
    // 因为需要先准确地获取当前的页面才能注入js，所以这里需要使用同步函数，await
    let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!currentTab.url.startsWith('http')) {
        $('.main').html('空标签页无法操作')
        return;
    }
    await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: getWindowInfo,
        args: []
    });
    // localStorageCheck展开项
    const { _localStorage } = await chrome.storage.local.get('_localStorage')
    let header = ''
    for (let i in _localStorage) {
        header += `<li> ${i} </li>`
    }
    $('#collapseLocalStorage .textarea-format-localstorage').before(`<ul class="collapse-header">${header}</ul>`)

    // sessionStorageCheck展开项
    const { _sessionStorage } = await chrome.storage.local.get('_sessionStorage')
    header = ''
    for (let i in _sessionStorage) {
        header += `<li> ${i} </li>`
    }
    $('#collapseSessionStorage .textarea-format-sessionstorage').before(`<ul class="collapse-header">${header}</ul>`)

    // 复制按钮
    $('#copy').on('click', async () => {
        // 展示toast
        function setToast(id) {
            $(id).show()
            setTimeout(() => {
                $(id).hide()
            }, 2000)
        }
        async function setInfo(tab) {
            // 注入
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: setWindowInfo,
                args: [$('#cookieCheck:checked').val() || false, $('#localStorageCheck:checked').val() || false, $('#sessionStorageCheck:checked').val() || false]
            });
            setToast('#toast-success')
        }
        let tabs = await chrome.tabs.query({});
        let notab = true;
        for (const tab of tabs) {
            // 解析目标窗口
            const targetList = ['http://' + target.val(), 'https://' + target.val()];
            if (target.val().includes('localhost')) {
                targetList.push('http://' + target.val().replace('localhost', '127.0.0.1'));
                targetList.push('https://' + target.val().replace('localhost', '127.0.0.1'));
            };
            if (targetList.find((item) => tab.url.includes(item))) {
                notab = false;
                // 获取处理后的localStorage
                if ($('#localStorageCheck:checked').val() === 'on' || $('#sessionStorageCheck:checked').val() === 'on') {
                    const res = await Promise.all([getStorage('localStorage'), getStorage('sessionStorage')]);
                    if (res[0] && res[0].data[0] instanceof Error) {
                        setToast('#toast-funcError-local')
                    }
                    if (res[1] && res[1].data[0] instanceof Error) {
                        setToast('#toast-funcError-session')
                    }
                    setInfo(tab);
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

async function setWindowInfo(setCookie, setLocalStorage, setSessionStorage) {
    if (setLocalStorage === 'on') {
        const { _localStorage } = await chrome.storage.local.get('_localStorage')
        for (const key in _localStorage) {
            localStorage.setItem(key, _localStorage[key])
        }
    }
    if (setSessionStorage === 'on') {
        const { _sessionStorage } = await chrome.storage.local.get('_sessionStorage')
        for (const key in _sessionStorage) {
            sessionStorage.setItem(key, _sessionStorage[key])
        }
    }
    if (setCookie === 'on') {
        const { _Cookies } = await chrome.storage.local.get('_Cookies')
        document.cookie = _Cookies
    }
}

// 注入的方法
async function getWindowInfo() {

    function getLocalStorage() {
        const obj = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            obj[key] = localStorage.getItem(key);
        }
        chrome.storage.local.set({ _localStorage: obj })
    }

    function getSessionStorage() {
        const obj = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (!key) continue;
            obj[key] = sessionStorage.getItem(key);
        }
        chrome.storage.local.set({ _sessionStorage: obj })
    }

    function getCookies() {
        chrome.storage.local.set({ _Cookies: document.cookie })
    }

    getLocalStorage();
    getCookies();
    getSessionStorage();
}