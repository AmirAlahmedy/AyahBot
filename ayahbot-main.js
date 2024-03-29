const NandBox = require("nandbox-bot-api/src/NandBox");
const Nand = require("nandbox-bot-api/src/NandBoxClient");
const Utils = require("nandbox-bot-api/src/util/Utility");
const NandBoxClient = Nand.NandBoxClient;
const Utility = Utils.Utility;
const Id = Utils.Id;
const Result = require("nandbox-bot-api/src/data/Result");
const InlineSearchAnswer = require("nandbox-bot-api/src/outmessages/InlineSearchAnswer");
const Chat = require("nandbox-bot-api/src/data/Chat");
const path = require("path");
/*----------------------------------DB------------------------------------------*/
const sqlite3 = require("sqlite3").verbose();
/*------------------------------------------------------------------------------*/
/*----------------------------logger--------------------------------------------*/
const winston = require("winston");
const error_file = path.join(__dirname, "./error.log");
const info_file = path.join(__dirname, "./info.log");
const DailyRotateFile = require("winston-daily-rotate-file");
const { off } = require("process");

let logger = winston.createLogger({
  level: "info",
  transports: [
    // new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      filename: error_file,
      level: "error",
      maxSize: "5m",
      maxFiles: "5d",
    }),
    new winston.transports.DailyRotateFile({
      filename: info_file,
      maxSize: "5m",
      maxFiles: "5d",
    }),
  ],
});
/*------------------------------------------------------------------------------*/

// production configurations
const TOKEN = "90091815138763155:0:GyZ0suUQAIDWZotcWqtWDkuzXobZZv";
const config = {
    URI: "wss://w1.nandbox.net:5020/nandbox/api/",
    DownloadServer: "https://w1.nandbox.net:5020/nandbox/download/",
    UploadServer: "https://w1.nandbox.net:5020/nandbox/upload/"
}

// local dev configurations
// const TOKEN = "90091783919738987:0:d8OEltE0N59rnRfM5KvAdhCtg6qyAE";
// const config = {
//   URI: "wss://d1.nandbox.net:5020/nandbox/api/",
//   DownloadServer: "https://d1.nandbox.net:5020/nandbox/download/",
//   UploadServer: "https://d1.nandbox.net:5020/nandbox/upload/",
// };

const botName = "@qurany_nb";

var client = NandBoxClient.get(config);
var nandbox = new NandBox();
var nCallBack = nandbox.Callback;
var api = null;

let db = new sqlite3.Database("./db/quran.ar.db", (err) => {
  if (err) {
    logger.error(err.message);
    return console.error(err.message);
  }
  console.log("Connected to the SQlite database");
  logger.info("Connected to the SQlite database");
});

