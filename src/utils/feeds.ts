interface Post {
    title: string
    authors: [{
        name: string
        url?: string
        avatar?: string
    }]
    date: string
    description: string
    tags: string[]
    path: string
    draft: Boolean
    image?: string
    alt?: string
    html_content: string
}

function pathToUrl(path: string){
    let url: string = path.replace("../pages","https://sibr.dev").replace(/\.[^.]+$/, "/")
    return url
}

export const getFeed = async (feed_url: string) => {
    const blogfiles = await import.meta.glob("../pages/blog/*.md");
    const blogposts = await Promise.all(Object.entries(blogfiles).map(async ([path, resolver]: [string, any]) => {
        const { frontmatter } = await resolver();
        const resolved = await resolver();

        return {
            ...frontmatter,
            path: pathToUrl(path),
            html_content: (await resolved.Content()).props.compiledContent()
        } as Post;
    }));

    const feed = {
        version:"https://jsonfeed.org/version/1",
        title: "SIBR Blog",
        description: "Blog posts from the Society for Internet Blaseball Research",
        home_page_url: "https://sibr.dev/blog",
        feed_url,
        language: "en",
        icon: "https://sibr.dev/logo.svg",
        favicon: "https://sibr.dev/favicon.ico",
        author: {
            name: "SIBR",
            url: "https://sibr.dev",
            avatar: "https://sibr.dev/logo.svg"
        },
        items: new Array()
    };
    
    blogposts
        .filter(post=>!post.draft)
        .sort((a, b) => {
            return new Date(b.date).valueOf() - new Date(a.date).valueOf();
        })
        .forEach(post => {
            feed.items.push({
                title: post.title,
                id: post.path,
                url: post.path,
                summary: post.description,
                //Because RSS doesn't support multiple authors, we select the first one. 
                author:  {name:post.authors.reduce((acumulated, author, index, array)=>{
                    return acumulated + author.name + (index < array.length-1 ? ", " : "")
                }, "")},
                //In jsonfeed, the authors field is prioritized over the author field.
                authors: post.authors.map((author)=>{
                    return {
                        name: author.name,
                        url: author.url ?? undefined,
                        avatar: author.avatar ?? undefined
                    }
                }),
                date_published: (new Date(post.date)).toISOString(),
                image: post.image ? post.image : undefined,
                tags: post.tags,
                content_html: post.html_content
            })
        })
    return feed;
}