import { getFeed } from "src/utils/feeds";
import jsonfeedToRSS from "jsonfeed-to-rss";

export async function get() {
    return {
        body: jsonfeedToRSS(await getFeed("https://sibr.dev/feeds/rss.xml"))
    }
}