let Sura = [
  // [start, ayas, order, rukus, name, tname, ename, type]
  [],
  // 30
  [0, 7, 5, 1, "سورة الفاتحة", "Al-Faatiha", "The Opening", "Meccan"],
  [7, 286, 87, 40, "البقرة", "Al-Baqara", "The Cow", "Medinan"],
  // 28
  [
    293,
    200,
    89,
    20,
    " آل عمران",
    "Aal-i-Imraan",
    "The Family of Imraan",
    "Medinan",
  ],
  [493, 176, 92, 24, "النساء", "An-Nisaa", "The Women", "Medinan"],
  [669, 120, 112, 16, "المائدة", "Al-Maaida", "The Table", "Medinan"],
  [789, 165, 55, 20, "الأنعام", "Al-An'aam", "The Cattle", "Meccan"],
  [954, 206, 39, 24, "الأعراف", "Al-A'raaf", "The Heights", "Meccan"],
  [1160, 75, 88, 10, "الأنفال", "Al-Anfaal", "The Spoils of War", "Medinan"],
  [1235, 129, 113, 16, "التوبة", "At-Tawba", "The Repentance", "Medinan"],
  [1364, 109, 51, 11, "يونس", "Yunus", "Jonas", "Meccan"],
  [1473, 123, 52, 10, "هود", "Hud", "Hud", "Meccan"],
  [1596, 111, 53, 12, "يوسف", "Yusuf", "Joseph", "Meccan"],
  // 17
  [1707, 43, 96, 6, "الرعد", "Ar-Ra'd", "The Thunder", "Medinan"],
  [1750, 52, 72, 7, "إبراهيم", "Ibrahim", "Abraham", "Meccan"],
  [1802, 99, 54, 6, "الحجر", "Al-Hijr", "The Rock", "Meccan"],
  // 16
  [1901, 128, 70, 16, "النحل", "An-Nahl", "The Bee", "Meccan"],
  [2029, 111, 50, 12, "الإسراء", "Al-Israa", "The Night Journey", "Meccan"],
  // 15
  [2140, 110, 69, 12, "الكهف", "Al-Kahf", "The Cave", "Meccan"],
  [2250, 98, 44, 6, "مريم", "Maryam", "Mary", "Meccan"],
  [2348, 135, 45, 8, "طه", "Taa-Haa", "Taa-Haa", "Meccan"],
  // 14
  [2483, 112, 73, 7, "الأنبياء", "Al-Anbiyaa", "The Prophets", "Meccan"],
  [2595, 78, 103, 10, "الحج", "Al-Hajj", "The Pilgrimage", "Medinan"],
  // 13
  [2673, 118, 74, 6, "المؤمنون", "Al-Muminoon", "The Believers", "Meccan"],
  [2791, 64, 102, 9, "النّور", "An-Noor", "The Light", "Medinan"],
  [2855, 77, 42, 6, "الفرقان", "Al-Furqaan", "The Criterion", "Meccan"],
  // 12
  [2932, 227, 47, 11, "الشعراء", "Ash-Shu'araa", "The Poets", "Meccan"],
  [3159, 93, 48, 7, "النّمل", "An-Naml", "The Ant", "Meccan"],
  // 11
  [3252, 88, 49, 8, "القصص", "Al-Qasas", "The Stories", "Meccan"],
  [3340, 69, 85, 7, "العنكبوت", "Al-Ankaboot", "The Spider", "Meccan"],
  // 10
  [3409, 60, 84, 6, "الرّوم", "Ar-Room", "The Romans", "Meccan"],
  [3469, 34, 57, 3, "لقمان", "Luqman", "Luqman", "Meccan"],
  [3503, 30, 75, 3, "السجدة", "As-Sajda", "The Prostration", "Meccan"],
  // 9
  [3533, 73, 90, 9, "الأحزاب", "Al-Ahzaab", "The Clans", "Medinan"],
  [3606, 54, 58, 6, "سبأ", "Saba", "Sheba", "Meccan"],
  [3660, 45, 43, 5, "فاطر", "Faatir", "The Originator", "Meccan"],
  // 8
  [3705, 83, 41, 5, "يس", "Yaseen", "Yaseen", "Meccan"],
  [
    3788,
    182,
    56,
    5,
    "الصافات",
    "As-Saaffaat",
    "Those drawn up in Ranks",
    "Meccan",
  ],
  [3970, 88, 38, 5, "ص", "Saad", "The letter Saad", "Meccan"],
  // 7
  [4058, 75, 59, 8, "الزمر", "Az-Zumar", "The Groups", "Meccan"],
  [4133, 85, 60, 9, "غافر", "Al-Ghaafir", "The Forgiver", "Meccan"],
  [4218, 54, 61, 6, "فصّلت", "Fussilat", "Explained in detail", "Meccan"],
  // 6
  [4272, 53, 62, 5, "الشورى", "Ash-Shura", "Consultation", "Meccan"],
  [4325, 89, 63, 7, "الزخرف", "Az-Zukhruf", "Ornaments of gold", "Meccan"],
  [4414, 59, 64, 3, "الدّخان", "Ad-Dukhaan", "The Smoke", "Meccan"],
  [4473, 37, 65, 4, "الجاثية", "Al-Jaathiya", "Crouching", "Meccan"],
  // 5
  [4510, 35, 66, 4, "الأحقاف", "Al-Ahqaf", "The Dunes", "Meccan"],
  [4545, 38, 95, 4, "محمد", "Muhammad", "Muhammad", "Medinan"],
  [4583, 29, 111, 4, "الفتح", "Al-Fath", "The Victory", "Medinan"],
  [
    4612,
    18,
    106,
    2,
    "الحجرات",
    "Al-Hujuraat",
    "The Inner Apartments",
    "Medinan",
  ],
  [4630, 45, 34, 3, "ق", "Qaaf", "The letter Qaaf", "Meccan"],
  // 4
  [
    4675,
    60,
    67,
    3,
    "الذاريات",
    "Adh-Dhaariyat",
    "The Winnowing Winds",
    "Meccan",
  ],
  [4735, 49, 76, 2, "الطور", "At-Tur", "The Mount", "Meccan"],
  [4784, 62, 23, 3, "النجم", "An-Najm", "The Star", "Meccan"],
  [4846, 55, 37, 3, "القمر", "Al-Qamar", "The Moon", "Meccan"],
  [4901, 78, 97, 3, "الرحمن", "Ar-Rahmaan", "The Beneficent", "Medinan"],
  [4979, 96, 46, 3, "الواقعة", "Al-Waaqia", "The Inevitable", "Meccan"],
  [5075, 29, 94, 4, "الحديد", "Al-Hadid", "The Iron", "Medinan"],
  // 3
  [
    5104,
    22,
    105,
    3,
    "المجادلة",
    "Al-Mujaadila",
    "The Pleading Woman",
    "Medinan",
  ],
  [5126, 24, 101, 3, "الحشر", "Al-Hashr", "The Exile", "Medinan"],
  [
    5150,
    13,
    91,
    2,
    "الممتحنة",
    "Al-Mumtahana",
    "She that is to be examined",
    "Medinan",
  ],
  [5163, 14, 109, 2, "الصف", "As-Saff", "The Ranks", "Medinan"],
  [5177, 11, 110, 2, "الجمعة", "Al-Jumu'a", "Friday", "Medinan"],
  [
    5188,
    11,
    104,
    2,
    "المنافقون",
    "Al-Munaafiqoon",
    "The Hypocrites",
    "Medinan",
  ],
  [
    5199,
    18,
    108,
    2,
    "التغابن",
    "At-Taghaabun",
    "Mutual Disillusion",
    "Medinan",
  ],
  [5217, 12, 99, 2, "الطلاق", "At-Talaaq", "Divorce", "Medinan"],
  [5229, 12, 107, 2, "التحريم", "At-Tahrim", "The Prohibition", "Medinan"],
  // 2
  [5241, 30, 77, 2, "الملك", "Al-Mulk", "The Sovereignty", "Meccan"],
  [5271, 52, 2, 2, "القلم", "Al-Qalam", "The Pen", "Meccan"],
  [5323, 52, 78, 2, "الحاقة", "Al-Haaqqa", "The Reality", "Meccan"],
  [
    5375,
    44,
    79,
    2,
    "المعارج",
    "Al-Ma'aarij",
    "The Ascending Stairways",
    "Meccan",
  ],
  [5419, 28, 71, 2, "نوح", "Nooh", "Noah", "Meccan"],
  [5447, 28, 40, 2, "الجن", "Al-Jinn", "The Jinn", "Meccan"],
  [5475, 20, 3, 2, "المزّمّل", "Al-Muzzammil", "The Enshrouded One", "Meccan"],
  [5495, 56, 4, 2, "المدّثر", "Al-Muddaththir", "The Cloaked One", "Meccan"],
  [5551, 40, 31, 2, "القيامة", "Al-Qiyaama", "The Resurrection", "Meccan"],
  [5591, 31, 98, 2, "الإنسان", "Al-Insaan", "Man", "Medinan"],
  [5622, 50, 33, 2, "المرسلات", "Al-Mursalaat", "The Emissaries", "Meccan"],
  // 1
  [5672, 40, 80, 2, "النبأ", "An-Naba", "The Announcement", "Meccan"],
  [
    5712,
    46,
    81,
    2,
    "النازعات",
    "An-Naazi'aat",
    "Those who drag forth",
    "Meccan",
  ],
  [5758, 42, 24, 1, "عبس", "Abasa", "He frowned", "Meccan"],
  [5800, 29, 7, 1, "التكوير", "At-Takwir", "The Overthrowing", "Meccan"],
  [5829, 19, 82, 1, "الإنفطار", "Al-Infitaar", "The Cleaving", "Meccan"],
  [5848, 36, 86, 1, "المطفّفين", "Al-Mutaffifin", "Defrauding", "Meccan"],
  [5884, 25, 83, 1, "الإنشقاق", "Al-Inshiqaaq", "The Splitting Open", "Meccan"],
  [5909, 22, 27, 1, "البروج", "Al-Burooj", "The Constellations", "Meccan"],
  [5931, 17, 36, 1, "الطارق", "At-Taariq", "The Morning Star", "Meccan"],
  [5948, 19, 8, 1, "الأعلى", "Al-A'laa", "The Most High", "Meccan"],
  [5967, 26, 68, 1, "الغاشية", "Al-Ghaashiya", "The Overwhelming", "Meccan"],
  [5993, 30, 10, 1, "الفجر", "Al-Fajr", "The Dawn", "Meccan"],
  [6023, 20, 35, 1, "البلد", "Al-Balad", "The City", "Meccan"],
  [6043, 15, 26, 1, "الشمس", "Ash-Shams", "The Sun", "Meccan"],
  [6058, 21, 9, 1, "الليل", "Al-Lail", "The Night", "Meccan"],
  [6079, 11, 11, 1, "الضحى", "Ad-Dhuhaa", "The Morning Hours", "Meccan"],
  [6090, 8, 12, 1, "الشرح", "Ash-Sharh", "The Consolation", "Meccan"],
  [6098, 8, 28, 1, "التين", "At-Tin", "The Fig", "Meccan"],
  [6106, 19, 1, 1, "العلق", "Al-Alaq", "The Clot", "Meccan"],
  [6125, 5, 25, 1, "القدر", "Al-Qadr", "The Power, Fate", "Meccan"],
  [6130, 8, 100, 1, "البينة", "Al-Bayyina", "The Evidence", "Medinan"],
  [6138, 8, 93, 1, "الزلزلة", "Az-Zalzala", "The Earthquake", "Medinan"],
  [6146, 11, 14, 1, "العاديات", "Al-Aadiyaat", "The Chargers", "Meccan"],
  [6157, 11, 30, 1, "القارعة", "Al-Qaari'a", "The Calamity", "Meccan"],
  [6168, 8, 16, 1, "التكاثر", "At-Takaathur", "Competition", "Meccan"],
  [6176, 3, 13, 1, "العصر", "Al-Asr", "The Declining Day, Epoch", "Meccan"],
  [6179, 9, 32, 1, "الهمزة", "Al-Humaza", "The Traducer", "Meccan"],
  [6188, 5, 19, 1, "الفيل", "Al-Fil", "The Elephant", "Meccan"],
  [6193, 4, 29, 1, "قريش", "Quraish", "Quraysh", "Meccan"],
  [6197, 7, 17, 1, "الماعون", "Al-Maa'un", "Almsgiving", "Meccan"],
  [6204, 3, 15, 1, "الكوثر", "Al-Kawthar", "Abundance", "Meccan"],
  [6207, 6, 18, 1, "الكافرون", "Al-Kaafiroon", "The Disbelievers", "Meccan"],
  [6213, 3, 114, 1, "النصر", "An-Nasr", "Divine Support", "Medinan"],
  [6216, 5, 6, 1, "المسد", "Al-Masad", "The Palm Fibre", "Meccan"],
  [6221, 4, 22, 1, "الإخلاص", "Al-Ikhlaas", "Sincerity", "Meccan"],
  [6225, 5, 20, 1, "الفلق", "Al-Falaq", "The Dawn", "Meccan"],
  [6230, 6, 21, 1, "النّاس", "An-Naas", "Mankind", "Meccan"],
  [6236, 1],
];

