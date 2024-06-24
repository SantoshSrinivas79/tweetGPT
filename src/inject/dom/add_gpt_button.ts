import { wait } from "../../utils/wait";

const gptIconSrc = chrome.runtime.getURL("icons/32.png");
const gptIconErrorSrc = chrome.runtime.getURL("icons/button_error.svg");
const tweetTypes: Array<{ emoji: string; type: string; }> = [
    {emoji: '👍', type: 'supportive'}, 
    {emoji: '🎩', type: 'snarky'}, 
    {emoji: '🌤️', type: 'optimistic'},
    {emoji: '🔥', type: 'controversial'}, 
    {emoji: '🤩', type: 'excited'},
    {emoji: '🧠', type: 'smart'},
    {emoji: '🤠', type: 'hillbilly'},
    {emoji: '🏴‍☠️', type: 'pirate'},
    {emoji: '🤣', type: 'humorous'},
    {emoji: '🙄', type: 'passive aggressive'}
];

export const addGPTButton = async (toolbarEl: Element, onClick: (type: string, topic?: string) => Promise<void>) => {
    addGPTButtonWithType(toolbarEl, onClick);
}

const maybeReturnTopic = async (): Promise<string | undefined> => {
    const replyState = await chrome.storage.local.get('isAddTopicForReplies');
    const isAddTopicForReplies = replyState.isAddTopicForReplies ?? false;

    const lastState = await chrome.storage.local.get('lastTopic');
    const lastTopic = lastState.lastTopic ?? '';

    const replyToTweet = document.querySelector("article[data-testid=\"tweet\"][tabindex=\"-1\"]");

    let topic: string | undefined;

    if (!replyToTweet || isAddTopicForReplies) {
        topic = window.prompt("What do you want to tweet about?", lastTopic) || 'Twitter';
        await chrome.storage.local.set({'lastTopic': topic});
    }

    return topic;
}

const addGPTButtonWithType = (toolbarEl: Element, onClick: (type: string, topic?: string) => Promise<void>) => {
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
    const iconWrap = doc.querySelector("div[id=\"gptButton\"]")! as HTMLDivElement;

    const buttonContainer = toolbarEl.children[0];
    
    // attach to container
    buttonContainer.appendChild(iconWrap);

    iconWrap.onclick = async () => {
        const topic = await maybeReturnTopic();
        const bodyRect = document.body.getBoundingClientRect();
        const elemRect = iconWrap.getBoundingClientRect();

        const top   = elemRect.top - bodyRect.top;
        const left = elemRect.left - bodyRect.left + 40;
        let optionsList: HTMLDivElement;
        let dismissHandler: GlobalEventHandlers["onclick"];
        optionsList = createOptionsList(async (type: string) => {
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
            document.body.addEventListener('click', dismissHandler!);
        }, 1);
    }
}

const createOptionsList = (onClick: (type: string) => Promise<void>) => {
    const container = document.createElement("div");
    container.classList.add("gptSelectorContainer");

    for(const tt of tweetTypes) {
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
}

export const showErrorButton = async (toolbarEl: Element) => {
    const gptIcon = toolbarEl.querySelector(".gptIcon");
    if (gptIcon) {
        gptIcon.setAttribute("src", gptIconErrorSrc);
        gptIcon.classList.add("error");
    }
    await wait(5000);
    gptIcon?.setAttribute("src", gptIconSrc);
    gptIcon?.classList.remove("error");
}