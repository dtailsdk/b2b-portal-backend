export const SCHEMA = {
  type: "object",
  properties: {
    identifier: {
      type: "string",
      description: "An identifier that is unique for the given customer and app",
    },
    customerConfiguration: {
      type: "object",
      description: "Configuration of a customer",
      if: { properties: { enableCvr: { const: true } } },
      then: { required: ["enableCvr", "cvrMetafield"] },
      else: { required: ["enableCvr"] },
      properties: {
        enableCvr: {
          type: "boolean",
          description: "Determines whether a CVR metafield should be created on the customer",
        },
        cvrMetafield: {
          type: "object",
          description: "Defines the metafield on the customer where the customer CVR number can be set",
          properties: {
            metafieldNamespace: {
              type: "string",
              description: "Defines the metafield namespace",
            },
            metafieldKey: {
              type: "string",
              description: "Defines the metafield key",
            },
          },
          required: ["metafieldNamespace", "metafieldKey"],
        },
      },
    },
    productConfiguration: {
      type: "object",
      description: "Configuration of a product",
      properties: {
        packageSizeMetafield: {
          type: "object",
          description: "Defines the metafield on the product where the size of a B2B package can be set",
          properties: {
            metafieldNamespace: {
              type: "string",
              description: "Defines the metafield namespace",
            },
            metafieldKey: {
              type: "string",
              description: "Defines the metafield key",
            },
          },
          required: ["metafieldNamespace", "metafieldKey"],
        },
      },
    },
    discountConfiguration: {
      type: "object",
      description: "Configuration of the discount model",
      properties: {
        customerDiscount: {
          type: "object",
          description: "Configuration of discount on a customer level",
          if: { properties: { enable: { const: true } } },
          then: { required: ["enable", "percentageMetafield"] },
          else: { required: ["enable"] },
          properties: {
            enable: {
              type: "boolean",
              description: "Determines whether discount on a customer level is enabled",
            },
            percentageMetafield: {
              type: "object",
              description: "Defines the metafield on the customer that defines the customer discount percentage",
              properties: {
                metafieldNamespace: {
                  type: "string",
                  description: "Defines the metafield namespace",
                },
                metafieldKey: {
                  type: "string",
                  description: "Defines the metafield key",
                },
              },
              required: ["metafieldNamespace", "metafieldKey"],
            },
          },
        },
        productDiscount: {
          type: "object",
          description: "Configuration of discount on a product level",
          if: { properties: { enable: { const: true } } },
          then: { required: ["enable", "discountDisallowedMetafield"] },
          else: { required: ["enable"] },
          properties: {
            enable: {
              type: "boolean",
              description: "Defines whether discount configurations applies for products",
            },
            discountDisallowedMetafield: {
              type: "object",
              description: "Defines the metafield on the product that defines whether discounts do not apply for the product",
              properties: {
                metafieldNamespace: {
                  type: "string",
                  description: "Defines the metafield namespace",
                },
                metafieldKey: {
                  type: "string",
                  description: "Defines the metafield key",
                },
              },
              required: ["metafieldNamespace", "metafieldKey"],
            }
          },
        },
      },
      required: ["customerDiscount", "productDiscount"],
      additionalProperties: false,
    },
    cartConfiguration: {
      type: "object",
      description: "Configuration of the cart behaviour",
      properties: {
        customerConfiguration: {
          type: "object",
          description: "Defines how the customer affects the cart behaviour",
          if: { properties: { enableSingleUnits: { const: true } } },
          then: { required: ["enableSingleUnits", "singleUnitsMetafield"] },
          else: { required: ["enableSingleUnits"] },
          properties: {
            enableSingleUnits: {
              type: "boolean",
              description: "Defines whether some customers must be able to place orders in single units instead of package units",
            },
            singleUnitsMetafield: {
              type: "object",
              description: "Defines the metafield on the customer that defines whether the customer is allowed to buy single units",
              properties: {
                metafieldNamespace: {
                  type: "string",
                  description: "Defines the metafield namespace",
                },
                metafieldKey: {
                  type: "string",
                  description: "Defines the metafield key",
                },
              },
              required: ["metafieldNamespace", "metafieldKey"],
            },
          },
          required: ["enableSingleUnits"],
        },
        productConfiguration: {
          type: "object",
          description: "Configuration of products in relation to the cart",
          if: { properties: { enableRestrictedProducts: { const: true } } },
          then: { required: ["enableRestrictedProducts", "restrictedProductMetafield", "restrictedCustomerMetafield"] },
          else: { required: ["enableRestrictedProducts"] },
          properties: {
            enableRestrictedProducts: {
              type: "boolean",
              description: "Determines whether it is possible to restrict which products a customer can add to the cart",
            },
            restrictedProductMetafield: {
              type: "object",
              description: "Defines the metafield on the product that defines in the product is in a restricted product group and if so, what the name of the product group is. If the field is not set, all customers can add the product to the cart.",
              properties: {
                metafieldNamespace: {
                  type: "string",
                  description: "Defines the metafield namespace",
                },
                metafieldKey: {
                  type: "string",
                  description: "Defines the metafield key",
                },
              },
              required: ["metafieldNamespace", "metafieldKey"],
            },
            restrictedCustomerMetafield: {
              type: "object",
              description: "Defines the metafield on the customer that defines which, if any product groups the customer is allowed to add to the cart. If the field is not set, the customer can add all products that are not in a restricted product group.",
              properties: {
                metafieldNamespace: {
                  type: "string",
                  description: "Defines the metafield namespace",
                },
                metafieldKey: {
                  type: "string",
                  description: "Defines the metafield key",
                },
              },
              required: ["metafieldNamespace", "metafieldKey"],
            },
          },
          if: { properties: { enableMinimumQuantity: { const: true } } },
          then: { required: ["enableMinimumQuantity", "minimumQuantityMetafield"] },
          else: { required: ["enableMinimumQuantity"] },
          properties: {
            enableMinimumQuantity: {
              type: "boolean",
              description: "Defines whether there is a minimum quantity that can be put into the cart",
            },
            minimumQuantityMetafield: {
              type: "object",
              description: "Defines the metafield on the customer that defines whether the customer is allowed to buy single units",
              properties: {
                metafieldNamespace: {
                  type: "string",
                  description: "Defines the metafield namespace",
                },
                metafieldKey: {
                  type: "string",
                  description: "Defines the metafield key",
                },
              },
              required: ["metafieldNamespace", "metafieldKey"],
            },
          },
          required: ["enableMinimumQuantity"],
        },
      },
      required: ["customerConfiguration", "productConfiguration"],
      additionalProperties: false,
    },
    checkoutConfiguration: {
      type: "object",
      description: "Configuration of the checkout",
      properties: {
        minimumOrderFeeConfiguration: {
          type: "object",
          description: "Defines the minimum order fee configuration",
          if: { properties: { enable: { const: true } } },
          then: { required: ["enable", "feePrices", "minimumOrderPrices"] },
          else: { required: ["enable"] },
          properties: {
            enable: {
              type: "boolean",
              description: "Defines whether an order fee should be applied if an order total is below a given limit",
            },
            feePrices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: {
                    type: "string",
                    pattern: "^[0-9]+\.[0-9]{0,2}$",
                    description: "Defines the fee amount",
                  },
                  currencyCode: {
                    type: "string",
                    pattern: "^[A-Z]{3}$",
                    description: "Defines the currency of the amount",
                  },
                },
                required: ["amount", "currencyCode"],
              },
              uniqueItems: true,
              description: "A list of minimum order fees",
            },
            minimumOrderPrices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: {
                    type: "string",
                    pattern: "^[0-9]+\.[0-9]{0,2}$",
                    description: "Defines the minimum order total amount",
                  },
                  currencyCode: {
                    type: "string",
                    pattern: "^[A-Z]{3}$",
                    description: "Defines the currency of the amount",
                  },
                },
                required: ["amount", "currencyCode"],
              },
              uniqueItems: true,
              description: "A list of minimum order totals in all currencies",
            },
          },
          additionalProperties: false,
        },
      },
      required: ["minimumOrderFeeConfiguration"],
      additionalProperties: false,
    },
  },
  required: ["identifier", "customerConfiguration", "productConfiguration", "discountConfiguration", "cartConfiguration", "checkoutConfiguration"],
  additionalProperties: false,
}