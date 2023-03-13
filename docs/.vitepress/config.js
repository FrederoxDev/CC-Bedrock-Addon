export default {
    title: 'CC: Bedrock',
    base: '/CC-Bedrock/',
    head: [
        ['link', { rel: 'icon', href: '/pack_icon.png' }]
    ],
    themeConfig: {
        logo: "/pack_icon.png",
        sidebar: [
            {
                text: "About",
                link: "/"
            },
            {
                text: "Structs",
                items: [
                    { text: 'Math', link: '/Math' },
                    { text: 'Thread', link: '/Thread' },
                    { text: 'PixelBuffer', link: '/PixelBuffer' },
                    { text: 'Display', link: '/Display' },
                ]
            }
        ]
    }
}