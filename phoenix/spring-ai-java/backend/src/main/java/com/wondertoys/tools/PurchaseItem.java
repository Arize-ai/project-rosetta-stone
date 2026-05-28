package com.wondertoys.tools;

import org.springframework.ai.tool.annotation.ToolParam;

/** A single line-item passed to the {@code purchaseProduct} tool by the LLM. */
public record PurchaseItem(
    @ToolParam(description = "The product ID to purchase, e.g. 'toy-001'") String productId,
    @ToolParam(description = "Quantity to purchase (must be at least 1)") int quantity) {}
