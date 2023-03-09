import test from 'ava'
import fs from 'fs-extra'
import { validateConfiguration } from '../../src/lib/configuration-service'

test('When customer configuration is left out, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data must have required property \'customerConfiguration\'')
})

test('When product configuration is left out, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data must have required property \'productConfiguration\'')
})

test('When metafield definition is left out in product configuration, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/productConfiguration/packageSizeMetafield must have required property \'metafieldKey\'')
})

test('When discount configuration is left out, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data must have required property \'discountConfiguration\'')
})

test('When cart configuration is left out, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data must have required property \'cartConfiguration\'')
})

test('When checkout configuration is left out, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data must have required property \'checkoutConfiguration\'')
})

test('When customer discount is enabled but related metafield is not defined, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": true
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/discountConfiguration/customerDiscount must have required property \'percentageMetafield\'')
})

test('When single unit purchase is enabled but related metafield is not defined, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": true,
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/cartConfiguration/customerConfiguration must have required property \'singleUnitsMetafield\'')
})

test('When minimum order configuration is enabled and fee prices are not defined, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": true,
        "minimumOrderPrices": [
          {
            "amount": "200.00",
            "currencyCode": "DKK"
          },
          {
            "amount": "70",
            "currencyCode": "EUR"
          }
        ]
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/checkoutConfiguration/minimumOrderFeeConfiguration must have required property \'feePrices\'')
})

test('When minimum order configuration is enabled and minimum order amounts are not defined, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": true,
        "feePrices": [
          {
            "amount": "200.00",
            "currencyCode": "DKK"
          },
          {
            "amount": "70",
            "currencyCode": "EUR"
          }
        ]
      },
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/checkoutConfiguration/minimumOrderFeeConfiguration must have required property \'minimumOrderPrices\'')
})

test('When minimum quantity is enabled and metafield is not defined, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": true
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false,
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/cartConfiguration/productConfiguration must have required property \'minimumQuantityMetafield\'')
})

test('When product discount is enabled and metafield is not defined, then configuration is not valid', async t => {
  const configuration = {
    "identifier": "customer_app_identifier",
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": true
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false,
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.log('ENV->', process.env.NODE_ENV)
  t.is(error.message, 'data/discountConfiguration/productDiscount must have required property \'discountDisallowedMetafield\'')
})

test('When identifier is not defined, then configuration is not valid', async t => {
  const configuration = {
    "customerConfiguration": {
      "enableCvr": false
    },
    "productConfiguration": {
      "packageSizeMetafield": {
        "metafieldNamespace": "dtails_b2b_portal",
        "metafieldKey": "package_size"
      }
    },
    "discountConfiguration": {
      "customerDiscount": {
        "enable": false
      },
      "productDiscount": {
        "enable": false
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      },
      "productConfiguration": {
        "enableRestrictedProducts": false,
        "enableMinimumQuantity": false
      }
    },
    "checkoutConfiguration": {
      "minimumOrderFeeConfiguration": {
        "enable": false,
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.log('ENV->', process.env.NODE_ENV)
  t.is(error.message, 'data must have required property \'identifier\'')
})

test('When validating dev configurations, then configurations are valid', async t => {
  const filePath = `${__dirname}/../../configurations/dev`
  const fileNames = await fs.readdirSync(filePath)
  for (const fileName of fileNames) {
    const fileContent = await fs.readFile(`${filePath}/${fileName}`, { encoding: 'utf8' })
    const configuration = JSON.parse(fileContent)
    const isValid = await validateConfiguration(configuration)
    t.true(isValid)
  }
})

test('When validating test configurations, then configurations are valid', async t => {
  const filePath = `${__dirname}/../../configurations/test`
  const fileNames = await fs.readdirSync(filePath)
  for (const fileName of fileNames) {
    const fileContent = await fs.readFile(`${filePath}/${fileName}`, { encoding: 'utf8' })
    const configuration = JSON.parse(fileContent)
    const isValid = await validateConfiguration(configuration)
    t.true(isValid)
  }
})

test('When validating prod configurations, then configurations are valid', async t => {
  const filePath = `${__dirname}/../../configurations/prod`
  const fileNames = await fs.readdirSync(filePath)
  for (const fileName of fileNames) {
    const fileContent = await fs.readFile(`${filePath}/${fileName}`, { encoding: 'utf8' })
    const configuration = JSON.parse(fileContent)
    const isValid = await validateConfiguration(configuration)
    t.true(isValid)
  }
})