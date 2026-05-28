package com.wondertoys.tools;

import dev.langchain4j.agent.tool.P;

/** A single line-item passed to the {@code purchaseProduct} tool by the LLM. */
public record PurchaseItem(
    @P("The product ID to purchase, e.g. 'toy-001'") String productId,
    @P("Quantity to purchase (must be at least 1)") int quantity) {}
