//Script options
const defaultOptions = {
    active: true,
    shouldBlockLinks: false,
    shouldBlockReposts: false,
    shouldBLockMedia: false,
    blockedText: 'Сообщение заблокировано',
    shouldCollapse: false,
    shouldBlockPreview: true,
    lang: 'rus'
};

let active = defaultOptions['active'];
let shouldBlockLinks = defaultOptions['shouldBlockLinks'];
let shouldBlockReposts = defaultOptions['shouldBlockReposts'];
let shouldBLockMedia = defaultOptions['shouldBLockMedia'];
let blockedText = defaultOptions['blockedText'];
let shouldCollapse = defaultOptions['shouldCollapse'];
let shouldBlockPreview = defaultOptions['shouldBlockPreview'];
let lang = defaultOptions['lang'];

let blockedUsers = [];

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
    //chrome.storage.sync.clear()
    let getOptions = new Promise((resolve, reject)=>{chrome.storage.sync.get(null,(items)=>{
        console.log(items)
        if(items['options']==undefined || Object.keys(items['options'])[0]==undefined){
            console.log('No options set')
        }
        resolve(items['options'])
    })})
    options = await getOptions
    if(options!=undefined){active = options['active']}
    //Reactions to background script messages
    let getCorrectUrl = new Promise((resolve, reject)=>chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const{type, tabURL}=obj
        console.log(type)
        if(type === "NEW"){
            //Check if url is vk messenger page
            const isIM = tabURL.includes('vk.com/im')|| tabURL.includes('https://vk.com/al_im')
            if(isIM){
                if(active){main()
                    //blockPreview()
                    console.log('extension injected succesfully')
                }
            }
            resolve(isIM)
        }
        if(type === "BLOCKEDUSERSCHANGED"){
            console.log(blockedUsers, tabURL)
            blockedUsers = tabURL
            blockMessageBlocks(true)
        }
        if(type==="OPTIONSCHANGED"){
            active = tabURL['active']
            if(active){
                main()
                //blockMessageBlocks()
            }
            else{
                blockMessageBlocks(shouldUnblockRest=true, customBlockedList=[])
                const messageBlocksContainer = document.getElementsByClassName('_im_peer_history im-page-chat-contain glubs-container')[0]
                messageBlocksContainer.removeEventListener('DOMNodeInserted', blockNewMessages)
            }
        }
    }))
    const isIM = await getCorrectUrl
    if(!active){return}
    //If it is inject script
    if(!isIM){
        console.log('website is not vk im page')
        return
    }
    else{
        console.log('extension injected succesfully')
        return
    }
})()

async function blockPreview(){
    let messagePreview = document.getElementsByClassName('ui_clean_list')[0].getElementsByClassName('nim-dialog--preview')
    if(!shouldBlockPreview||!active){
        for(i in messagePreview){
            if(!messagePreview[i].nodeType){continue}
            messagePreview[i].removeEventListener('DOMNodeInserted', blockSinglePreview)
        }
        return
    }
    for(i in messagePreview){
        if(!messagePreview[i].nodeType){continue}
        messagePreview[i].addEventListener('DOMNodeInserted', blockSinglePreview)
        messagePreview[i].innerHTML = blockedText

    }
}

function blockSinglePreview(input){
    if(input.target.parentElement==null){return}
    input.target.parentElement.innerHTML = blockedText
}

