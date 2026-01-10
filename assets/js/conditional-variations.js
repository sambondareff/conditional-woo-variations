jQuery(function ($) {
  'use strict';

  let $genre, $size, $sizeRow;
  let allSizeOptions = [];
  let isUpdating = false;

  function init() {
    const $form = $('.variations_form');
    if (!$form.length) return;

    const $selects = $form.find('select[name^="attribute_"]');

    // Find genre and size selects
    $genre = $selects.filter(function() {
      return /genre|gender/i.test(this.name);
    }).first();

    $size = $selects.filter(function() {
      const name = this.name;
      return /size/i.test(name) && !/genre|gender/i.test(name);
    }).first();

    if (!$genre.length || !$size.length) return;

    $sizeRow = $size.closest('tr').length ? $size.closest('tr') : $size.closest('div');

    // Store all size options only once
    if (allSizeOptions.length === 0) {
      $size.find('option').each(function() {
        allSizeOptions.push({
          value: $(this).val(),
          text: $(this).text()
        });
      });
    }

    // Hide size initially
    $sizeRow.css('display', 'none');

    // Handle genre change
    $genre.off('change.cv').on('change.cv', function() {
      if (!isUpdating) {
        updateSizeOptions();
      }
    });

    // Also listen for size changes to restore all genre options
    $size.off('change.cvsize').on('change.cvsize', function() {
      restoreGenreOptions();
    });

    // Handle reset
    $('.reset_variations').off('click.cv').on('click.cv', function() {
      setTimeout(function() {
        $sizeRow.css('display', 'none');
        restoreGenreOptions();
      }, 100);
    });

    // Listen to WooCommerce's variation form updates
    $form.off('woocommerce_update_variation_values.cv').on('woocommerce_update_variation_values.cv', function() {
      setTimeout(function() {
        restoreGenreOptions();
      }, 50);
    });

    updateSizeOptions();
  }

  function restoreGenreOptions() {
    // Ensure all genre options remain available
    const currentGenre = $genre.val();
    const allGenreOptions = ['', 'Male', 'Female', 'Child'];
    
    // Check if options were filtered by WooCommerce
    const existingOptions = $genre.find('option').length;
    
    if (existingOptions < 4) {
      // Rebuild genre dropdown with all options
      const selectedValue = $genre.val();
      $genre.empty();
      
      $genre.append('<option value="">Choose an option</option>');
      $genre.append('<option value="Male">Male</option>');
      $genre.append('<option value="Female">Female</option>');
      $genre.append('<option value="Child">Children</option>');
      
      if (selectedValue) {
        $genre.val(selectedValue);
      }
    }
  }

  function getSizeOrder(slug) {
    // Define custom sort order
    const order = {
      // Male sizes
      'male-s': 1,
      'male-m': 2,
      'male-l': 3,
      'male-xl': 4,
      'male-xxl': 5,
      'male-3xl': 6,
      'male-5xl': 7,
      
      // Female sizes
      'female-6': 10,
      'female-8': 11,
      'female-10': 12,
      'female-12': 13,
      'female-14': 14,
      'female-16': 15,
      'female-18': 16,
      'female-20': 17,
      'female-22': 18,
      'female-24': 19,
      'female-26': 20,
      
      // Children sizes
      'child-4': 30,
      'child-6': 31,
      'child-8': 32,
      'child-10': 33,
      'child-12': 34,
      'child-14': 35,
      'child-16': 36
    };
    
    return order[slug.toLowerCase()] || 999;
  }

  function updateSizeOptions() {
    if (isUpdating) return;
    isUpdating = true;

    const genre = ($genre.val() || '').toLowerCase();

    if (!genre) {
      $sizeRow.css('display', 'none');
      $size.css('visibility', 'hidden');
      isUpdating = false;
      return;
    }

    // Determine prefix based on genre
    let prefix = '';
    if (genre.includes('male') && !genre.includes('female')) {
      prefix = 'male-';
    } else if (genre.includes('female')) {
      prefix = 'female-';
    } else if (genre.includes('child')) {
      prefix = 'child-';
    }

    // Reset size selection when genre changes
    $size.val('');

    // Clear size dropdown completely
    $size.empty();

    // Filter and sort sizes
    const filteredSizes = allSizeOptions.filter(function(opt) {
      return opt.value === '' || opt.value.toLowerCase().startsWith(prefix);
    });
    
    filteredSizes.sort(function(a, b) {
      return getSizeOrder(a.value) - getSizeOrder(b.value);
    });
    
    // Add "Choose an option" first
    $size.append('<option value="">Choose an option</option>');
    
    // Add sorted sizes
    filteredSizes.forEach(function(opt) {
      if (opt.value !== '') {
        const $option = $('<option></option>');
        $option.val(opt.value);
        $option.text(opt.text);
        $size.append($option);
      }
    });
    
    // Force re-render
    $size[0].dispatchEvent(new Event('change', { bubbles: true }));

    // Show size dropdown
    const isTableRow = $sizeRow.is('tr');
    $sizeRow.css('display', isTableRow ? 'table-row' : 'block');
    $size.css('visibility', 'visible');

    // Re-sort after WooCommerce might have re-ordered
    setTimeout(function() {
      sortSizeDropdown();
      isUpdating = false;
    }, 100);
  }
  
  function sortSizeDropdown() {
    // Get all current options except first (Choose an option)
    const $options = $size.find('option:not(:first)');
    const optionsArray = $options.toArray();
    
    // Sort options
    optionsArray.sort(function(a, b) {
      return getSizeOrder(a.value) - getSizeOrder(b.value);
    });
    
    // Remove and re-add in sorted order
    $options.detach();
    optionsArray.forEach(function(opt) {
      $size.append(opt);
    });
  }

  init();
  setTimeout(init, 200);
  setTimeout(init, 500);

  $(document).on('woocommerce_variation_form', function() {
    setTimeout(init, 100);
  });
});