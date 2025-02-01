/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/background/chat_gpt_client/chat_gpt_client.ts
const GPT_TOKEN_NAME = 'openAIToken';
class ChatGPTClient {
    waitForTokenCallback;
    async generateTweet(props) {
        console.log(`In background.js of generateTweet`);
        const token = await this.getToken();
        if (!token) {
            return Promise.reject();
        }
        const systemMessage = `You are a ghostwriter for users tweets. Use locale "${props.locale}". Return only one tweet. Keep it short.`;
        const systemMessage2 = "Exclude everything after the tweet. Exclude hashtags. Exclude emojis. Don't apologize. Don't provide translation. Don't provide notes. Exclude сalls to action.";
        const systemMessage3 = "Don't sound patronizing or like a professor! Don't give advice. Don't give an action or recommendations";
        const systemMessage4 = "Strictly dont use phrases or sentences like Keep pushing, Keep shining, Keep enjoying the journey, Keep it up or anything other keeps.";
        const systemMessage5 = "Always address the user through his handle.";
        const systemMessage6 = "Add minor typing mistakes to look human. Try hard to limit to 10 words";
        const userMessage = `Write a ${props.type} tweet
                                ${props.topic ? ` about ${props.topic}` : ""}
                                ${props.replyHandle ? ` replying to ${props.replyHandle}` : ""}
                                ${props.replyTo ? ` whose tweet says "${props.replyTo}"` : ""}
                            `;
        const body = {
            stream: false,
            model: "deepseek-ai/DeepSeek-V3",
            messages: [
                { role: "system", content: systemMessage },
                { role: "system", content: systemMessage2 },
                { role: "system", content: systemMessage3 },
                { role: "system", content: systemMessage4 },
                { role: "system", content: systemMessage5 },
                { role: "system", content: systemMessage6 },
                { role: "user", content: userMessage },
            ],
        };
        try {
            const response = await fetch(`https://api.together.xyz/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (response.status === 403) {
                await chrome.storage.local.remove(GPT_TOKEN_NAME);
            }
            if (response.status !== 200) {
                console.error(response.body);
                chrome.notifications.create("TextGenerationError", {
                    type: 'basic',
                    iconUrl: "./icons/32.png",
                    title: 'Error',
                    message: JSON.stringify(response.body),
                    priority: 2,
                });
                return Promise.reject();
            }
            const responseJSON = await response.json();
            const tweet = responseJSON?.choices[0].message?.content || '';
            return tweet.trim()
                .replace(/^\"/g, "")
                .replace(/\"$/g, "")
                .trim();
        }
        catch (e) {
            console.error(e);
            return Promise.reject();
        }
    }
    getTextFromResponse(response) {
        const message = JSON.parse(response);
        let tweet = message?.message?.content?.parts[0] || '';
        tweet = tweet.trim().replace(/"([^"]*)[#"]?/g, '$1');
        return tweet;
    }
    async getToken() {
        const result = await chrome.storage.local.get(GPT_TOKEN_NAME);
        if (!result[GPT_TOKEN_NAME]) {
            let internalUrl = chrome.runtime.getURL("assets/settings.html");
            chrome.tabs.create({ url: internalUrl });
        }
        return result[GPT_TOKEN_NAME];
    }
}

;// CONCATENATED MODULE: ./src/background/background.ts

chrome.scripting.registerContentScripts([
    {
        id: `main_context_inject_${Math.random()}`,
        world: "ISOLATED",
        matches: ["https://twitter.com/*", "https://x.com/*"],
        js: ["lib/inject.js"],
        css: ["css/inject.css"],
    },
]);
chrome.runtime.onInstalled.addListener(function (object) {
    let internalUrl = chrome.runtime.getURL("assets/settings.html");
    chrome.tabs.create({ url: internalUrl });
});
const gptChat = new ChatGPTClient();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.type) {
        return;
    }
    switch (message.type) {
        case 'generate_tweet':
            gptChat.generateTweet(message.props).then(async (text) => {
                if (!text) {
                    return sendResponse(undefined);
                }
                let finalText = text;
                const savedSettings = await chrome.storage.local.get('isAddSignature');
                const isAddSignature = savedSettings.isAddSignature ?? true;
                if (isAddSignature) {
                    finalText = text + ' — DeepSeekGPT' + '\n' + 'Signup at: https://www.memedealer.fun/';
                }
                sendResponse(finalText);
            }, () => sendResponse(undefined));
            break;
    }
    return true;
});

/******/ })()
;