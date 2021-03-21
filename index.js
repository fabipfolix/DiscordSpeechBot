//Set Environmental Variable: $env:GOOGLE_APPLICATION_CREDENTIALS="google-credentials.json"

const defaultTextChannelId = "356541605848809472";
const vipRoleId = "684027735496196138";
const botId = "822512777045999667";

let volume=100;
//////////////////////////////////////////
//////////////// LOGGING /////////////////
//////////////////////////////////////////
function getCurrentDateString() {
    return (new Date()).toISOString() + ' ::';
};
__originalLog = console.log;
console.log = function () {
    var args = [].slice.call(arguments);
    __originalLog.apply(console.log, [getCurrentDateString()].concat(args));
};
//////////////////////////////////////////
//////////////////////////////////////////



const fs = require('fs');
const util = require('util');
const path = require('path');
const request = require('request');
const { Readable } = require('stream');

//////////////////////////////////////////
///////////////// VARIA //////////////////
//////////////////////////////////////////

function necessary_dirs() {
    if (!fs.existsSync('./data/')){
        fs.mkdirSync('./data/');
    }
}
necessary_dirs()

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function convert_audio(input) {
    try {
        // stereo to mono channel
        const data = new Int16Array(input)
        const ndata = new Int16Array(data.length/2)
        for (let i = 0, j = 0; i < data.length; i+=4) {
            ndata[j++] = data[i]
            ndata[j++] = data[i+1]
        }
        return Buffer.from(ndata);
    } catch (e) {
        console.log(e)
        console.log('convert_audio: ' + e)
        throw e;
    }
}

/**
 * Converts a german written number to digits
 */
function convertToDigits(input){
    
    fs.readFile("zahlen.json", (error, content) => {
        if(!error){
        const numberMap = JSON.parse(content); 

        if(numberMap[input]!=undefined){
            console.log(input +" is the number "+numberMap[input]);
            return numberMap[input];
        }else
            return 50;
        } else {
            console.log("Error at reading File.");
            console.log(error);
        }
        
    });

}
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// CONFIG //////////////////
//////////////////////////////////////////

const SETTINGS_FILE = 'settings.json';

let DISCORD_TOK = null;
let WITAPIKEY = null; 
let SPOTIFY_TOKEN_ID = null;
let SPOTIFY_TOKEN_SECRET = null;

function loadConfig() {
    if (fs.existsSync(SETTINGS_FILE)) {
        const CFG_DATA = JSON.parse( fs.readFileSync(SETTINGS_FILE, 'utf8') );
        DISCORD_TOK = CFG_DATA.discord_token;
        WITAPIKEY = CFG_DATA.wit_ai_token;
        SPOTIFY_TOKEN_ID = CFG_DATA.spotify_token_id;
        SPOTIFY_TOKEN_SECRET = CFG_DATA.spotify_token_secret;
    } else {
        DISCORD_TOK = process.env.DISCORD_TOK;
        WITAPIKEY = process.env.WITAPIKEY;
        SPOTIFY_TOKEN_ID = process.env.SPOTIFY_TOKEN_ID;
        SPOTIFY_TOKEN_SECRET = process.env.SPOTIFY_TOKEN_SECRET;
    }
    if (!DISCORD_TOK || !WITAPIKEY)
        throw 'failed loading config #113 missing keys!'
    
}
loadConfig()


const https = require('https')
function listWitAIApps(cb) {
    const options = {
      hostname: 'api.wit.ai',
      port: 443,
      path: '/apps?offset=0&limit=100',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+WITAPIKEY,
      },
    }

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      });
      res.on('end',function() {
        cb(JSON.parse(body))
      })
    })

    req.on('error', (error) => {
      console.error(error)
      cb(null)
    })
    req.end()
}
function updateWitAIAppLang(appID, lang, cb) {
    const options = {
      hostname: 'api.wit.ai',
      port: 443,
      path: '/apps/' + appID,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+WITAPIKEY,
      },
    }
    const data = JSON.stringify({
      lang
    })

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      });
      res.on('end',function() {
        cb(JSON.parse(body))
      })
    })
    req.on('error', (error) => {
      console.error(error)
      cb(null)
    })
    req.write(data)
    req.end()
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


