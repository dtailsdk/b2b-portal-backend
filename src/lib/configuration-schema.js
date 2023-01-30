export const SCHEMA = {
  type: "object",
  properties: {
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
      },
      required: ["customerConfiguration"],
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
          then: { required: ["enable", "feeShopifyVariantId", "minimumOrderPrice"] },
          else: { required: ["enable"] },
          properties: {
            enable: {
              type: "boolean",
              description: "Defines whether an order fee should be applied if an order total is below a given limit",
            },
            feeShopifyVariantId: {
              type: "string",
              pattern: "^[0-9]+$",
              description: "The Shopify variant id for the variant that represents the fee with prices in all currencies",
            },
            minimumOrderPrice: {
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
  required: ["discountConfiguration", "cartConfiguration", "checkoutConfiguration"],
  additionalProperties: false,
}