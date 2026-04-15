// Initialize Flatpickr on all date inputs
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other scripts set attributes first
    setTimeout(function() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        
        dateInputs.forEach(input => {
            // Get existing attributes
            const minDate = input.getAttribute('min');
            const maxDate = input.getAttribute('max');
            const isDisabled = input.hasAttribute('disabled');
            const existingValue = input.value;
            
            // Initialize Flatpickr for ALL inputs
            const fp = flatpickr(input, {
                dateFormat: 'Y-m-d',
                minDate: minDate || null,
                maxDate: maxDate || null,
                defaultDate: existingValue || null,
                allowInput: true,
                clickOpens: !isDisabled,  // Don't allow clicks if disabled
                disableMobile: false,
                onChange: function(selectedDates, dateStr, instance) {
                    // Trigger change event for any existing listeners
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
            });
            
            // Watch for attribute changes (disabled, min, max)
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'disabled') {
                        if (input.hasAttribute('disabled')) {
                            fp.set('clickOpens', false);
                        } else {
                            fp.set('clickOpens', true);
                            // Refresh the calendar when enabled
                            fp.redraw();
                        }
                    } else if (mutation.attributeName === 'min') {
                        fp.set('minDate', input.getAttribute('min'));
                    } else if (mutation.attributeName === 'max') {
                        fp.set('maxDate', input.getAttribute('max'));
                    }
                });
            });
            
            observer.observe(input, {
                attributes: true,
                attributeFilter: ['disabled', 'min', 'max']
            });
        });
    }, 100);
});
