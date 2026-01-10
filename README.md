# Conditional WooCommerce Variations

A WordPress plugin for WooCommerce that displays conditional variation dropdowns based on parent attribute selection.

## Features

- Shows size dropdown only after gender is selected
- Filters size options based on selected gender (Male/Female/Children)
- Prevents invalid variation combinations
- Clean customer-facing labels (displays "S" instead of "male-s")
- Works with WooCommerce HPOS
- Increases variation generation limit to 500

## Installation

1. Upload the `conditional-woo-variations` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure your products with Gender and Size attributes

## Product Setup

### 1. Create Global Size Attribute

Go to **Products → Attributes** and create a "Size" attribute with terms like:

**Male sizes:**
- Name: `S`, Slug: `male-s`
- Name: `M`, Slug: `male-m`
- Name: `L`, Slug: `male-l`
- Name: `XL`, Slug: `male-xl`
- Name: `XXL`, Slug: `male-xxl`
- Name: `3XL`, Slug: `male-3xl`
- Name: `5XL`, Slug: `male-5xl`

**Female sizes:**
- Name: `6`, Slug: `female-6`
- Name: `8`, Slug: `female-8`
- Name: `10`, Slug: `female-10`
- etc. (up to 26)

**Children sizes:**
- Name: `4`, Slug: `child-4`
- Name: `6`, Slug: `child-6`
- Name: `8`, Slug: `child-8`
- etc. (up to 16)

### 2. Create Gender Attribute

Create a "Gender" attribute with terms:
- Male
- Female
- Children (or Child)

### 3. Configure Products

For each variable product:
1. Add **Gender** attribute - select: Male, Female, Children
2. Add **Size** attribute - select only the sizes this product offers
3. Check "Used for variations" for both attributes
4. Save attributes
5. Go to Variations tab
6. Select "Create variations from all attributes"
7. Generate variations (click multiple times if needed - generates 50 at a time)
8. Invalid combinations will be automatically cleaned up
9. Set prices/stock/images for valid variations

## How It Works

### Customer Experience
1. Customer sees only the **Gender** dropdown initially
2. After selecting a gender, the **Size** dropdown appears
3. Size dropdown shows only relevant sizes:
   - Male → S, M, L, XL, XXL, 3XL, 5XL
   - Female → 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26
   - Children → 4, 6, 8, 10, 12, 14, 16
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
- Manually delete variations that don't match (e.g., Male + female-6)

### Add to Cart stays disabled
- Ensure at least one valid variation exists for the Gender + Size combination
- Check that variation is enabled and has a price set

## License

GPL v2 or later

## Author

Built for conditional WooCommerce variations with gender-specific sizing.

## Changelog

### 1.0.5
- Initial release
- Gender-based size filtering
- HPOS compatibility
- Automatic invalid variation cleanup
- Increased variation threshold to 500
