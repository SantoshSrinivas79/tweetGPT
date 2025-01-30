/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/utils/wait.ts
const wait = (timeout) => {
    return new Promise((res) => setTimeout(() => res(null), timeout));
};

;// CONCATENATED MODULE: ./src/inject/dom/add_gpt_button.ts

const gptIconSrc = chrome.runtime.getURL("icons/32.png");
const gptIconErrorSrc = chrome.runtime.getURL("icons/button_error.svg");
const tweetTypes = [
    { emoji: '👍', type: 'supportive' },
    { emoji: '😎', type: 'casual' },
    { emoji: '🎩', type: 'snarky' },
    { emoji: '🌤️', type: 'optimistic' },
    { emoji: '🔥', type: 'controversial' },
    { emoji: '🤩', type: 'excited' },
    { emoji: '🧠', type: 'smart' },
    { emoji: '🤠', type: 'hillbilly' },
    { emoji: '🏴‍☠️', type: 'pirate' },
    { emoji: '🤣', type: 'humorous' },
    { emoji: '🙄', type: 'passive aggressive' }
];
const addGPTButton = async (toolbarEl, onClick) => {
    addGPTButtonWithType(toolbarEl, onClick);
};
const maybeReturnTopic = async () => {
    const replyState = await chrome.storage.local.get('isAddTopicForReplies');
    const isAddTopicForReplies = replyState.isAddTopicForReplies ?? false;
    const lastState = await chrome.storage.local.get('lastTopic');
    const lastTopic = lastState.lastTopic ?? '';
    const replyToTweet = document.querySelector("article[data-testid=\"tweet\"][tabindex=\"-1\"]");
    let topic;
    if (!replyToTweet || isAddTopicForReplies) {
        topic = window.prompt("What do you want to tweet about?", lastTopic) || 'Twitter';
        await chrome.storage.local.set({ 'lastTopic': topic });
    }
    return topic;
};
const addGPTButtonWithType = (toolbarEl, onClick) => {
    const doc = new DOMParser().parseFromString(`
        <div class="gptIconWrapper" id="gptButton">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="9" width="3" height="5" rx="1" fill="#4B99E9"/>
<rect x="18" y="9" width="2" height="5" rx="1" fill="#4B99E9"/>
<path d="M4.05556 7.98608H16.1667C17.0641 7.98608 17.7917 8.71362 17.7917 9.61108V14.1111C17.7917 16.3893 15.9448 18.2361 13.6667 18.2361H6.55556C4.27738 18.2361 2.43056 16.3893 2.43056 14.1111V9.61108C2.43056 8.71362 3.15809 7.98608 4.05556 7.98608Z" stroke="#4B99E9" stroke-width="1.75"/>
<ellipse cx="6.11109" cy="11.7778" rx="1.66667" ry="2.22222" fill="#4B99E9"/>
<ellipse cx="14.3334" cy="11.7778" rx="1.66667" ry="2.22222" fill="#4B99E9"/>
<rect x="18" y="4" width="1" height="6" fill="#4B99E9" stroke="#4B99E9" stroke-width="0.3"/>
<rect x="1" y="4" width="1" height="6" fill="#4B99E9" stroke="#4B99E9" stroke-width="0.2"/>
<circle cx="1.5" cy="2.72217" r="1.5" fill="#4B99E9"/>
<circle cx="18.5" cy="2.5" r="1.5" fill="#4B99E9"/>
</svg>

        </div>
    `, "text/html");
    const iconWrap = doc.querySelector("div[id=\"gptButton\"]");
    const buttonContainer = toolbarEl.children[0];
    // attach to container
    buttonContainer.appendChild(iconWrap);
    iconWrap.onclick = async () => {
        const topic = await maybeReturnTopic();
        const bodyRect = document.body.getBoundingClientRect();
        const elemRect = iconWrap.getBoundingClientRect();
        const top = elemRect.top - bodyRect.top;
        const left = elemRect.left - bodyRect.left + 40;
        let optionsList;
        let dismissHandler;
        optionsList = createOptionsList(async (type) => {
            if (dismissHandler) {
                document.body.removeEventListener('click', dismissHandler);
            }
            if (optionsList) {
                optionsList.remove();
            }
            iconWrap.classList.add("loading");
            await onClick(type, topic);
            iconWrap.classList.remove("loading");
        });
        // adding settings button
        const separator = document.createElement("div");
        separator.classList.add("gptSeparator");
        optionsList.appendChild(separator);
        const item = document.createElement("div");
        item.classList.add("gptSelector");
        item.innerHTML = `⚙️&nbsp;&nbsp;Settings`;
        item.onclick = (e) => {
            e.stopPropagation();
            const url = chrome.runtime.getURL("assets/settings.html");
            window.open(url, '_blank')?.focus();
        };
        optionsList.appendChild(item);
        optionsList.style.left = `${left}px`;
        optionsList.style.top = `${top}px`;
        document.body.appendChild(optionsList);
        dismissHandler = () => {
            if (dismissHandler) {
                document.body.removeEventListener('click', dismissHandler);
            }
            if (optionsList) {
                optionsList.remove();
            }
        };
        window.setTimeout(() => {
            document.body.addEventListener('click', dismissHandler);
        }, 1);
    };
};
const createOptionsList = (onClick) => {
    const container = document.createElement("div");
    container.classList.add("gptSelectorContainer");
    for (const tt of tweetTypes) {
        const item = document.createElement("div");
        item.classList.add("gptSelector");
        item.innerHTML = `${tt.emoji}&nbsp;&nbsp;${tt.type}`;
        item.onclick = (e) => {
            e.stopPropagation();
            onClick(tt.type);
        };
        container.appendChild(item);
    }
    return container;
};
const showErrorButton = async (toolbarEl) => {
    const gptIcon = toolbarEl.querySelector(".gptIcon");
    if (gptIcon) {
        gptIcon.setAttribute("src", gptIconErrorSrc);
        gptIcon.classList.add("error");
    }
    await wait(5000);
    gptIcon?.setAttribute("src", gptIconSrc);
    gptIcon?.classList.remove("error");
};

