package com.wondertoys.tools;

import dev.langchain4j.agent.tool.P;

/** Shipping address passed to the {@code purchaseProduct} tool by the LLM. */
public record ShippingAddress(
    @P("Recipient full name") String name,
    @P("Street address") String street,
    @P("City") String city,
    @P("State or province") String state,
    @P("ZIP or postal code") String zip,
    @P("Country") String country) {}
