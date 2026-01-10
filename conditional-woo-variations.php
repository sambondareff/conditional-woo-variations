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
        
        // Add cleanup button to product variations
        add_action('woocommerce_variable_product_before_variations', array($this, 'add_cleanup_button'));
        add_action('admin_footer', array($this, 'add_cleanup_script'));
        add_action('wp_ajax_cleanup_invalid_variations', array($this, 'ajax_cleanup_invalid_variations'));
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
            '1.0.8',
            true
        );
    }
    
    /**
     * Add cleanup button in variations tab
     */
    public function add_cleanup_button() {
        global $post;
        if (!$post) return;
        
        echo '<div class="toolbar toolbar-variations-defaults" style="padding: 10px; background: #f0f0f1; margin-bottom: 15px; border: 1px solid #c3c4c7;">';
        echo '<strong>Conditional Variations:</strong> ';
        echo '<button type="button" class="button cv-cleanup-variations" data-product-id="' . esc_attr($post->ID) . '">Clean Up Invalid Variations</button>';
        echo '<span class="cv-cleanup-result" style="margin-left: 10px;"></span>';
        echo '<p style="margin: 5px 0 0 0; color: #646970; font-size: 12px;">This will remove variations where Gender and Size don\'t match (e.g., Male + female-6)</p>';
        echo '</div>';
    }
    
    /**
     * Add JavaScript for cleanup button
     */
    public function add_cleanup_script() {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'product') return;
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('.cv-cleanup-variations').on('click', function(e) {
                e.preventDefault();
                var $button = $(this);
                var $result = $('.cv-cleanup-result');
                var productId = $button.data('product-id');
                
                $button.prop('disabled', true).text('Cleaning...');
                $result.html('<span style="color: #999;">Processing...</span>');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'cleanup_invalid_variations',
                        product_id: productId,
                        nonce: '<?php echo wp_create_nonce("cv_cleanup_nonce"); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            var msg = '✓ Deleted ' + response.data.deleted + ' invalid variations';
                            if (response.data.debug) {
                                msg += '<br><pre style="font-size: 11px; margin-top: 5px;">' + response.data.debug + '</pre>';
                            }
                            $result.html('<span style="color: green;">' + msg + '</span>');
                            if (response.data.deleted > 0) {
                                setTimeout(function() {
                                    location.reload();
                                }, 2000);
                            } else {
                                $button.prop('disabled', false).text('Clean Up Invalid Variations');
                            }
                        } else {
                            $result.html('<span style="color: red;">Error: ' + response.data + '</span>');
                            $button.prop('disabled', false).text('Clean Up Invalid Variations');
                        }
                    },
                    error: function() {
                        $result.html('<span style="color: red;">Error occurred</span>');
                        $button.prop('disabled', false).text('Clean Up Invalid Variations');
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * AJAX handler for cleanup
     */
    public function ajax_cleanup_invalid_variations() {
        check_ajax_referer('cv_cleanup_nonce', 'nonce');
        
        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        if (!$product_id) {
            wp_send_json_error('Invalid product ID');
        }
        
        $product = wc_get_product($product_id);
        if (!$product || !$product->is_type('variable')) {
            wp_send_json_error('Invalid product');
        }
        
        $variations = $product->get_children();
        $deleted_count = 0;
        $debug_info = array();
        
        foreach ($variations as $variation_id) {
            $variation = wc_get_product($variation_id);
            if (!$variation) continue;
            
            $attributes = $variation->get_attributes();
            $gender = isset($attributes['gender']) ? $attributes['gender'] : (isset($attributes['pa_gender']) ? $attributes['pa_gender'] : '');
            $size = isset($attributes['pa_size']) ? $attributes['pa_size'] : (isset($attributes['size']) ? $attributes['size'] : '');
            
            if (!$gender || !$size) {
                continue;
            }
            
            $debug_info[] = "#{$variation_id}: Gender='{$gender}' Size='{$size}'";
            
            $gender_lower = strtolower($gender);
            $size_lower = strtolower($size);
            
            $debug_info[] = "#{$variation_id}: Gender='{$gender}' Size='{$size}'";
            
            $should_delete = false;
            
            // Check for invalid combinations
            if ($gender_lower === 'male' && !preg_match('/^male-/', $size_lower)) {
                $should_delete = true;
                $debug_info[] = "  -> INVALID: Male with '{$size}'";
            } elseif ($gender_lower === 'female' && !preg_match('/^female-/', $size_lower)) {
                $should_delete = true;
                $debug_info[] = "  -> INVALID: Female with '{$size}'";
            } elseif (($gender_lower === 'children' || $gender_lower === 'child') && !preg_match('/^child-/', $size_lower)) {
                $should_delete = true;
                $debug_info[] = "  -> INVALID: Children with '{$size}'";
            }
            
            if ($should_delete) {
                wp_delete_post($variation_id, true);
                $deleted_count++;
            }
        }
        
        wp_send_json_success(array(
            'deleted' => $deleted_count,
            'debug' => implode("\n", array_slice($debug_info, 0, 10)) // First 10 for brevity
        ));
    }
}

function conditional_woo_variations_init() {
    return Conditional_WooCommerce_Variations::get_instance();
}
add_action('plugins_loaded', 'conditional_woo_variations_init');