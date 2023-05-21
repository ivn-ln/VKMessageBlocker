let blockedUsers = [];

const defaultOptions = {
    active: true,
    shouldBlockLinks: false,
    shouldBlockReposts: false,
    shouldBLockMedia: false,
    blockedText: 'Сообщение заблокировано',
    shouldCollapse: false,
    shouldBlockPreview: true,
};

let options = defaultOptions;

(async()=>{
    chrome.tabs.query({'active': true}, (tabs) => {
        const tabId = tabs[0].url
        const isIM = tabId.includes('vk.com/')
        if(!isIM){
            const userComponentTemplate = document.getElementsByClassName('app-component-container')[0]
            userComponentTemplate.setAttribute('style', 'opacity: 0; height:0px')
            const errorMessage = document.createElement('h2')
            errorMessage.classList = 'home-text3'
            errorMessage.innerHTML = 'Error: not a VK page'
            document.getElementsByClassName('onSwitch')[0].replaceWith(errorMessage)
            return
        }
    })
    //chrome.storage.sync.clear()
    let getBlockedUsers = new Promise((resolve, reject)=>{chrome.storage.sync.get(null,(items)=>{
        if(items['blockedU']==undefined || items['blockedU'][0]==undefined){
            chrome.storage.sync.set({})
            console.log('No blocked users to read')
            resolve(false)
            return
        }
        resolve(Object.values(items['blockedU'][0]))
    })})
    blockedUsers = await getBlockedUsers;
    let blockedUsersData = new Promise((resolve, reject)=>{resolve(getUsersData(blockedUsers))})
    blockedUsersData = await blockedUsersData
    const onOffSwitch = document.getElementsByClassName('onSwitch')[0]
    const languageSwitch = document.getElementsByClassName('buttonLang')[0]
    const userComponentTemplate = document.getElementsByClassName('app-component-container')[0]
    onOffSwitch.addEventListener('click', onEnableSwitchClick)
    for(i in blockedUsers){
        const newUserComponent = userComponentTemplate.cloneNode(true)
        newUserComponent.classList.add('hidden')
        newUserComponent.classList.add('newComponent')
        const newUserName = newUserComponent.getElementsByClassName('componentName')[0]
        const newUserPFP = newUserComponent.getElementsByClassName('componentPFP')[0]
        const newUserTrash = newUserComponent.getElementsByClassName('buttonTrash')[0]
        const userObject = blockedUsersData[i]
        newUserTrash.addEventListener('click', unblockUser)
        newUserComponent.setAttribute('id', userObject['link'])
        newUserPFP.addEventListener('click', (input)=>{chrome.tabs.create({url: 'https://vk.com' + userObject['link']})})
        newUserName.addEventListener('click', (input)=>{chrome.tabs.create({url: 'https://vk.com' + userObject['link']})})
        newUserName.innerHTML = userObject['name'] +' ' + userObject['lastName']
        newUserPFP.setAttribute('src', userObject['PFP'])
        userComponentTemplate.parentElement.appendChild(newUserComponent)
    }
    checkNoBlockedUsers('No blocked users')
    userComponentTemplate.setAttribute('style', 'opacity: 0; height:0px')
    let getOptions = new Promise((resolve, reject)=>{chrome.storage.sync.get(null,(items)=>{
        console.log(items)
        if(items['options']==undefined || items['options'][0]==undefined){
            console.log('No options set')
        }
        resolve(items['options'])
    })})
    options = await getOptions
    if(options['active']){document.getElementsByClassName('onSwitch')[0].click()}
})()

function checkNoBlockedUsers(newText){
    if(Object.keys(blockedUsers).length==0){document.getElementsByClassName('home-text7')[0].innerHTML = newText}
}

function updateOptions(options){
    chrome.tabs.query({'active': true}, (tabs) => {
        const tabId = tabs[0]['id']
        chrome.tabs.sendMessage(tabId, {
            type: "OPTIONSCHANGED",
            tabURL: options,
        });
    })
}

function unblockUser(input){
    const userComponent = input.target.parentElement
    const user = userComponent.getAttribute('id')
    if(blockedUsers.includes(user)){blockedUsers.splice(blockedUsers.indexOf(user), 1)}
    chrome.storage.sync.set({'blockedU': blockedUsers})
    checkNoBlockedUsers('No blocked users')
    userComponent.classList.add('hidden')
    chrome.tabs.query({'active': true}, (tabs) => {
        const tabId = tabs[0]['id']
        chrome.tabs.sendMessage(tabId, {
            type: "BLOCKEDUSERSCHANGED",
            tabURL: blockedUsers,
        });
    })
}

async function getUsersData(blockedUsers){
    if(blockedUsers.length==undefined){return}
    if(blockedUsers.length==0){return}
    let blockedUsersObjects = {}
    let userIDsString = ''
    for(i in blockedUsers){userIDsString+=blockedUsers[i].replace('/', '')+','}
    const getUsersDataPromise = new Promise((resolve, reject)=> fetch('https://api.vk.com/method/users.get?' + new URLSearchParams({
        access_token: '770db9af770db9af770db9af3674199ce57770d770db9af1364ea8893c52eef5a3b318e',
        user_ids: userIDsString,
        fields: 'nickname, photo_max',
        v: '5.131'
    })).then(r=>{
        r.json().then(r=>{
            const response = r['response']
            for(i in response){
                const userName = response[i]['first_name']
                const userLastName = response[i]['last_name']
                const userPFP = response[i]['photo_max']
                const newUserObject = {}
                newUserObject['name'] = userName
                newUserObject['lastName'] = userLastName
                newUserObject['PFP'] = userPFP
                newUserObject['link'] = blockedUsers[i]
                blockedUsersObjects[i] = newUserObject
            }
            resolve(blockedUsersObjects)
        })
    }))
    blockedUsersObjects = await(getUsersDataPromise)
    return(blockedUsersObjects)
}

function onEnableSwitchClick(input){
    const button = input.target
    const classList = button.classList
    const components = document.getElementsByClassName('newComponent')
    if(!classList.contains('enabled')){
        options['active'] = true
        document.getElementsByClassName('home-text7')[0].classList.remove('hidden')
        for(i in components){
            if(!components[i].nodeType){continue}
            components[i].classList.remove('hidden')
        }
        button.classList.add('enabled')
        button.classList.remove('disabled')
    }
    else{
        options['active'] = false
        document.getElementsByClassName('home-text7')[0].classList.add('hidden')
        for(i in components){
            if(!components[i].nodeType){continue}
            components[i].classList.add('hidden')
        }
        button.classList.add('disabled')
        button.classList.remove('enabled')
    }
    console.log(chrome.storage.sync.set({'options': options}))
    updateOptions(options)
}