<?php
/**
 * Plugin Name: Conditional WooCommerce Variations
 * Plugin URI: https://yoursite.com
 * Description: Show conditional size dropdowns based on genre selection
 * Version: 1.0.5
 * Author: Your Name
 * Author URI: https://yoursite.com
 * License: GPL v2 or later
 * Text Domain: conditional-woo-variations
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * WC requires at least: 4.0
 * WC tested up to: 9.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class Conditional_WooCommerce_Variations {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_head', array($this, 'add_inline_css'), 999);
        add_action('admin_notices', array($this, 'check_woocommerce'));
        add_action('before_woocommerce_init', array($this, 'declare_compatibility'));
        add_filter('woocommerce_ajax_variation_threshold', array($this, 'increase_variation_limit'), 10, 2);
    }
    
    public function add_inline_css() {
        if (!is_product()) {
            return;
        }
        ?>
        <style type="text/css">
            .variations select[name*="size"]:not([name*="gender"]):not([name*="genre"]) {
                visibility: hidden;
            }
            .variations tr:has(select[name*="size"]:not([name*="gender"]):not([name*="genre"])) {
                display: none;
            }
        </style>
        <?php
    }
    
    public function declare_compatibility() {
        if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, true);
        }
    }
    
    public function increase_variation_limit($limit, $product) {
        return 500;
    }
    
    public function check_woocommerce() {
        if (!class_exists('WooCommerce')) {
            echo '<div class="error"><p>';
            echo '<strong>Conditional WooCommerce Variations</strong> requires WooCommerce to be installed and active.';
            echo '</p></div>';
        }
    }
    
    public function enqueue_scripts() {
        if (!is_product()) {
            return;
        }
        
        wp_enqueue_script(
            'conditional-variations',
            plugin_dir_url(__FILE__) . 'assets/js/conditional-variations.js',
            array('jquery'),
            '1.0.5',
            true
        );
    }
}

function conditional_woo_variations_init() {
    return Conditional_WooCommerce_Variations::get_instance();
}
add_action('plugins_loaded', 'conditional_woo_variations_init');