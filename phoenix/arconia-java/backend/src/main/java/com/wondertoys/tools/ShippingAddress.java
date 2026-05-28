package com.wondertoys.tools;

import org.springframework.ai.tool.annotation.ToolParam;

/** Shipping address passed to the {@code purchaseProduct} tool by the LLM. */
public record ShippingAddress(
    @ToolParam(description = "Recipient full name") String name,
    @ToolParam(description = "Street address") String street,
    @ToolParam(description = "City") String city,
    @ToolParam(description = "State or province") String state,
    @ToolParam(description = "ZIP or postal code") String zip,
    @ToolParam(description = "Country") String country) {}
