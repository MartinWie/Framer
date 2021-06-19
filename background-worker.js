let headersToRemove = [
    'content-security-policy',
    'x-frame-options',
];
  
chrome.webRequest.onHeadersReceived.addListener(
  details => ({
    responseHeaders: details.responseHeaders.filter(header =>
      !headersToRemove.includes(header.name.toLowerCase())
    )
  }),
  {
    urls: ['<all_urls>']
  },
  ['responseHeaders', 'extraHeaders']
);

chrome.runtime.onStartup.addListener(
  chrome.storage.local.get(['framers'], (result) => {
    let framersLoaded = result.framers
    if(framersLoaded == undefined) framersLoaded = []
    updateUnblockRulesAdd(framersLoaded)
  })
);

// normally updateDynamicRules would do the trick and persist the rules but there seems to be a bug that 
// https://bugs.chromium.org/p/chromium/issues/detail?id=1203517
// workaround: just refresh the rules with every created tab

chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.local.get(['framers'], (result) => {
    let framersLoaded = result.framers
    if(framersLoaded == undefined) framersLoaded = []
    updateUnblockRulesAdd(framersLoaded)
  })
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "getList"){
      loadFramersLocal(sendResponse)
      return true
    }
      
    if (request.action == "remove"){
      removeFromFramerList(request.value);
      return true
    }

    if (request.action == "add"){
      addToFramersList(request.value);
      return true
    }
    
    console.log("How did we get here?!")
  }
);

function saveFramersLocal(framers) {
  chrome.storage.local.set({'framers': framers}, () => {
  });
}

function loadFramersLocal(callback){ 
  chrome.storage.local.get(['framers'], (result) => { 
    callback(result.framers)
  });
}

function addToFramersList(entry) {
  chrome.storage.local.get(['framers'], (result) => {
    let framersLoaded = result.framers
    if(framersLoaded == undefined) framersLoaded = []
    framersLoaded.push(entry)
    updateUnblockRulesAdd(framersLoaded)
    saveFramersLocal(framersLoaded)
  });
}

function removeFromFramerList(entry) {
  chrome.storage.local.get(['framers'], (result) => {
    let framersLoaded = result.framers
    framersLoaded = framersLoaded.filter((it) => {
      return it != entry
    })
    updateUnblockRulesRemove(framersLoaded)
    saveFramersLocal(framersLoaded)
  });
}

function addFramerRule(keyword) {
  chrome.declarativeNetRequest.updateSessionRules(
    {addRules: [generateUnblockRule(keyword)]},() => {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }
    }
  )
}

function stringToId(str) {
  let id = str.length
  Array.from(str).forEach( (it) => {
    id += it.charCodeAt()
  })
  return id * 10000 + 6794 
}

function generateUnblockRule(keyword) {
  return {
    "id": stringToId(keyword),
    "priority": 1,
    "action": {
      "type": "modifyHeaders",
      "responseHeaders": [
          { "header": "x-frame-options", "operation": "remove" },
          { "header": "content-security-policy", "operation": "remove" }
        ]
    },
    "condition": { "urlFilter": `*${keyword}*`, "resourceTypes": ["main_frame","sub_frame"] }
  }
  
}

function updateUnblockRulesAdd(keywords) {
  keywords.forEach(it => addFramerRule(it))
}

async function updateUnblockRulesRemove(keywords) {

  let sessionRulesAll = await chrome.declarativeNetRequest.getSessionRules()
  let sessionRulesFramer = sessionRulesAll.filter( rule => isFramerID(rule['id']))
  let sessionRulesToRemove = sessionRulesFramer.filter( rule => keywords.indexOf(rule['condition']['urlFilter'].replaceAll("*", "")) == -1)
 
  let sessionRulesToRemoveIDs = sessionRulesToRemove.map( rule => rule['id'] )

  await chrome.declarativeNetRequest.updateSessionRules(
    {removeRuleIds: sessionRulesToRemoveIDs},() => {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }
    }
  )
}

function isFramerID(id) {
  let idString = String(id)
  if(idString.length > 4 && idString.substring(idString.length -4, idString.length) == 6794){
    return true
  }
  return false
}