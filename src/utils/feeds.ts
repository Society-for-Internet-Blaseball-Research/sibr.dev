import { Feed } from "feed";

interface Post {
    title: string
    authors: string[]
    date: string
    description: string
    tags: string[]
    path: string
}

export const getFeed = async () => {
    const blogfiles = await import.meta.glob("../pages/blog/*.md");

    const blogposts = await Promise.all(Object.entries(blogfiles).map(async ([path, resolver]: [string, any]) => {
        const { frontmatter } = await resolver();
        return {
            ...frontmatter,
            path,
        } as Post;
    }));

    const feed = new Feed({
        title: "SIBR Blog",
        description: "PLACEHOLDER",
        id: "https://sibr.dev",
        link: "https://sibr.dev/blog",
        language: "en",
        image: "https://sibr.dev/logo.svg",
        favicon: "https://sibr.dev/favicon.ico",
        copyright: "PLACEHOLDER",
        feedLinks: {
            json: "https://sibr.dev/feeds/json",
            atom: "https://sibr.dev/feeds/atom",
            rss: "https://sibr.dev/feeds/rss",
        },
        author: {
            name: "SIBR",
            email: "PLACEHOLDER",
            link: "https://sibr.dev",
        }
    });

    blogposts.forEach(post => {
        feed.addItem({
            title: post.title,
            id: post.path,
            link: post.path,
            description: post.description,
            author: post.authors.map(author => ({
                name: author
            })),
            date: new Date(post.date),
        })
    })

    return feed;
}