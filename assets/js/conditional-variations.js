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

    // Clear and rebuild size dropdown
    $size.empty().append('<option value="">Choose an option</option>');

    allSizeOptions.forEach(function(opt) {
      if (opt.value === '' || opt.value.toLowerCase().startsWith(prefix)) {
        $size.append($('<option>', {
          value: opt.value,
          text: opt.text
        }));
      }
    });

    // Show size dropdown
    const isTableRow = $sizeRow.is('tr');
    $sizeRow.css('display', isTableRow ? 'table-row' : 'block');
    $size.css('visibility', 'visible');

    setTimeout(function() {
      isUpdating = false;
    }, 50);
  }

  init();
  setTimeout(init, 200);
  setTimeout(init, 500);

  $(document).on('woocommerce_variation_form', function() {
    setTimeout(init, 100);
  });
});