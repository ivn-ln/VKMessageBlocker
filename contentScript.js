let active = true
let shouldBlockLinks = false;
let shouldBlockReposts = false;
let shouldBLockMedia = false;
let blockedText = 'Сообщение заблокировано';
let shouldCollapse = false;
let blockedUsers = [];
let blockPreview = false;

class banButton{
    constructor(text, userID){
        this.HTMLElement = document.createElement('input')
        this.HTMLElement.setAttribute('type', 'button')
        this.HTMLElement.setAttribute('value', text)
        this.HTMLElement.setAttribute('style', 'border:none;background-color:rgba(0,0,0,0.0);cursor:pointer;')
        this.HTMLElement.setAttribute('id', userID)
        this.HTMLElement.addEventListener('click', onBanButtonPressed)
    }
}


(async ()=>{
    let getCorrectUrl = new Promise((resolve, reject)=>chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const{type, tabURL}=obj
        if(type === "NEW"){
            const isIM = tabURL.includes('vk.com/im')
            if(isIM){
                main()
            }
            resolve(isIM)
        }
    }))
    const isIM = await getCorrectUrl
    if(!isIM){
        console.log('website is not vk im page')
        return
    }
    else{
        console.log('extension injected succesfully')
        return
    }
})()

async function main(){
    //chrome.storage.local.clear()
    let getBlockedUsers = new Promise((resolve, reject)=>{chrome.storage.local.get('blockedU',(items)=>{
        //if(items==undefined){
        //    items = {blockedUsers: []}
        //}
        resolve(Object.values(items['blockedU'][0]))
    })})
    blockedUsers = await getBlockedUsers; // будет ждать, пока промис не выполнится (*)
    const messageBlocks = document.getElementsByClassName('ui_clean_list')

    const popup = document.getElementById('box_layer_wrap')

    popup.addEventListener('DOMNodeInserted', addBlockButtons)

    if(!active){
        return
    }
    for(let i = 1; i < messageBlocks.length; i++){
        const currMB = messageBlocks[i]
        const message = currMB.querySelectorAll('li')
        const author = currMB.parentElement.parentElement.getElementsByClassName('im-mess-stack--lnk')[0].getAttribute('href')
        if(blockedUsers.includes(author)){
            blockMessagesText(message)
            //unblockMessagesText(message)
        }
        else{
            unblockMessagesText(message)
        }
    }
    const messagePreviewText = messageBlocks[0].getElementsByClassName('nim-dialog--inner-text')
    let messagePreviewDMText = messageBlocks[0].getElementsByClassName('nim-dialog--preview')
    //or(i in messagePreviewText){
    //    messagePreviewText[i].innerHTML = blockedText
    //}
    if(blockPreview){
        for(i in messagePreviewDMText){
            if(!messagePreviewDMText[i].nodeType){
                continue
            }
            messagePreviewDMText[i].innerHTML = blockedText
            //messagePreviewDMText[i].addEventListener('DOMNodeInserted', (input)=>{console.log(input.target)})
            //messagePreviewDMText[i].innerHTML = blockedText
            //messagePreviewDMText[i].addEventListener('', blockShortMessage)
        }
    }

    const messageBlocksContainer = document.getElementsByClassName('_im_peer_history im-page-chat-contain glubs-container')[0]
    messageBlocksContainer.addEventListener('DOMNodeInserted', blockMessages)
}

function addBlockButtons(input){
    const currentPopup = input.target
    //if([Object.values(input.target.classList)].includes('ChatSettingsWrapper')){
    //    return
    //}
    const userList = Object.values(currentPopup.getElementsByClassName('Entity__title'))
    for(i in userList){
        const userID = userList[i].getElementsByClassName('Link')[0].getAttribute('href')
        let buttonText = ''
        if(!blockedUsers.includes(userID)){
            buttonText = '🔇 Block'
        }
        else{
            buttonText = '📢 Unblock'
        }
        let button = new banButton(buttonText, userID)
        userList[i].appendChild(button.HTMLElement)
    }
}

function onBanButtonPressed(input){
    const button = input.target
    if(blockedUsers.includes(button.id)){
        const pos = blockedUsers.indexOf(button.id)
        blockedUsers.splice(pos, 1)
        button.value = '🔇 Block'
    }
    else{
        blockedUsers.push(button.id)
        button.value = '📢 Unblock'
    }
    console.log(chrome.storage.local.set({blockedU: [blockedUsers]}))
    main()
}

function blockShortMessageText(){
    console.log('Short msg changed')
}

function unblockMessagesText(messages){
    messages.forEach(element => {
        const messageTextContainer = element.getElementsByClassName('im-mess--text wall_module _im_log_body')
        if(messageTextContainer.length!=0){
            const OGTextElements = element.getElementsByClassName('OGMessage')
            if(OGTextElements.length==0){
                return
            }
            const OGText = OGTextElements[0].innerHTML
            messageTextContainer[0].innerHTML = OGText
            messageTextContainer[0].setAttribute('style', 'color: #D7D3CE;')
        }
        return
    });
}

function blockMessagesText(messages){
    messages.forEach(element => {
        const messageTextContainer = element.getElementsByClassName('im-mess--text wall_module _im_log_body')
        if(messageTextContainer.length!=0){
            const originalMessageText = messageTextContainer[0].innerHTML
            const OGMessageContainer = document.createElement('span')
            OGMessageContainer.setAttribute('style', 'display: none;')
            OGMessageContainer.classList.add('OGMessage')
            OGMessageContainer.innerHTML = originalMessageText
            messageTextContainer[0].parentElement.appendChild(OGMessageContainer)
            messageTextContainer[0].innerHTML = blockedText
            messageTextContainer[0].setAttribute('style', 'color: gray;')
        }
    });
}

function blockMessages(input){
    if(input.target.classList==undefined){
        return
    }
    if(!(input.target.classList.contains('im-mess') || input.target.classList.contains('im-mess-stack'))){
        return
    }
    let messages = input.target.querySelectorAll('li')
    if(messages.length==0){
        messages = input.target.parentElement.querySelectorAll('li')
    }
    const author = messages[0].parentElement.parentElement.getElementsByClassName('im-mess-stack--lnk')[0].getAttribute('href')
    if(blockedUsers.includes(author)){
        blockMessagesText(messages)
    }
}