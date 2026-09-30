/// <reference types="astro/client" />

declare module 'virtual:for-humanity/config' {
  const config: {
    title: string
    description: string
    status: Array<{ phrase: string; kind: 'verified' | 'unverified'; date?: boolean }>
  }
  export default config
}
