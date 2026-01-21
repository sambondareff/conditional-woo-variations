# Conditional WooCommerce Variations

A WordPress plugin for WooCommerce that displays conditional variation dropdowns based on parent attribute selection.

## Features

- Shows size dropdown only after gender is selected
- Filters size options based on selected gender (Unisex/Men's/Women's/Kids)
- Prevents invalid variation combinations
- Clean customer-facing labels (displays "XS" instead of "unisex-xs")
- Works with WooCommerce HPOS
- Increases variation generation limit to 500

## Installation

1. Upload the `conditional-woo-variations` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure your products with Gender and Size attributes

## Product Setup

### 1. Create Global Size Attribute

Go to **Products → Attributes** and create a "Size" attribute with terms like:

**Unisex sizes:**
- Name: `XS`, Slug: `unisex-xs`
- Name: `S`, Slug: `unisex-s`
- Name: `M`, Slug: `unisex-m`
- Name: `L`, Slug: `unisex-l`
- Name: `XL`, Slug: `unisex-xl`
- Name: `XXL`, Slug: `unisex-xxl`
- Name: `3XL`, Slug: `unisex-3xl`
- Name: `4XL`, Slug: `unisex-4xl`
- Name: `5XL`, Slug: `unisex-5xl`

**Men's sizes:**
- Name: `XS`, Slug: `mens-xs`
- Name: `S`, Slug: `mens-s`
- Name: `M`, Slug: `mens-m`
- Name: `L`, Slug: `mens-l`
- Name: `XL`, Slug: `mens-xl`
- Name: `XXL`, Slug: `mens-xxl`
- Name: `3XL`, Slug: `mens-3xl`
- Name: `4XL`, Slug: `mens-4xl`
- Name: `5XL`, Slug: `mens-5xl`

**Women's sizes:**
- Name: `XS`, Slug: `womens-xs`
- Name: `S`, Slug: `womens-s`
- Name: `M`, Slug: `womens-m`
- Name: `L`, Slug: `womens-l`
- Name: `XL`, Slug: `womens-xl`
- Name: `XXL`, Slug: `womens-xxl`
- Name: `3XL`, Slug: `womens-3xl`
- Name: `4XL`, Slug: `womens-4xl`
- Name: `5XL`, Slug: `womens-5xl`

**Kids sizes:**
- Name: `8`, Slug: `kids-8`
- Name: `10`, Slug: `kids-10`
- Name: `12`, Slug: `kids-12`
- Name: `14`, Slug: `kids-14`

### 2. Create Gender Attribute

Create a "Gender" attribute with terms:
- Unisex
- Mens (display as "Men's")
- Womens (display as "Women's")
- Kids

### 3. Configure Products

For each variable product:
1. Add **Gender** attribute - select the gender options this product offers (e.g., Unisex + Kids, or Mens + Womens + Kids)
2. Add **Size** attribute - select only the sizes this product offers
3. Check "Used for variations" for both attributes
4. Save attributes
5. Go to Variations tab
6. Select "Create variations from all attributes"
7. Generate variations (click multiple times if needed - generates 100 at a time)
8. Invalid combinations will be automatically cleaned up
9. Set prices/stock/images for valid variations

## How It Works

### Customer Experience
1. Customer sees only the **Gender** dropdown initially
2. After selecting a gender, the **Size** dropdown appears
3. Size dropdown shows only relevant sizes:
   - Unisex → XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL
   - Men's → XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL
   - Women's → XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL
   - Kids → 8, 10, 12, 14
4. Customer selects size → Add to Cart button enables
5. Customer can change gender - size selection resets

### Technical Details
- Uses JavaScript to filter size options based on selected gender
- Hides size dropdown with CSS until gender is selected
- Maintains all genre options even after size is selected
- Only creates valid variation combinations (Gender + matching Size prefix)

## Requirements

- WordPress 5.0+
- WooCommerce 4.0+
- PHP 7.2+
- jQuery (included with WordPress)

## File Structure

```
conditional-woo-variations/
├── conditional-woo-variations.php  # Main plugin file
├── assets/
│   └── js/
│       └── conditional-variations.js  # Frontend JavaScript
└── README.md
```

## Hooks & Filters

### Filters
- `woocommerce_ajax_variation_threshold` - Increases to 500 variations

### Actions
- `wp_enqueue_scripts` - Loads JavaScript on product pages
- `wp_head` - Adds inline CSS to hide size dropdowns initially

## Troubleshooting

### Size dropdown doesn't appear
- Check that attributes are named "Gender" (or "Genre") and "Size"
- Verify JavaScript console for errors
- Ensure variations exist for the selected gender

### Invalid variations created
- The plugin includes a cleanup function to remove invalid combinations
- Manually delete variations that don't match (e.g., Men's + womens-xs)

### Add to Cart stays disabled
- Ensure at least one valid variation exists for the Gender + Size combination
- Check that variation is enabled and has a price set

## License

GPL v2 or later

## Author

Built for conditional WooCommerce variations with gender-specific sizing.

## Changelog

### 1.1.0
- Added support for four gender options: Unisex, Men's, Women's, and Kids
- All adult sizes (Unisex/Men's/Women's): XS - 5XL
- Kids sizes: 8, 10, 12, 14
- Updated validation logic for new gender structure
- Products can use any combination of genders (e.g., just Unisex, or Men's + Women's)

### 1.0.5
- Initial release
- Gender-based size filtering
- HPOS compatibility
- Automatic invalid variation cleanup
- Increased variation threshold to 500
