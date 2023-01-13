import { getFeed } from "src/utils/feeds";

export async function get() {
    return {
        body: (await getFeed()).atom1()
    }
}