const btn = $('#btn')
const target = $('#address')

async function getStorage(storageName) {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise(async (resolve) => {
        if ($(`#${storageName}Check:checked`).val() === 'on' || $(`#${storageName}TogetherCheck:checked`).val() === 'on') {
            const iframe = document.getElementById('sandbox');
            const textareaname = `textareaFormat${storageName.charAt(0).toUpperCase() + storageName.slice(1)}`
            const { [textareaname]: textareaFormat } = await chrome.storage.local.get(textareaname)
            const { ['_' + storageName]: storage } = await chrome.storage.local.get(`_${storageName}`)
            iframe.contentWindow.postMessage([textareaFormat?.[currentTab.url.split('/')[2]] || 'return obj;', storage, storageName], '*');
            async function listener(event) {
                if (event.data[1] !== storageName) return;
                if (!(event.data[0] instanceof Error)) {
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
// 展示toast
let toastNumber = 0;
function setToast(id,txt) {
    if(id === '#toast-success'){
        $(`${id} .toast-body`).text(txt || `复制到${toastNumber}个窗口成功`);
    }
    $(id).show()
    setTimeout(() => {
        $(id).hide()
    }, 2000)
}
async function setInfo(tab) {
    // 注入
    try{
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: setWindowInfo,
            args: [$('#cookieCheck:checked').val() || false, $('#localStorageCheck:checked').val() || false, $('#sessionStorageCheck:checked').val() || false]
        });
        return true;
    }catch(e){
        console.log(e);
    }
    return false;
}
// 获取处理后的localStorage
async function getParseLocalStorage() {
    if ($('#localStorageCheck:checked').val() === 'on' || $('#localStorageTogetherCheck:checked').val() === 'on') {
        const res = await getStorage('localStorage');
        if (res && res.data[0] instanceof Error) {
            setToast('#toast-funcError-local');
            return false;
        }
    }
    if ($('#sessionStorageCheck:checked').val() === 'on' ||$('#sessionStorageTogetherCheck:checked').val() === 'on') {
        const res = await getStorage('sessionStorage');
        if (res && res.data[0] instanceof Error) {
            setToast('#toast-funcError-session');
            return false;
        }
    }
    return true;
}

async function getCopyScriptCode() {
    let code = '/** 请在目标页面的控制台中执行--复制token **/;';
    if ($('#localStorageCheck:checked').val() === 'on') {
        const { _localStorage } = await chrome.storage.local.get('_localStorage')
        for (const key in _localStorage) {
            code += `localStorage.setItem('${key}', '${_localStorage[key]}');`
        }
    }
    if ($('#sessionStorageCheck:checked').val() === 'on') {
        const { _sessionStorage } = await chrome.storage.local.get('_sessionStorage')
        for (const key in _sessionStorage) {
            code += `sessionStorage.setItem('${key}', '${_sessionStorage[key]}');`
        }
    }
    if ($('#cookieCheck:checked').val() === 'on') {
        const { _Cookies } = await chrome.storage.local.get('_Cookies')
        code += `document.cookie = '${_Cookies}';`
    }
    if ($('#localStorageTogetherCheck:checked').val() === 'on') {
        const { _localStorage } = await chrome.storage.local.get('_localStorage')
        for (const key in _localStorage) {
            code += `sessionStorage.setItem('${key}', '${_localStorage[key]}');`
        }
    }
    if ($('#sessionStorageTogetherCheck:checked').val() === 'on') {
        const { _sessionStorage } = await chrome.storage.local.get('_sessionStorage')
        for (const key in _sessionStorage) {
            code += `localStorage.setItem('${key}', '${_sessionStorage[key]}');`
        }
    }
    return code;
}

async function init() {
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
        header += `<li style="cursor: pointer"> ${i}</li>`
    }
    $('#collapseLocalStorage .textarea-format-localstorage').before(`<ul class="collapse-header">${header}</ul>`)

    $('#collapseLocalStorage ul').on('click', (e) => {
        if (e.target.tagName === 'LI') {
            const key = e.target.innerText;
            navigator.clipboard.writeText(_localStorage[key]).then(() => {
                setToast('#toast-success',`复制${key}成功`)
            })
        }
    })

    // sessionStorageCheck展开项
    const { _sessionStorage } = await chrome.storage.local.get('_sessionStorage')
    header = ''
    for (let i in _sessionStorage) {
        header += `<li> ${i} </li>`
    }
    $('#collapseSessionStorage .textarea-format-sessionstorage').before(`<ul class="collapse-header">${header}</ul>`)

    $('#collapseSessionStorage ul').on('click', (e) => {
        if (e.target.tagName === 'LI') {
            const key = e.target.innerText;
            navigator.clipboard.writeText(_localStorage[key]).then(() => {
                setToast('#toast-success',`复制${key}成功`)
            })
        }
    })

    // 复制按钮
    $('#copy').on('click', async () => {
        let tabs = await chrome.tabs.query({});
        let notab = true;
        await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: getWindowInfo,
            args: []
        });
        if(!await getParseLocalStorage()){
            return ;
        };
        for (const tab of tabs) {
            if(tab.id === currentTab.id) continue;
            // 解析目标窗口
            const targetList = [target.val(), 'http://' + target.val(), 'https://' + target.val()];
            if (target.val().includes('localhost')) {
                targetList.push('http://' + target.val().replace('localhost', '127.0.0.1'));
                targetList.push('https://' + target.val().replace('localhost', '127.0.0.1'));
            };
            if (targetList.find((item) => tab.url.includes(item))) {
                if(tab && await setInfo(tab)){
                    notab = false;
                    toastNumber++;
                    setToast('#toast-success');
                }
            }
        }
        toastNumber = 0;
        if (!notab) return;
        setToast('#toast-notarget')
    });
    // 复制代码按钮
    $('#copy-script').on('click', async () => {
        await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: getWindowInfo,
            args: []
        });
        await getParseLocalStorage();
        getCopyScriptCode().then((code) => {
            navigator.clipboard.writeText(code).then(() => {
                setToast('#toast-success','复制代码成功')
            })
        })
    });
    // 识别代码按钮
    // $('#parse-script').on('click', async () => {

    //     navigator.clipboard.readText().then(async (code) => {
    //         if(code.includes('复制token')){
    //             console.log(code);
    //             // 在目标页面执行
    //             await chrome.scripting.executeScript({
    //                 target: { tabId: currentTab.id },
    //                 function: ()=>{
    //                 }
    //             });
    //         }
    //     });
    // });
}
init();

