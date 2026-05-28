package com.wondertoys;

import com.wondertoys.inventory.Product;
import com.wondertoys.inventory.ProductRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Public product endpoints — no API key required. Used by the Next.js home page and product
 * detail pages.
 */
@RestController
public class ProductsController {

  private final ProductRepository products;

  public ProductsController(ProductRepository products) {
    this.products = products;
  }

  /**
   * Returns the top 5 best-selling products plus the list of available categories. Shape matches
   * the Python tier's {@code /products/featured} response exactly.
   */
  @GetMapping("/products/featured")
  public Map<String, Object> featured() {
    List<Map<String, Object>> popular = new ArrayList<>();
    for (Product p : products.featured()) {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("id", p.id);
      m.put("name", p.name);
      m.put("price", p.price);
      m.put("image", p.image);
      m.put("rating", p.rating);
      m.put("category", p.category);
      m.put("ageRange", p.ageRange.min() + "-" + p.ageRange.max() + " years");
      popular.add(m);
    }

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("popular", popular);
    response.put("categories", products.allCategories());
    return response;
  }

  @GetMapping("/products/{productId}")
  public Map<String, Object> productDetail(@PathVariable String productId) {
    Product p = products.findById(productId);
    if (p == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
    }
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", p.id);
    m.put("name", p.name);
    m.put("description", p.description);
    m.put("marketingCopy", p.marketingCopy);
    m.put("keywords", p.keywords);
    m.put("ageRange", p.ageRange);
    m.put("price", p.price);
    m.put("inventory", p.inventory);
    m.put("category", p.category);
    m.put("image", p.image);
    m.put("rating", p.rating);
    m.put("manufacturer", p.manufacturer);
    m.put("dimensions", p.dimensions);
    m.put("bestSellersRank", p.bestSellersRank);
    return m;
  }
}
