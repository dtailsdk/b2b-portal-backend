import Ajv from "ajv"
import { getEnvironment } from '@dtails/toolbox-backend'
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
  for (const identifier of allConfigurations.keys()) {
    const configurationApps = apps.filter(app => app.identifier == identifier)
    const installInfo = configurationApps && configurationApps.length == 1 && configurationApps[0].shop ? 'installed in shop ' + configurationApps[0].shop.shop : 'not installed in shop'
    log(`Going to validate configuration for identifier ${identifier} - ${installInfo}`)
    await validateConfiguration(allConfigurations.get(identifier))
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
    configurations = new Map()
    const filePath = `${__dirname}/../../configurations/${getEnvironment('CONFIGURATIONS_SUB_FOLDER')}`
    const fileNames = await fs.readdirSync(filePath)
    for (const fileName of fileNames) {
      const fileContent = await fs.readFile(`${filePath}/${fileName}`, { encoding: 'utf8' })
      const configuration = JSON.parse(fileContent)
      configurations.set(configuration.identifier, configuration)
    }
  }
  return configurations
}

export async function getConfigurationByApp(dbApp) {
  return await getConfigurations().get(dbApp.identifier)
}

export async function getConfigurationByShop(dbShop) {
  const allConfigurations = await getConfigurations()
  const configuration = allConfigurations.get(dbShop.app.identifier)
  if (!configuration) {
    throw Error(`Did not find configuration for shop ${dbShop.shop} with identifier ${dbShop.app.identifier}`)
  }
  return allConfigurations.get(dbShop.app.identifier)
}