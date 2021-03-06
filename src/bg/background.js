// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

var settings = new Store("settings");

//example of using a message handler from the inject scripts
// chrome.extension.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     chrome.pageAction.show(sender.tab.id);
//     sendResponse();
//   });

function getApiBase(){
    var apiBaseUrl = settings.get("api_base_url");
    if (!apiBaseUrl){
        alert('You need to configure a Permalinker server first.');
        chrome.tabs.create({url: "src/options_custom/index.html"});
        return;
    }
    return apiBaseUrl;
}

function getPermalink(info)
{
    var apiBaseUrl = getApiBase();

    if (!apiBaseUrl){
        return;
    }

    var url;
    if (info['mediaType'] == 'image'){
        url = info['srcUrl'];
    } else if (info['linkUrl']) {
        url = info['linkUrl'];
    } else if (info['selectionText']) {
        url = info['selectionText'];
    }

    if (url){
        upload(apiBaseUrl, url);
    } else {
        alert('No URLs found in that selection/context. Try something else.');
    }
}

function upload(apiBase, sourceUrl){
    var username = settings.get("username");
    var password = settings.get("password");

    var jqxhr = $.ajax(
      {
        url: apiBase + "/upload?url=" + encodeURIComponent(sourceUrl),
        type: 'POST',
        method: 'POST',
        beforeSend: function(xhr){
          if (username && password){
            xhr.setRequestHeader("Authorization", "Basic "+ btoa(username+":"+password));
          }
        }
      })
      .done(function(data) {
        copyToClipboard(data['data']['permalink'], "text/plain");
      })
      .fail(function(data) {
        var msg;
        if ('responseJSON' in data){
          msg = data['responseJSON']['error']['message']+"\n\nError code: " + data['status'];
        } else {
          msg = data['responseText'];
        }
        alert("Error message: "+ msg +" "+ data['statusText']);
      });
}

function copyToClipboard(str, mimetype) {
  document.oncopy = function(event) {
    event.clipboardData.setData(mimetype, str);
    event.preventDefault();
  };
  document.execCommand("Copy", false, null);
  copyToClipboardFinished(str);
}

function copyToClipboardFinished(str){
  prompt('Link successfully copied to clipboard!', str);
}

chrome.contextMenus.create({title: "Permalink to cloud!", contexts:["image", "link", "selection"], onclick: getPermalink});

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    chrome.pageAction.show(sender.tab.id);
    sendResponse();
  });