const Discord = require('discord.js')
const DISCORD_MSG_LIMIT = 2000;
const discordClient = new Discord.Client()
discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`)
})
discordClient.login(DISCORD_TOK)

const PREFIX = '$';
const _CMD_VOLUME_UP   = PREFIX + 'volume+';
const _CMD_VOLUME_DOWN = PREFIX + 'volume-';
const _CMD_VOLUME      = PREFIX + 'volume';
const _CMD_HELP        = PREFIX + 'help';
const _CMD_JOIN        = PREFIX + 'join';
const _CMD_LEAVE       = PREFIX + 'leave';
const _CMD_PLAY        = PREFIX + 'play';
const _CMD_PAUSE       = PREFIX + 'pause';
const _CMD_RESUME      = PREFIX + 'resume';
const _CMD_SHUFFLE     = PREFIX + 'shuffle';
const _CMD_FAVORITE    = PREFIX + 'favorite';
const _CMD_UNFAVORITE  = PREFIX + 'unfavorite';
const _CMD_FAVORITES   = PREFIX + 'favorites';
const _CMD_GENRE       = PREFIX + 'genre';
const _CMD_GENRES      = PREFIX + 'genres';
const _CMD_CLEAR       = PREFIX + 'clear';
const _CMD_RANDOM      = PREFIX + 'random';
const _CMD_SKIP        = PREFIX + 'skip';
const _CMD_QUEUE       = PREFIX + 'list';
const _CMD_DEBUG       = PREFIX + 'debug';
const _CMD_TEST        = PREFIX + 'hello';
const _CMD_LANG        = PREFIX + 'lang';
const PLAY_CMDS = [_CMD_PLAY, _CMD_PAUSE, _CMD_RESUME, _CMD_SHUFFLE, _CMD_SKIP, _CMD_GENRE, _CMD_GENRES, _CMD_RANDOM, _CMD_CLEAR, _CMD_QUEUE, _CMD_FAVORITE, _CMD_FAVORITES, _CMD_UNFAVORITE, _CMD_VOLUME, _CMD_VOLUME_UP,  _CMD_VOLUME_DOWN];

const EMOJI_GREEN_CIRCLE = '🟢'
const EMOJI_RED_CIRCLE = '🔴'

const GENRES = {
    'hip-hop': ['hip-hop', 'hip hop', 'hiphop', 'rap'],
    'rock': ['rock'],
    'dance': ['dance'],
    'trance': ['techno'],
    'trance': ['trance'],
    'groove': ['groove'],
    'classical': ['classical'],
    'techno': ['techno'],

}

const guildMap = new Map();

//Message Event
discordClient.on('message', async (msg) => {
    try {
        if (!('guild' in msg) || !msg.guild) return; // prevent private messages to bot
        
        const mapKey = msg.guild.id; //GuildId
        //!Join
        if (msg.content.trim().toLowerCase() == _CMD_JOIN) { 
            if (!msg.member.voice.channelID) { //Member in keinem Channel
                msg.reply('Error: please join a voice channel first.')
            } else {
                if (!guildMap.has(mapKey))
                    await connect(msg, mapKey) //Bot ruft connect mit aktueller Gilde und Msg auf
                else
                    msg.reply('Already connected')
            }

        //!Leave
        } else if (msg.content.trim().toLowerCase() == _CMD_LEAVE) { 
            if (guildMap.has(mapKey)) {
                let val = guildMap.get(mapKey);
                if (val.voice_Channel) val.voice_Channel.leave()
                if (val.voice_Connection) val.voice_Connection.disconnect()
                if (val.musicYTStream) val.musicYTStream.destroy()
                    guildMap.delete(mapKey)
                msg.reply("Disconnected.")
            } else {
                msg.reply("Cannot leave because not connected.")
            }
        }
        else if ( PLAY_CMDS.indexOf( msg.content.trim().toLowerCase().split('\n')[0].split(' ')[0] ) >= 0 ) { //erste Zeile der Nachricht und text vor erstem ' ' -> CMD 
            if (!msg.member.voice.channelID) {
                msg.reply('Error: please join a voice channel first.')
            } else {
                //connect if not in channel
                if (!guildMap.has(mapKey))
                    await connect(msg, mapKey)
                music_message(msg, mapKey);
            }
        } else if (msg.content.trim().toLowerCase() == _CMD_HELP) {
            msg.reply(getHelpString());
        }
        else if (msg.content.trim().toLowerCase() == _CMD_DEBUG) {
            console.log('toggling debug mode')
            let val = guildMap.get(mapKey);
            if (val.debug)
                val.debug = false;
            else
                val.debug = true;
        }
        else if (msg.content.trim().toLowerCase() == _CMD_TEST) {
            msg.reply('hello back =)')
        }
        else if (msg.content.split('\n')[0].split(' ')[0].trim().toLowerCase() == _CMD_LANG) {
            const lang = msg.content.replace(_CMD_LANG, '').trim().toLowerCase()
            listWitAIApps(data => {
              if (!data.length)
                return msg.reply('no apps found! :(')
              for (const x of data) {
                updateWitAIAppLang(x.id, lang, data => {
                  if ('success' in data)
                    msg.reply('succes!')
                  else if ('error' in data && data.error !== 'Access token does not match')
                    msg.reply('Error: ' + data.error)
                })
              }
            })
        }
    } catch (e) {
        console.log('discordClient message: ' + e)
        msg.reply('Error#180: Something went wrong, try again or contact the developers if this keeps happening.');
    }
})
/**
 * Builds help String containing information for all commands.
 * 
 * @returns string containing command information
 */
function getHelpString() {
    let out = '**VOICE COMMANDS:**\n'
        out += '```'
        out += 'musik hilfe\n'
        out += 'musik spiele [random/zufall, favorites/favoriten, <genre> or query]\n'
        out += 'musik skip/nächstes\n'
        out += 'musik stop/pause\n'
        out += 'musik resume/weiter\n'
        out += 'musik shuffle/zufall\n'
        out += 'musik genres\n'
        out += 'musik als favorit hinzufügen\n'
        out += 'musik favoriten\n'
        out += 'musik liste/schlange\n'
        out += 'musik leere schlange\n';
        out += '```'

        out += '**TEXT COMMANDS:**\n'
        out += '```'
        out += _CMD_HELP + '\n'
        out += _CMD_JOIN + '/' + _CMD_LEAVE + '\n'
        out += _CMD_PLAY + ' [query]\n'
        out += _CMD_GENRE + ' [name]\n'
        out += _CMD_RANDOM + '\n'
        out += _CMD_PAUSE + '/' + _CMD_RESUME + '\n'
        out += _CMD_SKIP + '\n'
        out += _CMD_SHUFFLE + '\n'
        out += _CMD_FAVORITE + '\n'
        out += _CMD_UNFAVORITE + ' [name]\n'
        out += _CMD_FAVORITES + '\n'
        out += _CMD_GENRES + '\n'
        out += _CMD_QUEUE + '\n';
        out += _CMD_CLEAR + '\n';
        out += '```';
    return out;
}

