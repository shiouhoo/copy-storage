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
chrome.storage.local.get('textareaFormatLocalstorage', ({ textareaFormatLocalstorage }) => {
    $('#textarea-format-localstorage').val(textareaFormatLocalstorage);
})
$('#textarea-format-localstorage').on('change', () => {
    chrome.storage.local.set({ textareaFormatLocalstorage: $('#textarea-format-localstorage').val() });
})