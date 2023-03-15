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
                    { text: 'Math', link: 'Structs/Math' },
                    { text: 'Thread', link: 'Structs/Thread' },
                    { text: 'PixelBuffer', link: 'Structs/PixelBuffer' },
                    { text: 'Display', link: 'Structs/Display' },
                ]
            },
            {
                text: "Enums",
                items: [
                    { text: "Color", link: "Enums/Color" }
                ]
            }
        ]
    }
}