import { pathToFileURL } from "node:url"

export default async function importAll<ReturnType = unknown>(path: string) {
  const importPath = path.startsWith('/') || /^[A-Za-z]:/.test(path) ? pathToFileURL(path).href : path
  return (await import(importPath)) as ReturnType
}
