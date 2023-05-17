let url
chrome.tabs.onUpdated.addListener(async (tabId, tab) => {
    await chrome.tabs.query({'active': true}, (tabs) => {
        url = tabs[0].url;
        if(url){
            chrome.tabs.sendMessage(tabId, {
                type: "NEW",
                tabURL: url,
            });
        }
    });
});      