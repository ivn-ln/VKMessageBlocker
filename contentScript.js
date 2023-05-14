let active = true
let shouldBlockLinks = false;
let shouldBlockReposts = false;
let shouldBLockMedia = false;
let blockedText = 'Сообщение заблокировано';
let blockedUsers = ['/che_ti_tut_delaesh'];

(async ()=>{
    const messageBlocks = document.getElementsByClassName('ui_clean_list')

    for(let i = 1; i < messageBlocks.length; i++){
        const currMB = messageBlocks[i]
        const message = currMB.querySelectorAll('li')
        const author = currMB.parentElement.parentElement.getElementsByClassName('im-mess-stack--lnk')[0].getAttribute('href')
        if(blockedUsers.includes(author)){
            blockMessagesText(message)
        }
        
    }
    const messagePreviewText = messageBlocks[0].getElementsByClassName('nim-dialog--inner-text')
    let messagePreviewDMText = messageBlocks[0].getElementsByClassName('nim-dialog--preview')
    for(i in messagePreviewText){
        if(typeof(messagePreviewText[i])!= "object"){
            continue
        }
        messagePreviewText[i].innerHTML = blockedText
        let observer = new MutationObserver(blockShortMessageText);
        observer.observe(messagePreviewText[i], {characterData: true});
    }

    for(i in messagePreviewDMText){
        //messagePreviewDMText[i].innerHTML = blockedText
        //messagePreviewDMText[i].addEventListener('', blockShortMessage)
    }

    const messageBlocksContainer = document.getElementsByClassName('_im_peer_history im-page-chat-contain glubs-container')[0]
    messageBlocksContainer.addEventListener('DOMNodeInserted', blockMessages)
})()

function blockShortMessageText(){
    console.log('Short msg changed')
}

function blockMessagesText(messages){
    messages.forEach(element => {
        const messageTextContainer = element.getElementsByClassName('im-mess--text wall_module _im_log_body')
        if(messageTextContainer.length!=0){
            const originalMessageText = messageTextContainer[0].innerHTML
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