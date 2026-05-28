package com.wondertoys.tools;

/**
 * A single line-item passed to the {@code purchaseProduct} tool by the LLM. Field-level
 * descriptions live in the JSON schema on {@link WonderToysTools#toolSpecs()} instead of
 * being annotated here, since the agent loop owns the Anthropic API contract directly.
 */
public record PurchaseItem(String productId, int quantity) {}