/**
 * Connects the Bot to the voicechannel of the message author.
 * 
 * @param {} msg text message that wants the bot to join
 * @param {*} mapKey guildId
 * @returns 
 */
async function connect(msg, mapKey) {
    try {
        //Fetch VoiceChannel of the message author
        let voice_Channel = await discordClient.channels.fetch(msg.member.voice.channelID);
        if (!voice_Channel) return msg.reply("Error: The voice channel does not exist!");
        let text_Channel = await discordClient.channels.fetch(msg.channel.id);
        if (!text_Channel) return msg.reply("Error: The text channel does not exist!");

        //Join the Voice Channel
        let voice_Connection = await voice_Channel.join();
        voice_Connection.play('sound.mp3', { volume: 0.01 * volume });
        //save session information
        guildMap.set(mapKey, {
            'text_Channel': text_Channel,
            'voice_Channel': voice_Channel,
            'voice_Connection': voice_Connection,
            'musicQueue': [],
            'musicDispatcher': null,
            'musicYTStream': null,
            'currentPlayingTitle': null,
            'currentPlayingQuery': null,
            'debug': false,
        });

        speak_impl(voice_Connection, mapKey) //Audio Handling
        
        //End of session
        voice_Connection.on('disconnect', async(e) => {
            if (e) console.log(e);
            guildMap.delete(mapKey);
        })
        msg.reply('connected!')
    } catch (e) {
        console.log('connect: ' + e)
        msg.reply('Error: unable to join your voice channel.');
        throw e;
    }
}
/**
 * Connects the Bot to the given voicechannel. 
 * 
 * @param {*} textChannelId id of the text channel for feedback
 * @param {*} voiceChannelId id of voice channel to connect to
 * @param {*} mapKey guildid
 */
async function connect(textChannelId, voiceChannelId, mapKey) {
    try {
        //Fetch VoiceChannel of the message author
        let voice_Channel = await discordClient.channels.fetch(voiceChannelId);
        let text_Channel = await discordClient.channels.fetch(textChannelId);

        //Join Channel
        let voice_Connection = await voice_Channel.join();
        voice_Connection.play('sound.mp3', { volume: 0.005*volume });

        //save session information
        guildMap.set(mapKey, {
            'text_Channel': text_Channel,
            'voice_Channel': voice_Channel,
            'voice_Connection': voice_Connection,
            'musicQueue': [],
            'musicDispatcher': null,
            'musicYTStream': null,
            'currentPlayingTitle': null,
            'currentPlayingQuery': null,
            'debug': false,
        });

        speak_impl(voice_Connection, mapKey) //Audio Handling

        //End of session
        voice_Connection.on('disconnect', async(e) => {
            if (e) console.log(e);
            guildMap.delete(mapKey);
        })

    } catch (e) {
        console.log('connect: ' + e)
        throw e;
    }
}
/**
 * Handles the audio listening and transcription with WitAI
 * 
 * @param {*} voice_Connection current Voice Connection object
 * @param {*} mapKey guildid
 */
function speak_impl(voice_Connection, mapKey) {
    voice_Connection.on('speaking', async (user, speaking) => {
        if (speaking.bitfield == 0 || user.bot) {
            return
        }
        console.log(`I'm listening to ${user.username}`)
        // this creates a 16-bit signed PCM, stereo 48KHz stream
        const audioStream = voice_Connection.receiver.createStream(user, { mode: 'pcm' })
        audioStream.on('error',  (e) => { 
            console.log('audioStream: ' + e)
        });
        let buffer = [];
        audioStream.on('data', (data) => {
            buffer.push(data)
        })
        audioStream.on('end', async () => {
            buffer = Buffer.concat(buffer)
            const duration = buffer.length / 48000 / 4;
            console.log("duration: " + duration)

            if (duration < 1.0 || duration > 19) { // 20 seconds max dur
                console.log("TOO SHORT / TOO LONG; SKPPING")
                return;
            }

            try {
                let new_buffer = await convert_audio(buffer)
                let out = await transcribe(new_buffer);

                if (out != null)
                    process_commands_query(out, mapKey, user.id);
            } catch (e) {
                console.log('tmpraw rename: ' + e)
            }


        })
    })
}

/**
 * Processes the voice commands to chat commands and invokes them
 *  
 * @param {*} query witai response
 * @param {*} mapKey guildid
 * @param {*} userid user that initiated the command
 */