;// CONCATENATED MODULE: ./src/inject/dom/create_observer.ts
const createObserver = (selector, onInputAdded, onInputRemoved) => {
    return new MutationObserver((mutations_list) => {
        mutations_list.forEach((mutation) => {
            const addedNodes = mutation.addedNodes; // wrong typings
            addedNodes.forEach((added_node) => {
                if (added_node.querySelector) {
                    const inputEl = added_node.querySelector(selector);
                    if (!!inputEl) {
                        onInputAdded(inputEl);
                    }
                    ;
                }
            });
            const removedNodes = mutation.removedNodes;
            removedNodes.forEach((removed_node) => {
                if (removed_node.querySelector) {
                    const inputEl = removed_node.querySelector(selector);
                    if (!!inputEl) {
                        onInputRemoved(inputEl);
                    }
                    ;
                }
            });
        });
    });
};

;// CONCATENATED MODULE: ./src/inject/dom/find_closest_input.ts
// can be more optimised, but ¯\_(ツ)_/¯, typically common container is just 2-3 levels higher
const findClosestInput = (el) => {
    const inputEl = el.querySelector("div[data-testid^=\"tweetTextarea_\"][role=\"textbox\"]");
    if (inputEl) {
        return inputEl;
    }
    if (!el.parentElement) {
        return null;
    }
    else {
        return findClosestInput(el.parentElement);
    }
};

;// CONCATENATED MODULE: ./src/inject/utils/generate_text.ts
const generateText = (props) => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'generate_tweet', props }, response => resolve(response));
    });
};

;// CONCATENATED MODULE: ./src/inject/dom/set_input_text.ts
const setInputText = async (inputEl, text) => {
    const textWrapper = inputEl.querySelector('[data-text="true"]')?.parentElement;
    if (textWrapper) {
        textWrapper.innerHTML = `<span data-text="true">${text}</span>`;
        textWrapper.dispatchEvent(new Event('input', { 'bubbles': true, 'cancelable': true }));
    }
};