nCallBack.onConnect = (_api) => {
  // it will go here if the bot connected to the server successfully
  api = _api;
  console.log("Authenticated");
  logger.info("Authenticated");
};

nCallBack.onReceive = (incomingMsg) => {};

// implement other nandbox.Callback() as per your bot need
nCallBack.onReceiveObj = (obj) => {
  console.log("received object: ", obj);
  logger.info("received object: ", obj);
};
nCallBack.onClose = () => {
  console.log("ONCLOSE");
  logger.info("ONCLOSE");
};
nCallBack.onError = () => {
  console.log("ONERROR");
  logger.info("ONERROR");
};
nCallBack.onChatMenuCallBack = (chatMenuCallback) => {};
nCallBack.onInlineMessageCallback = (inlineMsgCallback) => {};
nCallBack.onMessagAckCallback = (msgAck) => {};
nCallBack.onUserJoinedBot = (user) => {};
nCallBack.onChatMember = (chatMember) => {};
nCallBack.onChatAdministrators = (chatAdministrators) => {};
nCallBack.userStartedBot = (user) => {};
nCallBack.onMyProfile = (user) => {};
nCallBack.onUserDetails = (user) => {};
nCallBack.userStoppedBot = (user) => {};
nCallBack.userLeftBot = (user) => {};
nCallBack.permanentUrl = (permenantUrl) => {};
nCallBack.onChatDetails = (chat) => {};

