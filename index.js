var Bot = require('slackbots');
var fcodes = require("./fcodes.json");
//Create feature description index
var descriptions = {};
Object.keys(fcodes).forEach(function(k) {
    var v = fcodes[k];
    descriptions[v.desc.toLowerCase()] = {
        fcode: k,
        desc: v.desc,
        def: v.def,
        geom: v.geom,
        src: v.src
    }
});

// create a bot
var settings = {
    token: process.env.BOT_API_KEY,
    name: 'hootbot'
};
var bot = new Bot(settings);

bot.on('start', function() {
    bot.postMessageToChannel('hootenanny', 'hootbot in da house!');
});
bot.on('message', function(msg) {
    if (isDesktopNotification(msg) &&
        // isChannelConversation(msg) &&
        isHootChannel(msg) &&
        !isFromHootBot(msg) &&
        isMentioningHoot(msg)
    ) {
        doSomeTranslation(msg);
    }
});

function isChatMessage(msg) {
    return msg.type === 'message' && Boolean(msg.text);
}
function isDesktopNotification(msg) {
    return msg.type === 'desktop_notification' && Boolean(msg.content);
}
function isChannelConversation(msg) {
    return typeof msg.channel === 'string' &&
        msg.channel[0] === 'C';
}
function isFromHootBot(msg) {
    return msg.user === 'U41CY44JJ';
}
function isHootChannel(msg) {
    return msg.channel === 'C2BJ289CZ';
}
function isMentioningHoot(msg) {
    return msg.content.indexOf('@hootbot') > -1;
}
function stripPunctuation(str) {
    return str.replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g, '');
}
function doSomeTranslation(msg) {
    //parsing
    var featureBits = msg.content.toLowerCase().split(' fcode for ');
    var fcodeBits = msg.content.toLowerCase().split(' feature for fcode ');
    var featureDesc;
    var fcode;
    var answer;

    if (featureBits.length === 2) {
        featureDesc = stripPunctuation(featureBits[1]);
    } else if (fcodeBits.length === 2) {
        fcode = stripPunctuation(fcodeBits[1]).toUpperCase();
    } else {
        bot.postMessageToChannel('hootenanny', 'I can do lookups on feature codes...');
        bot.postMessageToChannel('hootenanny', 'Responding to messages such as `What\'s the fcode for road?`');
        bot.postMessageToChannel('hootenanny', 'Or `What\'s the feature for fcode AL375?`');
    }

    function responseTemplate(f) {
        return '\n'
                + '_' + f.def + '_'
                + '\n'
                + 'This feature code is valid for geometries '
                + f.geom.replace(/,/g, ', ') + ' in the following schemas: ' + f.src.replace(/,/g, ', ') + '.'
                + '\n';
    }

    //Get details about a feature
    if (featureDesc) {
        var f = descriptions[featureDesc.toLowerCase()];

        if (f) {
            answer = 'Feature "' + featureDesc + '" has FCode *' + f.fcode + '*.'
                    + responseTemplate(f);
        } else {

        }
    }

    //Get details about an fcode
    if (fcode) {
        var f = fcodes[fcode];

        if (f) answer = 'FCode "' + fcode + '" is a *' + f.desc + '*.'
                    + responseTemplate(f);

    }

    if (answer) {
        bot.postMessageToChannel('hootenanny', answer);
    } else {
        bot.postMessageToChannel('hootenanny', 'You stumped hootbot!');
    }
}
function gracefulShutdown() {
    bot.postMessageToChannel('hootenanny', 'hootbot out!').always(function() {
        bot.ws.close();
        process.exit();
    });
}

//listen for TERM signal e.g. kill
process.on('SIGTERM', gracefulShutdown);

//listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);
