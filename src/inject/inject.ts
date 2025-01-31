import { addGPTButton, showErrorButton } from "./dom/add_gpt_button";
import { createObserver } from "./dom/create_observer";
import { findClosestInput } from "./dom/find_closest_input";
import { generateText } from "./utils/generate_text";
import { setInputText } from "./dom/set_input_text";
import { defaultLocale } from "../background/chat_gpt_client/locales";
const onToolBarAdded = (toolBarEl: Element) => {
    let inputEl = findClosestInput(toolBarEl);
    if (inputEl) {     
        addGPTButton(toolBarEl, async (type: string, topic?: string) => {
            (toolBarEl as HTMLDivElement).click();
            const replyToTweet = document.querySelector("article[data-testid=\"tweet\"][tabindex=\"-1\"]");
            let replyTo: string | undefined = undefined;
            if (!!replyToTweet) {
                const textEl = replyToTweet.querySelector("div[data-testid=\"tweetText\"]");
                if (!textEl || !textEl.textContent) {
                    showErrorButton(toolBarEl);
                    return;
                }

                replyTo = textEl.textContent;
            }
            // 1) Get the raw HTML:
            const parentHtml = replyToTweet?.innerHTML ?? "";

            // 2) Regex to capture text between `>@` and `<`
            const re = />@([\w\d_]+)</;
            const match = parentHtml.match(re);

            let replyHandle: string | undefined;
            if (match && match[1]) {
            // match[1] will be the substring after '@' (e.g. 'pmitu')
            replyHandle = `@${match[1]}`; // => e.g. '@pmitu'
            }

            const text = await generateText({
                locale: (await chrome.storage.local.get('language')).language ?? defaultLocale,
                type,
                replyTo,
                replyHandle,
                topic
            });
            if (text) {
                inputEl = findClosestInput(toolBarEl);
                if (inputEl) {
                    setInputText(inputEl, text);
                }
            } else { // show error
                showErrorButton(toolBarEl);
            }
        });
    }
}

const onToolBarRemoved = (toolBarEl: Element) => {}

// observe dom tree to detect all tweet inputs once they are created
const toolbarObserver = createObserver("div[data-testid=\"toolBar\"]", onToolBarAdded, onToolBarRemoved);
const reactRoot = document.querySelector("#react-root") as unknown as Node;
toolbarObserver.observe(reactRoot, { subtree: true, childList: true });