function process_commands_query(query, mapKey, userid) {

    let out = null;
    
    let intent = query.intents[0].name; 
    let args;
    //Writes the Command in the Chat
    switch(intent) {
        case 'music_help':
            out = _CMD_HELP;
            break;
        case 'music_skip':
            out = _CMD_SKIP;
            break;
        case 'music_shuffle':
            out = _CMD_SHUFFLE;
            break;
        case 'music_genres':
            out = _CMD_GENRES;
            break;

        case 'music_pause':
            out = _CMD_PAUSE;
            break;
        case 'music_resume':
            out = _CMD_RESUME;
            break;
        case 'music_clear':
            out = _CMD_CLEAR;
            break;
        case 'music_queue':
            out = _CMD_QUEUE;
            break;
        case 'music_hello':
            out = 'hello back =)'
            break;
        case 'music_favorites':
            out = _CMD_FAVORITES;
            break;
        case 'music_setFavorite':
            out = _CMD_FAVORITE;
            break;
        case 'music_play_random':
            out = _CMD_RANDOM;
            break;
        case 'music_play_favorites':
            out = _CMD_PLAY + ' ' + 'favorites';
            break;
        case 'music_play':
            args = query.entities['song_query:song_query'][0].value;
            out = _CMD_PLAY + ' ' + args;
            break;
        case 'music_play_genres':
            for (let k of Object.keys(GENRES)) {
                if (GENRES[k].includes(args)) {
                    out = _CMD_GENRE + ' ' + k;
                }
            }
            break;
        case 'music_volume_up':
            out = _CMD_VOLUME_UP;
            break;
        case 'music_volume_down':
            out = _CMD_VOLUME_DOWN;
            break;
        case 'music_volume':
            let value;
            if(query.entities["wit$number:number"] !== undefined){
                value = query.entities['wit$number:number'][0].value;
            } else {
                return;
            }
            out = _CMD_VOLUME +" "+ value;
            break;
        }

        if (out == null)
            out = '<bad command: ' + query + '>';
    //}
    if (out != null && out.length) {
        // out = '<@' + userid + '>, ' + out;
        console.log('text_Channel out: ' + out)
        const val = guildMap.get(mapKey);
        val.text_Channel.send(out)
    }
}
/**
 * 
 * @param {*} message 
 * @param {*} mapKey 
 */
