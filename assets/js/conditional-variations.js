jQuery(function ($) {
  'use strict';

  let $genre, $size, $sizeRow;
  let allSizeOptions = [];
  let allGenreOptions = []; // Store original genre options from the product
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

    // Skip if no gender attribute (product doesn't need conditional logic)
    if (!$genre.length) return;
    
    // If size doesn't exist, also skip
    if (!$size.length) return;

    $sizeRow = $size.closest('tr').length ? $size.closest('tr') : $size.closest('div');

    // Always place Size under Gender
    enforceOrder();

    // Store all size options only once
    if (allSizeOptions.length === 0) {
      $size.find('option').each(function() {
        allSizeOptions.push({
          value: $(this).val(),
          text: $(this).text()
        });
      });
    }
    
    // Store original genre options from the product (only available genders)
    if (allGenreOptions.length === 0) {
      $genre.find('option').each(function() {
        allGenreOptions.push({
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
        enforceOrder();
        sortSizeDropdown();
      }, 50);
    });

    updateSizeOptions();
  }

  function restoreGenreOptions() {
    // Ensure genre options remain available based on what the product actually has
    const currentGenre = $genre.val();
    const existingOptions = $genre.find('option').length;
    
    // Only restore if WooCommerce has filtered options
    if (existingOptions < allGenreOptions.length) {
      const selectedValue = $genre.val();
      $genre.empty();
      
      // Restore the original genre options for this product
      allGenreOptions.forEach(function(opt) {
        const $option = $('<option></option>');
        $option.val(opt.value);
        $option.text(opt.text);
        $genre.append($option);
      });
      
      if (selectedValue) {
        $genre.val(selectedValue);
      }
    }
  }

  function getSizeOrder(slug) {
    if (!slug) return 999;
    const s = String(slug).toLowerCase();
    
    // Kids numeric sizes: sort by number
    if (s.startsWith('kids-')) {
      const m = s.match(/^kids-(\d{1,2})$/);
      if (m) return 100 + parseInt(m[1], 10); // 108, 110, 112, 114 ...
      return 199;
    }

    // Adult sizes: normalize synonyms and order XS < S < M < L < XL < XXL/2XL < 3XL/XXXL < 4XL/XXXXL < 5XL/XXXXXL
    const part = s.replace(/^(unisex-|mens-|womens-)/, '');
    const base = { xs: 1, s: 2, m: 3, l: 4, xl: 5 };
    if (base[part] !== undefined) return base[part];
    if (/^(?:xxl|2xl)$/.test(part)) return 6;
    if (/^(?:xxxl|3xl)$/.test(part)) return 7;
    if (/^(?:xxxxl|4xl)$/.test(part)) return 8;
    if (/^(?:xxxxxl|5xl)$/.test(part)) return 9;

    // Unknowns sink to bottom
    return 999;
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
    if (genre.includes('unisex')) {
      prefix = 'unisex-';
    } else if (genre.includes('mens') || genre.includes('men')) {
      prefix = 'mens-';
    } else if (genre.includes('womens') || genre.includes('women')) {
      prefix = 'womens-';
    } else if (genre.includes('kids') || genre.includes('kid')) {
      prefix = 'kids-';
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

    // As a safeguard, ensure consistent ordering after Woo updates
    sortSizeDropdown();
    
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
  
  function enforceOrder() {
    if (!$genre || !$genre.length || !$sizeRow || !$sizeRow.length) return;
    const $genreRow = $genre.closest('tr').length ? $genre.closest('tr') : $genre.closest('div');
    if (!$genreRow.length) return;
    // If size appears before gender, move it after gender
    const sameParent = $genreRow.parent()[0] === $sizeRow.parent()[0];
    if (sameParent) {
      // Only move if size is not already after
      const genreIndex = $genreRow.index();
      const sizeIndex = $sizeRow.index();
      if (sizeIndex < genreIndex || $sizeRow.prev()[0] !== $genreRow[0]) {
        $sizeRow.insertAfter($genreRow);
      }
    } else {
      // Fallback: just insert after genre row
      $sizeRow.insertAfter($genreRow);
    }
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

  // Re-enforce order on repeated init attempts
  setTimeout(enforceOrder, 200);
  setTimeout(enforceOrder, 500);
});
