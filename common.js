// target
$('#address').on('change', () => {
    chrome.storage.sync.set({ target: $('#address').val() });
})
chrome.storage.sync.get('target', ({ target }) => {
    if (target) {
        $('#address').val(target)
    }
})
// cookieCheck
chrome.storage.sync.get('cookieCheck', ({ cookieCheck }) => {
    $('#cookieCheck').prop('checked', cookieCheck);
})
$('#cookieCheck').on('change', () => {
    chrome.storage.sync.set({ cookieCheck: $('#cookieCheck:checked').val() || false });
})
// localStorageCheck
chrome.storage.sync.get('localStorageCheck', ({ localStorageCheck }) => {
    $('#localStorageCheck').prop('checked', localStorageCheck);
})
$('#localStorageCheck').on('change', () => {
    chrome.storage.sync.set({ localStorageCheck: $('#localStorageCheck:checked').val() || false });
})