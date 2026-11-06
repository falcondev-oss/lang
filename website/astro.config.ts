import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { createUseLang, LABELS, lang } from './src/i18n/lang'
import { translations } from './src/i18n/translations'
import { sections } from './src/sidebar'

const site = 'https://lang.falcondev.io'
const repo = 'https://github.com/falcondev-oss/lang'

/** Sidebar labels in every language but English, read with lang. */
const sidebarLabel = (key: (typeof sections)[number]['key']) =>
  Object.fromEntries(
    lang.languages
      .filter((l) => l !== 'en')
      .map((l) => [l, createUseLang(l, translations)().sidebar[key]]),
  )

export default defineConfig({
  site,
  trailingSlash: 'never',
  integrations: [
    starlight({
      title: 'lang',
      description:
        'Type-safe i18n where the English text is the key. Write every text once next to its translations and read it back fully typed in Vue, React and React Native. No codegen, no JSON files.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/logo.svg',
      defaultLocale: 'root',
      locales: Object.fromEntries(
        lang.languages.map((l) => [l === 'en' ? 'root' : l, { label: LABELS[l], lang: l }]),
      ),
      social: [{ icon: 'github', label: 'GitHub', href: repo }],
      editLink: { baseUrl: `${repo}/edit/main/website/` },
      lastUpdated: true,
      customCss: [
        '@fontsource-variable/geist',
        '@fontsource-variable/geist-mono',
        '@fontsource-variable/noto-sans-jp',
        './src/styles/theme.css',
      ],
      expressiveCode: {
        themes: ['github-dark-default', 'github-light-default'],
        styleOverrides: {
          borderRadius: '0.375rem',
          codeFontFamily: 'var(--sl-font-mono)',
          frames: { shadowColor: 'transparent' },
        },
      },
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        LanguageSelect: './src/components/LanguageSelect.astro',
      },
      sidebar: sections.map(({ key, label, items }) => ({
        label,
        translations: sidebarLabel(key),
        items: [...items],
      })),
    }),
  ],
})
