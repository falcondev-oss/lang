/** Docs pages by section, shared by the sidebar and `llms.txt`. */
export const sections = [
  { key: 'start', label: 'Start here', items: ['getting-started', 'how-it-works'] },
  {
    key: 'guide',
    label: 'Guide',
    items: [
      'guide/texts',
      'guide/parameters',
      'guide/groups',
      'guide/reading-texts',
      'guide/zod',
      'guide/server',
      'guide/organizing',
    ],
  },
  { key: 'frameworks', label: 'Frameworks', items: ['frameworks/vue', 'frameworks/react'] },
  { key: 'reference', label: 'Reference', items: ['reference/api', 'reference/errors'] },
] as const satisfies { key: string; label: string; items: string[] }[]
