const NandBox = require('nandbox-bot-api/src/NandBox');
const Nand = require('nandbox-bot-api/src/NandBoxClient');
const Utils = require('nandbox-bot-api/src/util/Utility');
const NandBoxClient = Nand.NandBoxClient;
const Utility = Utils.Utility;
const Id = Utils.Id;
const Result = require('nandbox-bot-api/src/data/Result');
const InlineSearchAnswer = require('nandbox-bot-api/src/outmessages/InlineSearchAnswer');
const Chat = require('nandbox-bot-api/src/data/Chat');

const sqlite3 = require('sqlite3').verbose();

const TOKEN = "90092081573258158:0:R6sWbOj4bL63m5e5iQZKuZVlccxWB7";
const config = {
    URI: "wss://w1.nandbox.net:5020/nandbox/api/",
    DownloadServer: "https://w1.nandbox.net:5020/nandbox/download/",
    UploadServer: "https://w1.nandbox.net:5020/nandbox/upload/"
}


var client = NandBoxClient.get(config);
var nandbox = new NandBox();
var nCallBack = nandbox.Callback;
var api = null;


let db = new sqlite3.Database('./db/quran.ar.db', err => {
    if(err){
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database');
});  

nCallBack.onConnect = (_api) => {
    // it will go here if the bot connected to the server successfully 
    api = _api;
    console.log("Authenticated");
}



nCallBack.onReceive = incomingMsg => { }

// implement other nandbox.Callback() as per your bot need
nCallBack.onReceiveObj = obj => console.log("received object: ", obj);
nCallBack.onClose = () => console.log("ONCLOSE");
nCallBack.onError = () => console.log("ONERROR");
nCallBack.onChatMenuCallBack = chatMenuCallback => {}
nCallBack.onInlineMessageCallback = inlineMsgCallback => { }
nCallBack.onMessagAckCallback = msgAck => { }
nCallBack.onUserJoinedBot = user => { }
nCallBack.onChatMember = chatMember => { }
nCallBack.onChatAdministrators = chatAdministrators => { }
nCallBack.userStartedBot = user => { }
nCallBack.onMyProfile = user => { }
nCallBack.onUserDetails = user => { }
nCallBack.userStoppedBot = user => { }
nCallBack.userLeftBot = user => { }
nCallBack.permanentUrl = permenantUrl => { }
nCallBack.onChatDetails = chat => { }

let results = [];
nCallBack.onInlineSearh = inlineSearch => {
    console.log('inline search id: ' + inlineSearch.search_id);
    console.log('inline search offset: ' + inlineSearch.offset);
    console.log('inline search chat id: '  + inlineSearch.chat.id);
    console.log('inline search from id: ' + inlineSearch.from.id);
    console.log('inline search keywords: ' + inlineSearch.keywords);

    let inlineSearchAnswer = new InlineSearchAnswer();

    let query = `SELECT * FROM ARABIC_TEXT  WHERE AYAH = (SELECT AYAH FROM VERSES WHERE TEXT LIKE '%${inlineSearch.keywords}%') and SURA = (SELECT SURA FROM VERSES WHERE TEXT LIKE '%${inlineSearch.keywords}%') LIMIT 15;`;
//SELECT * FROM ARABIC_TEXT  WHERE AYAH = (SELECT AYAH FROM VERSES WHERE TEXT LIKE '%${inlineSearch.keywords}%') and SURA = (SELECT SURA FROM VERSES WHERE TEXT LIKE '%${inlineSearch.keywords}%') LIMIT 15;

    db.each(query, [], (err, row) => {
        if(err){
            console.error(err);
        }else{
            let result = new Result();
            result.title = `${row.ayah} :${row.sura}`;
            result.caption = `${row.text}`;
            result.height = 10;
            result.width = 40;
            result.description = `${row.text}`;
            result.type = 'text';
            result.thumb_url = './png/001-quran.png';
            result.url = './png/001-quran.png';
            results.push(result);
        }
    });

    inlineSearchAnswer.results = results;
    inlineSearchAnswer.next_offset = "";
    inlineSearchAnswer.chat = new Chat(inlineSearch.chat);
    inlineSearchAnswer.chat.id = inlineSearch.chat.id;
    inlineSearchAnswer.to_user_id = inlineSearch.from.id;
    inlineSearchAnswer.search_id = inlineSearch.search_id;
    api.send(JSON.stringify(inlineSearchAnswer));
}

client.connect(TOKEN, nCallBack);
