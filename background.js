chrome.tabs.onUpdated.addListener(async (tabId, tab) => {
    await chrome.tabs.query({'active': true}, (tabs) => {
        const url = tabs[0].url;
        if(url.includes('vk.com/im') || url.includes('https://vk.com/al_im')){
            console.log(url)
            console.log(tabId)
            chrome.tabs.sendMessage(tabId, {
                type: "NEW",
                tabURL: url,
            });
        }
    });
});     