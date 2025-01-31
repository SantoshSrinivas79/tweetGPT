const GPT_TOKEN_NAME = 'openAIToken';

export type TweetProps = {
    type: string,
    topic?: string,
    locale: string,
    replyTo?: string,
    replyHandle?: string,    
}

export class ChatGPTClient {
    waitForTokenCallback: ((newGptToken: string) => void) | undefined;
    async generateTweet(props: TweetProps): Promise<string | undefined> {
        console.log(`In background.js of generateTweet`);
        const token = await this.getToken();

        if (!token) {
            return Promise.reject();
        }

        const systemMessage = `You are a ghostwriter for users tweets. Use locale "${props.locale}". Return only one tweet. Keep it short.`;
        const systemMessage2 =
            "Exclude everything after the tweet. Exclude hashtags. Exclude emojis. Don't apologize. Don't provide translation. Don't provide notes. Exclude сalls to action.";
        const systemMessage3 = "Don't sound patronizing or like a professor! Don't give advice. Don't give an action or recommendations";
        const systemMessage4 = "Strictly dont use phrases or sentences like Keep pushing, Keep shining, Keep enjoying the journey, Keep it up or anything other keeps.";
        const systemMessage5 = "Always address the user through his handle.";
        const systemMessage6 = "Add minor typing mistakes to look human.";
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
                await chrome.storage.local.remove(GPT_TOKEN_NAME)
            }

            if (response.status !== 200) {
                console.error(response.body);
                chrome.notifications.create(
                    "TextGenerationError",
                    {
                      type: 'basic',
                      iconUrl: "./icons/32.png",
                      title: 'Error',
                      message: JSON.stringify(response.body),
                      priority: 2,
                    }
                  );
                return Promise.reject();
            }

            const responseJSON = await response.json();
            const tweet = responseJSON?.choices[0].message?.content || '';
            return tweet.trim()
                .replace(/^\"/g, "")
                .replace(/\"$/g, "")
                .trim();
        } catch(e) {
            console.error(e);
            return Promise.reject();
        }
    }

    getTextFromResponse(response: string): string {
        const message = JSON.parse(response);
        let tweet = message?.message?.content?.parts[0] || '';
        tweet = tweet.trim().replace(/"([^"]*)[#"]?/g, '$1');

        return tweet;
    }

    async getToken(): Promise<string | undefined> {
        const result = await chrome.storage.local.get(GPT_TOKEN_NAME);

        if (!result[GPT_TOKEN_NAME]) {
            let internalUrl = chrome.runtime.getURL("assets/settings.html");
            chrome.tabs.create({ url: internalUrl });
        }

        return result[GPT_TOKEN_NAME];
    }
}