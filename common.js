function getCurrentDomain() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }).then((tab) => {
            resolve(tab[0].url.split('/')[2])
        })
    });
}

async function changeLocal(name, key, id) {
    const domain = await getCurrentDomain();
    chrome.storage.local.get(name, async (data) => {
        const target = data[key];
        chrome.storage.local.set({
            [name]: {
                ...(target || {}),
                [domain]: $(`#${id}`).val()
            }
        });
    })
}

async function initLocal(data, name, id) {
    const domain = await getCurrentDomain();
    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?'+ // port
    '(\\/[-a-z\\d%_.~+]*)*'+ // path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if (!urlPattern.test(domain)) {
        console.log("init：空标签页无法操作, 请打开一个网页");
        return;
    }
    if (data && data[domain]) {
        $(`#${id}`).val(data[domain])
    } else {
        chrome.storage.local.set({
            [name]: {
                ...(data || {}),
                [domain]: $(`#${id}`).val()
            }
        });
    }
}

// target
$('#address').on('change', async () => {
    changeLocal('target', 'target', 'address')
})
/**
 * target: {
 *    [链接] : string
 * }
 */
chrome.storage.local.get('target', async ({ target }) => {
    initLocal(target, 'target', 'address')
})
// cookieCheck
chrome.storage.local.get('cookieCheck', ({ cookieCheck }) => {
    $('#cookieCheck').prop('checked', cookieCheck);
})
$('#cookieCheck').on('change', () => {
    chrome.storage.local.set({ cookieCheck: $('#cookieCheck:checked').val() || false });
})
// localStorageCheck
chrome.storage.local.get('localStorageCheck', ({ localStorageCheck }) => {
    $('#localStorageCheck').prop('checked', localStorageCheck);
})
$('#localStorageCheck').on('change', () => {
    chrome.storage.local.set({ localStorageCheck: $('#localStorageCheck:checked').val() || false });
})
// textarea-format-localstorage
chrome.storage.local.get('textareaFormatLocalstorage', async ({ textareaFormatLocalstorage }) => {
    initLocal(textareaFormatLocalstorage, 'textareaFormatLocalstorage', 'textarea-format-localstorage')
})
$('#textarea-format-localstorage').on('change', async () => {
    changeLocal('textareaFormatLocalstorage', 'textareaFormatLocalstorage', 'textarea-format-localstorage')
})