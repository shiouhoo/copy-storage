// target
$('#address').on('change', () => {
    chrome.storage.local.set({ target: $('#address').val() });
})
chrome.storage.local.get('target', ({ target }) => {
    if (target) {
        $('#address').val(target)
    }
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
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url.split('/')[2];
    if (textareaFormatLocalstorage && textareaFormatLocalstorage[url]) {
        $('#textarea-format-localstorage').val(textareaFormatLocalstorage[url])
    } else {
        chrome.storage.local.set({
            textareaFormatLocalstorage: {
                ...(textareaFormatLocalstorage || {}),
                [url]: $('#textarea-format-localstorage').val()
            }
        });
    }
})
$('#textarea-format-localstorage').on('change', async () => {
    chrome.storage.local.get('textareaFormatLocalstorage', async ({ textareaFormatLocalstorage }) => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.storage.local.set({
            textareaFormatLocalstorage: {
                ...(textareaFormatLocalstorage || {}),
                [tab.url.split('/')[2]]: $('#textarea-format-localstorage').val()
            }
        });
    })
})