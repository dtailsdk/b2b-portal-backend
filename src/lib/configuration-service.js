import Ajv from "ajv"
import { getEnvironment } from '@dtails/toolbox/lib'
import { SCHEMA } from './configuration-schema'
import { log } from '@dtails/logger'
import { ShopifyToken } from 'models'
import fs from 'fs-extra'
import { inspect } from "util"

let configurations = null

export async function validateAllConfigurations() {
  const shops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  log(`Found ${shops.length} shops to validate`)
  const allConfigurations = await getConfigurations()
  for (const shop of shops) {
    await validateConfiguration(allConfigurations[shop.app.identifier])
    log(`Successfully validated configuration for shop ${shop.shop} with identifier ${shop.app.identifier}`)
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