async function main(){
    //Await to get blocked users from chrome sync storage
    let getBlockedUsers = new Promise((resolve, reject)=>{chrome.storage.sync.get(null,(items)=>{
        if(items['blockedU']==undefined || items['blockedU'][0]==undefined){
            chrome.storage.sync.set({'blockedU':[]})
            console.log('No blocked users to read')
            resolve(false)
        }
        else{
            resolve(Object.values(items['blockedU'][0]))
        }
    })})
    blockedUsers = await getBlockedUsers
    console.log(blockedUsers)
    let newq = ''
    for(i in blockedUsers){
        newq+=blockedUsers[i]
    }
    console.log(newq, )
    if(blockedUsers[0]!=undefined && blockedUsers[0].length==1){
        chrome.storage.sync.get(null,(items)=>{
            if(items['blockedU']==undefined || items['blockedU'][0]==undefined){
                chrome.storage.sync.set({})
                console.log('No blocked users to read')
                resolve(false)
                return
            }
            chrome.storage.sync.set({'blockedU':[]})
        })
        console.log('Script error, please reload page')
        return
    }
    getBlockedUsersNicknames()
    //Add listeners for vk popup and new messages in chat container
    const popup = document.getElementById('box_layer_wrap')
    popup.addEventListener('DOMNodeInserted', addBlockButtons)
    const messageBlocksContainer = document.getElementsByClassName('_im_peer_history im-page-chat-contain glubs-container')[0]
    messageBlocksContainer.addEventListener('DOMNodeInserted', blockNewMessages)
    if(blockedUsers==false){
        blockedUsers = []
        return
    }
    blockMessageBlocks()
}

async function getBlockedUsersNicknames(){
    //Requires vk token to be set up so impossible for now
    for(i in blockedUsers){
        if(blockedUsers.length==0){break}
        const url = 'https://vk.com' + blockedUsers[i]
    }
}

function blockMessageBlocks(shouldUnblockRest=false, customBlockedList=null){
    blockPreview()
    if(customBlockedList==null){customBlockedList=blockedUsers}
    //Get message blocks and if it's author is in block list use block func on them
    //If should unblock rest, unblock rest, which are not in the block list
    const messageBlocks = document.getElementsByClassName('ui_clean_list')
    for(let i = 1; i < messageBlocks.length; i++){
        const currMB = messageBlocks[i]
        const message = currMB.querySelectorAll('li')
        const author = currMB.parentElement.parentElement.getElementsByClassName('im-mess-stack--lnk')[0].getAttribute('href')
        if(customBlockedList.includes(author)){blockMessagesText(message)}
        else if(shouldUnblockRest){unblockMessagesText(message)}
    }
}

function addBlockButtons(input){
    //Adds block buttons into popup html
    const currentPopup = input.target
    const userList = Object.values(currentPopup.getElementsByClassName('Entity__title'))
    for(i in userList){
        const userID = userList[i].getElementsByClassName('Link')[0].getAttribute('href')
        let buttonText = ''
        if(!blockedUsers.includes(userID)){buttonText = '🔇 Block'}
        else{buttonText = '📢 Unblock'}
        let button = new banButton(buttonText, userID)
        userList[i].appendChild(button.HTMLElement)
    }
}

function onBanButtonPressed(input){
    //Bans or unbans person dependent on button's current state and stores them in blocked users var
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
    //Stores changed blocked users var in chrome sync storage
    console.log(blockedUsers) 
    console.log(chrome.storage.sync.set({'blockedU': [blockedUsers]}))
    //Redones block message blocks with new block list
    blockMessageBlocks(true)
}

function blockMessagesText(messages){
    //Changes message html to a blocked message html template and adds span with message's orig html
    //Every message is taken from messages arg, representing a single author message block
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

function unblockMessagesText(messages){
    //Reverts changes done to messages in block messanges text func
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

function blockNewMessages(input){
    //Blocks new messages appearing in chat container by using block messages text on their message block
    if(input.target.classList==undefined){return}
    if(!(input.target.classList.contains('im-mess') || input.target.classList.contains('im-mess-stack'))){return}
    let messages = input.target.querySelectorAll('li')
    if(messages.length==0){messages = input.target.parentElement.querySelectorAll('li')}
    const author = messages[0].parentElement.parentElement.getElementsByClassName('im-mess-stack--lnk')[0].getAttribute('href')
    if(blockedUsers.includes(author)){blockMessagesText(messages)}
}