async function music_message(message, mapKey) {
    let replymsgs = [];
    const messes = message.content.split('\n');
    for (let mess of messes) {
        const args = mess.split(' ');

        if (args[0] == _CMD_PLAY && args.length) {
            const qry = args.slice(1).join(' ');
            if (qry == 'favorites') {
                // play guild's favorites
                if (mapKey in GUILD_FAVORITES) {
                    let arr = GUILD_FAVORITES[mapKey];
                    if (arr.length) {
                        for (let item of arr)     {
                            addToQueue(item, mapKey)
                        }
                        message.react(EMOJI_GREEN_CIRCLE)
                    } else {
                        message.channel.send('No favorites yet.')
                    }
                } else {
                    message.channel.send('No favorites yet.')
                }
            }
            else if (isSpotify(qry)) {
                try {
                    const arr = await spotify_tracks_from_playlist(qry);
                    console.log(arr.length + ' spotify items from playlist')
                    for (let item of arr)
                        addToQueue(item, mapKey);
                    message.react(EMOJI_GREEN_CIRCLE)
                } catch(e) {
                    console.log('music_message 464:' + e)
                    message.channel.send('Failed processing spotify link: ' + qry);
                }
            } else {

                if (isYoutube(qry) && isYoutubePlaylist(qry)) {
                    try {
                        const arr = await youtube_tracks_from_playlist(qry);
                        for (let item of arr)
                            addToQueue(item, mapKey)
                        message.react(EMOJI_GREEN_CIRCLE)
                    } catch (e) {
                        console.log('music_message 476:' + e)
                        message.channel.send('Failed to process playlist: ' + qry);
                    }
                } else {
                    try {
                        addToQueue(qry, mapKey);
                        message.react(EMOJI_GREEN_CIRCLE)
                    } catch (e) {
                        console.log('music_message 484:' + e)
                        message.channel.send('Failed to find video for (try again): ' + qry);
                    }
                }
            }
        } else if (args[0] == _CMD_SKIP) {

            skipMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_PAUSE) {

            pauseMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_RESUME) {

            resumeMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_SHUFFLE) {

            shuffleMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_CLEAR) {

            clearQueue(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_QUEUE) {

            const chunks = message_chunking(getQueueString(mapKey), DISCORD_MSG_LIMIT);
            for (let chunk of chunks) {
                console.log(chunk.length)
                message.channel.send(chunk);
            }
            message.react(EMOJI_GREEN_CIRCLE)

        } else if (args[0] == _CMD_RANDOM) {

            let arr = await spotify_new_releases();
            if (arr.length) {
                arr = shuffle(arr);
                // let item = arr[Math.floor(Math.random() * arr.length)];
                for (let item of arr)
                    addToQueue(item, mapKey);
                message.react(EMOJI_GREEN_CIRCLE)
            } else {
                message.channel.send('no results for random');
            }

        } else if (args[0] == _CMD_GENRES) {

            let out = "------------ genres ------------\n";
            for (let g of Object.keys(GENRES)) {
                out += g + '\n'
            }
            out += "--------------------------------\n";
            const chunks = message_chunking(out, DISCORD_MSG_LIMIT);
            for (let chunk of chunks)
                message.channel.send(chunk);

        } else if (args[0] == _CMD_GENRE) {

            const genre = args.slice(1).join(' ').trim();
            let arr = await spotify_recommended(genre);
            if (arr.length) {
                arr = shuffle(arr);
                // let item = arr[Math.floor(Math.random() * arr.length)];
                for (let item of arr)
                    addToQueue(item, mapKey);
                message.react(EMOJI_GREEN_CIRCLE)
            } else {
                message.channel.send('no results for genre: ' + genre);
            }

        } else if (args[0] == _CMD_FAVORITES) {
            const favs = getFavoritesString(mapKey);
            if (!(mapKey in GUILD_FAVORITES) || !GUILD_FAVORITES[mapKey].length)
                message.channel.send('No favorites to play.')
            else {
                const chunks = message_chunking(favs, DISCORD_MSG_LIMIT);
                for (let chunk of chunks)
                    message.channel.send(chunk);
                message.react(EMOJI_GREEN_CIRCLE)
            }

        } else if (args[0] == _CMD_FAVORITE) {

            setAsFavorite(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=> {
                if (msg && msg.length) message.channel.send(msg);
            })

        }  else if (args[0] == _CMD_UNFAVORITE) {

            const qry = args.slice(1).join(' ');
            unFavorite(qry, mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_VOLUME_UP) {
            volume += 10;

        } else if (args[0] == _CMD_VOLUME_DOWN) {
            volume -= 10;

        } else if (args[0] == _CMD_VOLUME) {
            const value = args.slice(1,2)[0].trim(); //erstes Argument
            volume = value;
        }

    }
    
    queueTryPlayNext(mapKey, (title)=>{
        message.react(EMOJI_GREEN_CIRCLE);
        message.channel.send('Now playing: **' + title + '**')
    }, (msg)=>{
        if (msg && msg.length) message.channel.send(msg);
    });
}

let GUILD_FAVORITES = {};
const GUILD_FAVORITES_FILE = './data/guild_favorites.json';
setInterval(()=>{
    var json = JSON.stringify(GUILD_FAVORITES);
    fs.writeFile(GUILD_FAVORITES_FILE, json, 'utf8', (err)=>{
        if (err) return console.log('GUILD_FAVORITES_FILE:' + err);
    });
},1000);
function load_guild_favorites() {
    if (fs.existsSync(GUILD_FAVORITES_FILE)) {
        const data = fs.readFileSync(GUILD_FAVORITES_FILE, 'utf8');
        GUILD_FAVORITES = JSON.parse(data);
    }
}
load_guild_favorites();

function setAsFavorite(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle || !val.currentPlayingQuery)
        cberr('Nothing playing at the moment.')
    else {
        if (!(mapKey in GUILD_FAVORITES)) {
            GUILD_FAVORITES[mapKey] = [];
        }
        if (!GUILD_FAVORITES[mapKey].includes(val.currentPlayingQuery))
            GUILD_FAVORITES[mapKey].push( val.currentPlayingQuery )
        cbok()
    }
}
function unFavorite(qry, mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!qry || !qry.length)
        cberr('Invalid query.');
    else {
        if (!(mapKey in GUILD_FAVORITES)) {
            cberr('No favorites.');
        } else {
            if (GUILD_FAVORITES[mapKey].includes(qry)) {
                GUILD_FAVORITES[mapKey] = GUILD_FAVORITES[mapKey].filter(e => e !== qry); 
                cbok()
            } else {
                cberr('Favorite not found.');
            }
        }
    }
}

function getFavoritesString(mapKey) {
    let out = "------------ favorites ------------\n";
    if (mapKey in GUILD_FAVORITES) {
        let arr = GUILD_FAVORITES[mapKey];
        if (arr.length) {
            for (let item of arr)     {
                out += item + '\n';
            }
        } else {
            out += '(empty)\n'
        }
    } else {
        out += '(empty)\n'
    }
    out += "-----------------------------------\n";
    return out;
}

function message_chunking(msg, MAXL) {
    const msgs = msg.split('\n');
    const chunks = [];

    let outmsg = '';
    while (msgs.length) {
        let a = msgs.shift() + '\n';
        if (a.length > MAXL) {
            console.log(a)
            throw new Error('error#418: max single msg limit');
        }

        if ((outmsg + a + 6).length <= MAXL) {
            outmsg += a;
        } else {
            chunks.push('```' + outmsg + '```')
            outmsg = ''
        }
    }
    if (outmsg.length) {
        chunks.push('```' + outmsg + '```')
    }
    return chunks;
}

function getQueueString(mapKey) {
    let val = guildMap.get(mapKey);
    let _message = "------------ queue ------------\n";
    if (val.currentPlayingTitle != null)
        _message += '[X] ' + val.currentPlayingTitle + '\n';
    for (let i = 0; i < val.musicQueue.length; i++) {
        _message += '['+i+'] ' + val.musicQueue[i] + '\n';
    }
    if (val.currentPlayingTitle == null && val.musicQueue.length == 0)
        _message += '(empty)\n'
    _message += "---------------------------------\n";
    return _message;
}

