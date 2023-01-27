import test from 'ava'
import { validateConfiguration } from '../../src/lib/configuration-service'
import minimal from './minimal.json'
import maximal from './maximal.json'

test('When configuration is minimal, then configuration is valid', async t => {
  const isValid = await validateConfiguration(minimal)
  t.true(isValid)
})

test('When configuration is maximal, then configuration is valid', async t => {
  const isValid = await validateConfiguration(maximal)
  t.true(isValid)
})

test('When discount configuration is left out, then configuration is not valid', async t => {
  const configuration = {
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": false,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "allow_single_units"
          }
        }
      },
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
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": false
      },
      "productDiscount": {
        "noDisountShopifyProductIds": []
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": false,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "allow_single_units"
          }
        }
      },
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
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": false
      },
      "productDiscount": {
        "noDisountShopifyProductIds": []
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data must have required property \'checkoutConfiguration\'')
})

test('When customer discount is enabled but related metafield is not defined, then configuration is not valid', async t => {
  const configuration = {
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": true
      },
      "productDiscount": {
        "noDisountShopifyProductIds": [
        ]
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": false,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "allow_single_units"
          }
        }
      },
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
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": false
      },
      "productDiscount": {
        "noDisountShopifyProductIds": []
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": true,
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": false,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "allow_single_units"
          }
        }
      },
      "minimumOrderFeeConfiguration": {
        "enable": false
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/cartConfiguration/customerConfiguration must have required property \'singleUnitsMetafield\'')
})

test('When card payment is enabled but related metafield is not defined, then configuration is not valid', async t => {
  const configuration = {
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": false
      },
      "productDiscount": {
        "noDisountShopifyProductIds": []
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": true,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "disallow_invoice"
          },
        }
      },
      "minimumOrderFeeConfiguration": {
        "enable": false,
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/checkoutConfiguration/paymentMethodConfiguration/customerConfiguration must have required property \'disallowCardMetafield\', data/checkoutConfiguration/paymentMethodConfiguration/enableCardMethod must be equal to one of the allowed values, data/checkoutConfiguration/paymentMethodConfiguration must match exactly one schema in oneOf')
})

test('When minimum order configuration is enabled and fee variant id is not defined, then configuration is not valid', async t => {
  const configuration = {
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": false
      },
      "productDiscount": {
        "noDisountShopifyProductIds": []
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": false,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "allow_single_units"
          }
        }
      },
      "minimumOrderFeeConfiguration": {
        "enable": true,
        "minimumOrderPrice": [
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
  t.is(error.message, 'data/checkoutConfiguration/minimumOrderFeeConfiguration must have required property \'feeShopifyVariantId\'')
})

test('When minimum order configuration is enabled and minimum order amounts are not defined, then configuration is not valid', async t => {
  const configuration = {
    "discountConfiguration": {
      "customerDiscount": {
        "enableCustomerDiscount": false
      },
      "productDiscount": {
        "noDisountShopifyProductIds": []
      }
    },
    "cartConfiguration": {
      "customerConfiguration": {
        "enableSingleUnits": false
      }
    },
    "checkoutConfiguration": {
      "paymentMethodConfiguration": {
        "enableCardMethod": false,
        "customerConfiguration": {
          "disallowInvoiceMetafield": {
            "metafieldNamespace": "dtails_b2b_portal",
            "metafieldKey": "allow_single_units"
          }
        }
      },
      "minimumOrderFeeConfiguration": {
        "enable": true,
        "feeShopifyVariantId": "7984356819196",
      }
    }
  }
  const error = await t.throwsAsync(async () => validateConfiguration(configuration))
  t.is(error.message, 'data/checkoutConfiguration/minimumOrderFeeConfiguration must have required property \'minimumOrderPrice\'')
})