async function setWindowInfo(setCookie, setLocalStorage, setSessionStorage) {
    const { sessionStorageTogetherCheck } = await chrome.storage.local.get('sessionStorageTogetherCheck');
    const { localStorageTogetherCheck } = await chrome.storage.local.get('localStorageTogetherCheck');
    if (localStorageTogetherCheck === 'on') {
        const { _localStorage } = await chrome.storage.local.get('_localStorage');
        for (const key in _localStorage) {
            sessionStorage.setItem(key, _localStorage[key])
        }
    }
    if (sessionStorageTogetherCheck === 'on') {
        const { _sessionStorage } = await chrome.storage.local.get('_sessionStorage')
        for (const key in _sessionStorage) {
            localStorage.setItem(key, _sessionStorage[key])
        }
    }
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

    async function getLocalStorage() {
        const obj = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            obj[key] = localStorage.getItem(key);
        }
        await chrome.storage.local.set({ _localStorage: obj })
    }

    async function getSessionStorage() {
        const obj = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (!key) continue;
            obj[key] = sessionStorage.getItem(key);
        }
        await chrome.storage.local.set({ _sessionStorage: obj })
    }

    async function getCookies() {
        await chrome.storage.local.set({ _Cookies: document.cookie })
    }

    await getLocalStorage();
    await getCookies();
    await getSessionStorage();
}