;// CONCATENATED MODULE: ./src/background/chat_gpt_client/locales.ts
const locales = {
    "af-ZA": [
        "Afrikaans",
        "Afrikaans"
    ],
    "ar": [
        "العربية",
        "Arabic"
    ],
    "bg-BG": [
        "Български",
        "Bulgarian"
    ],
    "ca-AD": [
        "Català",
        "Catalan"
    ],
    "cs-CZ": [
        "Čeština",
        "Czech"
    ],
    "cy-GB": [
        "Cymraeg",
        "Welsh"
    ],
    "da-DK": [
        "Dansk",
        "Danish"
    ],
    "de-AT": [
        "Deutsch (Österreich)",
        "German (Austria)"
    ],
    "de-CH": [
        "Deutsch (Schweiz)",
        "German (Switzerland)"
    ],
    "de-DE": [
        "Deutsch (Deutschland)",
        "German (Germany)"
    ],
    "el-GR": [
        "Ελληνικά",
        "Greek"
    ],
    "en-GB": [
        "English (UK)",
        "English (UK)"
    ],
    "en-US": [
        "English (US)",
        "English (US)"
    ],
    "es-CL": [
        "Español (Chile)",
        "Spanish (Chile)"
    ],
    "es-ES": [
        "Español (España)",
        "Spanish (Spain)"
    ],
    "es-MX": [
        "Español (México)",
        "Spanish (Mexico)"
    ],
    "et-EE": [
        "Eesti keel",
        "Estonian"
    ],
    "eu": [
        "Euskara",
        "Basque"
    ],
    "fa-IR": [
        "فارسی",
        "Persian"
    ],
    "fi-FI": [
        "Suomi",
        "Finnish"
    ],
    "fr-CA": [
        "Français (Canada)",
        "French (Canada)"
    ],
    "fr-FR": [
        "Français (France)",
        "French (France)"
    ],
    "he-IL": [
        "עברית",
        "Hebrew"
    ],
    "hi-IN": [
        "हिंदी",
        "Hindi"
    ],
    "hr-HR": [
        "Hrvatski",
        "Croatian"
    ],
    "hu-HU": [
        "Magyar",
        "Hungarian"
    ],
    "id-ID": [
        "Bahasa Indonesia",
        "Indonesian"
    ],
    "is-IS": [
        "Íslenska",
        "Icelandic"
    ],
    "it-IT": [
        "Italiano",
        "Italian"
    ],
    "ja-JP": [
        "日本語",
        "Japanese"
    ],
    "km-KH": [
        "ភាសាខ្មែរ",
        "Khmer"
    ],
    "ko-KR": [
        "한국어",
        "Korean"
    ],
    "la": [
        "Latina",
        "Latin"
    ],
    "lt-LT": [
        "Lietuvių kalba",
        "Lithuanian"
    ],
    "lv-LV": [
        "Latviešu",
        "Latvian"
    ],
    "mn-MN": [
        "Монгол",
        "Mongolian"
    ],
    "nb-NO": [
        "Norsk bokmål",
        "Norwegian (Bokmål)"
    ],
    "nl-NL": [
        "Nederlands",
        "Dutch"
    ],
    "nn-NO": [
        "Norsk nynorsk",
        "Norwegian (Nynorsk)"
    ],
    "pl-PL": [
        "Polski",
        "Polish"
    ],
    "pt-BR": [
        "Português (Brasil)",
        "Portuguese (Brazil)"
    ],
    "pt-PT": [
        "Português (Portugal)",
        "Portuguese (Portugal)"
    ],
    "ro-RO": [
        "Română",
        "Romanian"
    ],
    "ru-RU": [
        "Русский",
        "Russian"
    ],
    "sk-SK": [
        "Slovenčina",
        "Slovak"
    ],
    "sl-SI": [
        "Slovenščina",
        "Slovenian"
    ],
    "sr-RS": [
        "Српски / Srpski",
        "Serbian"
    ],
    "sv-SE": [
        "Svenska",
        "Swedish"
    ],
    "th-TH": [
        "ไทย",
        "Thai"
    ],
    "tr-TR": [
        "Türkçe",
        "Turkish"
    ],
    "uk-UA": [
        "Українська",
        "Ukrainian"
    ],
    "ur-PK": [
        "اردو",
        "Urdu"
    ],
    "vi-VN": [
        "Tiếng Việt",
        "Vietnamese"
    ],
    "zh-CN": [
        "中文 (中国大陆)",
        "Chinese (PRC)"
    ],
    "zh-TW": [
        "中文 (台灣)",
        "Chinese (Taiwan)"
    ]
};
const defaultLocale = 'en-US';

;// CONCATENATED MODULE: ./src/inject/inject.ts






const onToolBarAdded = (toolBarEl) => {
    let inputEl = findClosestInput(toolBarEl);
    if (inputEl) {
        addGPTButton(toolBarEl, async (type, topic) => {
            toolBarEl.click();
            const replyToTweet = document.querySelector("article[data-testid=\"tweet\"][tabindex=\"-1\"]");
            let replyTo = undefined;
            if (!!replyToTweet) {
                const textEl = replyToTweet.querySelector("div[data-testid=\"tweetText\"]");
                if (!textEl || !textEl.textContent) {
                    showErrorButton(toolBarEl);
                    return;
                }
                replyTo = textEl.textContent;
            }
            const text = await generateText({
                locale: (await chrome.storage.local.get('language')).language ?? defaultLocale,
                type,
                replyTo,
                topic
            });
            if (text) {
                inputEl = findClosestInput(toolBarEl);
                if (inputEl) {
                    setInputText(inputEl, text);
                }
            }
            else { // show error
                showErrorButton(toolBarEl);
            }
        });
    }
};
const onToolBarRemoved = (toolBarEl) => { };
// observe dom tree to detect all tweet inputs once they are created
const toolbarObserver = createObserver("div[data-testid=\"toolBar\"]", onToolBarAdded, onToolBarRemoved);
const reactRoot = document.querySelector("#react-root");
toolbarObserver.observe(reactRoot, { subtree: true, childList: true });

/******/ })()
;