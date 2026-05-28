package com.wondertoys.tools;

/**
 * Shipping address passed to the {@code purchaseProduct} tool by the LLM. Field-level
 * descriptions live in the JSON schema on {@link WonderToysTools#toolSpecs()} instead of
 * being annotated here, since the agent loop owns the Anthropic API contract directly.
 */
public record ShippingAddress(
    String name, String street, String city, String state, String zip, String country) {}
