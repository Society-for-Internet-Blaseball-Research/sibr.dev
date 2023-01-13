import { json } from "src/utils/feeds";

export async function get() {
    return {
        body: JSON.stringify(json)
    }
}