nCallBack.onInlineSearh = (inlineSearch) => {
  console.log("inline search id: " + inlineSearch.search_id);
  console.log("inline search offset: " + inlineSearch.offset);
  console.log("inline search chat id: " + inlineSearch.chat.id);
  console.log("inline search from id: " + inlineSearch.from.id);
  console.log("inline search keywords: " + inlineSearch.keywords);

  logger.info("inline search id: " + inlineSearch.search_id);
  logger.info("inline search offset: " + inlineSearch.offset);
  logger.info("inline search chat id: " + inlineSearch.chat.id);
  logger.info("inline search from id: " + inlineSearch.from.id);
  logger.info("inline search keywords: " + inlineSearch.keywords);

  if (!inlineSearch.keywords.empty && inlineSearch.keywords.trim() != "") {
    let inlineSearchAnswer = new InlineSearchAnswer();
    let results;
    let pageSize = 30;
    let maxOffset = "200";

    if (
      typeof inlineSearch.offset === "undefined" ||
      inlineSearch.offset == null ||
      inlineSearch.offset == "" ||
      inlineSearch.offset == maxOffset
    ) {
      getVersesFromDB(inlineSearch.keywords, 0, pageSize).then((res) => {
		console.log("+++++++resulst1: ", res);
		  
		inlineSearchAnswer.next_offset = "1";
        inlineSearchAnswer.results = res;
        inlineSearchAnswer.chat = new Chat(inlineSearch.chat);
        inlineSearchAnswer.chat.id = inlineSearch.chat.id;
        inlineSearchAnswer.to_user_id = inlineSearch.from.id;
        inlineSearchAnswer.search_id = inlineSearch.search_id;

        api.send(JSON.stringify(inlineSearchAnswer));
      });
    } else {
      let offset = parseInt(inlineSearch.offset);
      getVersesFromDB(inlineSearch.keywords, pageSize * offset, pageSize).then(
        (res) => {
		  console.log("+++++++resulst2: ", results);
			
		  inlineSearchAnswer.next_offset = "" + (offset + 1);
          inlineSearchAnswer.results = res;
          inlineSearchAnswer.chat = new Chat(inlineSearch.chat);
          inlineSearchAnswer.chat.id = inlineSearch.chat.id;
          inlineSearchAnswer.to_user_id = inlineSearch.from.id;
          inlineSearchAnswer.search_id = inlineSearch.search_id;

          api.send(JSON.stringify(inlineSearchAnswer));
        }
      );
    }
  }
};

client.connect(TOKEN, nCallBack);

let getVersesFromDB = (text, offset, count) => {
  let results = [];

  dbCallBack(text, offset, count, (err, row) => {
    let result = new Result();
    result.title = `${Sura[row.sura][4]} (${row.ayah})`;
    result.caption = "﴿" + `${row.text}` + "﴾";
    result.height = 10;
    result.width = 40;
    result.description = `${row.text}`;
    result.caption += "\n" + result.title + "\nShared via " + botName;

    results.push(result);

    logger.info(results, text);
  });

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(results);
    }, 1000);
  });
};

let dbCallBack = (text, offset, count, cb) => {
  let query = `select * from arabic_text where (ayah, sura) in
	(select ayah, sura from verses where text like "%${text}%" limit ${offset}, ${count})`;

  db.each(query, cb);
};