async function queueTryPlayNext(mapKey, cbok, cberr) {
    try {
        let val = guildMap.get(mapKey);
        if (!val) {
            console.log('mapKey: ' + mapKey + ' no longer in guildMap')
            return
        }

        if (val.musicQueue.length == 0)
            return;
        if (val.currentPlayingTitle)
            return;

        const qry = val.musicQueue.shift();
        const data = await getYoutubeVideoData(qry)
        const ytid = data.id;
        const title = data.title;

        // lag or stuttering? try this first!
        // https://groovy.zendesk.com/hc/en-us/articles/360023031772-Laggy-Glitchy-Distorted-No-Audio
        val.currentPlayingTitle = title;
        val.currentPlayingQuery = qry;
        val.musicYTStream = ytdl('https://www.youtube.com/watch?v=' + ytid, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1024*1024*10, // 10mb
        }, {highWaterMark: 1})
        val.musicDispatcher = val.voice_Connection.play(val.musicYTStream);
        val.musicDispatcher.on('finish', () => {
            val.currentPlayingTitle = val.currentPlayingQuery = null;
            queueTryPlayNext(mapKey, cbok, cberr);
        });
        val.musicDispatcher.on('error', (err) => {
            if (err) console.log('musicDispatcher error: ' + err);
            console.log(err)
            cberr('Error playing <'+title+'>, try again?')
            val.currentPlayingTitle = val.currentPlayingQuery = null;
            queueTryPlayNext(mapKey, cbok, cberr);
        });
        val.musicDispatcher.on('start', () => {
            cbok(title)
        });
        
    } catch (e) {
        console.log('queueTryPlayNext: ' + e)
        cberr('Error playing, try again?')
        if (typeof val !== 'undefined') {
            val.currentPlayingTitle = val.currentPlayingQuery = null;
            if (val.musicDispatcher) val.musicDispatcher.end();
        }
    }

}

function addToQueue(title, mapKey) {
    let val = guildMap.get(mapKey);
    if (val.currentPlayingTitle == title || val.currentPlayingQuery == title || val.musicQueue.includes(title)) {
        console.log('duplicate prevented: ' + title)
    } else {
        val.musicQueue.push(title);
    }
}


function skipMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle) {
        cberr('Nothing to skip');
    } else {
        if (val.musicDispatcher) val.musicDispatcher.end();
        cbok()
    }
}

function pauseMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle) {
        cberr('Nothing to pause');
    } else {
        if (val.musicDispatcher) val.musicDispatcher.pause();
        cbok()
    }
}

function resumeMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle) {
        cberr('Nothing to resume');
    } else {
        if (val.musicDispatcher) val.musicDispatcher.resume();
        cbok()
    }
}

function clearQueue(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    val.musicQueue = [];
    if (val.musicDispatcher) val.musicDispatcher.end();
    cbok()
}

function shuffleMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    val.musicQueue = shuffle(val.musicQueue);
    cbok()
}


//////////////////////////////////////////
//////////////// SPEECH //////////////////
//////////////////////////////////////////
async function transcribe(buffer) {
  console.log("-----------------1");
  return transcribe_witai(buffer)
  // return transcribe_gspeech(buffer)
}

// WitAI
let witAI_lastcallTS = null;
const witClient = require('node-witai-speech');
async function transcribe_witai(buffer) {
    try {
        // ensure we do not send more than one request per second
        if (witAI_lastcallTS != null) {
            let now = Math.floor(new Date());    
            while (now - witAI_lastcallTS < 1000) {
                console.log('sleep')
                await sleep(100);
                now = Math.floor(new Date());
            }
        }
    } catch (e) {
        console.log('transcribe_witai 837:' + e)
    }

    try {
        console.log('transcribe_witai')
        const extractSpeechIntent = util.promisify(witClient.extractSpeechIntent);
        var stream = Readable.from(buffer);
        const contenttype = "audio/raw;encoding=signed-integer;bits=16;rate=48k;endian=little"
        const output = await extractSpeechIntent(WITAPIKEY, stream, contenttype)
        witAI_lastcallTS = Math.floor(new Date());
        console.log(output)
    

        stream.destroy()
        /*
        if (output && '_text' in output && output._text.length)
            return output._text
        if (output && 'text' in output && output.text.length)
            return output.text
            */
        return output;
    } catch (e) { console.log('transcribe_witai 851:' + e); console.log(e) }
}

// Google Speech API
// https://cloud.google.com/docs/authentication/production
const gspeech = require('@google-cloud/speech');
const gspeechclient = new gspeech.SpeechClient({
  projectId: 'discordbot',
  keyFilename: 'gspeech_key.json'
});

async function transcribe_gspeech(buffer) {
  try {
      console.log('transcribe_gspeech')
      const bytes = buffer.toString('base64');
      const audio = {
        content: bytes,
      };
      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 48000,
        languageCode: 'en-US',  // https://cloud.google.com/speech-to-text/docs/languages
      };
      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await gspeechclient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log(`gspeech: ${transcription}`);
      return transcription;

  } catch (e) { console.log('transcribe_gspeech 368:' + e) }
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// YOUTUBE /////////////////
//////////////////////////////////////////
let YT_CACHE = {};
const ytdl = require('ytdl-core');
const getYoutubeID = require('get-youtube-id');
const ytlist = require('youtube-playlist');
const yts = util.promisify(require('yt-search'))

