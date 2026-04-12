#!/usr/bin/env node
import fs from "fs"
import path from "path"
import YAML from "yaml"
import { installPlugins, parsePluginSource } from "./gitLoader.js"
import type { QuartzPluginsJson } from "./types.js"

function readPluginSources(): string[] {
  const yamlPath = path.join(process.cwd(), "quartz.config.yaml")
  const defaultYamlPath = path.join(process.cwd(), "quartz.config.default.yaml")
  const jsonPath = path.join(process.cwd(), "quartz.plugins.json")
  const defaultJsonPath = path.join(process.cwd(), "quartz.plugins.default.json")

  const configPath = [yamlPath, jsonPath, defaultYamlPath, defaultJsonPath].find((p) =>
    fs.existsSync(p),
  )
  if (!configPath) return []

  const raw = fs.readFileSync(configPath, "utf-8")
  const config: QuartzPluginsJson =
    configPath.endsWith(".yaml") || configPath.endsWith(".yml") ? YAML.parse(raw) : JSON.parse(raw)

  return (config.plugins ?? [])
    .filter((e) => e.enabled)
    .map((e) => (typeof e.source === "string" ? e.source : e.source.repo))
}

async function main() {
  const pluginSources = readPluginSources()

  if (pluginSources.length === 0) {
    console.log("No external plugins to install.")
    return
  }

  console.log(`Installing ${pluginSources.length} plugin(s) from Git...`)

  const specs = pluginSources.map((source: string) => parsePluginSource(source))
  const installed = await installPlugins(specs, { verbose: true })

  if (installed.size === pluginSources.length) {
    console.log("✓ All plugins installed successfully")
  } else {
    console.error(`✗ Only ${installed.size}/${pluginSources.length} plugins installed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Failed to install plugins:", err)
  process.exit(1)
})
