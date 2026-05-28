package com.wondertoys.inventory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * A product in the Wonder Toys catalogue. Mutable on {@link #inventory} only — purchases decrement
 * it and cancellations restore it. Mirrors the JSON schema in {@code products.json} 1:1.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public final class Product {
  public String id;
  public String name;
  public String image;
  public String description;
  public String marketingCopy;
  public List<String> keywords;
  public AgeRange ageRange;
  public double price;
  public int inventory;
  public String category;
  public Dimensions dimensions;
  public String manufacturer;
  public int bestSellersRank;
  public Rating rating;

  public record AgeRange(int min, int max) {}

  public record Dimensions(
      @JsonProperty("lengthInches") double lengthInches,
      @JsonProperty("widthInches") double widthInches,
      @JsonProperty("heightInches") double heightInches,
      @JsonProperty("weightLbs") double weightLbs) {}

  public record Rating(double stars, int numberOfRatings) {}
}
