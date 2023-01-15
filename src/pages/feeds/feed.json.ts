import { getFeed } from "src/utils/feeds";

export async function get() {
    return {
        body: JSON.stringify(await getFeed("https://sibr.dev/feeds/feed.json")),
    }
}