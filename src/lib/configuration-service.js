import Ajv from "ajv"
import { getEnvironment } from '@dtails/toolbox/lib'
import { SCHEMA } from './configuration-schema'
import { log } from '@dtails/logger'
import { App } from 'models'
import fs from 'fs-extra'
import { inspect } from "util"

let configurations = null

//Validates all configurations - also configurations with no current installation
export async function validateAllConfigurations() {
  const apps = await App.q.withGraphFetched('shop')
  const allConfigurations = await getConfigurations()
  for (const identifier in allConfigurations) {
    const configurationApps = apps.filter(app => app.identifier == identifier)
    const installInfo = configurationApps && configurationApps.length == 1 && configurationApps[0].shop ? 'installed in shop ' + configurationApps[0].shop.shop : 'not installed in shop'
    log(`Going to validate configuration for identifier ${identifier} - ${installInfo}`)
    await validateConfiguration(allConfigurations[identifier])
    log(`Configuration for identifier ${identifier} is valid`)
  }
}

export async function validateConfiguration(configuration) {
  if (!configuration) {
    throw Error(`configuration is not defined`)
  }
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(SCHEMA)

  const verify = (data) => {
    const isValid = validate(data)
    if (isValid) {
      return data
    }
    throw new Error(
      ajv.errorsText(
        validate.errors ? validate.errors.filter((err) => err.keyword !== "if") : '',
        { dataVar: "schemaValidation" } + "\n\n" + inspect(data)
      )
    )
  }
  verify(configuration)
  return true
}

export async function getConfigurations() {
  if (!configurations) {
    log('Lazy loading configurations')
    const fileName = getEnvironment('CONFIGURATIONS_FILE_NAME')
    const filePath = `${__dirname}/../../${fileName}`
    const fileContent = await fs.readFile(filePath, { encoding: 'utf8' })
    configurations = JSON.parse(fileContent)
  }
  return configurations
}

export async function getConfigurationByApp(dbApp) {
  return await getConfigurations()[dbApp.identifier]
}

export async function getConfigurationByShop(dbShop) {
  const allConfigurations = await getConfigurations()
  return allConfigurations[dbShop.app.identifier]
}