async function searchYoutubeVideo(query) {
    const r = await yts(query);
    try {
        const videos = r.videos
        if (!videos.length) {
            console.log(query)
            throw new Error('videos empty array')
        }
        const playlists = r.playlists || r.lists
        const channels = r.channels || r.accounts
        return {id:videos[0].videoId, title:videos[0].title};
    } catch (e) {
        console.log(r)
        console.log('searchYoutubeVideo: ' + e)
        throw e;
    }
}

function isYoutube(str) {
    return str.toLowerCase().indexOf('youtube.com') > -1;
}
function isYoutubePlaylist(str) {
    return str.toLowerCase().indexOf('?list=') > -1 || str.toLowerCase().indexOf('&list=') > -1;
}

async function youtube_tracks_from_playlist(url, isretry=false) {
    const data = await ytlist(url, 'url');
    if (data && 'data' in data && 'playlist' in data.data && data.data.playlist && data.data.playlist.length) {
        return data.data.playlist
    } else {
        if (!isretry) {
            console.log('retrying yt playlist processing')
            return await youtube_tracks_from_playlist(url, true);
        } else {
            return null;
        }
    }
}

async function getYoutubeVideoData(str, isretry=false) {
    try {
        if (str in YT_CACHE) {
            const val = YT_CACHE[str];
            let now = Math.floor(new Date());
            const dt = now - val.created;
            if (dt < 1000*60*60*24*14) { // 14 days ttl
                console.log('cache hit: ' + str)
                return {id:val.id, title:val.title};
            } else {
                console.log('cache expired: ' + str)
            }
        } else {
            console.log('cache miss: ' + str)
        }

        let qry = str;
        if (isYoutube(str))
            qry = getYoutubeID(str);

        const data = await searchYoutubeVideo(qry);
        if (data && 'id' in data && 'title' in data) {
            YT_CACHE[str] = {id:data.id, title:data.title, created: Math.floor(new Date())};
        }
        return data;
    } catch (e) {
        if (!isretry) {
            console.log('2nd attempt')
            return getYoutubeVideoData(str, true);
        } else {
            console.log('getYoutubeVideoData: ' + e)
            throw new Error('unable to obtain video data');
        }
    }
}

const YT_CACHE_FILE = './data/yt_cache.json';
setInterval(()=>{
    var json = JSON.stringify(YT_CACHE);
    fs.writeFile(YT_CACHE_FILE, json, 'utf8', (err)=>{
        if (err) return console.log('YT_CACHE_FILE: ' + err);
    });
},1000);
function load_yt_cache() {
    if (fs.existsSync(YT_CACHE_FILE)) {
        const data = fs.readFileSync(YT_CACHE_FILE, 'utf8');
        YT_CACHE = JSON.parse(data);
    }
}
load_yt_cache();
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// SPOTIFY /////////////////
//////////////////////////////////////////
const Spotify = require('node-spotify-api');
const spotifyClient = new Spotify({
    id: SPOTIFY_TOKEN_ID,
    secret: SPOTIFY_TOKEN_SECRET
});
/**
 * Checks if a url is a spotify url
 * @param {String} str an url
 * @returns true if is a spotify url
 */
function isSpotify(str) {
    return str.toLowerCase().indexOf('spotify.com') > -1;
}
/**
 * Extracts the spotify trackname with title and artist
 * @param {*} item spotify track
 * @returns String with trackname
 */
function spotify_extract_trackname(item) {
    if ('artists' in item) {
        let name = '';
        for (let artist of item.artists) {
            name += ' ' + artist.name;
        }

        let title = item.name;
        let track = title + ' ' + name
        return track;
    } else if ('track' in item && 'artists' in item.track) {
        return spotify_extract_trackname(item.track);
    }
}
/**
 * Fetches Spotifys new releases as array of titles
 * @returns array of song titles
 */
async function spotify_new_releases() {

    let arr = await spotifyClient
        .request('https://api.spotify.com/v1/browse/new-releases')
        .then(function(data) {
            let arr = [];
            if ('albums' in data) {
                for (let item of data.albums.items) {
                    let track = spotify_extract_trackname(item)
                    arr.push(track)
                }
            }
            return arr;
        })
        .catch(function(err) {
            console.error('spotify_new_releases: ' + err);
        });

    return arr;
}
/**
 * Fetches the spotify recommendations for a given genre
 * 
 * @param {String} genre spotify genre
 * @returns array of song names
 */
async function spotify_recommended(genre) {

    let arr = await spotifyClient
        .request('https://api.spotify.com/v1/recommendations?seed_genres=' + genre)
        .then(function(data) {
            let arr = [];
            if ('tracks' in data) {
                for (let item of data.tracks) {
                    let track = spotify_extract_trackname(item)
                    arr.push(track)
                }
            }
            return arr;
        })
        .catch(function(err) {
            console.error('spotify_recommended: ' + err);
        });

    return arr;
}
/**
 * Transforms a spotify playlist link to an array of titles of the songs
 * 
 * @param {String} spotifyurl url of spotify playlist
 * @returns array with song names
 */
