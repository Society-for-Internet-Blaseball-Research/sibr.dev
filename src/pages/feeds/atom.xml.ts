import { getFeed } from "src/utils/feeds";
import jsonfeedToAtom from "jsonfeed-to-atom";

export async function get() {
    return {
        body: jsonfeedToAtom(await getFeed("https://sibr.dev/feeds/atom.xml"))
    }
}