async function spotify_tracks_from_playlist(spotifyurl) {

    const regex = /\/playlist\/(.+?)(\?.+)?$/;
    const found = spotifyurl.match(regex);
    const url = 'https://api.spotify.com/v1/playlists/' + found[1] + '/tracks';
    console.log(url)
    let arr = await spotifyClient
        .request(url)
        .then(function(data) {
            let arr = [];
            if ('items' in data) {
                for (let item of data.items) {
                    let track = spotify_extract_trackname(item)
                    arr.push(track)
                }
            }
            return arr;
        })
        .catch(function(err) {
            console.error('spotify_tracks_from_playlist: ' + err);
        });

    return arr;
}
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
///////////// TEXT TO SPEECH /////////////
//////////////////////////////////////////

/**
 * VoiceStateUpdateListener.
 * 
 * Says Hello/Bye to every user joining or leaving the channel.
 * Follows the last member in channel.
 * Leaves the channel if the last member left.
 * Joins VIPs if they join something.
 */
discordClient.on('voiceStateUpdate', async (oldState, newState) => {
    if(newState.member.id==botId){ //ID of the Bot
        return;
    }

    let newChannel = newState.channel;
    let oldChannel = oldState.channel;

    //Fetches Type of Event
    let type = getVoiceStateUpdateType(oldState,newState); 
    console.log("VoiceStateUpdate: " +newState.member.displayName +" : " +type);

    let mapKey=newState.member.voice.guild.id;

    
    //follow VIPs if not in a channel
    if (!guildMap.has(mapKey)){
        if(newState.member.roles.hoist.id==vipRoleId)
            await connect(defaultTextChannelId,newState.member.voice.channelID,mapKey);//musicbot textchannelid, 
        else
            return;
    }
    //Voice Information 
    let val = guildMap.get(mapKey);

    
    if(guildMap.get(mapKey)["currentPlayingTitle"] !== null){
        console.log("Ignoring Event because music is playing");
        return;
    }

    //Build String
    let out;
    switch(type){
        case 'join':
            //Cancel if user joined another channel
            if(newChannel!=val.voice_Channel)
                return;

            out = "Hallo "+newState.member.displayName;
            break;
        case 'leave':
            //Cancel if user joined another channel
            if(oldChannel!=val.voice_Channel)
                return;

            out = "Tschüss "+ oldState.member.displayName;
            //Leave channel if empty
            if(val.voice_Channel.members.size <= 1){
                if (val.voice_Channel) val.voice_Channel.leave();
                if (val.voice_Connection) val.voice_Connection.disconnect();
                if (val.musicYTStream) val.musicYTStream.destroy();
                console.log("Left Channel.");
            }
            break;
        case 'move':
            //TTS 
            if(oldChannel.id == val.voice_Channel.id){
                //Left the bots channel
                out = "Tschüss "+ oldState.member.displayName;

                //Follow last Member in Channel
                if(val.voice_Channel.members.size <= 1) { //Nur noch der Bot
                    await connect(defaultTextChannelId,newChannel.id, mapKey);
                    return;
                }

            } else if(newChannel.id == val.voice_Channel.id){
                //Moved in the bots channel
                out = "Hallo "+newState.member.displayName;
            } else{
                return; //in different channels
            }
            break;
        default:
            return; //mute/deaf-Event
    }
    
    let filename = "./temp/"+out.toLowerCase().replace(' ',"")+".mp3";
    
    //Call Google TTS API
    await synthesizeText(out,filename); 
    //play sound
    val.voice_Connection.play(filename, { volume: 0.01*volume*2 });
    
    
});

/**
 * Determines type of given VoiceStateUpdate.
 * Possible types are "join", "leave", "move", "mute", "unmute", "deaf", "undeaf"
 * 
 * @param {*} oldState Parameter of VoiceStateUpdateEvent
 * @param {*} newState Parameter of VoiceStateUpdateEvent
 * @returns String that contains type
 */
function getVoiceStateUpdateType(oldState, newState){
    let newChannel = newState.channel;
    let oldChannel = oldState.channel;

    if(oldChannel === null){
        return "join";
    } else if(newChannel === null){
        return "leave";
    } else if(oldChannel.id!=newChannel.id){
        return "move";
    } else if(newChannel.id == oldChannel.id){
        if (oldState.deaf!=newState.deaf){
            if(newState.deaf){
                return "deaf";
            } else{
                return "undeaf";
            }
        } else if (oldState.mute!=newState.mute){
            if(newState.mute){
                return "mute";
            } else{
                return "unmute";
            }
        }  
    }

}
/**
 * Uses Google Cloud Text To Speech API to synthesize Text to Speech and save it as the given file.
 * 
 * Authentication at GCP automatically with Env variable: GOOGLE_APPLICATION_CREDENTIALS and key
 * 
 * @param {} text String of Text to synthesize
 * @param {*} outputFile Path of the output file
 */
async function synthesizeText(text, outputFile) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const fs = require('fs');
    const util = require('util');
  
    const client = new textToSpeech.TextToSpeechClient();
  
    //Config of Request
    const request = {
      input: {text: text},
      voice: {
            languageCode: 'de-DE',
            ssmlGender: 'MALE',
            name: 'de-DE-Wavenet-F'
        },
      audioConfig: {audioEncoding: 'MP3'},
    };
    //Synthesize Speech
    const [response] = await client.synthesizeSpeech(request);
    //write File
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputFile, response.audioContent, 'binary');
}
